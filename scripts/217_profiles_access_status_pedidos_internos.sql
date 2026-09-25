-- ============================================================================
-- 217_profiles_access_status_pedidos_internos.sql
-- Hallazgos del recorrido completo de la app:
-- 1) profiles.access_status no existia: el layout y el middleware la consultan en
--    cada carga y devolvian 400. Se agrega con 'approved' por defecto, asi nadie
--    existente queda bloqueado.
-- 2) pedidos_internos / pedidos_internos_items no existian (404 en Compras >
--    Nota de Pedido Interna). Se crean apuntando a products, con RLS por kiosko.
-- Reversion: DROP de las tablas nuevas; la columna nueva es inocua.
-- ============================================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS access_status TEXT NOT NULL DEFAULT 'approved';

CREATE SEQUENCE IF NOT EXISTS pedidos_internos_seq;

CREATE TABLE IF NOT EXISTS pedidos_internos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_pedido TEXT NOT NULL UNIQUE DEFAULT ('PI-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(nextval('pedidos_internos_seq')::text, 4, '0')),
  kiosco_id UUID NOT NULL REFERENCES kioscos(id) ON DELETE CASCADE,
  tipo_destino TEXT NOT NULL DEFAULT 'stock_central' CHECK (tipo_destino IN ('stock_central', 'sucursal')),
  destino_kiosco_id UUID REFERENCES kioscos(id) ON DELETE SET NULL,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_proceso', 'recibido', 'cancelado')),
  observaciones TEXT,
  solicitado_por UUID DEFAULT auth.uid(),
  fecha_solicitud TIMESTAMPTZ DEFAULT now(),
  fecha_recepcion TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pedidos_internos_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID NOT NULL REFERENCES pedidos_internos(id) ON DELETE CASCADE,
  producto_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  cantidad INTEGER NOT NULL CHECK (cantidad > 0),
  cantidad_recibida INTEGER DEFAULT 0 CHECK (cantidad_recibida >= 0),
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pedidos_internos_kiosco ON pedidos_internos (kiosco_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_internos_destino ON pedidos_internos (destino_kiosco_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_items_pedido ON pedidos_internos_items (pedido_id);

ALTER TABLE pedidos_internos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos_internos_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pedidos_internos_members" ON pedidos_internos;
CREATE POLICY "pedidos_internos_members" ON pedidos_internos
  FOR ALL TO authenticated
  USING (
    kiosco_id IN (SELECT id FROM kioscos WHERE owner_id = auth.uid())
    OR kiosco_id IN (SELECT kiosko_id FROM employees WHERE user_id = auth.uid() AND status = 'active')
  )
  WITH CHECK (
    kiosco_id IN (SELECT id FROM kioscos WHERE owner_id = auth.uid())
    OR kiosco_id IN (SELECT kiosko_id FROM employees WHERE user_id = auth.uid() AND status = 'active')
  );

DROP POLICY IF EXISTS "pedidos_internos_items_members" ON pedidos_internos_items;
CREATE POLICY "pedidos_internos_items_members" ON pedidos_internos_items
  FOR ALL TO authenticated
  USING (pedido_id IN (SELECT id FROM pedidos_internos))
  WITH CHECK (pedido_id IN (SELECT id FROM pedidos_internos));

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.pedidos_internos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.pedidos_internos_items TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.pedidos_internos_seq TO authenticated;
