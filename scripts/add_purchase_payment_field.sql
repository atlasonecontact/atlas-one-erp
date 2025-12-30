-- Add payment_status field to purchases table
ALTER TABLE purchases 
ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'unpaid' CHECK (payment_status IN ('paid', 'unpaid', 'partial'));

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_purchases_payment_status ON purchases(payment_status);

COMMENT ON COLUMN purchases.payment_status IS 'Payment status of the purchase order: paid, unpaid, or partial';
