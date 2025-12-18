-- ====================================================
-- FIX PERMISSIONS (GRANTS) FOR ALL TABLES
-- ====================================================
-- This script grants the needed privileges to Supabase roles.
-- Run this in Supabase SQL Editor.

BEGIN;

-- Ensure the API roles can use the public schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Publicly readable tables
GRANT SELECT ON TABLE public.subscription_plans TO anon, authenticated;

-- Tables that authenticated users (owners/employees) need to access
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.kioscos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.employees TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.products TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.sales TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.sale_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.purchases TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.purchase_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.stock_movements TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.cash_registers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.cash_register_transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.notification_configs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.phone_verifications TO authenticated;

-- Sequences (needed for serial/identity columns if any)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

COMMIT;
