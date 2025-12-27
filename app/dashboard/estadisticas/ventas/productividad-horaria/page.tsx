"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Clock, TrendingUp, Calendar, Download, RefreshCw } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts"

export const dynamic = "force-dynamic"

export default function ProductividadHorariaPage() {
  const [period, setPeriod] = useState("7d")
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    loadStats()
  }, [period])

  const loadStats = async () => {
    setLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Mock data
    const salesByHour = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      sales: Math.floor(Math.random() * 80000) + 20000,
      tickets: Math.floor(Math.random() * 50) + 10,
    }))

    const peakHour = salesByHour.reduce((max, h) => (h.sales > max.sales ? h : max))
    const peakDay = "Viernes"

    setStats({
      ticketsPerHour: 28,
      salesPerHour: 42000,
      peakHour: peakHour.hour,
      peakDay,
      salesByHour,
      heatmapData: [
        { day: "Lun", hours: Array.from({ length: 24 }, (_, i) => ({ hour: i, value: Math.random() * 100 })) },
        { day: "Mar", hours: Array.from({ length: 24 }, (_, i) => ({ hour: i, value: Math.random() * 100 })) },
        { day: "Mié", hours: Array.from({ length: 24 }, (_, i) => ({ hour: i, value: Math.random() * 100 })) },
        { day: "Jue", hours: Array.from({ length: 24 }, (_, i) => ({ hour: i, value: Math.random() * 100 })) },
        { day: "Vie", hours: Array.from({ length: 24 }, (_, i) => ({ hour: i, value: Math.random() * 100 })) },
        { day: "Sáb", hours: Array.from({ length: 24 }, (_, i) => ({ hour: i, value: Math.random() * 100 })) },
        { day: "Dom", hours: Array.from({ length: 24 }, (_, i) => ({ hour: i, value: Math.random() * 100 })) },
      ],
    })
    setLoading(false)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(
      value,
    )
  }

  const getHeatColor = (value: number) => {
    if (value > 80) return "bg-red-500"
    if (value > 60) return "bg-orange-500"
    if (value > 40) return "bg-yellow-500"
    if (value > 20) return "bg-green-500"
    return "bg-blue-500/30"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-cyan-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Productividad Horaria</h1>
          <p className="text-gray-400 mt-1">Análisis de rendimiento por franja horaria</p>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-cyan-500/10 bg-gradient-to-br from-[#0a0f1a] to-[#0d1525] p-6">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center mb-4">
            <TrendingUp className="w-6 h-6 text-cyan-400" />
          </div>
          <p className="text-3xl font-bold text-white mb-1">{stats.ticketsPerHour}</p>
          <p className="text-sm text-gray-400">Tickets por Hora</p>
        </div>

        <div className="rounded-xl border border-cyan-500/10 bg-gradient-to-br from-[#0a0f1a] to-[#0d1525] p-6">
          <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center mb-4">
            <TrendingUp className="w-6 h-6 text-green-400" />
          </div>
          <p className="text-3xl font-bold text-white mb-1">{formatCurrency(stats.salesPerHour)}</p>
          <p className="text-sm text-gray-400">Ventas por Hora</p>
        </div>

        <div className="rounded-xl border border-cyan-500/10 bg-gradient-to-br from-[#0a0f1a] to-[#0d1525] p-6">
          <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center mb-4">
            <Clock className="w-6 h-6 text-yellow-400" />
          </div>
          <p className="text-3xl font-bold text-white mb-1">{stats.peakHour}:00</p>
          <p className="text-sm text-gray-400">Hora Pico</p>
        </div>

        <div className="rounded-xl border border-cyan-500/10 bg-gradient-to-br from-[#0a0f1a] to-[#0d1525] p-6">
          <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-4">
            <Calendar className="w-6 h-6 text-purple-400" />
          </div>
          <p className="text-3xl font-bold text-white mb-1">{stats.peakDay}</p>
          <p className="text-sm text-gray-400">Día Pico</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales by Hour */}
        <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Ventas por Hora</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.salesByHour}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="hour" stroke="#64748b" style={{ fontSize: 12 }} tickFormatter={(hour) => `${hour}h`} />
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
              <Bar dataKey="sales" fill="#06b6d4" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Tickets by Hour */}
        <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Tickets por Hora</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.salesByHour}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="hour" stroke="#64748b" style={{ fontSize: 12 }} tickFormatter={(hour) => `${hour}h`} />
              <YAxis stroke="#64748b" style={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{ backgroundColor: "#0a0f1a", border: "1px solid #10b981", borderRadius: 8 }}
                labelStyle={{ color: "#fff" }}
              />
              <Bar dataKey="tickets" fill="#10b981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Heatmap */}
      <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-6">
        <h3 className="text-lg font-semibold text-white mb-6">Mapa de Calor: Día de Semana vs Hora</h3>
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            <div className="flex gap-1 mb-2">
              <div className="w-16" />
              {Array.from({ length: 24 }, (_, i) => (
                <div key={i} className="w-8 text-center text-xs text-gray-500">
                  {i}
                </div>
              ))}
            </div>
            {stats.heatmapData.map((dayData: any) => (
              <div key={dayData.day} className="flex gap-1 mb-1">
                <div className="w-16 text-sm text-gray-400 flex items-center">{dayData.day}</div>
                {dayData.hours.map((hourData: any) => (
                  <div
                    key={hourData.hour}
                    className={`w-8 h-8 rounded ${getHeatColor(hourData.value)} cursor-pointer hover:opacity-80 transition-opacity`}
                    title={`${dayData.day} ${hourData.hour}:00 - ${hourData.value.toFixed(0)}%`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-center gap-4 mt-6">
          <span className="text-xs text-gray-500">Baja actividad</span>
          <div className="flex gap-1">
            <div className="w-6 h-6 rounded bg-blue-500/30" />
            <div className="w-6 h-6 rounded bg-green-500" />
            <div className="w-6 h-6 rounded bg-yellow-500" />
            <div className="w-6 h-6 rounded bg-orange-500" />
            <div className="w-6 h-6 rounded bg-red-500" />
          </div>
          <span className="text-xs text-gray-500">Alta actividad</span>
        </div>
      </div>

      {/* Intraday Trend */}
      <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-6">
        <h3 className="text-lg font-semibold text-white mb-6">Tendencia Intradía de Ventas</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={stats.salesByHour}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="hour" stroke="#64748b" style={{ fontSize: 12 }} tickFormatter={(hour) => `${hour}:00`} />
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
            <Line type="monotone" dataKey="sales" stroke="#06b6d4" strokeWidth={3} dot={{ fill: "#06b6d4", r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
