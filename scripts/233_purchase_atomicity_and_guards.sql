-- ============================================================================
-- 233_purchase_atomicity_and_guards.sql
-- Hallazgos de la Fase 2 (auditoría adversarial) que se decidió arreglar:
--
-- 1) register_sale no chequeaba is_active: se podía vender un producto
--    desactivado si algo llamaba a la función directo, salteando la pantalla.
-- 2) Compras (components/purchases/purchase-modal-new.tsx) grababa la compra,
--    los items y el movimiento de stock en 3+ llamadas de red separadas, sin
--    ninguna transacción en común — igual al problema que ya se había
--    resuelto para Recepción de Mercadería con confirm_receipt. Si la
--    conexión se cortaba a mitad, podía quedar una compra con items pero sin
--    stock movido. register_purchase() hace todo en una sola función
--    atómica, como confirm_receipt.
-- 3) adjust_stock no tenía protección contra un reintento duplicado (llamar
--    dos veces la misma operación por error de red). Ahora acepta una clave
--    de idempotencia opcional.
-- 4) stock_movements no tenía índice por kiosko_id/fecha: el reporte de
--    movimientos (app/dashboard/stock/page.tsx) filtra y ordena por eso.
--
-- Reversion:
--   DROP FUNCTION register_purchase(jsonb);
--   ALTER TABLE purchases DROP CONSTRAINT IF EXISTS purchases_kiosko_number_unique;
--   DROP INDEX IF EXISTS idx_stock_movements_kiosko_created;
--   las columnas nuevas y el chequeo de is_active quedan (son aditivos/mejoras
--   de seguridad, no haría falta deshacerlos nunca).
-- ============================================================================

-- 1) Índice para el reporte de movimientos por kiosko/fecha.
CREATE INDEX IF NOT EXISTS idx_stock_movements_kiosko_created
  ON stock_movements (kiosko_id, created_at DESC);

-- 2) Clave de idempotencia opcional en stock_movements, para adjust_stock.
ALTER TABLE stock_movements ADD COLUMN IF NOT EXISTS idempotency_key TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS stock_movements_idempotency_key_uq
  ON stock_movements (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- 3) Evita compras duplicadas por reintento, y es la base de register_purchase.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'purchases_kiosko_number_unique'
  ) THEN
    ALTER TABLE purchases
      ADD CONSTRAINT purchases_kiosko_number_unique UNIQUE (kiosko_id, purchase_number);
  END IF;
END $$;

-- 4) adjust_stock con clave de idempotencia opcional: si se manda y ya se
--    usó, devuelve el resultado anterior en vez de aplicar el delta de nuevo.
-- Postgres identifica una función por nombre + tipos de parámetros: agregar
-- un parámetro nuevo no "reemplaza" la versión vieja, crea una función
-- superpuesta aparte. Hay que borrar la firma anterior explícitamente.
DROP FUNCTION IF EXISTS adjust_stock(uuid, uuid, integer, text, text, uuid);

CREATE OR REPLACE FUNCTION adjust_stock(
  p_kiosko          uuid,
  p_product         uuid,
  p_delta           integer,
  p_movement_type   text,
  p_reason          text DEFAULT NULL,
  p_reference_id    uuid DEFAULT NULL,
  p_idempotency_key text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role     text;
  v_before   integer;
  v_after    integer;
  v_existing stock_movements%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Sesión no válida';
  END IF;

  IF p_idempotency_key IS NOT NULL THEN
    SELECT * INTO v_existing FROM stock_movements WHERE idempotency_key = p_idempotency_key;
    IF FOUND THEN
      RETURN jsonb_build_object('already_applied', true, 'stock_after', NULL);
    END IF;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM kioscos
    WHERE id = p_kiosko
      AND owner_id = auth.uid()
  ) THEN
    v_role := 'owner';
  ELSIF EXISTS (
    SELECT 1
    FROM employees e
    WHERE e.kiosko_id = p_kiosko
      AND e.user_id = auth.uid()
      AND e.status = 'active'
      AND (e.permissions->>'can_stock_entry') = 'true'
  ) THEN
    v_role := 'employee';
  ELSE
    RAISE EXCEPTION 'No tenés permiso para ajustar stock en este kiosko';
  END IF;

  IF p_movement_type NOT IN ('in', 'out', 'adjustment') THEN
    RAISE EXCEPTION 'movement_type inválido: %', p_movement_type;
  END IF;

  UPDATE products
     SET stock_quantity = stock_quantity + p_delta,
         updated_at     = now()
   WHERE id = p_product AND kiosko_id = p_kiosko
  RETURNING stock_quantity - p_delta, stock_quantity INTO v_before, v_after;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Producto inexistente en este kiosko';
  END IF;

  INSERT INTO stock_movements (
    product_id, kiosko_id, movement_type, quantity, reason, reference_id, created_by, idempotency_key
  )
  VALUES (p_product, p_kiosko, p_movement_type, abs(p_delta), p_reason, p_reference_id, auth.uid(), p_idempotency_key);

  RETURN jsonb_build_object('stock_before', v_before, 'stock_after', v_after, 'role', v_role, 'already_applied', false);
