export type QueuedSaleItem = {
  productId: string
  quantity: number
  unitPrice: number
}

export type QueuedSale = {
  id: string
  createdAt: number
  kioskoId: string
  employeeId: string | null
  saleNumber: string
  totalAmount: number
  paymentMethod: string
  items: QueuedSaleItem[]
}

const QUEUE_KEY = "atlas.offline.salesQueue.v1"

function safeParseJson<T>(raw: string | null): T | null {
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export function getQueuedSales(): QueuedSale[] {
  if (typeof window === "undefined") return []
  const data = safeParseJson<QueuedSale[]>(window.localStorage.getItem(QUEUE_KEY))
  return Array.isArray(data) ? data : []
}

function setQueuedSales(queue: QueuedSale[]) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
}

export function enqueueSale(sale: QueuedSale) {
  const queue = getQueuedSales()
  queue.push(sale)
  setQueuedSales(queue)
}

export function removeQueuedSale(id: string) {
  const queue = getQueuedSales().filter((s) => s.id !== id)
  setQueuedSales(queue)
}

function buildSalePayload(sale: QueuedSale) {
  return {
    kiosko_id: sale.kioskoId,
    employee_id: sale.employeeId,
    sale_number: sale.saleNumber,
    total_amount: sale.totalAmount,
    payment_method: sale.paymentMethod,
    // Timestamp original de la venta (offline), no el de sincronización
    created_at: new Date(sale.createdAt).toISOString(),
    items: sale.items.map((item) => ({
      product_id: item.productId,
      quantity: item.quantity,
      unit_price: item.unitPrice, // Precio histórico al momento de la venta
    })),
  }
}

export async function flushQueuedSales(supabase: any): Promise<{ flushed: number; failed: number } | null> {
  if (typeof window === "undefined") return null
  const queue = getQueuedSales()
  if (queue.length === 0) return { flushed: 0, failed: 0 }

  let flushed = 0
  let failed = 0

  for (const sale of queue) {
    try {
      // Registro atómico e idempotente en el servidor: cabecera + items +
      // descuento de stock en una sola transacción. Reintentar es seguro.
      const { error } = await supabase.rpc("register_sale", { p_sale: buildSalePayload(sale) })
      if (error) throw error

      removeQueuedSale(sale.id)
      flushed += 1
    } catch {
      failed += 1
      // If one fails, stop early to avoid hammering (usually auth/network)
      break
    }
  }

  return { flushed, failed }
}
