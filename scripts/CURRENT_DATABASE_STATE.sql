-- ====================================================
-- ESTADO ACTUAL DE LA BASE DE DATOS
-- Generado después de todas las migraciones
-- ====================================================

-- NOTA: La tabla "chains" fue ELIMINADA completamente
-- Los kioscos ahora pertenecen directamente al owner_id (usuario)

-- ====================================================
-- TABLA: profiles
-- ====================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  full_name TEXT,
  role TEXT DEFAULT 'owner',
  business_name TEXT,
  telegram_chat_id TEXT,
  whatsapp_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: HABILITADO
-- Políticas:
-- - profiles_select: SELECT USING (id = auth.uid())
-- - profiles_update: UPDATE USING (id = auth.uid())
-- - profiles_insert: INSERT WITH CHECK (id = auth.uid())

-- ====================================================
-- TABLA: subscription_plans
-- ====================================================
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  max_employees INTEGER,
  max_products INTEGER,
  features JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: DESHABILITADO (acceso público de lectura)

-- ====================================================
-- TABLA: kioscos
-- ====================================================
CREATE TABLE kioscos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location TEXT,
  city TEXT,
  phone TEXT,
  cuit TEXT NOT NULL,
  whatsapp_phone TEXT,
  subscription_plan_id UUID REFERENCES subscription_plans(id) ON DELETE SET NULL,
  theme_color TEXT DEFAULT '#06b6d4',
  accent_color TEXT DEFAULT '#00d9ff',
  background_color TEXT DEFAULT '#0f172a',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: DESHABILITADO (simplificado temporalmente)
-- TODO: Re-habilitar con políticas no recursivas

-- ====================================================
-- TABLA: employees
-- ====================================================
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kiosko_id UUID NOT NULL REFERENCES kioscos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  username TEXT NOT NULL,
  name TEXT NOT NULL,
  position TEXT,
  custom_role TEXT,
  permissions JSONB DEFAULT '{"can_sell": true, "can_manage_cash": false, "can_view_reports": false, "can_manage_products": false}',
  salary NUMERIC,
  hire_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: DESHABILITADO

-- ====================================================
-- TABLA: products
-- ====================================================
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kiosko_id UUID NOT NULL REFERENCES kioscos(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  sku TEXT,
  barcode TEXT,
  category TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  cost NUMERIC DEFAULT 0,
  stock_quantity INTEGER DEFAULT 0,
  min_stock_level INTEGER DEFAULT 10,
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: DESHABILITADO

-- ====================================================
-- TABLA: sales
-- ====================================================
CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kiosko_id UUID NOT NULL REFERENCES kioscos(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id),
  sale_number TEXT NOT NULL,
  total_amount NUMERIC NOT NULL,
  payment_method TEXT,
  status TEXT DEFAULT 'completed',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: DESHABILITADO

-- ====================================================
-- TABLA: sale_items
-- ====================================================
CREATE TABLE sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL,
  unit_price NUMERIC NOT NULL,
  subtotal NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: DESHABILITADO

-- ====================================================
-- TABLA: purchases
-- ====================================================
CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kiosko_id UUID NOT NULL REFERENCES kioscos(id) ON DELETE CASCADE,
  supplier_name TEXT NOT NULL,
  supplier_contact TEXT,
  purchase_number TEXT NOT NULL,
  total_amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'completed',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: DESHABILITADO

-- ====================================================
-- TABLA: purchase_items
-- ====================================================
CREATE TABLE purchase_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL,
  unit_cost NUMERIC NOT NULL,
  subtotal NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: DESHABILITADO

-- ====================================================
-- TABLA: stock_movements
-- ====================================================
CREATE TABLE stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  kiosko_id UUID NOT NULL REFERENCES kioscos(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  reason TEXT,
  reference_id UUID,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: DESHABILITADO

-- ====================================================
-- TABLA: cash_registers
-- ====================================================
CREATE TABLE cash_registers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kiosko_id UUID NOT NULL REFERENCES kioscos(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id),
  opening_balance NUMERIC DEFAULT 0,
  closing_balance NUMERIC,
  status TEXT DEFAULT 'open',
  opened_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);

-- RLS: DESHABILITADO

-- ====================================================
-- TABLA: cash_register_transactions
-- ====================================================
CREATE TABLE cash_register_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cash_register_id UUID NOT NULL REFERENCES cash_registers(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  payment_method TEXT,
  reference_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: DESHABILITADO

-- ====================================================
-- TABLA: notification_configs
-- ====================================================
CREATE TABLE notification_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kiosko_id UUID NOT NULL REFERENCES kioscos(id) ON DELETE CASCADE,
  whatsapp_enabled BOOLEAN DEFAULT FALSE,
  whatsapp_phone TEXT,
  whatsapp_verified BOOLEAN DEFAULT FALSE,
  telegram_enabled BOOLEAN DEFAULT FALSE,
  telegram_chat_id TEXT,
  telegram_phone TEXT,
  telegram_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: DESHABILITADO

-- ====================================================
-- TABLA: phone_verifications
-- ====================================================
CREATE TABLE phone_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kiosko_id UUID NOT NULL REFERENCES kioscos(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  verification_code TEXT NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: DESHABILITADO

-- ====================================================
-- RESUMEN DE CAMBIOS PRINCIPALES
-- ====================================================

-- 1. ELIMINADO: tabla "chains" completa
-- 2. AGREGADO: profiles.business_name, profiles.telegram_chat_id, profiles.whatsapp_phone
-- 3. AGREGADO: kioscos.owner_id (FK a auth.users)
-- 4. AGREGADO: kioscos.whatsapp_phone, kioscos.accent_color, kioscos.status
-- 5. ELIMINADO: kioscos.chain_id
-- 6. RLS: Deshabilitado en todas las tablas excepto profiles
-- 7. subscription_plans: Acceso público (sin RLS)

-- ====================================================
-- PRÓXIMOS PASOS RECOMENDADOS
-- ====================================================

-- 1. Habilitar RLS correctamente en todas las tablas
-- 2. Crear políticas simples basadas en owner_id:
--    - kioscos: WHERE owner_id = auth.uid()
--    - employees, products, etc: JOIN con kioscos WHERE kioscos.owner_id = auth.uid()
-- 3. Mover telegram_chat_id y whatsapp_phone de kioscos a profiles (dueño)
-- 4. Crear índices para mejorar performance de las consultas por owner_id
