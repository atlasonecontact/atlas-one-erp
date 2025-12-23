# 🚀 GUÍA RÁPIDA: Solución Completa Problemas Demo

## 📋 Problemas Detectados y Soluciones

### ✅ 1. Usuario demo existe pero sin kiosko

**SOLUCIÓN:**
```bash
# Ejecutar en Supabase SQL Editor:
scripts/202_fix_demo_complete.sql
```

Este script:
- ✅ Crea usuarios si no existen
- ✅ Crea kioscos con datos completos
- ✅ Agrega productos, empleados, ventas
- ✅ Configura Telegram

---

### ✅ 2. Funcionalidad Offline

**YA IMPLEMENTADO:**
He creado todos los archivos necesarios:
- ✅ `public/sw.js` - Service Worker
- ✅ `public/manifest.json` - PWA Manifest  
- ✅ `public/offline.html` - Página offline
- ✅ `app/layout.tsx` - Actualizado con registro de SW

**CÓMO PROBAR:**
1. Abre la app en Chrome
2. F12 → Application → Service Workers
3. Verifica que esté "Activated and running"
4. Network → Offline
5. Recarga la página
6. Debería funcionar offline

---

### ✅ 3. Telegram no se sincroniza

**PASO 1: Obtén tu Chat ID**
1. Abre Telegram
2. Busca: `@userinfobot`
3. Envía: `/start`
4. Copia el número (tu Chat ID)

**PASO 2: Crea un Bot**
1. Busca: `@BotFather`
2. Envía: `/newbot`
3. Elige nombre: `Atlas One Bot`
4. Elige username: `AtlasOneERP_bot` (debe terminar en _bot)
5. Copia el **Token** que te da

**PASO 3: Configura Variables de Entorno**

Crea o edita `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
```

**PASO 4: Actualiza Chat ID en Base de Datos**

Edita `scripts/203_update_telegram_chat_id.sql`:
```sql
-- Línea 17, reemplaza con TU Chat ID:
v_new_chat_id TEXT := 'TU_CHAT_ID_AQUI';
```

Luego ejecuta en Supabase:
```bash
scripts/203_update_telegram_chat_id.sql
```

**PASO 5: Inicia el Bot**
1. Busca tu bot en Telegram (ej: @AtlasOneERP_bot)
2. Envía: `/start`

**PASO 6: Reinicia la App**
```bash
npm run dev
```

---

## 🎯 EJECUTAR TODO EN ORDEN

### 1️⃣ Base de Datos
```bash
# En Supabase SQL Editor:

# 1. Reparar usuarios y crear kioscos
Ejecutar: scripts/202_fix_demo_complete.sql

# 2. Actualizar Chat ID (después de obtenerlo)
Editar línea 17 con tu Chat ID
Ejecutar: scripts/203_update_telegram_chat_id.sql
```

### 2️⃣ Variables de Entorno
```bash
# Crear .env.local si no existe
touch .env.local

# Agregar:
NEXT_PUBLIC_SUPABASE_URL=tu-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-key
TELEGRAM_BOT_TOKEN=tu-token-bot
```

### 3️⃣ Verificar Service Worker
```bash
# Iniciar app
npm run dev

# Abrir http://localhost:3000
# F12 → Application → Service Workers
# Debe decir "Activated and running"
```

### 4️⃣ Probar Todo

**Login:**
```
Email: demo.maxi-kiosco@atlasone.com
Password: Demo123456!
```

**Verificar:**
- ✅ Dashboard se carga
- ✅ Productos listados
- ✅ Empleados visibles
- ✅ Puede hacer ventas
- ✅ Funciona offline (Network → Offline en DevTools)
- ✅ Telegram envía notificaciones

---

## 🔍 VERIFICAR ESTADO

### En Supabase SQL Editor:

