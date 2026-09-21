-- Arqueo real al cerrar caja: hasta ahora "Cerrar Caja" escribía el saldo
-- teórico como si fuera el saldo contado, así que nunca podía detectar una
-- diferencia de caja. Estas columnas guardan el conteo real del cajero y la
-- diferencia contra lo esperado, para tener historial de cierres confiable.
alter table public.cash_registers
  add column if not exists expected_cash numeric,
  add column if not exists counted_cash numeric,
  add column if not exists cash_difference numeric,
  add column if not exists closing_notes text;
