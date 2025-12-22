# 📚 Documentación de la Base de Datos - Atlas ONE ERP

Este documento explica la estructura de la base de datos y qué información se guarda en cada tabla.

---

## 🏢 Tablas Principales

### 👤 **profiles** - Usuarios del Sistema
Contiene los datos de cada usuario que se registra en la plataforma.

| Campo | Descripción |
|-------|-------------|
| `id` | ID único del usuario (viene de Supabase Auth) |
| `username` | Nombre de usuario para login |
| `full_name` | Nombre completo |
| `role` | Rol: `owner` (dueño) o `employee` (empleado) |
| `business_name` | Nombre del negocio |
| `telegram_chat_id` | ID de Telegram para notificaciones |
| `whatsapp_phone` | Teléfono de WhatsApp para notificaciones |

---

### 🏪 **kioscos** - Sucursales/Locales
Cada local o kiosco que tiene el usuario. Un dueño puede tener varios kioscos.

| Campo | Descripción |
|-------|-------------|
| `id` | ID único del kiosco |
| `owner_id` | ID del dueño (referencia a `profiles`) |
| `name` | Nombre del kiosco |
| `location` | Dirección |
| `city` | Ciudad |
| `phone` | Teléfono |
| `cuit` | CUIT del negocio |
| `subscription_plan_id` | Plan de suscripción |
| `primary_color` / `secondary_color` | Colores del tema |
| `is_active` | Si está activo |
| `created_at` | Fecha de creación |

---

### 👨‍💼 **employees** - Empleados
Los empleados que trabajan en cada kiosco. Pueden tener su propia cuenta para acceder al sistema.

| Campo | Descripción |
|-------|-------------|
| `id` | ID único del empleado |
| `kiosko_id` | A qué kiosco pertenece |
| `user_id` | Cuenta de usuario (opcional, para login) |
| `username` | Usuario para login |
| `name` | Nombre del empleado |
| `position` | Puesto (Vendedor, Cajero, etc.) |
| `permissions` | Permisos (JSON): ventas, compras, caja, etc. |
| `salary` | Salario |
| `status` | Estado: `active` o `inactive` |

