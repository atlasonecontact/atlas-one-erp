// Vida util estimada (en dias) por categoria, para precargar la fecha de
// vencimiento al escanear/crear un producto o al agregar un lote. Son valores
// orientativos de referencia, no vienen del EAN (el vencimiento real depende
// del lote/partida de cada recepcion, ver docs de diseño del catalogo
// maestro) — el usuario los puede corregir siempre.
import type { PRODUCT_CATEGORIES } from "./categories"

export const DEFAULT_SHELF_LIFE_DAYS: Record<(typeof PRODUCT_CATEGORIES)[number] | "default", number> = {
  Bebidas: 270,
  "Bebidas Alcohólicas": 720,
  Snacks: 150,
  Golosinas: 240,
  Cigarrillos: 365,
  Energizantes: 270,
  Lácteos: 20,
  Panadería: 5,
  Almacén: 180,
  Galletitas: 180,
  Helados: 365,
  Importados: 365,
  default: 180,
}

export function defaultExpirationDate(category: string | undefined | null): string {
  const days = (category && DEFAULT_SHELF_LIFE_DAYS[category as keyof typeof DEFAULT_SHELF_LIFE_DAYS]) || DEFAULT_SHELF_LIFE_DAYS.default
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}
