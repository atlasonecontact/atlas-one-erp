-- Create table for merchandise receipts (remitos)
CREATE TABLE IF NOT EXISTS merchandise_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kiosko_id UUID NOT NULL REFERENCES kioscos(id) ON DELETE CASCADE,
  purchase_id UUID REFERENCES purchases(id) ON DELETE SET NULL,
  receipt_number TEXT NOT NULL, -- Número de remito/factura
  receipt_date DATE NOT NULL,
  supplier_name TEXT NOT NULL,
  supplier_contact TEXT,
  receipt_photo_url TEXT, -- URL de la foto del remito
  received_by_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  received_by_name TEXT NOT NULL, -- Nombre del usuario que recibió
  total_amount NUMERIC(10, 2),
  notes TEXT,
  status TEXT DEFAULT 'received' CHECK (status IN ('received', 'verified', 'discrepancy', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_merchandise_receipts_kiosko ON merchandise_receipts(kiosko_id);
CREATE INDEX IF NOT EXISTS idx_merchandise_receipts_purchase ON merchandise_receipts(purchase_id);
CREATE INDEX IF NOT EXISTS idx_merchandise_receipts_employee ON merchandise_receipts(received_by_employee_id);
CREATE INDEX IF NOT EXISTS idx_merchandise_receipts_date ON merchandise_receipts(receipt_date);

-- Add RLS policies
ALTER TABLE merchandise_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees can view merchandise receipts"
  ON merchandise_receipts
  FOR SELECT
  USING (
    kiosko_id IN (
      SELECT kiosko_id FROM employees WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Employees can insert merchandise receipts"
  ON merchandise_receipts
  FOR INSERT
  WITH CHECK (
    kiosko_id IN (
      SELECT kiosko_id FROM employees WHERE user_id = auth.uid()
    )
  );

-- Create items table for merchandise receipt details
CREATE TABLE IF NOT EXISTS merchandise_receipt_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id UUID NOT NULL REFERENCES merchandise_receipts(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_cost NUMERIC(10, 2),
  subtotal NUMERIC(10, 2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_merchandise_receipt_items_receipt ON merchandise_receipt_items(receipt_id);
CREATE INDEX IF NOT EXISTS idx_merchandise_receipt_items_product ON merchandise_receipt_items(product_id);

-- Add RLS for items
ALTER TABLE merchandise_receipt_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees can manage receipt items"
  ON merchandise_receipt_items
  FOR ALL
  USING (
    receipt_id IN (
      SELECT id FROM merchandise_receipts WHERE kiosko_id IN (
        SELECT kiosko_id FROM employees WHERE user_id = auth.uid()
      )
    )
  );
