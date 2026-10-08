"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { DollarSign, ShoppingCart, TrendingUp, RefreshCw } from "lucide-react"
import { GlobalFiltersComponent, type GlobalFilters } from "@/components/dashboard/global-filters"
import { KPICard } from "@/components/dashboard/kpi-card"
import { Card } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils/currency"
import { differenceInCalendarDays, subDays } from "date-fns"
import {
  useTickets,
  applyFilters,
  categoryOptions,
  ymdOf,
  shiftYmd,
  moneyTick,
  pct,
  type Ticket,
} from "@/lib/analytics/tickets"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis,
} from "recharts"
import {
  ChartCard,
  chartDefs,
  ChartTooltip,
  PALETTE,
  ANIMATION,
  areaFill,
  axisProps,
  barFill,
  cursorBar,
  cursorLine,
  gridProps,
} from "@/components/charts/chart-theme"

export const dynamic = "force-dynamic"

const BIN_COLORS = ["#ef4444", "#f59e0b", "#10b981", "#06b6d4", "#8b5cf6", "#ec4899"]
const tooltipStyle = { backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }

const niceStep = (max: number) => {
  const raw = max / 6
  const pow = Math.pow(10, Math.floor(Math.log10(Math.max(raw, 1))))
  const n = raw / pow
  const nice = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10
  return Math.max(1, nice * pow)
}

const shortMoney = (v: number) => moneyTick(v)

