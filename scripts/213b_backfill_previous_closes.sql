-- ============================================================================
-- 213b_backfill_previous_closes.sql  (OPCIONAL)
-- Los cierres de caja hechos ANTES de scripts/212 no dejaron registrado a
-- donde fue el efectivo, asi que la caja fuerte arranca en $0. Este script los
-- suma: por cada caja cerrada sin retiro registrado, guarda en la caja fuerte
-- lo contado menos el saldo con el que se abrio (la ganancia en efectivo del
-- turno) y deja el saldo de apertura como "queda en caja".
-- Se puede correr una sola vez: despues de correrlo esas cajas ya tienen dato
-- y no se vuelven a tomar.
-- ============================================================================

WITH todo AS (
  SELECT id,
         kiosko_id,
         closed_at,
         COALESCE(opening_balance, 0) AS opening,
         GREATEST(COALESCE(counted_cash, closing_balance, 0) - COALESCE(opening_balance, 0), 0) AS amt
    FROM cash_registers
   WHERE status = 'closed'
     AND left_for_next IS NULL
     AND withdrawn_destination IS NULL
     AND COALESCE(counted_cash, closing_balance, 0) > 0
),
ins AS (
  INSERT INTO treasury_movements (kiosko_id, account, direction, amount, concept, note, cash_register_id, created_at, created_by)
  SELECT kiosko_id, 'safe', 'in', amt, 'cash_close', 'Cierre anterior a la cuenta de plata', id, closed_at, NULL
    FROM todo
   WHERE amt > 0
  RETURNING cash_register_id
)
UPDATE cash_registers r
   SET withdrawn_amount = t.amt,
       withdrawn_destination = CASE WHEN t.amt > 0 THEN 'safe' ELSE NULL END,
       left_for_next = t.opening
  FROM todo t
 WHERE r.id = t.id;
