-- ============================================================================
-- 209_receipt_confirmation.sql
-- Atlas ONE - Recepcion de mercaderia MVP-1 (spec "Recepcion de Mercaderia +
-- Facturas de Proveedores" v1.0): borrador -> confirmar, stock solo al
-- confirmar, movimientos auditables, anulacion por reversion, auditoria.
--
-- Reemplaza el guardado directo de la pantalla, que sumaba stock leyendo y
-- escribiendo desde el cliente (perdia actualizaciones, se duplicaba con un
-- doble clic) y cuyo movimiento nunca quedaba registrado: usaba
-- movement_type 'receipt' (no permitido por la CHECK de stock_movements) y
-- created_by con un id de empleado (la columna referencia auth.users).
--
-- Todas las escrituras van por funciones SECURITY DEFINER que validan quien
-- es el usuario (auth.uid()) contra el kiosko. Las recepciones anteriores
-- (status 'received') se consideran confirmadas: su stock ya se sumo.
-- ============================================================================

-- 1) Columnas nuevas y estados -----------------------------------------------
ALTER TABLE merchandise_receipts
  ADD COLUMN IF NOT EXISTS confirmed_at            TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS confirmed_by            UUID,
  ADD COLUMN IF NOT EXISTS confirm_idempotency_key TEXT,
  ADD COLUMN IF NOT EXISTS cancelled_at            TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancelled_by            UUID,
  ADD COLUMN IF NOT EXISTS cancel_reason           TEXT;

ALTER TABLE merchandise_receipts DROP CONSTRAINT IF EXISTS merchandise_receipts_status_check;
ALTER TABLE merchandise_receipts
  ADD CONSTRAINT merchandise_receipts_status_check
  CHECK (status IN ('draft', 'confirmed', 'received', 'verified', 'discrepancy', 'cancelled'));

-- 2) Auditoria -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kiosko_id    UUID REFERENCES kioscos(id) ON DELETE CASCADE,
  user_id      UUID,
  action       TEXT NOT NULL,
  entity_type  TEXT NOT NULL,
  entity_id    UUID,
  before_data  JSONB,
  after_data   JSONB,
  source       TEXT NOT NULL DEFAULT 'UI',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_logs_kiosko_created_idx ON audit_logs (kiosko_id, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_entity_idx ON audit_logs (entity_type, entity_id);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "audit_logs_select_owner" ON audit_logs;
CREATE POLICY "audit_logs_select_owner" ON audit_logs FOR SELECT TO authenticated
  USING (kiosko_id IN (SELECT id FROM kioscos WHERE owner_id = auth.uid()));
GRANT SELECT ON TABLE public.audit_logs TO authenticated;
GRANT ALL PRIVILEGES ON TABLE public.audit_logs TO service_role;

-- 3) El dueño tambien debe poder leer sus recepciones (las policies originales
--    solo contemplaban empleados) ------------------------------------------------
DROP POLICY IF EXISTS "Owners can view merchandise receipts" ON merchandise_receipts;
CREATE POLICY "Owners can view merchandise receipts" ON merchandise_receipts FOR SELECT
  USING (kiosko_id IN (SELECT id FROM kioscos WHERE owner_id = auth.uid()));

DROP POLICY IF EXISTS "Owners can view merchandise receipt items" ON merchandise_receipt_items;
CREATE POLICY "Owners can view merchandise receipt items" ON merchandise_receipt_items FOR SELECT
  USING (receipt_id IN (
    SELECT id FROM merchandise_receipts
    WHERE kiosko_id IN (SELECT id FROM kioscos WHERE owner_id = auth.uid())
  ));

GRANT SELECT ON TABLE public.merchandise_receipts TO authenticated;
GRANT SELECT ON TABLE public.merchandise_receipt_items TO authenticated;

