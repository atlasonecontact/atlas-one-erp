-- ============================================================================
-- 222_promotions_enable_rls.sql
-- Supabase (Security Advisor) avisó: promotions y promotion_items estaban sin
-- RLS. Hasta ahora el filtrado por kiosko_id lo hacía sólo la app (mismo
-- criterio que products/sales), pero eso significa que cualquier cuenta
-- autenticada podía leer o escribir promociones de OTRO kiosco llamando
-- directo a la API de Supabase, sin pasar por la app. Se agrega RLS real:
-- sólo el dueño del kiosco o sus empleados activos pueden ver/tocar sus
-- propias promociones (mismo patrón que pedidos_internos en 217).
-- Reversion: ALTER TABLE ... DISABLE ROW LEVEL SECURITY (vuelve al estado
-- anterior, sin borrar datos).
-- ============================================================================

ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "promotions_members" ON promotions;
CREATE POLICY "promotions_members" ON promotions
  FOR ALL TO authenticated
  USING (
    kiosko_id IN (SELECT id FROM kioscos WHERE owner_id = auth.uid())
    OR kiosko_id IN (SELECT kiosko_id FROM employees WHERE user_id = auth.uid() AND status = 'active')
  )
  WITH CHECK (
    kiosko_id IN (SELECT id FROM kioscos WHERE owner_id = auth.uid())
    OR kiosko_id IN (SELECT kiosko_id FROM employees WHERE user_id = auth.uid() AND status = 'active')
  );

DROP POLICY IF EXISTS "promotion_items_members" ON promotion_items;
CREATE POLICY "promotion_items_members" ON promotion_items
  FOR ALL TO authenticated
  USING (promotion_id IN (SELECT id FROM promotions))
  WITH CHECK (promotion_id IN (SELECT id FROM promotions));

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.promotions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.promotion_items TO authenticated;
GRANT ALL PRIVILEGES ON TABLE public.promotions TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.promotion_items TO service_role;
