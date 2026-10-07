"use client"

import { useMemo, useState } from "react"
import { DollarSign, ShoppingCart, TrendingUp, Building2, RefreshCw } from "lucide-react"
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

// Productividad real por sucursal: ventas, tickets y ticket promedio de cada local con datos
// reales. No se mide por m² porque el sistema no tiene la superficie de cada sucursal cargada,
// así que ese dato (y el benchmark de industria) no se inventa.
export default function ProductividadLocalPage() {
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
    const tickets = current.tickets
    const totalSales = tickets.reduce((a, t) => a + t.total, 0)
    const prevTotal = previous.tickets.reduce((a, t) => a + t.total, 0)
    const avgTicket = tickets.length > 0 ? totalSales / tickets.length : 0

    const dayIndex = new Map<string, number>()
    const dailySales = Array.from({ length: days }, (_, i) => {
      const ymd = shiftYmd(from, i)
      dayIndex.set(ymd, i)
      const [, m, d] = ymd.split("-")
      return { date: `${d}/${m}`, value: 0 }
    })
    tickets.forEach((t) => {
      const idx = dayIndex.get(t.day)
      if (idx !== undefined) dailySales[idx].value += t.total
    })

    const byBranch = new Map<string, { name: string; revenue: number; tickets: number }>()
    tickets.forEach((t) => {
      const cur = byBranch.get(t.branchId) || { name: t.branch, revenue: 0, tickets: 0 }
      cur.revenue += t.total
      cur.tickets += 1
      byBranch.set(t.branchId, cur)
    })
    const branches = [...byBranch.values()]
      .map((b) => ({ ...b, avgTicket: b.tickets > 0 ? b.revenue / b.tickets : 0, share: totalSales > 0 ? (b.revenue / totalSales) * 100 : 0 }))
      .sort((a, b) => b.revenue - a.revenue)

    const best = branches[0]
    const worst = branches[branches.length - 1]

    return { totalSales, tickets: tickets.length, avgTicket, previousComparison: pct(totalSales, prevTotal), dailySales, branches, best, worst }
  }, [current.tickets, previous.tickets, days, from])

  const cmp = stats.previousComparison

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
          <h1 className="text-3xl font-bold text-foreground">Productividad por Local</h1>
          <p className="mt-1 text-muted-foreground">Ventas, tickets y rendimiento de cada sucursal, con tus datos reales</p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-cyan-500/20 bg-card p-1">
          {["7d", "30d", "90d"].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                period === p ? "bg-cyan-500/20 text-cyan-400" : "text-muted-foreground hover:text-foreground"
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
      {!error && stats.tickets === 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
          No hay ventas en los últimos {days} días.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-cyan-500/10 bg-gradient-to-br from-[#0a0f1a] to-[#0d1525] p-6">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/20">
            <DollarSign className="h-6 w-6 text-cyan-400" />
          </div>
          <p className="mb-1 text-3xl font-bold text-foreground">{formatCurrency(stats.totalSales)}</p>
          <p className="text-sm text-muted-foreground">Ventas Totales</p>
          {cmp !== undefined && (
            <p className={`mt-1 text-xs ${cmp >= 0 ? "text-green-400" : "text-red-400"}`}>
              {cmp >= 0 ? "+" : ""}
              {cmp.toFixed(1)}% vs {days} días anteriores
            </p>
          )}
        </div>

        <div className="rounded-xl border border-cyan-500/10 bg-gradient-to-br from-[#0a0f1a] to-[#0d1525] p-6">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-500/20">
            <ShoppingCart className="h-6 w-6 text-yellow-400" />
          </div>
          <p className="mb-1 text-3xl font-bold text-foreground">{stats.tickets.toLocaleString("es-AR")}</p>
          <p className="text-sm text-muted-foreground">Tickets</p>
        </div>

        <div className="rounded-xl border border-cyan-500/10 bg-gradient-to-br from-[#0a0f1a] to-[#0d1525] p-6">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/20">
            <TrendingUp className="h-6 w-6 text-green-400" />
          </div>
          <p className="mb-1 text-3xl font-bold text-foreground">{formatCurrency(stats.avgTicket)}</p>
          <p className="text-sm text-muted-foreground">Ticket Promedio</p>
        </div>

        <div className="rounded-xl border border-cyan-500/10 bg-gradient-to-br from-[#0a0f1a] to-[#0d1525] p-6">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/20">
            <Building2 className="h-6 w-6 text-purple-400" />
          </div>
          <p className="mb-1 text-3xl font-bold text-foreground">{stats.branches.length}</p>
          <p className="text-sm text-muted-foreground">Sucursales con ventas</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="Ventas - Tendencia" subtitle={`Últimos ${days} días`}>
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
                  name="Ventas"
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

        <ChartCard title="Ventas por Sucursal" subtitle="Comparación del período">
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
                  <Bar dataKey="revenue" name="Ventas" radius={[0, 8, 8, 0]} maxBarSize={30} {...ANIMATION}>
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

      <div className="rounded-xl border border-cyan-500/10 bg-card p-6">
        <h3 className="mb-4 text-lg font-semibold text-foreground">Detalle por Sucursal</h3>
        {/* Mobile: cards */}
        <div className="space-y-2 md:hidden">
          {stats.branches.map((b, i) => (
            <div key={b.name + i} className="rounded-lg border border-border bg-accent/50 p-3">
              <div className="flex items-center justify-between">
                <p className="font-medium text-foreground">{b.name}</p>
                <span className="text-cyan-400">{b.share.toFixed(1)}%</span>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                <div>
                  <p className="text-muted-foreground">Ventas</p>
                  <p className="text-gray-200">{formatCurrency(b.revenue)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Tickets</p>
                  <p className="text-gray-200">{b.tickets}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Promedio</p>
                  <p className="text-gray-200">{formatCurrency(b.avgTicket)}</p>
                </div>
              </div>
            </div>
          ))}
          {stats.branches.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">Sin ventas en este período.</p>
          )}
        </div>

        {/* Desktop: tabla */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-left text-muted-foreground">
                <th className="py-2 pr-4 font-medium">Sucursal</th>
                <th className="py-2 pr-4 text-right font-medium">Ventas</th>
                <th className="py-2 pr-4 text-right font-medium">Tickets</th>
                <th className="py-2 pr-4 text-right font-medium">Ticket Promedio</th>
                <th className="py-2 pl-4 text-right font-medium">% del Total</th>
              </tr>
            </thead>
            <tbody>
              {stats.branches.map((b, i) => (
                <tr key={b.name + i} className="border-b border-border hover:bg-accent/50">
                  <td className="py-2.5 pr-4 font-medium text-foreground">{b.name}</td>
                  <td className="py-2.5 pr-4 text-right text-gray-200">{formatCurrency(b.revenue)}</td>
                  <td className="py-2.5 pr-4 text-right text-muted-foreground">{b.tickets}</td>
                  <td className="py-2.5 pr-4 text-right text-muted-foreground">{formatCurrency(b.avgTicket)}</td>
                  <td className="py-2.5 pl-4 text-right text-cyan-400">{b.share.toFixed(1)}%</td>
                </tr>
              ))}
              {stats.branches.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground">
                    Sin ventas en este período.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {stats.branches.length > 1 && stats.best && stats.worst && stats.best.name !== stats.worst.name && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4">
            <div className="mb-2 font-semibold text-green-400">Mejor desempeño</div>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{stats.best.name}</span> lidera con {formatCurrency(stats.best.revenue)} (
              {stats.best.share.toFixed(1)}% del total) en los últimos {days} días.
            </p>
          </div>
          <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-4">
            <div className="mb-2 font-semibold text-cyan-400">Oportunidad</div>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{stats.worst.name}</span> es la que menos vendió del grupo, con{" "}
              {formatCurrency(stats.worst.revenue)}. Puede valer la pena revisar qué hace distinto {stats.best.name}.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
