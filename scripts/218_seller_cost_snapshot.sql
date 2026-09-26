-- ============================================================================
-- 218_seller_cost_snapshot.sql
-- 1) register_sale congela el costo al vender (sale_items.cost_price): usa el que
--    manda el cliente o, si no manda, el costo actual del producto. Asi el margen
--    de cada venta queda fijo aunque despues cambie el costo.
-- 2) set_sale_seller: el dueño puede asignar o cambiar el vendedor de una venta.
-- 3) sales_history y sale_detail devuelven tambien employee_id (y el nombre del
--    vendedor en el detalle).
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

      UPDATE products
        SET stock_quantity = GREATEST(0, stock_quantity - (v_item->>'quantity')::int),
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

CREATE OR REPLACE FUNCTION set_sale_seller(p_sale uuid, p_employee uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  s      sales%ROWTYPE;
  v_role text;
BEGIN
  SELECT * INTO s FROM sales WHERE id = p_sale FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Venta inexistente';
  END IF;

  v_role := _assert_kiosko_member(s.kiosko_id);
  IF v_role <> 'owner' THEN
    RAISE EXCEPTION 'Solo el dueño puede cambiar el vendedor de una venta';
  END IF;

  IF p_employee IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM employees WHERE id = p_employee AND kiosko_id = s.kiosko_id
  ) THEN
    RAISE EXCEPTION 'Ese vendedor no pertenece a este kiosko';
  END IF;

  UPDATE sales SET employee_id = p_employee WHERE id = s.id;

  INSERT INTO audit_logs (kiosko_id, user_id, action, entity_type, entity_id, before_data, after_data)
  VALUES (s.kiosko_id, auth.uid(), 'sale.seller_changed', 'sale', s.id,
          jsonb_build_object('employee_id', s.employee_id),
          jsonb_build_object('employee_id', p_employee, 'sale_number', s.sale_number));

  RETURN jsonb_build_object('sale_id', s.id, 'employee_id', p_employee);
END;
$$;

CREATE OR REPLACE FUNCTION sales_history(
  p_kiosko uuid,
  p_from   date DEFAULT NULL,
  p_to     date DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tz   text := 'America/Argentina/Buenos_Aires';
  v_from timestamptz;
  v_to   timestamptz;
  v_res  jsonb;
BEGIN
  PERFORM _assert_kiosko_member(p_kiosko);

  v_from := CASE WHEN p_from IS NULL THEN NULL ELSE p_from::timestamp AT TIME ZONE v_tz END;
  v_to   := CASE WHEN p_to   IS NULL THEN NULL ELSE (p_to + 1)::timestamp AT TIME ZONE v_tz END;

  SELECT COALESCE(jsonb_agg(x ORDER BY (x->>'created_at') DESC), '[]'::jsonb)
    INTO v_res
    FROM (
      SELECT jsonb_build_object(
               'id', s.id,
               'sale_number', s.sale_number,
               'total_amount', s.total_amount,
               'payment_method', s.payment_method,
               'status', COALESCE(s.status, 'completed'),
               'created_at', s.created_at,
               'cancel_reason', s.cancel_reason,
               'cash_register_id', s.cash_register_id,
               'employee_id', s.employee_id,
               'items_count', COALESCE((SELECT SUM(si.quantity) FROM sale_items si WHERE si.sale_id = s.id), 0)
             ) AS x
        FROM sales s
       WHERE s.kiosko_id = p_kiosko
         AND (v_from IS NULL OR s.created_at >= v_from)
         AND (v_to   IS NULL OR s.created_at <  v_to)
       ORDER BY s.created_at DESC
       LIMIT 1000
    ) q;

  RETURN v_res;
END;
$$;

CREATE OR REPLACE FUNCTION sale_detail(p_sale uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  s     sales%ROWTYPE;
  v_reg text;
  v_seller text;
BEGIN
  SELECT * INTO s FROM sales WHERE id = p_sale;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Venta inexistente';
  END IF;

  PERFORM _assert_kiosko_member(s.kiosko_id);

  SELECT status INTO v_reg FROM cash_registers WHERE id = s.cash_register_id;
  SELECT name INTO v_seller FROM employees WHERE id = s.employee_id;

  RETURN jsonb_build_object(
    'id', s.id,
    'sale_number', s.sale_number,
    'total_amount', s.total_amount,
    'payment_method', s.payment_method,
    'status', COALESCE(s.status, 'completed'),
    'created_at', s.created_at,
    'cancel_reason', s.cancel_reason,
    'cancelled_at', s.cancelled_at,
    'employee_id', s.employee_id,
    'seller_name', v_seller,
    'register_open', COALESCE(v_reg = 'open', false),
    'items', COALESCE((
      SELECT jsonb_agg(
               jsonb_build_object(
                 'product_id', si.product_id,
                 'name', COALESCE(NULLIF(si.product_name, ''), p.name, 'Producto'),
                 'quantity', si.quantity,
                 'unit_price', si.unit_price,
                 'subtotal', si.subtotal
               )
               ORDER BY si.created_at, si.id
             )
        FROM sale_items si
        LEFT JOIN products p ON p.id = si.product_id
       WHERE si.sale_id = s.id
    ), '[]'::jsonb)
  );
END;
$$;

REVOKE ALL ON FUNCTION register_sale(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION register_sale(jsonb) TO authenticated, service_role;
REVOKE ALL ON FUNCTION set_sale_seller(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION set_sale_seller(uuid, uuid) TO authenticated, service_role;
REVOKE ALL ON FUNCTION sales_history(uuid, date, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION sales_history(uuid, date, date) TO authenticated, service_role;
REVOKE ALL ON FUNCTION sale_detail(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION sale_detail(uuid) TO authenticated, service_role;
