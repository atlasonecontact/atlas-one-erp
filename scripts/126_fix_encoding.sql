-- Fix legacy Latin-1 data so accents and ñ render correctly
-- Safe because LATIN1<->UTF8 round-trips for already-correct text
SET client_encoding = 'UTF8';

-- Products used in stock alerts/receipts
-- Strip the replacement char before re-encoding to avoid LATIN1 errors
UPDATE products
SET name = convert_from(convert_to(replace(name, '�', ''), 'LATIN1'), 'UTF8')
WHERE name ~ '[�ÃÂ]';

UPDATE products
SET description = convert_from(convert_to(replace(description, '�', ''), 'LATIN1'), 'UTF8')
WHERE description IS NOT NULL AND description ~ '[�ÃÂ]';

-- Sale items keep a denormalized product_name used on tickets/facturas
DO $$
BEGIN
	IF EXISTS (
		SELECT 1 FROM information_schema.columns
		WHERE table_name = 'sale_items' AND column_name = 'product_name'
	) THEN
		UPDATE sale_items
		SET product_name = convert_from(convert_to(replace(product_name, '�', ''), 'LATIN1'), 'UTF8')
		WHERE product_name ~ '[�ÃÂ]';
	END IF;
END $$;
