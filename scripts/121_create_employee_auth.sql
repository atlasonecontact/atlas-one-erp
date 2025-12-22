-- ================================================
-- Script: 121_create_employee_auth.sql
-- Descripción: Agregar columnas para autenticación de empleados
-- ================================================

-- Agregar columnas para credenciales de empleado si no existen
DO $$
BEGIN
    -- Columna para el user_id de auth (si el empleado tiene cuenta)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'employees' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE employees ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;

    -- Columna para email del empleado
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'employees' AND column_name = 'email'
    ) THEN
        ALTER TABLE employees ADD COLUMN email TEXT;
    END IF;

    -- Columna para guardar la contraseña temporal (visible para el dueño)
    -- Esto permite que el dueño vea y comparta la contraseña inicial del empleado
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'employees' AND column_name = 'temp_password'
    ) THEN
        ALTER TABLE employees ADD COLUMN temp_password TEXT;
    END IF;
END $$;

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);
CREATE INDEX IF NOT EXISTS idx_employees_user_id ON employees(user_id);

-- Función para registrar credenciales de un empleado
CREATE OR REPLACE FUNCTION register_employee_user(
    p_employee_id UUID,
    p_email TEXT,
    p_password TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Si p_employee_id es NULL, solo retornamos éxito
    -- (las credenciales se guardan directamente en el INSERT)
    IF p_employee_id IS NULL THEN
        RETURN json_build_object('success', true, 'message', 'Credentials stored with employee record');
    END IF;

    -- Actualizar el email y la contraseña temporal del empleado
    UPDATE employees
    SET email = p_email,
        temp_password = p_password,
        updated_at = NOW()
    WHERE id = p_employee_id;

    RETURN json_build_object(
        'success', true, 
        'email', p_email
    );
END;
$$;

-- Dar permisos de ejecución
GRANT EXECUTE ON FUNCTION register_employee_user TO authenticated;

-- Comentario explicativo
COMMENT ON FUNCTION register_employee_user IS 
'Guarda las credenciales de un empleado para referencia del dueño.';
