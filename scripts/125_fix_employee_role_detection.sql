-- ====================================================
-- FIX EMPLOYEE ROLE DETECTION
-- ====================================================
-- Problem: The trigger creates profiles with role='admin' ignoring metadata
-- Solution: Make trigger respect the role from user metadata
-- Run this in Supabase SQL Editor

BEGIN;

-- 1. Update the trigger function to respect role from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, business_name, role, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data ->> 'business_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'owner'),  -- Respect role from metadata, default to 'owner'
    COALESCE(NEW.raw_user_meta_data ->> 'username', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    role = COALESCE(EXCLUDED.role, profiles.role),  -- Update role if provided
    updated_at = NOW();
  
  RETURN NEW;
END;
$$;

-- 2. Fix existing employee profiles that have wrong role
-- Find employees with user_id and update their profiles to role='employee'
UPDATE profiles p
SET role = 'employee', updated_at = NOW()
FROM employees e
WHERE e.user_id = p.id
  AND p.role != 'employee';

-- 3. Verify the fix
SELECT 
  p.id,
  p.username,
  p.full_name,
  p.role as profile_role,
  e.name as employee_name,
  e.user_id
FROM profiles p
LEFT JOIN employees e ON e.user_id = p.id
WHERE e.user_id IS NOT NULL
ORDER BY p.created_at DESC
LIMIT 10;

COMMIT;
