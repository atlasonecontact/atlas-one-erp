-- Add CUIT and phone fields to kioscos table
ALTER TABLE kioscos
ADD COLUMN IF NOT EXISTS cuit TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Update existing records to have default values
UPDATE kioscos SET cuit = '' WHERE cuit IS NULL;
UPDATE kioscos SET phone = whatsapp_phone WHERE phone IS NULL;
