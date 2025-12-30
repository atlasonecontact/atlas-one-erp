-- Crear tabla para pagos a proveedores
CREATE TABLE IF NOT EXISTS supplier_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_id UUID REFERENCES purchases(id) ON DELETE CASCADE,
  kiosko_id UUID REFERENCES kioscos(id) ON DELETE CASCADE,
  payment_number TEXT NOT NULL,
  payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  amount NUMERIC(10, 2) NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'bank_transfer', 'check', 'debit_card', 'credit_card', 'mercadopago')),
  reference_number TEXT,
  notes TEXT,
  created_by UUID REFERENCES employees(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_supplier_payments_purchase ON supplier_payments(purchase_id);
CREATE INDEX IF NOT EXISTS idx_supplier_payments_kiosko ON supplier_payments(kiosko_id);
CREATE INDEX IF NOT EXISTS idx_supplier_payments_date ON supplier_payments(payment_date);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_supplier_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER supplier_payments_updated_at
  BEFORE UPDATE ON supplier_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_supplier_payments_updated_at();

-- Agregar campo payment_status a purchases si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'purchases' AND column_name = 'payment_status') THEN
    ALTER TABLE purchases ADD COLUMN payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('paid', 'unpaid', 'partial'));
  END IF;
END $$;

-- Agregar campo total_paid a purchases para tracking de pagos parciales
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'purchases' AND column_name = 'total_paid') THEN
    ALTER TABLE purchases ADD COLUMN total_paid NUMERIC(10, 2) DEFAULT 0;
  END IF;
END $$;

-- Función para actualizar el estado de pago de la OC
CREATE OR REPLACE FUNCTION update_purchase_payment_status()
RETURNS TRIGGER AS $$
DECLARE
  purchase_total NUMERIC;
  total_paid_amount NUMERIC;
BEGIN
  -- Obtener el total de la orden de compra
  SELECT total_amount INTO purchase_total FROM purchases WHERE id = NEW.purchase_id;
  
  -- Calcular el total pagado
  SELECT COALESCE(SUM(amount), 0) INTO total_paid_amount 
  FROM supplier_payments 
  WHERE purchase_id = NEW.purchase_id;
  
  -- Actualizar total_paid y payment_status en purchases
  UPDATE purchases 
  SET 
    total_paid = total_paid_amount,
    payment_status = CASE 
      WHEN total_paid_amount >= purchase_total THEN 'paid'
      WHEN total_paid_amount > 0 AND total_paid_amount < purchase_total THEN 'partial'
      ELSE 'unpaid'
    END
  WHERE id = NEW.purchase_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar estado de pago al insertar/actualizar/eliminar pagos
DROP TRIGGER IF EXISTS update_payment_status_on_insert ON supplier_payments;
CREATE TRIGGER update_payment_status_on_insert
  AFTER INSERT ON supplier_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_purchase_payment_status();

DROP TRIGGER IF EXISTS update_payment_status_on_update ON supplier_payments;
CREATE TRIGGER update_payment_status_on_update
  AFTER UPDATE ON supplier_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_purchase_payment_status();

-- Trigger para actualizar al eliminar pagos
CREATE OR REPLACE FUNCTION update_purchase_payment_status_on_delete()
RETURNS TRIGGER AS $$
DECLARE
  purchase_total NUMERIC;
  total_paid_amount NUMERIC;
BEGIN
  -- Obtener el total de la orden de compra
  SELECT total_amount INTO purchase_total FROM purchases WHERE id = OLD.purchase_id;
  
  -- Calcular el total pagado restante
  SELECT COALESCE(SUM(amount), 0) INTO total_paid_amount 
  FROM supplier_payments 
  WHERE purchase_id = OLD.purchase_id;
  
  -- Actualizar total_paid y payment_status en purchases
  UPDATE purchases 
  SET 
    total_paid = total_paid_amount,
    payment_status = CASE 
      WHEN total_paid_amount >= purchase_total THEN 'paid'
      WHEN total_paid_amount > 0 AND total_paid_amount < purchase_total THEN 'partial'
      ELSE 'unpaid'
    END
  WHERE id = OLD.purchase_id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_payment_status_on_delete ON supplier_payments;
CREATE TRIGGER update_payment_status_on_delete
  AFTER DELETE ON supplier_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_purchase_payment_status_on_delete();

-- Habilitar RLS
ALTER TABLE supplier_payments ENABLE ROW LEVEL SECURITY;

-- Política para que los empleados puedan ver y crear pagos
CREATE POLICY "Employees can manage supplier payments"
  ON supplier_payments
  FOR ALL
  USING (true);