END;
$$;

-- 5) register_sale con el chequeo de is_active agregado (resto sin cambios
--    respecto a scripts/228_allow_negative_stock.sql).
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
  v_offline     boolean     := (p_sale->>'created_at') IS NOT NULL;
  v_reg         uuid        := NULLIF(p_sale->>'cash_register_id', '')::uuid;
BEGIN
  IF v_kiosko IS NULL OR (p_sale->>'sale_number') IS NULL THEN
    RAISE EXCEPTION 'register_sale: kiosko_id y sale_number son obligatorios';
  END IF;

  PERFORM _assert_kiosko_member(v_kiosko);

  SELECT id INTO v_sale_id
    FROM sales
   WHERE kiosko_id = v_kiosko AND sale_number = p_sale->>'sale_number';

  IF v_sale_id IS NOT NULL THEN
    RETURN jsonb_build_object('sale_id', v_sale_id, 'created', false);
  END IF;

  IF v_reg IS NOT NULL THEN
    SELECT id INTO v_reg
      FROM cash_registers
     WHERE id = v_reg
       AND kiosko_id = v_kiosko
       AND (
         status = 'open'
         OR (v_offline AND opened_at <= v_created_at AND (closed_at IS NULL OR closed_at >= v_created_at))
       );
  END IF;

  IF v_reg IS NULL AND NOT v_offline THEN
    SELECT id INTO v_reg
      FROM cash_registers
     WHERE kiosko_id = v_kiosko AND status = 'open'
     ORDER BY opened_at DESC
     LIMIT 1;
  END IF;

  IF v_reg IS NULL AND v_offline THEN
    SELECT id INTO v_reg
      FROM cash_registers
     WHERE kiosko_id = v_kiosko
       AND opened_at <= v_created_at
       AND (closed_at IS NULL OR closed_at >= v_created_at)
     ORDER BY opened_at DESC
     LIMIT 1;
  END IF;

  IF v_reg IS NULL THEN
    RAISE EXCEPTION 'No hay una caja abierta: abrí la caja para registrar ventas';
  END IF;

  INSERT INTO sales (
    kiosko_id, employee_id, sale_number, total_amount, payment_method, status, created_at, cash_register_id
  )
  VALUES (
    v_kiosko,
    NULLIF(p_sale->>'employee_id', '')::uuid,
    p_sale->>'sale_number',
    (p_sale->>'total_amount')::numeric,
    p_sale->>'payment_method',
    'completed',
    v_created_at,
    v_reg
  )
  ON CONFLICT (kiosko_id, sale_number) DO NOTHING
  RETURNING id INTO v_sale_id;

  IF v_sale_id IS NOT NULL THEN
    v_created := true;

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_sale->'items')
    LOOP
      IF NOT EXISTS (
        SELECT 1 FROM products
         WHERE id = (v_item->>'product_id')::uuid
           AND kiosko_id = v_kiosko
           AND is_active = true
      ) THEN
        RAISE EXCEPTION 'Producto no disponible para la venta: %', v_item->>'product_name';
      END IF;

      INSERT INTO sale_items (
        sale_id, product_id, product_name, quantity, unit_price, cost_price, subtotal
      )
      VALUES (
        v_sale_id,
        (v_item->>'product_id')::uuid,
        v_item->>'product_name',
        (v_item->>'quantity')::int,
        (v_item->>'unit_price')::numeric,
        COALESCE(
          NULLIF(v_item->>'cost_price', '')::numeric,
          (SELECT NULLIF(p.cost, 0) FROM products p
            WHERE p.id = (v_item->>'product_id')::uuid AND p.kiosko_id = v_kiosko)
        ),
        (v_item->>'unit_price')::numeric * (v_item->>'quantity')::int
      );

      UPDATE products
        SET stock_quantity = stock_quantity - (v_item->>'quantity')::int,
            updated_at      = now()
        WHERE id = (v_item->>'product_id')::uuid
          AND kiosko_id = v_kiosko;

      INSERT INTO stock_movements (
        product_id, kiosko_id, movement_type, quantity, reason, reference_id
      )
      VALUES (
        (v_item->>'product_id')::uuid,
        v_kiosko,
        'out',
        (v_item->>'quantity')::int,
        'venta ' || (p_sale->>'sale_number'),
        v_sale_id
      );
    END LOOP;
  ELSE
    SELECT id INTO v_sale_id
      FROM sales
     WHERE kiosko_id = v_kiosko AND sale_number = p_sale->>'sale_number';
  END IF;

  RETURN jsonb_build_object('sale_id', v_sale_id, 'created', v_created);
