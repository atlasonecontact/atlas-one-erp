# 🔍 Por Qué Aparece el Error "Usuario demo no tiene kiosko"

## ❌ El Problema

Cuando tocas un botón de demo, aparece:

```
❌ El usuario demo existe pero no tiene kiosko.

🔧 Solución:
1. Ve a Supabase SQL Editor
2. Ejecutá: scripts/202_fix_demo_complete.sql
...
```

---

## 🧐 ¿Por Qué Pasa Esto?

### Flujo de la Demo

```
1. Usuario toca botón "Maxi Kiosco"
   ↓
2. Frontend llama a: /api/demo/ensure
   ↓
3. API verifica:
   - ¿Existe el usuario en auth.users? ✅
   - ¿Tiene kiosko en tabla kioscos? ❌ NO
   ↓
4. API retorna error
   ↓
5. Se muestra mensaje al usuario
```

### Causas Comunes

#### 1️⃣ **Nunca ejecutaste el script**
```sql
-- El usuario existe en auth.users (lo creaste manualmente o con otro script)
-- PERO no tiene registro en la tabla kioscos
-- SOLUCIÓN: Ejecutar scripts/202_fix_demo_complete.sql
```

#### 2️⃣ **Ejecutaste un script incompleto**
```sql
-- Ejecutaste 201_seed_demo_data.sql que ASUME que el usuario ya existe
-- Pero no creó el kiosko porque algo falló
-- SOLUCIÓN: Ejecutar scripts/202_fix_demo_complete.sql (hace todo)
```

#### 3️⃣ **El kiosko se borró accidentalmente**
```sql
-- El kiosko existía pero fue eliminado (DELETE en tabla kioscos)
-- SOLUCIÓN: Ejecutar scripts/202_fix_demo_complete.sql
```

#### 4️⃣ **Error en la creación**
```sql
-- El script se ejecutó pero hubo un error (ej: violación de constraint)
-- El usuario se creó pero el kiosko no
-- SOLUCIÓN: Ver logs de Supabase y ejecutar 202
```

---

## 🔍 Cómo Verificar el Estado

### Query de Diagnóstico

Ejecutá esto en Supabase SQL Editor:

```sql
-- Ver estado completo de usuarios demo
SELECT 
  '🔍 DIAGNÓSTICO DEMOS' as titulo,
  u.email,
  u.id as user_id,
  CASE WHEN u.id IS NOT NULL THEN '✅' ELSE '❌' END as usuario_existe,
  k.id as kiosko_id,
  CASE WHEN k.id IS NOT NULL THEN '✅' ELSE '❌' END as tiene_kiosko,
  k.name as kiosko_nombre,
  (SELECT COUNT(*) FROM products WHERE kiosko_id = k.id) as productos,
  (SELECT COUNT(*) FROM employees WHERE kiosko_id = k.id) as empleados,
  CASE 
    WHEN k.id IS NOT NULL AND 
         (SELECT COUNT(*) FROM products WHERE kiosko_id = k.id) > 0
    THEN '✅ LISTO'
    WHEN k.id IS NOT NULL 
    THEN '⚠️ Tiene kiosko pero sin datos'
    ELSE '❌ SIN KIOSKO'
  END as estado
FROM auth.users u
LEFT JOIN kioscos k ON k.owner_id = u.id
WHERE u.email LIKE 'demo.%@atlasone.com'
ORDER BY u.email;
```

### Resultados Posibles

#### ✅ **TODO BIEN**
```
email                          | usuario | kiosko | productos | empleados | estado
demo.maxi-kiosco@atlasone.com | ✅      | ✅     | 12        | 3         | ✅ LISTO
```
→ El botón de demo debería funcionar

#### ❌ **PROBLEMA: Sin Kiosko**
```
email                          | usuario | kiosko | productos | empleados | estado
demo.maxi-kiosco@atlasone.com | ✅      | ❌     | 0         | 0         | ❌ SIN KIOSKO
```
→ Este es el error que estás viendo

#### ⚠️ **PROBLEMA: Kiosko Vacío**
```
email                          | usuario | kiosko | productos | empleados | estado
demo.maxi-kiosco@atlasone.com | ✅      | ✅     | 0         | 0         | ⚠️ Sin datos
```
→ Tiene kiosko pero no tiene productos/empleados

---

## ✅ Solución Paso a Paso

### 1️⃣ Verificar el Estado
```sql
-- Ejecutá la query de diagnóstico de arriba
-- Anotá qué usuarios tienen problemas
```

### 2️⃣ Ejecutar Script de Reparación
```sql
-- En Supabase SQL Editor:
scripts/202_fix_demo_complete.sql
```

