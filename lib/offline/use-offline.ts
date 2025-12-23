/**
 * Atlas ONE - useOffline Hook
 * 
 * React hook for offline-first operations.
 * Handles sales, stock, and sync status with automatic background sync.
 */

"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
  getOfflineDB,
  getCachedProducts,
  getCachedProductByBarcode,
  getCachedProduct,
  createOfflineSale,
  getOfflineSales,
  createOfflineStockMovement,
  createOfflinePurchase,
  getSyncStatus,
  generateOfflineId,
  generateSaleNumber,
  type OfflineProduct,
  type OfflineSale,
  type OfflineSaleItem,
  type SyncStatus,
} from "./indexed-db"
import { syncToServer, refreshProductCache, startAutoSync, stopAutoSync, type SyncResult } from "./sync-manager"
import { createBrowserClient } from "@supabase/ssr"

// ============================================================================
// Hook Types
// ============================================================================

export interface UseOfflineOptions {
  kioskoId: string
  employeeId?: string | null
  employeeName?: string | null
  autoSync?: boolean
  syncIntervalMs?: number
}

export interface UseOfflineReturn {
  // State
  isOnline: boolean
  isReady: boolean
  syncStatus: SyncStatus | null
  products: OfflineProduct[]
  recentSales: OfflineSale[]
  
  // Product operations
  getProduct: (productId: string) => Promise<OfflineProduct | undefined>
  getProductByBarcode: (barcode: string) => Promise<OfflineProduct | undefined>
  refreshProducts: () => Promise<void>
  
  // Sale operations
  createSale: (items: OfflineSaleItem[], paymentMethod: string) => Promise<OfflineSale>
  
  // Stock operations
  addStockMovement: (
    productId: string,
    productName: string,
    type: "entrada" | "salida" | "ajuste",
    quantity: number,
    reason?: string
  ) => Promise<void>
  
  // Purchase operations
  createPurchase: (
    supplierName: string,
    items: { productId: string; productName: string; quantity: number; unitCost: number }[],
    invoiceNumber?: string,
    notes?: string
  ) => Promise<void>
  
  // Sync operations
  syncNow: () => Promise<SyncResult>
  
  // Error state
  lastError: string | null
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useOffline(options: UseOfflineOptions): UseOfflineReturn {
  const { kioskoId, employeeId = null, employeeName = null, autoSync = true, syncIntervalMs = 30000 } = options

  // State
  const [isOnline, setIsOnline] = useState(true)
  const [isReady, setIsReady] = useState(false)
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null)
  const [products, setProducts] = useState<OfflineProduct[]>([])
  const [recentSales, setRecentSales] = useState<OfflineSale[]>([])
  const [lastError, setLastError] = useState<string | null>(null)

  // Refs
  const supabaseRef = useRef<any>(null)

  // Initialize Supabase client
  useEffect(() => {
    supabaseRef.current = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }, [])

