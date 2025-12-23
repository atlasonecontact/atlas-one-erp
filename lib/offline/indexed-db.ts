/**
 * Atlas ONE - IndexedDB Offline Database
 * 
 * Stores sales, stock snapshots, purchases and orders for offline operation.
 * IMPORTANT: Products, kioscos, and employees are READ-ONLY cached.
 * Modifications to those entities are NOT supported offline to prevent conflicts.
 * 
 * Sales store the price AT THE TIME OF SALE to handle price changes.
 */

import { openDB, DBSchema, IDBPDatabase } from "idb"

// ============================================================================
// Types
// ============================================================================

export interface OfflineProduct {
  id: string
  kioskoId: string
  name: string
  barcode: string | null
  category: string | null
  salePrice: number
  costPrice: number
  stockQuantity: number
  minStockLevel: number
  isActive: boolean
  // Timestamp when this snapshot was taken
  syncedAt: number
}

export interface OfflineSaleItem {
  productId: string
  productName: string  // Denormalized - price at time of sale
  quantity: number
  unitPrice: number    // Price at time of sale
  costPrice: number    // Cost at time of sale for margin calc
  barcode: string | null
}

export interface OfflineSale {
  id: string
  kioskoId: string
  employeeId: string | null
  employeeName: string | null
  saleNumber: string
  totalAmount: number
  paymentMethod: string
  items: OfflineSaleItem[]
  // Offline metadata
  createdAt: number       // Unix timestamp of sale
  syncedAt: number        // 0 = pending sync, timestamp = synced
  syncError: string | null
  retryCount: number
}

export interface OfflineStockMovement {
  id: string
  kioskoId: string
  productId: string
  productName: string
  movementType: "entrada" | "salida" | "ajuste"
  quantity: number
  reason: string | null
  createdAt: number
  syncedAt: number        // 0 = pending sync
  syncError: string | null
}

export interface OfflinePurchase {
  id: string
  kioskoId: string
  supplierName: string
  invoiceNumber: string | null
  items: {
    productId: string
    productName: string
    quantity: number
    unitCost: number
  }[]
  totalAmount: number
  notes: string | null
  createdAt: number
  syncedAt: number        // 0 = pending sync
  syncError: string | null
}

export interface OfflineOrder {
  id: string
  kioskoId: string
  source: "pedidosya" | "rappi" | "whatsapp" | "telefono" | "mostrador"
  externalId: string | null
  customerName: string | null
  customerPhone: string | null
  items: {
    productId: string
    productName: string
    quantity: number
    unitPrice: number
  }[]
  totalAmount: number
  status: "pendiente" | "preparando" | "listo" | "entregado" | "cancelado"
  notes: string | null
  createdAt: number
  syncedAt: number        // 0 = pending sync
}

export interface SyncStatus {
  lastSync: number | null
  pendingSales: number
  pendingStockMovements: number
  pendingPurchases: number
  isOnline: boolean
}

// ============================================================================
// Database Schema
// ============================================================================

interface AtlasOfflineDB extends DBSchema {
  products: {
    key: string
    value: OfflineProduct
    indexes: {
      "by-kiosko": string
      "by-barcode": string
      "by-category": string
    }
  }
  sales: {
    key: string
    value: OfflineSale
    indexes: {
      "by-kiosko": string
      "by-synced": number
      "by-created": number
    }
  }
  stockMovements: {
    key: string
    value: OfflineStockMovement
    indexes: {
      "by-kiosko": string
      "by-synced": number
      "by-product": string
    }
  }
  purchases: {
    key: string
    value: OfflinePurchase
    indexes: {
      "by-kiosko": string
      "by-synced": number
    }
  }
  orders: {
    key: string
    value: OfflineOrder
    indexes: {
      "by-kiosko": string
      "by-status": string
      "by-source": string
    }
  }
  syncMeta: {
    key: string
    value: {
      key: string
      value: any
      updatedAt: number
    }
  }
}

