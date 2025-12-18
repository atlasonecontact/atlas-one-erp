"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { demoProducts, demoInventoryMovements, stockCategories } from "@/lib/demo-data"
import { StockHeatmap } from "@/components/stock/stock-heatmap"
import { Search, Download, Package, AlertTriangle, TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react"

export default function StockPage() {
  const [searchQuery, setSearchQuery] = useState("")

  const totalStock = demoProducts.reduce((acc, p) => acc + p.stock, 0)
  const lowStockCount = demoProducts.filter((p) => p.stock <= 10).length
  const criticalStockCount = demoProducts.filter((p) => p.stock <= 5).length

  const filteredMovements = demoInventoryMovements.filter(
    (m) =>
      m.product.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.reason.toLowerCase().includes(searchQuery.toLowerCase()),
  )

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
            {stockCategories.map((cat, i) => (
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
            ))}
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
            {filteredMovements.map((movement) => (
              <tr key={movement.id} className="border-b border-cyan-500/5 hover:bg-white/5 transition-colors">
                <td className="p-4 text-gray-400">{movement.date}</td>
                <td className="p-4 text-white">{movement.product}</td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    {movement.type === "IN" ? (
                      <ArrowUpRight className="w-4 h-4 text-green-400" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4 text-red-400" />
                    )}
                    <span className={movement.type === "IN" ? "text-green-400" : "text-red-400"}>
                      {movement.type === "IN" ? "Entrada" : "Salida"}
                    </span>
                  </div>
                </td>
                <td className="p-4">
                  <span className={movement.type === "IN" ? "text-green-400" : "text-red-400"}>
                    {movement.type === "IN" ? "+" : "-"}
                    {movement.quantity}
                  </span>
                </td>
                <td className="p-4 text-gray-400">{movement.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
