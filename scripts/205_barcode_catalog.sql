-- ============================================================================
-- 205_barcode_catalog.sql
-- Atlas ONE - Catalogo maestro de codigos de barra compartido entre kioscos.
--
-- El scanner de alta de productos (components/products/product-modal.tsx)
-- ya buscaba en esta tabla (lookupSharedCatalog) y cada producto guardado la
-- alimentaba (contributeToBarcodeCatalog, app/dashboard/productos/page.tsx),
-- pero la tabla nunca se creo -> el escaneo de un producto nuevo siempre
-- caia a las APIs publicas externas (OpenFoodFacts / UPCItemDB), que casi
-- no tienen productos de kiosco argentino, y quedaba sin autocompletar.
--
-- GTIN/EAN -> nombre + categoria. Marca/subcategoria/presentacion, costo,
-- precio, proveedor y stock siguen siendo propios de cada kiosko (tabla
-- products), tal como se definio en la sesion de diseño.
-- ============================================================================

CREATE TABLE IF NOT EXISTS barcode_catalog (
  barcode     TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  category    TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE barcode_catalog ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "barcode_catalog_select_authenticated" ON barcode_catalog;
CREATE POLICY "barcode_catalog_select_authenticated"
  ON barcode_catalog FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "barcode_catalog_insert_authenticated" ON barcode_catalog;
CREATE POLICY "barcode_catalog_insert_authenticated"
  ON barcode_catalog FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "barcode_catalog_update_authenticated" ON barcode_catalog;
CREATE POLICY "barcode_catalog_update_authenticated"
  ON barcode_catalog FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.barcode_catalog TO authenticated;
GRANT ALL PRIVILEGES ON TABLE public.barcode_catalog TO service_role;
