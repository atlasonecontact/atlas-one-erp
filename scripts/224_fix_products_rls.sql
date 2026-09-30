-- ============================================================================
-- 224_fix_products_rls.sql
-- "new row violates row-level security policy for table products" al crear
-- un producto.
--
-- Causa: products tenía políticas superpuestas de tres migraciones viejas
-- (101, 106, 110), todas exigiendo kioscos.chain_id -> chains.owner_id (un
-- modelo de "cadenas" que el resto de la app ya no usa en ningún lado: todo
-- compara directo contra kioscos.owner_id, como en promotions/pedidos_internos).
-- Si el kiosko no tiene ese chain_id enlazado, el INSERT queda bloqueado.
--
-- Se borran todas las políticas viejas (con sus nombres exactos de cada
-- migración) y se las reemplaza por una sola, con el mismo patrón ya probado
-- en el resto del sistema: dueño del kiosko o empleado activo de ese kiosko.
-- Reversion: quedaría sin políticas de products -> ALTER TABLE products
-- DISABLE ROW LEVEL SECURITY revierte al comportamiento de antes (sin RLS).
-- ============================================================================

DROP POLICY IF EXISTS "Kiosko members can view products" ON products;
DROP POLICY IF EXISTS "Kiosko owners can manage products" ON products;
DROP POLICY IF EXISTS "View products of own kioscos" ON products;
DROP POLICY IF EXISTS "Create products in own kioscos" ON products;
DROP POLICY IF EXISTS "Update products in own kioscos" ON products;
DROP POLICY IF EXISTS "Delete products in own kioscos" ON products;
DROP POLICY IF EXISTS "products_select" ON products;
DROP POLICY IF EXISTS "products_insert" ON products;
DROP POLICY IF EXISTS "products_update" ON products;
DROP POLICY IF EXISTS "products_delete" ON products;
DROP POLICY IF EXISTS "products_select_own" ON products;
DROP POLICY IF EXISTS "products_insert_own" ON products;
DROP POLICY IF EXISTS "products_update_own" ON products;
DROP POLICY IF EXISTS "products_delete_own" ON products;
DROP POLICY IF EXISTS "Owners can manage products" ON products;
DROP POLICY IF EXISTS "Employees can view products" ON products;

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "products_members" ON products
  FOR ALL TO authenticated
  USING (
    kiosko_id IN (SELECT id FROM kioscos WHERE owner_id = auth.uid())
    OR kiosko_id IN (SELECT kiosko_id FROM employees WHERE user_id = auth.uid() AND status = 'active')
  )
  WITH CHECK (
    kiosko_id IN (SELECT id FROM kioscos WHERE owner_id = auth.uid())
    OR kiosko_id IN (SELECT kiosko_id FROM employees WHERE user_id = auth.uid() AND status = 'active')
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.products TO authenticated;
