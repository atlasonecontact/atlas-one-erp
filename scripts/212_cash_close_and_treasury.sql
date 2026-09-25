-- ============================================================================
-- 212_cash_close_and_treasury.sql
-- Sprint 1 / S1-03: cierre de caja con destino del efectivo, movimientos de
-- caja, historial de cierres y "cuenta de plata" (caja fuerte y banco).
--
-- - cash_registers: turno, cuanto se retira al cerrar, a donde va y cuanto
--   queda para el proximo turno.
-- - cash_register_transactions: direccion (in/out) y quien lo cargo, para
--   distinguir gasto / retiro del dueño / pago a proveedor / vale / cambio.
-- - treasury_movements: libro de la plata guardada (caja fuerte, banco).
--   Solo el dueño la ve y la mueve; los cierres de caja la alimentan a traves
--   de close_cash_register (SECURITY DEFINER), asi que un empleado puede
--   depositar en la caja fuerte al cerrar sin poder ver los saldos.
-- - open_cash_register / close_cash_register: atomicas e idempotentes; el
--   esperado se calcula en el servidor.
-- Reversion: DROP de las funciones y de treasury_movements; las columnas
-- nuevas son opcionales.
-- ============================================================================

ALTER TABLE cash_registers
  ADD COLUMN IF NOT EXISTS shift                  TEXT,
  ADD COLUMN IF NOT EXISTS cashier_name           TEXT,
  ADD COLUMN IF NOT EXISTS withdrawn_amount       NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS withdrawn_destination  TEXT,
  ADD COLUMN IF NOT EXISTS left_for_next          NUMERIC,
  ADD COLUMN IF NOT EXISTS expected_cash          NUMERIC,
  ADD COLUMN IF NOT EXISTS counted_cash           NUMERIC,
  ADD COLUMN IF NOT EXISTS cash_difference        NUMERIC,
  ADD COLUMN IF NOT EXISTS closing_notes          TEXT,
  ADD COLUMN IF NOT EXISTS opened_by              UUID,
  ADD COLUMN IF NOT EXISTS closed_by              UUID;

ALTER TABLE cash_register_transactions
  ADD COLUMN IF NOT EXISTS direction   TEXT NOT NULL DEFAULT 'out',
  ADD COLUMN IF NOT EXISTS created_by  UUID;

