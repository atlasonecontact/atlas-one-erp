-- ============================================================================
-- 231_atomic_stock_adjust.sql
-- Hallazgo de la auditoría de stock (Fase 1, sección A y B): 4 lugares del
-- código (stock-movement-modal.tsx, purchase-modal-new.tsx, productos/page.tsx
-- x2, y la sincronización offline x2) ajustan products.stock_quantity leyendo
-- el valor actual al cliente, calculando el nuevo número en JavaScript, y
-- recién ahí escribiéndolo — sin lock, sin transacción. Si dos cambios de
-- stock del mismo producto se superponen, el segundo pisa al primero con un
-- número ya viejo. Además, no todos esos caminos dejan registro en
-- stock_movements, y el que sí lo hace (stock-movement-modal) puede guardar
-- una cantidad que no coincide con el cambio real (clampea en 0 el stock pero
-- no el movimiento registrado).
--
-- adjust_stock() reemplaza todo eso: un solo UPDATE con delta relativo
-- (nunca lee-calcula-escribe), devuelve el antes/después, y siempre deja
-- el movimiento en stock_movements con la cantidad real aplicada.
--
-- Reversion: DROP FUNCTION adjust_stock(uuid, uuid, integer, text, text, uuid);
-- no toca ninguna tabla.
-- ============================================================================

CREATE OR REPLACE FUNCTION adjust_stock(
  p_kiosko        uuid,
  p_product       uuid,
  p_delta         integer,        -- positivo = entra stock, negativo = sale
  p_movement_type text,           -- 'in' | 'out' | 'adjustment'
  p_reason        text DEFAULT NULL,
  p_reference_id  uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role   text;
  v_before integer;
  v_after  integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Sesión no válida';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM kioscos
    WHERE id = p_kiosko
      AND owner_id = auth.uid()
  ) THEN
    v_role := 'owner';
  ELSIF EXISTS (
    SELECT 1
    FROM employees e
    WHERE e.kiosko_id = p_kiosko
      AND e.user_id = auth.uid()
      AND e.status = 'active'
      AND (e.permissions->>'can_stock_entry') = 'true'
  ) THEN
    v_role := 'employee';
  ELSE
    RAISE EXCEPTION 'No tenés permiso para ajustar stock en este kiosko';
  END IF;

  IF p_movement_type NOT IN ('in', 'out', 'adjustment') THEN
    RAISE EXCEPTION 'movement_type inválido: %', p_movement_type;
  END IF;

  -- Delta relativo aplicado por la base, no un valor absoluto calculado en el
  -- cliente: no hay "leer -> calcular -> escribir" que pueda perderse.
  UPDATE products
     SET stock_quantity = stock_quantity + p_delta,
         updated_at     = now()
   WHERE id = p_product AND kiosko_id = p_kiosko
  RETURNING stock_quantity - p_delta, stock_quantity INTO v_before, v_after;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Producto inexistente en este kiosko';
  END IF;

  INSERT INTO stock_movements (product_id, kiosko_id, movement_type, quantity, reason, reference_id, created_by)
  VALUES (p_product, p_kiosko, p_movement_type, abs(p_delta), p_reason, p_reference_id, auth.uid());

  RETURN jsonb_build_object('stock_before', v_before, 'stock_after', v_after, 'role', v_role);
END;
$$;

REVOKE ALL ON FUNCTION adjust_stock(uuid, uuid, integer, text, text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION adjust_stock(uuid, uuid, integer, text, text, uuid) TO authenticated, service_role;
