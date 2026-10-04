-- ============================================================================
-- 228_allow_negative_stock.sql
-- Hasta ahora register_sale frenaba el stock en 0 (GREATEST(0, ...)) al vender.
-- Combinado con que el frontend bloqueaba la venta cuando el stock mostrado era
-- 0, un producto que se agotaba en el sistema (aunque hubiera más en el local)
-- directamente no se podía cobrar. Pasó de verdad: la madrugada del jueves
-- 2026-10-01 en el cliente de Atlas One, varios productos no se pudieron
-- cobrar por esto. El frontend ya deja de bloquear (ver ventas/page.tsx,
-- product-grid.tsx, cart.tsx); este script hace lo mismo del lado de la base,
-- para que el número de verdad quede en negativo en vez de pegado en 0 — así
-- se ve cuánto se vendió de más y hay que ajustar en el próximo conteo.
--
-- Reversion: volver a aplicar el script 218 completo (que tiene el
-- GREATEST(0, ...) original) restaura el comportamiento anterior.
-- ============================================================================

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

      -- Sin GREATEST: el stock puede quedar en negativo a propósito (ver
      -- encabezado). Antes esto se frenaba en 0, lo que escondía cuánto se
      -- vendió de más respecto a lo que el sistema tenía cargado.
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

REVOKE ALL ON FUNCTION register_sale(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION register_sale(jsonb) TO authenticated, service_role;
