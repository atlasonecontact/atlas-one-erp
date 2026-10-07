-- ============================================================================
-- 235_fix_barcode_catalog_updated_at.sql
-- barcode_catalog quedó creada (en algún momento, antes del script 205) sin
-- la columna updated_at que ese script siempre asumió -- como usa
-- CREATE TABLE IF NOT EXISTS, nunca la agregó porque la tabla ya existía.
-- set_product_image_candidate (234) la necesita para cachear la imagen
-- encontrada y reutilizarla entre kioscos.
-- Reversion: ALTER TABLE barcode_catalog DROP COLUMN updated_at;
-- ============================================================================

ALTER TABLE barcode_catalog ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
