-- Script 119: Fix Demo User
-- Ensures the demo user exists and has all required data
-- Run this AFTER creating the demo user manually in Supabase Auth:
--   Email: demo@atlasone.com
--   Password: demo123456

-- Function to set up demo user with complete data
CREATE OR REPLACE FUNCTION setup_demo_user()
RETURNS TEXT AS $$
DECLARE
  v_demo_user_id UUID;
  v_kiosko_id UUID;
  v_profile_exists BOOLEAN;
  v_cat_bebidas UUID;
  v_cat_snacks UUID;
  v_cat_cigarrillos UUID;
  v_cat_lacteos UUID;
  v_cat_golosinas UUID;
  v_cat_limpieza UUID;
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

  -- Create or update profile (using only existing columns)
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

  -- Create or get kiosko (kioscos now belong directly to owner_id, not chains)
  SELECT id INTO v_kiosko_id FROM kioscos WHERE owner_id = v_demo_user_id LIMIT 1;
  IF v_kiosko_id IS NULL THEN
    INSERT INTO kioscos (owner_id, name, address, phone, cuit, created_at)
    VALUES (v_demo_user_id, 'Kiosco Central Demo', 'Av. Corrientes 1234, CABA', '11-4444-5555', '30-12345678-9', NOW())
    RETURNING id INTO v_kiosko_id;
  ELSE
    UPDATE kioscos SET 
      name = 'Kiosco Central Demo',
      address = COALESCE(address, 'Av. Corrientes 1234, CABA'),
      cuit = COALESCE(cuit, '30-12345678-9')
    WHERE id = v_kiosko_id;
  END IF;

  -- Check if there are already categories for this kiosko
  IF NOT EXISTS (SELECT 1 FROM categories WHERE kiosko_id = v_kiosko_id LIMIT 1) THEN
    -- Create categories
    INSERT INTO categories (id, kiosko_id, name, description, color) VALUES
      (gen_random_uuid(), v_kiosko_id, 'Bebidas', 'Bebidas frías y calientes', '#00d4ff')
    RETURNING id INTO v_cat_bebidas;
    
    INSERT INTO categories (id, kiosko_id, name, description, color) VALUES
      (gen_random_uuid(), v_kiosko_id, 'Snacks', 'Papas, galletas y snacks', '#ff6b6b')
    RETURNING id INTO v_cat_snacks;
    
    INSERT INTO categories (id, kiosko_id, name, description, color) VALUES
      (gen_random_uuid(), v_kiosko_id, 'Cigarrillos', 'Tabaco y cigarrillos', '#ffd93d')
    RETURNING id INTO v_cat_cigarrillos;
    
    INSERT INTO categories (id, kiosko_id, name, description, color) VALUES
      (gen_random_uuid(), v_kiosko_id, 'Lácteos', 'Leche, yogurt y derivados', '#6bcb77')
    RETURNING id INTO v_cat_lacteos;
    
    INSERT INTO categories (id, kiosko_id, name, description, color) VALUES
      (gen_random_uuid(), v_kiosko_id, 'Golosinas', 'Dulces y caramelos', '#9b59b6')
    RETURNING id INTO v_cat_golosinas;
    
    INSERT INTO categories (id, kiosko_id, name, description, color) VALUES
      (gen_random_uuid(), v_kiosko_id, 'Limpieza', 'Productos de limpieza', '#3498db')
    RETURNING id INTO v_cat_limpieza;
  ELSE
    -- Get existing categories
    SELECT id INTO v_cat_bebidas FROM categories WHERE kiosko_id = v_kiosko_id AND name = 'Bebidas' LIMIT 1;
    SELECT id INTO v_cat_snacks FROM categories WHERE kiosko_id = v_kiosko_id AND name = 'Snacks' LIMIT 1;
    SELECT id INTO v_cat_cigarrillos FROM categories WHERE kiosko_id = v_kiosko_id AND name = 'Cigarrillos' LIMIT 1;
    SELECT id INTO v_cat_lacteos FROM categories WHERE kiosko_id = v_kiosko_id AND name = 'Lácteos' LIMIT 1;
    SELECT id INTO v_cat_golosinas FROM categories WHERE kiosko_id = v_kiosko_id AND name = 'Golosinas' LIMIT 1;
    SELECT id INTO v_cat_limpieza FROM categories WHERE kiosko_id = v_kiosko_id AND name = 'Limpieza' LIMIT 1;
  END IF;

  -- Add products if none exist
  IF NOT EXISTS (SELECT 1 FROM products WHERE kiosko_id = v_kiosko_id LIMIT 1) THEN
    -- Bebidas
    INSERT INTO products (kiosko_id, sku, name, category_id, cost, price, stock, min_stock, status, barcode) VALUES
      (v_kiosko_id, 'BEB-COCA-500', 'Coca Cola 500ml', v_cat_bebidas, 350, 700, 48, 20, 'active', '7790895000102'),
      (v_kiosko_id, 'BEB-COCA-1500', 'Coca Cola 1.5L', v_cat_bebidas, 600, 1200, 24, 12, 'active', '7790895000119'),
      (v_kiosko_id, 'BEB-SPRITE-500', 'Sprite 500ml', v_cat_bebidas, 340, 680, 36, 15, 'active', '7790895000126'),
      (v_kiosko_id, 'BEB-FANTA-500', 'Fanta Naranja 500ml', v_cat_bebidas, 340, 680, 30, 15, 'active', '7790895000133'),
      (v_kiosko_id, 'BEB-AGUA-500', 'Agua Mineral 500ml', v_cat_bebidas, 150, 400, 60, 30, 'active', '7790895000140'),
      (v_kiosko_id, 'BEB-AGUA-1500', 'Agua Mineral 1.5L', v_cat_bebidas, 250, 600, 36, 18, 'active', '7790895000157'),
      (v_kiosko_id, 'BEB-QUILMES-473', 'Cerveza Quilmes 473ml', v_cat_bebidas, 450, 900, 48, 24, 'active', '7790895000164'),
      (v_kiosko_id, 'BEB-BRAHMA-473', 'Cerveza Brahma 473ml', v_cat_bebidas, 400, 850, 48, 24, 'active', '7790895000171'),
      (v_kiosko_id, 'BEB-GATORADE-500', 'Gatorade 500ml', v_cat_bebidas, 500, 950, 24, 12, 'active', '7790895000188'),
      (v_kiosko_id, 'BEB-MONSTER', 'Monster Energy', v_cat_bebidas, 800, 1500, 18, 10, 'active', '7790895000195'),
      (v_kiosko_id, 'BEB-REDBULL', 'Red Bull', v_cat_bebidas, 900, 1800, 12, 8, 'active', '7790895000201');
    
    -- Snacks
    INSERT INTO products (kiosko_id, sku, name, category_id, cost, price, stock, min_stock, status, barcode) VALUES
      (v_kiosko_id, 'SNK-LAYS-CLA', 'Papas Lays Clásicas', v_cat_snacks, 400, 850, 30, 15, 'active', '7790895001102'),
      (v_kiosko_id, 'SNK-LAYS-JAM', 'Papas Lays Jamón', v_cat_snacks, 400, 850, 25, 15, 'active', '7790895001119'),
      (v_kiosko_id, 'SNK-DORITOS', 'Doritos Queso', v_cat_snacks, 450, 900, 20, 10, 'active', '7790895001126'),
      (v_kiosko_id, 'SNK-CHEETOS', 'Cheetos', v_cat_snacks, 350, 750, 28, 12, 'active', '7790895001133'),
      (v_kiosko_id, 'SNK-PALITOS', 'Palitos Salados', v_cat_snacks, 200, 450, 40, 20, 'active', '7790895001140'),
      (v_kiosko_id, 'SNK-MANI', 'Maní Salado 100g', v_cat_snacks, 300, 600, 35, 15, 'active', '7790895001157');
    
    -- Cigarrillos
    INSERT INTO products (kiosko_id, sku, name, category_id, cost, price, stock, min_stock, status, barcode) VALUES
      (v_kiosko_id, 'CIG-MARLBORO-BOX', 'Marlboro Box 20', v_cat_cigarrillos, 1200, 2200, 50, 25, 'active', '7790895002102'),
      (v_kiosko_id, 'CIG-MARLBORO-GOLD', 'Marlboro Gold 20', v_cat_cigarrillos, 1200, 2200, 40, 20, 'active', '7790895002119'),
      (v_kiosko_id, 'CIG-CAMEL', 'Camel 20', v_cat_cigarrillos, 1100, 2100, 35, 20, 'active', '7790895002126'),
      (v_kiosko_id, 'CIG-PM', 'Philip Morris 20', v_cat_cigarrillos, 900, 1800, 45, 25, 'active', '7790895002133'),
      (v_kiosko_id, 'CIG-LUCKY', 'Lucky Strike 20', v_cat_cigarrillos, 1000, 1900, 30, 15, 'active', '7790895002140'),
      (v_kiosko_id, 'CIG-CHESTER', 'Chesterfield 20', v_cat_cigarrillos, 850, 1700, 8, 20, 'low_stock', '7790895002157');
    
    -- Lácteos
    INSERT INTO products (kiosko_id, sku, name, category_id, cost, price, stock, min_stock, status, barcode) VALUES
      (v_kiosko_id, 'LAC-LECHE-1L', 'Leche La Serenísima 1L', v_cat_lacteos, 450, 850, 24, 12, 'active', '7790895003102'),
      (v_kiosko_id, 'LAC-YOGUR-NAT', 'Yogurt Ser Natural', v_cat_lacteos, 350, 700, 18, 10, 'active', '7790895003119'),
      (v_kiosko_id, 'LAC-YOGUR-FRU', 'Yogurt Ser Frutilla', v_cat_lacteos, 350, 700, 15, 10, 'active', '7790895003126'),
      (v_kiosko_id, 'LAC-QUESO-200', 'Queso Cremoso 200g', v_cat_lacteos, 600, 1100, 12, 8, 'active', '7790895003133'),
      (v_kiosko_id, 'LAC-MANTECA-200', 'Manteca 200g', v_cat_lacteos, 700, 1300, 10, 6, 'active', '7790895003140');
    
    -- Golosinas
    INSERT INTO products (kiosko_id, sku, name, category_id, cost, price, stock, min_stock, status, barcode) VALUES
      (v_kiosko_id, 'GOL-MILKA-100', 'Chocolate Milka 100g', v_cat_golosinas, 500, 950, 25, 12, 'active', '7790895004102'),
      (v_kiosko_id, 'GOL-CHICLE', 'Chicles Topline x10', v_cat_golosinas, 150, 350, 50, 25, 'active', '7790895004119'),
      (v_kiosko_id, 'GOL-SUGUS', 'Caramelos Sugus x8', v_cat_golosinas, 100, 250, 60, 30, 'active', '7790895004126'),
      (v_kiosko_id, 'GOL-HAVANNA', 'Alfajor Havanna', v_cat_golosinas, 400, 800, 20, 10, 'active', '7790895004133'),
      (v_kiosko_id, 'GOL-CACHAFAZ', 'Alfajor Cachafaz', v_cat_golosinas, 250, 500, 30, 15, 'active', '7790895004140'),
      (v_kiosko_id, 'GOL-BONOBON', 'Bon o Bon x6', v_cat_golosinas, 350, 700, 5, 15, 'low_stock', '7790895004157');
    
    -- Limpieza
    INSERT INTO products (kiosko_id, sku, name, category_id, cost, price, stock, min_stock, status, barcode) VALUES
      (v_kiosko_id, 'LIM-MAGISTRAL-500', 'Detergente Magistral 500ml', v_cat_limpieza, 400, 850, 15, 8, 'active', '7790895005102'),
      (v_kiosko_id, 'LIM-AYUDIN-1L', 'Lavandina Ayudín 1L', v_cat_limpieza, 300, 600, 20, 10, 'active', '7790895005119'),
      (v_kiosko_id, 'LIM-PAPEL-4', 'Papel Higiénico x4', v_cat_limpieza, 500, 950, 25, 12, 'active', '7790895005126'),
      (v_kiosko_id, 'LIM-SERVILLETAS', 'Servilletas x100', v_cat_limpieza, 200, 450, 18, 10, 'active', '7790895005133');
  END IF;

  -- Add suppliers if none exist
  IF NOT EXISTS (SELECT 1 FROM suppliers WHERE kiosko_id = v_kiosko_id LIMIT 1) THEN
    INSERT INTO suppliers (kiosko_id, name, contact_name, email, phone) VALUES
      (v_kiosko_id, 'Distribuidora Norte', 'Carlos García', 'carlos@distnorte.com', '11-4444-5555'),
      (v_kiosko_id, 'Bebidas del Sur', 'María López', 'maria@bebidasdelsur.com', '11-6666-7777'),
      (v_kiosko_id, 'Tabacalera Central', 'Juan Pérez', 'juan@tabacalera.com', '11-8888-9999'),
      (v_kiosko_id, 'Lácteos Frescos SA', 'Ana Martínez', 'ana@lacteosfrescos.com', '11-2222-3333');
  END IF;

  -- Add employees if none exist
  IF NOT EXISTS (SELECT 1 FROM employees WHERE kiosko_id = v_kiosko_id LIMIT 1) THEN
    INSERT INTO employees (kiosko_id, name, email, phone, role, status, pin, document_id, address, hire_date) VALUES
      (v_kiosko_id, 'María González', 'maria.gonzalez@email.com', '11-1111-2222', 'cashier', 'active', '1234', '12.345.678', 'Calle Falsa 123', NOW() - INTERVAL '6 months'),
      (v_kiosko_id, 'Pedro Sánchez', 'pedro.sanchez@email.com', '11-3333-4444', 'cashier', 'active', '5678', '23.456.789', 'Av. Siempreviva 456', NOW() - INTERVAL '3 months'),
      (v_kiosko_id, 'Laura Fernández', 'laura.fernandez@email.com', '11-5555-6666', 'supervisor', 'active', '9012', '34.567.890', 'Boulevard San Martín 789', NOW() - INTERVAL '1 year');
  END IF;

  -- Add sample sales if none exist
  IF NOT EXISTS (SELECT 1 FROM sales WHERE kiosko_id = v_kiosko_id LIMIT 1) THEN
    FOR i IN 1..50 LOOP
      INSERT INTO sales (kiosko_id, total, subtotal, payment_method, status, created_at)
      VALUES (
        v_kiosko_id,
        (RANDOM() * 5000 + 500)::DECIMAL(10,2),
        (RANDOM() * 4500 + 450)::DECIMAL(10,2),
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

  RETURN 'SUCCESS: Usuario demo configurado correctamente. User ID: ' || v_demo_user_id::TEXT || ', Chain ID: ' || v_chain_id::TEXT || ', Kiosko ID: ' || v_kiosko_id::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Execute the function
SELECT setup_demo_user();
