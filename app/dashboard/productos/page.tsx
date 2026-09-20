"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ProductModal } from "@/components/products/product-modal"
import { CSVImportModal, type CSVProduct } from "@/components/products/csv-import-modal"
import { PriceAdjustmentModal } from "@/components/products/price-adjustment-modal"
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
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/toast-provider"

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
  price: number
  stock: number
  barcode?: string
  status: string
  kiosko_id?: string
  supplier?: string
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
      category: p.category || "Sin categoría",
      subcategory: p.subcategory,
      line: p.variant,
      cost: p.cost || 0,
      price: p.price || 0,
      stock: p.stock_quantity || 0,
      barcode: p.barcode,
      status: p.stock_quantity <= 0 ? "inactive" : p.stock_quantity <= 10 ? "low_stock" : "active",
      kiosko_id: p.kiosko_id,
      supplier: p.supplier,
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

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("products").delete().eq("id", id)
    if (!error) {
      setProducts((prev) => prev.filter((p) => p.id !== id))
    }
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

  const handleSave = async (product: Omit<Product, "id"> & { id?: string }) => {
    if (!kioskoId) {
      alert("No hay kiosko seleccionado")
      return
    }

    contributeToBarcodeCatalog(product)

    if (editingProduct) {
      const { error } = await supabase
        .from("products")
        .update({
          name: product.name,
          category: product.category,
          cost: product.cost,
          price: product.price,
          stock_quantity: product.stock,
          barcode: product.barcode,
          supplier: product.supplier,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingProduct.id)

      if (!error) {
        setProducts((prev) =>
          prev.map((p) => (p.id === editingProduct.id ? ({ ...product, id: editingProduct.id } as Product) : p)),
        )
      }
    } else {
      const { data, error } = await supabase
        .from("products")
        .insert({
          kiosko_id: kioskoId,
          name: product.name,
          category: product.category,
          cost: product.cost,
          price: product.price,
          stock_quantity: product.stock,
          barcode: product.barcode,
          supplier: product.supplier,
          is_active: true,
        })
        .select()
        .single()

      if (!error && data) {
        const mappedProduct: Product = {
          id: data.id,
          name: data.name,
          sku: product.sku,
          brand: product.brand,
          variant: product.variant,
          presentation: product.presentation,
          category: data.category || "Sin categoría",
          subcategory: data.subcategory,
          line: data.variant,
          net_content: product.net_content,
          unit: product.unit,
          barcode: data.barcode,
          cost: data.cost || 0,
          cost_ex_vat: product.cost_ex_vat,
          cost_inc_vat: product.cost_inc_vat,
          price: data.price || 0,
          stock: data.stock_quantity || 0,
          status: data.stock_quantity <= 10 ? "low_stock" : "active",
          kiosko_id: data.kiosko_id,
          supplier: data.supplier,
        }
        setProducts((prev) => [...prev, mappedProduct])
      }
    }
    setShowModal(false)
    setEditingProduct(null)
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
      alert("Error al actualizar precios")
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Productos</h1>
          <p className="text-muted-foreground text-sm">Gestiona tu catálogo de productos</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={fetchProducts}
            disabled={loading || syncing}
            className="border-primary/30 text-muted-foreground hover:text-foreground bg-transparent"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Sincronizar
          </Button>
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
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar productos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card border-primary/10 text-foreground placeholder:text-muted-foreground"
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

        <div>
          <div className="flex items-center gap-2 mb-3">
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <button
              onClick={() => {
                setSelectedCategory("all")
                setSelectedSubcategory(null)
              }}
              className={`group p-4 rounded-xl text-sm font-medium transition-all duration-200 flex flex-col items-center gap-2 ${
                selectedCategory === "all"
                  ? "bg-gradient-to-br from-primary/30 to-primary/20 text-primary border-2 border-primary/50 shadow-lg shadow-primary/20 scale-105"
                  : "bg-card text-muted-foreground border border-primary/10 hover:text-foreground hover:border-primary/30 hover:scale-102 hover:shadow-md"
              }`}
            >
              <Package
                className={`w-6 h-6 transition-transform group-hover:scale-110 ${selectedCategory === "all" ? "text-primary" : "text-muted-foreground"}`}
              />
              <span className="text-xs">Todas</span>
              <span className="text-xs font-bold">{products.length}</span>
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
                    className={`group p-4 rounded-xl text-sm font-medium transition-all duration-200 flex flex-col items-center gap-2 ${
                      isSelected
                        ? `bg-gradient-to-br ${getCategoryColor(cat)} border-2 shadow-lg scale-105`
                        : "bg-card text-muted-foreground border border-primary/10 hover:text-foreground hover:border-primary/30 hover:scale-102 hover:shadow-md"
                    }`}
                  >
                    <Icon
                      className={`w-6 h-6 transition-transform group-hover:scale-110 ${isSelected ? "" : "text-muted-foreground group-hover:text-primary"}`}
                    />
                    <span className="text-xs text-center line-clamp-2 leading-tight">{cat}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-bold ${isSelected ? "bg-white/20" : "bg-primary/10"}`}
                    >
                      {count}
                    </span>
                  </button>
                )
              })}
          </div>
        </div>

        {subcategories.length > 0 && (
          <div className="animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-1 h-4 rounded-full bg-gradient-to-b ${getCategoryColor(selectedCategory)}`} />
              <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Subcategorías de {selectedCategory}
              </span>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setSelectedSubcategory(null)}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 flex items-center gap-2 ${
                  !selectedSubcategory
                    ? `bg-gradient-to-r ${getCategoryColor(selectedCategory)} border shadow-md`
                    : "bg-card/50 text-muted-foreground border border-primary/10 hover:text-foreground hover:border-primary/30 hover:shadow-sm"
                }`}
              >
                <Package className="w-4 h-4" />
                Todas las subcategorías
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-bold ${!selectedSubcategory ? "bg-white/20" : "bg-primary/10"}`}
                >
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
                    className={`px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 flex items-center gap-2 ${
                      isSelected
                        ? "bg-gradient-to-r from-cyan-500/30 to-teal-500/20 text-cyan-400 border border-cyan-500/50 shadow-md shadow-cyan-500/10"
                        : "bg-card/50 text-muted-foreground border border-primary/10 hover:text-foreground hover:border-cyan-500/30 hover:shadow-sm"
                    }`}
                  >
                    {subcat}
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-bold ${isSelected ? "bg-cyan-500/20" : "bg-primary/10"}`}
                    >
                      {count}
                    </span>
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
        /* Products table */
        <div className="rounded-xl border border-primary/10 bg-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-primary/10">
                <th className="text-left text-sm font-medium text-muted-foreground p-4 w-10">
                  <button
                    onClick={toggleSelectAll}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {selectedProducts.length === filteredProducts.length && filteredProducts.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-primary" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="text-left text-sm font-medium text-muted-foreground p-4">Producto</th>
                <th className="text-left text-sm font-medium text-muted-foreground p-4">Marca</th>
                <th className="text-left text-sm font-medium text-muted-foreground p-4">Categoría</th>
                <th className="text-left text-sm font-medium text-muted-foreground p-4">Subcategoría</th>
                <th className="text-left text-sm font-medium text-muted-foreground p-4">Línea</th>
                <th className="text-left text-sm font-medium text-muted-foreground p-4">Proveedor</th>
                <th className="text-left text-sm font-medium text-muted-foreground p-4">Costo</th>
                <th className="text-left text-sm font-medium text-muted-foreground p-4">Precio</th>
                <th className="text-left text-sm font-medium text-muted-foreground p-4">Stock</th>
                <th className="text-left text-sm font-medium text-muted-foreground p-4">Estado</th>
                <th className="text-right text-sm font-medium text-muted-foreground p-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={12} className="p-8 text-center text-muted-foreground">
                    No hay productos. Agrega uno o importa desde CSV.
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((product) => (
                  <tr key={product.id} className="border-b border-primary/5 hover:bg-muted/50 transition-colors">
                    <td className="p-4">
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
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                          <Package className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div>
                          <span className="text-foreground font-medium">{product.name}</span>
                          {product.barcode && <p className="text-xs text-muted-foreground">{product.barcode}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      {product.brand ? (
                        <span className="text-sm text-foreground font-medium">{product.brand}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 rounded-full text-xs bg-muted text-muted-foreground">
                        {product.category}
                      </span>
                    </td>
                    <td className="p-4">
                      {product.subcategory ? (
                        <span className="px-2 py-1 rounded-full text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                          {product.subcategory}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="p-4">
                      {product.line ? (
                        <span className="text-sm text-muted-foreground">{product.line}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="p-4">
                      {product.supplier ? (
                        <span className="text-sm text-muted-foreground">{product.supplier}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="p-4 text-muted-foreground">${product.cost.toLocaleString()}</td>
                    <td className="p-4 text-primary font-medium">${product.price.toLocaleString()}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {product.stock <= 10 && <AlertTriangle className="w-4 h-4 text-yellow-400" />}
                        <span className={product.stock <= 10 ? "text-yellow-400" : "text-foreground"}>
                          {product.stock} un.
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          product.status === "active"
                            ? "bg-green-500/20 text-green-400"
                            : "bg-yellow-500/20 text-yellow-400"
                        }`}
                      >
                        {product.status === "active" ? "Activo" : "Bajo stock"}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(product)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(product.id)}
                          className="text-muted-foreground hover:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
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
        onProductMatched={setEditingProduct}
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
    </div>
  )
}
