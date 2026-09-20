"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Download, Package, AlertTriangle, RefreshCw, Building2, Check } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useEmployeePermissions } from "@/lib/hooks/use-employee-permissions"
import { AccessDenied } from "@/components/ui/access-denied"

interface Product {
  id: string
  name: string
  category: string
  stock_quantity: number
  min_stock_level: number
  stock_location?: string
  kiosko_name?: string
}

interface Kiosko {
  id: string
  name: string
}

export default function StockPorSucursalPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [kioscos, setKioscos] = useState<Kiosko[]>([])
  const [selectedKiosko, setSelectedKiosko] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const { permissions, loading: permsLoading } = useEmployeePermissions()

  useEffect(() => {
    loadKioscos()
  }, [])

  useEffect(() => {
    if (selectedKiosko) {
      loadProducts(selectedKiosko)
    }
  }, [selectedKiosko])

  const loadKioscos = async () => {
    const supabase = createClient()

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase.from("profiles").select("business_id").eq("id", user.id).single()

      if (!profile?.business_id) return

      const { data: kioscosData } = await supabase
        .from("kioscos")
        .select("id, name")
        .eq("business_id", profile.business_id)
        .order("name")

      if (kioscosData && kioscosData.length > 0) {
        setKioscos(kioscosData)
        setSelectedKiosko(kioscosData[0].id)
      }
    } catch (error) {
      console.error("Error loading kioscos:", error)
    }
  }

  const loadProducts = async (kioskoId: string) => {
    setLoading(true)
    const supabase = createClient()

    try {
      const selectedKioskoData = kioscos.find((k) => k.id === kioskoId)

      // Load products from specific sucursal (not Stock Central)
      const { data: productsData } = await supabase
        .from("products")
        .select("*")
        .eq("kiosko_id", kioskoId)
        .neq("stock_location", "Stock Central")
        .order("name")

      if (productsData) {
        setProducts(
          productsData.map((p) => ({
            ...p,
            kiosko_name: selectedKioskoData?.name || "Sucursal",
          })),
        )
      }
    } catch (error) {
      console.error("Error loading products:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.category || "").toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const totalStock = products.reduce((sum, p) => sum + p.stock_quantity, 0)
  const lowStockCount = products.filter((p) => p.stock_quantity <= (p.min_stock_level || 10)).length
  const criticalStockCount = products.filter((p) => p.stock_quantity <= 5).length

  if (!permsLoading && !permissions.can_view_stock) {
    return (
      <div className="space-y-6">
        <AccessDenied
          title="No tenés permiso para ver el stock"
          message="Pedile a tu dueño de kiosco que te habilite 'Consultar stock' desde Empleados."
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Stock por Sucursal</h1>
          <p className="text-sm text-gray-400 mt-1">Inventario distribuido en sucursales</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedKiosko} onValueChange={setSelectedKiosko}>
            <SelectTrigger className="w-[250px] bg-[#0a0f1a] border-cyan-500/20">
              <SelectValue placeholder="Seleccionar sucursal" />
            </SelectTrigger>
            <SelectContent>
              {kioscos.map((kiosko) => (
                <SelectItem key={kiosko.id} value={kiosko.id}>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-purple-400" />
                    <span>{kiosko.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => selectedKiosko && loadProducts(selectedKiosko)}
            disabled={loading}
            className="text-gray-400 hover:text-white"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>

          <Button variant="outline" className="border-cyan-500/20 text-gray-400 hover:text-white bg-transparent gap-2">
            <Download className="w-4 h-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-purple-500/10 bg-gradient-to-br from-purple-500/10 to-purple-500/5 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-400">Stock Total</span>
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-purple-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white">{totalStock.toLocaleString()}</p>
          <div className="flex items-center gap-2 mt-2">
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
        </div>

        <div className="rounded-xl border border-cyan-500/10 bg-gradient-to-br from-red-500/10 to-red-500/5 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-400">Stock Crítico</span>
            <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-red-400">{criticalStockCount}</p>
        </div>

        <div className="rounded-xl border border-cyan-500/10 bg-gradient-to-br from-blue-500/10 to-blue-500/5 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-400">Sucursal</span>
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-400" />
            </div>
          </div>
          <p className="text-xl font-bold text-white truncate">
            {kioscos.find((k) => k.id === selectedKiosko)?.name || "--"}
          </p>
        </div>
      </div>

      {/* Products Table */}
      <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-cyan-500/10">
          <h3 className="text-lg font-semibold text-white">Productos en Sucursal</h3>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              type="text"
              placeholder="Buscar productos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[#0d1424] border-cyan-500/10 text-white placeholder:text-gray-500"
            />
          </div>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-cyan-500/10">
              <th className="text-left text-sm font-medium text-gray-400 p-4">Producto</th>
              <th className="text-left text-sm font-medium text-gray-400 p-4">Categoría</th>
              <th className="text-left text-sm font-medium text-gray-400 p-4">Stock</th>
              <th className="text-left text-sm font-medium text-gray-400 p-4">Nivel Mín.</th>
              <th className="text-left text-sm font-medium text-gray-400 p-4">Estado</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                  Cargando inventario...
                </td>
              </tr>
            ) : filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">
                  No se encontraron productos en esta sucursal
                </td>
              </tr>
            ) : (
              filteredProducts.map((product) => {
                const isLowStock = product.stock_quantity <= (product.min_stock_level || 10)
                const isCritical = product.stock_quantity <= 5

                return (
                  <tr key={product.id} className="border-b border-cyan-500/5 hover:bg-white/5 transition-colors">
                    <td className="p-4 text-white font-medium">{product.name}</td>
                    <td className="p-4 text-gray-400">{product.category || "-"}</td>
                    <td className="p-4">
                      <span
                        className={
                          isCritical
                            ? "text-red-400 font-semibold"
                            : isLowStock
                              ? "text-yellow-400 font-semibold"
                              : "text-white"
                        }
                      >
                        {product.stock_quantity}
                      </span>
                    </td>
                    <td className="p-4 text-gray-400">{product.min_stock_level || 10}</td>
                    <td className="p-4">
                      {isCritical ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
                          <AlertTriangle className="w-3 h-3" />
                          Crítico
                        </span>
                      ) : isLowStock ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400">
                          <AlertTriangle className="w-3 h-3" />
                          Bajo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                          <Check className="w-3 h-3" />
                          Normal
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