// ============================================================================
// Database Instance
// ============================================================================

const DB_NAME = "atlas-one-offline"
const DB_VERSION = 1

let dbInstance: IDBPDatabase<AtlasOfflineDB> | null = null

export async function getOfflineDB(): Promise<IDBPDatabase<AtlasOfflineDB>> {
  if (dbInstance) return dbInstance

  dbInstance = await openDB<AtlasOfflineDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion, transaction) {
      // Products store (read-only cache)
      if (!db.objectStoreNames.contains("products")) {
        const productStore = db.createObjectStore("products", { keyPath: "id" })
        productStore.createIndex("by-kiosko", "kioskoId")
        productStore.createIndex("by-barcode", "barcode")
        productStore.createIndex("by-category", "category")
      }

      // Sales store (offline-first)
      if (!db.objectStoreNames.contains("sales")) {
        const salesStore = db.createObjectStore("sales", { keyPath: "id" })
        salesStore.createIndex("by-kiosko", "kioskoId")
        salesStore.createIndex("by-synced", "syncedAt")
        salesStore.createIndex("by-created", "createdAt")
      }

      // Stock movements store
      if (!db.objectStoreNames.contains("stockMovements")) {
        const stockStore = db.createObjectStore("stockMovements", { keyPath: "id" })
        stockStore.createIndex("by-kiosko", "kioskoId")
        stockStore.createIndex("by-synced", "syncedAt")
        stockStore.createIndex("by-product", "productId")
      }

      // Purchases store
      if (!db.objectStoreNames.contains("purchases")) {
        const purchasesStore = db.createObjectStore("purchases", { keyPath: "id" })
        purchasesStore.createIndex("by-kiosko", "kioskoId")
        purchasesStore.createIndex("by-synced", "syncedAt")
      }

      // Orders store
      if (!db.objectStoreNames.contains("orders")) {
        const ordersStore = db.createObjectStore("orders", { keyPath: "id" })
        ordersStore.createIndex("by-kiosko", "kioskoId")
        ordersStore.createIndex("by-status", "status")
        ordersStore.createIndex("by-source", "source")
      }

      // Sync metadata store
      if (!db.objectStoreNames.contains("syncMeta")) {
        db.createObjectStore("syncMeta", { keyPath: "key" })
      }
    },
  })

  return dbInstance
}

// ============================================================================
// Product Cache Operations (Read-Only)
// ============================================================================

export async function cacheProducts(products: OfflineProduct[]): Promise<void> {
  const db = await getOfflineDB()
  const tx = db.transaction("products", "readwrite")
  
  await Promise.all([
    ...products.map(p => tx.store.put(p)),
    tx.done
  ])

  // Update sync timestamp
  await setSyncMeta("products_last_sync", Date.now())
}

export async function getCachedProducts(kioskoId: string): Promise<OfflineProduct[]> {
  const db = await getOfflineDB()
  return db.getAllFromIndex("products", "by-kiosko", kioskoId)
}

export async function getCachedProductByBarcode(barcode: string): Promise<OfflineProduct | undefined> {
  const db = await getOfflineDB()
  return db.getFromIndex("products", "by-barcode", barcode)
}

export async function getCachedProduct(productId: string): Promise<OfflineProduct | undefined> {
  const db = await getOfflineDB()
  return db.get("products", productId)
}

/**
 * Update local stock quantity after offline sale
 * This is a LOCAL update only - real stock is updated on sync
 */
export async function decrementLocalStock(productId: string, quantity: number): Promise<void> {
  const db = await getOfflineDB()
  const product = await db.get("products", productId)
  
  if (product) {
    product.stockQuantity = Math.max(0, product.stockQuantity - quantity)
    await db.put("products", product)
  }
}

// ============================================================================
// Sales Operations (Offline-First)
// ============================================================================

