// Filtro de stock bajo, separado de los hooks/componentes para poder testearlo solo.
// Bug real que esto evita (2026-10): filtrar/ordenar por `updated_at` en vez de por
// stock dejaba afuera productos en 0 que hacía rato no se vendían. La regla correcta
// es: traer los productos con menos stock primero y comparar cada uno contra SU PROPIO
// min_stock_level (no un umbral fijo para todos).

export interface StockLevelProduct {
  id: string
  stock_quantity: number
  min_stock_level?: number | null
}

export const DEFAULT_MIN_STOCK_LEVEL = 10

/**
 * De una lista ya ordenada por stock ascendente, devuelve los productos en estado de
 * stock bajo (stock_quantity <= su min_stock_level, o 10 si no tiene uno definido),
 * hasta `limit` resultados.
 */
export function filterLowStock<T extends StockLevelProduct>(products: T[], limit: number): T[] {
  return products.filter((p) => p.stock_quantity <= (p.min_stock_level || DEFAULT_MIN_STOCK_LEVEL)).slice(0, limit)
}
