-- ============================================================================
-- 232_pedidos_internos_approval.sql
-- Flujo de aprobación para "Nota de Pedido Interna" (hasta ahora, "Marcar
-- como recibido" sólo cambiaba una etiqueta y no movía stock de ningún lado
-- — ver auditoría de stock, Fase 1, sección C).
--
-- Decisión del negocio (confirmada con el cliente): quien aprueba un pedido
-- interno elige, en ese momento, de cuál de sus kioscos sale la mercadería
-- (ya no existe la idea de un kiosko "central" fijo). Puede aprobar el dueño
-- siempre, o un empleado con el permiso nuevo can_approve_internal_orders.
-- El movimiento de stock (resta en origen, suma en destino) pasa en el mismo
-- instante en que se aprueba — no al "marcar como recibido" después.
--
-- Reversion: DROP FUNCTION approve_pedido_interno(uuid, uuid);
--   DROP FUNCTION reject_pedido_interno(uuid, text);
--   DROP FUNCTION _assert_can_approve_pedido_interno(uuid);
--   las columnas y el estado nuevo son aditivos, no hace falta revertirlos.
-- ============================================================================

ALTER TABLE pedidos_internos
  ADD COLUMN IF NOT EXISTS origen_kiosco_id UUID REFERENCES kioscos(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS aprobado_por     UUID,
  ADD COLUMN IF NOT EXISTS aprobado_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rechazado_por    UUID,
  ADD COLUMN IF NOT EXISTS rechazado_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS motivo_rechazo   TEXT;

ALTER TABLE pedidos_internos DROP CONSTRAINT IF EXISTS pedidos_internos_estado_check;
ALTER TABLE pedidos_internos
  ADD CONSTRAINT pedidos_internos_estado_check
  CHECK (estado IN ('pendiente', 'aprobado', 'rechazado', 'en_proceso', 'recibido', 'cancelado'));

-- Dueño del negocio (mirando el owner_id del kiosko que pidió el stock), o
-- cualquier empleado activo de CUALQUIER kiosko de ese mismo dueño que
-- tenga el permiso can_approve_internal_orders — un gerente puede supervisar
-- más de una sucursal.
CREATE OR REPLACE FUNCTION _assert_can_approve_pedido_interno(p_pedido_kiosko uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Sesión no válida';
  END IF;

  SELECT owner_id INTO v_owner FROM kioscos WHERE id = p_pedido_kiosko;
  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'Kiosko inexistente';
  END IF;

  IF v_owner = auth.uid() THEN
    RETURN 'owner';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM employees e
    JOIN kioscos k ON k.id = e.kiosko_id
    WHERE k.owner_id = v_owner
      AND e.user_id = auth.uid()
      AND e.status = 'active'
      AND (e.permissions->>'can_approve_internal_orders') = 'true'
  ) THEN
    RETURN 'employee';
  END IF;

  RAISE EXCEPTION 'No tenés permiso para aprobar pedidos internos';
END;
$$;

CREATE OR REPLACE FUNCTION approve_pedido_interno(p_pedido_id uuid, p_origen_kiosko_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  p        pedidos_internos%ROWTYPE;
  it       record;
  v_before integer;
  v_after  integer;
BEGIN
  SELECT * INTO p FROM pedidos_internos WHERE id = p_pedido_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pedido interno inexistente';
  END IF;

  PERFORM _assert_can_approve_pedido_interno(p.kiosco_id);

  IF p.estado <> 'pendiente' THEN
    RAISE EXCEPTION 'Este pedido ya fue procesado (estado actual: %)', p.estado;
  END IF;

  IF p_origen_kiosko_id = p.kiosco_id THEN
    RAISE EXCEPTION 'El origen no puede ser el mismo local que pidió el stock';
  END IF;

  FOR it IN
    SELECT producto_id, cantidad
    FROM pedidos_internos_items
    WHERE pedido_id = p.id
  LOOP
    -- Resta en el origen (puede quedar en negativo, igual que una venta: es
    -- la señal de que ese local no tenía realmente lo que mandó).
    UPDATE products
       SET stock_quantity = stock_quantity - it.cantidad,
           updated_at     = now()
     WHERE id = it.producto_id AND kiosko_id = p_origen_kiosko_id
    RETURNING stock_quantity + it.cantidad, stock_quantity INTO v_before, v_after;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'El producto no existe en el local de origen elegido';
    END IF;

    INSERT INTO stock_movements (product_id, kiosko_id, movement_type, quantity, reason, reference_id, created_by)
    VALUES (it.producto_id, p_origen_kiosko_id, 'out', it.cantidad,
            'Envío por pedido interno ' || p.numero_pedido, p.id, auth.uid());

    -- Suma en el destino (el que pidió). Mismo producto por id en ambos
    -- kioscos: el catálogo de productos es por kiosko, no compartido.
    UPDATE products
       SET stock_quantity = stock_quantity + it.cantidad,
           updated_at     = now()
     WHERE id = it.producto_id AND kiosko_id = p.kiosco_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'El producto no existe en el local que pidió el stock';
    END IF;

    INSERT INTO stock_movements (product_id, kiosko_id, movement_type, quantity, reason, reference_id, created_by)
    VALUES (it.producto_id, p.kiosco_id, 'in', it.cantidad,
            'Recepción por pedido interno ' || p.numero_pedido, p.id, auth.uid());

    UPDATE pedidos_internos_items
       SET cantidad_recibida = it.cantidad, updated_at = now()
     WHERE pedido_id = p.id AND producto_id = it.producto_id;
  END LOOP;

  UPDATE pedidos_internos
     SET estado           = 'aprobado',
         origen_kiosco_id = p_origen_kiosko_id,
         aprobado_por     = auth.uid(),
         aprobado_at      = now(),
         updated_at       = now()
   WHERE id = p.id;

  INSERT INTO audit_logs (kiosko_id, user_id, action, entity_type, entity_id, after_data)
  VALUES (p.kiosco_id, auth.uid(), 'pedido_interno.aprobado', 'pedido_interno', p.id,
          jsonb_build_object('origen_kiosko_id', p_origen_kiosko_id, 'numero_pedido', p.numero_pedido));

  RETURN jsonb_build_object('pedido_id', p.id, 'estado', 'aprobado');
END;
$$;

CREATE OR REPLACE FUNCTION reject_pedido_interno(p_pedido_id uuid, p_reason text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  p pedidos_internos%ROWTYPE;
BEGIN
  SELECT * INTO p FROM pedidos_internos WHERE id = p_pedido_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pedido interno inexistente';
  END IF;

  PERFORM _assert_can_approve_pedido_interno(p.kiosco_id);

  IF p.estado <> 'pendiente' THEN
    RAISE EXCEPTION 'Este pedido ya fue procesado (estado actual: %)', p.estado;
  END IF;

  UPDATE pedidos_internos
     SET estado         = 'rechazado',
         rechazado_por  = auth.uid(),
         rechazado_at   = now(),
         motivo_rechazo = p_reason,
         updated_at     = now()
   WHERE id = p.id;

  INSERT INTO audit_logs (kiosko_id, user_id, action, entity_type, entity_id, after_data)
  VALUES (p.kiosco_id, auth.uid(), 'pedido_interno.rechazado', 'pedido_interno', p.id,
          jsonb_build_object('motivo', p_reason, 'numero_pedido', p.numero_pedido));

  RETURN jsonb_build_object('pedido_id', p.id, 'estado', 'rechazado');
END;
$$;

REVOKE ALL ON FUNCTION _assert_can_approve_pedido_interno(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION approve_pedido_interno(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION reject_pedido_interno(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION _assert_can_approve_pedido_interno(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION approve_pedido_interno(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION reject_pedido_interno(uuid, text) TO authenticated, service_role;
