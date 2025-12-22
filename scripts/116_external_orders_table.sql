-- ====================================================
-- EXTERNAL ORDERS TABLE (for Pedidos Ya, Rappi, etc.)
-- ====================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.external_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kiosko_id UUID NOT NULL REFERENCES public.kioscos(id) ON DELETE CASCADE,
  
  -- External source
  source TEXT NOT NULL CHECK (source IN ('pedidosya', 'rappi', 'uber_eats', 'glovo', 'other')),
  external_id TEXT NOT NULL,
  external_code TEXT, -- Human-readable order code
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',      -- Just received
    'confirmed',    -- Accepted by store
    'in_preparation', -- Being prepared
    'ready',        -- Ready for pickup
    'dispatched',   -- Picked up by delivery
    'delivered',    -- Delivered to customer
    'cancelled',    -- Cancelled
    'rejected'      -- Rejected by store
  )),
  
  -- Customer info
  customer_name TEXT,
  customer_phone TEXT,
  customer_address TEXT,
  
  -- Order details
  total_amount DECIMAL(12, 2),
  items JSONB, -- Array of order items
  notes TEXT,
  
  -- Cancellation
  cancellation_reason TEXT,
  
  -- Raw data from external API
  raw_data JSONB,
  
  -- Link to local sale (if converted)
  sale_id UUID REFERENCES public.sales(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  ready_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  
  -- Unique external order per source
  UNIQUE(source, external_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_external_orders_kiosko ON external_orders(kiosko_id);
CREATE INDEX IF NOT EXISTS idx_external_orders_source ON external_orders(source);
CREATE INDEX IF NOT EXISTS idx_external_orders_status ON external_orders(status);
CREATE INDEX IF NOT EXISTS idx_external_orders_created ON external_orders(created_at);
CREATE INDEX IF NOT EXISTS idx_external_orders_external ON external_orders(source, external_id);

-- RLS
ALTER TABLE public.external_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage external orders"
  ON public.external_orders
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.kioscos k
      WHERE k.id = external_orders.kiosko_id
      AND k.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.kioscos k
      WHERE k.id = external_orders.kiosko_id
      AND k.owner_id = auth.uid()
    )
  );

CREATE POLICY "Employees can manage external orders"
  ON public.external_orders
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.employees e
      WHERE e.kiosko_id = external_orders.kiosko_id
      AND e.user_id = auth.uid()
      AND e.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.employees e
      WHERE e.kiosko_id = external_orders.kiosko_id
      AND e.user_id = auth.uid()
      AND e.is_active = true
    )
  );

-- Service role can insert from webhooks
CREATE POLICY "Service role can insert external orders"
  ON public.external_orders
  FOR INSERT
  TO service_role
  WITH CHECK (true);

GRANT ALL ON public.external_orders TO authenticated;
GRANT INSERT ON public.external_orders TO service_role;

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_external_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  
  -- Set timestamp based on status change
  IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' THEN
    NEW.confirmed_at = NOW();
  END IF;
  IF NEW.status = 'ready' AND OLD.status != 'ready' THEN
    NEW.ready_at = NOW();
  END IF;
  IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
    NEW.delivered_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_external_orders_updated_at ON external_orders;
CREATE TRIGGER trigger_external_orders_updated_at
  BEFORE UPDATE ON external_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_external_orders_updated_at();

-- Notify PostgREST
DO $$
BEGIN
  PERFORM pg_notify('pgrst', 'reload schema');
EXCEPTION WHEN OTHERS THEN
  NULL;
END;
$$;

COMMIT;
