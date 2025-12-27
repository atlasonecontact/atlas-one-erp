"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { DollarSign, ShoppingCart, TrendingUp, Calendar, Download, RefreshCw, ArrowUp, Package } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

export const dynamic = "force-dynamic"

export default function VentasOverviewPage() {
  const [period, setPeriod] = useState("30d")
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    loadStats()
  }, [period])

  const loadStats = async () => {
    setLoading(true)
    // Mock data - replace with real Supabase queries
    await new Promise((resolve) => setTimeout(resolve, 500))

    setStats({
      totalSales: 2450000,
      avgDailySales: 81666,
      avgWeeklySales: 571666,
      avgTicket: 12250,
      unitsSold: 1543,
      previousComparison: 12.5,
      dailySales: Array.from({ length: 30 }, (_, i) => ({
        date: `Día ${i + 1}`,
        value: Math.floor(Math.random() * 150000) + 50000,
      })),
      salesByWeekday: [
        { day: "Lun", value: 320000 },
        { day: "Mar", value: 380000 },
        { day: "Mié", value: 420000 },
        { day: "Jue", value: 390000 },
        { day: "Vie", value: 510000 },
        { day: "Sáb", value: 280000 },
        { day: "Dom", value: 150000 },
      ],
      topProducts: [
        { name: "Coca Cola 2.25L", sales: 185000, units: 340 },
        { name: "Pan Lactal", sales: 142000, units: 280 },
        { name: "Galletitas Oreo", sales: 128000, units: 210 },
        { name: "Cigarrillos Marlboro", sales: 115000, units: 95 },
        { name: "Cerveza Quilmes", sales: 98000, units: 180 },
      ],
      salesByCategory: [
        { name: "Bebidas", value: 820000, percent: 33.5 },
        { name: "Almacén", value: 612500, percent: 25 },
        { name: "Cigarrillos", value: 490000, percent: 20 },
        { name: "Snacks", value: 367500, percent: 15 },
        { name: "Otros", value: 160000, percent: 6.5 },
      ],
    })
    setLoading(false)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(
      value,
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-cyan-500 animate-spin" />
      </div>
    )
  }

  const COLORS = ["#06b6d4", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444"]

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Ventas Overview</h1>
          <p className="text-gray-400 mt-1">Vista ejecutiva de ventas y rendimiento</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-[#0a0f1a] border border-cyan-500/20 rounded-lg p-1">
            {["7d", "30d", "90d"].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 text-sm rounded-md transition-colors font-medium ${
                  period === p ? "bg-cyan-500/20 text-cyan-400" : "text-gray-400 hover:text-white"
                }`}
              >
                {p === "7d" ? "7 Días" : p === "30d" ? "30 Días" : "90 Días"}
              </button>
            ))}
          </div>
          <Button
            variant="outline"
            className="gap-2 border-cyan-500/20 text-cyan-400 bg-transparent hover:bg-cyan-500/10"
          >
            <Download className="w-4 h-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="rounded-xl border border-cyan-500/10 bg-gradient-to-br from-[#0a0f1a] to-[#0d1525] p-6 hover:border-cyan-500/30 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-cyan-400" />
            </div>
            <div className="flex items-center gap-1 text-sm text-green-400">
              <ArrowUp className="w-4 h-4" />
              {stats.previousComparison}%
            </div>
          </div>
          <p className="text-3xl font-bold text-white mb-1">{formatCurrency(stats.totalSales)}</p>
          <p className="text-sm text-gray-400">Ventas Totales</p>
        </div>

        <div className="rounded-xl border border-cyan-500/10 bg-gradient-to-br from-[#0a0f1a] to-[#0d1525] p-6 hover:border-cyan-500/30 transition-all">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4">
            <Calendar className="w-6 h-6 text-blue-400" />
          </div>
          <p className="text-3xl font-bold text-white mb-1">{formatCurrency(stats.avgDailySales)}</p>
          <p className="text-sm text-gray-400">Promedio Diario</p>
        </div>

        <div className="rounded-xl border border-cyan-500/10 bg-gradient-to-br from-[#0a0f1a] to-[#0d1525] p-6 hover:border-cyan-500/30 transition-all">
          <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center mb-4">
            <TrendingUp className="w-6 h-6 text-green-400" />
          </div>
          <p className="text-3xl font-bold text-white mb-1">{formatCurrency(stats.avgWeeklySales)}</p>
          <p className="text-sm text-gray-400">Promedio Semanal</p>
        </div>

        <div className="rounded-xl border border-cyan-500/10 bg-gradient-to-br from-[#0a0f1a] to-[#0d1525] p-6 hover:border-cyan-500/30 transition-all">
          <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center mb-4">
            <ShoppingCart className="w-6 h-6 text-yellow-400" />
          </div>
          <p className="text-3xl font-bold text-white mb-1">{formatCurrency(stats.avgTicket)}</p>
          <p className="text-sm text-gray-400">Ticket Promedio</p>
        </div>

        <div className="rounded-xl border border-cyan-500/10 bg-gradient-to-br from-[#0a0f1a] to-[#0d1525] p-6 hover:border-cyan-500/30 transition-all">
          <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-4">
            <Package className="w-6 h-6 text-purple-400" />
          </div>
          <p className="text-3xl font-bold text-white mb-1">{stats.unitsSold.toLocaleString()}</p>
          <p className="text-sm text-gray-400">Unidades Vendidas</p>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Sales Trend */}
        <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Tendencia de Ventas Diarias</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.dailySales}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" stroke="#64748b" style={{ fontSize: 12 }} />
              <YAxis
                stroke="#64748b"
                style={{ fontSize: 12 }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{ backgroundColor: "#0a0f1a", border: "1px solid #06b6d4", borderRadius: 8 }}
                labelStyle={{ color: "#fff" }}
                formatter={(value: any) => formatCurrency(value)}
              />
              <Line type="monotone" dataKey="value" stroke="#06b6d4" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Sales by Weekday */}
        <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Ventas por Día de la Semana</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.salesByWeekday}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="day" stroke="#64748b" style={{ fontSize: 12 }} />
              <YAxis
                stroke="#64748b"
                style={{ fontSize: 12 }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{ backgroundColor: "#0a0f1a", border: "1px solid #06b6d4", borderRadius: 8 }}
                labelStyle={{ color: "#fff" }}
                formatter={(value: any) => formatCurrency(value)}
              />
              <Bar dataKey="value" fill="#06b6d4" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Top Productos por Ventas</h3>
          <div className="space-y-4">
            {stats.topProducts.map((product: any, i: number) => {
              const maxSales = stats.topProducts[0].sales
              const percentage = (product.sales / maxSales) * 100
              return (
                <div key={product.name}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white text-sm font-medium">{product.name}</span>
                    <div className="text-right">
                      <span className="text-white font-semibold">{formatCurrency(product.sales)}</span>
                      <span className="text-xs text-gray-500 ml-2">({product.units} un.)</span>
                    </div>
                  </div>
                  <div className="w-full h-3 rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: COLORS[i % COLORS.length],
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Sales by Category */}
        <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Ventas por Categoría</h3>
          <div className="space-y-4">
            {stats.salesByCategory.map((cat: any, i: number) => (
              <div key={cat.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-white text-sm font-medium">{cat.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-white font-semibold">{formatCurrency(cat.value)}</span>
                  <span className="text-sm text-gray-400 w-16 text-right">{cat.percent}%</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 h-4 rounded-full bg-white/5 overflow-hidden flex">
            {stats.salesByCategory.map((cat: any, i: number) => (
              <div
                key={cat.name}
                style={{
                  width: `${cat.percent}%`,
                  backgroundColor: COLORS[i % COLORS.length],
                }}
                className="h-full"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
