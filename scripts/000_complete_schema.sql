-- =====================================================
-- ATLAS ONE ERP - Schema Completo V2
-- Este script BORRA TODO y recrea la base de datos
-- =====================================================

-- Borrar todas las tablas existentes con CASCADE
DROP TABLE IF EXISTS phone_verifications CASCADE;
DROP TABLE IF EXISTS notification_configs CASCADE;
DROP TABLE IF EXISTS subscription_plans CASCADE;
DROP TABLE IF EXISTS purchase_items CASCADE;
DROP TABLE IF EXISTS purchases CASCADE;
DROP TABLE IF EXISTS cash_register_transactions CASCADE;
DROP TABLE IF EXISTS cash_registers CASCADE;
DROP TABLE IF EXISTS sale_items CASCADE;
DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS stock_movements CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS kioscos CASCADE;
DROP TABLE IF EXISTS chains CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Borrar funciones existentes
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS update_stock_on_sale() CASCADE;
DROP FUNCTION IF EXISTS update_stock_on_purchase() CASCADE;
DROP FUNCTION IF EXISTS generate_sale_number() CASCADE;
DROP FUNCTION IF EXISTS generate_purchase_number() CASCADE;
DROP FUNCTION IF EXISTS find_user_by_username_or_email(TEXT) CASCADE;
DROP FUNCTION IF EXISTS create_chain_for_new_user() CASCADE;

-- Extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- TABLAS
-- =====================================================

