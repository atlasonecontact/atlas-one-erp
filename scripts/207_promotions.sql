-- ============================================================================
-- 207_promotions.sql
-- Atlas ONE - Promociones / combos de productos (ej: "2 Cocas + 1 Fernet").
--
-- Una promocion es un precio especial para un combo de productos existentes.
-- No se persiste como si fuera "un producto mas": al venderse, se descompone
-- en los productos reales que la componen (ver app/dashboard/ventas/page.tsx,
-- buildSaleItems) y esos items van por el mismo camino de siempre
-- (register_sale, 128_atomic_sale_sync.sql) -> el stock de cada producto
-- componente se descuenta igual que si se hubiera vendido suelto. No hace
-- falta tocar register_sale para esto.
--
-- Mismo criterio que products/sale_items: sin RLS, con grants a
-- authenticated/service_role (el filtrado por kiosko_id lo hace la app).
-- ============================================================================

CREATE TABLE IF NOT EXISTS promotions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kiosko_id   UUID NOT NULL REFERENCES kioscos(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  price       NUMERIC NOT NULL CHECK (price >= 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS promotion_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id  UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
  product_id    UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity      INTEGER NOT NULL CHECK (quantity > 0)
);

CREATE INDEX IF NOT EXISTS promotions_kiosko_idx ON promotions (kiosko_id);
CREATE INDEX IF NOT EXISTS promotion_items_promotion_idx ON promotion_items (promotion_id);
CREATE INDEX IF NOT EXISTS promotion_items_product_idx ON promotion_items (product_id);

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.promotions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.promotion_items TO authenticated;
GRANT ALL PRIVILEGES ON TABLE public.promotions TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.promotion_items TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
