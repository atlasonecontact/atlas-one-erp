# Scripts para Crear Usuarios Demo

## 📋 Cuentas Demo

Todas las cuentas usan la misma contraseña: `Demo123456!`

| Email | Nombre del Negocio | Tipo |
|-------|-------------------|------|
| demo.maxi-kiosco@atlasone.com | Maxi Kiosco Demo | maxi-kiosco |
| demo.mini-market@atlasone.com | Mini Market Demo | mini-market |
| demo.licoreria@atlasone.com | Licorería Demo | licoreria |
| demo.vinoteca@atlasone.com | Vinoteca Demo | vinoteca |
| demo.libreria@atlasone.com | Librería Demo | libreria |
| demo.jugueteria@atlasone.com | Juguetería Demo | jugueteria |
| demo.dietetica@atlasone.com | Dietética Demo | dietetica |

## 🚀 Opción 1: Script Completo (Crea usuarios Auth + Datos)

**Archivo:** `200_create_demo_users.sql`

Este script crea todo desde cero:
- ✅ Usuarios en `auth.users`
- ✅ Profiles con telegram_chat_id
- ✅ Kioscos
- ✅ 12 productos con stock
- ✅ 3 empleados
- ✅ 30 días de ventas históricas
- ✅ Caja abierta con $10,000

**Cómo ejecutar:**
```sql
-- Ejecutar en SQL Editor de Supabase
-- (Requiere permisos de admin)
\i scripts/200_create_demo_users.sql
```

## 🔧 Opción 2: Solo Seed Data (Usuarios ya existen)

**Archivo:** `201_seed_demo_data.sql`

Usa este si los usuarios ya existen en Supabase Auth pero necesitas cargar los datos.

**Pasos:**
1. Primero crear los usuarios manualmente en Supabase Auth UI:
   - Ir a Authentication → Users → Add user
   - Email: demo.maxi-kiosco@atlasone.com
   - Password: Demo123456!
   - Auto Confirm: ✅
   - Repetir para los 7 usuarios

2. Luego ejecutar el script:
```sql
\i scripts/201_seed_demo_data.sql
```

## 📦 Datos que se crean automáticamente

### Productos (12 items)
- **Bebidas:** Coca Cola, Sprite, Pepsi, Agua
- **Snacks:** Lays, Pepitos, Doritos
- **Cigarrillos:** Marlboro
- **Lácteos:** Leche
- **Golosinas:** Milka, Sugus
- **Limpieza:** Cif

### Empleados (3 personas)
- María González (Cajero)
- Pedro Sánchez (Cajero)
- Laura Fernández (Supervisor)

### Otros datos
- 📊 Ventas históricas de últimos 30 días (aleatorias)
- 💰 Caja abierta con $10,000 de apertura
- 📱 Telegram configurado con Chat ID: 8494177500
- ✅ Notificaciones habilitadas

## 🔍 Verificar que todo funciona

```sql
-- Ver resumen de todos los demos
SELECT 
  u.email,
  p.business_name,
  k.name as kiosko,
  (SELECT COUNT(*) FROM products WHERE kiosko_id = k.id) as productos,
  (SELECT COUNT(*) FROM employees WHERE kiosko_id = k.id) as empleados,
  (SELECT COUNT(*) FROM sales WHERE kiosko_id = k.id) as ventas,
  (SELECT status FROM cash_registers WHERE kiosko_id = k.id ORDER BY opened_at DESC LIMIT 1) as caja
FROM auth.users u
INNER JOIN profiles p ON u.id = p.id
LEFT JOIN kioscos k ON k.owner_id = u.id
WHERE u.email LIKE 'demo.%@atlasone.com'
ORDER BY u.email;
```

## 🧹 Limpiar usuarios demo (opcional)

```sql
-- CUIDADO: Esto elimina TODOS los datos de los demos
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  FOR v_user_id IN 
    SELECT id FROM auth.users WHERE email LIKE 'demo.%@atlasone.com'
  LOOP
    -- Eliminar kioscos (en cascada elimina productos, empleados, ventas, etc.)
    DELETE FROM kioscos WHERE owner_id = v_user_id;
    
    -- Eliminar profile
    DELETE FROM profiles WHERE id = v_user_id;
    
    -- Eliminar usuario de auth
    DELETE FROM auth.users WHERE id = v_user_id;
    
    RAISE NOTICE 'Usuario eliminado: %', v_user_id;
  END LOOP;
END $$;
```

## 📱 Configuración de Telegram

Todos los demos usan el mismo Chat ID para testing: `8494177500`

Para que funcionen en producción, cada usuario debería:
1. Iniciar chat con el bot de Telegram
2. Enviar `/start`
3. Copiar su Chat ID
4. Configurarlo en: Dashboard → Configuración → Integraciones

## 🎯 Uso en el Frontend

El endpoint `/api/demo/ensure` se encarga de:
1. Crear el usuario si no existe
2. Crear el profile con telegram_chat_id
3. Crear el kiosko
4. Cargar todos los datos (productos, empleados, ventas)
5. Crear caja abierta
6. Configurar notificaciones

Desde el login, los usuarios pueden hacer clic en cualquier botón de demo y automáticamente se crea todo.
