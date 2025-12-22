-- ============================================
-- Script 200: Crear Usuarios Demo Completos
-- ============================================
-- Este script crea 7 usuarios demo con datos precargados
-- IMPORTANTE: Ejecutar con permisos de admin en Supabase
-- NOTA: Requiere extensión pgcrypto habilitada
-- ============================================

-- Habilitar extensión pgcrypto si no está habilitada
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Función para crear un usuario demo completo
CREATE OR REPLACE FUNCTION create_demo_user(
  p_email TEXT,
  p_password TEXT,
  p_business_name TEXT,
  p_demo_type TEXT
)
RETURNS TEXT AS $$
DECLARE
  v_user_id UUID;
  v_kiosko_id UUID;
  v_telegram_chat_id TEXT := '8494177500'; -- Chat ID real para testing
  v_instance_id UUID;
BEGIN
  -- Obtener el instance_id actual (por defecto el primero si existe)
  SELECT id INTO v_instance_id FROM auth.instances LIMIT 1;
  IF v_instance_id IS NULL THEN
    v_instance_id := '00000000-0000-0000-0000-000000000000'::uuid;
  END IF;

  -- 1. Verificar si el usuario ya existe
  SELECT id INTO v_user_id 
  FROM auth.users 
  WHERE email = p_email;

  IF v_user_id IS NULL THEN
    -- Generar nuevo UUID para el usuario
    v_user_id := gen_random_uuid();
    
    -- Insertar en auth.users con el esquema correcto
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      invited_at,
      confirmation_token,
      confirmation_sent_at,
      recovery_token,
      recovery_sent_at,
      email_change_token_new,
      email_change,
      email_change_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      created_at,
      updated_at,
      phone,
      phone_confirmed_at,
      phone_change,
      phone_change_token,
      phone_change_sent_at,
      email_change_token_current,
      email_change_confirm_status,
      banned_until,
      reauthentication_token,
      reauthentication_sent_at,
      is_sso_user,
      deleted_at,
      is_anonymous
    ) VALUES (
      v_instance_id,
      v_user_id,
      'authenticated',
      'authenticated',
      p_email,
      crypt(p_password, gen_salt('bf')),
      NOW(),
      NULL,
      '',
      NULL,
      '',
      NULL,
      '',
      '',
      NULL,
      NULL,
      jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
      jsonb_build_object(
        'full_name', 'Usuario Demo - ' || p_business_name, 
        'role', 'owner', 
        'business_name', p_business_name, 
        'demo_type', p_demo_type
      ),
      false,
      NOW(),
      NOW(),
      NULL,
      NULL,
      '',
      '',
      NULL,
      '',
      0,
      NULL,
      '',
      NULL,
      false, -- is_sso_user
      NULL,
      false  -- is_anonymous
    );

    -- Crear identidad en auth.identities
    INSERT INTO auth.identities (
      id,
      provider_id,
      user_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      v_user_id::text,
      v_user_id,
      jsonb_build_object(
        'sub', v_user_id::text,
        'email', p_email,
        'email_verified', true,
        'phone_verified', false
      ),
      'email',
      NULL,
      NOW(),
      NOW()
    );
  END IF;

  -- 2. Crear o actualizar profile
  INSERT INTO profiles (id, username, full_name, role, business_name, telegram_chat_id)
  VALUES (
    v_user_id,
    split_part(p_email, '@', 1),
    'Usuario Demo - ' || p_business_name,
    'owner',
    p_business_name,
    v_telegram_chat_id
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    business_name = EXCLUDED.business_name,
    telegram_chat_id = EXCLUDED.telegram_chat_id,
    updated_at = NOW();

  -- 3. Verificar si ya tiene kiosko
  SELECT id INTO v_kiosko_id 
  FROM kioscos 
  WHERE owner_id = v_user_id 
  LIMIT 1;

  -- 4. Crear kiosko si no existe
  IF v_kiosko_id IS NULL THEN
    INSERT INTO kioscos (owner_id, name, location, city, phone, cuit, status, created_at)
    VALUES (
      v_user_id,
      p_business_name || ' - Central',
      'Av. Corrientes 1234',
      'CABA',
      '11-4444-5555',
      '30-12345678-9',
      'active',
      NOW()
    )
    RETURNING id INTO v_kiosko_id;

    -- 5. Crear configuración de notificaciones
    INSERT INTO notification_configs (kiosko_id, telegram_chat_id, telegram_enabled, telegram_verified, created_at, updated_at)
    SELECT v_kiosko_id, v_telegram_chat_id, true, false, NOW(), NOW()
    WHERE NOT EXISTS (
      SELECT 1 FROM notification_configs nc WHERE nc.kiosko_id = v_kiosko_id
    );

    UPDATE notification_configs
    SET telegram_chat_id = v_telegram_chat_id,
        telegram_enabled = true,
        updated_at = NOW()
    WHERE kiosko_id = v_kiosko_id;

    -- 6. Crear productos
    INSERT INTO products (kiosko_id, sku, name, category, cost, price, stock_quantity, min_stock_level, barcode, is_active)
    VALUES
      (v_kiosko_id, 'BEB-COCA-500', 'Coca Cola 500ml', 'Bebidas', 500, 1000, 50, 20, '7790895001235', true),
      (v_kiosko_id, 'BEB-SPRITE-500', 'Sprite 500ml', 'Bebidas', 500, 1000, 40, 20, '7790895001242', true),
      (v_kiosko_id, 'BEB-AGUA-500', 'Agua Mineral 500ml', 'Bebidas', 300, 600, 60, 30, '7790895001259', true),
      (v_kiosko_id, 'BEB-PEPSI-500', 'Pepsi 500ml', 'Bebidas', 480, 980, 35, 20, '7790895001266', true),
      (v_kiosko_id, 'SNA-LAYS-95', 'Lays Clásicas 95g', 'Snacks', 600, 1200, 30, 15, '7790895002011', true),
      (v_kiosko_id, 'SNA-PEPITOS', 'Pepitos 130g', 'Snacks', 400, 800, 25, 12, '7790895002028', true),
      (v_kiosko_id, 'SNA-DORITOS', 'Doritos Nacho 150g', 'Snacks', 650, 1300, 28, 15, '7790895002035', true),
      (v_kiosko_id, 'CIG-MARLBORO', 'Marlboro Box 20', 'Cigarrillos', 900, 1800, 15, 20, '7790895002141', true),
      (v_kiosko_id, 'LAC-LECHE-1L', 'Leche La Serenísima 1L', 'Lácteos', 450, 850, 24, 12, '7790895003102', true),
      (v_kiosko_id, 'GOL-MILKA-100', 'Chocolate Milka 100g', 'Golosinas', 500, 950, 25, 12, '7790895004102', true),
      (v_kiosko_id, 'GOL-SUGUS', 'Caramelos Sugus x8', 'Golosinas', 100, 250, 60, 30, '7790895004126', true),
      (v_kiosko_id, 'LIM-CIFF-500', 'Cif Crema 500ml', 'Limpieza', 800, 1500, 15, 8, '7790895005102', true);

    -- 7. Crear empleados
    INSERT INTO employees (kiosko_id, username, name, position, status, permissions)
    VALUES
      (v_kiosko_id, split_part(p_email, '@', 1) || '.maria.gonzalez', 'María González', 'Cajero', 'active', 
       '{"can_sell": true, "can_manage_cash": true, "can_view_reports": false, "can_manage_products": false}'::jsonb),
      (v_kiosko_id, split_part(p_email, '@', 1) || '.pedro.sanchez', 'Pedro Sánchez', 'Cajero', 'active', 
       '{"can_sell": true, "can_manage_cash": true, "can_view_reports": false, "can_manage_products": false}'::jsonb),
      (v_kiosko_id, split_part(p_email, '@', 1) || '.laura.fernandez', 'Laura Fernández', 'Supervisor', 'active', 
       '{"can_sell": true, "can_manage_cash": true, "can_view_reports": true, "can_manage_products": true}'::jsonb)
    ON CONFLICT (username) DO UPDATE SET
      kiosko_id = EXCLUDED.kiosko_id,
      name = EXCLUDED.name,
      position = EXCLUDED.position,
      status = EXCLUDED.status,
      permissions = EXCLUDED.permissions,
      updated_at = NOW();

    -- 8. Crear ventas de ejemplo (últimos 30 días)
    FOR i IN 0..29 LOOP
      FOR j IN 1..FLOOR(RANDOM() * 5 + 3)::INT LOOP
        INSERT INTO sales (kiosko_id, sale_number, total_amount, payment_method, status, created_at)
        VALUES (
          v_kiosko_id,
          'VTA-DEMO-' || split_part(p_email, '@', 1) || '-' || LPAD((i * 10 + j)::TEXT, 6, '0'),
          (RANDOM() * 5000 + 500)::DECIMAL(10,2),
          CASE (RANDOM() * 3)::INT
            WHEN 0 THEN 'cash'
            WHEN 1 THEN 'card'
            ELSE 'transfer'
          END,
          'completed',
          NOW() - (i || ' days')::INTERVAL - (RANDOM() * 12 || ' hours')::INTERVAL
        )
        ON CONFLICT (sale_number) DO NOTHING;
      END LOOP;
    END LOOP;

    -- 9. Crear caja abierta para hoy
    INSERT INTO cash_registers (kiosko_id, opening_balance, status, opened_at)
    VALUES (
      v_kiosko_id,
      10000,
      'open',
      date_trunc('day', NOW())
    );

  END IF;

  RETURN 'SUCCESS: Usuario demo creado. Email: ' || p_email || ', User ID: ' || v_user_id::TEXT || ', Kiosko ID: ' || v_kiosko_id::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Crear los 7 usuarios demo
-- ============================================

SELECT create_demo_user('demo.maxi-kiosco@atlasone.com', 'Demo123456!', 'Maxi Kiosco Demo', 'maxi-kiosco');
SELECT create_demo_user('demo.mini-market@atlasone.com', 'Demo123456!', 'Mini Market Demo', 'mini-market');
SELECT create_demo_user('demo.licoreria@atlasone.com', 'Demo123456!', 'Licorería Demo', 'licoreria');
SELECT create_demo_user('demo.vinoteca@atlasone.com', 'Demo123456!', 'Vinoteca Demo', 'vinoteca');
SELECT create_demo_user('demo.libreria@atlasone.com', 'Demo123456!', 'Librería Demo', 'libreria');
SELECT create_demo_user('demo.jugueteria@atlasone.com', 'Demo123456!', 'Juguetería Demo', 'jugueteria');
SELECT create_demo_user('demo.dietetica@atlasone.com', 'Demo123456!', 'Dietética Demo', 'dietetica');

-- ============================================
-- Verificación
-- ============================================

-- Ver todos los usuarios demo creados
SELECT 
  u.email,
  p.full_name,
  p.business_name,
  k.name as kiosko_name,
  k.id as kiosko_id,
  (SELECT COUNT(*) FROM products WHERE kiosko_id = k.id) as productos,
  (SELECT COUNT(*) FROM employees WHERE kiosko_id = k.id) as empleados,
  (SELECT COUNT(*) FROM sales WHERE kiosko_id = k.id) as ventas,
  (SELECT COUNT(*) FROM cash_registers WHERE kiosko_id = k.id AND status = 'open') as cajas_abiertas
FROM auth.users u
INNER JOIN profiles p ON u.id = p.id
LEFT JOIN kioscos k ON k.owner_id = u.id
WHERE u.email LIKE 'demo.%@atlasone.com'
ORDER BY u.email;

-- Limpiar función temporal (opcional)
-- DROP FUNCTION IF EXISTS create_demo_user(TEXT, TEXT, TEXT, TEXT);
