-- ====================================================
-- INTEGRATION TABLES: Invoices, External Orders, Payment Transactions
-- ====================================================
-- Additional tables for integration features

BEGIN;

-- ====================================================
-- INVOICES (Facturas Electrónicas)
-- ====================================================
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kiosko_id UUID NOT NULL REFERENCES public.kioscos(id) ON DELETE CASCADE,
  sale_id UUID REFERENCES public.sales(id) ON DELETE SET NULL,
  
  -- Datos del comprobante
  tipo_comprobante INTEGER NOT NULL, -- 1=FA, 6=FB, 11=FC, etc
  punto_venta INTEGER NOT NULL,
  numero_comprobante INTEGER NOT NULL,
  
  -- CAE
  cae TEXT,
  cae_vencimiento TEXT, -- YYYYMMDD
  
  -- Datos del emisor
  cuit_emisor TEXT NOT NULL,
  
  -- Datos del receptor
  tipo_documento_receptor INTEGER, -- 80=CUIT, 96=DNI, 99=CF
  numero_documento_receptor TEXT,
  razon_social_receptor TEXT,
  
  -- Importes
  importe_total DECIMAL(12,2) NOT NULL,
  importe_neto DECIMAL(12,2) NOT NULL,
  importe_iva DECIMAL(12,2) DEFAULT 0,
  importe_exento DECIMAL(12,2) DEFAULT 0,
  importe_tributos DECIMAL(12,2) DEFAULT 0,
  
  -- Estado
  status TEXT DEFAULT 'emitida' CHECK (status IN ('emitida', 'anulada', 'error')),
  error_message TEXT,
  
  -- Código de barras (para impresión)
  codigo_barras TEXT,
  
  -- Fechas
  fecha_emision DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(kiosko_id, punto_venta, tipo_comprobante, numero_comprobante)
);

CREATE INDEX IF NOT EXISTS idx_invoices_kiosko ON invoices(kiosko_id);
CREATE INDEX IF NOT EXISTS idx_invoices_sale ON invoices(sale_id);
CREATE INDEX IF NOT EXISTS idx_invoices_cae ON invoices(cae);
CREATE INDEX IF NOT EXISTS idx_invoices_fecha ON invoices(fecha_emision);

-- ====================================================
-- EXTERNAL ORDERS (Pedidos de Delivery Apps)
-- ====================================================
CREATE TABLE IF NOT EXISTS public.external_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kiosko_id UUID NOT NULL REFERENCES public.kioscos(id) ON DELETE CASCADE,
  
  -- Origen del pedido
  provider TEXT NOT NULL CHECK (provider IN ('pedidosya', 'rappi', 'other')),
  provider_order_id TEXT NOT NULL,
  
  -- Estado del pedido
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending',      -- Recibido, esperando confirmación
    'confirmed',    -- Confirmado por el local
    'preparing',    -- En preparación
    'ready',        -- Listo para retirar/enviar
    'picked_up',    -- Retirado por el repartidor
    'delivered',    -- Entregado
    'cancelled',    -- Cancelado
    'rejected'      -- Rechazado por el local
  )),
  
  -- Datos del cliente
  customer_name TEXT,
  customer_phone TEXT,
  customer_address TEXT,
  customer_notes TEXT,
  
  -- Datos del pedido
  items JSONB NOT NULL DEFAULT '[]',
  subtotal DECIMAL(12,2) NOT NULL,
  delivery_fee DECIMAL(12,2) DEFAULT 0,
  discount DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) NOT NULL,
  
  -- Datos del repartidor
  driver_name TEXT,
  driver_phone TEXT,
  
  -- Tiempos
  estimated_pickup_time TIMESTAMPTZ,
  estimated_delivery_time TIMESTAMPTZ,
  actual_pickup_time TIMESTAMPTZ,
  actual_delivery_time TIMESTAMPTZ,
  
  -- Metadata del provider
  raw_order JSONB,
  
  -- Venta asociada (si se crea)
  sale_id UUID REFERENCES public.sales(id) ON DELETE SET NULL,
  
  -- Timestamps
  received_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_external_orders_kiosko ON external_orders(kiosko_id);