CREATE TABLE IF NOT EXISTS treasury_movements (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kiosko_id        UUID NOT NULL REFERENCES kioscos(id) ON DELETE CASCADE,
  account          TEXT NOT NULL CHECK (account IN ('safe', 'bank')),
  direction        TEXT NOT NULL CHECK (direction IN ('in', 'out')),
  amount           NUMERIC NOT NULL CHECK (amount > 0),
  concept          TEXT NOT NULL DEFAULT 'manual',
  note             TEXT,
  cash_register_id UUID REFERENCES cash_registers(id) ON DELETE SET NULL,
  created_by       UUID DEFAULT auth.uid(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS treasury_movements_kiosko_idx ON treasury_movements (kiosko_id, created_at DESC);

ALTER TABLE treasury_movements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "treasury_movements_owner" ON treasury_movements;
CREATE POLICY "treasury_movements_owner" ON treasury_movements
  FOR ALL TO authenticated
  USING (kiosko_id IN (SELECT id FROM kioscos WHERE owner_id = auth.uid()))
  WITH CHECK (kiosko_id IN (SELECT id FROM kioscos WHERE owner_id = auth.uid()));

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.treasury_movements TO authenticated;
GRANT ALL PRIVILEGES ON TABLE public.treasury_movements TO service_role;

CREATE OR REPLACE FUNCTION _assert_kiosko_member(p_kiosko uuid)
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
  IF EXISTS (SELECT 1 FROM employees WHERE kiosko_id = p_kiosko AND user_id = auth.uid() AND status = 'active') THEN
    RETURN 'employee';
  END IF;
  RAISE EXCEPTION 'No pertenecés a este kiosko';
END;
$$;

CREATE OR REPLACE FUNCTION open_cash_register(
  p_kiosko uuid,
  p_opening numeric,
  p_shift text DEFAULT NULL,
  p_employee uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id      uuid;
  v_name    text;
BEGIN
  PERFORM _assert_kiosko_member(p_kiosko);

  IF COALESCE(p_opening, 0) < 0 THEN
    RAISE EXCEPTION 'El saldo inicial no puede ser negativo';
  END IF;

  SELECT id INTO v_id
    FROM cash_registers
   WHERE kiosko_id = p_kiosko AND status = 'open'
   ORDER BY opened_at DESC
   LIMIT 1;

  IF v_id IS NOT NULL THEN
    RETURN jsonb_build_object('register_id', v_id, 'created', false);
  END IF;

  SELECT COALESCE(NULLIF(e.name, ''), NULL) INTO v_name
    FROM employees e
   WHERE e.user_id = auth.uid() AND e.kiosko_id = p_kiosko
   LIMIT 1;

  INSERT INTO cash_registers (kiosko_id, employee_id, opening_balance, status, shift, cashier_name, opened_by)
  VALUES (p_kiosko, p_employee, COALESCE(p_opening, 0), 'open', NULLIF(p_shift, ''), v_name, auth.uid())
  RETURNING id INTO v_id;

  INSERT INTO audit_logs (kiosko_id, user_id, action, entity_type, entity_id, after_data)
  VALUES (p_kiosko, auth.uid(), 'cash.opened', 'cash_register', v_id,
          jsonb_build_object('opening_balance', COALESCE(p_opening, 0), 'shift', p_shift));

  RETURN jsonb_build_object('register_id', v_id, 'created', true);
END;
$$;

CREATE OR REPLACE FUNCTION close_cash_register(
  p_register uuid,
  p_counted numeric,
  p_withdrawn numeric DEFAULT 0,
  p_destination text DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r            cash_registers%ROWTYPE;
  v_cash_sales numeric;
  v_in         numeric;
  v_out        numeric;
  v_expected   numeric;
  v_diff       numeric;
  v_withdrawn  numeric := COALESCE(p_withdrawn, 0);
  v_left       numeric;
  v_dest       text := NULLIF(p_destination, '');
  v_label      text;
BEGIN
  SELECT * INTO r FROM cash_registers WHERE id = p_register FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Caja inexistente';
  END IF;

  PERFORM _assert_kiosko_member(r.kiosko_id);

  IF r.status <> 'open' THEN
    RETURN jsonb_build_object('register_id', r.id, 'closed', true, 'already_closed', true);
  END IF;

  IF p_counted IS NULL OR p_counted < 0 THEN
    RAISE EXCEPTION 'El efectivo contado no es válido';
  END IF;
  IF v_withdrawn < 0 OR v_withdrawn > p_counted THEN
    RAISE EXCEPTION 'No podés retirar más de lo que contaste en la caja';
  END IF;
  IF v_withdrawn > 0 AND v_dest NOT IN ('safe', 'bank', 'owner') THEN
    RAISE EXCEPTION 'Elegí a dónde va el efectivo retirado';
  END IF;

  SELECT COALESCE(SUM(total_amount), 0) INTO v_cash_sales
    FROM sales
   WHERE kiosko_id = r.kiosko_id
     AND created_at >= r.opened_at
     AND COALESCE(status, 'completed') = 'completed'
     AND lower(COALESCE(payment_method, '')) IN ('cash', 'efectivo');

  SELECT COALESCE(SUM(amount) FILTER (WHERE direction = 'in'), 0),
         COALESCE(SUM(amount) FILTER (WHERE direction <> 'in'), 0)
    INTO v_in, v_out
    FROM cash_register_transactions
   WHERE cash_register_id = r.id;

  v_expected := COALESCE(r.opening_balance, 0) + v_cash_sales + v_in - v_out;
  v_diff     := p_counted - v_expected;
  v_left     := p_counted - v_withdrawn;

  UPDATE cash_registers
     SET status = 'closed',
         closed_at = now(),
         closed_by = auth.uid(),
         closing_balance = p_counted,
         expected_cash = v_expected,
         counted_cash = p_counted,
         cash_difference = v_diff,
         withdrawn_amount = v_withdrawn,
         withdrawn_destination = CASE WHEN v_withdrawn > 0 THEN v_dest ELSE NULL END,
         left_for_next = v_left,
         closing_notes = NULLIF(p_notes, '')
   WHERE id = r.id;

  IF v_withdrawn > 0 THEN
    v_label := CASE v_dest
                 WHEN 'safe' THEN 'Depósito en caja fuerte'
                 WHEN 'bank' THEN 'Depósito en banco'
                 ELSE 'Retiro del dueño'
               END;

    INSERT INTO cash_register_transactions (cash_register_id, type, direction, amount, payment_method, notes, created_by)
    VALUES (r.id, CASE v_dest WHEN 'owner' THEN 'owner_withdrawal' ELSE 'deposit' END,
            'out', v_withdrawn, 'cash', v_label || ' (al cerrar la caja)', auth.uid());

    IF v_dest IN ('safe', 'bank') THEN
      INSERT INTO treasury_movements (kiosko_id, account, direction, amount, concept, note, cash_register_id, created_by)
      VALUES (r.kiosko_id, v_dest, 'in', v_withdrawn, 'cash_close',
              'Cierre de caja ' || to_char(now() AT TIME ZONE 'America/Argentina/Buenos_Aires', 'DD/MM HH24:MI'),
              r.id, auth.uid());
    END IF;
  END IF;

  INSERT INTO audit_logs (kiosko_id, user_id, action, entity_type, entity_id, before_data, after_data)
  VALUES (r.kiosko_id, auth.uid(), 'cash.closed', 'cash_register', r.id,
          jsonb_build_object('status', 'open'),
          jsonb_build_object('expected', v_expected, 'counted', p_counted, 'difference', v_diff,
                             'withdrawn', v_withdrawn, 'destination', v_dest, 'left_for_next', v_left));

  RETURN jsonb_build_object('register_id', r.id, 'closed', true, 'already_closed', false,
                            'expected', v_expected, 'counted', p_counted, 'difference', v_diff,
                            'withdrawn', v_withdrawn, 'left_for_next', v_left);
END;
$$;

CREATE OR REPLACE FUNCTION treasury_summary(p_kiosko uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_safe numeric;
  v_bank numeric;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM kioscos WHERE id = p_kiosko AND owner_id = auth.uid()) THEN
    RETURN NULL;
  END IF;

  SELECT COALESCE(SUM(CASE direction WHEN 'in' THEN amount ELSE -amount END) FILTER (WHERE account = 'safe'), 0),
         COALESCE(SUM(CASE direction WHEN 'in' THEN amount ELSE -amount END) FILTER (WHERE account = 'bank'), 0)
    INTO v_safe, v_bank
    FROM treasury_movements
   WHERE kiosko_id = p_kiosko;

  RETURN jsonb_build_object('safe', v_safe, 'bank', v_bank, 'total', v_safe + v_bank);
END;
$$;

GRANT EXECUTE ON FUNCTION _assert_kiosko_member(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION open_cash_register(uuid, numeric, text, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION close_cash_register(uuid, numeric, numeric, text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION treasury_summary(uuid) TO authenticated, service_role;