  // Online/offline detection
  useEffect(() => {
    if (typeof window === "undefined") return

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    setIsOnline(navigator.onLine)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  // Initialize database and load data
  useEffect(() => {
    async function init() {
      try {
        await getOfflineDB()
        
        // Load cached products
        const cachedProducts = await getCachedProducts(kioskoId)
        setProducts(cachedProducts)

        // Load recent sales
        const sales = await getOfflineSales(kioskoId)
        setRecentSales(sales.slice(0, 50))

        // Update sync status
        const status = await getSyncStatus()
        setSyncStatus(status)

        setIsReady(true)

        // Refresh products from server if online
        if (navigator.onLine && supabaseRef.current) {
          try {
            await refreshProductCache(supabaseRef.current, kioskoId)
            const freshProducts = await getCachedProducts(kioskoId)
            setProducts(freshProducts)
          } catch (e) {
            console.warn("[Offline] Could not refresh products:", e)
          }
        }
      } catch (error) {
        console.error("[Offline] Init error:", error)
        setLastError("Error inicializando base de datos offline")
      }
    }

    if (kioskoId) {
      init()
    }
  }, [kioskoId])

  // Auto-sync setup
  useEffect(() => {
    if (autoSync && supabaseRef.current) {
      startAutoSync(supabaseRef.current, syncIntervalMs)
      return () => stopAutoSync()
    }
  }, [autoSync, syncIntervalMs])

  // Refresh sync status periodically
  useEffect(() => {
    const interval = setInterval(async () => {
      const status = await getSyncStatus()
      setSyncStatus(status)
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  // ============================================================================
  // Product Operations
  // ============================================================================

  const getProduct = useCallback(async (productId: string): Promise<OfflineProduct | undefined> => {
    return getCachedProduct(productId)
  }, [])

  const getProductByBarcode = useCallback(async (barcode: string): Promise<OfflineProduct | undefined> => {
    return getCachedProductByBarcode(barcode)
  }, [])

  const refreshProducts = useCallback(async (): Promise<void> => {
    if (!supabaseRef.current) return
    
    try {
      await refreshProductCache(supabaseRef.current, kioskoId)
      const freshProducts = await getCachedProducts(kioskoId)
      setProducts(freshProducts)
      setLastError(null)
    } catch (error: any) {
      setLastError(`Error actualizando productos: ${error.message}`)
    }
  }, [kioskoId])

  // ============================================================================
  // Sale Operations
  // ============================================================================

  const createSale = useCallback(async (
    items: OfflineSaleItem[],
    paymentMethod: string
  ): Promise<OfflineSale> => {
    const totalAmount = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)

    const sale = await createOfflineSale({
      id: generateOfflineId(),
      kioskoId,
      employeeId,
      employeeName,
      saleNumber: generateSaleNumber(),
      totalAmount,
      paymentMethod,
      items,
      createdAt: Date.now(),
    })

    // Update local state
    setRecentSales(prev => [sale, ...prev].slice(0, 50))
    
    // Update local product stock
    const updatedProducts = [...products]
    for (const item of items) {
      const idx = updatedProducts.findIndex(p => p.id === item.productId)
      if (idx >= 0) {
        updatedProducts[idx] = {
          ...updatedProducts[idx],
          stockQuantity: Math.max(0, updatedProducts[idx].stockQuantity - item.quantity),
        }
      }
    }
    setProducts(updatedProducts)

    // Update sync status
    const status = await getSyncStatus()
    setSyncStatus(status)

    // Try immediate sync if online
    if (isOnline && supabaseRef.current) {
      syncToServer(supabaseRef.current).catch(console.error)
    }

    return sale
  }, [kioskoId, employeeId, employeeName, products, isOnline])

  // ============================================================================
  // Stock Operations
  // ============================================================================

  const addStockMovement = useCallback(async (
    productId: string,
    productName: string,
    type: "entrada" | "salida" | "ajuste",
    quantity: number,
    reason?: string
  ): Promise<void> => {
    await createOfflineStockMovement({
      id: generateOfflineId(),
      kioskoId,
      productId,
      productName,
      movementType: type,
      quantity,
      reason: reason || null,
      createdAt: Date.now(),
    })

    // Update local product stock
    const updatedProducts = [...products]
    const idx = updatedProducts.findIndex(p => p.id === productId)
    if (idx >= 0) {
      if (type === "entrada") {
        updatedProducts[idx].stockQuantity += quantity
      } else if (type === "salida") {
        updatedProducts[idx].stockQuantity = Math.max(0, updatedProducts[idx].stockQuantity - quantity)
      } else {
        updatedProducts[idx].stockQuantity = quantity
      }
      setProducts(updatedProducts)
    }

    // Update sync status
    const status = await getSyncStatus()
    setSyncStatus(status)

    // Try immediate sync if online
    if (isOnline && supabaseRef.current) {
      syncToServer(supabaseRef.current).catch(console.error)
    }
  }, [kioskoId, products, isOnline])

  // ============================================================================
  // Purchase Operations
  // ============================================================================

  const createPurchase = useCallback(async (
    supplierName: string,
    items: { productId: string; productName: string; quantity: number; unitCost: number }[],
    invoiceNumber?: string,
    notes?: string
  ): Promise<void> => {
    const totalAmount = items.reduce((sum, item) => sum + item.unitCost * item.quantity, 0)

    await createOfflinePurchase({
      id: generateOfflineId(),
      kioskoId,
      supplierName,
      invoiceNumber: invoiceNumber || null,
      items,
      totalAmount,
      notes: notes || null,
      createdAt: Date.now(),
    })

    // Update local product stock (add quantities)
    const updatedProducts = [...products]
    for (const item of items) {
      const idx = updatedProducts.findIndex(p => p.id === item.productId)
      if (idx >= 0) {
        updatedProducts[idx].stockQuantity += item.quantity
      }
    }
    setProducts(updatedProducts)

    // Update sync status
    const status = await getSyncStatus()
    setSyncStatus(status)

    // Try immediate sync if online
    if (isOnline && supabaseRef.current) {
      syncToServer(supabaseRef.current).catch(console.error)
    }
  }, [kioskoId, products, isOnline])

  // ============================================================================
  // Sync Operations
  // ============================================================================

  const syncNow = useCallback(async (): Promise<SyncResult> => {
    if (!supabaseRef.current) {
      return {
        success: false,
        salesSynced: 0,
        salesFailed: 0,
        stockMovementsSynced: 0,
        purchasesSynced: 0,
        errors: ["Cliente no inicializado"],
      }
    }

    const result = await syncToServer(supabaseRef.current)
    
    // Refresh status
    const status = await getSyncStatus()
    setSyncStatus(status)

    // Refresh sales list
    const sales = await getOfflineSales(kioskoId)
    setRecentSales(sales.slice(0, 50))

    if (!result.success) {
      setLastError(result.errors.join(", "))
    } else {
      setLastError(null)
    }

    return result
  }, [kioskoId])

  return {
    isOnline,
    isReady,
    syncStatus,
    products,
    recentSales,
    getProduct,
    getProductByBarcode,
    refreshProducts,
    createSale,
    addStockMovement,
    createPurchase,
    syncNow,
    lastError,
  }
}
