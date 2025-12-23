# 🔐 Configuración de Telegram PRIVADA por Usuario

## ❌ Problema Anterior
Todos los usuarios demo compartían el mismo Chat ID hardcodeado (`8494177500`), lo que significa que:
- ❌ TODOS recibían las MISMAS notificaciones
- ❌ NO había privacidad
- ❌ No se podía distinguir qué notificación era de qué kiosko

## ✅ Solución Implementada

Ahora **CADA usuario configura su propio Chat ID de Telegram** desde el Dashboard.

---

## 🎯 Flujo Correcto (Por Usuario)

### Para Demo 1: `demo.maxi-kiosco@atlasone.com`

#### 1️⃣ Obtener Chat ID Personal
\`\`\`
Usuario 1:
1. Abrir Telegram
2. Buscar @userinfobot
3. Enviar /start
4. Copiar su Chat ID: 123456789 (ejemplo)
\`\`\`

#### 2️⃣ Login al Sistema
\`\`\`
Email: demo.maxi-kiosco@atlasone.com
Password: Demo123456!
\`\`\`

#### 3️⃣ Configurar en Dashboard
\`\`\`
1. Ir a Dashboard → Configuración
2. Pestaña "Notificaciones"
3. Sección "Telegram"
4. Pegar su Chat ID: 123456789
5. Click "🧪 Probar"
6. Guardar Cambios
\`\`\`

#### 4️⃣ Iniciar Bot
\`\`\`
1. Buscar @AtlasOneBot en Telegram
2. Enviar /start
3. El bot responderá con confirmación
\`\`\`

✅ Ahora este usuario recibe SOLO sus notificaciones

---

### Para Demo 2: `demo.mini-market@atlasone.com`

#### 1️⃣ Obtener Chat ID Personal (DIFERENTE)
\`\`\`
Usuario 2:
1. Abrir Telegram (desde SU cuenta)
2. Buscar @userinfobot
3. Enviar /start
4. Copiar SU Chat ID: 987654321 (DIFERENTE al usuario 1)
\`\`\`

#### 2️⃣ Login al Sistema
\`\`\`
Email: demo.mini-market@atlasone.com
Password: Demo123456!
\`\`\`

#### 3️⃣ Configurar en Dashboard
\`\`\`
1. Ir a Dashboard → Configuración
2. Pestaña "Notificaciones"
3. Sección "Telegram"
4. Pegar SU Chat ID: 987654321
5. Click "🧪 Probar"
6. Guardar Cambios
\`\`\`

✅ Ahora este usuario recibe SOLO sus notificaciones

---

## 🔑 Conceptos Clave

### Chat ID es Personal
- Cada cuenta de Telegram tiene un Chat ID único
- Es como tu "dirección" en Telegram
- El bot envía mensajes A ESE Chat ID específico

### Un Bot, Múltiples Usuarios
\`\`\`
Bot de Telegram (@AtlasOneBot)
    │
    ├── Usuario 1 (Chat ID: 123456789) → Recibe notificaciones del Kiosko 1
    ├── Usuario 2 (Chat ID: 987654321) → Recibe notificaciones del Kiosko 2
    ├── Usuario 3 (Chat ID: 555666777) → Recibe notificaciones del Kiosko 3
    └── ...
\`\`\`

### Base de Datos
\`\`\`sql
-- Tabla: notification_configs
kiosko_id | telegram_chat_id | telegram_enabled | telegram_verified
----------+------------------+------------------+-------------------
uuid-1    | 123456789       | true             | true              -- Kiosko 1
uuid-2    | 987654321       | true             | true              -- Kiosko 2
uuid-3    | 555666777       | true             | true              -- Kiosko 3
\`\`\`

Cada kiosko tiene:
- ✅ Su propio Chat ID
- ✅ Su propia configuración
- ✅ Sus propias notificaciones

---

## 📱 Pasos para Cada Usuario Demo

### Usuario Demo 1 (Maxi Kiosco)
\`\`\`bash
# Su Telegram:
1. @userinfobot → Chat ID: XXXXXXXXX
2. Login: demo.maxi-kiosco@atlasone.com
3. Dashboard → Config → Telegram → Pegar XXXXXXXXX
4. @AtlasOneBot → /start
\`\`\`

### Usuario Demo 2 (Mini Market)
\`\`\`bash
# Su Telegram (DIFERENTE):
1. @userinfobot → Chat ID: YYYYYYYYY
2. Login: demo.mini-market@atlasone.com
3. Dashboard → Config → Telegram → Pegar YYYYYYYYY
4. @AtlasOneBot → /start
\`\`\`

### Usuario Demo 3 (Licorería)
\`\`\`bash
# Su Telegram (DIFERENTE):
1. @userinfobot → Chat ID: ZZZZZZZZZ
2. Login: demo.licoreria@atlasone.com
3. Dashboard → Config → Telegram → Pegar ZZZZZZZZZ
4. @AtlasOneBot → /start
\`\`\`

---

## 🛠️ Scripts Actualizados

### Script 202 (Crear Demos)
\`\`\`sql
-- YA NO establece un Chat ID por defecto
-- Cada usuario debe configurarlo manualmente
v_telegram_chat_id TEXT := NULL;
\`\`\`

### Script 203 (Actualizar Chat ID)
\`\`\`sql
-- Ahora trabaja con UN usuario específico
-- Ya no actualiza todos a la vez
v_email TEXT := 'demo.maxi-kiosco@atlasone.com';
v_new_chat_id TEXT := 'CHAT_ID_ESPECÍFICO_DE_ESTE_USUARIO';
\`\`\`

---

## ✅ Verificar Configuración

### SQL para ver estado de TODOS los demos:
\`\`\`sql
SELECT 
  '✅ ESTADO TELEGRAM' as titulo,
  u.email,
  CASE 
    WHEN nc.telegram_chat_id IS NOT NULL THEN '✅ Configurado'
    ELSE '⚠️ Sin configurar'
  END as estado_chat_id,
  nc.telegram_chat_id,
  CASE WHEN nc.telegram_enabled THEN '✅' ELSE '❌' END as habilitado,
  CASE WHEN nc.telegram_verified THEN '✅' ELSE '⚠️' END as verificado
FROM auth.users u
LEFT JOIN kioscos k ON k.owner_id = u.id
LEFT JOIN notification_configs nc ON nc.kiosko_id = k.id
WHERE u.email LIKE 'demo.%@atlasone.com'
ORDER BY u.email;
\`\`\`

### Resultado Esperado (después de configurar):
\`\`\`
email                           | chat_id    | habilitado | verificado
--------------------------------+------------+------------+-----------
demo.maxi-kiosco@atlasone.com  | 123456789  | ✅         | ✅
demo.mini-market@atlasone.com  | 987654321  | ✅         | ✅
demo.licoreria@atlasone.com    | 555666777  | ✅         | ✅
\`\`\`

---

## 🎯 Flujo de Notificaciones

### Cuando Usuario 1 hace una venta:
\`\`\`
Venta en Kiosko 1
    ↓
Sistema busca notification_configs WHERE kiosko_id = uuid-1
    ↓
Encuentra telegram_chat_id = 123456789
    ↓
Bot envía mensaje A 123456789
    ↓
Usuario 1 recibe notificación en SU Telegram
\`\`\`

### Cuando Usuario 2 hace una venta:
\`\`\`
Venta en Kiosko 2
    ↓
Sistema busca notification_configs WHERE kiosko_id = uuid-2
    ↓
Encuentra telegram_chat_id = 987654321
    ↓
Bot envía mensaje A 987654321
    ↓
Usuario 2 recibe notificación en SU Telegram
\`\`\`

✅ Cada uno recibe SOLO sus propias notificaciones

---

## 🔧 Configuración del Bot (Una Sola Vez)

Solo necesitas **UN bot** para todos los usuarios:

### 1. Crear el Bot
\`\`\`
1. Telegram → @BotFather
2. /newbot
3. Nombre: Atlas One ERP Bot
4. Username: AtlasOneERP_bot
5. Copiar Token
\`\`\`

### 2. Configurar en .env.local
\`\`\`env
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
\`\`\`

### 3. Reiniciar App
\`\`\`bash
npm run dev
\`\`\`

✅ El bot funciona para TODOS los usuarios
✅ Cada usuario configura SU Chat ID
✅ Cada usuario recibe SUS notificaciones

---

## 🆘 FAQ

### ¿Por qué todos tenían el mismo Chat ID?
Los scripts antiguos hardcodeaban `8494177500` para testing. Ahora cada usuario configura el suyo.

### ¿Necesito crear un bot por cada usuario?
❌ NO. Un solo bot puede enviar mensajes a múltiples chats.

### ¿Cómo sabe el bot a quién enviar?
Cada kiosko guarda su `telegram_chat_id` en la base de datos. El sistema usa ese Chat ID para enviar.

### ¿Puedo usar el mismo Chat ID para varios kioscos?
✅ SÍ, si querés recibir notificaciones de múltiples kioscos en el mismo chat.

### ¿Es seguro?
✅ SÍ, cada usuario solo puede configurar SU propio kiosko.

---

## 📝 Ejemplo Real

### Tienes 3 personas con 3 cuentas de Telegram:

**Persona 1 (Juan):**
- Telegram: @juan
- Chat ID: 11111
- Email demo: demo.maxi-kiosco@atlasone.com
- Configura: 11111 en su dashboard
- Recibe: Notificaciones del Maxi Kiosco

**Persona 2 (María):**
- Telegram: @maria
- Chat ID: 22222
- Email demo: demo.mini-market@atlasone.com
- Configura: 22222 en su dashboard
- Recibe: Notificaciones del Mini Market

**Persona 3 (Pedro):**
- Telegram: @pedro
- Chat ID: 33333
- Email demo: demo.licoreria@atlasone.com
- Configura: 33333 en su dashboard
- Recibe: Notificaciones de la Licorería

✅ Cada uno en su propio chat privado

---

**Última actualización:** 22 Diciembre 2025