export async function createOfflineSale(sale: Omit<OfflineSale, "syncedAt" | "syncError" | "retryCount">): Promise<OfflineSale> {
  const db = await getOfflineDB()
  
  const fullSale: OfflineSale = {
    ...sale,
    syncedAt: 0, // 0 = not synced
    syncError: null,
    retryCount: 0,
  }
  
  await db.put("sales", fullSale)
  
  // Update local stock for each item
  for (const item of sale.items) {
    await decrementLocalStock(item.productId, item.quantity)
  }
  
  return fullSale
}

export async function getOfflineSales(kioskoId: string): Promise<OfflineSale[]> {
  const db = await getOfflineDB()
  const sales = await db.getAllFromIndex("sales", "by-kiosko", kioskoId)
  return sales.sort((a, b) => b.createdAt - a.createdAt)
}

export async function getPendingSales(): Promise<OfflineSale[]> {
  const db = await getOfflineDB()
  // syncedAt = 0 means not synced yet
  return db.getAllFromIndex("sales", "by-synced", 0)
}

export async function markSaleSynced(saleId: string): Promise<void> {
  const db = await getOfflineDB()
  const sale = await db.get("sales", saleId)
  
  if (sale) {
    sale.syncedAt = Date.now()
    sale.syncError = null
    await db.put("sales", sale)
  }
}

export async function markSaleFailed(saleId: string, error: string): Promise<void> {
  const db = await getOfflineDB()
  const sale = await db.get("sales", saleId)
  
  if (sale) {
    sale.syncError = error
    sale.retryCount += 1
    await db.put("sales", sale)
  }
}

export async function deleteSyncedSales(olderThanDays: number = 7): Promise<number> {
  const db = await getOfflineDB()
  const cutoff = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000)
  
  const allSales = await db.getAll("sales")
  const toDelete = allSales.filter(s => s.syncedAt && s.syncedAt < cutoff)
  
  const tx = db.transaction("sales", "readwrite")
  await Promise.all([
    ...toDelete.map(s => tx.store.delete(s.id)),
    tx.done
  ])
  
  return toDelete.length
}

// ============================================================================
// Stock Movement Operations
// ============================================================================

export async function createOfflineStockMovement(
  movement: Omit<OfflineStockMovement, "syncedAt" | "syncError">
): Promise<OfflineStockMovement> {
  const db = await getOfflineDB()
  
  const fullMovement: OfflineStockMovement = {
    ...movement,
    syncedAt: 0,
    syncError: null,
  }
  
  await db.put("stockMovements", fullMovement)
  
  // Update local stock
  const product = await db.get("products", movement.productId)
  if (product) {
    if (movement.movementType === "entrada") {
      product.stockQuantity += movement.quantity
    } else if (movement.movementType === "salida") {
      product.stockQuantity = Math.max(0, product.stockQuantity - movement.quantity)
    } else {
      // ajuste - set absolute value
      product.stockQuantity = movement.quantity
    }
    await db.put("products", product)
  }
  
  return fullMovement
}

export async function getPendingStockMovements(): Promise<OfflineStockMovement[]> {
  const db = await getOfflineDB()
  return db.getAllFromIndex("stockMovements", "by-synced", 0)
}

export async function markStockMovementSynced(movementId: string): Promise<void> {
  const db = await getOfflineDB()
  const movement = await db.get("stockMovements", movementId)
  
  if (movement) {
    movement.syncedAt = Date.now()
    movement.syncError = null
    await db.put("stockMovements", movement)
  }
}

// ============================================================================
// Purchases Operations
// ============================================================================

export async function createOfflinePurchase(
  purchase: Omit<OfflinePurchase, "syncedAt" | "syncError">
): Promise<OfflinePurchase> {
  const db = await getOfflineDB()
  
  const fullPurchase: OfflinePurchase = {
    ...purchase,
    syncedAt: 0,
    syncError: null,
  }
  
  await db.put("purchases", fullPurchase)
  
  // Update local stock (add items)
  for (const item of purchase.items) {
    const product = await db.get("products", item.productId)
    if (product) {
      product.stockQuantity += item.quantity
      await db.put("products", product)
    }
  }
  
  return fullPurchase
}

