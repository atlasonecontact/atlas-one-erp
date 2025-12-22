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

function createSaleInsertPayload(sale: QueuedSale) {
  return {
    kiosko_id: sale.kioskoId,
    employee_id: sale.employeeId,
    sale_number: sale.saleNumber,
    total_amount: sale.totalAmount,
    payment_method: sale.paymentMethod,
  }
}

async function ensureSaleId(supabase: any, sale: QueuedSale): Promise<string> {
  // Try find existing sale by stable sale_number for idempotency
  const { data: existing, error: existingError } = await supabase
    .from("sales")
    .select("id")
    .eq("sale_number", sale.saleNumber)
    .maybeSingle()

  if (existingError) throw existingError
  if (existing?.id) return existing.id

  const { data: created, error: createError } = await supabase
    .from("sales")
    .insert(createSaleInsertPayload(sale))
    .select("id")
    .single()

  if (createError) throw createError
  return created.id
}

async function ensureSaleItems(supabase: any, saleId: string, sale: QueuedSale) {
  // Avoid duplicating items if a previous flush partially succeeded
  const { data: existingItems, error: existingError } = await supabase
    .from("sale_items")
    .select("id")
    .eq("sale_id", saleId)
    .limit(1)

  if (existingError) throw existingError
  if (existingItems && existingItems.length > 0) return

  const saleItems = sale.items.map((item) => ({
    sale_id: saleId,
    product_id: item.productId,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    subtotal: item.unitPrice * item.quantity,
  }))

  const { error: itemsError } = await supabase.from("sale_items").insert(saleItems)
  if (itemsError) throw itemsError
}

async function decrementStockSafely(supabase: any, item: QueuedSaleItem) {
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("stock_quantity")
    .eq("id", item.productId)
    .single()

  if (productError) throw productError

  const current = Number(product?.stock_quantity ?? 0)
  const next = Math.max(0, current - item.quantity)

  const { error: stockError } = await supabase
    .from("products")
    .update({ stock_quantity: next, updated_at: new Date().toISOString() })
    .eq("id", item.productId)

  if (stockError) throw stockError
}

export async function flushQueuedSales(supabase: any): Promise<{ flushed: number; failed: number } | null> {
  if (typeof window === "undefined") return null
  const queue = getQueuedSales()
  if (queue.length === 0) return { flushed: 0, failed: 0 }

  let flushed = 0
  let failed = 0

  for (const sale of queue) {
    try {
      const saleId = await ensureSaleId(supabase, sale)
      await ensureSaleItems(supabase, saleId, sale)
      for (const item of sale.items) {
        await decrementStockSafely(supabase, item)
      }

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