CREATE INDEX IF NOT EXISTS idx_external_orders_provider ON external_orders(provider, provider_order_id);
CREATE INDEX IF NOT EXISTS idx_external_orders_status ON external_orders(status);
CREATE INDEX IF NOT EXISTS idx_external_orders_received ON external_orders(received_at);

-- ====================================================
-- PAYMENT TRANSACTIONS (Transacciones de Pago)
-- ====================================================
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kiosko_id UUID NOT NULL REFERENCES public.kioscos(id) ON DELETE CASCADE,
  sale_id UUID REFERENCES public.sales(id) ON DELETE SET NULL,
  
  -- Datos del proveedor
  provider TEXT NOT NULL CHECK (provider IN ('mercadopago', 'manual', 'cash', 'card', 'transfer')),
  provider_payment_id TEXT,
  
  -- Estado y monto
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'refunded', 'cancelled')),
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'ARS',
  
  -- Detalles
  payment_method TEXT,
  installments INTEGER DEFAULT 1,
  
  -- Respuesta raw del proveedor
  raw_response JSONB,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_kiosko ON payment_transactions(kiosko_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_sale ON payment_transactions(sale_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_provider ON payment_transactions(provider, provider_payment_id);

-- ====================================================
-- ENABLE RLS
-- ====================================================
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- ====================================================
-- RLS POLICIES
-- ====================================================

-- Invoices: Owner can manage their kiosko's invoices
CREATE POLICY "Owners can manage invoices"
  ON public.invoices
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.kioscos k
      WHERE k.id = invoices.kiosko_id
      AND k.owner_id = auth.uid()
    )
  );

-- External Orders: Owner and employees can view and manage
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
  );

CREATE POLICY "Employees can view external orders"
  ON public.external_orders
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.employees e
      WHERE e.kiosko_id = external_orders.kiosko_id
      AND e.user_id = auth.uid()
      AND e.is_active = true
    )
  );

CREATE POLICY "Employees can update external orders"
  ON public.external_orders
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.employees e
      WHERE e.kiosko_id = external_orders.kiosko_id
      AND e.user_id = auth.uid()
      AND e.is_active = true
    )
  );

-- Payment Transactions: Owner can view
CREATE POLICY "Owners can view payment transactions"
  ON public.payment_transactions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.kioscos k
      WHERE k.id = payment_transactions.kiosko_id
      AND k.owner_id = auth.uid()
    )
  );

-- ====================================================
-- GRANT PERMISSIONS
-- ====================================================
GRANT ALL ON public.invoices TO authenticated;
GRANT ALL ON public.external_orders TO authenticated;
GRANT ALL ON public.payment_transactions TO authenticated;

-- ====================================================
-- UPDATE TRIGGERS
-- ====================================================
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_invoices_updated ON invoices;
CREATE TRIGGER trigger_invoices_updated
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_modified_column();

DROP TRIGGER IF EXISTS trigger_external_orders_updated ON external_orders;
CREATE TRIGGER trigger_external_orders_updated
  BEFORE UPDATE ON external_orders
  FOR EACH ROW EXECUTE FUNCTION update_modified_column();

DROP TRIGGER IF EXISTS trigger_payment_transactions_updated ON payment_transactions;
CREATE TRIGGER trigger_payment_transactions_updated
  BEFORE UPDATE ON payment_transactions
  FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- ====================================================
-- ADD COLUMNS TO SALES TABLE
-- ====================================================
DO $$
BEGIN
  -- Add payment_status if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sales' AND column_name = 'payment_status'
  ) THEN
    ALTER TABLE public.sales ADD COLUMN payment_status TEXT DEFAULT 'paid';
  END IF;

  -- Add mp_payment_id if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sales' AND column_name = 'mp_payment_id'
  ) THEN
    ALTER TABLE public.sales ADD COLUMN mp_payment_id TEXT;
  END IF;

  -- Add external_order_id if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sales' AND column_name = 'external_order_id'
  ) THEN
    ALTER TABLE public.sales ADD COLUMN external_order_id UUID REFERENCES public.external_orders(id);
  END IF;
END $$;

-- Refresh schema
DO $$
BEGIN
  PERFORM pg_notify('pgrst', 'reload schema');
EXCEPTION WHEN OTHERS THEN
  NULL;
END;
$$;

COMMIT;
