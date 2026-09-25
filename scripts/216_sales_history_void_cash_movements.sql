-- ============================================================================
-- 216_sales_history_void_cash_movements.sql
-- 1) Movimientos de caja: cash_register_transactions.type solo aceptaba
--    sale/expense/withdrawal/deposit, asi que cualquier otro tipo (pago a
--    proveedor, adelanto, retiro del dueño, cambio, etc.) fallaba para todos.
--    Se quita ese CHECK y se agrega add_cash_movement (SECURITY DEFINER, sirve
--    para dueño y empleados activos del kiosko).
-- 2) Historial de ventas: sales_history (filtro por rango de fechas en hora
--    Argentina) y sale_detail (items de una venta) sin depender del RLS.
-- 3) void_sale: anula una venta equivocada (status cancelled), devuelve el stock
--    con movimientos 'in' y deja registro en audit_logs. Un empleado solo puede
--    anular ventas de la caja que sigue abierta; el dueño, cualquiera.
-- Reversion: DROP de las funciones; el CHECK viejo no hace falta restaurarlo.
-- ============================================================================

ALTER TABLE sales
  ADD COLUMN IF NOT EXISTS cancelled_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancelled_by  UUID,
  ADD COLUMN IF NOT EXISTS cancel_reason TEXT;

DO $$
DECLARE
  c record;
BEGIN
  FOR c IN
    SELECT conname
      FROM pg_constraint
     WHERE conrelid = 'public.cash_register_transactions'::regclass
       AND contype = 'c'
       AND pg_get_constraintdef(oid) ILIKE '%type%'
  LOOP
    EXECUTE format('ALTER TABLE public.cash_register_transactions DROP CONSTRAINT %I', c.conname);
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION add_cash_movement(
  p_register  uuid,
  p_type      text,
  p_direction text,
  p_amount    numeric,
  p_notes     text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r     cash_registers%ROWTYPE;
  v_id  uuid;
BEGIN
  SELECT * INTO r FROM cash_registers WHERE id = p_register;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Caja inexistente';
  END IF;

  PERFORM _assert_kiosko_member(r.kiosko_id);

  IF r.status <> 'open' THEN
    RAISE EXCEPTION 'La caja está cerrada: abrila para cargar movimientos';
  END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'El monto tiene que ser mayor a cero';
  END IF;
  IF p_direction NOT IN ('in', 'out') THEN
    RAISE EXCEPTION 'Dirección de movimiento inválida';
  END IF;

  INSERT INTO cash_register_transactions (cash_register_id, type, direction, amount, payment_method, notes, created_by)
  VALUES (r.id, COALESCE(NULLIF(p_type, ''), 'expense'), p_direction, p_amount, 'cash', NULLIF(p_notes, ''), auth.uid())
  RETURNING id INTO v_id;

  INSERT INTO audit_logs (kiosko_id, user_id, action, entity_type, entity_id, after_data)
  VALUES (r.kiosko_id, auth.uid(), 'cash.movement', 'cash_register', r.id,
          jsonb_build_object('type', p_type, 'direction', p_direction, 'amount', p_amount, 'notes', p_notes));

  RETURN jsonb_build_object('transaction_id', v_id);
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
BEGIN
  SELECT * INTO s FROM sales WHERE id = p_sale;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Venta inexistente';
  END IF;

  PERFORM _assert_kiosko_member(s.kiosko_id);

  SELECT status INTO v_reg FROM cash_registers WHERE id = s.cash_register_id;

  RETURN jsonb_build_object(
    'id', s.id,
    'sale_number', s.sale_number,
    'total_amount', s.total_amount,
    'payment_method', s.payment_method,
    'status', COALESCE(s.status, 'completed'),
    'created_at', s.created_at,
    'cancel_reason', s.cancel_reason,
    'cancelled_at', s.cancelled_at,
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

CREATE OR REPLACE FUNCTION void_sale(p_sale uuid, p_reason text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  s       sales%ROWTYPE;
  v_role  text;
  v_reg   text;
  v_item  record;
BEGIN
  SELECT * INTO s FROM sales WHERE id = p_sale FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Venta inexistente';
  END IF;

  v_role := _assert_kiosko_member(s.kiosko_id);

  IF COALESCE(s.status, 'completed') = 'cancelled' THEN
    RETURN jsonb_build_object('sale_id', s.id, 'voided', false, 'already_voided', true);
  END IF;

  IF v_role <> 'owner' THEN
    SELECT status INTO v_reg FROM cash_registers WHERE id = s.cash_register_id;
    IF v_reg IS DISTINCT FROM 'open' THEN
      RAISE EXCEPTION 'Esta venta es de una caja ya cerrada: solo el dueño puede anularla';
    END IF;
  END IF;

  FOR v_item IN SELECT product_id, quantity FROM sale_items WHERE sale_id = s.id
  LOOP
    UPDATE products
       SET stock_quantity = stock_quantity + v_item.quantity,
           updated_at = now()
     WHERE id = v_item.product_id
       AND kiosko_id = s.kiosko_id;

    INSERT INTO stock_movements (product_id, kiosko_id, movement_type, quantity, reason, reference_id)
    VALUES (v_item.product_id, s.kiosko_id, 'in', v_item.quantity,
            'anulación venta ' || s.sale_number, s.id);
  END LOOP;

  UPDATE sales
     SET status = 'cancelled',
         cancelled_at = now(),
         cancelled_by = auth.uid(),
         cancel_reason = NULLIF(p_reason, '')
   WHERE id = s.id;

  INSERT INTO audit_logs (kiosko_id, user_id, action, entity_type, entity_id, before_data, after_data)
  VALUES (s.kiosko_id, auth.uid(), 'sale.voided', 'sale', s.id,
          jsonb_build_object('status', COALESCE(s.status, 'completed'), 'total_amount', s.total_amount),
          jsonb_build_object('status', 'cancelled', 'reason', p_reason, 'sale_number', s.sale_number));

  RETURN jsonb_build_object('sale_id', s.id, 'voided', true, 'already_voided', false);
END;
$$;

REVOKE ALL ON FUNCTION add_cash_movement(uuid, text, text, numeric, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION sales_history(uuid, date, date) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION sale_detail(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION void_sale(uuid, text) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION add_cash_movement(uuid, text, text, numeric, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION sales_history(uuid, date, date) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION sale_detail(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION void_sale(uuid, text) TO authenticated, service_role;