export default function ComportamientoCompraPage() {
  const router = useRouter()
  const [filters, setFilters] = useState<GlobalFilters>({
    dateRange: { from: subDays(new Date(), 29), to: new Date() },
  })

  const from = ymdOf(filters.dateRange.from)
  const to = ymdOf(filters.dateRange.to)
  const span = differenceInCalendarDays(filters.dateRange.to, filters.dateRange.from) + 1
  const prevTo = shiftYmd(from, -1)
  const prevFrom = shiftYmd(prevTo, -(span - 1))

  const current = useTickets(from, to, true)
  const previous = useTickets(prevFrom, prevTo, true)
  const loading = current.loading || previous.loading
  const error = current.error || previous.error

  const categories = useMemo(() => categoryOptions(current.tickets), [current.tickets])

  const data = useMemo(() => {
    const cur: Ticket[] = applyFilters(current.tickets, filters)
    const prev: Ticket[] = applyFilters(previous.tickets, filters)

    const stat = (list: Ticket[]) => {
      const total = list.reduce((a, t) => a + t.total, 0)
      const units = list.reduce((a, t) => a + t.units, 0)
      return {
        avgTicket: list.length > 0 ? total / list.length : 0,
        unitsPerTicket: list.length > 0 ? units / list.length : 0,
        perDay: list.length / span,
      }
    }
    const a = stat(cur)
    const b = stat(prev)

    // Serie diaria de tickets (frecuencia de compra a lo largo del tiempo)
    const days = Array.from({ length: Math.min(span, 400) }, (_, i) => {
      const ymd = shiftYmd(from, i)
      const [, m, d] = ymd.split("-")
      return { ymd, date: `${d}/${m}`, tickets: 0, sales: 0 }
    })
    const idx = new Map(days.map((d, i) => [d.ymd, i]))
    cur.forEach((t) => {
      const i = idx.get(t.day)
      if (i !== undefined) {
        days[i].tickets += 1
        days[i].sales += t.total
      }
    })

    // Distribucion de valores de ticket en 6 tramos
    const maxTotal = Math.max(0, ...cur.map((t) => t.total))
    const step = niceStep(maxTotal || 1)
    const bins = Array.from({ length: 6 }, (_, i) => ({
      from: i * step,
      to: (i + 1) * step,
      count: 0,
      last: i === 5,
    }))
    cur.forEach((t) => {
      const i = Math.min(5, Math.floor(t.total / step))
      bins[i].count += 1
    })
    const ticketDistribution = bins.map((bin, i) => ({
      range: bin.last ? `${shortMoney(bin.from)}+` : `${shortMoney(bin.from)}-${shortMoney(bin.to)}`,
      count: bin.count,
      color: BIN_COLORS[i],
    }))

    const unitsDistribution = Array.from({ length: 10 }, (_, i) => ({ units: i === 9 ? "10+" : String(i + 1), tickets: 0 }))
    cur.forEach((t) => {
      if (t.units >= 1) unitsDistribution[Math.min(9, t.units - 1)].tickets += 1
    })

    const scatterData = cur.slice(-400).map((t) => ({ ticketValue: t.total, units: t.units, size: 80 }))

    const smallShare = cur.length > 0 ? (cur.filter((t) => t.units <= 2).length / cur.length) * 100 : 0
    const topBin = [...ticketDistribution].sort((x, y) => y.count - x.count)[0]
    const topBinShare = cur.length > 0 && topBin ? (topBin.count / cur.length) * 100 : 0

    return {
      tickets: cur.length,
      a,
      b,
      days,
      ticketDistribution,
      unitsDistribution,
      scatterData,
      smallShare,
      topBin,
      topBinShare,
    }
  }, [current.tickets, previous.tickets, filters, span, from])

  const freqChange = pct(data.a.perDay, data.b.perDay)
  const spark = (pick: (d: (typeof data.days)[number]) => number) => data.days.slice(-7).map((d) => ({ value: pick(d) }))

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Comportamiento de Compra</h1>
        <p className="text-muted-foreground">Análisis de patrones de compra y oportunidades de upsell, con tus ventas reales</p>
      </div>

      <div className="mb-8">
        <GlobalFiltersComponent
          filters={filters}
          onChange={setFilters}
          branches={current.branches}
          sellers={current.sellers}
          categories={categories}
          showHourFilter
          allowRange
        />
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          No se pudieron cargar las ventas: {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 text-cyan-500 animate-spin" />
        </div>
      ) : (
        <>
          {data.tickets === 0 && (
            <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
              No hay ventas con estos filtros. Probá con otro período o quitá algún filtro.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <KPICard
              title="Ticket Promedio"
              value={formatCurrency(data.a.avgTicket)}
              change={pct(data.a.avgTicket, data.b.avgTicket)}
              changeLabel="vs período anterior"
              icon={DollarSign}
              sparklineData={spark((d) => (d.tickets > 0 ? d.sales / d.tickets : 0))}
              onClick={() => router.push("/dashboard/estadisticas/ventas/tickets")}
            />
            <KPICard
              title="Unidades por Ticket"
              value={data.a.unitsPerTicket.toFixed(2)}
              change={pct(data.a.unitsPerTicket, data.b.unitsPerTicket)}
              changeLabel="vs período anterior"
              icon={ShoppingCart}
            />
            <KPICard
              title="Tickets por Día"
              value={data.a.perDay.toFixed(1)}
              change={pct(data.a.perDay, data.b.perDay)}
              changeLabel="vs período anterior"
              icon={TrendingUp}
              sparklineData={spark((d) => d.tickets)}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Distribución de Valores de Ticket" subtitle="Cuántos tickets hay en cada tramo de precio">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.ticketDistribution} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                    {chartDefs()}
                    <CartesianGrid {...gridProps} />
                    <XAxis dataKey="range" {...axisProps} dy={6} />
                    <YAxis {...axisProps} allowDecimals={false} />
                    <Tooltip cursor={cursorBar} content={<ChartTooltip valueFormatter={(v) => `${v} tickets`} />} />
                    <Bar dataKey="count" name="Tickets" radius={[8, 8, 0, 0]} maxBarSize={44} {...ANIMATION}>
                      {data.ticketDistribution.map((entry, index) => (
                        <Cell key={`bar-${index}`} fill={entry.color} fillOpacity={0.9} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            <ChartCard title="Unidades por Ticket" subtitle="Cuántos productos lleva cada cliente">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.unitsDistribution} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                    {chartDefs()}
                    <CartesianGrid {...gridProps} />
                    <XAxis dataKey="units" {...axisProps} dy={6} />
                    <YAxis {...axisProps} allowDecimals={false} />
                    <Tooltip
                      cursor={cursorBar}
                      content={<ChartTooltip labelFormatter={(l) => `${l} unidades`} valueFormatter={(v) => `${v} tickets`} />}
                    />
                    <Bar dataKey="tickets" name="Tickets" fill={barFill("violet")} radius={[8, 8, 0, 0]} maxBarSize={40} {...ANIMATION} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            <ChartCard title="Frecuencia de Compra en el Tiempo" subtitle="Tickets por día">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.days} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                    {chartDefs()}
                    <CartesianGrid {...gridProps} />
                    <XAxis dataKey="date" {...axisProps} dy={8} interval="preserveStartEnd" minTickGap={24} />
                    <YAxis {...axisProps} allowDecimals={false} />
                    <Tooltip cursor={cursorLine} content={<ChartTooltip valueFormatter={(v) => `${v} tickets`} />} />
                    <Area
                      type="monotone"
                      dataKey="tickets"
                      name="Tickets"
                      stroke={PALETTE.emerald}
                      strokeWidth={2.5}
                      fill={areaFill("emerald")}
                      dot={false}
                      activeDot={{ r: 6, fill: PALETTE.emerald, stroke: "var(--card)", strokeWidth: 3 }}
                      {...ANIMATION}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            <ChartCard title="Valor del Ticket vs Unidades" subtitle="Cada punto es un ticket">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                    <CartesianGrid {...gridProps} vertical />
                    <XAxis type="number" dataKey="ticketValue" name="Valor" {...axisProps} tickFormatter={moneyTick} />
                    <YAxis type="number" dataKey="units" name="Unidades" {...axisProps} allowDecimals={false} />
                    <ZAxis type="number" dataKey="size" range={[70, 70]} />
                    <Tooltip
                      cursor={{ strokeDasharray: "4 4", stroke: "rgba(148,163,184,0.35)" }}
                      content={<ChartTooltip valueFormatter={(v, name) => (name === "Valor" ? formatCurrency(v) : String(v))} />}
                    />
                    <Scatter
                      data={data.scatterData}
                      fill={PALETTE.cyan}
                      fillOpacity={0.55}
                      stroke={PALETTE.cyan}
                      strokeOpacity={0.9}
                      {...ANIMATION}
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>

          <Card className="bg-card border-cyan-500/20 p-6 mt-6">
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <div className="h-6 w-1 bg-gradient-to-b from-cyan-400 to-cyan-600 rounded-full" />
              Insights y Oportunidades
            </h3>
            {data.tickets === 0 ? (
              <p className="text-sm text-muted-foreground">Todavía no hay ventas para analizar.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-muted p-4 rounded-lg border border-green-500/30">
                  <div className="text-green-400 font-semibold mb-2">Oportunidad de Upsell</div>
                  <p className="text-muted-foreground text-sm">
                    El {data.smallShare.toFixed(0)}% de los tickets tienen 2 unidades o menos. Armar combos o packs puede
                    subir las unidades por ticket.
                  </p>
                </div>
                <div className="bg-muted p-4 rounded-lg border border-cyan-500/30">
                  <div className="text-cyan-400 font-semibold mb-2">Patrón de Compra</div>
                  <p className="text-muted-foreground text-sm">
                    Los tickets de {data.topBin?.range} son el {data.topBinShare.toFixed(0)}% del total: es tu tramo de
                    precio más frecuente.
                  </p>
                </div>
                <div className="bg-muted p-4 rounded-lg border border-purple-500/30">
                  <div className="text-purple-400 font-semibold mb-2">Frecuencia</div>
                  <p className="text-muted-foreground text-sm">
                    Se registran {data.a.perDay.toFixed(1)} tickets por día
                    {freqChange !== undefined
                      ? `, un ${Math.abs(freqChange).toFixed(1)}% ${freqChange >= 0 ? "más" : "menos"} que en el período anterior`
                      : ""}
                    .
                  </p>
                </div>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  )
}
