-- ================================================
-- Script: 122_fix_employee_policies.sql
-- Descripción: Actualizar políticas RLS para empleados
-- ================================================

-- Asegurar que las columnas existen
DO $$
BEGIN
    -- Columna username
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'employees' AND column_name = 'username'
    ) THEN
        ALTER TABLE employees ADD COLUMN username TEXT;
    END IF;

    -- Columna pin
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'employees' AND column_name = 'pin'
    ) THEN
        ALTER TABLE employees ADD COLUMN pin TEXT;
    END IF;
END $$;

-- Recrear política para INSERT de empleados
DROP POLICY IF EXISTS "Owners can insert employees" ON employees;
CREATE POLICY "Owners can insert employees" ON employees
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM kioscos k 
            WHERE k.id = kiosko_id 
            AND k.owner_id = auth.uid()
        )
    );

-- Recrear política para SELECT de empleados
DROP POLICY IF EXISTS "Owners and employees can view" ON employees;
CREATE POLICY "Owners and employees can view" ON employees
    FOR SELECT
    USING (
        -- Owner can view
        EXISTS (
            SELECT 1 FROM kioscos k 
            WHERE k.id = kiosko_id 
            AND k.owner_id = auth.uid()
        )
        OR
        -- Employee can view their own data
        user_id = auth.uid()
    );

-- Política para UPDATE
DROP POLICY IF EXISTS "Owners can update employees" ON employees;
CREATE POLICY "Owners can update employees" ON employees
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM kioscos k 
            WHERE k.id = kiosko_id 
            AND k.owner_id = auth.uid()
        )
    );

-- Política para DELETE
DROP POLICY IF EXISTS "Owners can delete employees" ON employees;
CREATE POLICY "Owners can delete employees" ON employees
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM kioscos k 
            WHERE k.id = kiosko_id 
            AND k.owner_id = auth.uid()
        )
    );

-- Habilitar RLS en employees si no está habilitado
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Dar permisos a authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON employees TO authenticated;

-- También asegurar políticas para employee_shifts
DROP POLICY IF EXISTS "Owners can manage shifts" ON employee_shifts;
CREATE POLICY "Owners can manage shifts" ON employee_shifts
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM kioscos k 
            WHERE k.id = kiosko_id 
            AND k.owner_id = auth.uid()
        )
    );

ALTER TABLE employee_shifts ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON employee_shifts TO authenticated;

-- Comentario
COMMENT ON TABLE employees IS 'Tabla de empleados con políticas RLS para dueños y empleados';