-- 4) Autorizacion -----------------------------------------------------------------
-- Dueño del kiosko: siempre. Empleado activo: necesita los permisos
-- 'Recibir mercadería' e 'Ingresar mercadería a stock' (los mismos que exige
-- la pantalla).
CREATE OR REPLACE FUNCTION _assert_can_receive(p_kiosko uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Sesión no válida';
  END IF;

  IF EXISTS (SELECT 1 FROM kioscos WHERE id = p_kiosko AND owner_id = auth.uid()) THEN
    RETURN 'owner';
  END IF;

  IF EXISTS (
    SELECT 1 FROM employees e
    WHERE e.kiosko_id = p_kiosko
      AND e.user_id = auth.uid()
      AND e.status = 'active'
      AND (e.permissions->>'can_receive_merchandise') = 'true'
      AND (e.permissions->>'can_stock_entry') = 'true'
  ) THEN
    RETURN 'employee';
  END IF;

  RAISE EXCEPTION 'No tenés permiso para recibir mercadería en este kiosko';
END;
$$;

-- 5) Guardar borrador (crea o actualiza; no toca stock) ------------------------
CREATE OR REPLACE FUNCTION save_receipt_draft(p_receipt jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_kiosko  uuid := (p_receipt->>'kiosko_id')::uuid;
  v_id      uuid := NULLIF(p_receipt->>'receipt_id', '')::uuid;
  v_status  text;
  v_total   numeric;
  v_item    jsonb;
BEGIN
  PERFORM _assert_can_receive(v_kiosko);

  IF COALESCE(jsonb_array_length(p_receipt->'items'), 0) = 0 THEN
    RAISE EXCEPTION 'La recepción debe tener al menos un producto';
  END IF;

  SELECT COALESCE(SUM((i->>'quantity')::numeric * COALESCE((i->>'unit_cost')::numeric, 0)), 0)
    INTO v_total
    FROM jsonb_array_elements(p_receipt->'items') i;

  IF v_id IS NULL THEN
    INSERT INTO merchandise_receipts (
      kiosko_id, receipt_number, receipt_date, supplier_name, supplier_contact,
      receipt_photo_url, received_by_employee_id, received_by_name,
      total_amount, notes, status
    )
    VALUES (
      v_kiosko,
      p_receipt->>'receipt_number',
      (p_receipt->>'receipt_date')::date,
      p_receipt->>'supplier_name',
      NULLIF(p_receipt->>'supplier_contact', ''),
      NULLIF(p_receipt->>'receipt_photo_url', ''),
      NULLIF(p_receipt->>'received_by_employee_id', '')::uuid,
      COALESCE(NULLIF(p_receipt->>'received_by_name', ''), 'Sin nombre'),
      v_total,
      NULLIF(p_receipt->>'notes', ''),
      'draft'
    )
    RETURNING id INTO v_id;

    INSERT INTO audit_logs (kiosko_id, user_id, action, entity_type, entity_id, after_data)
    VALUES (v_kiosko, auth.uid(), 'receipt.draft_created', 'merchandise_receipt', v_id,
            jsonb_build_object('receipt_number', p_receipt->>'receipt_number',
                               'supplier_name', p_receipt->>'supplier_name',
                               'total_amount', v_total));
  ELSE
    SELECT status INTO v_status
      FROM merchandise_receipts
     WHERE id = v_id AND kiosko_id = v_kiosko
     FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Recepción inexistente';
    END IF;
    IF v_status <> 'draft' THEN
      RAISE EXCEPTION 'Solo se pueden editar recepciones en borrador';
    END IF;

    UPDATE merchandise_receipts
       SET receipt_number   = p_receipt->>'receipt_number',
           receipt_date     = (p_receipt->>'receipt_date')::date,
           supplier_name    = p_receipt->>'supplier_name',
           supplier_contact = NULLIF(p_receipt->>'supplier_contact', ''),
           receipt_photo_url = NULLIF(p_receipt->>'receipt_photo_url', ''),
           total_amount     = v_total,
           notes            = NULLIF(p_receipt->>'notes', ''),
           updated_at       = now()
     WHERE id = v_id;

    DELETE FROM merchandise_receipt_items WHERE receipt_id = v_id;

    INSERT INTO audit_logs (kiosko_id, user_id, action, entity_type, entity_id, after_data)
    VALUES (v_kiosko, auth.uid(), 'receipt.draft_updated', 'merchandise_receipt', v_id,
            jsonb_build_object('total_amount', v_total));
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_receipt->'items')
  LOOP
    INSERT INTO merchandise_receipt_items (
      receipt_id, product_id, product_name, quantity, unit_cost, subtotal
    )
    VALUES (
      v_id,
      (v_item->>'product_id')::uuid,
      v_item->>'product_name',
      (v_item->>'quantity')::int,
      COALESCE((v_item->>'unit_cost')::numeric, 0),
      (v_item->>'quantity')::numeric * COALESCE((v_item->>'unit_cost')::numeric, 0)
    );
  END LOOP;

  RETURN jsonb_build_object('receipt_id', v_id, 'total_amount', v_total);
