-- Modernización: Sistema Multi-Tenant (Cadenas → Kioscos → Empleados)
-- Este script transforma el sistema de single-tenant a multi-tenant

-- 1. Crear tabla de Cadenas (Chains)
CREATE TABLE IF NOT EXISTS chains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(owner_id)
);

-- 2. Crear tabla de Planes de Suscripción
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  features JSONB DEFAULT '{}',
  max_employees INTEGER DEFAULT 5,
  max_products INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar planes predeterminados
INSERT INTO subscription_plans (name, price, features, max_employees, max_products) VALUES
  ('Básico', 0, '{"notifications": false, "reports": "basic", "integrations": false}', 2, 50),
  ('Profesional', 29.99, '{"notifications": true, "reports": "advanced", "integrations": true}', 10, 500),
  ('Empresarial', 99.99, '{"notifications": true, "reports": "premium", "integrations": true, "multi_kiosko": true}', 50, 5000)
ON CONFLICT DO NOTHING;

-- 3. Modificar tabla businesses → kioscos
ALTER TABLE businesses RENAME TO kioscos;

-- Agregar columnas necesarias para multi-tenant
ALTER TABLE kioscos 
  ADD COLUMN IF NOT EXISTS chain_id UUID REFERENCES chains(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS subscription_plan_id UUID REFERENCES subscription_plans(id),
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS whatsapp_phone TEXT,
  ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  ADD COLUMN IF NOT EXISTS background_color TEXT DEFAULT '#000000',
  ADD COLUMN IF NOT EXISTS accent_color TEXT DEFAULT '#00d9ff';

-- 4. Actualizar tabla employees para roles personalizados
ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS kiosko_id UUID REFERENCES kioscos(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS auto_generated_email TEXT,
  ADD COLUMN IF NOT EXISTS custom_role TEXT,
  ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{"can_sell": true, "can_view_reports": false, "can_manage_inventory": false, "can_manage_employees": false}',
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 5. Actualizar tabla sales para tracking multi-kiosko
ALTER TABLE sales
  ADD COLUMN IF NOT EXISTS kiosko_id UUID REFERENCES kioscos(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS employee_id UUID REFERENCES employees(id),
  ADD COLUMN IF NOT EXISTS sale_type TEXT DEFAULT 'owner' CHECK (sale_type IN ('owner', 'employee'));

-- 6. Actualizar tabla products para ser por kiosko
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS kiosko_id UUID REFERENCES kioscos(id) ON DELETE CASCADE;

-- 7. Crear tabla de verificación de números telefónicos
CREATE TABLE IF NOT EXISTS phone_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kiosko_id UUID NOT NULL REFERENCES kioscos(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  verification_code TEXT,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours'
);

-- 8. Crear índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_chains_owner ON chains(owner_id);
CREATE INDEX IF NOT EXISTS idx_kioscos_chain ON kioscos(chain_id);
CREATE INDEX IF NOT EXISTS idx_employees_kiosko ON employees(kiosko_id);
CREATE INDEX IF NOT EXISTS idx_employees_user ON employees(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_kiosko ON sales(kiosko_id);
CREATE INDEX IF NOT EXISTS idx_sales_employee ON sales(employee_id);
CREATE INDEX IF NOT EXISTS idx_products_kiosko ON products(kiosko_id);
CREATE INDEX IF NOT EXISTS idx_phone_verifications_kiosko ON phone_verifications(kiosko_id);

-- 9. Crear función para auto-generar credenciales de empleados
CREATE OR REPLACE FUNCTION generate_employee_credentials(
  p_first_name TEXT,
  p_last_name TEXT,
  p_kiosko_id UUID
) RETURNS TABLE (email TEXT, password TEXT) AS $$
DECLARE
  v_email TEXT;
  v_password TEXT;
  v_counter INTEGER := 0;
BEGIN
  -- Generar email único
  v_email := LOWER(REGEXP_REPLACE(p_first_name, '[^a-zA-Z0-9]', '', 'g')) || 
             '.' || 
             LOWER(REGEXP_REPLACE(p_last_name, '[^a-zA-Z0-9]', '', 'g')) || 
             '@kiosko-' || 
             SUBSTRING(p_kiosko_id::TEXT, 1, 8) || 
             '.atlasone.com';
  
  -- Verificar si el email existe y agregar número si es necesario
  WHILE EXISTS (SELECT 1 FROM employees WHERE auto_generated_email = v_email) LOOP
    v_counter := v_counter + 1;
    v_email := LOWER(REGEXP_REPLACE(p_first_name, '[^a-zA-Z0-9]', '', 'g')) || 
               '.' || 
               LOWER(REGEXP_REPLACE(p_last_name, '[^a-zA-Z0-9]', '', 'g')) || 
               v_counter || 
               '@kiosko-' || 
               SUBSTRING(p_kiosko_id::TEXT, 1, 8) || 
               '.atlasone.com';
  END LOOP;
  
  -- Generar password aleatorio (8 caracteres)
  v_password := SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT), 1, 8);
  
  RETURN QUERY SELECT v_email, v_password;
END;
$$ LANGUAGE plpgsql;

-- 10. Comentarios para documentación
COMMENT ON TABLE chains IS 'Cadenas de kioscos - nivel superior de la jerarquía';
COMMENT ON TABLE kioscos IS 'Kioscos individuales - antes "businesses"';
COMMENT ON TABLE subscription_plans IS 'Planes de suscripción para cada kiosko';
COMMENT ON TABLE phone_verifications IS 'Verificación de números telefónicos para notificaciones';
