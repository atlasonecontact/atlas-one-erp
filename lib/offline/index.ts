/**
 * Atlas ONE - Offline Module
 * 
 * Complete offline-first functionality for sales, stock, and purchases.
 * Uses IndexedDB for local storage with automatic sync to Supabase.
 */

// Core database operations
export {
  getOfflineDB,
  getCachedProducts,
  getCachedProductByBarcode,
  getCachedProduct,
  cacheProducts,
  decrementLocalStock,
  createOfflineSale,
  getOfflineSales,
  getPendingSales,
  markSaleSynced,
  markSaleFailed,
  deleteSyncedSales,
  createOfflineStockMovement,
  getPendingStockMovements,
  markStockMovementSynced,
  createOfflinePurchase,
  getPendingPurchases,
  markPurchaseSynced,
  saveOfflineOrder,
  getOfflineOrders,
  updateOrderStatus,
  getSyncStatus,
  generateOfflineId,
  generateSaleNumber,
  clearAllOfflineData,
  getStorageEstimate,
  type OfflineProduct,
  type OfflineSale,
  type OfflineSaleItem,
  type OfflineStockMovement,
  type OfflinePurchase,
  type OfflineOrder,
  type SyncStatus,
} from "./indexed-db"

// Sync operations
export {
  syncToServer,
  refreshProductCache,
  startAutoSync,
  stopAutoSync,
  getPriceAtTime,
  type SyncResult,
} from "./sync-manager"

// React hook
export { useOffline, type UseOfflineOptions, type UseOfflineReturn } from "./use-offline"

// Legacy queue (for backwards compatibility)
export {
  getQueuedSales,
  enqueueSale,
  removeQueuedSale,
  flushQueuedSales,
  type QueuedSale,
  type QueuedSaleItem,
} from "./sales-queue"
