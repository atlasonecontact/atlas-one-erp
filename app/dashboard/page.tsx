"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { KPICard } from "@/components/dashboard/kpi-card"
import { SalesChart } from "@/components/dashboard/sales-chart"
import { TopProductsChart } from "@/components/dashboard/top-products-chart"
import { SmartInsights } from "@/components/dashboard/smart-insights"
import { MarginChart } from "@/components/dashboard/margin-chart"
import { HeatmapChart } from "@/components/dashboard/heatmap-chart"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { Plus, Calendar, TrendingUp, Receipt, Star, AlertTriangle, RefreshCw } from "lucide-react"
import Link from "next/link"
import { useDashboardData } from "@/lib/hooks/use-dashboard-data"
import { useTheme } from "@/lib/theme-context"

export default function DashboardPage() {
  const [period, setPeriod] = useState("30d")
  const { data, isLoading, refetch } = useDashboardData(period)
  const { config } = useTheme()

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(
      value,
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 text-sm">Resumen de tu negocio en tiempo real</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={refetch}
            disabled={isLoading}
            className="text-gray-400 hover:text-white"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
          <div
            className="flex items-center gap-1 bg-[#0a0f1a] border rounded-lg p-1"
            style={{ borderColor: config.border }}
          >
            {["7d", "30d", "90d"].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  period === p ? "text-white" : "text-gray-400 hover:text-white"
                }`}
                style={period === p ? { backgroundColor: config.primaryMuted, color: config.primary } : {}}
              >
                {p === "7d" ? "7 días" : p === "30d" ? "30 días" : "90 días"}
              </button>
            ))}
          </div>
          <Link href="/dashboard/ventas">
            <Button className="font-semibold gap-2 text-black" style={{ backgroundColor: config.primary }}>
              <Plus className="w-4 h-4" />
              Nueva Venta
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Ventas del día"
          value={formatCurrency(data.todaySales)}
          change={data.todaySalesChange}
          changeLabel="vs ayer"
          icon={<TrendingUp className="w-5 h-5" />}
          isLoading={isLoading}
        />
        <KPICard
          title="Ticket promedio"
          value={formatCurrency(data.avgTicket)}
          change={data.avgTicketChange}
          changeLabel="vs promedio"
          icon={<Receipt className="w-5 h-5" />}
          isLoading={isLoading}
        />
        <KPICard
          title="Ventas del mes"
          value={formatCurrency(data.monthSales)}
          change={data.monthSalesChange}
          changeLabel="vs mes anterior"
          icon={<Calendar className="w-5 h-5" />}
          isLoading={isLoading}
        />
        <KPICard
          title="Producto top"
          value={data.topProduct}
          subtitle={`${data.topProductCount} productos`}
          icon={<Star className="w-5 h-5" />}
          isHighlight
          isLoading={isLoading}
        />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales chart - spans 2 columns */}
        <div className="lg:col-span-2">
          <SalesChart data={data.salesTrend} isLoading={isLoading} />
        </div>

        {/* Smart Insights */}
        <div>
          <SmartInsights data={data} isLoading={isLoading} />
        </div>
      </div>

      {/* Bottom section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Margin Chart */}
        <MarginChart value={data.margin} isLoading={isLoading} />

        {/* Top Products */}
        <TopProductsChart data={data.topProducts} isLoading={isLoading} />

        {/* Heatmap */}
        <HeatmapChart />

        {/* Low Stock Alert */}
        <div className="rounded-xl border bg-[#0a0f1a] p-5" style={{ borderColor: config.border }}>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            <h3 className="text-sm font-medium text-white">Stock Bajo</h3>
          </div>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 rounded-lg bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : data.lowStockProducts.length > 0 ? (
            <div className="space-y-3">
              {data.lowStockProducts.map((product) => (
                <div
                  key={product.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    product.stock <= 5 ? "bg-red-500/10 border-red-500/20" : "bg-yellow-500/10 border-yellow-500/20"
                  }`}
                >
                  <span className="text-sm text-white truncate">{product.name}</span>
                  <span className={`text-xs ${product.stock <= 5 ? "text-red-400" : "text-yellow-400"}`}>
                    {product.stock} unid.
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">No hay productos con stock bajo</p>
          )}
          <Link href="/dashboard/stock">
            <Button variant="ghost" className="w-full mt-4 hover:bg-opacity-10" style={{ color: config.primary }}>
              Ver todo el stock
            </Button>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <RecentActivity sales={data.recentSales} isLoading={isLoading} />
    </div>
  )
}
