-- ====================================================
-- EXTENDED PRODUCT FIELDS FOR EXCEL/CSV IMPORT
-- ====================================================
-- Adds new fields to support full Excel structure

BEGIN;

-- Add new columns to products table
DO $$
BEGIN
  -- Brand (Marca)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'brand'
  ) THEN
    ALTER TABLE public.products ADD COLUMN brand TEXT;
  END IF;

  -- Variant (Línea / Variante)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'variant'
  ) THEN
    ALTER TABLE public.products ADD COLUMN variant TEXT;
  END IF;

  -- Presentation/Format (Presentación / Formato)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'presentation'
  ) THEN
    ALTER TABLE public.products ADD COLUMN presentation TEXT;
  END IF;

  -- Subcategory (Subcategoría)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'subcategory'
  ) THEN
    ALTER TABLE public.products ADD COLUMN subcategory TEXT;
  END IF;

  -- Net Content (Contenido Neto)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'net_content'
  ) THEN
    ALTER TABLE public.products ADD COLUMN net_content DECIMAL(12,2);
  END IF;

  -- Unit (Unidad: ml, L, g, kg, etc.)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'unit'
  ) THEN
    ALTER TABLE public.products ADD COLUMN unit TEXT;
  END IF;

  -- Cost WITHOUT VAT (Costo sin IVA)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'cost_ex_vat'
  ) THEN
    ALTER TABLE public.products ADD COLUMN cost_ex_vat DECIMAL(12,2);
  END IF;

  -- Cost WITH VAT (Costo con IVA)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'cost_inc_vat'
  ) THEN
    ALTER TABLE public.products ADD COLUMN cost_inc_vat DECIMAL(12,2);
  END IF;

  -- VAT Rate (typically 0.21 for 21%)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'vat_rate'
  ) THEN
    ALTER TABLE public.products ADD COLUMN vat_rate DECIMAL(5,4) DEFAULT 0.21;
  END IF;
END $$;

-- Create indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_subcategory ON products(subcategory);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);

-- Create unique constraint on kiosko_id + sku for upsert operations
-- First, make sure sku is not null for existing products (generate from name if missing)
UPDATE products 
SET sku = UPPER(SUBSTRING(REPLACE(name, ' ', '-'), 1, 50) || '-' || SUBSTRING(id::text, 1, 8))
WHERE sku IS NULL OR sku = '';

-- Add unique constraint (drops existing if any)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'products_kiosko_sku_unique'
  ) THEN
    ALTER TABLE products ADD CONSTRAINT products_kiosko_sku_unique UNIQUE (kiosko_id, sku);
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Constraint might fail if there are duplicates, log and continue
  RAISE NOTICE 'Could not create unique constraint: %', SQLERRM;
END $$;

-- Refresh schema cache
DO $$
BEGIN
  PERFORM pg_notify('pgrst', 'reload schema');
EXCEPTION WHEN OTHERS THEN
  NULL;
END;
$$;

COMMIT;
