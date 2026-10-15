// Cuando una recepción llega de una factura leída por IA (Telegram), sus items no
// tienen product_id todavía, solo el nombre que decía la factura. Al escanear un
// producto con la pistolita, esto decide si ese código corresponde a una de esas
// líneas pendientes (y hay que completarla) en vez de agregar una línea nueva.

export interface DraftLineItem {
  product_id: string | null
  product_name: string
}

function normalize(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // sin acentos
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

/**
 * Busca, entre los items sin product_id, el que mejor matchee con el nombre del
 * producto escaneado. Devuelve el índice en `items` o -1 si no hay ningún candidato
 * razonable. Un nombre contenido en el otro (en cualquier sentido) cuenta como match;
 * nombres muy cortos (menos de 3 letras) no matchean para evitar falsos positivos.
 */
export function findUnmatchedDraftLineIndex(items: DraftLineItem[], scannedProductName: string): number {
  const target = normalize(scannedProductName)
  if (target.length < 3) return -1

  return items.findIndex((item) => {
    if (item.product_id !== null) return false
    const candidate = normalize(item.product_name)
    if (candidate.length < 3) return false
    return candidate.includes(target) || target.includes(candidate)
  })
}