END;
$$;

-- 6) Confirmar (atomico e idempotente): recien aca se suma stock ---------------
CREATE OR REPLACE FUNCTION confirm_receipt(p_receipt_id uuid, p_idempotency_key text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r         merchandise_receipts%ROWTYPE;
  it        record;
  v_before  integer;
  v_after   integer;
  v_lines   jsonb := '[]'::jsonb;
BEGIN
  -- El lock de fila serializa dos confirmaciones simultaneas (doble clic,
  -- reintento de red o dos usuarios): la segunda ve el estado ya confirmado.
  SELECT * INTO r FROM merchandise_receipts WHERE id = p_receipt_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Recepción inexistente';
  END IF;

  PERFORM _assert_can_receive(r.kiosko_id);

  IF r.status IN ('confirmed', 'received', 'verified', 'discrepancy') THEN
    RETURN jsonb_build_object('receipt_id', r.id, 'confirmed', true, 'already_confirmed', true);
  END IF;
  IF r.status = 'cancelled' THEN
    RAISE EXCEPTION 'La recepción está anulada';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM merchandise_receipt_items WHERE receipt_id = r.id) THEN
    RAISE EXCEPTION 'La recepción no tiene productos';
  END IF;

  FOR it IN
    SELECT * FROM merchandise_receipt_items WHERE receipt_id = r.id ORDER BY created_at, id
  LOOP
    IF it.product_id IS NULL THEN
      RAISE EXCEPTION 'El producto "%" ya no existe; quitalo de la recepción', it.product_name;
    END IF;

    UPDATE products
       SET stock_quantity = COALESCE(stock_quantity, 0) + it.quantity,
           updated_at     = now()
     WHERE id = it.product_id AND kiosko_id = r.kiosko_id
    RETURNING stock_quantity - it.quantity, stock_quantity INTO v_before, v_after;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'El producto "%" no pertenece a este kiosko', it.product_name;
    END IF;

    INSERT INTO stock_movements (product_id, kiosko_id, movement_type, quantity, reason, reference_id, created_by)
    VALUES (it.product_id, r.kiosko_id, 'in', it.quantity,
            'Recepción de mercadería - Remito ' || r.receipt_number, r.id, auth.uid());

    v_lines := v_lines || jsonb_build_object(
      'product_id', it.product_id, 'product_name', it.product_name,
      'quantity', it.quantity, 'stock_before', v_before, 'stock_after', v_after);
  END LOOP;

  UPDATE merchandise_receipts
     SET status = 'confirmed',
         confirmed_at = now(),
         confirmed_by = auth.uid(),
         confirm_idempotency_key = p_idempotency_key,
         updated_at = now()
   WHERE id = r.id;

  INSERT INTO audit_logs (kiosko_id, user_id, action, entity_type, entity_id, before_data, after_data)
  VALUES (r.kiosko_id, auth.uid(), 'receipt.confirmed', 'merchandise_receipt', r.id,
          jsonb_build_object('status', r.status),
          jsonb_build_object('status', 'confirmed', 'lines', v_lines));

  RETURN jsonb_build_object('receipt_id', r.id, 'confirmed', true, 'already_confirmed', false, 'lines', v_lines);
END;
$$;

