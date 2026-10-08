"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { DollarSign, ShoppingCart, TrendingUp, Calendar, Download, RefreshCw, ArrowUp, ArrowDown, Package } from "lucide-react"
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import {
  ChartCard,
  chartDefs,
  ChartTooltip,
  DonutChart,
  EmptyChart,
  PALETTE,
  COLOR_ORDER,
  ANIMATION,
  areaFill,
  axisProps,
  barFill,
  barFillH,
  colorAt,
  cursorBar,
  cursorLine,
  gridProps,
  legendProps,
} from "@/components/charts/chart-theme"
import { formatCurrency } from "@/lib/utils/currency"
import {
  useTickets,
  ymdToday,
  shiftYmd,
  WEEKDAYS_SHORT,
  WEEK_ORDER,
  moneyTick,
  pct,
} from "@/lib/analytics/tickets"

export const dynamic = "force-dynamic"

const COLORS = ["#06b6d4", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#64748b"]

export default function VentasOverviewPage() {
  const [period, setPeriod] = useState("30d")
  const days = period === "7d" ? 7 : period === "30d" ? 30 : 90
  const today = ymdToday()
  const from = shiftYmd(today, -(days - 1))
  const prevTo = shiftYmd(from, -1)
  const prevFrom = shiftYmd(prevTo, -(days - 1))

  const current = useTickets(from, today, true)
  const previous = useTickets(prevFrom, prevTo, false)
  const loading = current.loading || previous.loading
  const error = current.error || previous.error

  const stats = useMemo(() => {
    const tickets = current.tickets
    const totalSales = tickets.reduce((a, t) => a + t.total, 0)
    const unitsSold = tickets.reduce((a, t) => a + t.units, 0)
    const avgTicket = tickets.length > 0 ? totalSales / tickets.length : 0
    const prevTotal = previous.tickets.reduce((a, t) => a + t.total, 0)

    const dayIndex = new Map<string, number>()
    const dailySales = Array.from({ length: days }, (_, i) => {
      const ymd = shiftYmd(from, i)
      dayIndex.set(ymd, i)
      const [, m, d] = ymd.split("-")
      return { date: `${d}/${m}`, value: 0 }
    })
    const weekday = Array.from({ length: 7 }, () => 0)
    const products = new Map<string, { name: string; sales: number; units: number }>()
    const categories = new Map<string, number>()

    tickets.forEach((t) => {
      const idx = dayIndex.get(t.day)
      if (idx !== undefined) dailySales[idx].value += t.total
      weekday[t.weekday] += t.total
      t.items.forEach((i) => {
        const key = i.productId || i.name
        const cur = products.get(key) || { name: i.name, sales: 0, units: 0 }
        cur.sales += i.subtotal
        cur.units += i.quantity
        products.set(key, cur)
        categories.set(i.category, (categories.get(i.category) || 0) + i.subtotal)
      })
    })

    const topProducts = [...products.values()].sort((a, b) => b.sales - a.sales).slice(0, 5)
    const catTotal = [...categories.values()].reduce((a, b) => a + b, 0)
    const sortedCats = [...categories.entries()].sort((a, b) => b[1] - a[1])
    const head = sortedCats.slice(0, 5)
    const rest = sortedCats.slice(5).reduce((a, [, v]) => a + v, 0)
    if (rest > 0) head.push(["Otros", rest])
    const salesByCategory = head
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name, value, percent: catTotal > 0 ? Math.round((value / catTotal) * 1000) / 10 : 0 }))

    return {
      totalSales,
      tickets: tickets.length,
      avgDailySales: totalSales / days,
      avgWeeklySales: (totalSales / days) * 7,
      avgTicket,
      unitsSold,
      previousComparison: pct(totalSales, prevTotal),
      dailySales,
      salesByWeekday: WEEK_ORDER.map((d) => ({ day: WEEKDAYS_SHORT[d], value: weekday[d] })),
      topProducts,
      salesByCategory,
    }
  }, [current.tickets, previous.tickets, days, from])

  const exportCsv = () => {
    const rows = [["Fecha", "Ventas"], ...stats.dailySales.map((d) => [d.date, String(d.value)])]
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(";")).join("\r\n")
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `analisis_ventas_${from}_${today}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-cyan-500 animate-spin" />
      </div>
    )
  }

  const cmp = stats.previousComparison

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Análisis de Ventas</h1>
          <p className="text-muted-foreground mt-1">Vista ejecutiva de ventas y rendimiento, con tus datos reales</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-card border border-cyan-500/20 rounded-lg p-1">
            {["7d", "30d", "90d"].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 text-sm rounded-md transition-colors font-medium ${
                  period === p ? "bg-cyan-500/20 text-cyan-400" : "text-muted-foreground hover:text-foreground"
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
      {!error && stats.tickets === 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
          No hay ventas en los últimos {days} días.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="rounded-xl border border-cyan-500/10 bg-card p-6 hover:border-cyan-500/30 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-cyan-400" />
            </div>
            {cmp !== undefined && (
              <div className={`flex items-center gap-1 text-sm ${cmp >= 0 ? "text-green-400" : "text-red-400"}`}>
                {cmp >= 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                {Math.abs(cmp).toFixed(1)}%
              </div>
            )}
          </div>
          <p className="text-3xl font-bold text-foreground mb-1">{formatCurrency(stats.totalSales)}</p>
          <p className="text-sm text-muted-foreground">Ventas Totales</p>
          {cmp !== undefined && <p className="text-xs text-muted-foreground mt-1">vs {days} días anteriores</p>}
        </div>

        <div className="rounded-xl border border-cyan-500/10 bg-card p-6 hover:border-cyan-500/30 transition-all">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4">
            <Calendar className="w-6 h-6 text-blue-400" />
          </div>
          <p className="text-3xl font-bold text-foreground mb-1">{formatCurrency(stats.avgDailySales)}</p>
          <p className="text-sm text-muted-foreground">Promedio Diario</p>
        </div>

        <div className="rounded-xl border border-cyan-500/10 bg-card p-6 hover:border-cyan-500/30 transition-all">
          <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center mb-4">
            <TrendingUp className="w-6 h-6 text-green-400" />
          </div>
          <p className="text-3xl font-bold text-foreground mb-1">{formatCurrency(stats.avgWeeklySales)}</p>
          <p className="text-sm text-muted-foreground">Promedio Semanal</p>
        </div>

        <div className="rounded-xl border border-cyan-500/10 bg-card p-6 hover:border-cyan-500/30 transition-all">
          <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center mb-4">
            <ShoppingCart className="w-6 h-6 text-yellow-400" />
          </div>
          <p className="text-3xl font-bold text-foreground mb-1">{formatCurrency(stats.avgTicket)}</p>
          <p className="text-sm text-muted-foreground">Ticket Promedio ({stats.tickets} tickets)</p>
        </div>

        <div className="rounded-xl border border-cyan-500/10 bg-card p-6 hover:border-cyan-500/30 transition-all">
          <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-4">
            <Package className="w-6 h-6 text-purple-400" />
          </div>
          <p className="text-3xl font-bold text-foreground mb-1">{stats.unitsSold.toLocaleString("es-AR")}</p>
          <p className="text-sm text-muted-foreground">Unidades Vendidas</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Tendencia de Ventas Diarias" subtitle={`Últimos ${days} días`}>
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
                  activeDot={{ r: 6, fill: PALETTE.cyan, stroke: "var(--card)", strokeWidth: 3 }}
                  {...ANIMATION}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Ventas por Día de la Semana" subtitle="Qué días se vende más">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.salesByWeekday} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                {chartDefs()}
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="day" {...axisProps} dy={6} />
                <YAxis {...axisProps} tickFormatter={moneyTick} width={52} />
                <Tooltip cursor={cursorBar} content={<ChartTooltip valueFormatter={(v) => formatCurrency(v)} />} />
                <Bar dataKey="value" name="Ventas" fill={barFill("indigo")} radius={[8, 8, 0, 0]} maxBarSize={38} {...ANIMATION} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Top Productos por Ventas" subtitle="Los 5 que más facturan">
          {stats.topProducts.length === 0 ? (
            <EmptyChart />
          ) : (
            <div className="space-y-5">
              {stats.topProducts.map((product, i) => {
                const percentage = stats.topProducts[0].sales > 0 ? (product.sales / stats.topProducts[0].sales) * 100 : 0
                return (
                  <div key={product.name + i}>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className="flex min-w-0 items-center gap-2 text-sm font-medium text-foreground">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-accent text-[11px] text-muted-foreground">
                          {i + 1}
                        </span>
                        <span className="truncate">{product.name}</span>
                      </span>
                      <div className="shrink-0 text-right">
                        <span className="font-semibold text-foreground">{formatCurrency(product.sales)}</span>
                        <span className="ml-2 text-xs text-muted-foreground">({product.units} un.)</span>
                      </div>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-accent">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${percentage}%`,
                          background: `linear-gradient(90deg, ${colorAt(i)}66, ${colorAt(i)})`,
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ChartCard>

        <ChartCard title="Ventas por Categoría" subtitle="Participación en la facturación">
          <DonutChart
            data={stats.salesByCategory.map((c) => ({ name: c.name, value: c.value }))}
            valueFormatter={(v) => formatCurrency(v)}
            centerLabel="Facturado"
            centerValue={formatCurrency(stats.totalSales)}
          />
        </ChartCard>
      </div>
    </div>
  )
}