```sql
-- Ver estado de demos
SELECT 
  '✅ VERIFICACIÓN DEMOS' as titulo,
  u.email,
  CASE WHEN k.id IS NOT NULL THEN '✅' ELSE '❌' END as tiene_kiosko,
  COALESCE((SELECT COUNT(*) FROM products WHERE kiosko_id = k.id), 0) as productos,
  COALESCE((SELECT COUNT(*) FROM employees WHERE kiosko_id = k.id), 0) as empleados,
  COALESCE((SELECT COUNT(*) FROM sales WHERE kiosko_id = k.id), 0) as ventas,
  CASE WHEN nc.telegram_enabled THEN '✅' ELSE '❌' END as telegram,
  nc.telegram_chat_id
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
LEFT JOIN kioscos k ON k.owner_id = u.id
LEFT JOIN notification_configs nc ON nc.kiosko_id = k.id
WHERE u.email LIKE 'demo.%@atlasone.com'
ORDER BY u.email;
```

**Resultado esperado:**
- `tiene_kiosko`: ✅
- `productos`: 12
- `empleados`: 3
- `ventas`: 100+
- `telegram`: ✅

---

## 🆘 TROUBLESHOOTING

### Problema: "No se encuentra el kiosko"
```bash
# Ejecuta de nuevo:
scripts/202_fix_demo_complete.sql
```

### Problema: Telegram no envía
```bash
# 1. Verifica el token en .env.local
cat .env.local | grep TELEGRAM

# 2. Prueba el bot manualmente
curl -X POST "https://api.telegram.org/bot<TOKEN>/sendMessage" \
  -H "Content-Type: application/json" \
  -d '{"chat_id":"<TU_CHAT_ID>","text":"Test"}'

# 3. Verifica que iniciaste el bot (/start)
```

### Problema: Offline no funciona
```bash
# 1. Verifica Service Worker
# F12 → Application → Service Workers
# Debe estar "Activated and running"

# 2. Si no está activo, fuerza actualización:
# Application → Service Workers → "Update" o "Unregister"
# Recarga la página

# 3. Verifica cache
# Application → Cache Storage
# Debe tener "atlas-one-v1"
```

### Problema: Error CORS
```bash
# Agrega a next.config.mjs:
async headers() {
  return [
    {
      source: '/sw.js',
      headers: [
        {
          key: 'Service-Worker-Allowed',
          value: '/'
        }
      ]
    }
  ]
}
```

---

## 📱 USUARIOS DEMO DISPONIBLES

| Email | Password | Kiosko |
|-------|----------|--------|
| demo.maxi-kiosco@atlasone.com | Demo123456! | Maxi Kiosco |
| demo.mini-market@atlasone.com | Demo123456! | Mini Market |
| demo.licoreria@atlasone.com | Demo123456! | Licorería |
| demo.vinoteca@atlasone.com | Demo123456! | Vinoteca |
| demo.libreria@atlasone.com | Demo123456! | Librería |
| demo.jugueteria@atlasone.com | Demo123456! | Juguetería |
| demo.dietetica@atlasone.com | Demo123456! | Dietética |

---

## 📚 DOCUMENTACIÓN ADICIONAL

- **Problemas detallados:** `docs/SOLUCION_PROBLEMAS_DEMO.md`
- **Bot Telegram:** `docs/TELEGRAM_BOT.md`
- **Base de datos:** `docs/DATABASE.md`

---

## ✅ CHECKLIST FINAL

Antes de considerar que todo funciona:

- [ ] Script 202 ejecutado sin errores
- [ ] Chat ID de Telegram actualizado (script 203)
- [ ] Bot creado con @BotFather
- [ ] TELEGRAM_BOT_TOKEN en .env.local
- [ ] Bot iniciado con /start en Telegram
- [ ] Service Worker registrado y activo
- [ ] Login funciona con usuario demo
- [ ] Dashboard muestra kiosko y productos
- [ ] Puede hacer una venta
- [ ] Funciona offline (probar desconectando red)
- [ ] Telegram envía notificación de prueba

---

**¿Necesitas ayuda?**

1. Revisa la verificación SQL arriba
2. Consulta `docs/SOLUCION_PROBLEMAS_DEMO.md`
3. Verifica logs en consola del navegador (F12)
4. Verifica logs de Supabase

---

**Última actualización:** 22 Diciembre 2025
