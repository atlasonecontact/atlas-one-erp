-- ============================================
-- Script 202: Fix Completo para Usuarios Demo
-- ============================================
-- Este script:
-- 1. Busca usuarios demo existentes en auth.users
-- 2. Si no tienen kiosko, lo crea con datos
-- 3. Si NO existen en auth.users, los crea
-- 4. Configura Telegram para todos
-- ============================================

-- Habilitar extensión pgcrypto si no está habilitada
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  v_user_id UUID;
  v_kiosko_id UUID;
  v_email TEXT;
  v_business_name TEXT;
  v_telegram_chat_id TEXT := NULL; -- Cada usuario debe configurar su propio Chat ID
  v_instance_id UUID;
  demo_users TEXT[][] := ARRAY[
    ['demo.maxi-kiosco@atlasone.com', 'Maxi Kiosco Demo'],
    ['demo.mini-market@atlasone.com', 'Mini Market Demo'],
    ['demo.licoreria@atlasone.com', 'Licorería Demo'],
    ['demo.vinoteca@atlasone.com', 'Vinoteca Demo'],
    ['demo.libreria@atlasone.com', 'Librería Demo'],
    ['demo.jugueteria@atlasone.com', 'Juguetería Demo'],
    ['demo.dietetica@atlasone.com', 'Dietética Demo']
  ];
