-- ============================================
-- Script 203: Actualizar Chat ID de Telegram
-- ============================================
-- Ejecuta este script para actualizar tu Chat ID de Telegram
-- en todos los usuarios demo
-- 
-- IMPORTANTE: Reemplaza '8494177500' con TU Chat ID real
-- Para obtener tu Chat ID:
-- 1. Busca @userinfobot en Telegram
-- 2. Envía /start
-- 3. Copia el número que aparece como "Id"
-- ============================================

DO $$
DECLARE
  v_new_chat_id TEXT := '8494177500'; -- ⚠️ REEMPLAZA ESTO CON TU CHAT ID
  v_updated_profiles INT := 0;
  v_updated_configs INT := 0;
BEGIN
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Actualizando Chat ID de Telegram a: %', v_new_chat_id;
  RAISE NOTICE '================================================';

  -- Actualizar profiles
  UPDATE profiles 
  SET telegram_chat_id = v_new_chat_id,
      updated_at = NOW()
  WHERE id IN (
    SELECT id FROM auth.users WHERE email LIKE 'demo.%@atlasone.com'
  );

  GET DIAGNOSTICS v_updated_profiles = ROW_COUNT;

  -- Actualizar notification_configs
  UPDATE notification_configs 
  SET telegram_chat_id = v_new_chat_id,
      telegram_enabled = true,
      telegram_verified = true,
      updated_at = NOW()
  WHERE kiosko_id IN (
    SELECT id FROM kioscos WHERE owner_id IN (
      SELECT id FROM auth.users WHERE email LIKE 'demo.%@atlasone.com'
    )
  );

  GET DIAGNOSTICS v_updated_configs = ROW_COUNT;

  RAISE NOTICE '✓ Profiles actualizados: %', v_updated_profiles;
  RAISE NOTICE '✓ Notification configs actualizados: %', v_updated_configs;
  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ COMPLETADO!';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Ahora necesitas:';
  RAISE NOTICE '1. Crear un bot con @BotFather en Telegram';
  RAISE NOTICE '2. Obtener el Bot Token';
  RAISE NOTICE '3. Agregar TELEGRAM_BOT_TOKEN en .env.local';
  RAISE NOTICE '4. Reiniciar la aplicación';
  RAISE NOTICE '5. Iniciar tu bot en Telegram enviando /start';
END $$;

-- Verificación
SELECT 
  '✅ VERIFICACIÓN' as status,
  u.email,
  p.telegram_chat_id as profile_chat_id,
  nc.telegram_chat_id as config_chat_id,
  nc.telegram_enabled,
  nc.telegram_verified,
  CASE 
    WHEN p.telegram_chat_id = nc.telegram_chat_id AND nc.telegram_enabled 
    THEN '✅ OK' 
    ELSE '⚠️ REVISAR' 
  END as estado
FROM auth.users u
INNER JOIN profiles p ON u.id = p.id
LEFT JOIN kioscos k ON k.owner_id = u.id
LEFT JOIN notification_configs nc ON nc.kiosko_id = k.id
WHERE u.email LIKE 'demo.%@atlasone.com'
ORDER BY u.email;
