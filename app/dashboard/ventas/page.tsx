"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ProductGrid } from "@/components/pos/product-grid"
import { Cart } from "@/components/pos/cart"
import { PaymentModal } from "@/components/pos/payment-modal"
import { ReceiptModal } from "@/components/pos/receipt-modal"
import { Search, Barcode, History, Bluetooth, Loader2, WifiOff, Wifi, ShoppingCart, X } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useScanner } from "@/lib/hooks/use-scanner"
import { useToast } from "@/components/ui/toast-provider"
import { enqueueSale, flushQueuedSales } from "@/lib/offline/sales-queue"
import { cn } from "@/lib/utils"
import { useTheme } from "@/lib/theme-context"
import { useEmployeePermissions } from "@/lib/hooks/use-employee-permissions"
import { AccessDenied } from "@/components/ui/access-denied"

// Function to send Telegram notification after sale
async function sendSaleNotification(
  kioskoId: string, 
  saleNumber: string, 
  total: number, 
  paymentMethod: string,
  items: { name: string; quantity: number; price: number }[]
) {
  try {
    const supabase = createClient()
    
    // Get notification config for this kiosko
    const { data: config } = await supabase
      .from("notification_configs")
      .select("telegram_chat_id, telegram_enabled")
      .eq("kiosko_id", kioskoId)
      .maybeSingle()
    
    if (!config?.telegram_enabled || !config?.telegram_chat_id) {
      return // Notifications not enabled or no chat ID
    }
    
    // Get kiosko name
    const { data: kiosko } = await supabase
      .from("kioscos")
      .select("name")
      .eq("id", kioskoId)
      .single()
    
    // Format items list
    const itemsList = items.slice(0, 5).map(item => 
      `  • ${item.name} x${item.quantity} = $${(item.price * item.quantity).toLocaleString('es-AR')}`
    ).join('\n')
    const moreItems = items.length > 5 ? `\n  ... y ${items.length - 5} más` : ''
    
    // Format payment method
    const paymentLabels: Record<string, string> = {
      efectivo: '💵 Efectivo',
      cash: '💵 Efectivo',
      tarjeta: '💳 Tarjeta',
      card: '💳 Tarjeta',
      qr: '📱 QR',
      transfer: '🏦 Transferencia'
    }
    const paymentLabel = paymentLabels[paymentMethod.toLowerCase()] || paymentMethod
    
    // Build message
    const message = `🛒 <b>Nueva Venta!</b>

🏪 ${kiosko?.name || 'Mi Kiosco'}
🧾 #${saleNumber.split('-').slice(-1)[0]}

<b>Productos:</b>
${itemsList}${moreItems}

💰 <b>Total: $${total.toLocaleString('es-AR')}</b>
${paymentLabel}

📅 ${new Date().toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}`

    // Send notification
    await fetch("/api/notifications/telegram", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chatId: config.telegram_chat_id,
        message
      }),
    })
  } catch (error) {
    console.error("[Telegram] Error sending sale notification:", error)
    // Don't throw - notifications should not break the sale flow
  }
}

export interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  stock: number
  isPromotion?: boolean
  promotionComponents?: { productId: string; productName: string; quantity: number; unitPrice: number }[]
}

