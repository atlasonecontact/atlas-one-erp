-- Script 120: Fix Demo User (Corrected Schema)
-- Ensures the demo user exists and has all required data
-- Run this AFTER creating the demo user manually in Supabase Auth:
--   Email: demo@atlasone.com
--   Password: demo123456

-- Drop old function if exists
DROP FUNCTION IF EXISTS setup_demo_user();

-- Function to set up demo user with complete data
CREATE OR REPLACE FUNCTION setup_demo_user()
RETURNS TEXT AS $$
DECLARE
  v_demo_user_id UUID;
  v_kiosko_id UUID;
  v_profile_exists BOOLEAN;
  v_sale_counter INTEGER := 0;
BEGIN
  -- Find demo user
  SELECT id INTO v_demo_user_id 
  FROM auth.users 
  WHERE email = 'demo@atlasone.com';

  IF v_demo_user_id IS NULL THEN
    RETURN 'ERROR: Usuario demo no encontrado. Créalo primero en Supabase Auth con email: demo@atlasone.com, password: demo123456';
  END IF;

  -- Check if profile exists
  SELECT EXISTS(SELECT 1 FROM profiles WHERE id = v_demo_user_id) INTO v_profile_exists;

  -- Create or update profile (using only existing columns from CURRENT_DATABASE_STATE)
  IF v_profile_exists THEN
    UPDATE profiles SET
      full_name = 'Usuario Demo',
      role = 'owner',
      business_name = 'Minimarket Demo',
      updated_at = NOW()
    WHERE id = v_demo_user_id;
  ELSE
    INSERT INTO profiles (id, full_name, role, business_name)
    VALUES (v_demo_user_id, 'Usuario Demo', 'owner', 'Minimarket Demo');
  END IF;

  -- Create or get kiosko (kioscos use owner_id, location, city - NOT address)
  SELECT id INTO v_kiosko_id FROM kioscos WHERE owner_id = v_demo_user_id LIMIT 1;
  IF v_kiosko_id IS NULL THEN
    INSERT INTO kioscos (owner_id, name, location, city, phone, cuit, status, created_at)
    VALUES (v_demo_user_id, 'Kiosco Central Demo', 'Av. Corrientes 1234', 'CABA', '11-4444-5555', '30-12345678-9', 'active', NOW())
    RETURNING id INTO v_kiosko_id;
  ELSE
    UPDATE kioscos SET 
      name = 'Kiosco Central Demo',
      location = COALESCE(location, 'Av. Corrientes 1234'),
      city = COALESCE(city, 'CABA'),
      cuit = COALESCE(cuit, '30-12345678-9'),
      status = 'active'
    WHERE id = v_kiosko_id;
  END IF;

  -- Add products if none exist
  -- Schema: category is TEXT, stock_quantity, min_stock_level, is_active (BOOLEAN)
  IF NOT EXISTS (SELECT 1 FROM products WHERE kiosko_id = v_kiosko_id LIMIT 1) THEN
    INSERT INTO products (kiosko_id, sku, name, category, cost, price, stock_quantity, min_stock_level, is_active, barcode) VALUES
      -- Bebidas
      (v_kiosko_id, 'BEB-COCA-500', 'Coca Cola 500ml', 'Bebidas', 350, 700, 48, 20, TRUE, '7790895000102'),
      (v_kiosko_id, 'BEB-COCA-1500', 'Coca Cola 1.5L', 'Bebidas', 600, 1200, 24, 12, TRUE, '7790895000119'),
      (v_kiosko_id, 'BEB-SPRITE-500', 'Sprite 500ml', 'Bebidas', 340, 680, 36, 15, TRUE, '7790895000126'),
      (v_kiosko_id, 'BEB-FANTA-500', 'Fanta Naranja 500ml', 'Bebidas', 340, 680, 30, 15, TRUE, '7790895000133'),
      (v_kiosko_id, 'BEB-AGUA-500', 'Agua Mineral 500ml', 'Bebidas', 150, 400, 60, 30, TRUE, '7790895000140'),
      (v_kiosko_id, 'BEB-AGUA-1500', 'Agua Mineral 1.5L', 'Bebidas', 250, 600, 36, 18, TRUE, '7790895000157'),
      (v_kiosko_id, 'BEB-QUILMES-473', 'Cerveza Quilmes 473ml', 'Bebidas', 450, 900, 48, 24, TRUE, '7790895000164'),
      (v_kiosko_id, 'BEB-BRAHMA-473', 'Cerveza Brahma 473ml', 'Bebidas', 400, 850, 48, 24, TRUE, '7790895000171'),
      (v_kiosko_id, 'BEB-GATORADE-500', 'Gatorade 500ml', 'Bebidas', 500, 950, 24, 12, TRUE, '7790895000188'),
      (v_kiosko_id, 'BEB-MONSTER', 'Monster Energy', 'Bebidas', 800, 1500, 18, 10, TRUE, '7790895000195'),
      (v_kiosko_id, 'BEB-REDBULL', 'Red Bull', 'Bebidas', 900, 1800, 12, 8, TRUE, '7790895000201'),
      -- Snacks
      (v_kiosko_id, 'SNK-LAYS-CLA', 'Papas Lays Clásicas', 'Snacks', 400, 850, 30, 15, TRUE, '7790895001102'),
      (v_kiosko_id, 'SNK-LAYS-JAM', 'Papas Lays Jamón', 'Snacks', 400, 850, 25, 15, TRUE, '7790895001119'),
      (v_kiosko_id, 'SNK-DORITOS', 'Doritos Queso', 'Snacks', 450, 900, 20, 10, TRUE, '7790895001126'),
      (v_kiosko_id, 'SNK-CHEETOS', 'Cheetos', 'Snacks', 350, 750, 28, 12, TRUE, '7790895001133'),
      (v_kiosko_id, 'SNK-PALITOS', 'Palitos Salados', 'Snacks', 200, 450, 40, 20, TRUE, '7790895001140'),
      (v_kiosko_id, 'SNK-MANI', 'Maní Salado 100g', 'Snacks', 300, 600, 35, 15, TRUE, '7790895001157'),
      -- Cigarrillos
      (v_kiosko_id, 'CIG-MARLBORO-BOX', 'Marlboro Box 20', 'Cigarrillos', 1200, 2200, 50, 25, TRUE, '7790895002102'),
      (v_kiosko_id, 'CIG-MARLBORO-GOLD', 'Marlboro Gold 20', 'Cigarrillos', 1200, 2200, 40, 20, TRUE, '7790895002119'),
      (v_kiosko_id, 'CIG-CAMEL', 'Camel 20', 'Cigarrillos', 1100, 2100, 35, 20, TRUE, '7790895002126'),
      (v_kiosko_id, 'CIG-PM', 'Philip Morris 20', 'Cigarrillos', 900, 1800, 45, 25, TRUE, '7790895002133'),
      (v_kiosko_id, 'CIG-LUCKY', 'Lucky Strike 20', 'Cigarrillos', 1000, 1900, 30, 15, TRUE, '7790895002140'),
      (v_kiosko_id, 'CIG-CHESTER', 'Chesterfield 20', 'Cigarrillos', 850, 1700, 8, 20, TRUE, '7790895002157'),
      -- Lácteos
      (v_kiosko_id, 'LAC-LECHE-1L', 'Leche La Serenísima 1L', 'Lácteos', 450, 850, 24, 12, TRUE, '7790895003102'),
      (v_kiosko_id, 'LAC-YOGUR-NAT', 'Yogurt Ser Natural', 'Lácteos', 350, 700, 18, 10, TRUE, '7790895003119'),
      (v_kiosko_id, 'LAC-YOGUR-FRU', 'Yogurt Ser Frutilla', 'Lácteos', 350, 700, 15, 10, TRUE, '7790895003126'),
      (v_kiosko_id, 'LAC-QUESO-200', 'Queso Cremoso 200g', 'Lácteos', 600, 1100, 12, 8, TRUE, '7790895003133'),
      (v_kiosko_id, 'LAC-MANTECA-200', 'Manteca 200g', 'Lácteos', 700, 1300, 10, 6, TRUE, '7790895003140'),
      -- Golosinas
      (v_kiosko_id, 'GOL-MILKA-100', 'Chocolate Milka 100g', 'Golosinas', 500, 950, 25, 12, TRUE, '7790895004102'),
      (v_kiosko_id, 'GOL-CHICLE', 'Chicles Topline x10', 'Golosinas', 150, 350, 50, 25, TRUE, '7790895004119'),
      (v_kiosko_id, 'GOL-SUGUS', 'Caramelos Sugus x8', 'Golosinas', 100, 250, 60, 30, TRUE, '7790895004126'),
      (v_kiosko_id, 'GOL-HAVANNA', 'Alfajor Havanna', 'Golosinas', 400, 800, 20, 10, TRUE, '7790895004133'),
      (v_kiosko_id, 'GOL-CACHAFAZ', 'Alfajor Cachafaz', 'Golosinas', 250, 500, 30, 15, TRUE, '7790895004140'),
      (v_kiosko_id, 'GOL-BONOBON', 'Bon o Bon x6', 'Golosinas', 350, 700, 5, 15, TRUE, '7790895004157'),
      -- Limpieza
      (v_kiosko_id, 'LIM-MAGISTRAL-500', 'Detergente Magistral 500ml', 'Limpieza', 400, 850, 15, 8, TRUE, '7790895005102'),
      (v_kiosko_id, 'LIM-AYUDIN-1L', 'Lavandina Ayudín 1L', 'Limpieza', 300, 600, 20, 10, TRUE, '7790895005119'),
      (v_kiosko_id, 'LIM-PAPEL-4', 'Papel Higiénico x4', 'Limpieza', 500, 950, 25, 12, TRUE, '7790895005126'),
      (v_kiosko_id, 'LIM-SERVILLETAS', 'Servilletas x100', 'Limpieza', 200, 450, 18, 10, TRUE, '7790895005133');
  END IF;

  -- Add employees if none exist
  -- Schema: username, name, position, permissions (JSONB), status
  IF NOT EXISTS (SELECT 1 FROM employees WHERE kiosko_id = v_kiosko_id LIMIT 1) THEN
    INSERT INTO employees (kiosko_id, username, name, position, status, permissions) VALUES
      (v_kiosko_id, 'maria.gonzalez', 'María González', 'Cajero', 'active', 
       '{"can_sell": true, "can_manage_cash": true, "can_view_reports": false, "can_manage_products": false}'::jsonb),
      (v_kiosko_id, 'pedro.sanchez', 'Pedro Sánchez', 'Cajero', 'active', 
       '{"can_sell": true, "can_manage_cash": true, "can_view_reports": false, "can_manage_products": false}'::jsonb),
      (v_kiosko_id, 'laura.fernandez', 'Laura Fernández', 'Supervisor', 'active', 
       '{"can_sell": true, "can_manage_cash": true, "can_view_reports": true, "can_manage_products": true}'::jsonb);
  END IF;

  -- Add sample sales if none exist
  -- Schema: sale_number, total_amount, payment_method, status
  IF NOT EXISTS (SELECT 1 FROM sales WHERE kiosko_id = v_kiosko_id LIMIT 1) THEN
    FOR v_sale_counter IN 1..50 LOOP
      INSERT INTO sales (kiosko_id, sale_number, total_amount, payment_method, status, created_at)
      VALUES (
        v_kiosko_id,
        'VTA-DEMO-' || LPAD(v_sale_counter::TEXT, 6, '0'),
        (RANDOM() * 5000 + 500)::DECIMAL(10,2),
        CASE (RANDOM() * 3)::INT
          WHEN 0 THEN 'cash'
          WHEN 1 THEN 'card'
          ELSE 'transfer'
        END,
        'completed',
        NOW() - (RANDOM() * 30 || ' days')::INTERVAL
      );
    END LOOP;
  END IF;

  RETURN 'SUCCESS: Usuario demo configurado. User ID: ' || v_demo_user_id::TEXT || ', Kiosko ID: ' || v_kiosko_id::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Execute the function
SELECT setup_demo_user();
