-- ====================================================
-- Script 123: Fix external_orders columns
-- ====================================================
-- Agrega columna 'source' si no existe (mapeando desde 'provider')
-- ====================================================

-- Verificar si existe la columna 'source'
DO $$
BEGIN
  -- Si no existe 'source' pero existe 'provider', renombrar
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'external_orders' AND column_name = 'source'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'external_orders' AND column_name = 'provider'
  ) THEN
    -- Renombrar provider a source
    ALTER TABLE public.external_orders RENAME COLUMN provider TO source;
    RAISE NOTICE 'Columna provider renombrada a source';
  END IF;
  
  -- Si no existe ninguna, crear source
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'external_orders' AND column_name = 'source'
  ) THEN
    ALTER TABLE public.external_orders ADD COLUMN source TEXT DEFAULT 'other';
    RAISE NOTICE 'Columna source creada';
  END IF;
  
  -- Verificar que created_at existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'external_orders' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.external_orders ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    RAISE NOTICE 'Columna created_at creada';
  END IF;
  
  -- Verificar que status existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'external_orders' AND column_name = 'status'
  ) THEN
    ALTER TABLE public.external_orders ADD COLUMN status TEXT DEFAULT 'pending';
    RAISE NOTICE 'Columna status creada';
  END IF;
END $$;

-- Crear indice si no existe
CREATE INDEX IF NOT EXISTS idx_external_orders_source ON external_orders(source);

-- Verificar resultado
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'external_orders'
ORDER BY ordinal_position;