Este script:
- ✅ Busca cada usuario demo
- ✅ Si NO existe, lo crea en auth.users
- ✅ Si existe pero NO tiene kiosko, lo crea
- ✅ Si tiene kiosko pero sin datos, los agrega
- ✅ Configura notificaciones, productos, empleados, ventas

### 3️⃣ Verificar Que Funcionó
```sql
-- Ejecutá de nuevo la query de diagnóstico
-- Todos deberían mostrar: ✅ LISTO
```

### 4️⃣ Probar el Botón de Demo
```
1. Volvé a la página de demos
2. Tocá el botón de "Maxi Kiosco"
3. Debería funcionar ✅
```

---

## 🛠️ Si el Script Falla

### Error: "relation does not exist"
```
Causa: Alguna tabla no existe
Solución: Ejecutar scripts/000_complete_schema.sql primero
```

### Error: "duplicate key value"
```
Causa: El registro ya existe pero con datos corruptos
Solución: 
1. Identificar el registro duplicado
2. Eliminarlo manualmente
3. Re-ejecutar script 202
```

### Error: "permission denied"
```
Causa: No tienes permisos suficientes
Solución: Ejecutar como admin de Supabase
```

### Ver Logs del Script
```sql
-- El script usa RAISE NOTICE para mostrar progreso
-- Deberías ver algo como:

-- ================================================
-- Procesando: demo.maxi-kiosco@atlasone.com
-- ================================================
--   ✓ Usuario ya existe con ID: uuid...
--   ✓ Profile actualizado
--   → Kiosko NO existe. Creando datos completos...
--   ✓ Kiosko creado con ID: uuid...
--   ✓ Telegram configurado
--   ✓ 12 productos creados
--   ✓ 3 empleados creados
--   ✓ Ventas históricas creadas (30 días)
--   ✓ Caja registradora abierta
```

Si NO ves estos mensajes, el script no se ejecutó correctamente.

---

## 📋 Checklist de Verificación

Antes de volver a intentar la demo:

- [ ] Ejecuté la query de diagnóstico
- [ ] Verifiqué que hay usuarios demo en auth.users
- [ ] Ejecuté scripts/202_fix_demo_complete.sql
- [ ] Vi los mensajes de confirmación del script
- [ ] Re-ejecuté la query de diagnóstico
- [ ] Todos los usuarios muestran "✅ LISTO"
- [ ] Probé el botón de demo y funcionó

---

## 🆘 Aún No Funciona

Si después de todo esto SIGUE apareciendo el error:

### 1. Verificar Conexión API
```javascript
// En DevTools Console (F12):
fetch('/api/demo/ensure', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ type: 'maxi-kiosco' })
}).then(r => r.json()).then(console.log)

// Deberías ver:
// { ok: true, email: "demo.maxi-kiosco@atlasone.com", ... }

// Si ves error, lee el mensaje completo
```

### 2. Verificar Variables de Entorno
```bash
# Verificar que SUPABASE_SERVICE_ROLE_KEY está configurado
# (requerido para crear usuarios con admin client)

# En .env.local:
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...  # ← Este es el importante
```

### 3. Reiniciar la App
```bash
# Después de ejecutar el script SQL, reiniciar:
npm run dev
```

### 4. Limpiar Caché
```bash
# A veces el caché puede causar problemas
# Ctrl + Shift + R (recarga forzada)
# O F12 → Network → Disable cache
```

---

## 📚 Documentación Relacionada

- **[GUIA_RAPIDA_SOLUCION.md](../GUIA_RAPIDA_SOLUCION.md)** - Solución general
- **[scripts/202_fix_demo_complete.sql](../scripts/202_fix_demo_complete.sql)** - Script de reparación
- **[docs/README.md](README.md)** - Índice completo

---

## 💡 Entendiendo el Código

### API: `/api/demo/ensure`

```typescript
// Ubicación: app/api/demo/ensure/route.ts

// Esta API hace:
1. Verificar que el usuario existe en auth.users
2. Verificar que tiene kiosko en tabla kioscos
3. Si ambos ✅ → Retorna { ok: true, email, password, kioskoId }
4. Si alguno ❌ → Retorna { error: "mensaje descriptivo" }
```

### Frontend: `/app/demo/page.tsx`

```typescript
// Esta página:
1. Usuario elige rubro (maxi-kiosco, mini-market, etc)
2. Toca "Iniciar Demo"
3. Llama a /api/demo/ensure con el tipo elegido
4. Si ✅ → Hace login automático y redirige a /dashboard
5. Si ❌ → Muestra el error que retorna la API
```

---

**Última actualización:** 22 Diciembre 2025

**¿Funcionó?** Si seguiste todos los pasos y sigue sin funcionar, verifica:
1. Logs de Supabase (errores de SQL)
2. Console del navegador (F12)
3. Network tab (respuesta de /api/demo/ensure)
