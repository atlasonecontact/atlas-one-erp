-- 219_promotions_choice_slots.sql
-- Promociones con "bebida a eleccion": guarda en cada promocion los huecos a elegir en el
-- punto de venta ([{label, quantity, categories}]). Vacio = combo fijo de siempre.
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS choice_slots JSONB NOT NULL DEFAULT '[]'::jsonb;
