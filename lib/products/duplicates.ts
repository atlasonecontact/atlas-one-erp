// Detección de productos duplicados por código de barras. Separado de la pantalla de
// Productos para poder testearlo solo: este es el chequeo que evita que crear un
// producto con un código ya cargado genere una fila nueva en vez de sumar stock a la
// que ya existía (bug real: dos "Coca-Cola" con el mismo código, 2026-10).

export interface BarcodedProduct {
  id: string
  barcode?: string | null
}

/**
 * Busca, entre los productos ya cargados, uno que tenga el mismo código de barras que
 * el que se está por crear. Nunca compara contra sí mismo (currentId), para que esto
 * también sirva al editar un producto existente sin que se detecte como "duplicado de
 * sí mismo". Un barcode vacío/null nunca cuenta como duplicado de otro vacío/null.
 */
export function findDuplicateByBarcode<T extends BarcodedProduct>(
  products: T[],
  barcode: string | null | undefined,
  currentId?: string,
): T | undefined {
  const code = barcode?.trim()
  if (!code) return undefined
  return products.find((p) => p.id !== currentId && p.barcode?.trim() === code)
}
