"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ProductModal } from "@/components/products/product-modal"
import { CSVImportModal } from "@/components/products/csv-import-modal"
import { Search, Plus, Edit2, Trash2, Package, AlertTriangle, Upload, RefreshCw } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface Product {
  id: string
  name: string
  category: string
  cost: number
  price: number
  stock: number
  barcode?: string
  status: string
  kiosko_id?: string
}

export default function ProductosPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [showModal, setShowModal] = useState(false)
  const [showCSVModal, setShowCSVModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [kioskoId, setKioskoId] = useState<string | null>(null)

  const supabase = createClient()

  const fetchProducts = async (kiosko_id?: string) => {
    setLoading(true)
    const targetKioskoId = kiosko_id || kioskoId

    if (!targetKioskoId) {
      setLoading(false)
      return
    }

    const { data, error } = await supabase.from("products").select("*").eq("kiosko_id", targetKioskoId).order("name")

    if (error) {
      console.error("Error fetching products:", error)
    } else {
      // Map database fields to component fields
      const mappedProducts = (data || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        category: p.category || "Sin categoría",
        cost: p.cost || 0,
        price: p.price || 0,
        stock: p.stock_quantity || 0,
        barcode: p.barcode,
        status: p.stock_quantity <= 0 ? "inactive" : p.stock_quantity <= 10 ? "low_stock" : "active",
        kiosko_id: p.kiosko_id,
      }))
      setProducts(mappedProducts)
    }
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

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "all" || p.category === selectedCategory
    return matchesSearch && matchesCategory
  })

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

  const handleSave = async (product: Omit<Product, "id"> & { id?: string }) => {
    if (!kioskoId) {
      alert("No hay kiosko seleccionado")
      return
    }

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
          is_active: true,
        })
        .select()
        .single()

      if (!error && data) {
        const mappedProduct: Product = {
          id: data.id,
          name: data.name,
          category: data.category || "Sin categoría",
          cost: data.cost || 0,
          price: data.price || 0,
          stock: data.stock_quantity || 0,
          barcode: data.barcode,
          status: data.stock_quantity <= 10 ? "low_stock" : "active",
          kiosko_id: data.kiosko_id,
        }
        setProducts((prev) => [...prev, mappedProduct])
      }
    }
    setShowModal(false)
    setEditingProduct(null)
  }

  const handleCSVImport = async (
    csvProducts: { name: string; category: string; cost: number; price: number; stock: number; barcode?: string }[],
  ) => {
    if (!kioskoId) {
      alert("No hay kiosko seleccionado")
      return
    }

    setSyncing(true)
    const productsToInsert = csvProducts.map((p) => ({
      kiosko_id: kioskoId,
      name: p.name,
      category: p.category,
      cost: p.cost,
      price: p.price,
      stock_quantity: p.stock,
      barcode: p.barcode || null,
      is_active: true,
    }))

    const { data, error } = await supabase.from("products").insert(productsToInsert).select()

    if (!error && data) {
      const mappedProducts = data.map((p: any) => ({
        id: p.id,
        name: p.name,
        category: p.category || "Sin categoría",
        cost: p.cost || 0,
        price: p.price || 0,
        stock: p.stock_quantity || 0,
        barcode: p.barcode,
        status: p.stock_quantity <= 10 ? "low_stock" : "active",
        kiosko_id: p.kiosko_id,
      }))
      setProducts((prev) => [...prev, ...mappedProducts])
    }
    setSyncing(false)
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
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "bg-card text-muted-foreground border border-primary/10 hover:text-foreground"
              }`}
            >
              {cat === "all" ? "Todos" : cat}
            </button>
          ))}
        </div>
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
                <th className="text-left text-sm font-medium text-muted-foreground p-4">Producto</th>
                <th className="text-left text-sm font-medium text-muted-foreground p-4">Categoría</th>
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
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    No hay productos. Agrega uno o importa desde CSV.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="border-b border-primary/5 hover:bg-muted/50 transition-colors">
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
                      <span className="px-2 py-1 rounded-full text-xs bg-muted text-muted-foreground">
                        {product.category}
                      </span>
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
      />

      {/* CSV Import Modal */}
      <CSVImportModal open={showCSVModal} onClose={() => setShowCSVModal(false)} onImport={handleCSVImport} />
    </div>
  )
}