export async function getPendingPurchases(): Promise<OfflinePurchase[]> {
  const db = await getOfflineDB()
  return db.getAllFromIndex("purchases", "by-synced", 0)
}

export async function markPurchaseSynced(purchaseId: string): Promise<void> {
  const db = await getOfflineDB()
  const purchase = await db.get("purchases", purchaseId)
  
  if (purchase) {
    purchase.syncedAt = Date.now()
    purchase.syncError = null
    await db.put("purchases", purchase)
  }
}

// ============================================================================
// Orders Operations
// ============================================================================

export async function saveOfflineOrder(order: OfflineOrder): Promise<void> {
  const db = await getOfflineDB()
  await db.put("orders", order)
}

export async function getOfflineOrders(kioskoId: string): Promise<OfflineOrder[]> {
  const db = await getOfflineDB()
  return db.getAllFromIndex("orders", "by-kiosko", kioskoId)
}

export async function updateOrderStatus(orderId: string, status: OfflineOrder["status"]): Promise<void> {
  const db = await getOfflineDB()
  const order = await db.get("orders", orderId)
  
  if (order) {
    order.status = status
    await db.put("orders", order)
  }
}

// ============================================================================
// Sync Metadata
// ============================================================================

export async function setSyncMeta(key: string, value: any): Promise<void> {
  const db = await getOfflineDB()
  await db.put("syncMeta", { key, value, updatedAt: Date.now() })
}

export async function getSyncMeta<T>(key: string): Promise<T | null> {
  const db = await getOfflineDB()
  const meta = await db.get("syncMeta", key)
  return meta?.value ?? null
}

export async function getSyncStatus(): Promise<SyncStatus> {
  const db = await getOfflineDB()
  
  const [pendingSales, pendingStockMovements, pendingPurchases, lastSync] = await Promise.all([
    db.getAllFromIndex("sales", "by-synced", 0),
    db.getAllFromIndex("stockMovements", "by-synced", 0),
    db.getAllFromIndex("purchases", "by-synced", 0),
    getSyncMeta<number>("last_full_sync"),
  ])
  
  return {
    lastSync,
    pendingSales: pendingSales.length,
    pendingStockMovements: pendingStockMovements.length,
    pendingPurchases: pendingPurchases.length,
    isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

export function generateOfflineId(): string {
  return `offline_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
}

export function generateSaleNumber(): string {
  const now = new Date()
  const datePart = now.toISOString().slice(2, 10).replace(/-/g, "")
  const timePart = now.toTimeString().slice(0, 5).replace(":", "")
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `OFF-${datePart}-${timePart}-${random}`
}

/**
 * Clear all offline data (use carefully!)
 */
export async function clearAllOfflineData(): Promise<void> {
  const db = await getOfflineDB()
  
  const tx = db.transaction(
    ["products", "sales", "stockMovements", "purchases", "orders", "syncMeta"],
    "readwrite"
  )
  
  await Promise.all([
    tx.objectStore("products").clear(),
    tx.objectStore("sales").clear(),
    tx.objectStore("stockMovements").clear(),
    tx.objectStore("purchases").clear(),
    tx.objectStore("orders").clear(),
    tx.objectStore("syncMeta").clear(),
    tx.done,
  ])
}

/**
 * Get database size estimate
 */
export async function getStorageEstimate(): Promise<{ used: number; quota: number } | null> {
  if (typeof navigator !== "undefined" && "storage" in navigator && "estimate" in navigator.storage) {
    const estimate = await navigator.storage.estimate()
    return {
      used: estimate.usage || 0,
      quota: estimate.quota || 0,
    }
  }
  return null
}
