"use client"

import { useMemo, useState } from "react"
import { CreditCard, Receipt, TrendingUp, Percent, ArrowUp, ArrowDown, RefreshCw } from "lucide-react"
import { AreaChart, Area, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import {
  ChartCard,
  chartDefs,
  ChartTooltip,
  EmptyChart,
  PALETTE,
  COLOR_ORDER,
  ANIMATION,
  areaFill,
  axisProps,
  barFill,
  cursorBar,
  cursorLine,
  gridProps,
} from "@/components/charts/chart-theme"
import { formatCurrency } from "@/lib/utils/currency"
import { useTickets, ymdToday, shiftYmd, moneyTick, pct } from "@/lib/analytics/tickets"

export const dynamic = "force-dynamic"

// Ingresos cobrados con tarjeta (crédito o débito). El sistema registra el medio de pago
// como "card" en general: no distingue marca (VISA/Mastercard/Amex) ni crédito de débito,
// así que esos datos no se muestran acá porque no existen — sólo lo que sí es real.
export default function IngresosTarjetasPage() {
  const [period, setPeriod] = useState("30d")
  const days = period === "7d" ? 7 : period === "30d" ? 30 : 90
  const today = ymdToday()
  const from = shiftYmd(today, -(days - 1))
  const prevTo = shiftYmd(from, -1)
  const prevFrom = shiftYmd(prevTo, -(days - 1))

  const current = useTickets(from, today, false)
  const previous = useTickets(prevFrom, prevTo, false)
  const loading = current.loading || previous.loading
  const error = current.error || previous.error

  const stats = useMemo(() => {
    const all = current.tickets
    const cardTickets = all.filter((t) => (t.payment || "").toLowerCase() === "card")
    const prevCard = previous.tickets.filter((t) => (t.payment || "").toLowerCase() === "card")

    const totalRevenue = cardTickets.reduce((a, t) => a + t.total, 0)
    const prevRevenue = prevCard.reduce((a, t) => a + t.total, 0)
    const totalAll = all.reduce((a, t) => a + t.total, 0)
    const avgTicket = cardTickets.length > 0 ? totalRevenue / cardTickets.length : 0
    const shareOfTotal = totalAll > 0 ? (totalRevenue / totalAll) * 100 : 0

    const dayIndex = new Map<string, number>()
    const dailySales = Array.from({ length: days }, (_, i) => {
      const ymd = shiftYmd(from, i)
      dayIndex.set(ymd, i)
      const [, m, d] = ymd.split("-")
      return { date: `${d}/${m}`, value: 0 }
    })
    cardTickets.forEach((t) => {
      const idx = dayIndex.get(t.day)
      if (idx !== undefined) dailySales[idx].value += t.total
    })

    const byBranch = new Map<string, { name: string; revenue: number; count: number }>()
    cardTickets.forEach((t) => {
      const cur = byBranch.get(t.branchId) || { name: t.branch, revenue: 0, count: 0 }
      cur.revenue += t.total
      cur.count += 1
      byBranch.set(t.branchId, cur)
    })
    const branches = [...byBranch.values()].sort((a, b) => b.revenue - a.revenue)

    const recent = [...cardTickets].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 100)

    return { totalRevenue, prevRevenue, avgTicket, shareOfTotal, count: cardTickets.length, dailySales, branches, recent }
  }, [current.tickets, previous.tickets, days, from])

  const cmp = pct(stats.totalRevenue, stats.prevRevenue)

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-cyan-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-white">Ingresos por Tarjetas</h1>
          <p className="mt-1 text-gray-400">Ventas cobradas con tarjeta, con tus datos reales</p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-cyan-500/20 bg-[#0a0f1a] p-1">
          {["7d", "30d", "90d"].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                period === p ? "bg-cyan-500/20 text-cyan-400" : "text-gray-400 hover:text-white"
              }`}
            >
              {p === "7d" ? "7 Días" : p === "30d" ? "30 Días" : "90 Días"}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          No se pudieron cargar las ventas: {error}
        </div>
      )}
      {!error && stats.count === 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
          No hay ventas con tarjeta en los últimos {days} días.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-cyan-500/10 bg-gradient-to-br from-[#0a0f1a] to-[#0d1525] p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/20">
              <CreditCard className="h-6 w-6 text-cyan-400" />
            </div>
            {cmp !== undefined && (
              <div className={`flex items-center gap-1 text-sm ${cmp >= 0 ? "text-green-400" : "text-red-400"}`}>
                {cmp >= 0 ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                {Math.abs(cmp).toFixed(1)}%
              </div>
            )}
          </div>
          <p className="mb-1 text-3xl font-bold text-white">{formatCurrency(stats.totalRevenue)}</p>
          <p className="text-sm text-gray-400">Ingresos por Tarjeta</p>
          {cmp !== undefined && <p className="mt-1 text-xs text-gray-500">vs {days} días anteriores</p>}
        </div>

        <div className="rounded-xl border border-cyan-500/10 bg-gradient-to-br from-[#0a0f1a] to-[#0d1525] p-6">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/20">
            <Receipt className="h-6 w-6 text-blue-400" />
          </div>
          <p className="mb-1 text-3xl font-bold text-white">{stats.count.toLocaleString("es-AR")}</p>
          <p className="text-sm text-gray-400">Transacciones</p>
        </div>

        <div className="rounded-xl border border-cyan-500/10 bg-gradient-to-br from-[#0a0f1a] to-[#0d1525] p-6">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/20">
            <TrendingUp className="h-6 w-6 text-green-400" />
          </div>
          <p className="mb-1 text-3xl font-bold text-white">{formatCurrency(stats.avgTicket)}</p>
          <p className="text-sm text-gray-400">Ticket Promedio</p>
        </div>

        <div className="rounded-xl border border-cyan-500/10 bg-gradient-to-br from-[#0a0f1a] to-[#0d1525] p-6">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/20">
            <Percent className="h-6 w-6 text-purple-400" />
          </div>
          <p className="mb-1 text-3xl font-bold text-white">{stats.shareOfTotal.toFixed(1)}%</p>
          <p className="text-sm text-gray-400">del total de ventas</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="Ingresos por Tarjeta - Tendencia" subtitle={`Últimos ${days} días`}>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.dailySales} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                {chartDefs()}
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="date" {...axisProps} dy={8} interval="preserveStartEnd" minTickGap={24} />
                <YAxis {...axisProps} tickFormatter={moneyTick} width={52} />
                <Tooltip cursor={cursorLine} content={<ChartTooltip valueFormatter={(v) => formatCurrency(v)} />} />
                <Area
                  type="monotone"
                  dataKey="value"
                  name="Tarjeta"
                  stroke={PALETTE.cyan}
                  strokeWidth={2.5}
                  fill={areaFill("cyan")}
                  dot={false}
                  activeDot={{ r: 6, fill: PALETTE.cyan, stroke: "#0a0f1a", strokeWidth: 3 }}
                  {...ANIMATION}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Ingresos por Sucursal" subtitle="Sólo ventas con tarjeta">
          {stats.branches.length === 0 ? (
            <EmptyChart />
          ) : (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.branches} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
                  {chartDefs()}
                  <CartesianGrid {...gridProps} horizontal={false} vertical />
                  <XAxis type="number" {...axisProps} tickFormatter={moneyTick} />
                  <YAxis dataKey="name" type="category" {...axisProps} width={110} />
                  <Tooltip cursor={cursorBar} content={<ChartTooltip valueFormatter={(v) => formatCurrency(v)} />} />
                  <Bar dataKey="revenue" name="Tarjeta" radius={[0, 8, 8, 0]} maxBarSize={30} {...ANIMATION}>
                    {stats.branches.map((_, i) => (
                      <Cell key={i} fill={barFill(COLOR_ORDER[i % COLOR_ORDER.length])} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>
      </div>

      <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-6">
        <div className="mb-4 flex items-center gap-2">
          <h3 className="text-lg font-semibold text-white">Últimas Ventas con Tarjeta</h3>
          <span className="rounded-full border border-cyan-500/20 px-2 py-0.5 text-xs text-cyan-400">
            {stats.recent.length}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-left text-gray-400">
                <th className="py-2 pr-4 font-medium">Fecha</th>
                <th className="py-2 pr-4 font-medium">Sucursal</th>
                <th className="py-2 pr-4 font-medium">Vendedor</th>
                <th className="py-2 pr-4 font-medium">Nº Venta</th>
                <th className="py-2 pr-4 font-medium">Factura</th>
                <th className="py-2 pl-4 text-right font-medium">Monto</th>
              </tr>
            </thead>
            <tbody>
              {stats.recent.map((t) => (
                <tr key={t.id} className="border-b border-gray-800/60 hover:bg-white/[0.02]">
                  <td className="py-2.5 pr-4 text-gray-300">
                    {new Date(t.createdAt).toLocaleString("es-AR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="py-2.5 pr-4 text-gray-300">{t.branch}</td>
                  <td className="py-2.5 pr-4 text-gray-300">{t.seller}</td>
                  <td className="py-2.5 pr-4 font-mono text-xs text-gray-400" title={t.number}>
                    {t.number.slice(-8)}
                  </td>
                  <td className="py-2.5 pr-4 text-gray-400">{t.invoice ? `${t.invoice.type} ${t.invoice.number}` : "-"}</td>
                  <td className="py-2.5 pl-4 text-right font-semibold text-white">{formatCurrency(t.total)}</td>
                </tr>
              ))}
              {stats.recent.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    Sin ventas con tarjeta en este período.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