END;
$$;

-- 6) register_purchase: compra + items + stock, todo en una transacción.
CREATE OR REPLACE FUNCTION register_purchase(p_purchase jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_purchase_id uuid;
  v_created     boolean := false;
  v_kiosko      uuid := (p_purchase->>'kiosko_id')::uuid;
  v_item        jsonb;
  v_before      integer;
  v_after       integer;
BEGIN
  IF v_kiosko IS NULL OR (p_purchase->>'purchase_number') IS NULL THEN
    RAISE EXCEPTION 'register_purchase: kiosko_id y purchase_number son obligatorios';
  END IF;

  PERFORM _assert_can_receive(v_kiosko);

  IF COALESCE(jsonb_array_length(p_purchase->'items'), 0) = 0 THEN
    RAISE EXCEPTION 'La compra debe tener al menos un producto';
  END IF;

  INSERT INTO purchases (kiosko_id, supplier_name, purchase_number, total_amount, status, notes)
  VALUES (
    v_kiosko,
    p_purchase->>'supplier_name',
    p_purchase->>'purchase_number',
    (p_purchase->>'total_amount')::numeric,
    'completed',
    NULLIF(p_purchase->>'notes', '')
  )
  ON CONFLICT (kiosko_id, purchase_number) DO NOTHING
  RETURNING id INTO v_purchase_id;

  IF v_purchase_id IS NOT NULL THEN
    v_created := true;

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_purchase->'items')
    LOOP
      INSERT INTO purchase_items (purchase_id, product_id, quantity, unit_cost, subtotal)
      VALUES (
        v_purchase_id,
        (v_item->>'product_id')::uuid,
        (v_item->>'quantity')::int,
        (v_item->>'unit_cost')::numeric,
        (v_item->>'quantity')::int * (v_item->>'unit_cost')::numeric
      );

      UPDATE products
         SET stock_quantity = stock_quantity + (v_item->>'quantity')::int,
             cost           = (v_item->>'unit_cost')::numeric,
             updated_at     = now()
       WHERE id = (v_item->>'product_id')::uuid AND kiosko_id = v_kiosko
      RETURNING stock_quantity - (v_item->>'quantity')::int, stock_quantity INTO v_before, v_after;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'Producto inexistente en este kiosko';
      END IF;

      INSERT INTO stock_movements (product_id, kiosko_id, movement_type, quantity, reason, reference_id, created_by)
      VALUES (
        (v_item->>'product_id')::uuid, v_kiosko, 'in', (v_item->>'quantity')::int,
        'Compra ' || (p_purchase->>'purchase_number') || ' - ' || (p_purchase->>'supplier_name'),
        v_purchase_id, auth.uid()
      );
    END LOOP;
  ELSE
    SELECT id INTO v_purchase_id
      FROM purchases
     WHERE kiosko_id = v_kiosko AND purchase_number = p_purchase->>'purchase_number';
  END IF;

  RETURN jsonb_build_object('purchase_id', v_purchase_id, 'created', v_created);
END;
$$;

REVOKE ALL ON FUNCTION adjust_stock(uuid, uuid, integer, text, text, uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION adjust_stock(uuid, uuid, integer, text, text, uuid, text) TO authenticated, service_role;
REVOKE ALL ON FUNCTION register_sale(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION register_sale(jsonb) TO authenticated, service_role;
REVOKE ALL ON FUNCTION register_purchase(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION register_purchase(jsonb) TO authenticated, service_role;
