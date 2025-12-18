-- RLS Policies para el sistema multi-tenant

-- Habilitar RLS en nuevas tablas
ALTER TABLE chains ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE phone_verifications ENABLE ROW LEVEL SECURITY;

-- CHAINS: Solo el dueño puede ver/editar su cadena
CREATE POLICY "Users can view their own chain"
  ON chains FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can update their own chain"
  ON chains FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own chain"
  ON chains FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- SUBSCRIPTION_PLANS: Todos pueden leer los planes
CREATE POLICY "Anyone can view subscription plans"
  ON subscription_plans FOR SELECT
  TO authenticated
  USING (true);

-- KIOSCOS: El dueño de la cadena puede ver/editar sus kioscos
CREATE POLICY "Chain owners can view their kioscos"
  ON kioscos FOR SELECT
  USING (
    chain_id IN (
      SELECT id FROM chains WHERE owner_id = auth.uid()
    )
    OR
    -- Los empleados pueden ver el kiosko donde trabajan
    id IN (
      SELECT kiosko_id FROM employees WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Chain owners can insert kioscos"
  ON kioscos FOR INSERT
  WITH CHECK (
    chain_id IN (
      SELECT id FROM chains WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Chain owners can update their kioscos"
  ON kioscos FOR UPDATE
  USING (
    chain_id IN (
      SELECT id FROM chains WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Chain owners can delete their kioscos"
  ON kioscos FOR DELETE
  USING (
    chain_id IN (
      SELECT id FROM chains WHERE owner_id = auth.uid()
    )
  );

-- EMPLOYEES: El dueño y gerentes pueden ver/editar empleados
DROP POLICY IF EXISTS "Users can view business employees" ON employees;
DROP POLICY IF EXISTS "Users can manage business employees" ON employees;

CREATE POLICY "Kiosko owners can view employees"
  ON employees FOR SELECT
  USING (
    kiosko_id IN (
      SELECT k.id FROM kioscos k
      JOIN chains c ON k.chain_id = c.id
      WHERE c.owner_id = auth.uid()
    )
    OR
    -- Los empleados pueden ver su propio registro
    user_id = auth.uid()
  );

CREATE POLICY "Kiosko owners can insert employees"
  ON employees FOR INSERT
  WITH CHECK (
    kiosko_id IN (
      SELECT k.id FROM kioscos k
      JOIN chains c ON k.chain_id = c.id
      WHERE c.owner_id = auth.uid()
    )
  );

CREATE POLICY "Kiosko owners can update employees"
  ON employees FOR UPDATE
  USING (
    kiosko_id IN (
      SELECT k.id FROM kioscos k
      JOIN chains c ON k.chain_id = c.id
      WHERE c.owner_id = auth.uid()
    )
  );

CREATE POLICY "Kiosko owners can delete employees"
  ON employees FOR DELETE
  USING (
    kiosko_id IN (
      SELECT k.id FROM kioscos k
      JOIN chains c ON k.chain_id = c.id
      WHERE c.owner_id = auth.uid()
    )
  );

-- SALES: Dueños ven todas las ventas, empleados solo las suyas
DROP POLICY IF EXISTS "Users can view business sales" ON sales;
DROP POLICY IF EXISTS "Users can create sales" ON sales;

CREATE POLICY "Owners can view all kiosko sales"
  ON sales FOR SELECT
  USING (
    kiosko_id IN (
      SELECT k.id FROM kioscos k
      JOIN chains c ON k.chain_id = c.id
      WHERE c.owner_id = auth.uid()
    )
    OR
    -- Empleados ven sus propias ventas
    employee_id IN (
      SELECT id FROM employees WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Owners and employees can create sales"
  ON sales FOR INSERT
  WITH CHECK (
    kiosko_id IN (
      SELECT k.id FROM kioscos k
      JOIN chains c ON k.chain_id = c.id
      WHERE c.owner_id = auth.uid()
    )
    OR
    employee_id IN (
      SELECT id FROM employees WHERE user_id = auth.uid()
    )
  );

-- PRODUCTS: Por kiosko
DROP POLICY IF EXISTS "Users can view business products" ON products;
DROP POLICY IF EXISTS "Users can manage business products" ON products;

CREATE POLICY "Kiosko members can view products"
  ON products FOR SELECT
  USING (
    kiosko_id IN (
      SELECT k.id FROM kioscos k
      JOIN chains c ON k.chain_id = c.id
      WHERE c.owner_id = auth.uid()
    )
    OR
    kiosko_id IN (
      SELECT kiosko_id FROM employees WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Kiosko owners can manage products"
  ON products FOR ALL
  USING (
    kiosko_id IN (
      SELECT k.id FROM kioscos k
      JOIN chains c ON k.chain_id = c.id
      WHERE c.owner_id = auth.uid()
    )
  );

-- PHONE_VERIFICATIONS: Solo el dueño del kiosko
CREATE POLICY "Kiosko owners can manage phone verifications"
  ON phone_verifications FOR ALL
  USING (
    kiosko_id IN (
      SELECT k.id FROM kioscos k
      JOIN chains c ON k.chain_id = c.id
      WHERE c.owner_id = auth.uid()
    )
  );