export default function VentasPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const searchInputRef = useRef<HTMLInputElement>(null)
  const { config } = useTheme()
  const { permissions, loading: permsLoading } = useEmployeePermissions()
  const [searchInput, setSearchInput] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState("all")
  const PRODUCTS_PAGE_SIZE = 60
  const [visibleCount, setVisibleCount] = useState(PRODUCTS_PAGE_SIZE)
  const [showPayment, setShowPayment] = useState(false)
  const [showReceipt, setShowReceipt] = useState(false)
  const [lastSale, setLastSale] = useState<{
    saleId?: string
    saleNumber?: string
    items: CartItem[]
    total: number
    method: string
    offline?: boolean
  } | null>(null)
  const [products, setProducts] = useState<any[]>([])
  const [promotions, setPromotions] = useState<{ id: string; name: string; price: number; items: { product_id: string; quantity: number }[] }[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [kioskoId, setKioskoId] = useState<string>("")
  const [kioskoName, setKioskoName] = useState<string>("ATLAS ONE")
  const [kioskoAddress, setKioskoAddress] = useState<string>("")
  const [employeeId, setEmployeeId] = useState<string | null>(null)
  const [employeeName, setEmployeeName] = useState<string>("")
  const [userRole, setUserRole] = useState<string>("")
  const [showMobileCart, setShowMobileCart] = useState(false)
  const [openRegisterId, setOpenRegisterId] = useState<string | null>(null)
  const [showOpenCash, setShowOpenCash] = useState(false)
  const [openCashBalance, setOpenCashBalance] = useState("")
  const [openingCash, setOpeningCash] = useState(false)
  const [arcaStatus, setArcaStatus] = useState<{ ready: boolean; reason?: string; environment?: string }>(
    { ready: false, reason: "Cargando configuración de ARCA..." },
  )

  const supabase = createClient()
  const toast = useToast()

  useEffect(() => {
    const scanParam = searchParams.get("scan")
    if (scanParam && products.length > 0) {
      handleBarcodeScanned(scanParam)
      // Clear the URL param
      window.history.replaceState({}, "", "/dashboard/ventas")
    }
  }, [searchParams, products])

  // Scanner integration
  const handleBarcodeScanned = useCallback(
    (barcode: string) => {
      // Search for product by barcode
      // Un escaneo siempre deja el buscador limpio y con el foco puesto.
      setSearchInput("")
      setSearchQuery("")
      const refocus = () => {
        if (typeof window !== "undefined" && window.innerWidth >= 1024) searchInputRef.current?.focus()
      }

      const product = products.find((p) => p.barcode === barcode || p.id === barcode || p.sku === barcode)

      if (product) {
        addToCart(product)
        toast.success("Producto agregado", `${product.name} x1`)
      } else {
        // If not found, search by name (partial match)
        const matchByName = products.find((p) => p.name.toLowerCase().includes(barcode.toLowerCase()))

        if (matchByName) {
          addToCart(matchByName)
          toast.success("Producto agregado", `${matchByName.name} x1`)
        } else {
          toast.warning("Producto no encontrado", `Código: ${barcode}`, {
            label: "Crear producto con este código",
            onClick: () => router.push(`/dashboard/productos?new_barcode=${encodeURIComponent(barcode)}`),
          })
        }
      }
      refocus()
    },
    [products, toast, router],
  )

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

  // El foco vuelve al buscador despues de cada accion (solo escritorio: en
  // celular abriria el teclado cada vez).
  useEffect(() => {
    if (showPayment || showReceipt || showMobileCart) return
    if (typeof window !== "undefined" && window.innerWidth >= 1024) searchInputRef.current?.focus()
  }, [cart, showPayment, showReceipt, showMobileCart])

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
      setUserRole("employee")
      setEmployeeId(employeeData.id)
      setEmployeeName(employeeData.name || "")
      setKioskoId(employeeData.kiosko_id)
      loadKioskoInfo(employeeData.kiosko_id)
      loadProducts(employeeData.kiosko_id)
      loadPromotions(employeeData.kiosko_id)
      loadOpenRegister(employeeData.kiosko_id)
    } else {
      const { data: kioscos } = await supabase
        .from("kioscos")
        .select("id, name, location")
        .eq("owner_id", user.id)
        .limit(1)

      if (kioscos && kioscos.length > 0) {
        setUserRole("owner")
        setKioskoId(kioscos[0].id)
        setKioskoName(kioscos[0].name || "ATLAS ONE")
        setKioskoAddress(kioscos[0].location || "")
        loadProducts(kioscos[0].id)
        loadPromotions(kioscos[0].id)
        loadOpenRegister(kioscos[0].id)
      } else {
        setIsLoading(false)
      }
    }
  }

  const loadPromotions = async (kiosko_id: string) => {
    const { data, error } = await supabase
      .from("promotions")
      .select("id, name, price, promotion_items(product_id, quantity)")
      .eq("kiosko_id", kiosko_id)
      .order("name")

    if (error) {
      console.error("[v0] Error loading promotions:", error)
      return
    }

    setPromotions(
      (data || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        items: (p.promotion_items || []).map((it: any) => ({ product_id: it.product_id, quantity: it.quantity })),
      })),
    )
  }

  // Caja abierta del kiosko (una sola por vez). Sin caja abierta no se cobra:
  // la UI pide abrirla y register_sale tambien lo rechaza (scripts/210).
  const loadOpenRegister = async (kiosko_id: string) => {
    const cacheKey = `atlas.cache.openRegister.${kiosko_id}.v1`
    try {
      const { data, error } = await supabase
        .from("cash_registers")
        .select("id")
        .eq("kiosko_id", kiosko_id)
        .eq("status", "open")
        .order("opened_at", { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      setOpenRegisterId(data?.id ?? null)
      window.localStorage.setItem(cacheKey, data?.id ?? "")
    } catch {
      // Sin conexion: se usa la ultima caja conocida para poder seguir vendiendo.
      const cached = window.localStorage.getItem(cacheKey)
      if (cached) setOpenRegisterId(cached)
    }
  }

  const requestCheckout = () => {
    if (!openRegisterId) {
      setShowMobileCart(false)
      setShowOpenCash(true)
      return
    }
    setShowMobileCart(false)
    setShowPayment(true)
  }

  const handleOpenCashAndContinue = async () => {
    if (!kioskoId || openingCash) return
    setOpeningCash(true)
    try {
      // Otra pestana o usuario pudo haberla abierto: si ya hay una, se usa esa.
      const { data: existing } = await supabase
        .from("cash_registers")
        .select("id")
        .eq("kiosko_id", kioskoId)
        .eq("status", "open")
        .order("opened_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      let registerId: string | null = existing?.id ?? null
      if (!registerId) {
        const { data, error } = await supabase
          .from("cash_registers")
          .insert({
            kiosko_id: kioskoId,
            employee_id: employeeId,
            opening_balance: Number(openCashBalance) || 0,
            status: "open",
          })
          .select("id")
          .single()
        if (error) throw error
        registerId = data.id
      }

      setOpenRegisterId(registerId)
      window.localStorage.setItem(`atlas.cache.openRegister.${kioskoId}.v1`, registerId ?? "")
      setShowOpenCash(false)
      setOpenCashBalance("")
      setShowPayment(true)
    } catch (error) {
      console.error("[v0] Error opening cash register:", error)
      toast.error("No se pudo abrir la caja", (error as any)?.message || "Intentá nuevamente en unos segundos")
    } finally {
      setOpeningCash(false)
    }
  }

  const loadKioskoInfo = async (kiosko_id: string) => {
    const { data } = await supabase.from("kioscos").select("name, location").eq("id", kiosko_id).single()

    if (data) {
      setKioskoName(data.name || "ATLAS ONE")
      setKioskoAddress(data.location || "")
    }
  }

  const loadProducts = useCallback(
    async (kiosko_id: string) => {
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
            barcode: p.barcode,
            sku: p.sku,
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
    },
    [supabase, toast],
  )

  const loadArcaConfig = useCallback(
    async (kiosko_id: string) => {
      try {
        const { data: config, error } = await supabase
          .from("integration_configs")
          .select("arca_enabled, arca_cuit, arca_certificate, arca_private_key, arca_environment")
          .eq("kiosko_id", kiosko_id)
          .maybeSingle()

        if (error) {
          console.error("[ARCA] No se pudo cargar la config:", error)
          setArcaStatus({ ready: false, reason: "No pudimos verificar ARCA. Revisa Integraciones." })
          return
        }

        if (!config?.arca_enabled) {
          setArcaStatus({ ready: false, reason: "Activa ARCA en Integraciones para emitir factura." })
          return
        }

        if (!config.arca_cuit || !config.arca_certificate || !config.arca_private_key) {
          setArcaStatus({
            ready: false,
            reason: "Falta CUIT, certificado o clave privada en ARCA.",
          })
          return
        }

        setArcaStatus({ ready: true, environment: config.arca_environment || "testing" })
      } catch (err) {
        console.error("[ARCA] Error cargando config:", err)
        setArcaStatus({ ready: false, reason: "No pudimos verificar ARCA. Intenta de nuevo." })
      }
    },
    [supabase],
  )

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
    if (kioskoId) {
      loadArcaConfig(kioskoId)
    }
  }, [kioskoId, loadArcaConfig])

  useEffect(() => {
    syncOfflineSales()
  }, [kioskoId, syncOfflineSales])

  // Una promocion se vende como si fuera "un producto mas" del POS: se
  // deriva de products + promotions en cada render (no se persiste como
  // producto) para que el precio/stock de sus componentes este siempre al
  // dia. El stock disponible de la promo es cuantas veces se puede armar el
  // combo con el stock actual de cada componente; el precio de cada
  // componente se prorratea del precio de la promo segun su peso en el
  // precio normal, para que register_sale descuente stock real sin tocar
  // esa funcion (ver buildSaleItems).
  const promotionProducts = useMemo(
    () =>
      promotions
    .map((promo) => {
      const components = promo.items
        .map((it) => {
          const p = products.find((pr) => pr.id === it.product_id)
          if (!p) return null
          return { productId: p.id, productName: p.name, quantity: it.quantity, price: p.price, stock: p.stock }
        })
        .filter((c): c is NonNullable<typeof c> => c !== null)

      if (components.length === 0) return null

      const availableStock = Math.min(...components.map((c) => Math.floor(c.stock / c.quantity)))
      const normalTotal = components.reduce((sum, c) => sum + c.price * c.quantity, 0)
      const promotionComponents = components.map((c) => ({
        productId: c.productId,
        productName: c.productName,
        quantity: c.quantity,
        unitPrice:
          normalTotal > 0
            ? ((c.price * c.quantity) / normalTotal) * (promo.price / c.quantity)
            : promo.price / components.length / c.quantity,
      }))

      return {
        id: promo.id,
        name: promo.name,
        category: "Promociones",
        price: promo.price,
        stock: Math.max(0, availableStock),
        status: availableStock > 0 ? "active" : "low_stock",
        isPromotion: true,
        promotionComponents,
      }
    })
    .filter((p): p is NonNullable<typeof p> => p !== null),
    [promotions, products],
  )

  const sellableProducts = useMemo(() => [...products, ...promotionProducts], [products, promotionProducts])

  // Se derivan de los productos reales del kiosko (no de una lista fija) para
  // que los tabs del POS siempre coincidan con las categorías que existen de
  // verdad, incluso si difieren de las categorías "canónicas" sugeridas al
  // dar de alta un producto.
  const categories = useMemo(
    () => ["all", ...Array.from(new Set(sellableProducts.map((p) => p.category).filter(Boolean)))],
    [sellableProducts],
  )

  // Debounce: filtrar 12.000+ productos en cada tecla tildaba el buscador.
  useEffect(() => {
    const id = setTimeout(() => setSearchQuery(searchInput), 300)
    return () => clearTimeout(id)
  }, [searchInput])

  // Volver a la primera página cada vez que cambia el filtro.
  useEffect(() => {
    setVisibleCount(PRODUCTS_PAGE_SIZE)
  }, [searchQuery, selectedCategory])

  // Memoizado: con miles de productos, refiltrar en cada render (y cada tecla
  // renderiza la pagina) tildaba el buscador.
  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase()
    return sellableProducts.filter((p) => {
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.barcode && String(p.barcode).includes(searchQuery.trim()))
      const matchesCategory = selectedCategory === "all" || p.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [sellableProducts, searchQuery, selectedCategory])

  // Nunca renderizar el catálogo entero de una: con miles de SKUs eso es lo
  // que hacía que la grilla del POS se sintiera trabada al tipear o scrollear.
  const visibleProducts = filteredProducts.slice(0, visibleCount)
  const hasMoreProducts = filteredProducts.length > visibleProducts.length

  const addToCart = (product: any) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id)
      if (existing) {
        if (existing.quantity >= product.stock) return prev
        return prev.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item))
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          stock: product.stock,
          isPromotion: product.isPromotion,
          promotionComponents: product.promotionComponents,
        },
      ]
    })
    if (window.innerWidth < 1024) {
      // Don't auto-show, just update the count
    }
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

  // El precio de cada producto ya incluye IVA (precio de góndola / consumidor final).
  // El total a cobrar es el subtotal; el IVA se desglosa solo a fines informativos/fiscales.
  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0)
  const total = subtotal
  const tax = total - total / 1.21

  // Una promocion no es una fila de products: al armar los items reales de
  // la venta (y al descontar stock localmente) se descompone en sus
  // productos componentes, para que tanto register_sale como el stock
  // offline descuenten el producto real, no la promo.
  const buildSaleItems = (items: CartItem[]) => {
    const out: { productId: string; productName: string; quantity: number; unitPrice: number }[] = []
    for (const item of items) {
      if (item.isPromotion && item.promotionComponents) {
        for (const comp of item.promotionComponents) {
          out.push({
            productId: comp.productId,
            productName: comp.productName,
            quantity: comp.quantity * item.quantity,
            unitPrice: comp.unitPrice,
          })
        }
      } else {
        out.push({ productId: item.id, productName: item.name, quantity: item.quantity, unitPrice: item.price })
      }
    }
    return out
  }

  const applyCartToProducts = (currentProducts: any[], items: CartItem[]) => {
    const saleItems = buildSaleItems(items)
    const decrementByProduct = new Map<string, number>()
    for (const si of saleItems) {
      decrementByProduct.set(si.productId, (decrementByProduct.get(si.productId) || 0) + si.quantity)
    }

    const updated = currentProducts
      .map((p) => {
        const dec = decrementByProduct.get(p.id)
        if (!dec) return p
        const nextStock = Math.max(0, Number(p.stock ?? 0) - dec)
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
    if (!openRegisterId) {
      setShowPayment(false)
      setShowOpenCash(true)
      return
    }
    try {
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
          cashRegisterId: openRegisterId,
          items: buildSaleItems(cart).map((si) => ({
            productId: si.productId,
            quantity: si.quantity,
            unitPrice: si.unitPrice,
          })),
        })

        setProducts((prev) => applyCartToProducts(prev, cart))
        toast.warning("Venta guardada offline", "Se sincronizará al reconectar")

        setLastSale({ items: cart, total, method, offline: true, saleNumber })
        setShowPayment(false)
        setShowReceipt(true)
        setCart([])
        setShowMobileCart(false)
        return
      }

      // Registro atómico e idempotente en el servidor: cabecera + items +
      // descuento de stock en una sola transacción (ver register_sale).
      const { data: rpcData, error: saleError } = await supabase.rpc("register_sale", {
        p_sale: {
          kiosko_id: kioskoId,
          employee_id: employeeId,
          sale_number: saleNumber,
          total_amount: total,
          payment_method: method,
          cash_register_id: openRegisterId,
          items: buildSaleItems(cart).map((si) => ({
            product_id: si.productId,
            product_name: si.productName,
            quantity: si.quantity,
            unit_price: si.unitPrice, // Precio histórico al momento de la venta (prorrateado si viene de una promo)
          })),
        },
      })

      if (saleError) throw saleError
      const saleData = { id: rpcData?.sale_id as string }

      // Send Telegram notification (async, don't wait)
      sendSaleNotification(
        kioskoId,
        saleNumber,
        total,
        method,
        cart.map(item => ({ name: item.name, quantity: item.quantity, price: item.price }))
      )

      setLastSale({ items: cart, total, method, saleId: saleData.id, saleNumber })
      setShowPayment(false)
      setShowReceipt(true)
      setCart([])
      setShowMobileCart(false)

      loadProducts(kioskoId)
    } catch (error) {
      console.error("[v0] Error saving sale:", error)

      const message = (error as any)?.message ? String((error as any).message) : ""

      if (message.toLowerCase().includes("caja abierta")) {
        // La caja se cerro (otra pestana/usuario) mientras se armaba la venta.
        setOpenRegisterId(null)
        setShowPayment(false)
        setShowOpenCash(true)
        toast.error("La caja está cerrada", "Abrí la caja para registrar la venta")
        return
      }

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
          cashRegisterId: openRegisterId,
          items: buildSaleItems(cart).map((si) => ({
            productId: si.productId,
            quantity: si.quantity,
            unitPrice: si.unitPrice,
          })),
        })

        setProducts((prev) => applyCartToProducts(prev, cart))
        toast.warning("Venta guardada offline", "Se sincronizará al reconectar")

        setLastSale({ items: cart, total, method, offline: true, saleNumber })
        setShowPayment(false)
        setShowReceipt(true)
        setCart([])
        setShowMobileCart(false)
        return
      }

      toast.error("Error al procesar la venta", message || "Intentá nuevamente en unos segundos")
    }
  }

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-120px)] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!permsLoading && !permissions.can_sell) {
    return (
      <div className="h-[calc(100vh-120px)] flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <AccessDenied
            title="No tenés permiso para vender"
            message="Pedile a tu dueño de kiosco que te habilite 'Realizar ventas' desde Empleados."
          />
        </div>
      </div>
    )
  }

  const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0)

  return (
    <>
      <div className="lg:h-[calc(100vh-120px)] flex flex-col lg:flex-row gap-4 lg:gap-6">
        {/* Left side - Products */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Scanner status - hidden on mobile (we use camera scanner instead) */}
          <div className="hidden lg:flex items-center gap-3 mb-4 p-3 rounded-lg bg-[#0a0f1a]/50 border border-cyan-500/10">
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
                  bluetoothDevice ? "border-green-500/30 text-green-400" : "border-cyan-500/30 text-cyan-400"
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
          <div className="flex items-center gap-2 lg:gap-4 mb-4 lg:mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Buscar productos o escanear..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10 bg-[#0a0f1a] border-cyan-500/10 text-white placeholder:text-gray-500 h-11 lg:h-10 text-base lg:text-sm"
              />
            </div>
            {/* Desktop only buttons */}
            <Button
              variant="outline"
              onClick={() => (isListening ? stopListening() : startListening())}
              className={cn(
                "gap-2 bg-transparent hidden lg:flex",
                isListening
                  ? "border-green-500/30 text-green-400 hover:bg-green-500/10"
                  : "border-cyan-500/20 text-gray-400 hover:text-white",
              )}
            >
              <Barcode className="w-4 h-4" />
              {isListening ? "Escuchando..." : "Escanear"}
            </Button>
            <Link href="/dashboard/ventas/historial">
              <Button
                variant="outline"
                className="border-cyan-500/20 text-gray-400 hover:text-white bg-transparent gap-2 h-11 lg:h-10"
              >
                <History className="w-4 h-4" />
                <span className="hidden sm:inline">Historial</span>
              </Button>
            </Link>
          </div>

          {/* Categories - horizontal scroll on mobile */}
          <div className="flex gap-2 mb-4 lg:mb-6 overflow-x-auto pb-2 hide-scrollbar -mx-4 px-4 lg:mx-0 lg:px-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "px-4 py-2.5 lg:py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors touch-target",
                  selectedCategory === cat
                    ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                    : "bg-[#0a0f1a] text-gray-400 border border-cyan-500/10 hover:text-white active:bg-white/5",
                )}
              >
                {cat === "all" ? "Todos" : cat}
              </button>
            ))}
          </div>

          {/* Products grid - scrollable on mobile */}
          <div className="flex-1 min-h-0 overflow-y-auto lg:overflow-visible">
            <ProductGrid products={visibleProducts} onAddToCart={addToCart} />
            {hasMoreProducts && (
              <div className="flex justify-center py-6">
                <Button
                  variant="outline"
                  onClick={() => setVisibleCount((prev) => prev + PRODUCTS_PAGE_SIZE)}
                  className="border-cyan-500/20 text-gray-400 hover:text-white bg-transparent"
                >
                  Mostrar más ({filteredProducts.length - visibleProducts.length} restantes)
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Right side - Cart (desktop only, hidden on mobile) */}
        <div className="hidden lg:block">
          <Cart
            items={cart}
            subtotal={subtotal}
            tax={tax}
            total={total}
            onUpdateQuantity={updateQuantity}
            onRemove={removeFromCart}
            onClear={clearCart}
            onCheckout={requestCheckout}
          />
        </div>
      </div>

      {cart.length > 0 && (
        <button
          onClick={() => setShowMobileCart(true)}
          className="fixed bottom-24 right-4 z-40 lg:hidden flex items-center gap-2 px-4 py-3 rounded-full shadow-lg fab haptic-tap"
          style={{
            backgroundColor: config.primary,
            boxShadow: `0 4px 20px ${config.primary}50`,
          }}
        >
          <ShoppingCart className="w-5 h-5 text-black" />
          <span className="text-black font-bold">{cartItemCount}</span>
          <span className="text-black font-semibold">
            ${total.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
          </span>
        </button>
      )}

      {showMobileCart && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowMobileCart(false)} />

          {/* Cart Sheet */}
          <div className="absolute bottom-0 left-0 right-0 bg-[#0a0f1a] rounded-t-3xl max-h-[85vh] flex flex-col slide-up safe-area-bottom">
            {/* Handle */}
            <div className="flex justify-center py-3">
              <div className="w-10 h-1 bg-gray-600 rounded-full" />
            </div>

            {/* Header */}
            <div
              className="flex items-center justify-between px-4 pb-3 border-b"
              style={{ borderColor: config.border }}
            >
              <h2 className="text-lg font-semibold text-white">Carrito ({cartItemCount})</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowMobileCart(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Cart Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 momentum-scroll">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-[#030712] border"
                  style={{ borderColor: config.border }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{item.name}</p>
                    <p className="text-sm" style={{ color: config.primary }}>
                      ${item.price.toLocaleString("es-AR")} c/u
                    </p>
                  </div>

                  {/* Quantity controls */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white bg-white/10 active:bg-white/20"
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-white font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      disabled={item.quantity >= item.stock}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white bg-white/10 active:bg-white/20 disabled:opacity-50"
                    >
                      +
                    </button>
                  </div>

                  <p className="text-white font-semibold w-20 text-right">
                    ${(item.price * item.quantity).toLocaleString("es-AR")}
                  </p>
                </div>
              ))}
            </div>

            {/* Footer with totals and checkout */}
            <div className="p-4 border-t space-y-3" style={{ borderColor: config.border }}>
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-400">
                  <span>Subtotal</span>
                  <span>${subtotal.toLocaleString("es-AR", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-400">
                  <span>IVA (21%)</span>
                  <span>${tax.toLocaleString("es-AR", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-white">
                  <span>Total</span>
                  <span style={{ color: config.primary }}>
                    ${total.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={clearCart}
                  className="flex-1 h-12 border-red-500/30 text-red-400 hover:bg-red-500/10 bg-transparent"
                >
                  Vaciar
                </Button>
                <Button
                  onClick={requestCheckout}
                  className="flex-1 h-12 text-black font-semibold"
                  style={{ backgroundColor: config.primary }}
                >
                  Cobrar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sin caja abierta no se cobra */}
      {showOpenCash && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a0f1a] border border-cyan-500/20 rounded-2xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-xl font-bold text-white">Abrí la caja para empezar a vender</h2>
            {permissions.can_open_register ? (
              <>
                <p className="text-sm text-gray-400">
                  Ingresá con cuánto efectivo arrancás el turno. Después seguís con el cobro.
                </p>
                <div className="space-y-2">
                  <label className="text-sm text-gray-300">Saldo inicial</label>
                  <Input
                    type="number"
                    min="0"
                    autoFocus
                    value={openCashBalance}
                    onChange={(e) => setOpenCashBalance(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleOpenCashAndContinue()
                    }}
                    placeholder="$0"
                    className="bg-[#0d1424] border-cyan-500/20 text-white text-xl text-center py-6"
                  />
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-400">
                No hay ninguna caja abierta y tu usuario no tiene permiso para abrirla. Pedile a tu encargado o al
                dueño que abra la caja desde Caja.
              </p>
            )}
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowOpenCash(false)}
                disabled={openingCash}
                className="border-cyan-500/20 text-gray-300 bg-transparent"
              >
                Cancelar
              </Button>
              {permissions.can_open_register && (
                <Button
                  onClick={handleOpenCashAndContinue}
                  disabled={openingCash}
                  className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold"
                >
                  {openingCash ? "Abriendo..." : "Abrir caja y continuar"}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

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
    </>
  )
}
