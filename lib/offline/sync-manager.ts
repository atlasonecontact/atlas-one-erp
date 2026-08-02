/**
 * Atlas ONE - Offline Sync Manager
 * 
 * Handles synchronization between IndexedDB and Supabase.
 * Key principle: Sales use the price at the TIME OF SALE, not current price.
 */

import {
  getOfflineDB,
  getPendingSales,
  getPendingStockMovements,
  getPendingPurchases,
  markSaleSynced,
  markSaleFailed,
  markStockMovementSynced,
  markPurchaseSynced,
  cacheProducts,
  setSyncMeta,
  getSyncMeta,
  type OfflineSale,
  type OfflineStockMovement,
  type OfflinePurchase,
  type OfflineProduct,
} from "./indexed-db"

// ============================================================================
// Sync Manager
// ============================================================================

export interface SyncResult {
  success: boolean
  salesSynced: number
  salesFailed: number
  stockMovementsSynced: number
  purchasesSynced: number
  errors: string[]
}

/**
 * Sync all pending offline data to Supabase
 */
export async function syncToServer(supabase: any): Promise<SyncResult> {
  const result: SyncResult = {
    success: true,
    salesSynced: 0,
    salesFailed: 0,
    stockMovementsSynced: 0,
    purchasesSynced: 0,
    errors: [],
  }

  // Check if online
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    result.success = false
    result.errors.push("Sin conexión a internet")
    return result
  }

  try {
    // Sync sales first (most critical)
    const salesResult = await syncSales(supabase)
    result.salesSynced = salesResult.synced
    result.salesFailed = salesResult.failed
    result.errors.push(...salesResult.errors)

    // Sync stock movements
    const stockResult = await syncStockMovements(supabase)
    result.stockMovementsSynced = stockResult.synced
    result.errors.push(...stockResult.errors)

    // Sync purchases
    const purchasesResult = await syncPurchases(supabase)
    result.purchasesSynced = purchasesResult.synced
    result.errors.push(...purchasesResult.errors)

    // Update last sync time
    await setSyncMeta("last_full_sync", Date.now())

    result.success = result.errors.length === 0
  } catch (error) {
    result.success = false
    result.errors.push(`Error de sincronización: ${error}`)
  }

  return result
}

/**
 * Sync pending sales to server.
 *
 * Cada venta se registra con la RPC transaccional `register_sale`: una sola
 * llamada que en el servidor inserta cabecera + items, descuenta stock de forma
 * atómica y registra el movimiento de inventario, todo en una transacción
 * (all-or-nothing). Es idempotente por (kiosko_id, sale_number), así que un
 * re-sync nunca duplica la venta ni vuelve a descontar stock.
 *
 * IMPORTANTE: los precios (unit_price/cost_price) viajan en el payload y son los
 * del MOMENTO DE LA VENTA. El servidor nunca re-lee el precio actual.
 * Ver scripts/128_atomic_sale_sync.sql.
 */
async function syncSales(supabase: any): Promise<{ synced: number; failed: number; errors: string[] }> {
  const result = { synced: 0, failed: 0, errors: [] as string[] }
  const pendingSales = await getPendingSales()

  for (const sale of pendingSales) {
    try {
      const { error } = await supabase.rpc("register_sale", {
        p_sale: {
          kiosko_id: sale.kioskoId,
          employee_id: sale.employeeId,
          sale_number: sale.saleNumber,
          total_amount: sale.totalAmount,
          payment_method: sale.paymentMethod,
          // Timestamp ORIGINAL de la venta, no el de sincronización
          created_at: new Date(sale.createdAt).toISOString(),
          items: sale.items.map(item => ({
            product_id: item.productId,
            product_name: item.productName, // Nombre denormalizado al momento de la venta
            quantity: item.quantity,
            unit_price: item.unitPrice,     // Precio histórico
            cost_price: item.costPrice,     // Costo histórico (para margen)
          })),
        },
      })

      if (error) throw error

      await markSaleSynced(sale.id)
      result.synced++
    } catch (error: any) {
      await markSaleFailed(sale.id, error.message || "Error desconocido")
      result.failed++
      result.errors.push(`Venta ${sale.saleNumber}: ${error.message}`)

      // Stop on auth errors
      if (error.message?.includes("auth") || error.status === 401) {
        break
      }
    }
  }

  return result
}

/**
 * Sync stock movements
 */
async function syncStockMovements(supabase: any): Promise<{ synced: number; errors: string[] }> {
  const result = { synced: 0, errors: [] as string[] }
  const pendingMovements = await getPendingStockMovements()

  for (const movement of pendingMovements) {
    try {
      const { error } = await supabase.from("stock_movements").insert({
        kiosko_id: movement.kioskoId,
        product_id: movement.productId,
        movement_type: movement.movementType,
        quantity: movement.quantity,
        reason: movement.reason,
        created_at: new Date(movement.createdAt).toISOString(),
      })

      if (error) throw error

      // Update product stock on server
      const { data: product } = await supabase
        .from("products")
        .select("stock_quantity")
        .eq("id", movement.productId)
        .single()

      if (product) {
        let newStock = Number(product.stock_quantity)
        if (movement.movementType === "entrada") {
          newStock += movement.quantity
        } else if (movement.movementType === "salida") {
          newStock = Math.max(0, newStock - movement.quantity)
        } else {
          newStock = movement.quantity // ajuste
        }

        await supabase
          .from("products")
          .update({ stock_quantity: newStock, updated_at: new Date().toISOString() })
          .eq("id", movement.productId)
      }

      await markStockMovementSynced(movement.id)
      result.synced++
    } catch (error: any) {
      result.errors.push(`Movimiento ${movement.id.slice(0, 8)}: ${error.message}`)
    }
  }

  return result
}

