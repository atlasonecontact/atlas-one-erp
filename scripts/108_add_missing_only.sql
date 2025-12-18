-- Script incremental: Solo agrega lo que falta
-- Ejecutar este en lugar del 000

-- 1. Agregar tabla notification_configs si no existe
CREATE TABLE IF NOT EXISTS notification_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kiosko_id uuid REFERENCES kioscos(id) ON DELETE CASCADE,
  whatsapp_enabled boolean DEFAULT false,
  whatsapp_phone varchar(50),
  whatsapp_verified boolean DEFAULT false,
  telegram_enabled boolean DEFAULT false,
  telegram_phone varchar(50),
  telegram_chat_id varchar(100),
  telegram_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Agregar función para buscar usuario por username o email si no existe
CREATE OR REPLACE FUNCTION get_user_by_username_or_email(identifier text)
RETURNS TABLE (
  id uuid,
  email text,
  username text,
  raw_user_meta_data jsonb
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id,
    au.email,
    au.raw_user_meta_data->>'username' as username,
    au.raw_user_meta_data
  FROM auth.users au
  WHERE au.email = identifier 
     OR au.raw_user_meta_data->>'username' = identifier
  LIMIT 1;
END;
$$;

-- 3. Enable RLS en notification_configs
ALTER TABLE notification_configs ENABLE ROW LEVEL SECURITY;

-- 4. Políticas para notification_configs
DROP POLICY IF EXISTS "Users can view their kiosko notifications" ON notification_configs;
CREATE POLICY "Users can view their kiosko notifications" ON notification_configs
  FOR SELECT USING (
    kiosko_id IN (
      SELECT k.id FROM kioscos k
      INNER JOIN chains c ON k.chain_id = c.id
      WHERE c.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can manage their kiosko notifications" ON notification_configs;
CREATE POLICY "Users can manage their kiosko notifications" ON notification_configs
  FOR ALL USING (
    kiosko_id IN (
      SELECT k.id FROM kioscos k
      INNER JOIN chains c ON k.chain_id = c.id
      WHERE c.owner_id = auth.uid()
    )
  );

-- 5. Agregar columnas faltantes a kioscos si no existen
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='kioscos' AND column_name='cuit'
  ) THEN
    ALTER TABLE kioscos ADD COLUMN cuit varchar(20);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='kioscos' AND column_name='phone'
  ) THEN
    ALTER TABLE kioscos ADD COLUMN phone varchar(50);
  END IF;
END $$;

-- 6. Verificar que el usuario demo existe y crear si no
DO $$
DECLARE
  demo_user_id uuid;
  demo_chain_id uuid;
  demo_kiosko_id uuid;
BEGIN
  -- Buscar usuario demo
  SELECT id INTO demo_user_id 
  FROM auth.users 
  WHERE email = 'demo@atlasone.com';

  -- Si no existe, crearlo (esto solo funciona si tienes permisos de admin en Supabase)
  IF demo_user_id IS NULL THEN
    RAISE NOTICE 'Usuario demo no encontrado. Debes crearlo manualmente desde Supabase Auth.';
  ELSE
    -- Verificar que tiene cadena
    SELECT id INTO demo_chain_id FROM chains WHERE owner_id = demo_user_id;
    
    IF demo_chain_id IS NULL THEN
      INSERT INTO chains (owner_id, name, created_at)
      VALUES (demo_user_id, 'Demo Chain', now())
      RETURNING id INTO demo_chain_id;
    END IF;

    -- Verificar que tiene kiosko
    SELECT id INTO demo_kiosko_id FROM kioscos WHERE chain_id = demo_chain_id;
    
    IF demo_kiosko_id IS NULL THEN
      INSERT INTO kioscos (chain_id, name, address, city, province, created_at)
      VALUES (demo_chain_id, 'Kiosko Demo', 'Calle Demo 123', 'Buenos Aires', 'CABA', now())
      RETURNING id INTO demo_kiosko_id;
    END IF;
  END IF;
END $$;

-- 7. Simplificar políticas RLS para que funcionen
DROP POLICY IF EXISTS "Users can view their chain" ON chains;
CREATE POLICY "Users can view their chain" ON chains
  FOR SELECT USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage their chain" ON chains;
CREATE POLICY "Users can manage their chain" ON chains
  FOR ALL USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Users can view their kioscos" ON kioscos;
CREATE POLICY "Users can view their kioscos" ON kioscos
  FOR SELECT USING (
    chain_id IN (SELECT id FROM chains WHERE owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can manage their kioscos" ON kioscos;
CREATE POLICY "Users can manage their kioscos" ON kioscos
  FOR ALL USING (
    chain_id IN (SELECT id FROM chains WHERE owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can view employees" ON employees;
CREATE POLICY "Users can view employees" ON employees
  FOR SELECT USING (
    kiosko_id IN (
      SELECT k.id FROM kioscos k
      INNER JOIN chains c ON k.chain_id = c.id
      WHERE c.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can manage employees" ON employees;
CREATE POLICY "Users can manage employees" ON employees
  FOR ALL USING (
    kiosko_id IN (
      SELECT k.id FROM kioscos k
      INNER JOIN chains c ON k.chain_id = c.id
      WHERE c.owner_id = auth.uid()
    )
  );

-- Fin del script
SELECT 'Script ejecutado correctamente. Tablas faltantes agregadas.' as resultado;
