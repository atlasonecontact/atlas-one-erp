-- ====================================================
-- FIX PERMISSIONS (GRANTS) FOR SUPABASE ROLES
-- ====================================================
-- This script fixes "permission denied for table ..." errors coming from PostgREST.
-- It grants the needed privileges to Supabase roles: anon + authenticated.
--
-- Run this in Supabase SQL Editor (or as a migration) on the target database.

BEGIN;

-- Ensure the API roles can use the public schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Subscription plans should be readable by everyone (public catalog)
GRANT SELECT ON TABLE public.subscription_plans TO anon, authenticated;

-- Kioscos CRUD (client uses authenticated JWT)
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.kioscos TO authenticated;

-- Notifications-related tables used from the dashboard UI
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.notification_configs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.phone_verifications TO authenticated;

-- (Optional) If you later re-enable RLS, GRANTs are still required.
-- RLS controls row visibility; GRANT controls basic table access.

COMMIT;
