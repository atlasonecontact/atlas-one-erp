"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Trophy, TrendingUp, Users, Clock, Download, RefreshCw } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { DemoDataBanner } from "@/components/ui/demo-data-banner"

export const dynamic = "force-dynamic"

const SELLERS = ["Juan Pérez", "María García", "Carlos Rodríguez", "Ana Martínez", "Lucía Fernández"]
const SHIFTS = ["Mañana", "Tarde", "Noche"] as const

const SHIFT_COLORS: Record<string, string> = {
  Mañana: "#06b6d4",
  Tarde: "#8b5cf6",
  Noche: "#f59e0b",
}

interface ShiftSales {
  shift: string
  sales: number
  tickets: number
}

interface SellerStats {
  seller: string
  total: number
  tickets: number
  byShift: ShiftSales[]
}

export default function DesempenoVendedorPage() {
  const [period, setPeriod] = useState("7d")
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<{ sellers: SellerStats[]; byShiftTotals: ShiftSales[] } | null>(null)

  useEffect(() => {
    loadStats()
  }, [period])

  const loadStats = async () => {
    setLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Mock data - En producción vendría de Supabase (sales.employee_id + cash_registers como turno)
    const sellers: SellerStats[] = SELLERS.map((seller) => {
      const byShift = SHIFTS.map((shift) => ({
        shift,
        sales: Math.floor(Math.random() * 60000) + 15000,
        tickets: Math.floor(Math.random() * 40) + 5,
      }))
      return {
        seller,
        total: byShift.reduce((sum, s) => sum + s.sales, 0),
        tickets: byShift.reduce((sum, s) => sum + s.tickets, 0),
        byShift,
      }
    }).sort((a, b) => b.total - a.total)

    const byShiftTotals: ShiftSales[] = SHIFTS.map((shift) => ({
      shift,
      sales: sellers.reduce((sum, s) => sum + (s.byShift.find((b) => b.shift === shift)?.sales ?? 0), 0),
      tickets: sellers.reduce((sum, s) => sum + (s.byShift.find((b) => b.shift === shift)?.tickets ?? 0), 0),
    }))

    setStats({ sellers, byShiftTotals })
    setLoading(false)
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(value)

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-cyan-500 animate-spin" />
      </div>
    )
  }

  const topSeller = stats.sellers[0]
  const bestShift = [...stats.byShiftTotals].sort((a, b) => b.sales - a.sales)[0]
  const totalTickets = stats.sellers.reduce((sum, s) => sum + s.tickets, 0)
  const avgTicket = stats.sellers.reduce((sum, s) => sum + s.total, 0) / Math.max(totalTickets, 1)

  const chartData = stats.sellers.map((s) => {
    const row: Record<string, string | number> = { seller: s.seller.split(" ")[0] }
    s.byShift.forEach((b) => {
      row[b.shift] = b.sales
    })
    return row
  })

  return (
    <div className="space-y-6 p-8">
      <DemoDataBanner />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Desempeño por Vendedor</h1>
          <p className="text-gray-400 mt-1">Cuánto vendió cada vendedor, turno por turno</p>
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
          <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center mb-4">
            <Trophy className="w-6 h-6 text-yellow-400" />
          </div>
          <p className="text-2xl font-bold text-white mb-1 truncate">{topSeller.seller}</p>
          <p className="text-sm text-gray-400">Vendedor Top ({formatCurrency(topSeller.total)})</p>
        </div>

        <div className="rounded-xl border border-cyan-500/10 bg-gradient-to-br from-[#0a0f1a] to-[#0d1525] p-6">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center mb-4">
            <TrendingUp className="w-6 h-6 text-cyan-400" />
          </div>
          <p className="text-3xl font-bold text-white mb-1">{formatCurrency(avgTicket)}</p>
          <p className="text-sm text-gray-400">Ticket Promedio</p>
        </div>

        <div className="rounded-xl border border-cyan-500/10 bg-gradient-to-br from-[#0a0f1a] to-[#0d1525] p-6">
          <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center mb-4">
            <Users className="w-6 h-6 text-green-400" />
          </div>
          <p className="text-3xl font-bold text-white mb-1">{stats.sellers.length}</p>
          <p className="text-sm text-gray-400">Vendedores Activos</p>
        </div>

        <div className="rounded-xl border border-cyan-500/10 bg-gradient-to-br from-[#0a0f1a] to-[#0d1525] p-6">
          <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-4">
            <Clock className="w-6 h-6 text-purple-400" />
          </div>
          <p className="text-3xl font-bold text-white mb-1">{bestShift.shift}</p>
          <p className="text-sm text-gray-400">Turno Más Productivo</p>
        </div>
      </div>

      {/* Chart: ventas por vendedor y turno */}
      <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-6">
        <h3 className="text-lg font-semibold text-white mb-6">Ventas por Vendedor y Turno</h3>
        <ResponsiveContainer width="100%" height={340}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="seller" stroke="#64748b" style={{ fontSize: 12 }} />
            <YAxis stroke="#64748b" style={{ fontSize: 12 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={{ backgroundColor: "#0a0f1a", border: "1px solid #06b6d4", borderRadius: 8 }}
              labelStyle={{ color: "#fff" }}
              formatter={(value: any) => formatCurrency(Number(value))}
            />
            <Legend wrapperStyle={{ fontSize: 12, color: "#9ca3af" }} />
            {SHIFTS.map((shift) => (
              <Bar key={shift} dataKey={shift} stackId="turno" fill={SHIFT_COLORS[shift]} radius={[4, 4, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Leaderboard */}
      <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-6">
        <h3 className="text-lg font-semibold text-white mb-6">Ranking de Vendedores</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b border-gray-800">
                <th className="pb-3 pr-4">#</th>
                <th className="pb-3 pr-4">Vendedor</th>
                {SHIFTS.map((shift) => (
                  <th key={shift} className="pb-3 pr-4 text-right">
                    {shift}
                  </th>
                ))}
                <th className="pb-3 pr-4 text-right">Total</th>
                <th className="pb-3 text-right">Tickets</th>
              </tr>
            </thead>
            <tbody>
              {stats.sellers.map((s, i) => (
                <tr key={s.seller} className="border-b border-gray-800/50 last:border-0">
                  <td className="py-3 pr-4">
                    {i === 0 ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-bold">
                        1
                      </span>
                    ) : i === 1 ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-400/20 text-gray-300 text-xs font-bold">
                        2
                      </span>
                    ) : i === 2 ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-700/20 text-orange-400 text-xs font-bold">
                        3
                      </span>
                    ) : (
                      <span className="text-gray-500 text-xs pl-1.5">{i + 1}</span>
                    )}
                  </td>
                  <td className="py-3 pr-4 text-white font-medium">{s.seller}</td>
                  {s.byShift.map((b) => (
                    <td key={b.shift} className="py-3 pr-4 text-right text-gray-300">
                      {formatCurrency(b.sales)}
                    </td>
                  ))}
                  <td className="py-3 pr-4 text-right text-cyan-400 font-semibold">{formatCurrency(s.total)}</td>
                  <td className="py-3 text-right text-gray-300">{s.tickets}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
