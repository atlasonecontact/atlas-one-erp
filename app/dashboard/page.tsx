"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { KPICardV2 } from "@/components/dashboard/kpi-card-v2"
import { AnalyticsChart } from "@/components/dashboard/analytics-chart"
import { CategoryMixChart } from "@/components/dashboard/category-mix-chart"
import { FinancialKPIs, InventoryKPIs, PerformanceKPIs, ControlKPIs } from "@/components/dashboard/financial-kpis"
import { SalesHistory } from "@/components/dashboard/sales-history"
import { SmartInsights } from "@/components/dashboard/smart-insights"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { 
  Plus, 
  Calendar, 
  TrendingUp, 
  Receipt, 
  Package,
  DollarSign,
  RefreshCw,
  Filter
} from "lucide-react"
import Link from "next/link"
import { useDashboardData } from "@/lib/hooks/use-dashboard-data"
import { useTheme } from "@/lib/theme-context"

export default function DashboardPage() {
  const [period, setPeriod] = useState("30d")
  const [view, setView] = useState<"overview" | "notifications" | "history">("overview")
  const { data, isLoading, refetch } = useDashboardData(period)
  const { config } = useTheme()

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(value)
  }

  // Get current date range for display
  const getDateRange = () => {
    const end = new Date()
    const start = new Date()
    if (period === "7d") start.setDate(end.getDate() - 7)
    else if (period === "30d") start.setDate(end.getDate() - 30)
    else if (period === "90d") start.setDate(end.getDate() - 90)
    
    const formatDate = (d: Date) => `${d.getDate()} ${d.toLocaleString('es', { month: 'short' })}`
    return `${formatDate(start)} - ${formatDate(end)}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <div className="flex items-center gap-4 mt-1">
            <button 
              onClick={() => setView("overview")}
              className={`text-sm ${view === "overview" ? "text-cyan-400 border-b-2 border-cyan-400" : "text-gray-400 hover:text-white"} pb-1`}
            >
              Overview
            </button>
            <button 
              onClick={() => setView("notifications")}
              className={`text-sm ${view === "notifications" ? "text-cyan-400 border-b-2 border-cyan-400" : "text-gray-400 hover:text-white"} pb-1 flex items-center gap-1`}
            >
              Notificaciones
              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <button 
              onClick={() => setView("history")}
              className={`text-sm ${view === "history" ? "text-cyan-400 border-b-2 border-cyan-400" : "text-gray-400 hover:text-white"} pb-1`}
            >
              Historial
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Date Range Picker */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#0a0f1a] border border-cyan-500/20">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-white">{getDateRange()}</span>
          </div>

          {/* Period Selector */}
          <div className="flex items-center gap-1 bg-[#0a0f1a] border border-cyan-500/20 rounded-lg p-1">
            {["7d", "30d", "90d"].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  period === p ? "bg-cyan-500/20 text-cyan-400" : "text-gray-400 hover:text-white"
                }`}
              >
                {p === "7d" ? "7D" : p === "30d" ? "30D" : "90D"}
              </button>
            ))}
          </div>

          {/* Filter Button */}
          <Button variant="outline" size="sm" className="border-cyan-500/20 text-gray-400 bg-[#0a0f1a]">
            <Filter className="w-4 h-4 mr-2" />
            Filtrar
          </Button>

          {/* Refresh */}
          <Button
            variant="ghost"
            size="icon"
            onClick={refetch}
            disabled={isLoading}
            className="text-gray-400 hover:text-white"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>

          {/* New Sale */}
          <Link href="/dashboard/ventas">
            <Button className="font-semibold gap-2 text-black bg-cyan-500 hover:bg-cyan-400">
              <Plus className="w-4 h-4" />
              Nueva Venta
            </Button>
          </Link>
        </div>
      </div>

      {/* Top KPIs Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICardV2
          title="Total Facturado"
          value={data.monthSales}
          prefix="$"
          change={data.monthSalesChange}
          changeLabel="Comparado con el mes pasado"
          icon={<DollarSign className="w-5 h-5" />}
          variant="primary"
          isLoading={isLoading}
        />
        <KPICardV2
          title="Unidades Vendidas"
          value={data.unitsSold || 7845}
          change={9.8}
          changeLabel="Comparado con el mes pasado"
          icon={<Package className="w-5 h-5" />}
          isLoading={isLoading}
        />
        <KPICardV2
          title="Ticket Promedio"
          value={data.avgTicket}
          prefix="$"
          change={data.avgTicketChange}
          changeLabel="Comparado con el mes pasado"
          icon={<Receipt className="w-5 h-5" />}
          isLoading={isLoading}
        />
        <KPICardV2
          title="Tasa de Conversión"
          value={12.5}
          suffix="%"
          change={8.6}
          changeLabel="Comparado con el mes pasado"
          icon={<TrendingUp className="w-5 h-5" />}
          variant="success"
          isLoading={isLoading}
        />
      </div>

      {/* Main Content - 3 column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Category Mix */}
        <div className="space-y-6">
          <CategoryMixChart isLoading={isLoading} />
          <FinancialKPIs isLoading={isLoading} />
        </div>

        {/* Center column - Analytics Chart + Performance */}
        <div className="lg:col-span-2 space-y-6">
          <AnalyticsChart 
            title="Analítica"
            subtitle="Últimos 12 Meses"
            isLoading={isLoading}
          />
          
          {/* Bottom KPIs Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InventoryKPIs isLoading={isLoading} />
            <PerformanceKPIs isLoading={isLoading} />
            <ControlKPIs isLoading={isLoading} />
          </div>
        </div>
      </div>

      {/* Sales History Table */}
      <SalesHistory isLoading={isLoading} />

      {/* Smart Insights + Alerts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SmartInsights data={data} isLoading={isLoading} />
        
        {/* Low Stock Alert */}
        <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                <Package className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-white">Avisos de Stock Bajo</h3>
                <p className="text-xs text-gray-500">Productos que requieren atención</p>
              </div>
            </div>
            <Link href="/dashboard/stock">
              <Button variant="ghost" size="sm" className="text-cyan-400 hover:text-cyan-300">
                Ver todo
              </Button>
            </Link>
          </div>
          
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 rounded-lg bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : data.lowStockProducts.length > 0 ? (
            <div className="space-y-2">
              {data.lowStockProducts.slice(0, 4).map((product) => (
                <div
                  key={product.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    product.stock <= 5 ? "bg-red-500/10 border-red-500/20" : "bg-yellow-500/10 border-yellow-500/20"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      product.stock <= 5 ? "bg-red-500/20" : "bg-yellow-500/20"
                    }`}>
                      <Package className={`w-4 h-4 ${product.stock <= 5 ? "text-red-400" : "text-yellow-400"}`} />
                    </div>
                    <span className="text-sm text-white">{product.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-bold ${product.stock <= 5 ? "text-red-400" : "text-yellow-400"}`}>
                      {product.stock} unid.
                    </span>
                    <span className="text-xs text-gray-500">
                      {product.stock <= 5 ? "Crítico" : `${Math.ceil(product.stock / 2)} días`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mb-3">
                <Package className="w-6 h-6 text-green-400" />
              </div>
              <p className="text-sm text-gray-400">¡Todo en orden!</p>
              <p className="text-xs text-gray-500">No hay productos con stock bajo</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <RecentActivity sales={data.recentSales} isLoading={isLoading} />
    </div>
  )
}
