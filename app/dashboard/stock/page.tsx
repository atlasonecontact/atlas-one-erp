"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { StockHeatmap } from "@/components/stock/stock-heatmap"
import { Search, Download, Package, AlertTriangle, TrendingUp, ArrowUpRight, ArrowDownRight, RefreshCw } from "lucide-react"
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

  const supabase = createClient()

  useEffect(() => {
    loadUserAndData()
  }, [])

  const loadUserAndData = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    // Check if user is an employee
    const { data: employeeData } = await supabase
      .from("employees")
      .select("id, kiosko_id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle()

    let targetKioskoId: string | null = null

    if (employeeData) {
      targetKioskoId = employeeData.kiosko_id
    } else {
      // User is owner
      const { data: kioscos } = await supabase
        .from("kioscos")
        .select("id")
        .eq("owner_id", user.id)
        .limit(1)

      if (kioscos && kioscos.length > 0) {
        targetKioskoId = kioscos[0].id
      }
    }

    if (targetKioskoId) {
      setKioskoId(targetKioskoId)
      await Promise.all([
        loadProducts(targetKioskoId),
        loadMovements(targetKioskoId),
      ])
    }
    setLoading(false)
  }

  const loadProducts = async (kiosko_id: string) => {
    const { data, error } = await supabase
      .from("products")
      .select("id, name, category, stock_quantity, min_stock_level")
      .eq("kiosko_id", kiosko_id)
      .eq("is_active", true)
      .order("name")

    if (!error && data) {
      setProducts(data)
      calculateCategoryStats(data)
    }
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
      rotation: data.stock > 100 ? "Rápido" : data.stock > 30 ? "Normal" : "Lento",
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
    return new Date(dateStr).toLocaleDateString("es-AR")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Control de Stock</h1>
          <p className="text-gray-400 text-sm">Monitorea y gestiona tu inventario</p>
        </div>
        <Button variant="outline" className="border-cyan-500/20 text-gray-400 hover:text-white bg-transparent gap-2">
          <Download className="w-4 h-4" />
          Exportar
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-400">Stock Total</span>
            <Package className="w-5 h-5 text-cyan-400" />
          </div>
          <p className="text-2xl font-bold text-white">{totalStock.toLocaleString()}</p>
          <p className="text-xs text-green-400 mt-1">+2,270 esta semana</p>
        </div>

        <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-400">Productos en Riesgo</span>
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
          </div>
          <p className="text-2xl font-bold text-yellow-400">{lowStockCount}</p>
          <p className="text-xs text-gray-500 mt-1">Stock menor a 10 unidades</p>
        </div>

        <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-400">Stock Crítico</span>
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <p className="text-2xl font-bold text-red-400">{criticalStockCount}</p>
          <p className="text-xs text-gray-500 mt-1">Stock menor a 5 unidades</p>
        </div>

        <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-400">Rotación Promedio</span>
            <TrendingUp className="w-5 h-5 text-cyan-400" />
          </div>
          <p className="text-2xl font-bold text-white">
            18.2 <span className="text-sm font-normal text-gray-500">días</span>
          </p>
          <p className="text-xs text-green-400 mt-1">-1.3% vs mes anterior</p>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stock insights */}
        <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Stock Insights</h3>
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-sm text-white font-medium">Cigarrillos caerán a nivel crítico</p>
              <p className="text-xs text-red-400 mt-1">en 45 horas</p>
            </div>
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <p className="text-sm text-white font-medium">Energizantes incrementaron ventas</p>
              <p className="text-xs text-green-400 mt-1">+32% esta semana</p>
            </div>
            <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <p className="text-sm text-white font-medium">Golosinas: stock envejecido</p>
              <p className="text-xs text-yellow-400 mt-1">rotación lenta</p>
            </div>
            <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
              <p className="text-sm text-white font-medium">Snacks riesgo de quiebre</p>
              <p className="text-xs text-orange-400 mt-1">el sábado</p>
            </div>
          </div>
        </div>

        {/* Rotation by category */}
        <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Rotación por Categoría</h3>
          <div className="space-y-4">
            {categoryStats.length === 0 ? (
              <p className="text-gray-500 text-sm">No hay productos cargados</p>
            ) : (
              categoryStats.map((cat, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">{cat.category}</span>
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
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        cat.rotation === "Rápido"
                          ? "bg-green-500"
                          : cat.rotation === "Normal"
                            ? "bg-cyan-500"
                            : "bg-yellow-500"
                      }`}
                      style={{ width: `${Math.min((cat.stock / 300) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Stock heatmap */}
        <StockHeatmap />
      </div>

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
                      <span className={movement.movement_type === "in" || movement.movement_type === "purchase" ? "text-green-400" : "text-red-400"}>
                        {movement.movement_type === "in" || movement.movement_type === "purchase" ? "Entrada" : "Salida"}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={movement.movement_type === "in" || movement.movement_type === "purchase" ? "text-green-400" : "text-red-400"}>
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
    </div>
  )
}
