-- ====================================================
-- INVOICES TABLE (for ARCA/AFIP Electronic Invoicing)
-- ====================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kiosko_id UUID NOT NULL REFERENCES public.kioscos(id) ON DELETE CASCADE,
  sale_id UUID REFERENCES public.sales(id) ON DELETE SET NULL,
  
  -- Invoice data
  invoice_type INTEGER NOT NULL, -- 1=A, 6=B, 11=C, etc.
  invoice_number INTEGER NOT NULL,
  point_of_sale INTEGER NOT NULL DEFAULT 1,
  
  -- CAE data from AFIP
  cae TEXT,
  cae_expiration DATE,
  
  -- Amounts
  total_amount DECIMAL(12, 2) NOT NULL,
  net_amount DECIMAL(12, 2),
  iva_amount DECIMAL(12, 2),
  
  -- Customer data
  customer_doc_type INTEGER, -- 80=CUIT, 96=DNI, 99=Consumidor Final
  customer_doc_number TEXT,
  customer_name TEXT,
  
  -- Status
  status TEXT DEFAULT 'issued' CHECK (status IN ('issued', 'cancelled', 'credited')),
  voided_by UUID REFERENCES public.invoices(id),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint
  UNIQUE(kiosko_id, invoice_type, point_of_sale, invoice_number)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_invoices_kiosko ON invoices(kiosko_id);
CREATE INDEX IF NOT EXISTS idx_invoices_sale ON invoices(sale_id);
CREATE INDEX IF NOT EXISTS idx_invoices_cae ON invoices(cae);
CREATE INDEX IF NOT EXISTS idx_invoices_created ON invoices(created_at);

-- RLS
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

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
  )
  WITH CHECK (