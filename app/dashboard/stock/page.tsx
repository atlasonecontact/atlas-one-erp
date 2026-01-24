"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { StockHeatmap } from "@/components/stock/stock-heatmap"
import { StockMovementModal } from "@/components/stock/stock-movement-modal"
import { 
  InventoryRotationChart, 
  StockBreakdownChart, 
  InventoryKPICards,
  OutOfStockList 
} from "@/components/stock/inventory-charts"
import { 
  Search, 
  Download, 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  Plus,
  RefreshCw,
  Filter,
  Calendar
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface Product {
  id: string
  name: string
  category: string
  stock_quantity: number
  min_stock_level: number
}

interface StockMovement {
  id: string
  product_id: string
  product_name?: string
  movement_type: string
  quantity: number
  reason: string
  created_at: string
}

interface CategoryStock {
  category: string
  stock: number
  rotation: "Rápido" | "Normal" | "Lento"
}

export default function StockPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [products, setProducts] = useState<Product[]>([])
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [categoryStats, setCategoryStats] = useState<CategoryStock[]>([])
  const [loading, setLoading] = useState(true)
  const [kioskoId, setKioskoId] = useState<string | null>(null)
  const [showMovementModal, setShowMovementModal] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    loadUserAndData()
  }, [])

  const loadUserAndData = async () => {
    setLoading(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    // OPTIMIZACIÓN: Ejecutar queries en paralelo
    const [employeeResult, kioscosResult] = await Promise.all([
      supabase
        .from("employees")
        .select("id, kiosko_id")
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle(),
      supabase.from("kioscos").select("id").eq("owner_id", user.id).limit(1)
    ])

    let targetKioskoId: string | null = null

    if (employeeResult.data) {
      targetKioskoId = employeeResult.data.kiosko_id
    } else if (kioscosResult.data && kioscosResult.data.length > 0) {
      targetKioskoId = kioscosResult.data[0].id
    }

    if (targetKioskoId) {
      setKioskoId(targetKioskoId)
      await Promise.all([loadProducts(targetKioskoId), loadMovements(targetKioskoId)])
    }
    setLoading(false)
  }

  const loadProducts = async (kiosko_id: string) => {
    // Load ALL products - Supabase limits to 1000 by default, use range to get more
    let allProducts: any[] = []
    let from = 0
    const pageSize = 1000
    let hasMore = true

    while (hasMore) {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, category, stock_quantity, min_stock_level")
        .eq("kiosko_id", kiosko_id)
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

    setProducts(allProducts)
    calculateCategoryStats(allProducts)
  }

  const loadMovements = async (kiosko_id: string) => {
    const { data, error } = await supabase
      .from("stock_movements")
      .select(`
        id,
        product_id,
        movement_type,
        quantity,
        reason,
        created_at,
        products(name)
      `)
      .eq("kiosko_id", kiosko_id)
      .order("created_at", { ascending: false })
      .limit(50)

    if (!error && data) {
      const mappedMovements = data.map((m: any) => ({
        id: m.id,
        product_id: m.product_id,
        product_name: m.products?.name || "Producto desconocido",
        movement_type: m.movement_type,
        quantity: m.quantity,
        reason: m.reason || "",
        created_at: m.created_at,
      }))
      setMovements(mappedMovements)
    }
  }

  const calculateCategoryStats = (prods: Product[]) => {
    const categoryMap = new Map<string, { stock: number; count: number }>()

    prods.forEach((p) => {
      const cat = p.category || "Sin categoría"
      const existing = categoryMap.get(cat) || { stock: 0, count: 0 }
      categoryMap.set(cat, {
        stock: existing.stock + p.stock_quantity,
        count: existing.count + 1,
      })
    })

    const stats: CategoryStock[] = Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      stock: data.stock,
      rotation: data.stock > 100 ? "Rápido" : data.stock > 50 ? "Normal" : "Lento",
    }))

    setCategoryStats(stats)
  }

  const totalStock = products.reduce((acc, p) => acc + p.stock_quantity, 0)
  const lowStockCount = products.filter((p) => p.stock_quantity <= (p.min_stock_level || 10)).length
  const criticalStockCount = products.filter((p) => p.stock_quantity <= 5).length

  const filteredMovements = movements.filter(
    (m) =>
      (m.product_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.reason || "").toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Control de Stock</h1>
          <div className="flex items-center gap-4 mt-1">
            <button className="text-sm text-cyan-400 border-b-2 border-cyan-400 pb-1">
              Inventario
            </button>
            <button className="text-sm text-gray-400 hover:text-white pb-1">
              Movimientos
            </button>
            <button className="text-sm text-gray-400 hover:text-white pb-1">
              Alertas
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Date Range */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#0a0f1a] border border-cyan-500/20">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-white">Últimos 30 días</span>
          </div>
          
          <Button variant="outline" size="sm" className="border-cyan-500/20 text-gray-400 bg-[#0a0f1a]">
            <Filter className="w-4 h-4 mr-2" />
            Filtrar
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={loadUserAndData}
            disabled={loading}
            className="text-gray-400 hover:text-white"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>

          <Button variant="outline" className="border-cyan-500/20 text-gray-400 hover:text-white bg-transparent gap-2">
            <Download className="w-4 h-4" />
            Exportar
          </Button>
          <Button 
            onClick={() => setShowMovementModal(true)}
            className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold gap-2"
          >
            <Plus className="w-4 h-4" />
            Movimiento
          </Button>
        </div>
      </div>

      {/* Top KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-cyan-500/10 bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-400">Stock Total</span>
            <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
              <Package className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white">{totalStock.toLocaleString()}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-green-400 flex items-center">
              <ArrowUpRight className="w-3 h-3" />
              +5.2%
            </span>
            <span className="text-xs text-gray-500">{products.length} productos</span>
          </div>
        </div>

        <div className="rounded-xl border border-cyan-500/10 bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-400">Stock Bajo</span>
            <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-yellow-400">{lowStockCount}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-gray-500">Bajo nivel mínimo</span>
          </div>
        </div>

        <div className="rounded-xl border border-cyan-500/10 bg-gradient-to-br from-red-500/10 to-red-500/5 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-400">Stock Crítico</span>
            <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-red-400">{criticalStockCount}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-red-400">Requiere acción</span>
          </div>
        </div>

        <div className="rounded-xl border border-cyan-500/10 bg-gradient-to-br from-green-500/10 to-green-500/5 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-400">Movimientos Hoy</span>
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white">
            {movements.filter((m) => {
              const movDate = new Date(m.created_at).toDateString()
              const today = new Date().toDateString()
              return movDate === today
            }).length}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-gray-500">Últimas 24 horas</span>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <InventoryKPICards isLoading={loading} />
        <InventoryRotationChart isLoading={loading} />
        <StockBreakdownChart isLoading={loading} />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stock insights */}
        <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white">Stock Insights</h3>
              <p className="text-xs text-gray-500">Predicciones y alertas</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <p className="text-sm text-white font-medium">Cigarrillos caerán a crítico</p>
              </div>
              <p className="text-xs text-red-400 ml-4">en 45 horas</p>
            </div>
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <p className="text-sm text-white font-medium">Energizantes ↑ ventas</p>
              </div>
              <p className="text-xs text-green-400 ml-4">+32% esta semana</p>
            </div>
            <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                <p className="text-sm text-white font-medium">Golosinas: stock envejecido</p>
              </div>
              <p className="text-xs text-yellow-400 ml-4">rotación lenta</p>
            </div>
            <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-orange-500" />
                <p className="text-sm text-white font-medium">Snacks riesgo de quiebre</p>
              </div>
              <p className="text-xs text-orange-400 ml-4">el sábado</p>
            </div>
          </div>
        </div>

        {/* Rotation by category */}
        <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white">Rotación por Categoría</h3>
              <p className="text-xs text-gray-500">Velocidad de venta</p>
            </div>
          </div>
          <div className="space-y-4">
            {categoryStats.length === 0 ? (
              <p className="text-gray-500 text-sm">No hay productos cargados</p>
            ) : (
              categoryStats.slice(0, 5).map((cat, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">{cat.category}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">{cat.stock} unid.</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          cat.rotation === "Rápido"
                            ? "bg-green-500/20 text-green-400"
                            : cat.rotation === "Normal"
                              ? "bg-cyan-500/20 text-cyan-400"
                              : "bg-yellow-500/20 text-yellow-400"
                        }`}
                      >
                        {cat.rotation}
                      </span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        cat.rotation === "Rápido"
                          ? "bg-gradient-to-r from-green-500 to-green-400"
                          : cat.rotation === "Normal"
                            ? "bg-gradient-to-r from-cyan-500 to-cyan-400"
                            : "bg-gradient-to-r from-yellow-500 to-yellow-400"
                      }`}
                      style={{ width: `${Math.min((cat.stock / 300) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Products out of stock */}
        <OutOfStockList isLoading={loading} />
      </div>

      {/* Stock Heatmap */}
      <StockHeatmap />

      {/* Movements table */}
      <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-cyan-500/10">
          <h3 className="text-lg font-semibold text-white">Movimientos de Inventario</h3>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              type="text"
              placeholder="Buscar movimientos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[#0d1424] border-cyan-500/10 text-white placeholder:text-gray-500"
            />
          </div>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-cyan-500/10">
              <th className="text-left text-sm font-medium text-gray-400 p-4">Fecha</th>
              <th className="text-left text-sm font-medium text-gray-400 p-4">Producto</th>
              <th className="text-left text-sm font-medium text-gray-400 p-4">Tipo</th>
              <th className="text-left text-sm font-medium text-gray-400 p-4">Cantidad</th>
              <th className="text-left text-sm font-medium text-gray-400 p-4">Razón</th>
            </tr>
          </thead>
          <tbody>
            {filteredMovements.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">
                  {loading ? "Cargando movimientos..." : "No hay movimientos de inventario"}
                </td>
              </tr>
            ) : (
              filteredMovements.map((movement) => (
                <tr key={movement.id} className="border-b border-cyan-500/5 hover:bg-white/5 transition-colors">
                  <td className="p-4 text-gray-400">{formatDate(movement.created_at)}</td>
                  <td className="p-4 text-white">{movement.product_name}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {movement.movement_type === "in" || movement.movement_type === "purchase" ? (
                        <ArrowUpRight className="w-4 h-4 text-green-400" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 text-red-400" />
                      )}
                      <span
                        className={
                          movement.movement_type === "in" || movement.movement_type === "purchase"
                            ? "text-green-400"
                            : "text-red-400"
                        }
                      >
                        {movement.movement_type === "in" || movement.movement_type === "purchase"
                          ? "Entrada"
                          : "Salida"}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span
                      className={
                        movement.movement_type === "in" || movement.movement_type === "purchase"
                          ? "text-green-400"
                          : "text-red-400"
                      }
                    >
                      {movement.movement_type === "in" || movement.movement_type === "purchase" ? "+" : "-"}
                      {movement.quantity}
                    </span>
                  </td>
                  <td className="p-4 text-gray-400">{movement.reason || "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Stock Movement Modal */}
      {kioskoId && (
        <StockMovementModal
          open={showMovementModal}
          onClose={() => setShowMovementModal(false)}
          kioskoId={kioskoId}
          onSuccess={() => {
            loadProducts(kioskoId)
            loadMovements(kioskoId)
          }}
        />
      )}
    </div>
  )
}
