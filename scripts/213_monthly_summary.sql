-- ============================================================================
-- 213_monthly_summary.sql
-- Pantalla Caja > Plata (solo dueño): cuanto se vendio por mes, cuanto se
-- guardo en la caja fuerte y cuanto retiro el dueño. Meses en hora argentina.
-- ============================================================================

CREATE OR REPLACE FUNCTION monthly_summary(p_kiosko uuid, p_months integer DEFAULT 12)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tz     text := 'America/Argentina/Buenos_Aires';
  v_from   timestamptz;
  v_result jsonb;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM kioscos WHERE id = p_kiosko AND owner_id = auth.uid()) THEN
    RETURN NULL;
  END IF;

  v_from := (date_trunc('month', now() AT TIME ZONE v_tz) - make_interval(months => GREATEST(p_months, 1) - 1)) AT TIME ZONE v_tz;

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
  close_m AS (
    SELECT to_char(closed_at AT TIME ZONE v_tz, 'YYYY-MM') AS m,
           SUM(withdrawn_amount) FILTER (WHERE withdrawn_destination = 'safe') AS to_safe,
           SUM(withdrawn_amount) FILTER (WHERE withdrawn_destination = 'owner') AS to_owner
      FROM cash_registers
     WHERE kiosko_id = p_kiosko
       AND status = 'closed'
       AND closed_at >= v_from
     GROUP BY 1
  )
  SELECT COALESCE(
           jsonb_agg(
             jsonb_build_object(
               'month', mm.m,
               'sales', COALESCE(s.total, 0),
               'sales_count', COALESCE(s.n, 0),
               'to_safe', COALESCE(c.to_safe, 0),
               'to_owner', COALESCE(c.to_owner, 0)
             ) ORDER BY mm.m DESC
           ),
           '[]'::jsonb
         )
    INTO v_result
    FROM (SELECT m FROM sales_m UNION SELECT m FROM close_m) mm
    LEFT JOIN sales_m s ON s.m = mm.m
    LEFT JOIN close_m c ON c.m = mm.m;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION monthly_summary(uuid, integer) TO authenticated, service_role;
