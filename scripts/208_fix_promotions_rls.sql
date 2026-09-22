-- ============================================================================
-- 208_fix_promotions_rls.sql
-- Fix: "new row violates row-level security policy for table promotions"
--
-- promotions/promotion_items deben comportarse igual que products: sin RLS,
-- el filtrado por kiosko_id lo hace la app (ver 207_promotions.sql). Si la
-- tabla ya existia de antes con RLS activado (o Supabase la creo con RLS por
-- defecto), esto lo apaga explicitamente en vez de depender de como haya
-- quedado la primera vez.
-- ============================================================================

ALTER TABLE promotions DISABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_items DISABLE ROW LEVEL SECURITY;

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.promotions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.promotion_items TO authenticated;
GRANT ALL PRIVILEGES ON TABLE public.promotions TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.promotion_items TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
