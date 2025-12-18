-- Disable RLS temporarily 
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE chains DISABLE ROW LEVEL SECURITY;
ALTER TABLE kioscos DISABLE ROW LEVEL SECURITY;
ALTER TABLE employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE sales DISABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE purchases DISABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE cash_registers DISABLE ROW LEVEL SECURITY;
ALTER TABLE notification_configs DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "chains_select" ON chains;
DROP POLICY IF EXISTS "chains_insert" ON chains;
DROP POLICY IF EXISTS "chains_update" ON chains;
DROP POLICY IF EXISTS "chains_delete" ON chains;
DROP POLICY IF EXISTS "kioscos_select" ON kioscos;
DROP POLICY IF EXISTS "kioscos_insert" ON kioscos;
DROP POLICY IF EXISTS "kioscos_update" ON kioscos;
DROP POLICY IF EXISTS "kioscos_delete" ON kioscos;
DROP POLICY IF EXISTS "employees_select" ON employees;
DROP POLICY IF EXISTS "employees_insert" ON employees;
DROP POLICY IF EXISTS "employees_update" ON employees;
DROP POLICY IF EXISTS "products_select" ON products;
DROP POLICY IF EXISTS "products_insert" ON products;
DROP POLICY IF EXISTS "products_update" ON products;
DROP POLICY IF EXISTS "products_delete" ON products;
DROP POLICY IF EXISTS "sales_select" ON sales;
DROP POLICY IF EXISTS "sales_insert" ON sales;
DROP POLICY IF EXISTS "sale_items_select" ON sale_items;
DROP POLICY IF EXISTS "sale_items_insert" ON sale_items;
DROP POLICY IF EXISTS "purchases_select" ON purchases;
DROP POLICY IF EXISTS "purchases_insert" ON purchases;
DROP POLICY IF EXISTS "purchase_items_select" ON purchase_items;
DROP POLICY IF EXISTS "purchase_items_insert" ON purchase_items;
DROP POLICY IF EXISTS "cash_registers_select" ON cash_registers;
DROP POLICY IF EXISTS "cash_registers_all" ON cash_registers;
DROP POLICY IF EXISTS "notification_configs_select" ON notification_configs;
DROP POLICY IF EXISTS "notification_configs_all" ON notification_configs;

-- Re-enable with simple policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON profiles
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE USING (auth.uid() = id);

ALTER TABLE chains ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own chains" ON chains
FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Users can create chains" ON chains
FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update own chains" ON chains
FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Users can delete own chains" ON chains
FOR DELETE USING (owner_id = auth.uid());

ALTER TABLE kioscos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View kioscos of own chain" ON kioscos
FOR SELECT USING (chain_id IN (SELECT id FROM chains WHERE owner_id = auth.uid()));

CREATE POLICY "Create kioscos in own chain" ON kioscos
FOR INSERT WITH CHECK (chain_id IN (SELECT id FROM chains WHERE owner_id = auth.uid()));

CREATE POLICY "Update own kioscos" ON kioscos
FOR UPDATE USING (chain_id IN (SELECT id FROM chains WHERE owner_id = auth.uid()));

CREATE POLICY "Delete own kioscos" ON kioscos
FOR DELETE USING (chain_id IN (SELECT id FROM chains WHERE owner_id = auth.uid()));

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View employees of own kioscos" ON employees
FOR SELECT USING (kiosko_id IN (SELECT id FROM kioscos WHERE chain_id IN (SELECT id FROM chains WHERE owner_id = auth.uid())) OR auth.uid() = user_id);

CREATE POLICY "Create employees in own kioscos" ON employees
FOR INSERT WITH CHECK (kiosko_id IN (SELECT id FROM kioscos WHERE chain_id IN (SELECT id FROM chains WHERE owner_id = auth.uid())));