-- 7) Anular: borrador -> se descarta; confirmada -> reversion (solo dueño) ----
CREATE OR REPLACE FUNCTION cancel_receipt(p_receipt_id uuid, p_reason text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r          merchandise_receipts%ROWTYPE;
  it         record;
  v_role     text;
  v_before   integer;
  v_after    integer;
  v_lines    jsonb := '[]'::jsonb;
BEGIN
  SELECT * INTO r FROM merchandise_receipts WHERE id = p_receipt_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Recepción inexistente';
  END IF;

  v_role := _assert_can_receive(r.kiosko_id);

  IF r.status = 'cancelled' THEN
    RETURN jsonb_build_object('receipt_id', r.id, 'cancelled', true, 'already_cancelled', true);
  END IF;

  IF r.status = 'draft' THEN
    UPDATE merchandise_receipts
       SET status = 'cancelled', cancelled_at = now(), cancelled_by = auth.uid(),
           cancel_reason = p_reason, updated_at = now()
     WHERE id = r.id;

    INSERT INTO audit_logs (kiosko_id, user_id, action, entity_type, entity_id, before_data, after_data)
    VALUES (r.kiosko_id, auth.uid(), 'receipt.draft_discarded', 'merchandise_receipt', r.id,
            jsonb_build_object('status', 'draft'),
            jsonb_build_object('status', 'cancelled', 'reason', p_reason));

    RETURN jsonb_build_object('receipt_id', r.id, 'cancelled', true, 'already_cancelled', false);
  END IF;

  IF r.status <> 'confirmed' THEN
    RAISE EXCEPTION 'Las recepciones anteriores al nuevo sistema no se pueden anular desde acá';
  END IF;
  IF v_role <> 'owner' THEN
    RAISE EXCEPTION 'Solo el dueño puede anular una recepción confirmada';
  END IF;

  FOR it IN
    SELECT * FROM merchandise_receipt_items WHERE receipt_id = r.id ORDER BY created_at, id
  LOOP
    IF it.product_id IS NULL THEN
      CONTINUE;
    END IF;

    -- Movimiento compensatorio: nunca se borra el original. Si ya se vendio
    -- parte de lo recibido, el stock no baja de 0 y se registra lo realmente
    -- descontado.
    SELECT COALESCE(stock_quantity, 0) INTO v_before
      FROM products
     WHERE id = it.product_id AND kiosko_id = r.kiosko_id
     FOR UPDATE;

    IF NOT FOUND THEN
      CONTINUE;
    END IF;

    v_after := GREATEST(0, v_before - it.quantity);

    UPDATE products SET stock_quantity = v_after, updated_at = now() WHERE id = it.product_id;

    IF v_before - v_after > 0 THEN
      INSERT INTO stock_movements (product_id, kiosko_id, movement_type, quantity, reason, reference_id, created_by)
      VALUES (it.product_id, r.kiosko_id, 'out', v_before - v_after,
              'Anulación de recepción - Remito ' || r.receipt_number, r.id, auth.uid());

      v_lines := v_lines || jsonb_build_object(
        'product_id', it.product_id, 'product_name', it.product_name,
        'quantity', v_before - v_after, 'stock_before', v_before, 'stock_after', v_after);
    END IF;
  END LOOP;

  UPDATE merchandise_receipts
     SET status = 'cancelled', cancelled_at = now(), cancelled_by = auth.uid(),
         cancel_reason = p_reason, updated_at = now()
   WHERE id = r.id;

  INSERT INTO audit_logs (kiosko_id, user_id, action, entity_type, entity_id, before_data, after_data)
  VALUES (r.kiosko_id, auth.uid(), 'receipt.cancelled', 'merchandise_receipt', r.id,
          jsonb_build_object('status', 'confirmed'),
          jsonb_build_object('status', 'cancelled', 'reason', p_reason, 'lines', v_lines));

  RETURN jsonb_build_object('receipt_id', r.id, 'cancelled', true, 'already_cancelled', false, 'lines', v_lines);
END;
$$;

GRANT EXECUTE ON FUNCTION save_receipt_draft(jsonb) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION confirm_receipt(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION cancel_receipt(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION _assert_can_receive(uuid) TO authenticated, service_role;
