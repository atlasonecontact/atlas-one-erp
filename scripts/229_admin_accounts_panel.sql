-- ============================================================================
-- 229_admin_accounts_panel.sql
-- Panel para ver todas las cuentas (kioscos) y poder suspenderle el acceso a
-- una puntual si deja de pagar — sin tocar el registro público ni afectar a
-- nadie automáticamente. Nadie queda suspendido por este script: sólo agrega
-- las dos funciones que usa el panel nuevo (/dashboard/admin/cuentas).
--
-- El "admin" es una sola cuenta fija (atlasonecontact@gmail.com, el mismo
-- email que ya se usa como bypass en app/dashboard/layout.tsx y
-- lib/supabase/middleware.ts) — no es un rol nuevo, es el mismo admin de
-- siempre. Cualquier otra cuenta que llame a estas funciones recibe un error.
--
-- Reversion: DROP FUNCTION admin_list_accounts(); DROP FUNCTION
--   admin_set_access_status(uuid, text); no tocan ninguna tabla ni dato.
-- ============================================================================

CREATE OR REPLACE FUNCTION admin_list_accounts()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_email text;
  v_res   jsonb;
BEGIN
  SELECT email INTO v_email FROM auth.users WHERE id = auth.uid();
  IF v_email IS DISTINCT FROM 'atlasonecontact@gmail.com' THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  SELECT COALESCE(jsonb_agg(x ORDER BY (x->>'created_at') DESC), '[]'::jsonb)
    INTO v_res
    FROM (
      SELECT jsonb_build_object(
               'kiosko_id', k.id,
               'kiosko_name', k.name,
               'owner_id', k.owner_id,
               'owner_email', u.email,
               'owner_name', p.full_name,
               'business_name', p.business_name,
               'access_status', COALESCE(p.access_status, 'approved'),
               'created_at', k.created_at
             ) AS x
        FROM kioscos k
        LEFT JOIN profiles p ON p.id = k.owner_id
        LEFT JOIN auth.users u ON u.id = k.owner_id
    ) q;

  RETURN v_res;
END;
$$;

CREATE OR REPLACE FUNCTION admin_set_access_status(p_profile_id uuid, p_status text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_email text;
BEGIN
  SELECT email INTO v_email FROM auth.users WHERE id = auth.uid();
  IF v_email IS DISTINCT FROM 'atlasonecontact@gmail.com' THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  IF p_status NOT IN ('approved', 'suspended') THEN
    RAISE EXCEPTION 'Estado inválido: %', p_status;
  END IF;

  UPDATE profiles SET access_status = p_status, updated_at = now()
  WHERE id = p_profile_id;

  RETURN jsonb_build_object('profile_id', p_profile_id, 'access_status', p_status);
END;
$$;

REVOKE ALL ON FUNCTION admin_list_accounts() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION admin_list_accounts() TO authenticated;
REVOKE ALL ON FUNCTION admin_set_access_status(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION admin_set_access_status(uuid, text) TO authenticated;
