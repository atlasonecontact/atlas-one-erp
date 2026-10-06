-- ============================================================================
-- 230_remove_zombie_stock_triggers.sql
-- Confirmado en vivo (consultas a pg_trigger/pg_proc, 2026-10-xx): había TRES
-- triggers de una generación de esquema anterior a register_sale/
-- confirm_receipt, ninguno documentado en scripts/ hasta ahora:
--
--   1) trigger_update_stock_on_sale   AFTER INSERT ON sale_items
--   2) update_stock_after_sale        AFTER INSERT ON sales
--   3) trigger_update_stock_on_purchase AFTER INSERT ON purchase_items
--
-- (1) y (2) llaman a la misma función update_stock_on_sale(), pero por cómo
-- está escrita (usa NEW.id asumiendo que es el id de la venta) y por el
-- orden en que register_sale() inserta las filas, hoy no llegan a duplicar
-- nada — son una bomba de tiempo, no un bug activo, pero alcanza con que
-- alguien reordene código para que empiecen a descontar el doble en silencio.
--
-- (3) SÍ es un bug activo HOY: components/purchases/purchase-modal-new.tsx
-- (usado en /dashboard/compras y /dashboard/compras/pedido-proveedor) inserta
-- en purchase_items (dispara el trigger, que ya suma el stock) y DESPUÉS
-- vuelve a sumar el mismo stock a mano desde el cliente. Cada compra por esa
-- pantalla suma el stock dos veces desde que existe ese trigger.
--
-- Reversion: recrear las 3 funciones/triggers con el cuerpo que se ve en el
-- comentario de arriba (ya no están en ningún script — si hace falta
-- reinstalarlos, pedir el pg_get_functiondef() guardado de esta auditoría).
-- ============================================================================

DROP TRIGGER IF EXISTS trigger_update_stock_on_sale ON sale_items;
DROP TRIGGER IF EXISTS update_stock_after_sale ON sales;
DROP TRIGGER IF EXISTS trigger_update_stock_on_purchase ON purchase_items;
DROP FUNCTION IF EXISTS update_stock_on_sale();
DROP FUNCTION IF EXISTS update_stock_on_purchase();
