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

-- ⚠️ ESTE SCRIPT YA NO SE USA
-- Ahora cada usuario configura su Chat ID desde el Dashboard
-- Ver: /dashboard/configuracion (pestaña Notificaciones)

-- Si necesitas configurar manualmente un usuario específico:
/*
DO $$
DECLARE
  v_email TEXT := 'demo.maxi-kiosco@atlasone.com'; -- ⚠️ Email del usuario
  v_new_chat_id TEXT := 'TU_CHAT_ID_AQUI'; -- ⚠️ REEMPLAZA con el Chat ID
  v_user_id UUID;
  v_kiosko_id UUID;
  v_updated_profiles INT := 0;
  v_updated_configs INT := 0;
BEGIN
  -- Buscar el usuario
  SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no encontrado: %', v_email;
  END IF;
  
  SELECT id INTO v_kiosko_id FROM kioscos WHERE owner_id = v_user_id LIMIT 1;
  
  IF v_kiosko_id IS NULL THEN
    RAISE EXCEPTION 'Kiosko no encontrado para usuario: %', v_email;
  END IF;

  RAISE NOTICE '================================================';
  RAISE NOTICE 'Configurando Telegram para: %', v_email;
  RAISE NOTICE 'Chat ID: %', v_new_chat_id;
  RAISE NOTICE '================================================';

  -- Actualizar profile
  UPDATE profiles 
  SET telegram_chat_id = v_new_chat_id,
      updated_at = NOW()
  WHERE id = v_user_id;

  GET DIAGNOSTICS v_updated_profiles = ROW_COUNT;

  -- Actualizar notification_configs
  UPDATE notification_configs 
  SET telegram_chat_id = v_new_chat_id,
      telegram_enabled = true,
      telegram_verified = false, -- El usuario debe verificar desde el dashboard
      updated_at = NOW()
  WHERE kiosko_id = v_kiosko_id;

  GET DIAGNOSTICS v_updated_configs = ROW_COUNT;

  RAISE NOTICE '✓ Profiles actualizados: %', v_updated_profiles;
  RAISE NOTICE '✓ Notification configs actualizados: %', v_updated_configs;
  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ COMPLETADO!';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Ahora necesitas:';
  RAISE NOTICE '1. Iniciar sesión con: %', v_email;
  RAISE NOTICE '2. Ir a Dashboard → Configuración → Notificaciones';
  RAISE NOTICE '3. Verificar el bot de Telegram';
END $$;
*/

-- Para usar este script:
-- 1. Descomenta todo (quita /* y */)
-- 2. Reemplaza v_email con el email del usuario
-- 3. Reemplaza v_new_chat_id con el Chat ID del usuario
-- 4. Ejecuta el script

-- ============================================
-- Verificación de todos los usuarios demo
-- ============================================
SELECT 
  '✅ ESTADO TELEGRAM' as titulo,
  u.email,
  CASE 
    WHEN nc.telegram_chat_id IS NOT NULL THEN '✅ Configurado'
    ELSE '⚠️ Sin configurar'
  END as estado_chat_id,
  nc.telegram_chat_id,
  CASE WHEN nc.telegram_enabled THEN '✅' ELSE '❌' END as habilitado,
  CASE WHEN nc.telegram_verified THEN '✅' ELSE '⚠️' END as verificado,
  CASE 
    WHEN nc.telegram_chat_id IS NOT NULL AND nc.telegram_enabled AND nc.telegram_verified
    THEN '✅ LISTO'
    WHEN nc.telegram_chat_id IS NOT NULL AND nc.telegram_enabled
    THEN '⚠️ Falta verificar'
    WHEN nc.telegram_chat_id IS NOT NULL
    THEN '⚠️ Falta habilitar'
    ELSE '❌ Sin configurar'
  END as estado_final
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
LEFT JOIN kioscos k ON k.owner_id = u.id
LEFT JOIN notification_configs nc ON nc.kiosko_id = k.id
WHERE u.email LIKE 'demo.%@atlasone.com'
ORDER BY u.email;
