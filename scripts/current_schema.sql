-- =====================================================
-- ATLAS ONE ERP - ESQUEMA ACTUAL DE BASE DE DATOS
-- Generado: 2025-01-19
-- =====================================================

-- =====================================================
-- 1. PROFILES (Usuarios/Dueños)
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT,
    full_name TEXT,
    role TEXT DEFAULT 'owner',
    business_name TEXT,
    telegram_chat_id TEXT,
    whatsapp_phone TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 2. SUBSCRIPTION_PLANS (Planes de suscripción)
-- =====================================================
CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_name TEXT NOT NULL,
    display_name TEXT NOT NULL,
    price NUMERIC NOT NULL,
    max_employees INTEGER,
    max_products INTEGER,
    features JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 3. KIOSCOS (Puntos de venta del usuario)
-- =====================================================
CREATE TABLE IF NOT EXISTS kioscos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_plan_id UUID REFERENCES subscription_plans(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    location TEXT,
    city TEXT,
    phone TEXT,
    cuit TEXT NOT NULL,
    theme_color TEXT DEFAULT '#06b6d4',
    accent_color TEXT DEFAULT '#00d9ff',
    background_color TEXT DEFAULT '#0f172a',
    status TEXT DEFAULT 'active',
    whatsapp_phone TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 4. EMPLOYEES (Empleados de cada kiosco)
-- =====================================================
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kiosko_id UUID NOT NULL REFERENCES kioscos(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    username TEXT NOT NULL,
    name TEXT NOT NULL,
    position TEXT,
    custom_role TEXT,
    permissions JSONB DEFAULT '{"can_sell": true, "can_manage_cash": false, "can_view_reports": false, "can_manage_products": false}'::jsonb,
    salary NUMERIC,
    hire_date DATE DEFAULT CURRENT_DATE,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 5. PRODUCTS (Productos de cada kiosco)
-- =====================================================
CREATE TABLE IF NOT EXISTS products (
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
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 6. SALES (Ventas)
-- =====================================================
CREATE TABLE IF NOT EXISTS sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kiosko_id UUID NOT NULL REFERENCES kioscos(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    sale_number TEXT NOT NULL,
    total_amount NUMERIC NOT NULL,
    payment_method TEXT,
    status TEXT DEFAULT 'completed',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 7. SALE_ITEMS (Items de cada venta)
-- =====================================================
CREATE TABLE IF NOT EXISTS sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC NOT NULL,
    subtotal NUMERIC NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 8. PURCHASES (Compras a proveedores)
-- =====================================================
CREATE TABLE IF NOT EXISTS purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kiosko_id UUID NOT NULL REFERENCES kioscos(id) ON DELETE CASCADE,
    supplier_name TEXT NOT NULL,
    supplier_contact TEXT,
    purchase_number TEXT NOT NULL,
    total_amount NUMERIC NOT NULL,
    status TEXT DEFAULT 'completed',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 9. PURCHASE_ITEMS (Items de cada compra)
-- =====================================================
CREATE TABLE IF NOT EXISTS purchase_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL,
    unit_cost NUMERIC NOT NULL,
    subtotal NUMERIC NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 10. STOCK_MOVEMENTS (Movimientos de inventario)
-- =====================================================
CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    kiosko_id UUID NOT NULL REFERENCES kioscos(id) ON DELETE CASCADE,
    movement_type TEXT NOT NULL, -- 'in', 'out', 'adjustment'
    quantity INTEGER NOT NULL,
    reason TEXT,
    reference_id UUID, -- sale_id, purchase_id, etc.
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 11. CASH_REGISTERS (Cajas registradoras)
-- =====================================================
CREATE TABLE IF NOT EXISTS cash_registers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kiosko_id UUID NOT NULL REFERENCES kioscos(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    opening_balance NUMERIC DEFAULT 0,
    closing_balance NUMERIC,
    status TEXT DEFAULT 'open', -- 'open', 'closed'
    opened_at TIMESTAMPTZ DEFAULT now(),
    closed_at TIMESTAMPTZ
);

-- =====================================================
-- 12. CASH_REGISTER_TRANSACTIONS (Movimientos de caja)
-- =====================================================
CREATE TABLE IF NOT EXISTS cash_register_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cash_register_id UUID NOT NULL REFERENCES cash_registers(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'sale', 'refund', 'deposit', 'withdrawal'
    amount NUMERIC NOT NULL,
    payment_method TEXT,
    reference_id UUID, -- sale_id, etc.
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 13. NOTIFICATION_CONFIGS (Configuración de notificaciones por kiosco)
-- =====================================================
CREATE TABLE IF NOT EXISTS notification_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kiosko_id UUID NOT NULL REFERENCES kioscos(id) ON DELETE CASCADE,
    whatsapp_enabled BOOLEAN DEFAULT false,
    whatsapp_phone TEXT,
    whatsapp_verified BOOLEAN DEFAULT false,
    telegram_enabled BOOLEAN DEFAULT false,
    telegram_chat_id TEXT,
    telegram_phone TEXT,
    telegram_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 14. PHONE_VERIFICATIONS (Verificación de teléfonos)
-- =====================================================
CREATE TABLE IF NOT EXISTS phone_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kiosko_id UUID NOT NULL REFERENCES kioscos(id) ON DELETE CASCADE,
    phone_number TEXT NOT NULL,
    verification_code TEXT NOT NULL,
    verified BOOLEAN DEFAULT false,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- ÍNDICES PARA MEJOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_kioscos_owner_id ON kioscos(owner_id);
CREATE INDEX IF NOT EXISTS idx_employees_kiosko_id ON employees(kiosko_id);
CREATE INDEX IF NOT EXISTS idx_products_kiosko_id ON products(kiosko_id);
CREATE INDEX IF NOT EXISTS idx_sales_kiosko_id ON sales(kiosko_id);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_purchases_kiosko_id ON purchases(kiosko_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_cash_registers_kiosko_id ON cash_registers(kiosko_id);

-- =====================================================
-- DATOS INICIALES: PLANES DE SUSCRIPCIÓN
-- =====================================================
INSERT INTO subscription_plans (plan_name, display_name, price, max_employees, max_products, features)
VALUES 
    ('free', 'Gratis', 0, 1, 50, '["Gestión básica de inventario", "Registro de ventas", "1 empleado"]'),
    ('starter', 'Inicial', 2999, 3, 200, '["Todo lo del plan Gratis", "Hasta 3 empleados", "Reportes básicos", "Soporte por email"]'),
    ('professional', 'Profesional', 5999, 10, 1000, '["Todo lo del plan Inicial", "Hasta 10 empleados", "Reportes avanzados", "Notificaciones WhatsApp/Telegram", "Soporte prioritario"]'),
    ('business', 'Empresarial', 9999, 25, 5000, '["Todo lo del plan Profesional", "Hasta 25 empleados", "Multi-sucursal", "API acceso", "Soporte 24/7"]'),
    ('enterprise', 'Corporativo', 19999, NULL, NULL, '["Empleados ilimitados", "Productos ilimitados", "Personalización completa", "Gerente de cuenta dedicado"]'),
    ('unlimited', 'Ilimitado', 49999, NULL, NULL, '["Todo ilimitado", "Desarrollo a medida", "SLA garantizado", "Soporte on-site"]')
ON CONFLICT DO NOTHING;

-- =====================================================
-- NOTA: RLS está deshabilitado temporalmente
-- En producción, habilitar RLS y crear políticas apropiadas
-- =====================================================
