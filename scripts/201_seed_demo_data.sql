-- ============================================
-- Script 201: Seed Data para Usuarios Demo (Sin crear usuarios Auth)
-- ============================================
-- Este script asume que los usuarios demo ya existen en auth.users
-- y solo crea los datos asociados (kioscos, productos, etc.)
-- 
-- PREREQUISITO: Los usuarios deben existir en Supabase Auth:
-- - demo.maxi-kiosco@atlasone.com (password: Demo123456!)
-- - demo.mini-market@atlasone.com (password: Demo123456!)
-- - demo.licoreria@atlasone.com (password: Demo123456!)
-- - demo.vinoteca@atlasone.com (password: Demo123456!)
-- - demo.libreria@atlasone.com (password: Demo123456!)
-- - demo.jugueteria@atlasone.com (password: Demo123456!)
-- - demo.dietetica@atlasone.com (password: Demo123456!)
-- ============================================

DO $$
DECLARE
  v_user_id UUID;
  v_kiosko_id UUID;
  v_email TEXT;
  v_business_name TEXT;
  v_telegram_chat_id TEXT := '8494177500';
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
  -- Iterar sobre cada usuario demo
  FOR i IN 1..array_length(demo_users, 1) LOOP
    v_email := demo_users[i][1];
    v_business_name := demo_users[i][2];

    -- Buscar el user_id
    SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;

    IF v_user_id IS NULL THEN
      RAISE NOTICE 'Usuario no encontrado: % - Debes crearlo primero en Supabase Auth', v_email;
      CONTINUE;
    END IF;

    RAISE NOTICE 'Procesando: % (ID: %)', v_email, v_user_id;

    -- Crear o actualizar profile
    INSERT INTO profiles (id, username, full_name, role, business_name, theme, telegram_chat_id)
    VALUES (
      v_user_id,
      split_part(v_email, '@', 1),
      'Usuario Demo - ' || v_business_name,
      'owner',
      v_business_name,
      'cyan',
      v_telegram_chat_id
    )
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      business_name = EXCLUDED.business_name,
      telegram_chat_id = EXCLUDED.telegram_chat_id,
      updated_at = NOW();

    -- Verificar si ya tiene kiosko
    SELECT id INTO v_kiosko_id FROM kioscos WHERE owner_id = v_user_id LIMIT 1;

    -- Si no existe kiosko, crearlo con todos los datos
    IF v_kiosko_id IS NULL THEN
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

      -- Crear configuración de notificaciones
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

      -- Crear empleados
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

      -- Crear ventas de ejemplo (últimos 30 días)
      FOR j IN 0..29 LOOP
        FOR k IN 1..FLOOR(RANDOM() * 5 + 3)::INT LOOP
          INSERT INTO sales (kiosko_id, sale_number, total_amount, payment_method, status, created_at)
          VALUES (
            v_kiosko_id,
            'VTA-DEMO-' || split_part(p_email, '@', 1) || '-' || LPAD((j * 10 + k)::TEXT, 6, '0'),
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

      -- Crear caja abierta para hoy
      INSERT INTO cash_registers (kiosko_id, opening_balance, status, opened_at)
      VALUES (
        v_kiosko_id,
        10000,
        'open',
        date_trunc('day', NOW())
      );

      RAISE NOTICE 'Datos creados para: % (Kiosko ID: %)', v_email, v_kiosko_id;
    ELSE
      RAISE NOTICE 'Ya existe kiosko para: % (Kiosko ID: %)', v_email, v_kiosko_id;
    END IF;

  END LOOP;

  RAISE NOTICE 'Proceso completado!';
END $$;

-- ============================================
-- Verificación final
-- ============================================

SELECT 
  u.email,
  p.business_name,
  k.name as kiosko,
  (SELECT COUNT(*) FROM products WHERE kiosko_id = k.id) as productos,
  (SELECT COUNT(*) FROM employees WHERE kiosko_id = k.id) as empleados,
  (SELECT COUNT(*) FROM sales WHERE kiosko_id = k.id) as ventas,
  (SELECT status FROM cash_registers WHERE kiosko_id = k.id ORDER BY opened_at DESC LIMIT 1) as estado_caja
FROM auth.users u
INNER JOIN profiles p ON u.id = p.id
LEFT JOIN kioscos k ON k.owner_id = u.id
WHERE u.email LIKE 'demo.%@atlasone.com'
ORDER BY u.email;
