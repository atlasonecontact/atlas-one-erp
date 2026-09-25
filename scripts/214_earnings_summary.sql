-- ============================================================================
-- 214_earnings_summary.sql
-- Caja fuerte (solo dueño): lo ganado HOY, lo ganado en el mes hasta hoy y el
-- total de cada mes. Sale de TODAS las ventas (efectivo, tarjeta, QR...), no
-- solo del efectivo que sobra en el cajon. Meses en hora argentina.
-- Ademas cada cierre de caja guarda cuanto se gano en ese turno
-- (cash_registers.shift_sales_total).
-- ============================================================================

ALTER TABLE cash_registers ADD COLUMN IF NOT EXISTS shift_sales_total NUMERIC;

CREATE OR REPLACE FUNCTION earnings_summary(p_kiosko uuid, p_months integer DEFAULT 12)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tz          text := 'America/Argentina/Buenos_Aires';
  v_day_start   timestamptz;
  v_month_start timestamptz;
  v_from        timestamptz;
  v_today       numeric;
  v_month       numeric;
  v_months      jsonb;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM kioscos WHERE id = p_kiosko AND owner_id = auth.uid()) THEN
    RETURN NULL;
  END IF;

  v_day_start   := date_trunc('day', now() AT TIME ZONE v_tz) AT TIME ZONE v_tz;
  v_month_start := date_trunc('month', now() AT TIME ZONE v_tz) AT TIME ZONE v_tz;
  v_from        := (date_trunc('month', now() AT TIME ZONE v_tz) - make_interval(months => GREATEST(p_months, 1) - 1)) AT TIME ZONE v_tz;

  SELECT COALESCE(SUM(total_amount) FILTER (WHERE created_at >= v_day_start), 0),
         COALESCE(SUM(total_amount) FILTER (WHERE created_at >= v_month_start), 0)
    INTO v_today, v_month
    FROM sales
   WHERE kiosko_id = p_kiosko
     AND COALESCE(status, 'completed') = 'completed'
     AND created_at >= v_month_start;

  SELECT COALESCE(jsonb_agg(jsonb_build_object('month', m, 'sales', total, 'sales_count', n) ORDER BY m DESC), '[]'::jsonb)
    INTO v_months
    FROM (
      SELECT to_char(created_at AT TIME ZONE v_tz, 'YYYY-MM') AS m,
             SUM(total_amount) AS total,
             COUNT(*) AS n
        FROM sales
       WHERE kiosko_id = p_kiosko
         AND COALESCE(status, 'completed') = 'completed'
         AND created_at >= v_from
       GROUP BY 1
    ) x;

  RETURN jsonb_build_object('today', v_today, 'month', v_month, 'months', v_months);
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
  r             cash_registers%ROWTYPE;
  v_cash_sales  numeric;
  v_shift_sales numeric;
  v_in          numeric;
  v_out         numeric;
  v_expected    numeric;
  v_diff        numeric;
  v_withdrawn   numeric := COALESCE(p_withdrawn, 0);
  v_left        numeric;
  v_dest        text := NULLIF(p_destination, '');
  v_label       text;
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

  SELECT COALESCE(SUM(total_amount), 0),
         COALESCE(SUM(total_amount) FILTER (WHERE lower(COALESCE(payment_method, '')) IN ('cash', 'efectivo')), 0)
    INTO v_shift_sales, v_cash_sales
    FROM sales
   WHERE kiosko_id = r.kiosko_id
     AND created_at >= r.opened_at
     AND COALESCE(status, 'completed') = 'completed';

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
         shift_sales_total = v_shift_sales,
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
                             'shift_sales', v_shift_sales, 'withdrawn', v_withdrawn,
                             'destination', v_dest, 'left_for_next', v_left));

  RETURN jsonb_build_object('register_id', r.id, 'closed', true, 'already_closed', false,
                            'expected', v_expected, 'counted', p_counted, 'difference', v_diff,
                            'shift_sales', v_shift_sales, 'withdrawn', v_withdrawn, 'left_for_next', v_left);
END;
$$;

GRANT EXECUTE ON FUNCTION earnings_summary(uuid, integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION close_cash_register(uuid, numeric, numeric, text, text) TO authenticated, service_role;
