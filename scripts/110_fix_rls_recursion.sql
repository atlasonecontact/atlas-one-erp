-- Fix infinite recursion in RLS policies
-- This script completely recreates the policies with simple, non-recursive logic

-- Drop all existing policies that might cause recursion
DROP POLICY IF EXISTS "Users can view their own chain" ON chains;
DROP POLICY IF EXISTS "Users can update their own chain" ON chains;
DROP POLICY IF EXISTS "Users can view kioscos in their chain" ON kioscos;
DROP POLICY IF EXISTS "Users can manage kioscos in their chain" ON kioscos;
DROP POLICY IF EXISTS "chain_owner_can_view_kioscos" ON kioscos;
DROP POLICY IF EXISTS "chain_owner_can_insert_kioscos" ON kioscos;
DROP POLICY IF EXISTS "chain_owner_can_update_kioscos" ON kioscos;
DROP POLICY IF EXISTS "chain_owner_can_delete_kioscos" ON kioscos;
DROP POLICY IF EXISTS "Users can view employees in their kioscos" ON employees;
DROP POLICY IF EXISTS "Users can manage employees in their kioscos" ON employees;
DROP POLICY IF EXISTS "Users can view their own employee record" ON employees;

-- CHAINS: Simple policies without joins
CREATE POLICY "chains_select" ON chains
  FOR SELECT
  USING (owner_id = auth.uid());

CREATE POLICY "chains_insert" ON chains
  FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "chains_update" ON chains
  FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "chains_delete" ON chains
  FOR DELETE
  USING (owner_id = auth.uid());

-- KIOSCOS: Simple policies that only check chain_id ownership
-- First, create a function to check if a chain belongs to the user
CREATE OR REPLACE FUNCTION user_owns_chain(chain_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM chains
    WHERE id = chain_uuid
    AND owner_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE POLICY "kioscos_select" ON kioscos
  FOR SELECT
  USING (user_owns_chain(chain_id));

CREATE POLICY "kioscos_insert" ON kioscos
  FOR INSERT
  WITH CHECK (user_owns_chain(chain_id));

CREATE POLICY "kioscos_update" ON kioscos
  FOR UPDATE
  USING (user_owns_chain(chain_id))
  WITH CHECK (user_owns_chain(chain_id));

CREATE POLICY "kioscos_delete" ON kioscos
  FOR DELETE
  USING (user_owns_chain(chain_id));

-- EMPLOYEES: Check if user owns the chain that owns the kiosko
CREATE OR REPLACE FUNCTION user_owns_kiosko(kiosko_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM kioscos k
    JOIN chains c ON k.chain_id = c.id
    WHERE k.id = kiosko_uuid
    AND c.owner_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE POLICY "employees_select" ON employees
  FOR SELECT
  USING (
    user_owns_kiosko(kiosko_id)
    OR auth.uid() = user_id  -- Employees can see their own record
  );

CREATE POLICY "employees_insert" ON employees
  FOR INSERT
  WITH CHECK (user_owns_kiosko(kiosko_id));

CREATE POLICY "employees_update" ON employees
  FOR UPDATE
  USING (user_owns_kiosko(kiosko_id))
  WITH CHECK (user_owns_kiosko(kiosko_id));

CREATE POLICY "employees_delete" ON employees
  FOR DELETE
  USING (user_owns_kiosko(kiosko_id));

-- PRODUCTS: Check ownership through kiosko
CREATE POLICY "products_select" ON products
  FOR SELECT
  USING (user_owns_kiosko(kiosko_id));

CREATE POLICY "products_insert" ON products
  FOR INSERT
  WITH CHECK (user_owns_kiosko(kiosko_id));

CREATE POLICY "products_update" ON products
  FOR UPDATE
  USING (user_owns_kiosko(kiosko_id))
  WITH CHECK (user_owns_kiosko(kiosko_id));

CREATE POLICY "products_delete" ON products
  FOR DELETE
  USING (user_owns_kiosko(kiosko_id));

-- SALES: Check ownership through kiosko
CREATE POLICY "sales_select" ON sales
  FOR SELECT
  USING (user_owns_kiosko(kiosko_id));

CREATE POLICY "sales_insert" ON sales
  FOR INSERT
  WITH CHECK (user_owns_kiosko(kiosko_id));

CREATE POLICY "sales_update" ON sales
  FOR UPDATE
  USING (user_owns_kiosko(kiosko_id))
  WITH CHECK (user_owns_kiosko(kiosko_id));

-- SUBSCRIPTION_PLANS: Everyone can view plans
DROP POLICY IF EXISTS "Everyone can view subscription plans" ON subscription_plans;
CREATE POLICY "subscription_plans_select" ON subscription_plans
  FOR SELECT
  TO authenticated
  USING (true);

-- NOTIFICATION_CONFIGS: Check ownership through kiosko
CREATE POLICY "notification_configs_select" ON notification_configs
  FOR SELECT
  USING (user_owns_kiosko(kiosko_id));

CREATE POLICY "notification_configs_insert" ON notification_configs
  FOR INSERT
  WITH CHECK (user_owns_kiosko(kiosko_id));

CREATE POLICY "notification_configs_update" ON notification_configs
  FOR UPDATE
  USING (user_owns_kiosko(kiosko_id))
  WITH CHECK (user_owns_kiosko(kiosko_id));

CREATE POLICY "notification_configs_delete" ON notification_configs
  FOR DELETE
  USING (user_owns_kiosko(kiosko_id));

-- Grant execute permissions on helper functions
GRANT EXECUTE ON FUNCTION user_owns_chain(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION user_owns_kiosko(UUID) TO authenticated;

-- Ensure the trigger for creating chain on user signup exists
CREATE OR REPLACE FUNCTION create_chain_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create a chain for the new user
  INSERT INTO chains (owner_id, name, created_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'chain_name', 'Mi Cadena'),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_create_chain ON auth.users;
CREATE TRIGGER on_auth_user_created_create_chain
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_chain_for_new_user();