**Permisos disponibles:**
\`\`\`json
{
  "ventas": true,
  "compras": true,
  "caja": true,
  "stock": true,
  "reportes": true
}
\`\`\`

---

### 📦 **products** - Productos
El inventario de productos de cada kiosco.

| Campo | Descripción |
|-------|-------------|
| `id` | ID único del producto |
| `kiosko_id` | A qué kiosco pertenece |
| `name` | Nombre del producto |
| `sku` | Código interno |
| `barcode` | Código de barras |
| `category` | Categoría (Bebidas, Snacks, etc.) |
| `price` | Precio de venta |
| `cost` | Costo de compra |
| `stock_quantity` | Cantidad en stock actual |
| `min_stock_level` | Stock mínimo para alertas |
| `is_active` | Si está activo |
| `created_at` / `updated_at` | Fechas |

---

## 💰 Ventas

### 🧾 **sales** - Ventas
Cada venta realizada en el sistema.

| Campo | Descripción |
|-------|-------------|
| `id` | ID único de la venta |
| `kiosko_id` | En qué kiosco se hizo |
| `employee_id` | Quién la realizó (empleado) |
| `sale_number` | Número de ticket (V-123456789) |
| `total_amount` | Monto total |
| `payment_method` | Forma de pago: `cash`, `card`, `transfer` |
| `status` | Estado: `completed`, `cancelled` |
| `cash_register_id` | Caja donde se registró |
| `created_at` | Fecha/hora de la venta |

### 🛒 **sale_items** - Detalle de Ventas
Los productos incluidos en cada venta.

| Campo | Descripción |
|-------|-------------|
| `id` | ID único |
| `sale_id` | A qué venta pertenece |
| `product_id` | Qué producto |
| `quantity` | Cantidad vendida |
| `unit_price` | Precio unitario |
| `subtotal` | Subtotal (cantidad × precio) |

---

## 📥 Compras

### 📋 **purchases** - Órdenes de Compra
Las compras a proveedores.

| Campo | Descripción |
|-------|-------------|
| `id` | ID único de la compra |
| `kiosko_id` | Para qué kiosco |
| `supplier_name` | Nombre del proveedor |
| `purchase_number` | Número de orden (C-123456789) |
| `total_amount` | Monto total |
| `status` | Estado: `pending`, `completed`, `in_transit` |
| `notes` | Notas/observaciones |
| `created_at` | Fecha de la compra |

### 📦 **purchase_items** - Detalle de Compras
Los productos incluidos en cada compra.

| Campo | Descripción |
|-------|-------------|
| `id` | ID único |
| `purchase_id` | A qué compra pertenece |
| `product_id` | Qué producto |
| `quantity` | Cantidad comprada |
| `unit_cost` | Costo unitario |
| `subtotal` | Subtotal (cantidad × costo) |

---

## 📊 Stock y Movimientos

### 📈 **stock_movements** - Movimientos de Stock
Historial de todos los cambios de stock (entradas, salidas, compras, ventas).

| Campo | Descripción |
|-------|-------------|
| `id` | ID único |
| `product_id` | Qué producto |
| `kiosko_id` | En qué kiosco |
| `movement_type` | Tipo: `in`, `out`, `purchase`, `sale` |
| `quantity` | Cantidad del movimiento |
| `reason` | Motivo/descripción |
| `reference_id` | ID de referencia (venta o compra) |
| `created_by` | Quién lo registró |
| `created_at` | Fecha/hora |

**Tipos de movimiento:**
- `in` → Entrada manual de stock
- `out` → Salida manual de stock
- `purchase` → Entrada por compra
- `sale` → Salida por venta

---

## 💵 Caja Registradora

### 💼 **cash_registers** - Cajas
Las cajas o turnos de trabajo.

| Campo | Descripción |
|-------|-------------|
| `id` | ID único |
| `kiosko_id` | De qué kiosco |
| `employee_id` | Quién abrió la caja |
| `opening_balance` | Saldo inicial |
| `closing_balance` | Saldo al cerrar |
| `status` | Estado: `open`, `closed` |
| `opened_at` | Fecha/hora de apertura |
| `closed_at` | Fecha/hora de cierre |

### 💳 **cash_register_transactions** - Transacciones de Caja
Todas las operaciones en la caja.

| Campo | Descripción |
|-------|-------------|
| `id` | ID único |
| `cash_register_id` | De qué caja |
| `type` | Tipo: `sale`, `expense`, `withdrawal`, `deposit` |
| `amount` | Monto |
| `payment_method` | Forma de pago |
| `description` | Descripción |
| `reference_id` | ID de referencia (venta) |
| `created_at` | Fecha/hora |

---

## 🔔 Notificaciones

### 📲 **notification_configs** - Configuración de Notificaciones
Configuración de Telegram/WhatsApp para cada kiosco.

| Campo | Descripción |
|-------|-------------|
| `id` | ID único |
| `kiosko_id` | Para qué kiosco |
| `whatsapp_enabled` | WhatsApp activado |
| `whatsapp_phone` | Teléfono de WhatsApp |
| `whatsapp_verified` | Si está verificado |
| `telegram_enabled` | Telegram activado |
| `telegram_chat_id` | ID del chat de Telegram |
| `telegram_verified` | Si está verificado |
| `notify_sales` | Notificar ventas |
| `notify_low_stock` | Notificar stock bajo |
| `notify_large_sales` | Notificar ventas grandes |
| `large_sale_threshold` | Monto mínimo para notificar |

### 📞 **phone_verifications** - Verificación de Teléfonos
Para verificar números de WhatsApp.

| Campo | Descripción |
|-------|-------------|
| `id` | ID único |
| `kiosko_id` | Para qué kiosco |
| `phone` | Número de teléfono |
| `code` | Código de verificación |
| `expires_at` | Fecha de expiración |
| `verified` | Si fue verificado |

---

## 💳 Suscripciones

### 📋 **subscription_plans** - Planes de Suscripción
Los planes disponibles para los kioscos.

| Campo | Descripción |
|-------|-------------|
| `id` | ID único |
| `name` | Nombre del plan (Básico, Pro, Enterprise) |
| `price` | Precio mensual |
| `features` | Características (JSON) |
| `max_products` | Máximo de productos |
| `max_employees` | Máximo de empleados |
| `is_active` | Si está disponible |

---

## 🔗 Relaciones entre Tablas

\`\`\`
profiles (usuario)
    └── kioscos (1 usuario tiene muchos kioscos)
            ├── employees (1 kiosco tiene muchos empleados)
            ├── products (1 kiosco tiene muchos productos)
            │       └── stock_movements (1 producto tiene muchos movimientos)
            ├── sales (1 kiosco tiene muchas ventas)
            │       └── sale_items (1 venta tiene muchos items)
            ├── purchases (1 kiosco tiene muchas compras)
            │       └── purchase_items (1 compra tiene muchos items)
            ├── cash_registers (1 kiosco tiene muchas cajas)
            │       └── cash_register_transactions
            └── notification_configs (1 kiosco tiene 1 config)
\`\`\`

---

## 📝 Ejemplos de Consultas Comunes

### Ver todos los productos de un kiosco:
\`\`\`sql
SELECT * FROM products WHERE kiosko_id = 'xxx' AND is_active = true;
\`\`\`

### Ver ventas del día:
\`\`\`sql
SELECT * FROM sales 
WHERE kiosko_id = 'xxx' 
AND DATE(created_at) = CURRENT_DATE;
\`\`\`

### Ver productos con stock bajo:
\`\`\`sql
SELECT * FROM products 
WHERE kiosko_id = 'xxx' 
AND stock_quantity <= min_stock_level;
\`\`\`

### Ver historial de movimientos de un producto:
\`\`\`sql
SELECT * FROM stock_movements 
WHERE product_id = 'xxx' 
ORDER BY created_at DESC;
\`\`\`

### Ver ventas de un empleado:
\`\`\`sql
SELECT * FROM sales 
WHERE employee_id = 'xxx' 
AND status = 'completed';
\`\`\`

---

## 🛡️ Seguridad (RLS)

Todas las tablas tienen **Row Level Security (RLS)** activado:
- Los dueños solo ven datos de sus propios kioscos
- Los empleados solo ven datos del kiosco donde trabajan
- Las políticas verifican automáticamente los permisos

---

*Última actualización: Diciembre 2024*
