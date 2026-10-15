-- ============================================================================
-- 237_drop_dead_cash_tables.sql
-- cash_movements y cash_sessions son del esquema viejo (001_create_tables.sql),
-- reemplazadas hace tiempo por cash_register_transactions/cash_registers.
-- Verificado (2026-10) que ningún código de la app, hook, componente ni
-- función RPC las lee o escribe — son peso muerto en el esquema, no se usan
-- para nada. Lo único que sí usa "cash_movements" en el nombre es un script
-- de migración (216) cuyo contenido no toca estas tablas, solo coincide en el
-- nombre del archivo.
--
-- Reversion: no es un DROP reversible con una línea de SQL. Si hiciera falta
-- recuperar datos viejos de estas tablas, es restaurar desde un backup/Point
-- in Time Recovery de Supabase (Configuración del proyecto > Database >
-- Backups), no algo que se deshaga desde este script.
-- ============================================================================

DROP TABLE IF EXISTS cash_movements CASCADE;
DROP TABLE IF EXISTS cash_sessions CASCADE;

INSERT INTO schema_migrations (version, notes)
VALUES ('237_drop_dead_cash_tables', 'Elimina cash_movements/cash_sessions: esquema viejo sin ninguna referencia en el codigo actual')
ON CONFLICT (version) DO NOTHING;
