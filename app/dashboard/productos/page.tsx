"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ProductModal, type ProductLot } from "@/components/products/product-modal"
import { ProductDetailModal } from "@/components/products/product-detail-modal"
import { useRouter, useSearchParams } from "next/navigation"
import { CSVImportModal, type CSVProduct } from "@/components/products/csv-import-modal"
import { PriceAdjustmentModal } from "@/components/products/price-adjustment-modal"
import { CameraScanner } from "@/components/mobile/camera-scanner"
import { useScanner } from "@/lib/hooks/use-scanner"
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Package,
  AlertTriangle,
  Upload,
  RefreshCw,
  Percent,
  CheckSquare,
  Square,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Candy,
  Cigarette,
  Droplet,
  Beer,
  ScanLine,
  RotateCcw,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/toast-provider"
import { useEmployeePermissions } from "@/lib/hooks/use-employee-permissions"
import { AccessDenied } from "@/components/ui/access-denied"

interface Product {
  id: string
  name: string
  sku?: string
  brand?: string
  variant?: string
  presentation?: string
  category: string
  subcategory?: string
  line?: string
  net_content?: number
  unit?: string
  cost: number
  cost_ex_vat?: number
  cost_inc_vat?: number
  vat_rate?: number
  price: number
  stock: number
  min_stock?: number
  max_stock?: number
  barcode?: string
  status: string
  kiosko_id?: string
  supplier?: string
  track_expiration?: boolean
  expiration_date?: string | null
  lots?: ProductLot[]
  is_active?: boolean
}

