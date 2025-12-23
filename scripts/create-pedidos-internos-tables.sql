-- Tabla para pedidos internos
CREATE TABLE IF NOT EXISTS pedidos_internos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_pedido TEXT NOT NULL UNIQUE,
  kiosco_id UUID NOT NULL REFERENCES kioscos(id) ON DELETE CASCADE,
  tipo_destino TEXT NOT NULL CHECK (tipo_destino IN ('stock_central', 'sucursal')),
  destino_kiosco_id UUID REFERENCES kioscos(id) ON DELETE SET NULL,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_proceso', 'recibido', 'cancelado')),
  observaciones TEXT,
  solicitado_por UUID REFERENCES profiles(id),
  fecha_solicitud TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fecha_recepcion TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para items de pedidos internos
CREATE TABLE IF NOT EXISTS pedidos_internos_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID NOT NULL REFERENCES pedidos_internos(id) ON DELETE CASCADE,
  producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  cantidad INTEGER NOT NULL CHECK (cantidad > 0),
  cantidad_recibida INTEGER DEFAULT 0 CHECK (cantidad_recibida >= 0),
  observaciones TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_pedidos_internos_kiosco ON pedidos_internos(kiosco_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_internos_destino ON pedidos_internos(destino_kiosco_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_internos_estado ON pedidos_internos(estado);
CREATE INDEX IF NOT EXISTS idx_pedidos_items_pedido ON pedidos_internos_items(pedido_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_items_producto ON pedidos_internos_items(producto_id);

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_pedidos_internos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER pedidos_internos_updated_at
BEFORE UPDATE ON pedidos_internos
FOR EACH ROW
EXECUTE FUNCTION update_pedidos_internos_updated_at();

CREATE TRIGGER pedidos_internos_items_updated_at
BEFORE UPDATE ON pedidos_internos_items
FOR EACH ROW
EXECUTE FUNCTION update_pedidos_internos_updated_at();

-- Generar número de pedido automáticamente
CREATE OR REPLACE FUNCTION generate_pedido_numero()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.numero_pedido IS NULL THEN
    NEW.numero_pedido := 'PI-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('pedidos_internos_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE IF NOT EXISTS pedidos_internos_seq;

CREATE TRIGGER generate_pedido_numero_trigger
BEFORE INSERT ON pedidos_internos
FOR EACH ROW
EXECUTE FUNCTION generate_pedido_numero();