BEGIN
  -- Obtener el instance_id
  SELECT id INTO v_instance_id FROM auth.instances LIMIT 1;
  IF v_instance_id IS NULL THEN
    v_instance_id := '00000000-0000-0000-0000-000000000000'::uuid;
  END IF;

  -- Iterar sobre cada usuario demo
  FOR i IN 1..array_length(demo_users, 1) LOOP
    v_email := demo_users[i][1];
    v_business_name := demo_users[i][2];

    RAISE NOTICE '================================================';
    RAISE NOTICE 'Procesando: %', v_email;

    -- Buscar el user_id en auth.users
    SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;

    -- =========================================
    -- PASO 1: Crear usuario si NO existe
    -- =========================================
    IF v_user_id IS NULL THEN
      RAISE NOTICE '  → Usuario NO existe. Creando...';
      
      v_user_id := gen_random_uuid();
      
      -- Crear en auth.users
      INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password,
        email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
        is_super_admin, created_at, updated_at,
        confirmation_token, recovery_token, email_change_token_new,
        email_change, phone, phone_confirmed_at, phone_change,
        phone_change_token, phone_change_sent_at, 
        email_change_token_current, email_change_confirm_status,
        banned_until, reauthentication_token, reauthentication_sent_at,
        is_sso_user, deleted_at, is_anonymous
      ) VALUES (
        v_instance_id, v_user_id, 'authenticated', 'authenticated', v_email,
        crypt('Demo123456!', gen_salt('bf')), NOW(),
        jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
        jsonb_build_object('full_name', 'Usuario Demo - ' || v_business_name),
        false, NOW(), NOW(),
        '', '', '', '', NULL, NULL, '', '', NULL, '', 0,
        NULL, '', NULL, false, NULL, false
      );

      -- Crear identity
      INSERT INTO auth.identities (
        id, provider_id, user_id, identity_data, provider,
        last_sign_in_at, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), v_user_id::text, v_user_id,
        jsonb_build_object('sub', v_user_id::text, 'email', v_email, 
                          'email_verified', true, 'phone_verified', false),
        'email', NULL, NOW(), NOW()
      );

      RAISE NOTICE '  ✓ Usuario creado con ID: %', v_user_id;
    ELSE
      RAISE NOTICE '  ✓ Usuario ya existe con ID: %', v_user_id;
    END IF;

    -- =========================================
    -- PASO 2: Crear o actualizar profile
    -- =========================================
    INSERT INTO profiles (id, username, full_name, role, business_name, telegram_chat_id)
    VALUES (
      v_user_id,
      split_part(v_email, '@', 1),
      'Usuario Demo - ' || v_business_name,
      'owner',
      v_business_name,
      v_telegram_chat_id
    )
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      business_name = EXCLUDED.business_name,
      telegram_chat_id = v_telegram_chat_id,
      updated_at = NOW();

    RAISE NOTICE '  ✓ Profile actualizado';

    -- =========================================
    -- PASO 3: Verificar/Crear Kiosko
    -- =========================================
    SELECT id INTO v_kiosko_id FROM kioscos WHERE owner_id = v_user_id LIMIT 1;

    IF v_kiosko_id IS NULL THEN
      RAISE NOTICE '  → Kiosko NO existe. Creando datos completos...';

      -- Crear kiosko
      INSERT INTO kioscos (owner_id, name, location, city, phone, cuit, status)
      VALUES (
        v_user_id,
        v_business_name || ' - Central',
        'Av. Corrientes 1234',
        'CABA',
        '11-4444-5555',
        '30-12345678-9',
        'active'
      )
      RETURNING id INTO v_kiosko_id;

      RAISE NOTICE '  ✓ Kiosko creado con ID: %', v_kiosko_id;

      -- Configurar notificaciones de Telegram (sin Chat ID por defecto)
      INSERT INTO notification_configs (kiosko_id, telegram_chat_id, telegram_enabled, telegram_verified)
      VALUES (v_kiosko_id, NULL, false, false)
      ON CONFLICT (kiosko_id) DO UPDATE SET
        telegram_enabled = false,
        telegram_verified = false,
        updated_at = NOW();

      RAISE NOTICE '  ⚠️  Telegram NO configurado - El usuario debe configurar su Chat ID';

      -- Crear productos
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

      RAISE NOTICE '  ✓ 12 productos creados';

      -- Crear empleados
      INSERT INTO employees (kiosko_id, username, name, position, status, permissions)
      VALUES
        (v_kiosko_id, split_part(v_email, '@', 1) || '.maria.gonzalez', 'María González', 'Cajero', 'active', 
         '{"can_sell": true, "can_manage_cash": true, "can_view_reports": false, "can_manage_products": false}'::jsonb),
        (v_kiosko_id, split_part(v_email, '@', 1) || '.pedro.sanchez', 'Pedro Sánchez', 'Cajero', 'active', 
         '{"can_sell": true, "can_manage_cash": true, "can_view_reports": false, "can_manage_products": false}'::jsonb),
        (v_kiosko_id, split_part(v_email, '@', 1) || '.laura.fernandez', 'Laura Fernández', 'Supervisor', 'active', 
         '{"can_sell": true, "can_manage_cash": true, "can_view_reports": true, "can_manage_products": true}'::jsonb)
      ON CONFLICT (username) DO UPDATE SET
        kiosko_id = EXCLUDED.kiosko_id,
        name = EXCLUDED.name;

      RAISE NOTICE '  ✓ 3 empleados creados';

      -- Crear ventas de ejemplo (últimos 30 días)
      FOR j IN 0..29 LOOP
        FOR k IN 1..FLOOR(RANDOM() * 5 + 3)::INT LOOP
          INSERT INTO sales (kiosko_id, sale_number, total_amount, payment_method, status, created_at)
          VALUES (
            v_kiosko_id,
            'VTA-DEMO-' || split_part(v_email, '@', 1) || '-' || LPAD((j * 10 + k)::TEXT, 6, '0'),
            (RANDOM() * 5000 + 500)::DECIMAL(10,2),
            CASE (RANDOM() * 3)::INT
              WHEN 0 THEN 'cash'
              WHEN 1 THEN 'card'
              ELSE 'transfer'
            END,
            'completed',
            NOW() - (j || ' days')::INTERVAL - (RANDOM() * 12 || ' hours')::INTERVAL
          )
          ON CONFLICT (sale_number) DO NOTHING;
        END LOOP;
      END LOOP;

      RAISE NOTICE '  ✓ Ventas históricas creadas (30 días)';

      -- Crear caja abierta para hoy
      INSERT INTO cash_registers (kiosko_id, opening_balance, status, opened_at)
      VALUES (v_kiosko_id, 10000, 'open', date_trunc('day', NOW()))
      ON CONFLICT DO NOTHING;

      RAISE NOTICE '  ✓ Caja registradora abierta';

    ELSE
      -- Kiosko ya existe, verificar config de notificaciones
      RAISE NOTICE '  ✓ Kiosko ya existe con ID: %', v_kiosko_id;
      
      -- Si no existe config, crearla vacía
      INSERT INTO notification_configs (kiosko_id, telegram_chat_id, telegram_enabled, telegram_verified)
      VALUES (v_kiosko_id, NULL, false, false)
      ON CONFLICT (kiosko_id) DO NOTHING;

      RAISE NOTICE '  ℹ️  Telegram debe ser configurado por el usuario';
    END IF;

  END LOOP;

  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ PROCESO COMPLETADO!';
  RAISE NOTICE '================================================';
END $$;

-- ============================================
-- Verificación Final
-- ============================================

SELECT 
  '✅ RESUMEN FINAL' as status,
  COUNT(*) as total_demos
FROM auth.users 
WHERE email LIKE 'demo.%@atlasone.com';

SELECT 
  u.email,
  p.business_name,
  k.name as kiosko,
  k.status as estado_kiosko,
  (SELECT COUNT(*) FROM products WHERE kiosko_id = k.id) as productos,
  (SELECT COUNT(*) FROM employees WHERE kiosko_id = k.id) as empleados,
  (SELECT COUNT(*) FROM sales WHERE kiosko_id = k.id) as ventas,
  (SELECT status FROM cash_registers WHERE kiosko_id = k.id ORDER BY opened_at DESC LIMIT 1) as estado_caja,
  nc.telegram_chat_id,
  nc.telegram_enabled,
  nc.telegram_verified
FROM auth.users u
INNER JOIN profiles p ON u.id = p.id
LEFT JOIN kioscos k ON k.owner_id = u.id
LEFT JOIN notification_configs nc ON nc.kiosko_id = k.id
WHERE u.email LIKE 'demo.%@atlasone.com'
ORDER BY u.email;
