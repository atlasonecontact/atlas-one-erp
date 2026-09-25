-- ============================================================================
-- 215_earnings_with_safe.sql
-- earnings_summary ahora devuelve tambien el total guardado en la caja fuerte
-- (lo que se deposita al cerrar cada caja) y, por mes, cuanto se guardo.
-- Reemplaza la funcion de scripts/214.
-- ============================================================================

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
  v_safe        numeric;
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

  SELECT COALESCE(SUM(CASE direction WHEN 'in' THEN amount ELSE -amount END), 0)
    INTO v_safe
    FROM treasury_movements
   WHERE kiosko_id = p_kiosko AND account = 'safe';

  WITH sales_m AS (
    SELECT to_char(created_at AT TIME ZONE v_tz, 'YYYY-MM') AS m,
           SUM(total_amount) AS total,
           COUNT(*) AS n
      FROM sales
     WHERE kiosko_id = p_kiosko
       AND COALESCE(status, 'completed') = 'completed'
       AND created_at >= v_from
     GROUP BY 1
  ),
  saved_m AS (
    SELECT to_char(created_at AT TIME ZONE v_tz, 'YYYY-MM') AS m,
           SUM(CASE direction WHEN 'in' THEN amount ELSE -amount END) AS saved
      FROM treasury_movements
     WHERE kiosko_id = p_kiosko
       AND account = 'safe'
       AND created_at >= v_from
     GROUP BY 1
  )
  SELECT COALESCE(
           jsonb_agg(
             jsonb_build_object(
               'month', mm.m,
               'sales', COALESCE(s.total, 0),
               'sales_count', COALESCE(s.n, 0),
               'saved', COALESCE(t.saved, 0)
             ) ORDER BY mm.m DESC
           ),
           '[]'::jsonb
         )
    INTO v_months
    FROM (SELECT m FROM sales_m UNION SELECT m FROM saved_m) mm
    LEFT JOIN sales_m s ON s.m = mm.m
    LEFT JOIN saved_m t ON t.m = mm.m;

  RETURN jsonb_build_object('today', v_today, 'month', v_month, 'safe', v_safe, 'months', v_months);
END;
$$;

GRANT EXECUTE ON FUNCTION earnings_summary(uuid, integer) TO authenticated, service_role;
