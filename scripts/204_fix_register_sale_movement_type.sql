-- ============================================================================
-- 204_fix_register_sale_movement_type.sql
-- Atlas ONE - Fix: register_sale insertaba movement_type = 'salida', que
-- viola stock_movements_movement_type_check (solo admite 'in' | 'out' |
-- 'adjustment', ver 000_complete_schema.sql). Esto hacía fallar TODA venta
-- online con: "new row for relation stock_movements violates check
-- constraint stock_movements_movement_type_check".
--
-- Re-crea register_sale (definida en 128_atomic_sale_sync.sql) idéntica,
-- cambiando únicamente 'salida' -> 'out'.
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
BEGIN
  IF v_kiosko IS NULL OR (p_sale->>'sale_number') IS NULL THEN
    RAISE EXCEPTION 'register_sale: kiosko_id y sale_number son obligatorios';
  END IF;

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
        NULLIF(v_item->>'cost_price', '')::numeric,
        (v_item->>'unit_price')::numeric * (v_item->>'quantity')::int
      );

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
        'out',
        (v_item->>'quantity')::int,
        'venta ' || (p_sale->>'sale_number'),
        v_sale_id
      );
    END LOOP;
  ELSE
    SELECT id INTO v_sale_id
      FROM sales
     WHERE kiosko_id = v_kiosko
       AND sale_number = p_sale->>'sale_number';
  END IF;

  RETURN jsonb_build_object('sale_id', v_sale_id, 'created', v_created);
END;
$$;

GRANT EXECUTE ON FUNCTION register_sale(jsonb) TO anon, authenticated, service_role;
