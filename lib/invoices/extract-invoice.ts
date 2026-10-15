// Lee una foto de factura/remito con un modelo de IA con visión (Claude) y devuelve
// los productos detectados. Separado en dos partes a propósito: parseExtractionResponse
// es puro (sin red) y se puede testear solo; extractInvoiceFromImage es el fetch a la
// API, que no se testea con Vitest (llamada real a un servicio externo).

export interface ExtractedInvoiceItem {
  name: string
  quantity: number
  unit_cost: number | null
}

export interface ExtractedInvoice {
  supplier_name: string | null
  receipt_number: string | null
  items: ExtractedInvoiceItem[]
}

const EXTRACTION_PROMPT = `Esta imagen es una factura o remito de un proveedor de un kiosco/minimarket argentino.
Extraé los datos en JSON puro (sin texto antes ni después, sin \`\`\`), con esta forma exacta:

{
  "supplier_name": "nombre del proveedor o null si no se ve",
  "receipt_number": "número de factura/remito o null si no se ve",
  "items": [
    { "name": "nombre del producto tal como figura", "quantity": 1, "unit_cost": 100.50 }
  ]
}

Reglas:
- "quantity" es siempre un número (si no se ve, usá 1).
- "unit_cost" es el precio unitario en pesos argentinos sin el símbolo $, o null si no se puede leer.
- Ignorá totales, subtotales, impuestos y líneas que no sean productos.
- Si la imagen no es una factura o no se puede leer ningún producto, devolvé "items": [].`

export function parseExtractionResponse(responseText: string): ExtractedInvoice {
  const cleaned = responseText
    .trim()
    .replace(/^```(json)?/i, "")
    .replace(/```$/, "")
    .trim()

  let parsed: unknown
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    throw new Error("La IA no devolvió un JSON válido")
  }

  if (typeof parsed !== "object" || parsed === null || !Array.isArray((parsed as any).items)) {
    throw new Error("La IA devolvió un JSON con una forma inesperada")
  }

  const raw = parsed as { supplier_name?: unknown; receipt_number?: unknown; items: unknown[] }

  const items: ExtractedInvoiceItem[] = raw.items
    .filter((it): it is Record<string, unknown> => typeof it === "object" && it !== null)
    .map((it) => ({
      name: String(it.name ?? "").trim(),
      quantity: Number(it.quantity) > 0 ? Number(it.quantity) : 1,
      unit_cost: it.unit_cost === null || it.unit_cost === undefined || isNaN(Number(it.unit_cost)) ? null : Number(it.unit_cost),
    }))
    .filter((it) => it.name.length > 0)

  return {
    supplier_name: typeof raw.supplier_name === "string" && raw.supplier_name.trim() ? raw.supplier_name.trim() : null,
    receipt_number:
      typeof raw.receipt_number === "string" && raw.receipt_number.trim() ? raw.receipt_number.trim() : null,
    items,
  }
}

export async function extractInvoiceFromImage(params: {
  imageBase64: string
  mediaType: string
}): Promise<ExtractedInvoice> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY no está configurada")
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-5-5",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: params.mediaType, data: params.imageBase64 } },
            { type: "text", text: EXTRACTION_PROMPT },
          ],
        },
      ],
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "")
    throw new Error(`Error de la API de Anthropic (${response.status}): ${errorBody.slice(0, 300)}`)
  }

  const data = await response.json()
  const text = data?.content?.[0]?.text
  if (typeof text !== "string") {
    throw new Error("La respuesta de la IA no tiene el formato esperado")
  }

  return parseExtractionResponse(text)
}
