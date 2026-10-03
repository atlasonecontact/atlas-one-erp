-- ============================================================================
-- 227_schema_migrations_tracking.sql
-- Hasta ahora no había ningún registro de qué scripts de scripts/ se habían
-- corrido de verdad en la base (sólo lo que recordábamos de memoria/chat). Esta
-- tabla es el registro: después de correr un script nuevo en el SQL Editor,
-- se inserta una fila acá para dejarlo asentado. No reemplaza nada, es pura
-- trazabilidad — un script puede seguir corriéndose sin esto y nada se rompe.
--
-- Convención desde acá en adelante (ver scripts/README.md):
--   1) Todo script nuevo tiene que ser idempotente (IF NOT EXISTS / IF EXISTS /
--      CREATE OR REPLACE / DROP POLICY IF EXISTS...), para poder re-correrlo
--      sin miedo si hay dudas de si ya se aplicó.
--   2) Todo script nuevo lleva, en el encabezado, una línea "Reversion:" que
--      diga en una frase cómo deshacerlo (DROP TABLE, DISABLE ROW LEVEL
--      SECURITY, etc.) — no hace falta un script de rollback aparte para algo
--      tan chico como esta app, pero si no se puede explicar en una línea cómo
--      se deshace, es señal de que el cambio es más riesgoso de lo que parece.
--   3) Después de correrlo con éxito en Supabase, agregar una fila acá (ver el
--      INSERT de ejemplo al final de este archivo).
--
-- Reversion: DROP TABLE schema_migrations; no afecta ninguna otra tabla.
-- ============================================================================

CREATE TABLE IF NOT EXISTS schema_migrations (
  version             TEXT PRIMARY KEY, -- ej: '227_schema_migrations_tracking'
  applied_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  reversible_in_one_line BOOLEAN NOT NULL DEFAULT true,
  notes               TEXT
);

ALTER TABLE schema_migrations ENABLE ROW LEVEL SECURITY;

-- Sólo lectura desde la app (si alguna pantalla de admin quisiera mostrarlo).
-- Las inserciones se hacen a mano desde el SQL Editor, no desde la app.
DROP POLICY IF EXISTS schema_migrations_read ON schema_migrations;
CREATE POLICY schema_migrations_read
ON schema_migrations
FOR SELECT
TO authenticated
USING (true);

GRANT SELECT ON TABLE public.schema_migrations TO authenticated;
GRANT ALL PRIVILEGES ON TABLE public.schema_migrations TO service_role;

-- Carga retroactiva: lo corrido en esta sesión (2026-09-29 a 2026-10-02), confirmado
-- uno por uno porque cada uno dio "Success" al correrlo. Lo anterior a 220 no se
-- carga acá por no tener certeza de la fecha exacta en que se aplicó cada uno.
INSERT INTO schema_migrations (version, notes) VALUES
  ('220_profiles_terms_acceptance', 'Cajita de Términos y Condiciones'),
  ('221_legal_acceptances_audit', 'Auditoría de aceptación de T&C/Privacidad'),
  ('222_promotions_enable_rls', 'RLS real en promotions/promotion_items'),
  ('223_hash_employee_pins', 'PIN de empleados hasheado (bcrypt)'),
  ('224_fix_products_rls', 'RLS de products: saca el modelo viejo de chains'),
  ('225_price_surcharges', 'Tabla de recargo por horario'),
  ('226_price_surcharges_allow_employees', 'Empleados también pueden configurar el recargo'),
  ('227_schema_migrations_tracking', 'Esta misma tabla')
ON CONFLICT (version) DO NOTHING;
