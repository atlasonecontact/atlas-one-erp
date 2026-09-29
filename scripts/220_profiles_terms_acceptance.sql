-- ============================================================================
-- 220_profiles_terms_acceptance.sql
-- Guarda si el usuario aceptó los Términos y Condiciones y qué versión, para
-- poder mostrarle la cajita de aceptación una sola vez (y de nuevo si cambian
-- los términos). No rompe nada existente: default NULL = "todavía no aceptó".
-- Reversion: las dos columnas son inocuas, se pueden dropear sin efecto.
-- ============================================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS terms_version TEXT;
