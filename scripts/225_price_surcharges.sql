-- ============================================================================
-- 225_price_surcharges.sql
-- Recargo automático por franja horaria (ej: +10% de 22:00 a 4:00). Un solo
-- config por kiosko, que el punto de venta aplica solo mientras la hora
-- actual cae dentro de la franja (soporta que cruce la medianoche).
-- ============================================================================

CREATE TABLE IF NOT EXISTS price_surcharges (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kiosko_id   UUID NOT NULL UNIQUE REFERENCES kioscos(id) ON DELETE CASCADE,
  enabled     BOOLEAN NOT NULL DEFAULT false,
  percentage  NUMERIC NOT NULL DEFAULT 0 CHECK (percentage >= 0 AND percentage <= 500),
  start_time  TIME NOT NULL DEFAULT '22:00',
  end_time    TIME NOT NULL DEFAULT '04:00',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE price_surcharges ENABLE ROW LEVEL SECURITY;

CREATE POLICY price_surcharges_select
ON price_surcharges
FOR SELECT
TO authenticated
USING (
  kiosko_id IN (SELECT id FROM kioscos WHERE owner_id = auth.uid())
  OR kiosko_id IN (SELECT kiosko_id FROM employees WHERE user_id = auth.uid() AND status = 'active')
);

CREATE POLICY price_surcharges_owner_write
ON price_surcharges
FOR ALL
TO authenticated
USING (kiosko_id IN (SELECT id FROM kioscos WHERE owner_id = auth.uid()))
WITH CHECK (kiosko_id IN (SELECT id FROM kioscos WHERE owner_id = auth.uid()));

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.price_surcharges TO authenticated;
