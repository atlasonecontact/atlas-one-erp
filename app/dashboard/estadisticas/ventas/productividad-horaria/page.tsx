"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Clock, TrendingUp, Calendar, Download, RefreshCw } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts"
import { formatCurrency } from "@/lib/utils/currency"
import { useTickets, ymdToday, shiftYmd, WEEKDAYS_SHORT, WEEKDAYS_LONG, WEEK_ORDER, moneyTick } from "@/lib/analytics/tickets"

export const dynamic = "force-dynamic"

export default function ProductividadHorariaPage() {
  const [period, setPeriod] = useState("7d")
  const days = period === "7d" ? 7 : period === "30d" ? 30 : 90
  const today = ymdToday()
  const from = shiftYmd(today, -(days - 1))
  const { tickets, loading, error } = useTickets(from, today, false)

  const stats = useMemo(() => {
    const salesByHour = Array.from({ length: 24 }, (_, hour) => ({ hour, sales: 0, tickets: 0 }))
    const byWeekday = Array.from({ length: 7 }, () => 0)
    const grid = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0))
    const buckets = new Set<string>()

    tickets.forEach((t) => {
      salesByHour[t.hour].sales += t.total
      salesByHour[t.hour].tickets += 1
      byWeekday[t.weekday] += t.total
      grid[t.weekday][t.hour] += 1
      buckets.add(`${t.day}|${t.hour}`)
    })

    const totalSales = tickets.reduce((a, t) => a + t.total, 0)
    const activeHours = buckets.size
    const peak = salesByHour.reduce((max, h) => (h.sales > max.sales ? h : max), salesByHour[0])
    const peakDayIdx = byWeekday.reduce((best, v, i) => (v > byWeekday[best] ? i : best), 0)
    const maxCell = Math.max(1, ...grid.flat())

    return {
      ticketsPerHour: activeHours > 0 ? Math.round((tickets.length / activeHours) * 10) / 10 : 0,
      salesPerHour: activeHours > 0 ? totalSales / activeHours : 0,
      peakHour: totalSales > 0 ? peak.hour : null,
      peakDay: totalSales > 0 ? WEEKDAYS_LONG[peakDayIdx] : "-",
      salesByHour,
      heatmapData: WEEK_ORDER.map((d) => ({
        day: WEEKDAYS_SHORT[d],
        hours: grid[d].map((count, hour) => ({ hour, count, value: (count / maxCell) * 100 })),
      })),
      hasSales: tickets.length > 0,
    }
  }, [tickets])

  const exportCsv = () => {
    const rows = [["Hora", "Ventas", "Tickets"], ...stats.salesByHour.map((h) => [`${h.hour}:00`, String(h.sales), String(h.tickets)])]
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(";")).join("\r\n")
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `productividad_horaria_${from}_${today}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getHeatColor = (value: number, count: number) => {
    if (count === 0) return "bg-white/5"
    if (value > 80) return "bg-red-500"
    if (value > 60) return "bg-orange-500"
    if (value > 40) return "bg-yellow-500"
    if (value > 20) return "bg-green-500"
    return "bg-blue-500/50"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-cyan-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-white">Productividad Horaria</h1>
          <p className="text-gray-400 mt-1">Análisis de rendimiento por franja horaria, con tus ventas reales</p>
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
            onClick={exportCsv}
            className="gap-2 border-cyan-500/20 text-cyan-400 bg-transparent hover:bg-cyan-500/10"
          >
            <Download className="w-4 h-4" />
            Exportar
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          No se pudieron cargar las ventas: {error}
        </div>
      )}
      {!error && !stats.hasSales && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
          No hay ventas en los últimos {days} días.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-cyan-500/10 bg-gradient-to-br from-[#0a0f1a] to-[#0d1525] p-6">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center mb-4">
            <TrendingUp className="w-6 h-6 text-cyan-400" />
          </div>
          <p className="text-3xl font-bold text-white mb-1">{stats.ticketsPerHour}</p>
          <p className="text-sm text-gray-400">Tickets por Hora</p>
          <p className="text-xs text-gray-500 mt-1">Por hora con ventas</p>
        </div>

        <div className="rounded-xl border border-cyan-500/10 bg-gradient-to-br from-[#0a0f1a] to-[#0d1525] p-6">
          <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center mb-4">
            <TrendingUp className="w-6 h-6 text-green-400" />
          </div>
          <p className="text-3xl font-bold text-white mb-1">{formatCurrency(stats.salesPerHour)}</p>
          <p className="text-sm text-gray-400">Ventas por Hora</p>
          <p className="text-xs text-gray-500 mt-1">Por hora con ventas</p>
        </div>

        <div className="rounded-xl border border-cyan-500/10 bg-gradient-to-br from-[#0a0f1a] to-[#0d1525] p-6">
          <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center mb-4">
            <Clock className="w-6 h-6 text-yellow-400" />
          </div>
          <p className="text-3xl font-bold text-white mb-1">{stats.peakHour === null ? "-" : `${stats.peakHour}:00`}</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Ventas por Hora</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.salesByHour}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="hour" stroke="#64748b" style={{ fontSize: 12 }} tickFormatter={(hour) => `${hour}h`} interval={1} />
              <YAxis stroke="#64748b" style={{ fontSize: 12 }} tickFormatter={moneyTick} />
              <Tooltip
                contentStyle={{ backgroundColor: "#0a0f1a", border: "1px solid #06b6d4", borderRadius: 8 }}
                labelStyle={{ color: "#fff" }}
                labelFormatter={(hour) => `${hour}:00`}
                formatter={(value: any) => formatCurrency(Number(value))}
              />
              <Bar dataKey="sales" fill="#06b6d4" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Tickets por Hora</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.salesByHour}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="hour" stroke="#64748b" style={{ fontSize: 12 }} tickFormatter={(hour) => `${hour}h`} interval={1} />
              <YAxis stroke="#64748b" style={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: "#0a0f1a", border: "1px solid #10b981", borderRadius: 8 }}
                labelStyle={{ color: "#fff" }}
                labelFormatter={(hour) => `${hour}:00`}
              />
              <Bar dataKey="tickets" fill="#10b981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

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
            {stats.heatmapData.map((dayData) => (
              <div key={dayData.day} className="flex gap-1 mb-1">
                <div className="w-16 text-sm text-gray-400 flex items-center">{dayData.day}</div>
                {dayData.hours.map((hourData) => (
                  <div
                    key={hourData.hour}
                    className={`w-8 h-8 rounded ${getHeatColor(hourData.value, hourData.count)} cursor-pointer hover:opacity-80 transition-opacity`}
                    title={`${dayData.day} ${hourData.hour}:00 - ${hourData.count} ticket${hourData.count === 1 ? "" : "s"}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-center gap-4 mt-6">
          <span className="text-xs text-gray-500">Baja actividad</span>
          <div className="flex gap-1">
            <div className="w-6 h-6 rounded bg-blue-500/50" />
            <div className="w-6 h-6 rounded bg-green-500" />
            <div className="w-6 h-6 rounded bg-yellow-500" />
            <div className="w-6 h-6 rounded bg-orange-500" />
            <div className="w-6 h-6 rounded bg-red-500" />
          </div>
          <span className="text-xs text-gray-500">Alta actividad</span>
        </div>
      </div>

      <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-6">
        <h3 className="text-lg font-semibold text-white mb-6">Tendencia Intradía de Ventas</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={stats.salesByHour}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="hour" stroke="#64748b" style={{ fontSize: 12 }} tickFormatter={(hour) => `${hour}:00`} interval={1} />
            <YAxis stroke="#64748b" style={{ fontSize: 12 }} tickFormatter={moneyTick} />
            <Tooltip
              contentStyle={{ backgroundColor: "#0a0f1a", border: "1px solid #06b6d4", borderRadius: 8 }}
              labelStyle={{ color: "#fff" }}
              labelFormatter={(hour) => `${hour}:00`}
              formatter={(value: any) => formatCurrency(Number(value))}
            />
            <Line type="monotone" dataKey="sales" stroke="#06b6d4" strokeWidth={3} dot={{ fill: "#06b6d4", r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