CREATE POLICY "Update own kiosco employees" ON employees
FOR UPDATE USING (kiosko_id IN (SELECT id FROM kioscos WHERE chain_id IN (SELECT id FROM chains WHERE owner_id = auth.uid())));

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View products of own kioscos" ON products
FOR SELECT USING (kiosko_id IN (SELECT id FROM kioscos WHERE chain_id IN (SELECT id FROM chains WHERE owner_id = auth.uid())));

CREATE POLICY "Create products in own kioscos" ON products
FOR INSERT WITH CHECK (kiosko_id IN (SELECT id FROM kioscos WHERE chain_id IN (SELECT id FROM chains WHERE owner_id = auth.uid())));

CREATE POLICY "Update products in own kioscos" ON products
FOR UPDATE USING (kiosko_id IN (SELECT id FROM kioscos WHERE chain_id IN (SELECT id FROM chains WHERE owner_id = auth.uid())));

CREATE POLICY "Delete products in own kioscos" ON products
FOR DELETE USING (kiosko_id IN (SELECT id FROM kioscos WHERE chain_id IN (SELECT id FROM chains WHERE owner_id = auth.uid())));

ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View sales of own kioscos" ON sales
FOR SELECT USING (kiosko_id IN (SELECT id FROM kioscos WHERE chain_id IN (SELECT id FROM chains WHERE owner_id = auth.uid())));

CREATE POLICY "Create sales in own kioscos" ON sales
FOR INSERT WITH CHECK (kiosko_id IN (SELECT id FROM kioscos WHERE chain_id IN (SELECT id FROM chains WHERE owner_id = auth.uid())));

ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View sale items" ON sale_items
FOR SELECT USING (sale_id IN (SELECT id FROM sales WHERE kiosko_id IN (SELECT id FROM kioscos WHERE chain_id IN (SELECT id FROM chains WHERE owner_id = auth.uid()))));

CREATE POLICY "Create sale items" ON sale_items
FOR INSERT WITH CHECK (sale_id IN (SELECT id FROM sales WHERE kiosko_id IN (SELECT id FROM kioscos WHERE chain_id IN (SELECT id FROM chains WHERE owner_id = auth.uid()))));

ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View purchases of own kioscos" ON purchases
FOR SELECT USING (kiosko_id IN (SELECT id FROM kioscos WHERE chain_id IN (SELECT id FROM chains WHERE owner_id = auth.uid())));

CREATE POLICY "Create purchases in own kioscos" ON purchases
FOR INSERT WITH CHECK (kiosko_id IN (SELECT id FROM kioscos WHERE chain_id IN (SELECT id FROM chains WHERE owner_id = auth.uid())));

ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View purchase items" ON purchase_items
FOR SELECT USING (purchase_id IN (SELECT id FROM purchases WHERE kiosko_id IN (SELECT id FROM kioscos WHERE chain_id IN (SELECT id FROM chains WHERE owner_id = auth.uid()))));

CREATE POLICY "Create purchase items" ON purchase_items
FOR INSERT WITH CHECK (purchase_id IN (SELECT id FROM purchases WHERE kiosko_id IN (SELECT id FROM kioscos WHERE chain_id IN (SELECT id FROM chains WHERE owner_id = auth.uid()))));

ALTER TABLE cash_registers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View cash registers of own kioscos" ON cash_registers
FOR SELECT USING (kiosko_id IN (SELECT id FROM kioscos WHERE chain_id IN (SELECT id FROM chains WHERE owner_id = auth.uid())));

CREATE POLICY "Manage cash registers in own kioscos" ON cash_registers
FOR ALL USING (kiosko_id IN (SELECT id FROM kioscos WHERE chain_id IN (SELECT id FROM chains WHERE owner_id = auth.uid())));

ALTER TABLE notification_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View own notification configs" ON notification_configs
FOR SELECT USING (chain_id IN (SELECT id FROM chains WHERE owner_id = auth.uid()));

CREATE POLICY "Manage own notification configs" ON notification_configs
FOR ALL USING (chain_id IN (SELECT id FROM chains WHERE owner_id = auth.uid()));
