-- ============================================================================
-- 211_cash_register_employee_access.sql
-- Un empleado no podia abrir/usar la caja: las politicas de cash_registers
-- (106_fix_rls_policies.sql) solo contemplaban al dueño de la cadena.
-- Ahora el dueño del kiosko y los empleados ACTIVOS de ese kiosko pueden ver y
-- operar sus cajas y movimientos; nadie de otro kiosko. El permiso fino
-- (can_open_register / can_close_register) lo sigue controlando la pantalla.
-- ============================================================================

ALTER TABLE cash_registers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "View cash registers of own kioscos" ON cash_registers;
DROP POLICY IF EXISTS "Manage cash registers in own kioscos" ON cash_registers;
DROP POLICY IF EXISTS "Owners can manage cash_registers" ON cash_registers;
DROP POLICY IF EXISTS "Employees can manage own cash_register" ON cash_registers;
DROP POLICY IF EXISTS "cash_registers_select" ON cash_registers;
DROP POLICY IF EXISTS "cash_registers_all" ON cash_registers;
DROP POLICY IF EXISTS "cash_registers_owner_or_employee" ON cash_registers;

CREATE POLICY "cash_registers_owner_or_employee" ON cash_registers
  FOR ALL TO authenticated
  USING (
    kiosko_id IN (SELECT id FROM kioscos WHERE owner_id = auth.uid())
    OR kiosko_id IN (SELECT kiosko_id FROM employees WHERE user_id = auth.uid() AND status = 'active')
  )
  WITH CHECK (
    kiosko_id IN (SELECT id FROM kioscos WHERE owner_id = auth.uid())
    OR kiosko_id IN (SELECT kiosko_id FROM employees WHERE user_id = auth.uid() AND status = 'active')
  );

ALTER TABLE cash_register_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cash_register_transactions_owner_or_employee" ON cash_register_transactions;

CREATE POLICY "cash_register_transactions_owner_or_employee" ON cash_register_transactions
  FOR ALL TO authenticated
  USING (
    cash_register_id IN (
      SELECT id FROM cash_registers
      WHERE kiosko_id IN (SELECT id FROM kioscos WHERE owner_id = auth.uid())
         OR kiosko_id IN (SELECT kiosko_id FROM employees WHERE user_id = auth.uid() AND status = 'active')
    )
  )
  WITH CHECK (
    cash_register_id IN (
      SELECT id FROM cash_registers
      WHERE kiosko_id IN (SELECT id FROM kioscos WHERE owner_id = auth.uid())
         OR kiosko_id IN (SELECT kiosko_id FROM employees WHERE user_id = auth.uid() AND status = 'active')
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.cash_registers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.cash_register_transactions TO authenticated;