export default function ProductosPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [showCSVModal, setShowCSVModal] = useState(false)
  const [showPriceModal, setShowPriceModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [kioskoId, setKioskoId] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const PRODUCTS_PER_PAGE = 20

  const supabase = createClient()
  const toast = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [initialBarcode, setInitialBarcode] = useState<string | undefined>(undefined)
  const { permissions, loading: permsLoading } = useEmployeePermissions()
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null)
  const [showLookupScanner, setShowLookupScanner] = useState(false)

  const fetchProducts = async (kiosko_id?: string) => {
    setLoading(true)
    const targetKioskoId = kiosko_id || kioskoId

    if (!targetKioskoId) {
      setLoading(false)
      return
    }

    // Load ALL products - Supabase limits to 1000 by default, use range to get more
    let allProducts: any[] = []
    let from = 0
    const pageSize = 1000
    let hasMore = true

    while (hasMore) {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("kiosko_id", targetKioskoId)
        .order("name")
        .range(from, from + pageSize - 1)

      if (error) {
        console.error("Error fetching products:", error)
        break
      }

      if (data && data.length > 0) {
        allProducts = [...allProducts, ...data]
        from += pageSize
        hasMore = data.length === pageSize
      } else {
        hasMore = false
      }
    }

    const data = allProducts

    // Map database fields to component fields
    const mappedProducts = data.map((p: any) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      brand: p.brand,
      variant: p.variant,
      presentation: p.presentation,
      category: p.category || "Sin categoría",
      subcategory: p.subcategory,
      line: p.variant,
      net_content: p.net_content,
      unit: p.unit,
      cost: p.cost || 0,
      cost_ex_vat: p.cost_ex_vat,
      cost_inc_vat: p.cost_inc_vat,
      vat_rate: p.vat_rate,
      price: p.price || 0,
      stock: p.stock_quantity || 0,
      min_stock: p.min_stock_level,
      max_stock: p.max_stock_level,
      barcode: p.barcode,
      status: p.stock_quantity <= 0 ? "inactive" : p.stock_quantity <= 10 ? "low_stock" : "active",
      kiosko_id: p.kiosko_id,
      supplier: p.supplier,
      track_expiration: p.track_expiration,
      expiration_date: p.expiration_date,
      is_active: p.is_active ?? true,
    }))
    setProducts(mappedProducts)
    setLoading(false)
  }

  useEffect(() => {
    const loadUserAndProducts = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      // Check if user is an employee
      const { data: employeeData } = await supabase
        .from("employees")
        .select("id, kiosko_id")
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle()

      if (employeeData) {
        setKioskoId(employeeData.kiosko_id)
        fetchProducts(employeeData.kiosko_id)
      } else {
        // User is owner
        const { data: kioscos } = await supabase.from("kioscos").select("id").eq("owner_id", user.id).limit(1)

        if (kioscos && kioscos.length > 0) {
          setKioskoId(kioscos[0].id)
          fetchProducts(kioscos[0].id)
        } else {
          setLoading(false)
        }
      }
    }
    loadUserAndProducts()
  }, [])

  const categories = ["all", ...new Set(products.map((p) => p.category))]

  const subcategories =
    selectedCategory && selectedCategory !== "all"
      ? Array.from(
          new Set(products.filter((p) => p.category === selectedCategory && p.subcategory).map((p) => p.subcategory!)),
        )
      : []

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "all" || p.category === selectedCategory
    const matchesSubcategory = !selectedSubcategory || p.subcategory === selectedSubcategory
    return matchesSearch && matchesCategory && matchesSubcategory
  })

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE)
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE,
  )

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedCategory, selectedSubcategory])

  // Auto-open creation form when arriving with an unrecognized scanned barcode
  useEffect(() => {
    const newBarcode = searchParams.get("new_barcode")
    if (newBarcode) {
      setInitialBarcode(newBarcode)
      setEditingProduct(null)
      setShowModal(true)
    }
  }, [searchParams])

  const handleEdit = async (product: Product) => {
    const { data: lotsData } = await supabase
      .from("product_lots")
      .select("id, lot_number, quantity, expiration_date")
      .eq("product_id", product.id)
      .order("expiration_date")

    setEditingProduct({ ...product, lots: lotsData || [] })
    setShowModal(true)
  }

  // Escaneo de consulta (pistolita o camara): busca en los productos ya
  // cargados de este kiosko y abre la cajita de detalle. Si no existe,
  // ofrece crearlo con el codigo precargado en vez de dejar el escaneo sin
  // respuesta.
  const handleScanLookup = (code: string) => {
    setShowLookupScanner(false)
    const found = products.find((p) => p.barcode === code || p.sku === code || p.id === code)
    if (found) {
      setScannedProduct(found)
      setShowDetailModal(true)
    } else {
      toast.warning("Producto no encontrado", `Código ${code}: no está cargado todavía`)
      setInitialBarcode(code)
      setEditingProduct(null)
      setShowModal(true)
    }
  }

  const { startListening: startLookupListening, stopListening: stopLookupListening } = useScanner({
    onScan: handleScanLookup,
    minLength: 6,
  })

  useEffect(() => {
    // Solo escucha la pistolita cuando estamos en la lista (no mientras hay
    // otro modal abierto, para no pisar el escaneo de esos formularios).
    if (!showModal && !showCSVModal && !showPriceModal && !showDetailModal) {
      startLookupListening()
    } else {
      stopLookupListening()
    }
    return () => stopLookupListening()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showModal, showCSVModal, showPriceModal, showDetailModal])

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("products").delete().eq("id", id)
    if (!error) {
      setProducts((prev) => prev.filter((p) => p.id !== id))
      return
    }

    console.error("[productos] Error al borrar:", error)
    // Tiene ventas, compras o movimientos de stock asociados: borrarlo rompería ese
    // historial, por eso la base lo bloquea. La alternativa real es desactivarlo: deja
    // de poder venderse (no aparece en el punto de venta) pero no se pierde nada.
    if (error.code === "23503") {
      toast.warning("No se puede borrar: tiene ventas o movimientos asociados", "Borrarlo perdería ese historial.", {
        label: "Desactivarlo en vez de borrar",
        onClick: () => handleDeactivate(id),
      })
    } else {
      toast.error("No se pudo borrar el producto", error.message)
    }
  }

  const handleDeactivate = async (id: string) => {
    const { error } = await supabase.from("products").update({ is_active: false }).eq("id", id)
    if (error) {
      toast.error("No se pudo desactivar el producto", error.message)
      return
    }
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, is_active: false } : p)))
    toast.success("Producto desactivado", "Ya no va a aparecer en el punto de venta")
  }

  const handleReactivate = async (id: string) => {
    const { error } = await supabase.from("products").update({ is_active: true }).eq("id", id)
    if (error) {
      toast.error("No se pudo reactivar el producto", error.message)
      return
    }
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, is_active: true } : p)))
    toast.success("Producto reactivado")
  }

  const contributeToBarcodeCatalog = async (product: Omit<Product, "id"> & { id?: string }) => {
    if (!product.barcode || /^Producto \d+$/.test(product.name)) return

    await supabase
      .from("barcode_catalog")
      .upsert(
        { barcode: product.barcode, name: product.name, category: product.category },
        { onConflict: "barcode", ignoreDuplicates: true },
      )
  }

  const saveLots = async (productId: string, lots: ProductLot[]) => {
    await supabase.from("product_lots").delete().eq("product_id", productId)
    if (lots.length === 0) return
    await supabase.from("product_lots").insert(
      lots
        .filter((l) => l.lot_number || l.quantity)
        .map((l) => ({
          product_id: productId,
          kiosko_id: kioskoId,
          lot_number: l.lot_number || null,
          quantity: l.quantity || 0,
          expiration_date: l.expiration_date || null,
        })),
    )
  }

  const handleSave = async (product: Omit<Product, "id"> & { id?: string }, lots: ProductLot[] = []) => {
    if (!kioskoId) {
      toast.error("Error", "No hay kiosko seleccionado")
      return
    }

    contributeToBarcodeCatalog(product)

    const lotsTotal = lots.reduce((sum, l) => sum + (Number(l.quantity) || 0), 0)
    const finalStock = lots.length > 0 ? lotsTotal : product.stock

    const payload = {
      name: product.name,
      sku: product.sku || null,
      brand: product.brand || null,
      variant: product.variant || null,
      presentation: product.presentation || null,
      category: product.category,
      subcategory: product.subcategory || null,
      supplier: product.supplier || null,
      net_content: product.net_content || null,
      unit: product.unit || null,
      cost: product.cost,
      cost_ex_vat: product.cost_ex_vat || null,
      cost_inc_vat: product.cost_inc_vat || null,
      vat_rate: product.vat_rate ?? null,
      price: product.price,
      stock_quantity: finalStock,
      min_stock_level: product.min_stock ?? null,
      max_stock_level: product.max_stock ?? null,
      barcode: product.barcode || null,
      track_expiration: product.track_expiration || false,
      expiration_date: product.expiration_date || null,
    }

    if (editingProduct) {
      const { error } = await supabase
        .from("products")
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", editingProduct.id)

      if (!error) {
        await saveLots(editingProduct.id, lots)
        setProducts((prev) =>
          prev.map((p) =>
            p.id === editingProduct.id ? ({ ...product, id: editingProduct.id, stock: finalStock } as Product) : p,
          ),
        )
        toast.success("Producto actualizado", `"${product.name}" fue actualizado correctamente`)
      } else {
        toast.error("Error al guardar", error.message)
      }
    } else {
      // Si ya existe un producto con este código de barras en este kiosko, no se crea uno
      // nuevo duplicado: se suma el stock cargado al que ya existía.
      const dup = product.barcode ? products.find((p) => p.barcode && p.barcode === product.barcode) : undefined
      if (dup) {
        const newStock = dup.stock + finalStock
        const { error: dupError } = await supabase
          .from("products")
          .update({ stock_quantity: newStock, updated_at: new Date().toISOString() })
          .eq("id", dup.id)

        if (dupError) {
          toast.error("Error al guardar", dupError.message)
        } else {
          setProducts((prev) => prev.map((p) => (p.id === dup.id ? { ...p, stock: newStock } : p)))
          toast.warning(
            "Ya existía un producto con ese código",
            `Se sumaron ${finalStock} unidades a "${dup.name}" (ahora tiene ${newStock}) en vez de crear uno nuevo.`,
          )
        }
        setShowModal(false)
        setEditingProduct(null)
        return
      }

      const { data, error } = await supabase
        .from("products")
        .insert({ ...payload, kiosko_id: kioskoId, is_active: true })
        .select()
        .single()

      if (!error && data) {
        await saveLots(data.id, lots)
        const mappedProduct: Product = {
          id: data.id,
          name: data.name,
          sku: data.sku,
          brand: data.brand,
          variant: data.variant,
          presentation: data.presentation,
          category: data.category || "Sin categoría",
          subcategory: data.subcategory,
          line: data.variant,
          net_content: data.net_content,
          unit: data.unit,
          barcode: data.barcode,
          cost: data.cost || 0,
          cost_ex_vat: data.cost_ex_vat,
          cost_inc_vat: data.cost_inc_vat,
          vat_rate: data.vat_rate,
          price: data.price || 0,
          stock: data.stock_quantity || 0,
          min_stock: data.min_stock_level,
          max_stock: data.max_stock_level,
          status: data.stock_quantity <= 10 ? "low_stock" : "active",
          kiosko_id: data.kiosko_id,
          supplier: data.supplier,
          track_expiration: data.track_expiration,
          expiration_date: data.expiration_date,
        }
        setProducts((prev) => [...prev, mappedProduct])
        toast.success("Producto creado", `"${product.name}" fue creado correctamente`)
      } else if (error) {
        toast.error("Error al guardar", error.message)
      }
    }
    setShowModal(false)
    setEditingProduct(null)
  }

  const handleQuickAddStock = async (product: Product, quantity: number) => {
    const newStock = product.stock + quantity
    const { error } = await supabase
      .from("products")
      .update({ stock_quantity: newStock, updated_at: new Date().toISOString() })
      .eq("id", product.id)

    if (!error) {
      setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, stock: newStock } : p)))
      toast.success("Stock actualizado", `${product.name}: ${product.stock} → ${newStock} unidades`)
    } else {
      toast.error("Error al actualizar stock", error.message)
    }
  }

  const handleStartReception = (product: Product) => {
    router.push(`/dashboard/stock/recepcion-mercaderia?product_id=${product.id}`)
  }

  const handleCSVImport = async (csvProducts: CSVProduct[]) => {
    if (!kioskoId) {
      toast.error("Error", "No hay kiosko seleccionado")
      return
    }

    setSyncing(true)

    // Process in batches for large imports
    const BATCH_SIZE = 100
    let importedCount = 0
    let lastError: string | null = null

    for (let i = 0; i < csvProducts.length; i += BATCH_SIZE) {
      const batch = csvProducts.slice(i, i + BATCH_SIZE)

      const productsToUpsert = batch.map((p) => ({
        kiosko_id: kioskoId,
        sku: p.sku,
        name: p.name,
        brand: p.brand || null,
        variant: p.variant || null,
        presentation: p.presentation || null,
        category: p.category || "Sin categoría",
        subcategory: p.subcategory || null,
        net_content: p.net_content || null,
        unit: p.unit || null,
        barcode: p.barcode || null,
        cost: p.cost_inc_vat || p.cost_ex_vat || 0,
        cost_ex_vat: p.cost_ex_vat || null,
        cost_inc_vat: p.cost_inc_vat || null,
        price: p.sale_price,
        stock_quantity: p.stock || 0,
        is_active: true,
      }))

      // Use upsert with SKU as the conflict key
      const { data, error } = await supabase
        .from("products")
        .upsert(productsToUpsert, {
          onConflict: "kiosko_id,sku",
          ignoreDuplicates: false,
        })
        .select()

      if (error) {
        console.error("[v0] CSV import batch error:", error)
        lastError = error.message
      } else if (data) {
        importedCount += data.length
      }

      // Contribuye al catálogo compartido de códigos de barras (mismo criterio que al
      // guardar un producto a mano): así la próxima vez que alguien escanee alguno de
      // estos códigos, ya sale reconocido, aunque lo hayan cargado por CSV.
      const catalogRows = batch
        .filter((p) => p.barcode && p.name && !/^Producto \d+$/.test(p.name))
        .map((p) => ({ barcode: p.barcode, name: p.name, category: p.category || null }))
      if (catalogRows.length > 0) {
        await supabase
          .from("barcode_catalog")
          .upsert(catalogRows, { onConflict: "barcode", ignoreDuplicates: true })
      }
    }

    // Refresh full product list
    await fetchProducts()
    setSyncing(false)

    if (importedCount > 0 && !lastError) {
      toast.success("Productos importados", `Se cargaron ${importedCount} productos correctamente`)
    } else if (importedCount > 0 && lastError) {
      toast.warning("Importación parcial", `Se cargaron ${importedCount} productos, pero hubo errores: ${lastError}`)
    } else {
      toast.error("Error al importar", lastError || "No se pudo importar ningún producto")
    }
  }

  // Handle price adjustments
  const handlePriceAdjustment = async (productIds: string[], newPrices: Record<string, number>) => {
    setSyncing(true)

    try {
      // Update prices in batches of 50 for better performance
      const BATCH_SIZE = 50

      for (let i = 0; i < productIds.length; i += BATCH_SIZE) {
        const batchIds = productIds.slice(i, i + BATCH_SIZE)

        // Use Promise.all for parallel updates within each batch
        await Promise.all(
          batchIds.map((id) =>
            supabase
              .from("products")
              .update({
                price: newPrices[id],
                updated_at: new Date().toISOString(),
              })
              .eq("id", id),
          ),
        )
      }

      // Update local state
      setProducts((prev) => prev.map((p) => (productIds.includes(p.id) ? { ...p, price: newPrices[p.id] } : p)))

      setSelectedProducts([])
    } catch (error) {
      console.error("Error updating prices:", error)
      toast.error("Error al actualizar precios", "Intentá nuevamente en unos segundos")
    } finally {
      setSyncing(false)
    }
  }

  // Toggle product selection
  const toggleProductSelection = (id: string) => {
    setSelectedProducts((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]))
  }

  // Select all filtered products
  const toggleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([])
    } else {
      setSelectedProducts(filteredProducts.map((p) => p.id))
    }
  }

  const getCategoryIcon = (category: string) => {
    const lowerCategory = category.toLowerCase()
    if (lowerCategory.includes("bebida") && lowerCategory.includes("sin")) return Droplet
    if (lowerCategory.includes("alcohólica") || lowerCategory.includes("alcoholica")) return Beer
    if (lowerCategory.includes("conveniencia")) return Coffee
    if (lowerCategory.includes("golosina") || lowerCategory.includes("snack")) return Candy
    if (lowerCategory.includes("tabaco")) return Cigarette
    return Package
  }

  const getCategoryColor = (category: string) => {
    const lowerCategory = category.toLowerCase()
    if (lowerCategory.includes("bebida") && lowerCategory.includes("sin"))
      return "from-blue-500/30 to-cyan-500/20 border-blue-500/50 text-blue-400"
    if (lowerCategory.includes("alcohólica") || lowerCategory.includes("alcoholica"))
      return "from-amber-500/30 to-orange-500/20 border-amber-500/50 text-amber-400"
    if (lowerCategory.includes("conveniencia"))
      return "from-purple-500/30 to-pink-500/20 border-purple-500/50 text-purple-400"
    if (lowerCategory.includes("golosina") || lowerCategory.includes("snack"))
      return "from-pink-500/30 to-rose-500/20 border-pink-500/50 text-pink-400"
    if (lowerCategory.includes("tabaco")) return "from-gray-500/30 to-slate-500/20 border-gray-500/50 text-gray-400"
    return "from-primary/30 to-primary/20 border-primary/50 text-primary"
  }

  if (!permsLoading && !permissions.can_view_products) {
    return (
      <div className="space-y-6">
        <AccessDenied
          title="No tenés permiso para ver productos"
          message="Pedile a tu dueño de kiosco que te habilite 'Consultar productos' desde Empleados."
        />
      </div>
    )
  }

  const formatMoney = (n: number) => `$${Number(n || 0).toLocaleString("es-AR", { maximumFractionDigits: 0 })}`
  const lowStockCount = products.filter((p) => p.stock <= 10).length
  const inventoryValue = products.reduce((sum, p) => sum + (Number(p.cost) || 0) * (Number(p.stock) || 0), 0)
  const noCostCount = products.filter((p) => !(Number(p.cost) > 0)).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Productos</h1>
          <p className="text-muted-foreground text-sm">Gestiona tu catálogo de productos</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Button
            variant="outline"
            onClick={() => fetchProducts()}
            disabled={loading || syncing}
            className="border-primary/30 text-muted-foreground hover:text-foreground bg-transparent"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Sincronizar
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowLookupScanner(true)}
            className="border-primary/30 text-muted-foreground hover:text-foreground bg-transparent"
          >
            <ScanLine className="w-4 h-4 mr-2" />
            Buscar con scanner
          </Button>
          {permissions.can_manage_inventory && (
            <>
              <Button
                variant="outline"
                onClick={() => setShowCSVModal(true)}
                className="border-primary/30 text-muted-foreground hover:text-foreground"
              >
                <Upload className="w-4 h-4 mr-2" />
                Importar CSV
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowPriceModal(true)}
                disabled={products.length === 0}
                className="border-primary/30 text-muted-foreground hover:text-foreground"
              >
                <Percent className="w-4 h-4 mr-2" />
                Ajustar Precios
              </Button>
              <Button
                onClick={() => {
                  setEditingProduct(null)
                  setShowModal(true)
                }}
                className="bg-primary hover:bg-primary/80 text-primary-foreground font-semibold gap-2"
              >
                <Plus className="w-4 h-4" />
                Agregar Producto
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Resumen del catálogo */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <div className="rounded-xl border border-primary/10 bg-card p-4">
          <p className="text-xs text-muted-foreground">Productos</p>
          <p className="text-2xl font-bold text-foreground">{products.length}</p>
        </div>
        <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
          <p className="text-xs text-muted-foreground">Stock bajo o agotado</p>
          <p className="text-2xl font-bold text-yellow-400">{lowStockCount}</p>
        </div>
        <div className="rounded-xl border border-primary/10 bg-card p-4">
          <p className="text-xs text-muted-foreground">Valor del inventario (a costo)</p>
          <p className="text-2xl font-bold text-foreground truncate">{formatMoney(inventoryValue)}</p>
        </div>
        <div className={`rounded-xl border p-4 ${noCostCount > 0 ? "border-amber-500/30 bg-amber-500/10" : "border-primary/10 bg-card"}`}>
          <p className="text-xs text-muted-foreground">Sin costo cargado</p>
          <p className={`text-2xl font-bold ${noCostCount > 0 ? "text-amber-400" : "text-foreground"}`}>{noCostCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-primary/10 bg-card p-4 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px] max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar por nombre, marca o código..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background border-primary/10 text-foreground placeholder:text-muted-foreground"
            />
          </div>
          {selectedProducts.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/20 border border-primary/30">
              <CheckSquare className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary font-medium">
                {selectedProducts.length} seleccionado{selectedProducts.length !== 1 ? "s" : ""}
              </span>
              <button onClick={() => setSelectedProducts([])} className="ml-1 text-primary/70 hover:text-primary">
                ×
              </button>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Categorías</span>
            {selectedCategory !== "all" && (
              <button
                onClick={() => {
                  setSelectedCategory("all")
                  setSelectedSubcategory(null)
                }}
                className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                Limpiar filtros
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setSelectedCategory("all")
                setSelectedSubcategory(null)
              }}
              className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                selectedCategory === "all"
                  ? "bg-primary/20 text-primary border-primary/50"
                  : "bg-background text-muted-foreground border-primary/10 hover:text-foreground hover:border-primary/30"
              }`}
            >
              <Package className="w-4 h-4" />
              Todas
              <span className="rounded-full bg-primary/10 px-2 text-xs font-bold">{products.length}</span>
            </button>
            {categories
              .filter((cat) => cat !== "all")
              .map((cat) => {
                const Icon = getCategoryIcon(cat)
                const count = products.filter((p) => p.category === cat).length
                const isSelected = selectedCategory === cat

                return (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedCategory(cat)
                      setSelectedSubcategory(null)
                    }}
                    className={`inline-flex max-w-full items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                      isSelected
                        ? `bg-gradient-to-r ${getCategoryColor(cat)}`
                        : "bg-background text-muted-foreground border-primary/10 hover:text-foreground hover:border-primary/30"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate max-w-[220px]">{cat}</span>
                    <span className={`rounded-full px-2 text-xs font-bold ${isSelected ? "bg-white/20" : "bg-primary/10"}`}>
                      {count}
                    </span>
                  </button>
                )
              })}
          </div>
        </div>

        {subcategories.length > 0 && (
          <div className="space-y-2 border-t border-primary/10 pt-3">
            <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Subcategorías de {selectedCategory}
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedSubcategory(null)}
                className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                  !selectedSubcategory
                    ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                    : "bg-background text-muted-foreground border-primary/10 hover:text-foreground hover:border-cyan-500/30"
                }`}
              >
                Todas
                <span className="rounded-full bg-primary/10 px-2 text-xs font-bold">
                  {products.filter((p) => p.category === selectedCategory).length}
                </span>
              </button>
              {subcategories.map((subcat) => {
                const count = products.filter((p) => p.category === selectedCategory && p.subcategory === subcat).length
                const isSelected = selectedSubcategory === subcat

                return (
                  <button
                    key={subcat}
                    onClick={() => setSelectedSubcategory(subcat)}
                    className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                      isSelected
                        ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                        : "bg-background text-muted-foreground border-primary/10 hover:text-foreground hover:border-cyan-500/30"
                    }`}
                  >
                    {subcat}
                    <span className="rounded-full bg-primary/10 px-2 text-xs font-bold">{count}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : (
        /* Lista de productos: sin scroll lateral en ninguna pantalla */
        <div className="rounded-xl border border-primary/10 bg-card overflow-hidden">
          {/* Celulares: tarjetas */}
          <div className="md:hidden divide-y divide-primary/10">
            {filteredProducts.length === 0 ? (
              <p className="p-8 text-center text-muted-foreground">
                No hay productos. Agrega uno o importa desde CSV.
              </p>
            ) : (
              paginatedProducts.map((product) => (
                <div key={product.id} className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleProductSelection(product.id)}
                      className="mt-1 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {selectedProducts.includes(product.id) ? (
                        <CheckSquare className="w-5 h-5 text-primary" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground font-semibold break-words">{product.name}</p>
                      {product.barcode && <p className="text-xs text-muted-foreground font-mono">{product.barcode}</p>}
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        {product.is_active === false && (
                          <span className="rounded-full border border-gray-500/30 bg-gray-500/10 px-2 py-0.5 text-xs text-gray-400">
                            Desactivado
                          </span>
                        )}
                        <span className={`rounded-full border bg-gradient-to-r px-2 py-0.5 text-xs ${getCategoryColor(product.category)}`}>
                          {product.category}
                        </span>
                        {product.brand && <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-foreground">{product.brand}</span>}
                        {product.subcategory && (
                          <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2 py-0.5 text-xs text-cyan-400">
                            {product.subcategory}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Precio</p>
                      <p className="text-primary font-semibold">{formatMoney(product.price)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Costo</p>
                      {product.cost > 0 ? (
                        <p className="text-foreground">{formatMoney(product.cost)}</p>
                      ) : (
                        <p className="text-amber-400">Sin costo</p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Stock</p>
                      <p className={product.stock <= 0 ? "text-red-400" : product.stock <= 10 ? "text-yellow-400" : "text-foreground"}>
                        {product.stock} un.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(product)} className="flex-1 border-primary/30 gap-1.5">
                      <Edit2 className="w-4 h-4" />
                      Editar
                    </Button>
                    {product.is_active === false ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReactivate(product.id)}
                        className="flex-1 border-green-500/30 text-green-400 hover:bg-green-500/10 gap-1.5"
                      >
                        Reactivar
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(product.id)}
                        className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10 gap-1.5"
                      >
                        <Trash2 className="w-4 h-4" />
                        Eliminar
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Tablet y computadora: tabla que se ajusta al ancho (nunca scroll lateral) */}
          <table className="hidden md:table w-full table-fixed">
            <thead>
              <tr className="border-b border-primary/10 bg-muted/30">
                <th className="w-12 p-3 text-left">
                  <button onClick={toggleSelectAll} className="text-muted-foreground hover:text-foreground transition-colors">
                    {selectedProducts.length === filteredProducts.length && filteredProducts.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-primary" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Producto</th>
                <th className="hidden xl:table-cell w-28 p-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Costo</th>
                <th className="w-28 p-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Precio</th>
                <th className="hidden xl:table-cell w-24 p-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Margen</th>
                <th className="w-32 p-3 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">Stock</th>
                <th className="w-24 p-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    No hay productos. Agrega uno o importa desde CSV.
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((product) => {
                  const margin = product.price > 0 && product.cost > 0 ? ((product.price - product.cost) / product.price) * 100 : null
                  const out = product.stock <= 0
                  const low = !out && product.stock <= 10
                  return (
                    <tr key={product.id} className="border-b border-primary/5 align-middle transition-colors hover:bg-muted/40">
                      <td className="p-3">
                        <button
                          onClick={() => toggleProductSelection(product.id)}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {selectedProducts.includes(product.id) ? (
                            <CheckSquare className="w-4 h-4 text-primary" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                      <td className="p-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-gradient-to-br ${getCategoryColor(product.category)}`}>
                            {(() => {
                              const Icon = getCategoryIcon(product.category)
                              return <Icon className="h-5 w-5" />
                            })()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground break-words leading-snug">{product.name}</p>
                            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                              {product.is_active === false && (
                                <span className="rounded-full border border-gray-500/30 bg-gray-500/10 px-2 py-0.5 text-xs text-gray-400">
                                  Desactivado
                                </span>
                              )}
                              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{product.category}</span>
                              {product.subcategory && (
                                <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2 py-0.5 text-xs text-cyan-400">
                                  {product.subcategory}
                                </span>
                              )}
                              {product.brand && <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-foreground">{product.brand}</span>}
                              {product.line && <span className="text-xs text-muted-foreground">{product.line}</span>}
                              {product.supplier && <span className="text-xs text-muted-foreground">· Prov. {product.supplier}</span>}
                              {product.barcode && <span className="font-mono text-xs text-muted-foreground">· {product.barcode}</span>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="hidden xl:table-cell p-3 text-right">
                        {product.cost > 0 ? (
                          <span className="text-muted-foreground">{formatMoney(product.cost)}</span>
                        ) : (
                          <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs text-amber-400">Sin costo</span>
                        )}
                      </td>
                      <td className="p-3 text-right font-semibold text-primary">{formatMoney(product.price)}</td>
                      <td className="hidden xl:table-cell p-3 text-right">
                        {margin === null ? (
                          <span className="text-muted-foreground">-</span>
                        ) : (
                          <span className={margin >= 30 ? "text-green-400" : "text-yellow-400"}>{margin.toFixed(0)}%</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                            out
                              ? "bg-red-500/15 text-red-400"
                              : low
                                ? "bg-yellow-500/15 text-yellow-400"
                                : "bg-green-500/15 text-green-400"
                          }`}
                        >
                          {(out || low) && <AlertTriangle className="h-3.5 w-3.5" />}
                          {out ? "Sin stock" : `${product.stock} un.`}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(product)}
                            title="Editar"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          {product.is_active === false ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReactivate(product.id)}
                              title="Reactivar"
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-green-400"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(product.id)}
                              title="Eliminar"
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-red-400"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-primary/10">
              <div className="text-sm text-muted-foreground">
                Mostrando {(currentPage - 1) * PRODUCTS_PER_PAGE + 1} -{" "}
                {Math.min(currentPage * PRODUCTS_PER_PAGE, filteredProducts.length)} de {filteredProducts.length}{" "}
                productos
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="border-primary/20"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-8 h-8 p-0 ${currentPage === pageNum ? "bg-primary text-primary-foreground" : "border-primary/20"}`}
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="border-primary/20"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Product Modal */}
      <ProductModal
        open={showModal}
        onClose={() => {
          setShowModal(false)
          setEditingProduct(null)
        }}
        product={editingProduct}
        onSave={handleSave}
        products={products}
        onQuickAddStock={handleQuickAddStock}
        onStartReception={handleStartReception}
        initialBarcode={initialBarcode}
      />

      {/* CSV Import Modal */}
      <CSVImportModal open={showCSVModal} onClose={() => setShowCSVModal(false)} onImport={handleCSVImport} />

      {/* Price Adjustment Modal */}
      <PriceAdjustmentModal
        open={showPriceModal}
        onClose={() => setShowPriceModal(false)}
        products={products}
        selectedProducts={selectedProducts}
        categories={categories.filter((c) => c !== "all")}
        onApply={handlePriceAdjustment}
      />

      {/* Cajita de detalle al escanear un producto ya cargado */}
      <ProductDetailModal
        open={showDetailModal}
        onClose={() => {
          setShowDetailModal(false)
          setScannedProduct(null)
        }}
        product={scannedProduct}
        onEdit={handleEdit}
        onQuickAddStock={handleQuickAddStock}
        onStartReception={handleStartReception}
      />

      {/* Camara para buscar por scanner en celulares/tablets sin pistolita USB */}
      <CameraScanner
        isOpen={showLookupScanner}
        onClose={() => setShowLookupScanner(false)}
        onScan={handleScanLookup}
      />
    </div>
  )
}