-- Perfiles de usuario (sin columna email, se obtiene de auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  full_name TEXT,
  role TEXT DEFAULT 'owner' CHECK (role IN ('owner', 'employee')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cadenas
CREATE TABLE chains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(owner_id)
);

-- Kioscos con CUIT obligatorio
CREATE TABLE kioscos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chain_id UUID NOT NULL REFERENCES chains(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location TEXT,
  city TEXT,
  phone TEXT,
  cuit TEXT NOT NULL,
  subscription_plan_id UUID,
  theme_color TEXT DEFAULT '#06b6d4',
  background_color TEXT DEFAULT '#0f172a',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Empleados
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kiosko_id UUID NOT NULL REFERENCES kioscos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  username TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  position TEXT,
  custom_role TEXT,
  permissions JSONB DEFAULT '{"can_sell": true, "can_view_reports": false, "can_manage_products": false, "can_manage_cash": false}'::jsonb,
  salary DECIMAL(10, 2),
  hire_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Productos
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kiosko_id UUID NOT NULL REFERENCES kioscos(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  sku TEXT,
  barcode TEXT,
  category TEXT,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  cost DECIMAL(10, 2) DEFAULT 0,
  stock_quantity INTEGER DEFAULT 0,
  min_stock_level INTEGER DEFAULT 10,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Movimientos de stock
CREATE TABLE stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  kiosko_id UUID NOT NULL REFERENCES kioscos(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('in', 'out', 'adjustment')),
  quantity INTEGER NOT NULL,
  reason TEXT,
  reference_id UUID,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ventas con total_amount
CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kiosko_id UUID NOT NULL REFERENCES kioscos(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id),
  sale_number TEXT UNIQUE NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('cash', 'card', 'transfer', 'qr')),
  status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Items de venta
CREATE TABLE sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cajas registradoras
CREATE TABLE cash_registers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kiosko_id UUID NOT NULL REFERENCES kioscos(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id),
  opening_balance DECIMAL(10, 2) DEFAULT 0,
  closing_balance DECIMAL(10, 2),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  opened_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);

-- Transacciones de caja
CREATE TABLE cash_register_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cash_register_id UUID NOT NULL REFERENCES cash_registers(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('sale', 'expense', 'withdrawal', 'deposit')),
  amount DECIMAL(10, 2) NOT NULL,
  payment_method TEXT,
  reference_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Compras
CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kiosko_id UUID NOT NULL REFERENCES kioscos(id) ON DELETE CASCADE,
  supplier_name TEXT NOT NULL,
  supplier_contact TEXT,
  purchase_number TEXT UNIQUE NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Items de compra
CREATE TABLE purchase_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL,
  unit_cost DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Planes de suscripción (catálogo)
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  max_employees INTEGER,
  max_products INTEGER,
  features JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Configuración de notificaciones
CREATE TABLE notification_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kiosko_id UUID NOT NULL REFERENCES kioscos(id) ON DELETE CASCADE UNIQUE,
  whatsapp_enabled BOOLEAN DEFAULT false,
  whatsapp_phone TEXT,
  whatsapp_verified BOOLEAN DEFAULT false,
  telegram_enabled BOOLEAN DEFAULT false,
  telegram_chat_id TEXT,
  telegram_phone TEXT,
  telegram_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Verificaciones telefónicas
CREATE TABLE phone_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kiosko_id UUID NOT NULL REFERENCES kioscos(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  verification_code TEXT NOT NULL,
  verified BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES
-- =====================================================

CREATE INDEX idx_chains_owner ON chains(owner_id);
CREATE INDEX idx_kioscos_chain ON kioscos(chain_id);
CREATE INDEX idx_employees_kiosko ON employees(kiosko_id);
CREATE INDEX idx_employees_user ON employees(user_id);
CREATE INDEX idx_products_kiosko ON products(kiosko_id);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_sales_kiosko ON sales(kiosko_id);
CREATE INDEX idx_sales_employee ON sales(employee_id);
CREATE INDEX idx_sales_created ON sales(created_at DESC);
CREATE INDEX idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX idx_sale_items_product ON sale_items(product_id);
CREATE INDEX idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX idx_purchases_kiosko ON purchases(kiosko_id);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE chains ENABLE ROW LEVEL SECURITY;
ALTER TABLE kioscos ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_registers ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- Políticas RLS simplificadas sin recursión

-- Profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Chains
CREATE POLICY "Users can view own chains" ON chains
  FOR ALL USING (auth.uid() = owner_id);

-- Kioscos
CREATE POLICY "Owners can manage kioscos" ON kioscos
  FOR ALL USING (
    EXISTS (SELECT 1 FROM chains WHERE chains.id = kioscos.chain_id AND chains.owner_id = auth.uid())
  );

CREATE POLICY "Employees can view their kiosko" ON kioscos
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM employees WHERE employees.kiosko_id = kioscos.id AND employees.user_id = auth.uid())
  );

-- Employees
CREATE POLICY "Owners can manage employees" ON employees
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM kioscos k
      JOIN chains c ON c.id = k.chain_id
      WHERE k.id = employees.kiosko_id AND c.owner_id = auth.uid()
    )
  );

CREATE POLICY "Employees can view own record" ON employees
  FOR SELECT USING (user_id = auth.uid());

-- Products
CREATE POLICY "Owners can manage products" ON products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM kioscos k
      JOIN chains c ON c.id = k.chain_id
      WHERE k.id = products.kiosko_id AND c.owner_id = auth.uid()
    )
  );

CREATE POLICY "Employees can view products" ON products
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM employees WHERE employees.kiosko_id = products.kiosko_id AND employees.user_id = auth.uid())
  );

-- Sales
CREATE POLICY "Owners can view all sales" ON sales
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM kioscos k
      JOIN chains c ON c.id = k.chain_id
      WHERE k.id = sales.kiosko_id AND c.owner_id = auth.uid()
    )
  );

CREATE POLICY "Owners can insert sales" ON sales
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM kioscos k
      JOIN chains c ON c.id = k.chain_id
      WHERE k.id = sales.kiosko_id AND c.owner_id = auth.uid()
    )
  );

CREATE POLICY "Employees can create sales" ON sales
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.kiosko_id = sales.kiosko_id
      AND employees.user_id = auth.uid()
      AND (employees.permissions->>'can_sell')::boolean = true
    )
  );

