// Búsqueda de imagen de producto por código de barras. Mismas fuentes que ya
// usa components/products/product-modal.tsx para autocompletar nombre/categoría
// al cargar un producto (Open Food Facts, UPCItemDB) — ahí se descartaba la
// imagen que esas APIs devuelven; acá es lo único que nos interesa.

export interface ImageCandidate {
  imageUrl: string
  source: "openfoodfacts" | "upcitemdb"
  sourceUrl?: string
  offName?: string // nombre que devolvió la fuente, para comparar contra el nuestro
}

export async function lookupOpenFoodFactsImage(barcode: string): Promise<ImageCandidate | null> {
  const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`)
  const data = await res.json()
  if (data.status !== 1 || !data.product) return null

  const p = data.product
  const imageUrl = p.image_front_url || p.image_url
  if (!imageUrl) return null

  const baseName = p.product_name_es || p.product_name || ""
  const brand = (p.brands || "").split(",")[0].trim()
  return {
    imageUrl,
    source: "openfoodfacts",
    sourceUrl: `https://world.openfoodfacts.org/product/${barcode}`,
    offName: [brand, baseName].filter(Boolean).join(" "),
  }
}

export async function lookupUpcItemDbImage(barcode: string): Promise<ImageCandidate | null> {
  const res = await fetch(`/api/barcode-lookup?upc=${barcode}`)
  const data = await res.json()
  const item = data.items?.[0]
  const imageUrl = item?.images?.[0]
  if (!imageUrl) return null

  const brand = (item.brand || "").trim()
  const title = item.title || ""
  return {
    imageUrl,
    source: "upcitemdb",
    offName: brand && !title.toLowerCase().startsWith(brand.toLowerCase()) ? `${brand} ${title}` : title,
  }
}

// Similitud por palabras en común (Jaccard) entre el nombre que devolvió la
// fuente externa y el nombre que ya tenemos cargado en Atlas. No es más que
// una señal: nunca alcanza sola para aprobar algo con bajo puntaje — ver
// decideConfidence.
export function nameSimilarity(a: string, b: string): number {
  const norm = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9 ]/g, " ")
      .replace(/\s+/g, " ")
      .trim()

  const wordsA = new Set(norm(a).split(" ").filter(Boolean))
  const wordsB = new Set(norm(b).split(" ").filter(Boolean))
  if (wordsA.size === 0 || wordsB.size === 0) return 0

  const intersection = [...wordsA].filter((w) => wordsB.has(w)).length
  const union = new Set([...wordsA, ...wordsB]).size
  return union === 0 ? 0 : intersection / union
}

export interface ConfidenceResult {
  confidence: number
  autoApprove: boolean
  matchMethod: string
}

// Regla central de "no asignar automáticamente matches dudosos": sólo se
// aprueba solo si, además de matchear por código de barras, el nombre que
// trajo la fuente se parece de verdad al que ya tenemos cargado. Si no, va a
// la cola de revisión — nunca se descarta directo, para que un humano decida.
export function decideConfidence(candidate: ImageCandidate, atlasName: string): ConfidenceResult {
  const sim = candidate.offName ? nameSimilarity(candidate.offName, atlasName) : 0

  if (candidate.source === "openfoodfacts") {
    if (sim >= 0.4) {
      return { confidence: Math.round(90 + sim * 10), autoApprove: true, matchMethod: "barcode+nombre (Open Food Facts)" }
    }
    return { confidence: 70, autoApprove: false, matchMethod: "barcode (Open Food Facts), nombre no coincide" }
  }

  // upcitemdb
  if (sim >= 0.4) {
    return { confidence: 80, autoApprove: true, matchMethod: "barcode+nombre (UPCItemDB)" }
  }
  return { confidence: 55, autoApprove: false, matchMethod: "barcode (UPCItemDB), nombre no coincide" }
}
