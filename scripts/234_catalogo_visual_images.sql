-- ============================================================================
-- 234_catalogo_visual_images.sql
-- Base para "Catálogo → Catálogo Visual": imágenes de producto, con
-- enriquecimiento automático (por código de barras, vía Open Food Facts /
-- UPCItemDB, que ya se usaban en el alta de productos pero se tiraba la
-- imagen que esas APIs devuelven) y cola de revisión para lo que no se
-- pueda confirmar automático.
--
-- products.image_url ya aparecía en los esquemas más viejos del proyecto
-- (puede que ya exista en la base real) — el ADD COLUMN IF NOT EXISTS es
-- seguro en los dos casos.
--
-- Reversion: DROP TABLE product_images; DROP FUNCTION
--   set_product_image_candidate(...); DROP FUNCTION approve_product_image(uuid);
--   DROP FUNCTION reject_product_image(uuid); las columnas nuevas en
--   products/barcode_catalog son aditivas, no haría falta sacarlas.
-- ============================================================================

ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE barcode_catalog ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Bucket para las imágenes (mismo patrón que "receipts" en 209).
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "product_images_upload_authenticated" ON storage.objects;
CREATE POLICY "product_images_upload_authenticated" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-images');

CREATE TABLE IF NOT EXISTS product_images (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id       UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  kiosko_id        UUID NOT NULL REFERENCES kioscos(id) ON DELETE CASCADE,
  image_url        TEXT NOT NULL,
  source           TEXT NOT NULL CHECK (source IN ('manual', 'openfoodfacts', 'upcitemdb', 'barcode_catalog')),
  source_url       TEXT,
  confidence_score INTEGER,
  match_method     TEXT,
  status           TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  verified_by      UUID,
  verified_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (product_id)
);

CREATE INDEX IF NOT EXISTS idx_product_images_kiosko_status ON product_images (kiosko_id, status);

ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "product_images_members_select" ON product_images;
CREATE POLICY "product_images_members_select" ON product_images
  FOR SELECT TO authenticated
  USING (
    kiosko_id IN (SELECT id FROM kioscos WHERE owner_id = auth.uid())
    OR kiosko_id IN (SELECT kiosko_id FROM employees WHERE user_id = auth.uid() AND status = 'active')
  );

GRANT SELECT ON TABLE public.product_images TO authenticated;
GRANT ALL PRIVILEGES ON TABLE public.product_images TO service_role;

