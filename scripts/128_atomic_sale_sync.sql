-- ============================================================================
-- 128_atomic_sale_sync.sql
-- Atlas ONE - Sincronización atómica de ventas POS (Fase 2, issue #5)
--
-- Objetivo: garantizar que una venta (cabecera + items + descuento de stock +
-- movimiento de inventario) se registre de forma ATÓMICA y sea IDEMPOTENTE,
-- preservando el PRECIO HISTÓRICO del producto (el precio y costo al momento
-- de la venta, no el precio actual).
--
-- La atomicidad no puede garantizarse desde el cliente (múltiples llamadas REST
-- independientes pueden fallar a mitad). Se resuelve con una única función
-- transaccional en Postgres, que los tres caminos usan por igual:
--   - POS online (app/dashboard/ventas/page.tsx)
--   - Cola offline legacy (lib/offline/sales-queue.ts)
--   - Sync Manager IndexedDB (lib/offline/sync-manager.ts)
-- ============================================================================

-- 1) Columnas para preservar el precio/costo histórico y el nombre denormalizado
--    en cada item (para tickets/facturas y cálculo de margen histórico).
ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS product_name TEXT;
ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS cost_price NUMERIC;

-- 2) Ancla de idempotencia: una venta se identifica de forma única por
--    (kiosko_id, sale_number). Reintentos de sync no crean duplicados.
--    NOTA: si existieran duplicados previos, deduplicarlos antes de correr esto.
CREATE UNIQUE INDEX IF NOT EXISTS sales_kiosko_sale_number_uidx
  ON sales (kiosko_id, sale_number);

-- 3) Función transaccional. El cuerpo completo corre en una sola transacción:
--    si cualquier paso falla, se revierte TODO (all-or-nothing).
CREATE OR REPLACE FUNCTION register_sale(p_sale jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sale_id     uuid;
  v_created     boolean := false;
  v_item        jsonb;
  v_kiosko      uuid        := (p_sale->>'kiosko_id')::uuid;
  v_created_at  timestamptz := COALESCE((p_sale->>'created_at')::timestamptz, now());
BEGIN
  IF v_kiosko IS NULL OR (p_sale->>'sale_number') IS NULL THEN
    RAISE EXCEPTION 'register_sale: kiosko_id y sale_number son obligatorios';
  END IF;

  -- Inserción idempotente de la cabecera. Si ya existía (re-sync), no hace nada.
  INSERT INTO sales (
    kiosko_id, employee_id, sale_number, total_amount, payment_method, status, created_at
  )
  VALUES (
    v_kiosko,
    NULLIF(p_sale->>'employee_id', '')::uuid,
    p_sale->>'sale_number',
    (p_sale->>'total_amount')::numeric,
    p_sale->>'payment_method',
    'completed',
    v_created_at
  )
  ON CONFLICT (kiosko_id, sale_number) DO NOTHING
  RETURNING id INTO v_sale_id;

  IF v_sale_id IS NOT NULL THEN
    -- Venta nueva: registrar items, descontar stock y movimiento de inventario.
    v_created := true;

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_sale->'items')
    LOOP
      INSERT INTO sale_items (
        sale_id, product_id, product_name, quantity, unit_price, cost_price, subtotal
      )
      VALUES (
        v_sale_id,
        (v_item->>'product_id')::uuid,
        v_item->>'product_name',
        (v_item->>'quantity')::int,
        (v_item->>'unit_price')::numeric,                 -- PRECIO HISTÓRICO (del payload)
        NULLIF(v_item->>'cost_price', '')::numeric,       -- COSTO HISTÓRICO (del payload)
        (v_item->>'unit_price')::numeric * (v_item->>'quantity')::int
      );

      -- Descuento de stock ATÓMICO: no hay read-then-write, así que no hay
      -- lost-update entre cajas concurrentes.
      UPDATE products
        SET stock_quantity = GREATEST(0, stock_quantity - (v_item->>'quantity')::int),
            updated_at      = now()
        WHERE id = (v_item->>'product_id')::uuid;

      INSERT INTO stock_movements (
        product_id, kiosko_id, movement_type, quantity, reason, reference_id
      )
      VALUES (
        (v_item->>'product_id')::uuid,
        v_kiosko,
        'salida',
        (v_item->>'quantity')::int,
        'venta ' || (p_sale->>'sale_number'),
        v_sale_id
      );
    END LOOP;
  ELSE
    -- Ya sincronizada: recuperar el id existente (no-op idempotente).
    SELECT id INTO v_sale_id
      FROM sales
     WHERE kiosko_id = v_kiosko
       AND sale_number = p_sale->>'sale_number';
  END IF;

  RETURN jsonb_build_object('sale_id', v_sale_id, 'created', v_created);
END;
$$;

GRANT EXECUTE ON FUNCTION register_sale(jsonb) TO anon, authenticated, service_role;

COMMENT ON FUNCTION register_sale(jsonb) IS
  'Registra una venta POS de forma atómica e idempotente (issue #5). '
  'Preserva precio/costo histórico tomados del payload. '
  'Idempotente por (kiosko_id, sale_number).';
