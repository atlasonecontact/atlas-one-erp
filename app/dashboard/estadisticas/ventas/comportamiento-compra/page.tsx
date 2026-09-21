"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { DollarSign, ShoppingCart, TrendingUp } from "lucide-react"
import { GlobalFiltersComponent, type GlobalFilters } from "@/components/dashboard/global-filters"
import { KPICard } from "@/components/dashboard/kpi-card"
import { Card } from "@/components/ui/card"
import { DemoDataBanner } from "@/components/ui/demo-data-banner"
import { subDays } from "date-fns"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis,
} from "recharts"

export const dynamic = "force-dynamic"

export default function ComportamientoCompraPage() {
  const router = useRouter()
  const [filters, setFilters] = useState<GlobalFilters>({
    dateRange: {
      from: subDays(new Date(), 30),
      to: new Date(),
    },
  })

  // Mock data - Análisis de comportamiento de compra
  const kpis = {
    avgTicket: {
      value: "$146.32",
      change: 3.8,
      sparkline: Array.from({ length: 7 }, (_, i) => ({ value: 140 + Math.random() * 15 })),
    },
    unitsPerTicket: {
      value: "2.91",
      change: 6.1,
      sparkline: Array.from({ length: 7 }, (_, i) => ({ value: 2.5 + Math.random() * 0.6 })),
    },
    purchaseFrequency: {
      value: "1.8",
      change: -2.3,
      sparkline: Array.from({ length: 7 }, (_, i) => ({ value: 1.6 + Math.random() * 0.4 })),
    },
  }

  // Distribución de valores de ticket (simulando boxplot con barras)
  const ticketDistribution = [
    { range: "$0-50", count: 1234, color: "#ef4444" },
    { range: "$51-100", count: 2567, color: "#f59e0b" },
    { range: "$101-150", count: 3456, color: "#10b981" },
    { range: "$151-200", count: 2890, color: "#06b6d4" },
    { range: "$201-300", count: 1678, color: "#8b5cf6" },
    { range: "$301+", count: 567, color: "#ec4899" },
  ]

  // Distribución de unidades por ticket
  const unitsDistribution = Array.from({ length: 10 }, (_, i) => ({
    units: `${i + 1}`,
    tickets: Math.floor(Math.random() * 1500) + 500,
  }))

  // Frecuencia de compra over time
  const frequencyOverTime = Array.from({ length: 30 }, (_, i) => ({
    date: `${i + 1}/12`,
    frequency: 1.5 + Math.random() * 0.8,
  }))

  // Scatter data para análisis de ticket vs unidades
  const scatterData = Array.from({ length: 100 }, () => ({
    ticketValue: Math.random() * 300 + 20,
    units: Math.floor(Math.random() * 8) + 1,
    size: Math.random() * 100 + 50,
  }))

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-8">
      <DemoDataBanner />
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Comportamiento de Compra</h1>
        <p className="text-gray-400">Análisis de patrones de compra y oportunidades de upsell</p>
      </div>

      {/* Global Filters */}
      <div className="mb-8">
        <GlobalFiltersComponent filters={filters} onChange={setFilters} />
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <KPICard
          title="Ticket Promedio"
          value={kpis.avgTicket.value}
          change={kpis.avgTicket.change}
          changeLabel="vs período anterior"
          icon={DollarSign}
          sparklineData={kpis.avgTicket.sparkline}
          onClick={() => router.push("/dashboard/estadisticas/ventas/tickets")}
        />
        <KPICard
          title="Unidades por Ticket"
          value={kpis.unitsPerTicket.value}
          change={kpis.unitsPerTicket.change}
          changeLabel="vs período anterior"
          icon={ShoppingCart}
          sparklineData={kpis.unitsPerTicket.sparkline}
        />
        <KPICard
          title="Frecuencia de Compra"
          value={kpis.purchaseFrequency.value}
          change={kpis.purchaseFrequency.change}
          changeLabel="compras/día por cliente"
          icon={TrendingUp}
          sparklineData={kpis.purchaseFrequency.sparkline}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ticket Value Distribution */}
        <Card className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-cyan-500/20 p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <div className="h-6 w-1 bg-gradient-to-b from-cyan-400 to-cyan-600 rounded-full" />
            Distribución de Valores de Ticket
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ticketDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="range" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                {ticketDistribution.map((entry, index) => (
                  <Bar key={`bar-${index}`} dataKey="count" fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Units per Ticket Distribution */}
        <Card className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-cyan-500/20 p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <div className="h-6 w-1 bg-gradient-to-b from-cyan-400 to-cyan-600 rounded-full" />
            Unidades por Ticket
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={unitsDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="units" stroke="#9ca3af" label={{ value: "Unidades", position: "insideBottom" }} />
              <YAxis stroke="#9ca3af" label={{ value: "Tickets", angle: -90, position: "insideLeft" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="tickets" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Purchase Frequency Over Time */}
        <Card className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-cyan-500/20 p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <div className="h-6 w-1 bg-gradient-to-b from-cyan-400 to-cyan-600 rounded-full" />
            Frecuencia de Compra Over Time
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={frequencyOverTime}>
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
              <Line type="monotone" dataKey="frequency" stroke="#10b981" strokeWidth={3} dot={{ fill: "#10b981" }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Ticket Value vs Units Scatter */}
        <Card className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-cyan-500/20 p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <div className="h-6 w-1 bg-gradient-to-b from-cyan-400 to-cyan-600 rounded-full" />
            Valor de Ticket vs Unidades
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="units"
                type="number"
                stroke="#9ca3af"
                label={{ value: "Unidades", position: "insideBottom" }}
              />
              <YAxis
                dataKey="ticketValue"
                type="number"
                stroke="#9ca3af"
                label={{ value: "Valor ($)", angle: -90, position: "insideLeft" }}
              />
              <ZAxis dataKey="size" range={[50, 400]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                }}
                cursor={{ strokeDasharray: "3 3" }}
              />
              <Scatter data={scatterData} fill="#06b6d4" fillOpacity={0.6} />
            </ScatterChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Insights Section */}
      <Card className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-cyan-500/20 p-6 mt-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <div className="h-6 w-1 bg-gradient-to-b from-cyan-400 to-cyan-600 rounded-full" />
          Insights y Oportunidades
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-800/50 p-4 rounded-lg border border-green-500/30">
            <div className="text-green-400 font-semibold mb-2">Oportunidad de Upsell</div>
            <p className="text-gray-300 text-sm">
              El 45% de los tickets tienen 2 unidades o menos. Implementar bundles podría aumentar el ticket promedio un
              15%.
            </p>
          </div>
          <div className="bg-gray-800/50 p-4 rounded-lg border border-cyan-500/30">
            <div className="text-cyan-400 font-semibold mb-2">Patrón de Compra</div>
            <p className="text-gray-300 text-sm">
              Los tickets entre $101-150 representan el 41% del volumen. Esta es tu zona de confort de pricing.
            </p>
          </div>
          <div className="bg-gray-800/50 p-4 rounded-lg border border-purple-500/30">
            <div className="text-purple-400 font-semibold mb-2">Frecuencia</div>
            <p className="text-gray-300 text-sm">
              La frecuencia de compra ha bajado 2.3%. Considera programas de lealtad para aumentar visitas recurrentes.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
