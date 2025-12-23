# 🔧 SOLUCIÓN PROBLEMAS DEMO - ATLAS ONE ERP

## ⚠️ Problemas Reportados

1. ❌ Usuario demo existe pero no tiene kiosko
2. ❌ No se puede acceder sin conexión (offline)
3. ❌ Bot de Telegram no se sincroniza

---

## ✅ SOLUCIONES

### 1️⃣ Ejecutar Script de Reparación Completa

He creado el script **`202_fix_demo_complete.sql`** que:
- ✅ Busca usuarios demo existentes
- ✅ Si no existe el usuario, lo crea en auth.users
- ✅ Si existe pero no tiene kiosko, lo crea con todos los datos
- ✅ Configura Telegram para todos los usuarios
- ✅ Crea productos, empleados, ventas y caja

**Ejecutar:**
\`\`\`bash
# Desde Supabase SQL Editor, ejecuta:
scripts/202_fix_demo_complete.sql
\`\`\`

**O desde terminal:**
\`\`\`bash
# Si tienes psql instalado:
psql -h [HOST] -U postgres -d postgres -f scripts/202_fix_demo_complete.sql
\`\`\`

---

### 2️⃣ Configurar Funcionalidad Offline

Para que funcione offline necesitas:

#### A. Instalar Service Worker (PWA)

El proyecto necesita un Service Worker para cachear recursos. Crea estos archivos:

**`public/sw.js`** - Service Worker básico
**`public/manifest.json`** - Manifest para PWA

#### B. Variables de Entorno

Asegúrate de tener en tu `.env.local`:
\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
\`\`\`

#### C. Productos y Datos Offline

El sistema ya guarda:
- ✅ Productos en localStorage
- ✅ Ventas pendientes en cola
- ✅ Sincronización automática al reconectar

**Para probar:**
1. Abre Chrome DevTools (F12)
2. Ve a Network > Throttling
3. Selecciona "Offline"
4. Intenta hacer una venta

---

### 3️⃣ Configurar Bot de Telegram

#### A. Obtener Chat ID

1. Abre Telegram
2. Busca el bot **@userinfobot**
3. Envía `/start`
4. Copia tu `Chat ID` (número)

#### B. Crear Bot de Telegram

1. Busca **@BotFather** en Telegram
2. Envía `/newbot`
3. Sigue las instrucciones
4. Copia el **Bot Token**

#### C. Configurar Variables de Entorno

Agrega a tu `.env.local`:
\`\`\`env
TELEGRAM_BOT_TOKEN=1234567890:ABCDEFGHIJKLMNOPQRSTUVWXYZ
\`\`\`

#### D. Actualizar Chat ID en Base de Datos

El script `202_fix_demo_complete.sql` ya configura el Chat ID `8494177500`.

**Para cambiar tu Chat ID:**
\`\`\`sql
-- Actualiza con TU Chat ID
UPDATE notification_configs 
SET telegram_chat_id = 'TU_CHAT_ID_AQUI',
    telegram_enabled = true,
    telegram_verified = true
WHERE kiosko_id IN (
  SELECT id FROM kioscos WHERE owner_id IN (
    SELECT id FROM auth.users WHERE email LIKE 'demo.%@atlasone.com'
  )
);

-- O en el perfil directamente:
UPDATE profiles 
SET telegram_chat_id = 'TU_CHAT_ID_AQUI'
WHERE id IN (
  SELECT id FROM auth.users WHERE email LIKE 'demo.%@atlasone.com'
);
\`\`\`

#### E. Verificar Configuración

\`\`\`sql
-- Ver estado de Telegram para demos
SELECT 
  u.email,
  p.telegram_chat_id as profile_chat_id,
  nc.telegram_chat_id as notification_chat_id,
  nc.telegram_enabled,
  nc.telegram_verified
FROM auth.users u
INNER JOIN profiles p ON u.id = p.id
LEFT JOIN kioscos k ON k.owner_id = u.id
LEFT JOIN notification_configs nc ON nc.kiosko_id = k.id
WHERE u.email LIKE 'demo.%@atlasone.com';
\`\`\`

---

## 🚀 PASOS COMPLETOS EN ORDEN

### 1. Ejecutar Script de Reparación
\`\`\`bash
# Desde Supabase SQL Editor
Ejecutar: scripts/202_fix_demo_complete.sql
\`\`\`

### 2. Configurar Telegram
\`\`\`bash
# 1. Obtener Chat ID (@userinfobot)
# 2. Crear Bot (@BotFather)
# 3. Agregar a .env.local:
echo "TELEGRAM_BOT_TOKEN=tu-token-aqui" >> .env.local
\`\`\`

### 3. Actualizar Chat ID en DB
\`\`\`sql
-- Reemplaza 'TU_CHAT_ID' con tu Chat ID real
DO $$
DECLARE
  v_chat_id TEXT := 'TU_CHAT_ID_AQUI';
BEGIN
  UPDATE profiles 
  SET telegram_chat_id = v_chat_id
  WHERE id IN (
    SELECT id FROM auth.users WHERE email LIKE 'demo.%@atlasone.com'
  );

  UPDATE notification_configs 
  SET telegram_chat_id = v_chat_id,
      telegram_enabled = true,
      telegram_verified = true
  WHERE kiosko_id IN (
    SELECT id FROM kioscos WHERE owner_id IN (
      SELECT id FROM auth.users WHERE email LIKE 'demo.%@atlasone.com'
    )
  );
END $$;
\`\`\`

### 4. Reiniciar App
\`\`\`bash
npm run dev
# O si está en producción:
vercel --prod
\`\`\`

### 5. Verificar Todo
\`\`\`bash
# Login con usuario demo:
# Email: demo.maxi-kiosco@atlasone.com
# Password: Demo123456!

# Deberías ver:
✅ Kiosko creado
✅ Productos listados
✅ Empleados visibles
✅ Caja abierta
✅ Funciona offline (probar en DevTools)
✅ Notificaciones Telegram (si configurado)
\`\`\`

---

## 📊 VERIFICACIÓN FINAL

Ejecuta esto en Supabase SQL Editor:
\`\`\`sql
SELECT 
  '✅ ESTADO DEMOS' as status,
  u.email,
  CASE WHEN k.id IS NOT NULL THEN '✅' ELSE '❌' END as tiene_kiosko,
  COALESCE((SELECT COUNT(*) FROM products WHERE kiosko_id = k.id), 0) as productos,
  COALESCE((SELECT COUNT(*) FROM employees WHERE kiosko_id = k.id), 0) as empleados,
  CASE WHEN nc.telegram_enabled THEN '✅' ELSE '❌' END as telegram_activo,
  nc.telegram_chat_id
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
LEFT JOIN kioscos k ON k.owner_id = u.id
LEFT JOIN notification_configs nc ON nc.kiosko_id = k.id
WHERE u.email LIKE 'demo.%@atlasone.com'
ORDER BY u.email;
\`\`\`

---

## 🆘 TROUBLESHOOTING

### Problema: "No products found"
\`\`\`bash
# Verifica que el kiosko tenga productos
SELECT COUNT(*) FROM products WHERE kiosko_id = 'TU_KIOSKO_ID';

# Si es 0, ejecuta:
scripts/202_fix_demo_complete.sql
\`\`\`

### Problema: Telegram no envía mensajes
\`\`\`bash
# 1. Verifica el token:
echo $TELEGRAM_BOT_TOKEN

# 2. Prueba el bot manualmente:
curl -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
  -H "Content-Type: application/json" \
  -d '{"chat_id":"TU_CHAT_ID","text":"Test"}'

# 3. Si falla, verifica:
- Token correcto en .env.local
- Bot iniciado en Telegram (/start)
- Chat ID correcto
\`\`\`

### Problema: Offline no funciona
\`\`\`bash
# 1. Verifica que localStorage funcione:
# Abre Console (F12) y ejecuta:
localStorage.setItem('test', 'ok')
localStorage.getItem('test') // debe retornar 'ok'

# 2. Verifica la cola de ventas:
JSON.parse(localStorage.getItem('atlas.offline.salesQueue.v1') || '[]')

# 3. Intenta una venta offline y verifica:
# - Se guarda en localStorage
# - Se sincroniza al reconectar
\`\`\`

---

## ✉️ CONTACTO

Si los problemas persisten, verifica:
- ✅ Todas las variables de entorno configuradas
- ✅ Script 202 ejecutado completamente
- ✅ Bot de Telegram iniciado con /start
- ✅ Chat ID correcto en la base de datos
- ✅ App reiniciada después de cambios

---

**Última actualización:** 22 Diciembre 2025
