-- ============================================================================
-- 221_legal_acceptances_audit.sql
-- Historial de aceptaciones de documentos legales (Términos y Política de
-- Privacidad), con evidencia técnica: versión, fecha/hora, IP y navegador.
-- Es de solo escritura por fila (append-only): nunca se pisa una aceptación
-- anterior, aunque se acepte una versión nueva. Complementa a
-- profiles.terms_accepted_at/privacy_accepted_at, que guardan sólo la última
-- aceptación para el chequeo rápido en el login.
-- Reversion: DROP TABLE user_legal_acceptances; las columnas de profiles son
-- inocuas y se pueden dropear sin efecto.
-- ============================================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS privacy_accepted_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS privacy_version TEXT;

CREATE TABLE IF NOT EXISTS user_legal_acceptances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('terms', 'privacy')),
  version TEXT NOT NULL,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT,
  acceptance_method TEXT NOT NULL DEFAULT 'checkbox_dashboard',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_legal_acceptances_user ON user_legal_acceptances (user_id);

ALTER TABLE user_legal_acceptances ENABLE ROW LEVEL SECURITY;

-- Cada usuario puede ver y crear sus propias aceptaciones, pero no editarlas ni
-- borrarlas (es un historial, no un estado que se pueda modificar).
DROP POLICY IF EXISTS "user_legal_acceptances_select_own" ON user_legal_acceptances;
CREATE POLICY "user_legal_acceptances_select_own" ON user_legal_acceptances
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "user_legal_acceptances_insert_own" ON user_legal_acceptances;
CREATE POLICY "user_legal_acceptances_insert_own" ON user_legal_acceptances
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

GRANT SELECT, INSERT ON TABLE public.user_legal_acceptances TO authenticated;
