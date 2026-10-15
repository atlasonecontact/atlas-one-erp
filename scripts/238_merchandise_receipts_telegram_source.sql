-- ============================================================================
-- 238_merchandise_receipts_telegram_source.sql
-- Soporte para recepciones de mercadería que llegan como foto de factura por
-- Telegram: la IA lee la foto y crea un borrador (status='draft') con items
-- sin product_id (solo el nombre que decía la factura); el dueño/empleado los
-- completa escaneando cada producto en Recepción de Mercadería.
--
-- Esta columna es solo para distinguir en la UI cuáles borradores vinieron
-- de Telegram (badge) de los que se cargaron a mano. El webhook de Telegram
-- (app/api/telegram/webhook/route.ts) escribe con el cliente admin, que no
-- pasa por RLS, así que no hace falta tocar policies.
--
-- Reversion: ALTER TABLE merchandise_receipts DROP COLUMN source;
-- ============================================================================

ALTER TABLE merchandise_receipts
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual';

ALTER TABLE merchandise_receipts DROP CONSTRAINT IF EXISTS merchandise_receipts_source_check;
ALTER TABLE merchandise_receipts
  ADD CONSTRAINT merchandise_receipts_source_check CHECK (source IN ('manual', 'telegram'));

INSERT INTO schema_migrations (version, notes)
VALUES ('238_merchandise_receipts_telegram_source', 'Agrega merchandise_receipts.source para distinguir borradores creados por foto de Telegram')
ON CONFLICT (version) DO NOTHING;