/**
 * Sync purchases
 */
async function syncPurchases(supabase: any): Promise<{ synced: number; errors: string[] }> {
  const result = { synced: 0, errors: [] as string[] }
  const pendingPurchases = await getPendingPurchases()

  for (const purchase of pendingPurchases) {
    try {
      // Create purchase
      const { data: newPurchase, error: purchaseError } = await supabase
        .from("purchases")
        .insert({
          kiosko_id: purchase.kioskoId,
          supplier_name: purchase.supplierName,
          invoice_number: purchase.invoiceNumber,
          total_amount: purchase.totalAmount,
          notes: purchase.notes,
          status: "completado",
          created_at: new Date(purchase.createdAt).toISOString(),
        })
        .select("id")
        .single()

      if (purchaseError) throw purchaseError

      // Insert purchase items
      const purchaseItems = purchase.items.map(item => ({
        purchase_id: newPurchase.id,
        product_id: item.productId,
        quantity: item.quantity,
        unit_cost: item.unitCost,
        subtotal: item.unitCost * item.quantity,
      }))

      const { error: itemsError } = await supabase
        .from("purchase_items")
        .insert(purchaseItems)

      if (itemsError) throw itemsError

      // Update stock for each item
      for (const item of purchase.items) {
        const { data: product } = await supabase
          .from("products")
          .select("stock_quantity")
          .eq("id", item.productId)
          .single()

        if (product) {
          await supabase
            .from("products")
            .update({
              stock_quantity: Number(product.stock_quantity) + item.quantity,
              updated_at: new Date().toISOString(),
            })
            .eq("id", item.productId)
        }
      }

      await markPurchaseSynced(purchase.id)
      result.synced++
    } catch (error: any) {
      result.errors.push(`Compra ${purchase.id.slice(0, 8)}: ${error.message}`)
    }
  }

  return result
}

// ============================================================================
// Product Cache Sync (Server -> Local)
// ============================================================================

/**
 * Download products from server and cache locally
 */
export async function refreshProductCache(supabase: any, kioskoId: string): Promise<number> {
  const { data: products, error } = await supabase
    .from("products")
    .select("id, name, barcode, category, stock_quantity, min_stock_level, cost_price, sale_price, is_active, kiosko_id")
    .eq("kiosko_id", kioskoId)
    .eq("is_active", true)

  if (error) {
    console.error("[Sync] Error fetching products:", error)
    throw error
  }

  const offlineProducts: OfflineProduct[] = products.map((p: any) => ({
    id: p.id,
    kioskoId: p.kiosko_id,
    name: p.name,
    barcode: p.barcode,
    category: p.category,
    salePrice: Number(p.sale_price) || 0,
    costPrice: Number(p.cost_price) || 0,
    stockQuantity: Number(p.stock_quantity) || 0,
    minStockLevel: Number(p.min_stock_level) || 10,
    isActive: p.is_active,
    syncedAt: Date.now(),
  }))

  await cacheProducts(offlineProducts)
  return offlineProducts.length
}

// ============================================================================
// Auto-Sync Hook
// ============================================================================

let syncInterval: ReturnType<typeof setInterval> | null = null

/**
 * Start automatic background sync
 */
export function startAutoSync(supabase: any, intervalMs: number = 30000): void {
  if (syncInterval) return

  // Sync immediately when coming online
  if (typeof window !== "undefined") {
    window.addEventListener("online", () => {
      console.log("[Sync] Back online, syncing...")
      syncToServer(supabase)
    })
  }

  // Periodic sync
  syncInterval = setInterval(async () => {
    if (typeof navigator !== "undefined" && navigator.onLine) {
      const result = await syncToServer(supabase)
      if (result.salesSynced > 0 || result.stockMovementsSynced > 0 || result.purchasesSynced > 0) {
        console.log("[Sync] Synced:", result)
      }
    }
  }, intervalMs)
}

/**
 * Stop automatic sync
 */
export function stopAutoSync(): void {
  if (syncInterval) {
    clearInterval(syncInterval)
    syncInterval = null
  }
}

// ============================================================================
// Conflict Resolution
// ============================================================================

/**
 * Get price at specific timestamp (for offline sales)
 * This ensures we use the price that was valid when the sale was made
 */
export async function getPriceAtTime(
  supabase: any,
  productId: string,
  timestamp: number
): Promise<{ salePrice: number; costPrice: number } | null> {
  // First check local cache (has the price at sync time)
  const db = await getOfflineDB()
  const cachedProduct = await db.get("products", productId)

  if (cachedProduct) {
    // If cached before the sale, use cached price
    if (cachedProduct.syncedAt <= timestamp) {
      return {
        salePrice: cachedProduct.salePrice,
        costPrice: cachedProduct.costPrice,
      }
    }
  }

  // Fallback to current price from server
  const { data: product } = await supabase
    .from("products")
    .select("sale_price, cost_price")
    .eq("id", productId)
    .single()

  if (product) {
    return {
      salePrice: Number(product.sale_price) || 0,
      costPrice: Number(product.cost_price) || 0,
    }
  }

  return null
}
