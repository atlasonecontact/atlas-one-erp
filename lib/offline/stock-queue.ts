export type QueuedStockMovement = {
  id: string
  createdAt: number
  kioskoId: string
  productId: string
  delta: number
  movementType: "in" | "out" | "adjustment"
  reason: string
}

const QUEUE_KEY = "atlas.offline.stockQueue.v1"

function safeParseJson<T>(raw: string | null): T | null {
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export function getQueuedStockMovements(): QueuedStockMovement[] {
  if (typeof window === "undefined") return []
  const data = safeParseJson<QueuedStockMovement[]>(window.localStorage.getItem(QUEUE_KEY))
  return Array.isArray(data) ? data : []
}

function setQueuedStockMovements(queue: QueuedStockMovement[]) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
}

export function enqueueStockMovement(movement: QueuedStockMovement) {
  const queue = getQueuedStockMovements()
  queue.push(movement)
  setQueuedStockMovements(queue)
}

export function removeQueuedStockMovement(id: string) {
  const queue = getQueuedStockMovements().filter((m) => m.id !== id)
  setQueuedStockMovements(queue)
}

/**
 * Sincroniza los movimientos de stock cargados offline con adjust_stock, que
 * aplica el delta en un solo UPDATE atómico y es idempotente por
 * p_idempotency_key (el id local): reintentar nunca duplica el ajuste.
 */
export async function flushQueuedStockMovements(supabase: any): Promise<{ flushed: number; failed: number } | null> {
  if (typeof window === "undefined") return null
  const queue = getQueuedStockMovements()
  if (queue.length === 0) return { flushed: 0, failed: 0 }

  let flushed = 0
  let failed = 0

  for (const movement of queue) {
    try {
      const { error } = await supabase.rpc("adjust_stock", {
        p_kiosko: movement.kioskoId,
        p_product: movement.productId,
        p_delta: movement.delta,
        p_movement_type: movement.movementType,
        p_reason: movement.reason,
        p_idempotency_key: movement.id,
      })
      if (error) throw error

      removeQueuedStockMovement(movement.id)
      flushed += 1
    } catch {
      failed += 1
      // Si uno falla (normalmente auth/red) se frena para no martillar el resto.
      break
    }
  }

  return { flushed, failed }
}
