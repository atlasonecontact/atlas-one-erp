export type QueuedPurchaseItem = {
  productId: string
  quantity: number
  unitCost: number
}

export type QueuedPurchase = {
  id: string
  createdAt: number
  kioskoId: string
  supplierName: string
  purchaseNumber: string
  totalAmount: number
  notes: string | null
  items: QueuedPurchaseItem[]
}

const QUEUE_KEY = "atlas.offline.purchasesQueue.v1"

function safeParseJson<T>(raw: string | null): T | null {
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export function getQueuedPurchases(): QueuedPurchase[] {
  if (typeof window === "undefined") return []
  const data = safeParseJson<QueuedPurchase[]>(window.localStorage.getItem(QUEUE_KEY))
  return Array.isArray(data) ? data : []
}

function setQueuedPurchases(queue: QueuedPurchase[]) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
}

export function enqueuePurchase(purchase: QueuedPurchase) {
  const queue = getQueuedPurchases()
  queue.push(purchase)
  setQueuedPurchases(queue)
}

export function removeQueuedPurchase(id: string) {
  const queue = getQueuedPurchases().filter((p) => p.id !== id)
  setQueuedPurchases(queue)
}

/**
 * Sincroniza las compras cargadas offline con register_purchase: cabecera +
 * items + stock en una sola transacción, idempotente por
 * (kiosko_id, purchase_number) — reintentar nunca duplica la compra.
 */
export async function flushQueuedPurchases(supabase: any): Promise<{ flushed: number; failed: number } | null> {
  if (typeof window === "undefined") return null
  const queue = getQueuedPurchases()
  if (queue.length === 0) return { flushed: 0, failed: 0 }

  let flushed = 0
  let failed = 0

  for (const purchase of queue) {
    try {
      const { error } = await supabase.rpc("register_purchase", {
        p_purchase: {
          kiosko_id: purchase.kioskoId,
          supplier_name: purchase.supplierName,
          purchase_number: purchase.purchaseNumber,
          total_amount: purchase.totalAmount,
          notes: purchase.notes,
          items: purchase.items.map((item) => ({
            product_id: item.productId,
            quantity: item.quantity,
            unit_cost: item.unitCost,
          })),
        },
      })
      if (error) throw error

      removeQueuedPurchase(purchase.id)
      flushed += 1
    } catch {
      failed += 1
      break
    }
  }

  return { flushed, failed }
}
