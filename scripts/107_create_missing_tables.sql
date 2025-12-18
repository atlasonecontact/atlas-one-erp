-- Crear tablas que faltan sin eliminar las existentes
-- Si la tabla ya existe, no hace nada

CREATE TABLE IF NOT EXISTS notification_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chain_id UUID NOT NULL REFERENCES chains(id) ON DELETE CASCADE,
  kiosko_id UUID REFERENCES kioscos(id) ON DELETE CASCADE,
  whatsapp_enabled BOOLEAN DEFAULT false,
  whatsapp_phone TEXT,
  whatsapp_verified BOOLEAN DEFAULT false,
  telegram_enabled BOOLEAN DEFAULT false,
  telegram_chat_id TEXT,
  telegram_verified BOOLEAN DEFAULT false,
  notifications_enabled BOOLEAN DEFAULT true,
  background_color VARCHAR(7) DEFAULT '#0a0e27',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(kiosko_id)
);

CREATE TABLE IF NOT EXISTS kiosko_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kiosko_id UUID NOT NULL REFERENCES kioscos(id) ON DELETE CASCADE UNIQUE,
  whatsapp_enabled BOOLEAN DEFAULT false,
  whatsapp_phone TEXT,
  whatsapp_verified BOOLEAN DEFAULT false,
  telegram_enabled BOOLEAN DEFAULT false,
  telegram_chat_id TEXT,
  telegram_verified BOOLEAN DEFAULT false,
  notifications_enabled BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS phone_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kiosko_id UUID NOT NULL REFERENCES kioscos(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  code TEXT NOT NULL,
  platform VARCHAR(50) NOT NULL,
  verified BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE notification_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE kiosko_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE phone_verifications ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para notification_configs
CREATE POLICY IF NOT EXISTS "notification_configs_select" ON notification_configs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM kioscos k
      JOIN chains c ON k.chain_id = c.id
      WHERE k.id = notification_configs.kiosko_id 
      AND c.owner_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "notification_configs_insert" ON notification_configs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM kioscos k
      JOIN chains c ON k.chain_id = c.id
      WHERE k.id = notification_configs.kiosko_id 
      AND c.owner_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "notification_configs_update" ON notification_configs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM kioscos k
      JOIN chains c ON k.chain_id = c.id
      WHERE k.id = notification_configs.kiosko_id 
      AND c.owner_id = auth.uid()
    )
  );

-- Políticas RLS para kiosko_settings
CREATE POLICY IF NOT EXISTS "kiosko_settings_select" ON kiosko_settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM kioscos k
      JOIN chains c ON k.chain_id = c.id
      WHERE k.id = kiosko_settings.kiosko_id 
      AND c.owner_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "kiosko_settings_insert" ON kiosko_settings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM kioscos k
      JOIN chains c ON k.chain_id = c.id
      WHERE k.id = kiosko_settings.kiosko_id 
      AND c.owner_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "kiosko_settings_update" ON kiosko_settings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM kioscos k
      JOIN chains c ON k.chain_id = c.id
      WHERE k.id = kiosko_settings.kiosko_id 
      AND c.owner_id = auth.uid()
    )
  );

-- Políticas RLS para phone_verifications
CREATE POLICY IF NOT EXISTS "phone_verifications_select" ON phone_verifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM kioscos k
      JOIN chains c ON k.chain_id = c.id
      WHERE k.id = phone_verifications.kiosko_id 
      AND c.owner_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "phone_verifications_insert" ON phone_verifications
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM kioscos k
      JOIN chains c ON k.chain_id = c.id
      WHERE k.id = phone_verifications.kiosko_id 
      AND c.owner_id = auth.uid()
    )
  );

-- Índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_notification_configs_kiosko ON notification_configs(kiosko_id);
CREATE INDEX IF NOT EXISTS idx_kiosko_settings_kiosko ON kiosko_settings(kiosko_id);
CREATE INDEX IF NOT EXISTS idx_phone_verifications_kiosko ON phone_verifications(kiosko_id);
CREATE INDEX IF NOT EXISTS idx_phone_verifications_expires ON phone_verifications(expires_at);
