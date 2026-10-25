-- ============================================================================
-- 239_subscription_due_date.sql
-- Cartel de "tenes que pagar la suscripcion" para el dueño de cada cuenta.
-- Se agregan dos columnas a profiles (fecha de proximo pago y de ultimo pago
-- recibido) y dos funciones admin-only para que el admin de Atlas One las
-- actualice cuando un cliente le paga. El dashboard lee next_payment_due_at
-- de su propio perfil (misma logica que ya usa access_status) y muestra un
-- cartel si esa fecha ya paso.
--
-- Nadie queda afectado por este script: las columnas nuevas arrancan en NULL
-- (sin fecha de vencimiento = no se muestra ningun cartel) hasta que el admin
-- le fije una fecha a una cuenta puntual desde /dashboard/admin/cuentas.
--
-- Seguridad: profiles ya tiene una policy "Users can update own profile" que
-- permite al dueño de la fila actualizar cualquier columna de su perfil — sin
-- un trigger, cualquiera podria auto-extenderse la fecha de vencimiento desde
-- el propio cliente de Supabase. El trigger de abajo revierte esas dos
-- columnas a su valor anterior si quien escribe no es el admin fijo.
--
-- Reversion: DROP TRIGGER trg_protect_subscription_fields ON profiles;
--   DROP FUNCTION protect_subscription_fields();
--   DROP FUNCTION admin_mark_payment_received(uuid, integer);
--   DROP FUNCTION admin_set_payment_due_date(uuid, date);
--   ALTER TABLE profiles DROP COLUMN next_payment_due_at, DROP COLUMN last_payment_at;
-- ============================================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS next_payment_due_at DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_payment_at TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION protect_subscription_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_email text;
BEGIN
  SELECT email INTO v_email FROM auth.users WHERE id = auth.uid();
  IF v_email IS DISTINCT FROM 'atlasonecontact@gmail.com' THEN
    NEW.next_payment_due_at := OLD.next_payment_due_at;
    NEW.last_payment_at := OLD.last_payment_at;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_subscription_fields ON profiles;
CREATE TRIGGER trg_protect_subscription_fields
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION protect_subscription_fields();

-- El admin marca que una cuenta pago: corre la fecha de vencimiento p_months
-- meses para adelante desde la que estaba (o desde hoy si no tenia ninguna).
CREATE OR REPLACE FUNCTION admin_mark_payment_received(p_profile_id uuid, p_months integer DEFAULT 1)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_email text;
  v_base date;
  v_new_due date;
BEGIN
  SELECT email INTO v_email FROM auth.users WHERE id = auth.uid();
  IF v_email IS DISTINCT FROM 'atlasonecontact@gmail.com' THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  SELECT GREATEST(COALESCE(next_payment_due_at, CURRENT_DATE), CURRENT_DATE)
    INTO v_base
    FROM profiles WHERE id = p_profile_id;

  v_new_due := v_base + (p_months || ' months')::interval;

  UPDATE profiles
     SET next_payment_due_at = v_new_due,
         last_payment_at = now(),
         updated_at = now()
   WHERE id = p_profile_id;

  RETURN jsonb_build_object('profile_id', p_profile_id, 'next_payment_due_at', v_new_due);
END;
$$;

-- Para fijar o corregir la fecha de vencimiento a mano (ej: primera vez que
-- se configura una cuenta, o para corregir un error).
CREATE OR REPLACE FUNCTION admin_set_payment_due_date(p_profile_id uuid, p_due_date date)
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

  UPDATE profiles SET next_payment_due_at = p_due_date, updated_at = now()
  WHERE id = p_profile_id;

  RETURN jsonb_build_object('profile_id', p_profile_id, 'next_payment_due_at', p_due_date);
END;
$$;

-- admin_list_accounts ahora tambien devuelve la fecha de vencimiento, para
-- que el panel la muestre.
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
               'next_payment_due_at', p.next_payment_due_at,
               'last_payment_at', p.last_payment_at,
               'created_at', k.created_at
             ) AS x
        FROM kioscos k
        LEFT JOIN profiles p ON p.id = k.owner_id
        LEFT JOIN auth.users u ON u.id = k.owner_id
    ) q;

  RETURN v_res;
END;
$$;

REVOKE ALL ON FUNCTION admin_mark_payment_received(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION admin_mark_payment_received(uuid, integer) TO authenticated;
REVOKE ALL ON FUNCTION admin_set_payment_due_date(uuid, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION admin_set_payment_due_date(uuid, date) TO authenticated;