CREATE POLICY "Employees can view own sales" ON sales
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM employees WHERE employees.id = sales.employee_id AND employees.user_id = auth.uid())
  );

-- Sale Items
CREATE POLICY "Users can manage sale_items" ON sale_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM sales s
      JOIN kioscos k ON k.id = s.kiosko_id
      JOIN chains c ON c.id = k.chain_id
      WHERE s.id = sale_items.sale_id AND c.owner_id = auth.uid()
    )
  );

-- Purchases
CREATE POLICY "Owners can manage purchases" ON purchases
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM kioscos k
      JOIN chains c ON c.id = k.chain_id
      WHERE k.id = purchases.kiosko_id AND c.owner_id = auth.uid()
    )
  );

-- Cash Registers
CREATE POLICY "Owners can manage cash_registers" ON cash_registers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM kioscos k
      JOIN chains c ON c.id = k.chain_id
      WHERE k.id = cash_registers.kiosko_id AND c.owner_id = auth.uid()
    )
  );

CREATE POLICY "Employees can manage own cash_register" ON cash_registers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM employees WHERE employees.id = cash_registers.employee_id AND employees.user_id = auth.uid())
  );

-- Notification Configs
CREATE POLICY "Owners can manage notification configs" ON notification_configs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM kioscos k
      JOIN chains c ON c.id = k.chain_id
      WHERE k.id = notification_configs.kiosko_id AND c.owner_id = auth.uid()
    )
  );

-- Subscription Plans (todos pueden ver)
CREATE POLICY "Everyone can view plans" ON subscription_plans
  FOR SELECT USING (true);

-- =====================================================
-- FUNCIONES Y TRIGGERS
-- =====================================================

-- Actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chains_updated_at BEFORE UPDATE ON chains
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kioscos_updated_at BEFORE UPDATE ON kioscos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_configs_updated_at BEFORE UPDATE ON notification_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Actualizar stock en ventas
CREATE OR REPLACE FUNCTION update_stock_on_sale()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products 
  SET stock_quantity = stock_quantity - NEW.quantity
  WHERE id = NEW.product_id;
  
  INSERT INTO stock_movements (product_id, kiosko_id, movement_type, quantity, reason, reference_id)
  SELECT p.id, p.kiosko_id, 'out', NEW.quantity, 'Venta', NEW.sale_id
  FROM products p WHERE p.id = NEW.product_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_stock_on_sale
AFTER INSERT ON sale_items
FOR EACH ROW EXECUTE FUNCTION update_stock_on_sale();

-- Actualizar stock en compras
CREATE OR REPLACE FUNCTION update_stock_on_purchase()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products 
  SET stock_quantity = stock_quantity + NEW.quantity
  WHERE id = NEW.product_id;
  
  INSERT INTO stock_movements (product_id, kiosko_id, movement_type, quantity, reason, reference_id)
  SELECT p.id, p.kiosko_id, 'in', NEW.quantity, 'Compra', NEW.purchase_id
  FROM products p WHERE p.id = NEW.product_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_stock_on_purchase
AFTER INSERT ON purchase_items
FOR EACH ROW EXECUTE FUNCTION update_stock_on_purchase();

-- Generar sale_number
CREATE OR REPLACE FUNCTION generate_sale_number()
RETURNS TRIGGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO v_count FROM sales WHERE kiosko_id = NEW.kiosko_id;
  NEW.sale_number = 'V-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(v_count::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_sale_number
BEFORE INSERT ON sales
FOR EACH ROW EXECUTE FUNCTION generate_sale_number();

-- Generar purchase_number
CREATE OR REPLACE FUNCTION generate_purchase_number()
RETURNS TRIGGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO v_count FROM purchases WHERE kiosko_id = NEW.kiosko_id;
  NEW.purchase_number = 'C-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(v_count::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_purchase_number
