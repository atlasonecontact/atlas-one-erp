"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { DollarSign, ShoppingCart, Package, Clock, TrendingUp, BarChart3, ShoppingBag } from "lucide-react"
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
  Cell,
  PieChart,
  Pie,
} from "recharts"

export const dynamic = "force-dynamic"

export default function ExecutiveOverviewPage() {
  const router = useRouter()
  const [filters, setFilters] = useState<GlobalFilters>({
    dateRange: {
      from: subDays(new Date(), 30),
      to: new Date(),
    },
  })

  // Mock data - En producción, esto vendría de Supabase con los filtros aplicados
  const kpis = {
    totalSales: {
      value: "$1,234,567",
      change: 12.5,
      sparkline: Array.from({ length: 7 }, (_, i) => ({ value: 50000 + Math.random() * 20000 })),
    },
    totalTickets: {
      value: "8,432",
      change: 8.3,
      sparkline: Array.from({ length: 7 }, (_, i) => ({ value: 1000 + Math.random() * 200 })),
    },
    avgTicket: {
      value: "$146",
      change: 3.8,
      sparkline: Array.from({ length: 7 }, (_, i) => ({ value: 140 + Math.random() * 15 })),
    },
    unitsSold: {
      value: "24,567",
      change: 15.2,
      sparkline: Array.from({ length: 7 }, (_, i) => ({ value: 3000 + Math.random() * 500 })),
    },
    ticketsPerHour: {
      value: "35.2",
      change: 5.4,
      sparkline: Array.from({ length: 7 }, (_, i) => ({ value: 30 + Math.random() * 8 })),
    },
    salesPerHour: {
      value: "$5,144",
      change: 9.7,
      sparkline: Array.from({ length: 7 }, (_, i) => ({ value: 4500 + Math.random() * 1000 })),
    },
    unitsPerTicket: {
      value: "2.91",
      change: 6.1,
      sparkline: Array.from({ length: 7 }, (_, i) => ({ value: 2.5 + Math.random() * 0.6 })),
    },
    salesPerM2: {
      value: "$2,847",
      change: -2.3,
      sparkline: Array.from({ length: 7 }, (_, i) => ({ value: 2700 + Math.random() * 300 })),
    },
  }

  const dailySalesData = Array.from({ length: 30 }, (_, i) => ({
    date: `${i + 1}/12`,
    sales: 35000 + Math.random() * 15000,
  }))

  const hourlyData = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}:00`,
    sales: Math.random() * 8000 + 2000,
    tickets: Math.random() * 50 + 10,
  }))

  const shiftData = [
    { shift: "Mañana", sales: 345000, tickets: 2450 },
    { shift: "Tarde", sales: 567000, tickets: 3890 },
    { shift: "Noche", sales: 234000, tickets: 2093 },
  ]

  const sellerData = [
    { name: "Juan Pérez", sales: 187000, tickets: 1245 },
    { name: "María García", sales: 156000, tickets: 1089 },
    { name: "Carlos Rodríguez", sales: 134000, tickets: 978 },
    { name: "Ana Martínez", sales: 123000, tickets: 867 },
    { name: "Luis González", sales: 98000, tickets: 743 },
  ]

  const categoryData = [
    { name: "Bebidas", value: 456000, color: "#06b6d4" },
    { name: "Snacks", value: 289000, color: "#8b5cf6" },
    { name: "Cigarrillos", value: 234000, color: "#f59e0b" },
    { name: "Golosinas", value: 167000, color: "#10b981" },
    { name: "Otros", value: 88000, color: "#ef4444" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-8">
      <DemoDataBanner />
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Executive Overview</h1>
        <p className="text-gray-400">Vista ejecutiva de rendimiento y eficiencia del negocio</p>
      </div>

      {/* Global Filters */}
      <div className="mb-8">
        <GlobalFiltersComponent filters={filters} onChange={setFilters} />
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard
          title="Ventas Totales"
          value={kpis.totalSales.value}
          change={kpis.totalSales.change}
          changeLabel="vs período anterior"
          icon={DollarSign}
          sparklineData={kpis.totalSales.sparkline}
          onClick={() => router.push("/dashboard/estadisticas/ventas/overview")}
        />
        <KPICard
          title="Total Tickets"
          value={kpis.totalTickets.value}
          change={kpis.totalTickets.change}
          changeLabel="vs período anterior"
          icon={ShoppingCart}
          sparklineData={kpis.totalTickets.sparkline}
          onClick={() => router.push("/dashboard/estadisticas/ventas/tickets")}
        />
        <KPICard
          title="Ticket Promedio"
          value={kpis.avgTicket.value}
          change={kpis.avgTicket.change}
          changeLabel="vs período anterior"
          icon={BarChart3}
          sparklineData={kpis.avgTicket.sparkline}
          onClick={() => router.push("/dashboard/estadisticas/ventas/comportamiento-compra")}
        />
        <KPICard
          title="Unidades Vendidas"
          value={kpis.unitsSold.value}
          change={kpis.unitsSold.change}
          changeLabel="vs período anterior"
          icon={Package}
          sparklineData={kpis.unitsSold.sparkline}
        />
        <KPICard
          title="Tickets por Hora"
          value={kpis.ticketsPerHour.value}
          change={kpis.ticketsPerHour.change}
          changeLabel="vs período anterior"
          icon={Clock}
          sparklineData={kpis.ticketsPerHour.sparkline}
          onClick={() => router.push("/dashboard/estadisticas/ventas/productividad-horaria")}
        />
        <KPICard
          title="Ventas por Hora"
          value={kpis.salesPerHour.value}
          change={kpis.salesPerHour.change}
          changeLabel="vs período anterior"
          icon={TrendingUp}
          sparklineData={kpis.salesPerHour.sparkline}
          onClick={() => router.push("/dashboard/estadisticas/ventas/productividad-horaria")}
        />
        <KPICard
          title="Unidades por Ticket"
          value={kpis.unitsPerTicket.value}
          change={kpis.unitsPerTicket.change}
          changeLabel="vs período anterior"
          icon={ShoppingBag}
          sparklineData={kpis.unitsPerTicket.sparkline}
          onClick={() => router.push("/dashboard/estadisticas/ventas/comportamiento-compra")}
        />
        <KPICard
          title="Ventas por m²"
          value={kpis.salesPerM2.value}
          change={kpis.salesPerM2.change}
          changeLabel="vs período anterior"
          icon={BarChart3}
          sparklineData={kpis.salesPerM2.sparkline}
          onClick={() => router.push("/dashboard/estadisticas/ventas/productividad-local")}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Sales Trend */}
        <Card className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-cyan-500/20 p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <div className="h-6 w-1 bg-gradient-to-b from-cyan-400 to-cyan-600 rounded-full" />
            Tendencia de Ventas Diarias
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailySalesData}>
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
              <Line type="monotone" dataKey="sales" stroke="#06b6d4" strokeWidth={3} dot={{ fill: "#06b6d4" }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Sales by Category */}
        <Card className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-cyan-500/20 p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <div className="h-6 w-1 bg-gradient-to-b from-cyan-400 to-cyan-600 rounded-full" />
            Ventas por Categoría
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Sales by Hour */}
        <Card className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-cyan-500/20 p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <div className="h-6 w-1 bg-gradient-to-b from-cyan-400 to-cyan-600 rounded-full" />
            Ventas por Hora
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="hour" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="sales" fill="#06b6d4" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Sales by Shift */}
        <Card className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-cyan-500/20 p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <div className="h-6 w-1 bg-gradient-to-b from-cyan-400 to-cyan-600 rounded-full" />
            Ventas por Turno
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={shiftData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis type="number" stroke="#9ca3af" />
              <YAxis dataKey="shift" type="category" stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="sales" fill="#8b5cf6" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Top Sellers */}
        <Card className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-cyan-500/20 p-6 lg:col-span-2">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <div className="h-6 w-1 bg-gradient-to-b from-cyan-400 to-cyan-600 rounded-full" />
            Top Vendedores
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={sellerData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis type="number" stroke="#9ca3af" />
              <YAxis dataKey="name" type="category" stroke="#9ca3af" width={150} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="sales" fill="#10b981" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  )
}
