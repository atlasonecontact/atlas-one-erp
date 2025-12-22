-- ====================================================
-- EMPLOYEE SHIFTS AND PIN SYSTEM
-- ====================================================
-- Adds PIN access, shifts/schedules, and extended employee info

BEGIN;

-- ====================================================
-- EXTENDED EMPLOYEE FIELDS
-- ====================================================
DO $$
BEGIN
  -- PIN de acceso (4-6 dígitos) - visible solo para el jefe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'access_pin'
  ) THEN
    ALTER TABLE public.employees ADD COLUMN access_pin TEXT;
  END IF;

  -- Teléfono del empleado
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'phone'
  ) THEN
    ALTER TABLE public.employees ADD COLUMN phone TEXT;
  END IF;

  -- DNI/Documento
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'document_id'
  ) THEN
    ALTER TABLE public.employees ADD COLUMN document_id TEXT;
  END IF;

  -- Dirección
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'address'
  ) THEN
    ALTER TABLE public.employees ADD COLUMN address TEXT;
  END IF;

  -- Fecha de nacimiento
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'birth_date'
  ) THEN
    ALTER TABLE public.employees ADD COLUMN birth_date DATE;
  END IF;

  -- Contacto de emergencia
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'emergency_contact'
  ) THEN
    ALTER TABLE public.employees ADD COLUMN emergency_contact TEXT;
  END IF;

  -- Teléfono de emergencia
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'emergency_phone'
  ) THEN
    ALTER TABLE public.employees ADD COLUMN emergency_phone TEXT;
  END IF;

  -- Notas internas del jefe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'notes'
  ) THEN
    ALTER TABLE public.employees ADD COLUMN notes TEXT;
  END IF;

  -- Foto/Avatar URL
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE public.employees ADD COLUMN avatar_url TEXT;
  END IF;

  -- is_active flag (para compatibilidad)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE public.employees ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Sync is_active with status
UPDATE employees SET is_active = (status = 'active') WHERE is_active IS NULL;

-- ====================================================
-- TABLA: employee_shifts (Turnos de empleados)
-- ====================================================
CREATE TABLE IF NOT EXISTS employee_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  kiosko_id UUID NOT NULL REFERENCES kioscos(id) ON DELETE CASCADE,
  
  -- Día de la semana (0=Domingo, 1=Lunes, ..., 6=Sábado)
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  
  -- Horario
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  
  -- Tipo de turno
  shift_type TEXT DEFAULT 'regular', -- regular, extra, training, etc.
  
  -- Si es recurrente (semanal) o fecha específica
  is_recurring BOOLEAN DEFAULT true,
  specific_date DATE, -- Solo si is_recurring = false
  
  -- Estado del turno
  is_active BOOLEAN DEFAULT true,
  
  -- Notas
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================
-- TABLA: employee_attendance (Registro de asistencia)
-- ====================================================
CREATE TABLE IF NOT EXISTS employee_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  kiosko_id UUID NOT NULL REFERENCES kioscos(id) ON DELETE CASCADE,
  shift_id UUID REFERENCES employee_shifts(id) ON DELETE SET NULL,
  
  -- Fecha del registro
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Hora de entrada/salida real
  clock_in TIMESTAMPTZ,
  clock_out TIMESTAMPTZ,
  
  -- Estado: present, absent, late, early_leave
  status TEXT DEFAULT 'present',
  
  -- Horas trabajadas (calculado)
  hours_worked DECIMAL(5,2),
  
  -- Notas (llegó tarde, etc.)
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_employee_shifts_employee ON employee_shifts(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_shifts_kiosko ON employee_shifts(kiosko_id);
CREATE INDEX IF NOT EXISTS idx_employee_shifts_day ON employee_shifts(day_of_week);
CREATE INDEX IF NOT EXISTS idx_employee_attendance_employee ON employee_attendance(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_attendance_date ON employee_attendance(date);

-- Generar PIN aleatorio de 4 dígitos para empleados sin PIN
UPDATE employees 
SET access_pin = LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0')
WHERE access_pin IS NULL;

-- ====================================================
-- RLS POLICIES (si está habilitado)
-- ====================================================
-- Las políticas permiten que el dueño del kiosko vea todo

-- Disable RLS for now (can be enabled later)
ALTER TABLE employee_shifts DISABLE ROW LEVEL SECURITY;
ALTER TABLE employee_attendance DISABLE ROW LEVEL SECURITY;

-- Grant access
GRANT ALL ON employee_shifts TO authenticated;
GRANT ALL ON employee_attendance TO authenticated;

-- Refresh schema cache
DO $$
BEGIN
  PERFORM pg_notify('pgrst', 'reload schema');
EXCEPTION WHEN OTHERS THEN
  NULL;
END;
$$;

COMMIT;