BEFORE INSERT ON purchases
FOR EACH ROW EXECUTE FUNCTION generate_purchase_number();

-- Función para buscar usuario
CREATE OR REPLACE FUNCTION find_user_by_username_or_email(p_identifier TEXT)
RETURNS TABLE(user_id UUID, user_email TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT e.user_id, au.email
  FROM employees e
  JOIN auth.users au ON au.id = e.user_id
  WHERE e.username = p_identifier
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT au.id, au.email
    FROM auth.users au
    WHERE au.email = p_identifier
    LIMIT 1;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear cadena automáticamente al registrarse
CREATE OR REPLACE FUNCTION create_chain_for_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_chain_name TEXT;
  v_full_name TEXT;
BEGIN
  -- Get metadata from user signup
  v_chain_name := COALESCE(NEW.raw_user_meta_data->>'chain_name', 'Mi Cadena');
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email);
  
  -- Create chain first (if it doesn't exist)
  IF NOT EXISTS (SELECT 1 FROM chains WHERE owner_id = NEW.id) THEN
    INSERT INTO chains (owner_id, name, created_at, updated_at)
    VALUES (NEW.id, v_chain_name, NOW(), NOW());
  END IF;
  
  -- Create profile without email column (auth.users already has it)
  INSERT INTO profiles (id, username, full_name, role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    v_full_name,
    'owner',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    full_name = EXCLUDED.full_name,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create chain and profile automatically on user registration
DROP TRIGGER IF EXISTS on_auth_user_created_create_chain ON auth.users;
CREATE TRIGGER on_auth_user_created_create_chain
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_chain_for_new_user();

-- =====================================================
-- DATOS INICIALES
-- =====================================================

-- Planes de suscripción
INSERT INTO subscription_plans (plan_name, display_name, price, max_employees, max_products, features) VALUES
('basic', 'Plan Básico', 9999.00, 3, 100, '["Gestión de ventas", "Control de stock básico", "1 kiosco"]'::jsonb),
('professional', 'Plan Profesional', 19999.00, 10, 500, '["Gestión de ventas", "Control de stock avanzado", "Reportes detallados", "3 kioscos", "Notificaciones WhatsApp"]'::jsonb),
('enterprise', 'Plan Empresarial', 39999.00, null, null, '["Todo lo del Plan Profesional", "Kioscos ilimitados", "Empleados ilimitados", "Productos ilimitados", "Soporte prioritario", "API personalizada"]'::jsonb);

-- =====================================================
-- INSTRUCCIONES PARA CREAR USUARIO DEMO
-- =====================================================

/*
IMPORTANTE: El usuario demo debe crearse manualmente desde el panel de Supabase:

1. Ve a Authentication > Users en tu dashboard de Supabase
2. Haz clic en "Add User"
3. Completa los datos:
   - Email: demo@atlasone.com
   - Password: demo123456
   - Auto Confirm User: YES (importante)
4. Haz clic en "Create User"

Después de crear el usuario, ejecuta este script para crear datos demo:
*/

-- Script para agregar datos demo (ejecutar DESPUÉS de crear el usuario)
DO $$
DECLARE
  v_demo_user_id UUID;
  v_chain_id UUID;
  v_kiosko_id UUID;
BEGIN
  SELECT id INTO v_demo_user_id FROM auth.users WHERE email = 'demo@atlasone.com';
  
  IF v_demo_user_id IS NOT NULL THEN
    -- Crear cadena demo
    INSERT INTO chains (name, owner_id)
    VALUES ('Cadena Demo', v_demo_user_id)
    ON CONFLICT (owner_id) DO UPDATE SET name = 'Cadena Demo'
    RETURNING id INTO v_chain_id;
    
    -- Crear kiosko demo
    INSERT INTO kioscos (chain_id, name, location, city, phone, cuit, subscription_plan_id)
    SELECT 
      v_chain_id, 
      'Kiosko Central', 
      'Av. Principal 123', 
      'Buenos Aires', 
      '+54 11 1234-5678',
      '20-12345678-9',
      (SELECT id FROM subscription_plans WHERE plan_name = 'professional')
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_kiosko_id;
    
    -- Si no se insertó (ya existe), obtener el id
    IF v_kiosko_id IS NULL THEN
      SELECT id INTO v_kiosko_id FROM kioscos WHERE chain_id = v_chain_id LIMIT 1;
    END IF;
    
    -- Crear productos demo (solo si no existen)
    INSERT INTO products (kiosko_id, name, category, price, cost, stock_quantity, sku)
    SELECT v_kiosko_id, 'Coca Cola 500ml', 'Bebidas', 250.00, 150.00, 100, 'BEB001'
    WHERE NOT EXISTS (SELECT 1 FROM products WHERE kiosko_id = v_kiosko_id AND sku = 'BEB001');
    
    INSERT INTO products (kiosko_id, name, category, price, cost, stock_quantity, sku)
    SELECT v_kiosko_id, 'Pepsi 500ml', 'Bebidas', 240.00, 145.00, 80, 'BEB002'
    WHERE NOT EXISTS (SELECT 1 FROM products WHERE kiosko_id = v_kiosko_id AND sku = 'BEB002');
    
    INSERT INTO products (kiosko_id, name, category, price, cost, stock_quantity, sku)
    SELECT v_kiosko_id, 'Agua Mineral 500ml', 'Bebidas', 180.00, 100.00, 150, 'BEB003'
    WHERE NOT EXISTS (SELECT 1 FROM products WHERE kiosko_id = v_kiosko_id AND sku = 'BEB003');
    
    INSERT INTO products (kiosko_id, name, category, price, cost, stock_quantity, sku)
    SELECT v_kiosko_id, 'Galletas Oreo', 'Snacks', 320.00, 200.00, 60, 'SNK001'
    WHERE NOT EXISTS (SELECT 1 FROM products WHERE kiosko_id = v_kiosko_id AND sku = 'SNK001');
    
    INSERT INTO products (kiosko_id, name, category, price, cost, stock_quantity, sku)
    SELECT v_kiosko_id, 'Papas Lays', 'Snacks', 380.00, 230.00, 75, 'SNK002'
    WHERE NOT EXISTS (SELECT 1 FROM products WHERE kiosko_id = v_kiosko_id AND sku = 'SNK002');
    
    INSERT INTO products (kiosko_id, name, category, price, cost, stock_quantity, sku)
    SELECT v_kiosko_id, 'Chocolate Milka', 'Golosinas', 450.00, 280.00, 50, 'GOL001'
    WHERE NOT EXISTS (SELECT 1 FROM products WHERE kiosko_id = v_kiosko_id AND sku = 'GOL001');
    
    INSERT INTO products (kiosko_id, name, category, price, cost, stock_quantity, sku)
    SELECT v_kiosko_id, 'Chicles Beldent', 'Golosinas', 120.00, 70.00, 120, 'GOL002'
    WHERE NOT EXISTS (SELECT 1 FROM products WHERE kiosko_id = v_kiosko_id AND sku = 'GOL002');
    
    INSERT INTO products (kiosko_id, name, category, price, cost, stock_quantity, sku)
    SELECT v_kiosko_id, 'Cigarrillos Marlboro', 'Cigarrillos', 850.00, 650.00, 40, 'CIG001'
    WHERE NOT EXISTS (SELECT 1 FROM products WHERE kiosko_id = v_kiosko_id AND sku = 'CIG001');
    
    RAISE NOTICE 'Datos demo creados exitosamente para kiosko_id: %', v_kiosko_id;
  ELSE
    RAISE NOTICE 'Usuario demo no encontrado. Por favor créalo primero en Supabase Auth.';
  END IF;
END $$;

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================