-- Dueño, o empleado con permiso de gestionar inventario (el mismo que ya
-- exige editar/crear productos).
CREATE OR REPLACE FUNCTION _assert_can_manage_product_images(p_kiosko uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Sesión no válida';
  END IF;

  IF EXISTS (SELECT 1 FROM kioscos WHERE id = p_kiosko AND owner_id = auth.uid()) THEN
    RETURN 'owner';
  END IF;

  IF EXISTS (
    SELECT 1 FROM employees e
    WHERE e.kiosko_id = p_kiosko
      AND e.user_id = auth.uid()
      AND e.status = 'active'
      AND (e.permissions->>'can_manage_inventory') = 'true'
  ) THEN
    RETURN 'employee';
  END IF;

  RAISE EXCEPTION 'No tenés permiso para gestionar imágenes de productos';
END;
$$;

-- Guarda/actualiza una imagen candidata para un producto. Si p_auto_approve,
-- queda aprobada y pasa directo a products.image_url. Nunca pisa una imagen
-- ya verificada o cargada a mano (prioridad: manual/verificada > automática).
CREATE OR REPLACE FUNCTION set_product_image_candidate(
  p_kiosko          uuid,
  p_product         uuid,
  p_barcode         text DEFAULT NULL,
  p_image_url       text DEFAULT NULL,
  p_source          text DEFAULT 'manual',
  p_source_url      text DEFAULT NULL,
  p_confidence      integer DEFAULT NULL,
  p_match_method    text DEFAULT NULL,
  p_auto_approve    boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing product_images%ROWTYPE;
  v_status   text;
BEGIN
  PERFORM _assert_can_manage_product_images(p_kiosko);

  IF p_image_url IS NULL THEN
    RAISE EXCEPTION 'p_image_url es obligatorio';
  END IF;

  SELECT * INTO v_existing FROM product_images WHERE product_id = p_product;

  IF FOUND AND v_existing.status = 'approved' AND v_existing.source = 'manual' THEN
    RETURN jsonb_build_object('skipped', true, 'reason', 'imagen manual existente, no se pisa');
  END IF;

  v_status := CASE WHEN p_auto_approve THEN 'approved' ELSE 'pending' END;

  INSERT INTO product_images (
    product_id, kiosko_id, image_url, source, source_url, confidence_score, match_method, status,
    verified_by, verified_at
  )
  VALUES (
    p_product, p_kiosko, p_image_url, p_source, p_source_url, p_confidence, p_match_method, v_status,
    NULL,
    CASE WHEN p_auto_approve THEN now() ELSE NULL END
  )
  ON CONFLICT (product_id) DO UPDATE SET
    image_url        = EXCLUDED.image_url,
    source            = EXCLUDED.source,
    source_url        = EXCLUDED.source_url,
    confidence_score  = EXCLUDED.confidence_score,
    match_method      = EXCLUDED.match_method,
    status            = EXCLUDED.status,
    verified_at       = EXCLUDED.verified_at,
    updated_at        = now();

  IF p_auto_approve THEN
    UPDATE products SET image_url = p_image_url, updated_at = now()
     WHERE id = p_product AND kiosko_id = p_kiosko;

    -- Comparte la imagen en el catálogo compartido por código de barras
    -- (así otro kiosko que tenga el mismo producto no vuelve a buscarla).
    IF p_barcode IS NOT NULL AND p_source IN ('openfoodfacts', 'upcitemdb') THEN
      UPDATE barcode_catalog SET image_url = p_image_url, updated_at = now()
       WHERE barcode = p_barcode AND image_url IS NULL;
    END IF;
  END IF;

  RETURN jsonb_build_object('skipped', false, 'status', v_status);
END;
$$;

CREATE OR REPLACE FUNCTION approve_product_image(p_product_image_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r product_images%ROWTYPE;
BEGIN
  SELECT * INTO r FROM product_images WHERE id = p_product_image_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Imagen inexistente';
  END IF;

  PERFORM _assert_can_manage_product_images(r.kiosko_id);

  UPDATE product_images
     SET status = 'approved', verified_by = auth.uid(), verified_at = now(), updated_at = now()
   WHERE id = r.id;

  UPDATE products SET image_url = r.image_url, updated_at = now()
   WHERE id = r.product_id AND kiosko_id = r.kiosko_id;

  RETURN jsonb_build_object('product_image_id', r.id, 'status', 'approved');
END;
$$;

CREATE OR REPLACE FUNCTION reject_product_image(p_product_image_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r product_images%ROWTYPE;
BEGIN
  SELECT * INTO r FROM product_images WHERE id = p_product_image_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Imagen inexistente';
  END IF;

  PERFORM _assert_can_manage_product_images(r.kiosko_id);

  UPDATE product_images
     SET status = 'rejected', verified_by = auth.uid(), verified_at = now(), updated_at = now()
   WHERE id = r.id;

  RETURN jsonb_build_object('product_image_id', r.id, 'status', 'rejected');
END;
$$;

REVOKE ALL ON FUNCTION _assert_can_manage_product_images(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION set_product_image_candidate(uuid, uuid, text, text, text, text, integer, text, boolean) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION approve_product_image(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION reject_product_image(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION _assert_can_manage_product_images(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION set_product_image_candidate(uuid, uuid, text, text, text, text, integer, text, boolean) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION approve_product_image(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION reject_product_image(uuid) TO authenticated, service_role;
