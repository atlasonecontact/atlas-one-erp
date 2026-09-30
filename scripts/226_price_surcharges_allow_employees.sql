-- ============================================================================
-- 226_price_surcharges_allow_employees.sql
-- price_surcharges quedó con la escritura restringida solo al dueño
-- (price_surcharges_owner_write). Se cambia para que cualquier empleado
-- activo del kiosko también pueda guardar/editar el recargo, mismo patrón
-- que ya se usa en products/promotions (dueño o empleado activo).
-- ============================================================================

DROP POLICY IF EXISTS price_surcharges_select ON price_surcharges;
DROP POLICY IF EXISTS price_surcharges_owner_write ON price_surcharges;

CREATE POLICY price_surcharges_members
ON price_surcharges
FOR ALL
TO authenticated
USING (
  kiosko_id IN (SELECT id FROM kioscos WHERE owner_id = auth.uid())
  OR kiosko_id IN (SELECT kiosko_id FROM employees WHERE user_id = auth.uid() AND status = 'active')
)
WITH CHECK (
  kiosko_id IN (SELECT id FROM kioscos WHERE owner_id = auth.uid())
  OR kiosko_id IN (SELECT kiosko_id FROM employees WHERE user_id = auth.uid() AND status = 'active')
);

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.price_surcharges TO authenticated;
