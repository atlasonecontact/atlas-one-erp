"use client"

import { useState } from "react"
import { DollarSign, ShoppingCart, TrendingUp, Activity } from "lucide-react"
import { GlobalFiltersComponent, type GlobalFilters } from "@/components/dashboard/global-filters"
import { KPICard } from "@/components/dashboard/kpi-card"
import { Card } from "@/components/ui/card"
import { subDays } from "date-fns"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

export const dynamic = "force-dynamic"

export default function ProductividadLocalPage() {
  const [filters, setFilters] = useState<GlobalFilters>({
    dateRange: {
      from: subDays(new Date(), 30),
      to: new Date(),
    },
  })

  // Mock data - En producción, m² vendría de configuración de sucursal
  const storeArea = 150 // metros cuadrados
  const benchmark = 2500 // benchmark de industria

  const kpis = {
    salesPerM2: {
      value: "$2,847",
      change: 12.5,
      sparkline: Array.from({ length: 7 }, (_, i) => ({ value: 2700 + Math.random() * 300 })),
    },
    ticketsPerM2: {
      value: "56.2",
      change: 8.3,
      sparkline: Array.from({ length: 7 }, (_, i) => ({ value: 50 + Math.random() * 10 })),
    },
    performance: {
      value: "113.9%",
      change: 3.8,
      sparkline: Array.from({ length: 7 }, (_, i) => ({ value: 110 + Math.random() * 8 })),
    },
    efficiency: {
      value: "Alta",
      change: 0,
      sparkline: Array.from({ length: 7 }, (_, i) => ({ value: 95 + Math.random() * 5 })),
    },
  }

  const salesPerM2OverTime = Array.from({ length: 30 }, (_, i) => ({
    date: `${i + 1}/12`,
    value: 2500 + Math.random() * 800,
    benchmark: benchmark,
  }))

  const branchComparison = [
    { branch: "Sucursal Centro", salesPerM2: 2847, area: 150, color: "#06b6d4" },
    { branch: "Sucursal Norte", salesPerM2: 2456, area: 180, color: "#8b5cf6" },
    { branch: "Sucursal Sur", salesPerM2: 2198, area: 200, color: "#10b981" },
    { branch: "Sucursal Oeste", salesPerM2: 3012, area: 120, color: "#f59e0b" },
  ]

  const performanceScore = ((Number.parseFloat(kpis.salesPerM2.value.replace(/[$,]/g, "")) / benchmark) * 100).toFixed(
    1,
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Productividad del Local</h1>
        <p className="text-gray-400">Análisis de eficiencia por metro cuadrado de superficie</p>
      </div>

      {/* Global Filters */}
      <div className="mb-8">
        <GlobalFiltersComponent filters={filters} onChange={setFilters} />
      </div>

      {/* Store Info Card */}
      <Card className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-cyan-500/20 p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-gray-400 text-sm mb-1">Superficie Total</div>
            <div className="text-3xl font-bold text-white">{storeArea} m²</div>
          </div>
          <div className="text-center">
            <div className="text-gray-400 text-sm mb-1">Ventas Totales</div>
            <div className="text-3xl font-bold text-cyan-400">$427,050</div>
          </div>
          <div className="text-center">
            <div className="text-gray-400 text-sm mb-1">Benchmark Industria</div>
            <div className="text-3xl font-bold text-gray-400">${benchmark}/m²</div>
          </div>
          <div className="text-center">
            <div className="text-gray-400 text-sm mb-1">Estado</div>
            <div className="text-2xl font-bold text-green-400 flex items-center justify-center gap-2">
              <Activity className="w-6 h-6" />
              Por encima
            </div>
          </div>
        </div>
      </Card>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard
          title="Ventas por m²"
          value={kpis.salesPerM2.value}
          change={kpis.salesPerM2.change}
          changeLabel="vs período anterior"
          icon={DollarSign}
          sparklineData={kpis.salesPerM2.sparkline}
        />
        <KPICard
          title="Tickets por m²"
          value={kpis.ticketsPerM2.value}
          change={kpis.ticketsPerM2.change}
          changeLabel="vs período anterior"
          icon={ShoppingCart}
          sparklineData={kpis.ticketsPerM2.sparkline}
        />
        <KPICard
          title="Performance vs Benchmark"
          value={kpis.performance.value}
          change={kpis.performance.change}
          changeLabel="del benchmark"
          icon={TrendingUp}
          sparklineData={kpis.performance.sparkline}
        />
        <KPICard
          title="Eficiencia"
          value={kpis.efficiency.value}
          change={kpis.efficiency.change}
          changeLabel="clasificación"
          icon={Activity}
          sparklineData={kpis.efficiency.sparkline}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales per m² Over Time */}
        <Card className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-cyan-500/20 p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <div className="h-6 w-1 bg-gradient-to-b from-cyan-400 to-cyan-600 rounded-full" />
            Ventas por m² - Tendencia
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesPerM2OverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                }}
              />
              <Line type="monotone" dataKey="value" stroke="#06b6d4" strokeWidth={3} name="Real" />
              <Line
                type="monotone"
                dataKey="benchmark"
                stroke="#ef4444"
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Benchmark"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Branch Comparison */}
        <Card className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-cyan-500/20 p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <div className="h-6 w-1 bg-gradient-to-b from-cyan-400 to-cyan-600 rounded-full" />
            Comparación por Sucursal
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={branchComparison} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis type="number" stroke="#9ca3af" />
              <YAxis dataKey="branch" type="category" stroke="#9ca3af" width={120} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="salesPerM2" radius={[0, 8, 8, 0]}>
                {branchComparison.map((entry, index) => (
                  <Bar key={`bar-${index}`} dataKey="salesPerM2" fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Performance Gauge */}
        <Card className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-cyan-500/20 p-6 lg:col-span-2">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <div className="h-6 w-1 bg-gradient-to-b from-cyan-400 to-cyan-600 rounded-full" />
            Indicador de Performance
          </h3>
          <div className="flex flex-col items-center justify-center py-8">
            <div className="relative w-64 h-32">
              {/* Gauge Background */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-full bg-gradient-to-r from-red-500/20 via-yellow-500/20 to-green-500/20 rounded-t-full" />
              </div>
              {/* Gauge Needle */}
              <div
                className="absolute bottom-0 left-1/2 w-2 h-24 bg-cyan-400 origin-bottom transition-transform duration-1000"
                style={{
                  transform: `translateX(-50%) rotate(${-90 + (Number.parseFloat(performanceScore) / 150) * 180}deg)`,
                }}
              />
              {/* Center Circle */}
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-gray-800 rounded-full border-4 border-cyan-400" />
            </div>
            <div className="mt-8 text-center">
              <div className="text-5xl font-bold text-white mb-2">{performanceScore}%</div>
              <div className="text-gray-400">del benchmark de industria</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Insights */}
      <Card className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-cyan-500/20 p-6 mt-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <div className="h-6 w-1 bg-gradient-to-b from-cyan-400 to-cyan-600 rounded-full" />
          Análisis de Productividad
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-500/10 p-4 rounded-lg border border-green-500/30">
            <div className="text-green-400 font-semibold mb-2">Performance Superior</div>
            <p className="text-gray-300 text-sm">
              Tu local está 13.9% por encima del benchmark de la industria. Esto indica excelente aprovechamiento del
              espacio.
            </p>
          </div>
          <div className="bg-cyan-500/10 p-4 rounded-lg border border-cyan-500/30">
            <div className="text-cyan-400 font-semibold mb-2">Oportunidad</div>
            <p className="text-gray-300 text-sm">
              La Sucursal Oeste tiene el mejor rendimiento con $3,012/m². Analizar sus prácticas podría optimizar otras
              sucursales.
            </p>
          </div>
          <div className="bg-purple-500/10 p-4 rounded-lg border border-purple-500/30">
            <div className="text-purple-400 font-semibold mb-2">Recomendación</div>
            <p className="text-gray-300 text-sm">
              La Sucursal Sur podría mejorar su layout. Con 200m², genera menos ventas/m² que locales más pequeños.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
