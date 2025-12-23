-- ====================================================
-- FIX PERMISSIONS (GRANTS) FOR SERVICE_ROLE
-- ====================================================
-- The service_role key bypasses RLS but still needs table-level GRANTS.
-- This script grants the needed privileges to the service_role.
-- Run this in Supabase SQL Editor.

BEGIN;

-- Ensure the service_role can use the public schema
GRANT USAGE ON SCHEMA public TO service_role;

-- Grant all privileges to service_role on all tables
GRANT ALL PRIVILEGES ON TABLE public.profiles TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.kioscos TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.employees TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.products TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.sales TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.sale_items TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.purchases TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.purchase_items TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.stock_movements TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.cash_registers TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.cash_register_transactions TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.notification_configs TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.phone_verifications TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.subscription_plans TO service_role;

-- Also grant on any integration tables
GRANT ALL PRIVILEGES ON TABLE public.integration_configs TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.external_orders TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.invoices TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.employee_shifts TO service_role;

-- Grant on sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Verify grants
SELECT 
  grantee,
  table_name,
  privilege_type
FROM information_schema.table_privileges 
WHERE grantee = 'service_role' 
  AND table_schema = 'public'
ORDER BY table_name, privilege_type;

COMMIT;
