-- Enable Row Level Security on all tables

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_delete_own" ON profiles FOR DELETE USING (auth.uid() = id);

-- Categories policies
CREATE POLICY "categories_select_own" ON categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "categories_insert_own" ON categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "categories_update_own" ON categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "categories_delete_own" ON categories FOR DELETE USING (auth.uid() = user_id);

-- Products policies
CREATE POLICY "products_select_own" ON products FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "products_insert_own" ON products FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "products_update_own" ON products FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "products_delete_own" ON products FOR DELETE USING (auth.uid() = user_id);

-- Sales policies
CREATE POLICY "sales_select_own" ON sales FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "sales_insert_own" ON sales FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "sales_update_own" ON sales FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "sales_delete_own" ON sales FOR DELETE USING (auth.uid() = user_id);

-- Sale items policies
CREATE POLICY "sale_items_select" ON sale_items FOR SELECT 
  USING (EXISTS (SELECT 1 FROM sales WHERE sales.id = sale_items.sale_id AND sales.user_id = auth.uid()));
CREATE POLICY "sale_items_insert" ON sale_items FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM sales WHERE sales.id = sale_items.sale_id AND sales.user_id = auth.uid()));
CREATE POLICY "sale_items_update" ON sale_items FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM sales WHERE sales.id = sale_items.sale_id AND sales.user_id = auth.uid()));
CREATE POLICY "sale_items_delete" ON sale_items FOR DELETE 
  USING (EXISTS (SELECT 1 FROM sales WHERE sales.id = sale_items.sale_id AND sales.user_id = auth.uid()));

-- Cash sessions policies
CREATE POLICY "cash_sessions_select_own" ON cash_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "cash_sessions_insert_own" ON cash_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "cash_sessions_update_own" ON cash_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "cash_sessions_delete_own" ON cash_sessions FOR DELETE USING (auth.uid() = user_id);

-- Cash movements policies
CREATE POLICY "cash_movements_select_own" ON cash_movements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "cash_movements_insert_own" ON cash_movements FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "cash_movements_update_own" ON cash_movements FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "cash_movements_delete_own" ON cash_movements FOR DELETE USING (auth.uid() = user_id);

-- Suppliers policies
CREATE POLICY "suppliers_select_own" ON suppliers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "suppliers_insert_own" ON suppliers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "suppliers_update_own" ON suppliers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "suppliers_delete_own" ON suppliers FOR DELETE USING (auth.uid() = user_id);

-- Purchases policies
CREATE POLICY "purchases_select_own" ON purchases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "purchases_insert_own" ON purchases FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "purchases_update_own" ON purchases FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "purchases_delete_own" ON purchases FOR DELETE USING (auth.uid() = user_id);

-- Purchase items policies
CREATE POLICY "purchase_items_select" ON purchase_items FOR SELECT 
  USING (EXISTS (SELECT 1 FROM purchases WHERE purchases.id = purchase_items.purchase_id AND purchases.user_id = auth.uid()));
CREATE POLICY "purchase_items_insert" ON purchase_items FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM purchases WHERE purchases.id = purchase_items.purchase_id AND purchases.user_id = auth.uid()));
CREATE POLICY "purchase_items_update" ON purchase_items FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM purchases WHERE purchases.id = purchase_items.purchase_id AND purchases.user_id = auth.uid()));
CREATE POLICY "purchase_items_delete" ON purchase_items FOR DELETE 
  USING (EXISTS (SELECT 1 FROM purchases WHERE purchases.id = purchase_items.purchase_id AND purchases.user_id = auth.uid()));

-- Employees policies
CREATE POLICY "employees_select_own" ON employees FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "employees_insert_own" ON employees FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "employees_update_own" ON employees FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "employees_delete_own" ON employees FOR DELETE USING (auth.uid() = user_id);

-- Stock movements policies
CREATE POLICY "stock_movements_select_own" ON stock_movements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "stock_movements_insert_own" ON stock_movements FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "stock_movements_update_own" ON stock_movements FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "stock_movements_delete_own" ON stock_movements FOR DELETE USING (auth.uid() = user_id);

-- Settings policies
CREATE POLICY "settings_select_own" ON settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "settings_insert_own" ON settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "settings_update_own" ON settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "settings_delete_own" ON settings FOR DELETE USING (auth.uid() = user_id);
