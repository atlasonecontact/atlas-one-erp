-- ============================================================================
-- verificaciones_stock.sql
-- NO es una migración: no cambia nada, son solo SELECTs. Pensado para correr de
-- tanto en tanto en el SQL Editor de Supabase y detectar si algo se descuadró en
-- stock (kardex vs stock real, compras/pedidos duplicados). No arregla nada solo:
-- cada bloque de abajo es una alarma para ir a mirar a mano.
--
-- Por qué no hay una query de "SUM(stock_movements) == products.stock_quantity"
-- para todos los productos: cuando se crea un producto, el stock inicial se
-- escribe directo en products.stock_quantity y NO queda un movimiento inicial en
-- stock_movements (no existe un "saldo de apertura" registrado). Entonces sumar
-- todos los movimientos de un producto y compararlo contra su stock actual va a
-- diferir por el stock con el que arrancó, aunque todo esté bien. Por eso las
-- queries de abajo buscan señales concretas de un problema en vez de un cuadre
-- exacto que el esquema actual no puede dar.
-- ============================================================================


-- 1) Productos con stock negativo.
-- Desde el script 228 el sistema permite vender con stock negativo (para no
-- trabar una venta por un desfasaje chico), pero un negativo grande o que no
-- se corrige con el tiempo suele ser una señal de que algo se vendió o cargó
-- mal. Revisar los que estén más lejos de cero primero.
SELECT
  p.id,
  p.name,
  p.stock_quantity,
  p.kiosko_id,
  k.name AS kiosko_name,
  p.updated_at
FROM products p
JOIN kioscos k ON k.id = p.kiosko_id
WHERE p.stock_quantity < 0
ORDER BY p.stock_quantity ASC
LIMIT 50;


-- 2) Movimientos de stock duplicados.
-- Mismo producto, mismo tipo, misma cantidad y mismo reference_id (o ambos sin
-- reference_id) creados a menos de 3 segundos de diferencia: huele a un doble
-- envío (doble click, reintento de red) que insertó el mismo movimiento dos
-- veces.
SELECT
  a.id AS movimiento_1,
  b.id AS movimiento_2,
  a.product_id,
  pr.name AS product_name,
  a.movement_type,
  a.quantity,
  a.reason,
  a.created_at AS created_at_1,
  b.created_at AS created_at_2
FROM stock_movements a
JOIN stock_movements b
  ON a.product_id = b.product_id
  AND a.movement_type = b.movement_type
  AND a.quantity = b.quantity
  AND a.id < b.id
  AND (a.reference_id = b.reference_id OR (a.reference_id IS NULL AND b.reference_id IS NULL))
  AND ABS(EXTRACT(EPOCH FROM (b.created_at - a.created_at))) < 3
JOIN products pr ON pr.id = a.product_id
ORDER BY a.created_at DESC
LIMIT 50;


-- 3) Compras duplicadas.
-- Mismo kiosko, mismo proveedor y mismo total, creadas a menos de 5 minutos de
-- diferencia: puede ser una compra cargada dos veces por error (doble click al
-- guardar, conexión lenta y reintento manual).
SELECT
  a.id AS compra_1,
  b.id AS compra_2,
  a.kiosko_id,
  a.supplier_name,
  a.total_amount,
  a.created_at AS created_at_1,
  b.created_at AS created_at_2
FROM purchases a
JOIN purchases b
  ON a.kiosko_id = b.kiosko_id
  AND a.supplier_name = b.supplier_name
  AND a.total_amount = b.total_amount
  AND a.id < b.id
  AND ABS(EXTRACT(EPOCH FROM (b.created_at - a.created_at))) < 300
ORDER BY a.created_at DESC
LIMIT 50;


-- 4) Pedidos internos duplicados (entre sucursales / a depósito central).
-- Mismo origen, mismo destino y mismo estado "pendiente", creados a menos de 5
-- minutos de diferencia: probable pedido disparado dos veces.
SELECT
  a.id AS pedido_1,
  b.id AS pedido_2,
  a.kiosco_id,
  a.destino_kiosco_id,
  a.tipo_destino,
  a.estado,
  a.created_at AS created_at_1,
  b.created_at AS created_at_2
FROM pedidos_internos a
JOIN pedidos_internos b
  ON a.kiosco_id = b.kiosco_id
  AND a.destino_kiosco_id IS NOT DISTINCT FROM b.destino_kiosco_id
  AND a.tipo_destino = b.tipo_destino
  AND a.estado = b.estado
  AND a.estado = 'pendiente'
  AND a.id < b.id
  AND ABS(EXTRACT(EPOCH FROM (b.created_at - a.created_at))) < 300
ORDER BY a.created_at DESC
LIMIT 50;


-- 5) Productos editados sin ningún movimiento de stock cerca.
-- Compara updated_at del producto contra el movimiento de stock más cercano en
-- el tiempo. Si la diferencia es grande, esa actualización de producto no dejó
-- rastro en stock_movements. Nota: esto solo es confiable para ediciones hechas
-- DESPUÉS de que la edición de productos empezó a loguear en stock_movements
-- (ver app/dashboard/productos/page.tsx, handleSave) — ediciones viejas van a
-- aparecer todas acá y no significan nada nuevo, son el estado previo a ese fix.
SELECT
  p.id,
  p.name,
  p.kiosko_id,
  p.updated_at,
  (
    SELECT MAX(sm.created_at)
    FROM stock_movements sm
    WHERE sm.product_id = p.id
  ) AS ultimo_movimiento,
  p.updated_at - (
    SELECT MAX(sm.created_at)
    FROM stock_movements sm
    WHERE sm.product_id = p.id
  ) AS brecha
FROM products p
WHERE p.updated_at > now() - interval '30 days'
ORDER BY p.updated_at DESC
LIMIT 100;
