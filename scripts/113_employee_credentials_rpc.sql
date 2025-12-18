-- ====================================================
-- EMPLOYEE CREDENTIALS RPC (PostgREST / supabase.rpc)
-- ====================================================
-- Fixes: "Could not find the function public.generate_employee_credentials(...) in the schema cache"
--
-- This is used by the frontend to:
-- 1) generate a unique username + password + temp email
-- 2) call supabase.auth.signUp() with that temp email
--
-- Run in Supabase SQL Editor.

BEGIN;

-- Needed for UNACCENT()
CREATE EXTENSION IF NOT EXISTS unaccent;

-- If an old signature exists, drop it first
DROP FUNCTION IF EXISTS public.generate_employee_credentials(text, text, uuid);
DROP FUNCTION IF EXISTS public.generate_unique_username(text, text, uuid);

-- Generate a unique username (scoped globally; kiosko_id included for future flexibility)
CREATE OR REPLACE FUNCTION public.generate_unique_username(
  p_first_name TEXT,
  p_last_name TEXT,
  p_kiosko_id UUID
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  counter INT := 1;
BEGIN
  base_username := LOWER(
    REGEXP_REPLACE(
      UNACCENT(p_first_name || '.' || p_last_name),
      '[^a-z0-9.]',
      '',
      'g'
    )
  );

  -- fallback if names are empty or become empty after sanitization
  IF base_username IS NULL OR base_username = '' THEN
    base_username := 'empleado.' || SUBSTRING(p_kiosko_id::TEXT, 1, 8);
  END IF;

  final_username := base_username;

  WHILE EXISTS (SELECT 1 FROM public.employees e WHERE e.username = final_username) LOOP
    final_username := base_username || counter;
    counter := counter + 1;
  END LOOP;

  RETURN final_username;
END;
$$;

-- Generate credentials for a new employee
CREATE OR REPLACE FUNCTION public.generate_employee_credentials(
  p_first_name TEXT,
  p_last_name TEXT,
  p_kiosko_id UUID
)
RETURNS TABLE (
  username TEXT,
  password TEXT,
  temp_email TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_username TEXT;
  v_password TEXT;
  v_temp_email TEXT;
BEGIN
  v_username := public.generate_unique_username(p_first_name, p_last_name, p_kiosko_id);

  -- 12 chars: 4 upper + 4 lower + 4 digits
  v_password := array_to_string(
    ARRAY(
      SELECT chr((65 + round(random() * 25))::integer)
      FROM generate_series(1, 4)
    ), ''
  ) || array_to_string(
    ARRAY(
      SELECT chr((97 + round(random() * 25))::integer)
      FROM generate_series(1, 4)
    ), ''
  ) || array_to_string(
    ARRAY(
      SELECT chr((48 + round(random() * 9))::integer)
      FROM generate_series(1, 4)
    ), ''
  );

  -- Build a conservative temp email local-part: only letters+digits (some validators reject underscores)
  v_temp_email :=
    'u' ||
    substring(regexp_replace(lower(v_username), '[^a-z0-9]', '', 'g') from 1 for 32) ||
    '@example.com';

  RETURN QUERY SELECT v_username, v_password, v_temp_email;
END;
$$;

-- Allow PostgREST (authenticated users) to execute
GRANT EXECUTE ON FUNCTION public.generate_unique_username(TEXT, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_employee_credentials(TEXT, TEXT, UUID) TO authenticated;

-- Refresh PostgREST schema cache (so rpc() can see the function immediately)
DO $$
BEGIN
  PERFORM pg_notify('pgrst', 'reload schema');
EXCEPTION WHEN OTHERS THEN
  -- ignore if notify is restricted
  NULL;
END;
$$;

COMMIT;
