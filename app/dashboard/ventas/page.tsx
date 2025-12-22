"use client"

import { useState, useEffect, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ProductGrid } from "@/components/pos/product-grid"
import { Cart } from "@/components/pos/cart"
import { PaymentModal } from "@/components/pos/payment-modal"
import { ReceiptModal } from "@/components/pos/receipt-modal"
import { Search, Barcode, History, Bluetooth, Loader2, WifiOff, Wifi } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useScanner } from "@/lib/hooks/use-scanner"
import { useToast } from "@/components/ui/toast-provider"
import { enqueueSale, flushQueuedSales } from "@/lib/offline/sales-queue"

export interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  stock: number
}

export default function VentasPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [showPayment, setShowPayment] = useState(false)
  const [showReceipt, setShowReceipt] = useState(false)
  const [lastSale, setLastSale] = useState<{ items: CartItem[]; total: number; method: string } | null>(null)
  const [products, setProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [kioskoId, setKioskoId] = useState<string>("")
  const [kioskoName, setKioskoName] = useState<string>("ATLAS ONE")
  const [kioskoAddress, setKioskoAddress] = useState<string>("")
  const [employeeId, setEmployeeId] = useState<string | null>(null)
  const [employeeName, setEmployeeName] = useState<string>("")
  const [userRole, setUserRole] = useState<string>("")

  const supabase = createClient()
  const toast = useToast()

  // Scanner integration
  const handleBarcodeScanned = useCallback((barcode: string) => {
    console.log("[v0] Barcode scanned:", barcode)
    
    // Search for product by barcode
    const product = products.find(p => 
      p.barcode === barcode || 
      p.id === barcode ||
      p.sku === barcode
    )

    if (product) {
      addToCart(product)
      toast.success("Producto agregado", `${product.name} x1`)
    } else {
      // If not found, search by name (partial match)
      const matchByName = products.find(p => 
        p.name.toLowerCase().includes(barcode.toLowerCase())
      )
      
      if (matchByName) {
        addToCart(matchByName)
        toast.success("Producto agregado", `${matchByName.name} x1`)
      } else {
        toast.warning("Producto no encontrado", `Código: ${barcode}`)
        setSearchQuery(barcode)
      }
    }
  }, [products])

  const { 
    isListening, 
    lastScan, 
    isBluetoothSupported,
    bluetoothDevice,
    isConnecting,
    startListening, 
    stopListening,
    connectBluetoothScanner,
    disconnectBluetoothScanner,
    error: scannerError,
  } = useScanner({
    onScan: handleBarcodeScanned,
    minLength: 4,
    maxLength: 30,
  })

  // Auto-start scanner listening
  useEffect(() => {
    startListening()
    return () => stopListening()
  }, [])

  useEffect(() => {
    loadUserAndProducts()
  }, [])

  const loadUserAndProducts = async () => {
    setIsLoading(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setIsLoading(false)
      return
    }

    const { data: employeeData } = await supabase
      .from("employees")
      .select("id, kiosko_id, permissions, name")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle()

    if (employeeData) {
      console.log("[v0] User is employee:", employeeData.name)
      setUserRole("employee")
      setEmployeeId(employeeData.id)
      setEmployeeName(employeeData.name || "")
      setKioskoId(employeeData.kiosko_id)
      loadKioskoInfo(employeeData.kiosko_id)
      loadProducts(employeeData.kiosko_id)
    } else {
      console.log("[v0] User is owner, loading kioscos")
      const { data: kioscos } = await supabase
        .from("kioscos")
        .select("id, name, location")
        .eq("owner_id", user.id)
        .limit(1)

      if (kioscos && kioscos.length > 0) {
        console.log("[v0] Found kiosco:", kioscos[0].id)
        setUserRole("owner")
        setKioskoId(kioscos[0].id)
        setKioskoName(kioscos[0].name || "ATLAS ONE")
        setKioskoAddress(kioscos[0].location || "")
        loadProducts(kioscos[0].id)
      } else {
        console.log("[v0] No kioscos found")
        setIsLoading(false)
      }
    }
  }

  const loadKioskoInfo = async (kiosko_id: string) => {
    const { data } = await supabase
      .from("kioscos")
      .select("name, location")
      .eq("id", kiosko_id)
      .single()

    if (data) {
      setKioskoName(data.name || "ATLAS ONE")
      setKioskoAddress(data.location || "")
    }
  }

  const loadProducts = useCallback(async (kiosko_id: string) => {
    try {
      const { data: productsData, error } = await supabase
        .from("products")
        .select("*")
        .eq("kiosko_id", kiosko_id)
        .gt("stock_quantity", 0)
        .order("name")

      if (error) throw error

      if (productsData) {
        const mappedProducts = productsData.map((p: any) => ({
          id: p.id,
          name: p.name,
          category: p.category || "Sin categoría",
          price: p.price || 0,
          stock: p.stock_quantity || 0,
          status: p.stock_quantity <= 10 ? "low_stock" : "active",
        }))
        setProducts(mappedProducts)

        if (typeof window !== "undefined") {
          window.localStorage.setItem(`atlas.cache.products.${kiosko_id}.v1`, JSON.stringify(mappedProducts))
        }
      }
    } catch {
      if (typeof window !== "undefined") {
        const cached = window.localStorage.getItem(`atlas.cache.products.${kiosko_id}.v1`)
        if (cached) {
          try {
            const parsed = JSON.parse(cached)
            if (Array.isArray(parsed)) {
              setProducts(parsed)
              toast.warning("Modo offline", "Mostrando productos guardados")
            }
          } catch {
            // ignore
          }
        }
      }
    } finally {
      setIsLoading(false)
    }
  }, [supabase, toast])

  const syncOfflineSales = useCallback(async () => {
    if (typeof window === "undefined") return
    if (!window.navigator.onLine) return
    if (!kioskoId) return

    const result = await flushQueuedSales(supabase)
    if (!result) return

    if (result.flushed > 0) {
      toast.success("Ventas sincronizadas", `${result.flushed} venta(s) enviada(s)`)
      await loadProducts(kioskoId)
    }
  }, [kioskoId, loadProducts, supabase, toast])

  useEffect(() => {
    if (typeof window === "undefined") return
    const onOnline = () => {
      syncOfflineSales()
    }
    window.addEventListener("online", onOnline)
    return () => window.removeEventListener("online", onOnline)
  }, [syncOfflineSales])

  useEffect(() => {
    syncOfflineSales()
  }, [kioskoId, syncOfflineSales])

  const categories = ["all", "Bebidas", "Snacks", "Golosinas", "Cigarrillos", "Lácteos"]

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesCategory = selectedCategory === "all" || p.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const addToCart = (product: any) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id)
      if (existing) {
        if (existing.quantity >= product.stock) return prev
        return prev.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item))
      }
      return [...prev, { id: product.id, name: product.name, price: product.price, quantity: 1, stock: product.stock }]
    })
  }

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((item) => item.id !== id))
    } else {
      setCart((prev) => prev.map((item) => (item.id === id ? { ...item, quantity } : item)))
    }
  }

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id))
  }

  const clearCart = () => setCart([])

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0)
  const tax = subtotal * 0.21
  const total = subtotal + tax

  const applyCartToProducts = (currentProducts: any[], items: CartItem[]) => {
    const updated = currentProducts
      .map((p) => {
        const cartItem = items.find((c) => c.id === p.id)
        if (!cartItem) return p
        const nextStock = Math.max(0, Number(p.stock ?? 0) - cartItem.quantity)
        return {
          ...p,
          stock: nextStock,
          status: nextStock <= 10 ? "low_stock" : "active",
        }
      })
      .filter((p) => Number(p.stock ?? 0) > 0)

    if (typeof window !== "undefined" && kioskoId) {
      window.localStorage.setItem(`atlas.cache.products.${kioskoId}.v1`, JSON.stringify(updated))
    }

    return updated
  }

  const handlePayment = async (method: string) => {
    try {
      console.log("[v0] Processing payment:", { kioskoId, employeeId, total, method })

      const isOffline = typeof window !== "undefined" && !window.navigator.onLine

      const saleNumber = `V-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`

      if (isOffline) {
        enqueueSale({
          id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          createdAt: Date.now(),
          kioskoId,
          employeeId,
          saleNumber,
          totalAmount: total,
          paymentMethod: method,
          items: cart.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
            unitPrice: item.price,
          })),
        })

        setProducts((prev) => applyCartToProducts(prev, cart))
        toast.warning("Venta guardada offline", "Se sincronizará al reconectar")

        setLastSale({ items: cart, total, method })
        setShowPayment(false)
        setShowReceipt(true)
        setCart([])
        return
      }

      const { data: saleData, error: saleError } = await supabase
        .from("sales")
        .insert({
          kiosko_id: kioskoId,
          employee_id: employeeId,
          sale_number: saleNumber,
          total_amount: total,
          payment_method: method,
          payment_status: "completed",
        })
        .select()
        .single()

      if (saleError) {
        console.error("[v0] Sale error:", saleError)
        throw saleError
      }

      console.log("[v0] Sale created:", saleData.id)

      const saleItems = cart.map((item) => ({
        sale_id: saleData.id,
        product_id: item.id,
        quantity: item.quantity,
        unit_price: item.price,
        subtotal: item.price * item.quantity,
      }))

      const { error: itemsError } = await supabase.from("sale_items").insert(saleItems)

      if (itemsError) {
        console.error("[v0] Sale items error:", itemsError)
        throw itemsError
      }

      console.log("[v0] Sale items created")

      for (const item of cart) {
        const newStock = item.stock - item.quantity
        await supabase
          .from("products")
          .update({ stock_quantity: newStock, updated_at: new Date().toISOString() })
          .eq("id", item.id)
      }

      console.log("[v0] Stock updated")

      setLastSale({ items: cart, total, method })
      setShowPayment(false)
      setShowReceipt(true)
      setCart([])

      loadProducts(kioskoId)
    } catch (error) {
      console.error("[v0] Error saving sale:", error)

      const message = (error as any)?.message ? String((error as any).message) : ""
      const looksOffline =
        typeof window !== "undefined" &&
        (!window.navigator.onLine ||
          message.toLowerCase().includes("failed to fetch") ||
          message.toLowerCase().includes("network"))

      if (looksOffline) {
        const saleNumber = `V-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`
        enqueueSale({
          id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          createdAt: Date.now(),
          kioskoId,
          employeeId,
          saleNumber,
          totalAmount: total,
          paymentMethod: method,
          items: cart.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
            unitPrice: item.price,
          })),
        })

        setProducts((prev) => applyCartToProducts(prev, cart))
        toast.warning("Venta guardada offline", "Se sincronizará al reconectar")

        setLastSale({ items: cart, total, method })
        setShowPayment(false)
        setShowReceipt(true)
        setCart([])
        return
      }

      alert("Error al procesar la venta")
    }
  }

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-120px)] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-120px)] flex gap-6">
      {/* Left side - Products */}
      <div className="flex-1 flex flex-col">
        {/* Scanner status */}
        <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-[#0a0f1a]/50 border border-cyan-500/10">
          <div className="flex items-center gap-2">
            {isListening ? (
              <Wifi className="w-4 h-4 text-green-400" />
            ) : (
              <WifiOff className="w-4 h-4 text-gray-500" />
            )}
            <span className={`text-sm ${isListening ? "text-green-400" : "text-gray-500"}`}>
              {isListening ? "Scanner activo" : "Scanner inactivo"}
            </span>
          </div>
          
          {lastScan && (
            <span className="text-xs text-gray-500 ml-auto">
              Último: {lastScan.barcode} ({lastScan.timestamp.toLocaleTimeString()})
            </span>
          )}

          {isBluetoothSupported && (
            <Button
              size="sm"
              variant="outline"
              onClick={bluetoothDevice ? disconnectBluetoothScanner : connectBluetoothScanner}
              disabled={isConnecting}
              className={`ml-2 h-7 text-xs ${
                bluetoothDevice 
                  ? "border-green-500/30 text-green-400" 
                  : "border-cyan-500/30 text-cyan-400"
              } bg-transparent`}
            >
              {isConnecting ? (
                <Loader2 className="w-3 h-3 animate-spin mr-1" />
              ) : (
                <Bluetooth className="w-3 h-3 mr-1" />
              )}
              {bluetoothDevice ? "Desconectar" : "Bluetooth"}
            </Button>
          )}
        </div>

        {/* Search and filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              type="text"
              placeholder="Buscar por nombre, código o escanear..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[#0a0f1a] border-cyan-500/10 text-white placeholder:text-gray-500"
            />
          </div>
          <Button 
            variant="outline" 
            onClick={() => isListening ? stopListening() : startListening()}
            className={`gap-2 bg-transparent ${
              isListening 
                ? "border-green-500/30 text-green-400 hover:bg-green-500/10" 
                : "border-cyan-500/20 text-gray-400 hover:text-white"
            }`}
          >
            <Barcode className="w-4 h-4" />
            {isListening ? "Escuchando..." : "Escanear"}
          </Button>
          <Link href="/dashboard/ventas/historial">
            <Button
              variant="outline"
              className="border-cyan-500/20 text-gray-400 hover:text-white bg-transparent gap-2"
            >
              <History className="w-4 h-4" />
              Historial
            </Button>
          </Link>
        </div>

        {/* Categories */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                  : "bg-[#0a0f1a] text-gray-400 border border-cyan-500/10 hover:text-white"
              }`}
            >
              {cat === "all" ? "Todos" : cat}
            </button>
          ))}
        </div>

        {/* Products grid */}
        <ProductGrid products={filteredProducts} onAddToCart={addToCart} />
      </div>

      {/* Right side - Cart */}
      <Cart
        items={cart}
        subtotal={subtotal}
        tax={tax}
        total={total}
        onUpdateQuantity={updateQuantity}
        onRemove={removeFromCart}
        onClear={clearCart}
        onCheckout={() => setShowPayment(true)}
      />

      {/* Payment Modal */}
      <PaymentModal
        open={showPayment}
        onClose={() => setShowPayment(false)}
        total={total}
        onPayment={handlePayment}
        kioskoId={kioskoId}
        cartItems={cart}
        employeeName={employeeName}
      />

      {/* Receipt Modal */}
      {lastSale && (
        <ReceiptModal
          open={showReceipt}
          onClose={() => setShowReceipt(false)}
          items={lastSale.items}
          total={lastSale.total}
          method={lastSale.method}
          storeName={kioskoName}
          storeAddress={kioskoAddress}
        />
      )}
    </div>
  )
}
