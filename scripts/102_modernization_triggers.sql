-- Triggers y funciones auxiliares para el sistema multi-tenant

-- 1. Trigger para actualizar updated_at en chains
CREATE OR REPLACE FUNCTION update_chains_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER chains_updated_at
  BEFORE UPDATE ON chains
  FOR EACH ROW
  EXECUTE FUNCTION update_chains_updated_at();

-- 2. Trigger para sincronizar configuración de colores
CREATE OR REPLACE FUNCTION sync_user_preferences()
RETURNS TRIGGER AS $$
BEGIN
  -- Cuando se actualiza el kiosko, podemos guardar preferencias
  -- Esta función se puede expandir según necesidades
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER kioscos_preferences_sync
  AFTER UPDATE ON kioscos
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_preferences();

-- 3. Función para obtener kioscos de un dueño
CREATE OR REPLACE FUNCTION get_user_kioscos(p_user_id UUID)
RETURNS TABLE (
  kiosko_id UUID,
  kiosko_name TEXT,
  location TEXT,
  status TEXT,
  plan_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    k.id,
    k.name,
    k.location,
    k.status,
    sp.name
  FROM kioscos k
  JOIN chains c ON k.chain_id = c.id
  LEFT JOIN subscription_plans sp ON k.subscription_plan_id = sp.id
  WHERE c.owner_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Función para verificar si un usuario es dueño o empleado
CREATE OR REPLACE FUNCTION get_user_role(p_user_id UUID, p_kiosko_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_role TEXT;
BEGIN
  -- Verificar si es dueño
  IF EXISTS (
    SELECT 1 FROM kioscos k
    JOIN chains c ON k.chain_id = c.id
    WHERE k.id = p_kiosko_id AND c.owner_id = p_user_id
  ) THEN
    RETURN 'owner';
  END IF;
  
  -- Verificar si es empleado
  IF EXISTS (
    SELECT 1 FROM employees
    WHERE user_id = p_user_id AND kiosko_id = p_kiosko_id AND is_active = true
  ) THEN
    RETURN 'employee';
  END IF;
  
  RETURN 'none';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Función para obtener permisos de un usuario
CREATE OR REPLACE FUNCTION get_user_permissions(p_user_id UUID, p_kiosko_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_permissions JSONB;
BEGIN
  -- Si es dueño, todos los permisos
  IF get_user_role(p_user_id, p_kiosko_id) = 'owner' THEN
    RETURN '{"can_sell": true, "can_view_reports": true, "can_manage_inventory": true, "can_manage_employees": true, "can_manage_settings": true}'::JSONB;
  END IF;
  
  -- Si es empleado, obtener sus permisos
  SELECT permissions INTO v_permissions
  FROM employees
  WHERE user_id = p_user_id AND kiosko_id = p_kiosko_id AND is_active = true;
  
  RETURN COALESCE(v_permissions, '{}'::JSONB);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Función para validar límites del plan
CREATE OR REPLACE FUNCTION validate_plan_limits(p_kiosko_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_plan subscription_plans%ROWTYPE;
  v_employee_count INTEGER;
  v_product_count INTEGER;
BEGIN
  -- Obtener plan del kiosko
  SELECT sp.* INTO v_plan
  FROM kioscos k
  JOIN subscription_plans sp ON k.subscription_plan_id = sp.id
  WHERE k.id = p_kiosko_id;
  
  -- Contar empleados activos
  SELECT COUNT(*) INTO v_employee_count
  FROM employees
  WHERE kiosko_id = p_kiosko_id AND is_active = true;
  
  -- Contar productos activos
  SELECT COUNT(*) INTO v_product_count
  FROM products
  WHERE kiosko_id = p_kiosko_id;
  
  -- Validar límites
  IF v_employee_count > v_plan.max_employees THEN
    RAISE EXCEPTION 'Límite de empleados excedido. Tu plan permite % empleados.', v_plan.max_employees;
  END IF;
  
  IF v_product_count > v_plan.max_products THEN
    RAISE EXCEPTION 'Límite de productos excedido. Tu plan permite % productos.', v_plan.max_products;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;
