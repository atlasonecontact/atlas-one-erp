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
 * Sync pending sales to server
 * IMPORTANT: Uses price at time of sale, not current price
 */
async function syncSales(supabase: any): Promise<{ synced: number; failed: number; errors: string[] }> {
  const result = { synced: 0, failed: 0, errors: [] as string[] }
  const pendingSales = await getPendingSales()

  for (const sale of pendingSales) {
    try {
      // Check if sale already exists (idempotency by sale_number)
      const { data: existing } = await supabase
        .from("sales")
        .select("id")
        .eq("sale_number", sale.saleNumber)
        .maybeSingle()

      let saleId = existing?.id

      if (!saleId) {
        // Create sale with ORIGINAL timestamp
        const { data: newSale, error: saleError } = await supabase
          .from("sales")
          .insert({
            kiosko_id: sale.kioskoId,
            employee_id: sale.employeeId,
            sale_number: sale.saleNumber,
            total_amount: sale.totalAmount,
            payment_method: sale.paymentMethod,
            // Use the ORIGINAL sale time, not current time
            created_at: new Date(sale.createdAt).toISOString(),
          })
          .select("id")
          .single()

        if (saleError) throw saleError
        saleId = newSale.id
      }

      // Check if items already exist
      const { data: existingItems } = await supabase
        .from("sale_items")
        .select("id")
        .eq("sale_id", saleId)
        .limit(1)

      if (!existingItems || existingItems.length === 0) {
        // Insert sale items with ORIGINAL prices
        const saleItems = sale.items.map(item => ({
          sale_id: saleId,
          product_id: item.productId,
          product_name: item.productName, // Denormalized name at time of sale
          quantity: item.quantity,
          unit_price: item.unitPrice,      // Price at time of sale
          subtotal: item.unitPrice * item.quantity,
        }))

        const { error: itemsError } = await supabase
          .from("sale_items")
          .insert(saleItems)

        if (itemsError) throw itemsError
      }

      // Decrement stock for each item
      for (const item of sale.items) {
        await decrementServerStock(supabase, item.productId, item.quantity)
      }

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
 * Decrement stock on server safely
 */
async function decrementServerStock(supabase: any, productId: string, quantity: number): Promise<void> {
  const { data: product, error: fetchError } = await supabase
    .from("products")
    .select("stock_quantity")
    .eq("id", productId)
    .single()

  if (fetchError) {
    console.warn(`[Sync] Could not fetch product ${productId}:`, fetchError)
    return
  }

  const currentStock = Number(product?.stock_quantity ?? 0)
  const newStock = Math.max(0, currentStock - quantity)

  const { error: updateError } = await supabase
    .from("products")
    .update({
      stock_quantity: newStock,
      updated_at: new Date().toISOString(),
    })
    .eq("id", productId)

  if (updateError) {
    console.warn(`[Sync] Could not update stock for ${productId}:`, updateError)
  }
}

/**
 * Sync stock movements
 */
async function syncStockMovements(supabase: any): Promise<{ synced: number; errors: string[] }> {
  const result = { synced: 0, errors: [] as string[] }
  const pendingMovements = await getPendingStockMovements()

  for (const movement of pendingMovements) {
    try {
      const { error } = await supabase.from("inventory_movements").insert({
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
