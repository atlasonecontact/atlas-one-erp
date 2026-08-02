# Sincronización atómica de ventas POS (issue #5)

**Estado:** implementado · **Migración:** `scripts/128_atomic_sale_sync.sql`

## Problema

Una venta POS debe registrarse como una unidad: cabecera (`sales`) + renglones
(`sale_items`) + descuento de `stock_quantity` + movimiento de inventario. Debe
funcionar offline (cola en el cliente) y sincronizarse al reconectar **sin**:

- dejar estado parcial (venta sin items, o items sin descontar stock),
- duplicar la venta si el sync se reintenta,
- perder el **precio histórico** (el precio/costo del momento de la venta),
- pisar el stock entre cajas concurrentes (*lost update*).

## Por qué no se puede resolver en el cliente

El cliente hacía 3+ llamadas REST independientes (`insert sales` → `insert
sale_items` → `update products` en loop). No hay transacción que las abarque: si
una falla a mitad, el estado queda corrupto. Además el descuento era
read-then-write (`SELECT stock` → `UPDATE max(0, stock-qty)`), con condición de
carrera entre terminales.

## Solución: una RPC transaccional

Toda la escritura vive en `register_sale(p_sale jsonb)` (Postgres). El cuerpo de
la función corre en **una sola transacción** (all-or-nothing):

1. **Atomicidad** — si cualquier paso falla, se revierte todo.
2. **Idempotencia** — índice único `(kiosko_id, sale_number)` + `ON CONFLICT DO
   NOTHING`. Reintentar el sync es seguro: no duplica venta ni re-descuenta stock
   (items y stock solo se tocan cuando la cabecera se insertó por primera vez).
3. **Precio histórico** — `unit_price` y `cost_price` viajan en el payload y se
   insertan tal cual. El servidor **nunca** re-lee el precio actual del producto.
4. **Stock sin carrera** — `UPDATE products SET stock_quantity = GREATEST(0,
   stock_quantity - qty)`, atómico, sin read-then-write.

### Payload

```json
{
  "kiosko_id": "uuid",
  "employee_id": "uuid | null",
  "sale_number": "V-...",
  "total_amount": 1234.5,
  "payment_method": "efectivo",
  "created_at": "ISO (timestamp original de la venta)",
  "items": [
    { "product_id": "uuid", "product_name": "...", "quantity": 2,
      "unit_price": 500, "cost_price": 300 }
  ]
}
```

Devuelve `{ "sale_id": "uuid", "created": true|false }` (`created=false` = ya
estaba sincronizada).

## Los tres caminos usan la misma RPC

- **POS online** — `app/dashboard/ventas/page.tsx` (`handlePayment`).
- **Cola offline legacy** (localStorage) — `lib/offline/sales-queue.ts`
  (`flushQueuedSales`).
- **Sync Manager IndexedDB** — `lib/offline/sync-manager.ts` (`syncSales`).

Un único punto de escritura ⇒ las mismas garantías para los tres.

## Pendiente / follow-up

- Consolidar los dos sistemas offline en uno solo (IndexedDB), retirando la cola
  legacy de localStorage una vez migrado el POS al hook `useOffline`.
- Deduplicar `sale_number` preexistentes antes de crear el índice único si la
  tabla ya tuviera repetidos.
