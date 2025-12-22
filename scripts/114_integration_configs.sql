-- ====================================================
-- INTEGRATION CONFIGS TABLE
-- ====================================================
-- Stores configuration for external integrations:
-- - ARCA (AFIP) - Electronic invoicing
-- - Mercado Pago - Payments
-- - Pedidos Ya - Delivery
-- - Rappi - Delivery

BEGIN;

-- Create table
CREATE TABLE IF NOT EXISTS public.integration_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kiosko_id UUID NOT NULL REFERENCES public.kioscos(id) ON DELETE CASCADE,
  
  -- ARCA (AFIP) - Electronic Invoicing
  arca_enabled BOOLEAN DEFAULT FALSE,
  arca_cuit TEXT,
  arca_certificate TEXT, -- Base64 encoded .crt file
  arca_private_key TEXT, -- Base64 encoded .key file (encrypted at rest)
  arca_environment TEXT DEFAULT 'testing' CHECK (arca_environment IN ('testing', 'production')),
  arca_punto_venta INTEGER,
  arca_verified BOOLEAN DEFAULT FALSE,
  arca_last_cae TEXT, -- Last CAE obtained
  arca_last_invoice_number INTEGER,
  
  -- Mercado Pago
  mercadopago_enabled BOOLEAN DEFAULT FALSE,
  mercadopago_access_token TEXT, -- Encrypted
  mercadopago_public_key TEXT,
  mercadopago_user_id TEXT,
  mercadopago_verified BOOLEAN DEFAULT FALSE,
  
  -- Pedidos Ya
  pedidosya_enabled BOOLEAN DEFAULT FALSE,
  pedidosya_client_id TEXT,
  pedidosya_client_secret TEXT, -- Encrypted
  pedidosya_restaurant_id TEXT,
  pedidosya_access_token TEXT, -- OAuth token
  pedidosya_token_expires_at TIMESTAMPTZ,
  pedidosya_verified BOOLEAN DEFAULT FALSE,
  
  -- Rappi
  rappi_enabled BOOLEAN DEFAULT FALSE,
  rappi_store_id TEXT,
  rappi_api_key TEXT, -- Encrypted
  rappi_verified BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- One config per kiosko
  UNIQUE(kiosko_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_integration_configs_kiosko ON integration_configs(kiosko_id);

-- Enable RLS
ALTER TABLE public.integration_configs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Owners can manage their kiosko's integration config
CREATE POLICY "Owners can manage integration configs"
  ON public.integration_configs
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.kioscos k
      WHERE k.id = integration_configs.kiosko_id
      AND k.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.kioscos k
      WHERE k.id = integration_configs.kiosko_id
      AND k.owner_id = auth.uid()
    )
  );

-- Grant permissions
GRANT ALL ON public.integration_configs TO authenticated;

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_integration_configs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_integration_configs_updated_at ON integration_configs;
CREATE TRIGGER trigger_integration_configs_updated_at
  BEFORE UPDATE ON integration_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_integration_configs_updated_at();

-- Notify PostgREST
DO $$
BEGIN
  PERFORM pg_notify('pgrst', 'reload schema');
EXCEPTION WHEN OTHERS THEN
  NULL;
END;
$$;

COMMIT;
