-- ============================================================================
-- 223_hash_employee_pins.sql
-- El PIN de acceso rápido de los empleados se guardaba en texto plano
-- (employees.pin, y una columna vieja sin usar employees.access_pin). Si esa
-- tabla se llegara a filtrar (clave de servicio comprometida, backup expuesto,
-- etc.) esas contraseñas quedarían usables tal cual. Se migra a un hash
-- (bcrypt via pgcrypto) y se borran las columnas en texto plano.
--
-- No afecta login real (auth.users), que Supabase ya hashea solo. Tampoco
-- toca employees.temp_password (fuera de este cambio).
-- Reversion: no es reversible sin los PIN originales (es la idea del hash).
-- Si hace falta volver atrás sin el hash, habria que pedirle a cada empleado
-- que configure un PIN nuevo.
-- ============================================================================

-- En Supabase, pgcrypto se instala en el esquema "extensions", no en "public"
-- (por eso todas las llamadas de acá abajo van calificadas como extensions.crypt/gen_salt).
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

ALTER TABLE employees ADD COLUMN IF NOT EXISTS pin_hash TEXT;

-- Migra los PIN existentes (si los hay) antes de borrar la columna vieja.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'pin') THEN
    UPDATE employees SET pin_hash = extensions.crypt(pin, extensions.gen_salt('bf')) WHERE pin IS NOT NULL AND pin_hash IS NULL;
  END IF;
END $$;

ALTER TABLE employees DROP COLUMN IF EXISTS pin;
ALTER TABLE employees DROP COLUMN IF EXISTS access_pin; -- columna vieja de 118_employee_shifts_and_pin.sql, nunca la leyó la app

-- Funciones puras (no tocan filas, no necesitan chequeo de dueño/empleado):
-- hashear un PIN nuevo y verificar uno existente contra su hash.
CREATE OR REPLACE FUNCTION hash_pin(p_pin TEXT)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT extensions.crypt(p_pin, extensions.gen_salt('bf'));
$$;

CREATE OR REPLACE FUNCTION verify_pin(p_pin_hash TEXT, p_pin TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT p_pin_hash IS NOT NULL AND p_pin_hash = extensions.crypt(p_pin, p_pin_hash);
$$;

GRANT EXECUTE ON FUNCTION hash_pin(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION verify_pin(TEXT, TEXT) TO authenticated;
