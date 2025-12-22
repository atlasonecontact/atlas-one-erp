"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ProductGrid } from "@/components/pos/product-grid"
import { Cart } from "@/components/pos/cart"
import { PaymentModal } from "@/components/pos/payment-modal"
import { ReceiptModal } from "@/components/pos/receipt-modal"
import { Search, Barcode, History } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

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
  const [employeeId, setEmployeeId] = useState<string | null>(null)
  const [employeeName, setEmployeeName] = useState<string>("")
  const [userRole, setUserRole] = useState<string>("")

  const supabase = createClient()

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
      // User is an employee
      console.log("[v0] User is employee:", employeeData.name)
      setUserRole("employee")
      setEmployeeId(employeeData.id)
      setEmployeeName(employeeData.name || "")
      setKioskoId(employeeData.kiosko_id)
      loadProducts(employeeData.kiosko_id)
    } else {
      console.log("[v0] User is owner, loading kioscos")
      const { data: kioscos } = await supabase.from("kioscos").select("id").eq("owner_id", user.id).limit(1)

      if (kioscos && kioscos.length > 0) {
        console.log("[v0] Found kiosco:", kioscos[0].id)
        setUserRole("owner")
        setKioskoId(kioscos[0].id)
        loadProducts(kioscos[0].id)
      } else {
        console.log("[v0] No kioscos found")
        setIsLoading(false)
      }
    }
  }

  const loadProducts = async (kiosko_id: string) => {
    const { data: productsData } = await supabase
      .from("products")
      .select("*")
      .eq("kiosko_id", kiosko_id)
      .eq("is_active", true)
      .gt("stock_quantity", 0)
      .order("name")

    if (productsData) {
      // Map database fields to component fields
      const mappedProducts = productsData.map((p: any) => ({
        id: p.id,
        name: p.name,
        category: p.category || "Sin categoría",
        price: p.price || 0,
        stock: p.stock_quantity || 0,
        status: p.stock_quantity <= 10 ? "low_stock" : "active",
      }))
      setProducts(mappedProducts)
    }
    setIsLoading(false)
  }

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

  const handlePayment = async (method: string) => {
    try {
      console.log("[v0] Processing payment:", { kioskoId, employeeId, total, method })

      const saleNumber = `V-${Date.now()}`
      const { data: saleData, error: saleError } = await supabase
        .from("sales")
        .insert({
          kiosko_id: kioskoId,
          employee_id: employeeId,
          sale_number: saleNumber,
          total_amount: total,
          payment_method: method,
          status: "completed",
        })
        .select()
        .single()

      if (saleError) {
        console.error("[v0] Sale error:", saleError)
        throw saleError
      }

      console.log("[v0] Sale created:", saleData.id)

      // Insert sale items with correct field names
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

      // Update product stock using correct field name
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

      // Reload products to update stock
      loadProducts(kioskoId)
    } catch (error) {
      console.error("[v0] Error saving sale:", error)
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
        {/* Search and filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              type="text"
              placeholder="Buscar por nombre o código..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[#0a0f1a] border-cyan-500/10 text-white placeholder:text-gray-500"
            />
          </div>
          <Button variant="outline" className="border-cyan-500/20 text-gray-400 hover:text-white bg-transparent gap-2">
            <Barcode className="w-4 h-4" />
            Escanear
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
        />
      )}
    </div>
  )
}
