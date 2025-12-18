-- Seed demo data for test user
-- Note: This will be associated with the test user after they sign up
-- The user email: demo@atlasone.com / password: demo123456

-- First, let's create a function to seed data for a user
CREATE OR REPLACE FUNCTION seed_demo_data(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_cat_bebidas UUID;
  v_cat_snacks UUID;
  v_cat_cigarrillos UUID;
  v_cat_lacteos UUID;
  v_cat_golosinas UUID;
  v_cat_limpieza UUID;
BEGIN
  -- Create categories
  INSERT INTO categories (id, user_id, name, description, color) VALUES
    (gen_random_uuid(), p_user_id, 'Bebidas', 'Bebidas frías y calientes', '#00d4ff')
  RETURNING id INTO v_cat_bebidas;
  
  INSERT INTO categories (id, user_id, name, description, color) VALUES
    (gen_random_uuid(), p_user_id, 'Snacks', 'Papas, galletas y snacks', '#ff6b6b')
  RETURNING id INTO v_cat_snacks;
  
  INSERT INTO categories (id, user_id, name, description, color) VALUES
    (gen_random_uuid(), p_user_id, 'Cigarrillos', 'Tabaco y cigarrillos', '#ffd93d')
  RETURNING id INTO v_cat_cigarrillos;
  
  INSERT INTO categories (id, user_id, name, description, color) VALUES
    (gen_random_uuid(), p_user_id, 'Lácteos', 'Leche, yogurt y derivados', '#6bcb77')
  RETURNING id INTO v_cat_lacteos;
  
  INSERT INTO categories (id, user_id, name, description, color) VALUES
    (gen_random_uuid(), p_user_id, 'Golosinas', 'Dulces y caramelos', '#9b59b6')
  RETURNING id INTO v_cat_golosinas;
  
  INSERT INTO categories (id, user_id, name, description, color) VALUES
    (gen_random_uuid(), p_user_id, 'Limpieza', 'Productos de limpieza', '#3498db')
  RETURNING id INTO v_cat_limpieza;

  -- Create products
  INSERT INTO products (user_id, name, category_id, cost, price, stock, min_stock, status, barcode) VALUES
    -- Bebidas
    (p_user_id, 'Coca Cola 500ml', v_cat_bebidas, 350, 700, 48, 20, 'active', '7790895000102'),
    (p_user_id, 'Coca Cola 1.5L', v_cat_bebidas, 600, 1200, 24, 12, 'active', '7790895000119'),
    (p_user_id, 'Sprite 500ml', v_cat_bebidas, 340, 680, 36, 15, 'active', '7790895000126'),
    (p_user_id, 'Fanta Naranja 500ml', v_cat_bebidas, 340, 680, 30, 15, 'active', '7790895000133'),
    (p_user_id, 'Agua Mineral 500ml', v_cat_bebidas, 150, 400, 60, 30, 'active', '7790895000140'),
    (p_user_id, 'Agua Mineral 1.5L', v_cat_bebidas, 250, 600, 36, 18, 'active', '7790895000157'),
    (p_user_id, 'Cerveza Quilmes 473ml', v_cat_bebidas, 450, 900, 48, 24, 'active', '7790895000164'),
    (p_user_id, 'Cerveza Brahma 473ml', v_cat_bebidas, 400, 850, 48, 24, 'active', '7790895000171'),
    (p_user_id, 'Gatorade 500ml', v_cat_bebidas, 500, 950, 24, 12, 'active', '7790895000188'),
    (p_user_id, 'Monster Energy', v_cat_bebidas, 800, 1500, 18, 10, 'active', '7790895000195'),
    (p_user_id, 'Red Bull', v_cat_bebidas, 900, 1800, 12, 8, 'active', '7790895000201'),
    (p_user_id, 'Speed Max', v_cat_bebidas, 600, 1100, 24, 12, 'active', '7790895000218'),
    
    -- Snacks
    (p_user_id, 'Papas Lays Clásicas', v_cat_snacks, 400, 850, 30, 15, 'active', '7790895001102'),
    (p_user_id, 'Papas Lays Jamón', v_cat_snacks, 400, 850, 25, 15, 'active', '7790895001119'),
    (p_user_id, 'Doritos Queso', v_cat_snacks, 450, 900, 20, 10, 'active', '7790895001126'),
    (p_user_id, 'Cheetos', v_cat_snacks, 350, 750, 28, 12, 'active', '7790895001133'),
    (p_user_id, 'Palitos Salados', v_cat_snacks, 200, 450, 40, 20, 'active', '7790895001140'),
    (p_user_id, 'Maní Salado 100g', v_cat_snacks, 300, 600, 35, 15, 'active', '7790895001157'),
    
    -- Cigarrillos
    (p_user_id, 'Marlboro Box 20', v_cat_cigarrillos, 1200, 2200, 50, 25, 'active', '7790895002102'),
    (p_user_id, 'Marlboro Gold 20', v_cat_cigarrillos, 1200, 2200, 40, 20, 'active', '7790895002119'),
    (p_user_id, 'Camel 20', v_cat_cigarrillos, 1100, 2100, 35, 20, 'active', '7790895002126'),
    (p_user_id, 'Philip Morris 20', v_cat_cigarrillos, 900, 1800, 45, 25, 'active', '7790895002133'),
    (p_user_id, 'Lucky Strike 20', v_cat_cigarrillos, 1000, 1900, 30, 15, 'active', '7790895002140'),
    (p_user_id, 'Chesterfield 20', v_cat_cigarrillos, 850, 1700, 8, 20, 'low_stock', '7790895002157'),
    
    -- Lácteos
    (p_user_id, 'Leche La Serenísima 1L', v_cat_lacteos, 450, 850, 24, 12, 'active', '7790895003102'),
    (p_user_id, 'Yogurt Ser Natural', v_cat_lacteos, 350, 700, 18, 10, 'active', '7790895003119'),
    (p_user_id, 'Yogurt Ser Frutilla', v_cat_lacteos, 350, 700, 15, 10, 'active', '7790895003126'),
    (p_user_id, 'Queso Cremoso 200g', v_cat_lacteos, 600, 1100, 12, 8, 'active', '7790895003133'),
    (p_user_id, 'Manteca 200g', v_cat_lacteos, 700, 1300, 10, 6, 'active', '7790895003140'),
    
    -- Golosinas
    (p_user_id, 'Chocolate Milka 100g', v_cat_golosinas, 500, 950, 25, 12, 'active', '7790895004102'),
    (p_user_id, 'Chicles Topline x10', v_cat_golosinas, 150, 350, 50, 25, 'active', '7790895004119'),
    (p_user_id, 'Caramelos Sugus x8', v_cat_golosinas, 100, 250, 60, 30, 'active', '7790895004126'),
    (p_user_id, 'Alfajor Havanna', v_cat_golosinas, 400, 800, 20, 10, 'active', '7790895004133'),
    (p_user_id, 'Alfajor Cachafaz', v_cat_golosinas, 250, 500, 30, 15, 'active', '7790895004140'),
    (p_user_id, 'Bon o Bon x6', v_cat_golosinas, 350, 700, 5, 15, 'low_stock', '7790895004157'),
    
    -- Limpieza
    (p_user_id, 'Detergente Magistral 500ml', v_cat_limpieza, 400, 850, 15, 8, 'active', '7790895005102'),
    (p_user_id, 'Lavandina Ayudín 1L', v_cat_limpieza, 300, 600, 20, 10, 'active', '7790895005119'),
    (p_user_id, 'Papel Higiénico x4', v_cat_limpieza, 500, 950, 25, 12, 'active', '7790895005126'),
    (p_user_id, 'Servilletas x100', v_cat_limpieza, 200, 450, 18, 10, 'active', '7790895005133');

  -- Create suppliers
  INSERT INTO suppliers (user_id, name, contact_name, email, phone) VALUES
    (p_user_id, 'Distribuidora Norte', 'Carlos García', 'carlos@distnorte.com', '11-4444-5555'),
    (p_user_id, 'Bebidas del Sur', 'María López', 'maria@bebidasdelsur.com', '11-6666-7777'),
    (p_user_id, 'Tabacalera Central', 'Juan Pérez', 'juan@tabacalera.com', '11-8888-9999'),
    (p_user_id, 'Lácteos Frescos SA', 'Ana Martínez', 'ana@lacteosfrescos.com', '11-2222-3333');

  -- Create some sample sales (last 30 days)
  FOR i IN 1..50 LOOP
    INSERT INTO sales (user_id, total, subtotal, payment_method, status, created_at)
    VALUES (
      p_user_id,
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

  -- Create employees
  INSERT INTO employees (user_id, name, email, phone, role, status, pin) VALUES
    (p_user_id, 'María González', 'maria.gonzalez@email.com', '11-1111-2222', 'cashier', 'active', '1234'),
    (p_user_id, 'Pedro Sánchez', 'pedro.sanchez@email.com', '11-3333-4444', 'cashier', 'active', '5678'),
    (p_user_id, 'Laura Fernández', 'laura.fernandez@email.com', '11-5555-6666', 'supervisor', 'active', '9012');

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a simpler approach: trigger that seeds data when profile is created with business_name = 'Demo Business'
CREATE OR REPLACE FUNCTION seed_on_demo_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- Only seed for demo accounts
  IF NEW.business_name = 'Demo Business' THEN
    PERFORM seed_demo_data(NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_seed_demo ON profiles;
CREATE TRIGGER trigger_seed_demo
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION seed_on_demo_signup();
