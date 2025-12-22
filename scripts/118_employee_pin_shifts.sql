-- ====================================================
-- EMPLOYEE PIN AND SHIFTS SYSTEM
-- ====================================================
-- Adds PIN access for employees and shift management

BEGIN;

-- Add new columns to employees table
DO $$
BEGIN
  -- PIN code (4-6 digits) for employee access
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'pin'
  ) THEN
    ALTER TABLE public.employees ADD COLUMN pin TEXT;
  END IF;

  -- Phone number
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'phone'
  ) THEN
    ALTER TABLE public.employees ADD COLUMN phone TEXT;
  END IF;

  -- DNI / Document ID
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'document_id'
  ) THEN
    ALTER TABLE public.employees ADD COLUMN document_id TEXT;
  END IF;

  -- Address
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'address'
  ) THEN
    ALTER TABLE public.employees ADD COLUMN address TEXT;
  END IF;

  -- Birth date
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'birth_date'
  ) THEN
    ALTER TABLE public.employees ADD COLUMN birth_date DATE;
  END IF;

  -- Emergency contact name
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'emergency_contact'
  ) THEN
    ALTER TABLE public.employees ADD COLUMN emergency_contact TEXT;
  END IF;

  -- Emergency contact phone
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'emergency_phone'
  ) THEN
    ALTER TABLE public.employees ADD COLUMN emergency_phone TEXT;
  END IF;

  -- Notes / observations
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'notes'
  ) THEN
    ALTER TABLE public.employees ADD COLUMN notes TEXT;
  END IF;

  -- Hourly rate
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'hourly_rate'
  ) THEN
    ALTER TABLE public.employees ADD COLUMN hourly_rate DECIMAL(12,2);
  END IF;
END $$;

-- ====================================================
-- TABLA: employee_shifts (Turnos de empleados)
-- ====================================================
CREATE TABLE IF NOT EXISTS employee_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  kiosko_id UUID NOT NULL REFERENCES kioscos(id) ON DELETE CASCADE,
  
  -- Day of week (0=Sunday, 1=Monday, ..., 6=Saturday)
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  
  -- Shift times
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  
  -- Break info
  break_start TIME,
  break_end TIME,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- One shift per day per employee
  UNIQUE(employee_id, day_of_week)
);

-- ====================================================
-- TABLA: employee_attendance (Registro de asistencia)
-- ====================================================
CREATE TABLE IF NOT EXISTS employee_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  kiosko_id UUID NOT NULL REFERENCES kioscos(id) ON DELETE CASCADE,
  
  -- Date of attendance
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Clock in/out times
  clock_in TIMESTAMPTZ,
  clock_out TIMESTAMPTZ,
  
  -- Break times
  break_start TIMESTAMPTZ,
  break_end TIMESTAMPTZ,
  
  -- Status: present, absent, late, half_day
  status TEXT DEFAULT 'present',
  
  -- Notes
  notes TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- One attendance record per day per employee
  UNIQUE(employee_id, date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_employee_shifts_employee ON employee_shifts(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_shifts_kiosko ON employee_shifts(kiosko_id);
CREATE INDEX IF NOT EXISTS idx_employee_attendance_employee ON employee_attendance(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_attendance_date ON employee_attendance(date);

-- Disable RLS for these tables (managed by app)
ALTER TABLE employee_shifts DISABLE ROW LEVEL SECURITY;
ALTER TABLE employee_attendance DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON employee_shifts TO authenticated;
GRANT ALL ON employee_shifts TO anon;
GRANT ALL ON employee_attendance TO authenticated;
GRANT ALL ON employee_attendance TO anon;

-- Refresh schema cache
DO $$
BEGIN
  PERFORM pg_notify('pgrst', 'reload schema');
EXCEPTION WHEN OTHERS THEN
  NULL;
END;
$$;

COMMIT;
