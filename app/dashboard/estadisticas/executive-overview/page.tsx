"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { DollarSign, ShoppingCart, Package, Clock, TrendingUp, BarChart3, ShoppingBag, Ban } from "lucide-react"
import { GlobalFiltersComponent, type GlobalFilters } from "@/components/dashboard/global-filters"
import { KPICard } from "@/components/dashboard/kpi-card"
import { Card } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { formatCurrency } from "@/lib/utils/currency"
import { shiftFromLabel, shiftOf, OWNER_LABEL, type ShiftKey } from "@/lib/analytics/tickets"
import { format, isSameDay } from "date-fns"
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import {
  ChartCard,
  chartDefs,
  ChartTooltip,
  DonutChart,
  PALETTE,
  ANIMATION,
  areaFill,
  axisProps,
  barFill,
  barFillH,
  cursorBar,
  cursorLine,
  gridProps,
} from "@/components/charts/chart-theme"
import { moneyTick } from "@/lib/analytics/tickets"

export const dynamic = "force-dynamic"

const TZ = "America/Argentina/Buenos_Aires"
const hourFmt = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", hour12: false })
const dayFmt = new Intl.DateTimeFormat("en-CA", { timeZone: TZ })
const PAGE = 1000
const ID_CHUNK = 120
const CATEGORY_COLORS = ["#06b6d4", "#8b5cf6", "#f59e0b", "#10b981", "#ef4444", "#3b82f6", "#ec4899", "#84cc16"]

const SHIFTS = [
  { key: "morning", label: "Mañana (6-14h)", from: 6, to: 14 },
  { key: "afternoon", label: "Tarde (14-22h)", from: 14, to: 22 },
  { key: "night", label: "Noche (22-6h)", from: 22, to: 6 },
]

interface SaleRow {
  id: string
  kiosko_id: string
  employee_id: string | null
  total_amount: number
  payment_method: string | null
  status: string | null
  created_at: string
  cash_registers?: { shift: string | null } | Array<{ shift: string | null }> | null
}

interface ItemRow {
  sale_id: string
  quantity: number
  subtotal: number
  category: string
}

const hourOf = (iso: string) => {
  const h = Number.parseInt(hourFmt.format(new Date(iso)), 10)
  return h === 24 ? 0 : h
}
const dayOf = (iso: string) => dayFmt.format(new Date(iso))

// Franja [from, to): si from > to cruza la medianoche; from === to significa todo el dia.
const inWindow = (h: number, from: number, to: number) => {
  if (from === to) return true
  return from < to ? h >= from && h < to : h >= from || h < to
}

const toRangeStart = (d: Date) => new Date(`${format(d, "yyyy-MM-dd")}T00:00:00-03:00`)
const toRangeEndExclusive = (d: Date) => new Date(toRangeStart(d).getTime() + 24 * 60 * 60 * 1000)

async function fetchAllPages<T>(
  run: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: any }>,
): Promise<T[]> {
  const out: T[] = []
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await run(from, from + PAGE - 1)
    if (error) throw error
    out.push(...(data || []))
    if (!data || data.length < PAGE) break
  }
  return out
}

export default function ExecutiveOverviewPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [filters, setFilters] = useState<GlobalFilters>({
    dateRange: { from: new Date(), to: new Date() },
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [branches, setBranches] = useState<Array<{ id: string; name: string }>>([])
  const [sellers, setSellers] = useState<Array<{ id: string; name: string }>>([])
  const [sales, setSales] = useState<SaleRow[]>([])
  const [prevSales, setPrevSales] = useState<SaleRow[]>([])
  const [items, setItems] = useState<Map<string, ItemRow[]>>(new Map())

  const rangeKey = `${format(filters.dateRange.from, "yyyy-MM-dd")}|${format(filters.dateRange.to, "yyyy-MM-dd")}`

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        let kioskos: Array<{ id: string; name: string }> = []
        const { data: owned } = await supabase.from("kioscos").select("id, name").eq("owner_id", user.id)
        if (owned && owned.length > 0) {
          kioskos = owned.map((k: any) => ({ id: k.id, name: k.name || "Sucursal" }))
        } else {
          const { data: emp } = await supabase
            .from("employees")
            .select("kiosko_id")
            .eq("user_id", user.id)
            .eq("status", "active")
            .maybeSingle()
          if (emp?.kiosko_id) kioskos = [{ id: emp.kiosko_id, name: "Mi sucursal" }]
        }
        if (kioskos.length === 0) {
          if (!cancelled) {
            setSales([])
            setPrevSales([])
            setItems(new Map())
          }
          return
        }
        const kioskoIds = kioskos.map((k) => k.id)

        const { data: staff } = await supabase.from("employees").select("id, name").in("kiosko_id", kioskoIds)

        const start = toRangeStart(filters.dateRange.from)
        const end = toRangeEndExclusive(filters.dateRange.to)
        const span = end.getTime() - start.getTime()
        const prevStart = new Date(start.getTime() - span)
        const singleDay = isSameDay(filters.dateRange.from, filters.dateRange.to)
        const fetchStart = singleDay ? new Date(start.getTime() - 13 * 24 * 60 * 60 * 1000) : start

        const cols = "id, kiosko_id, employee_id, total_amount, payment_method, status, created_at, cash_registers(shift)"
        const current = await fetchAllPages<SaleRow>(
          (a, b) =>
            supabase
              .from("sales")
              .select(cols)
              .in("kiosko_id", kioskoIds)
              .gte("created_at", fetchStart.toISOString())
              .lt("created_at", end.toISOString())
              .order("created_at", { ascending: true })
              .range(a, b) as any,
        )
        const previous = await fetchAllPages<SaleRow>(
          (a, b) =>
            supabase
              .from("sales")
              .select(cols)
              .in("kiosko_id", kioskoIds)
              .neq("status", "cancelled")
              .gte("created_at", prevStart.toISOString())
              .lt("created_at", start.toISOString())
              .order("created_at", { ascending: true })
              .range(a, b) as any,
        )

        const ids = current
          .filter((s) => s.status !== "cancelled" && new Date(s.created_at) >= start)
          .map((s) => s.id)
        const itemMap = new Map<string, ItemRow[]>()
        for (let i = 0; i < ids.length; i += ID_CHUNK) {
          const chunk = ids.slice(i, i + ID_CHUNK)
          const rows = await fetchAllPages<any>(
            (a, b) =>
              supabase
                .from("sale_items")
                .select("sale_id, quantity, subtotal, products(category)")
                .in("sale_id", chunk)
                .range(a, b) as any,
          )
          rows.forEach((r) => {
            const list = itemMap.get(r.sale_id) || []
            list.push({
              sale_id: r.sale_id,
              quantity: Number(r.quantity) || 0,
              subtotal: Number(r.subtotal) || 0,
              category: r.products?.category || "Sin categoría",
            })
            itemMap.set(r.sale_id, list)
          })
        }

        if (cancelled) return
        setBranches(kioskos)
        setSellers([
          { id: "none", name: OWNER_LABEL },
          ...(staff || []).map((e: any) => ({ id: e.id as string, name: (e.name || "Empleado") as string })),
        ])
        setSales(current.map((s) => ({ ...s, total_amount: Number(s.total_amount) })))
        setPrevSales(previous.map((s) => ({ ...s, total_amount: Number(s.total_amount) })))
        setItems(itemMap)
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "No se pudieron cargar las ventas")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeKey, supabase])

  const categories = useMemo(() => {
    const set = new Set<string>()
    items.forEach((list) => list.forEach((i) => set.add(i.category)))
    return [...set].sort().map((c) => ({ id: c, name: c }))
  }, [items])

  const data = useMemo(() => {
    const hr = filters.hourRange
    const shiftOfSale = (s: SaleRow): ShiftKey => {
      const reg = Array.isArray(s.cash_registers) ? s.cash_registers[0]?.shift : s.cash_registers?.shift
      return shiftFromLabel(reg) ?? shiftOf(hourOf(s.created_at))
    }

    const passes = (s: SaleRow) => {
      if (filters.branch && s.kiosko_id !== filters.branch) return false
      if (filters.seller && (filters.seller === "none" ? s.employee_id !== null : s.employee_id !== filters.seller)) return false
      if (filters.paymentMethod && s.payment_method !== filters.paymentMethod) return false
      const h = hourOf(s.created_at)
      if (hr && !inWindow(h, hr.from, hr.to)) return false
      if (filters.shift && shiftOfSale(s) !== filters.shift) return false
      return true
    }

    // Cada venta pasa a ser {total, unidades} ya considerando el filtro de categoria.
    const shape = (s: SaleRow) => {
      const its = items.get(s.id) || []
      if (!filters.category) {
        return { total: s.total_amount, units: its.reduce((a, i) => a + i.quantity, 0) }
      }
      const mine = its.filter((i) => i.category === filters.category)
      if (mine.length === 0) return null
      return { total: mine.reduce((a, i) => a + i.subtotal, 0), units: mine.reduce((a, i) => a + i.quantity, 0) }
    }

    const rangeStartMs = toRangeStart(filters.dateRange.from).getTime()
    const rangeEndMs = toRangeEndExclusive(filters.dateRange.to).getTime()
    const inRange = (s: SaleRow) => {
      const t = new Date(s.created_at).getTime()
      return t >= rangeStartMs && t < rangeEndMs
    }
    const active = sales.filter((s) => s.status !== "cancelled" && inRange(s) && passes(s))
    const voided = sales.filter((s) => s.status === "cancelled" && inRange(s) && passes(s)).length

    const rows = active
      .map((s) => ({ sale: s, shaped: shape(s) }))
      .filter((r): r is { sale: SaleRow; shaped: { total: number; units: number } } => r.shaped !== null)
      .map((r) => ({
        id: r.sale.id,
        seller: r.sale.employee_id,
        day: dayOf(r.sale.created_at),
        hour: hourOf(r.sale.created_at),
        shift: shiftOfSale(r.sale),
        total: r.shaped.total,
        units: r.shaped.units,
      }))

    const totalSales = rows.reduce((a, r) => a + r.total, 0)
    const tickets = rows.length
    const units = rows.reduce((a, r) => a + r.units, 0)
    const avgTicket = tickets > 0 ? totalSales / tickets : 0

    const bucketSet = new Set(rows.map((r) => `${r.day}|${r.hour}`))
    const activeHours = bucketSet.size
    const ticketsPerHour = activeHours > 0 ? tickets / activeHours : 0
    const salesPerHour = activeHours > 0 ? totalSales / activeHours : 0
    const unitsPerTicket = tickets > 0 ? units / tickets : 0

    // Comparacion con el periodo anterior (ventas, tickets y ticket promedio; sin filtro de categoria).
    let change: { sales?: number; tickets?: number; avg?: number } = {}
    if (!filters.category) {
      const prev = prevSales.filter(passes)
      const prevTotal = prev.reduce((a, s) => a + s.total_amount, 0)
      const pct = (now: number, before: number) => (before > 0 ? ((now - before) / before) * 100 : undefined)
      change = {
        sales: pct(totalSales, prevTotal),
        tickets: pct(tickets, prev.length),
        avg: pct(avgTicket, prev.length > 0 ? prevTotal / prev.length : 0),
      }
    }

    // Serie diaria (rellena los dias sin ventas con 0).
    const oneDay = isSameDay(filters.dateRange.from, filters.dateRange.to)
    const daily: Array<{ date: string; sales: number; tickets: number; units: number }> = []
    const cursor = new Date(filters.dateRange.from)
    if (oneDay) cursor.setDate(cursor.getDate() - 13)
    const last = new Date(filters.dateRange.to)
    cursor.setHours(12, 0, 0, 0)
    last.setHours(12, 0, 0, 0)
    const dayIndex = new Map<string, number>()
    while (cursor <= last && daily.length < 400) {
      const ymd = format(cursor, "yyyy-MM-dd")
      dayIndex.set(ymd, daily.length)
      daily.push({ date: format(cursor, "dd/MM"), sales: 0, tickets: 0, units: 0 })
      cursor.setDate(cursor.getDate() + 1)
    }
    // Con un solo dia se muestran los 14 dias previos: alli no se cargan items, asi que el
    // filtro de categoria no aplica a la tendencia.
    const trendRows = oneDay
      ? sales
          .filter((s) => s.status !== "cancelled" && passes(s))
          .map((s) => ({ day: dayOf(s.created_at), total: s.total_amount, units: 0 }))
      : rows.map((r) => ({ day: r.day, total: r.total, units: r.units }))
    trendRows.forEach((r) => {
      const idx = dayIndex.get(r.day)
      if (idx !== undefined) {
        daily[idx].sales += r.total
        daily[idx].tickets += 1
        daily[idx].units += r.units
      }
    })

    const hourly = Array.from({ length: 24 }, (_, h) => ({ hour: `${h}:00`, sales: 0, tickets: 0 }))
    rows.forEach((r) => {
      hourly[r.hour].sales += r.total
      hourly[r.hour].tickets += 1
    })

    const shiftData = SHIFTS.map((s) => {
      const inShift = rows.filter((r) => r.shift === s.key)
      return { shift: s.label.split(" ")[0], sales: inShift.reduce((a, r) => a + r.total, 0), tickets: inShift.length }
    })

    const sellerMap = new Map<string, { name: string; sales: number; tickets: number }>()
    const nameOf = (id: string | null) => (id ? sellers.find((s) => s.id === id)?.name || "Empleado" : OWNER_LABEL)
    rows.forEach((r) => {
      const key = r.seller || "none"
      const cur = sellerMap.get(key) || { name: nameOf(r.seller), sales: 0, tickets: 0 }
      cur.sales += r.total
      cur.tickets += 1
      sellerMap.set(key, cur)
    })
    const sellerData = [...sellerMap.values()].sort((a, b) => b.sales - a.sales).slice(0, 8)

    const categoryMap = new Map<string, number>()
    active.forEach((s) => {
      ;(items.get(s.id) || []).forEach((i) => {
        if (filters.category && i.category !== filters.category) return
        categoryMap.set(i.category, (categoryMap.get(i.category) || 0) + i.subtotal)
      })
    })
    const categoryData = [...categoryMap.entries()]
      .filter(([, v]) => v > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, value], i) => ({ name, value, color: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }))

    const spark = (pick: (d: (typeof daily)[number]) => number) => daily.slice(-7).map((d) => ({ value: pick(d) }))

    return {
      totalSales,
      tickets,
      units,
      avgTicket,
      ticketsPerHour,
      salesPerHour,
      unitsPerTicket,
      voided,
      change,
      daily,
      oneDay,
      hourly,
      shiftData,
      sellerData,
      categoryData,
      spark,
    }
  }, [filters, sales, prevSales, items, sellers])

  const tooltipStyle = { backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }
  const money = (v: any) => formatCurrency(Number(v))

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Resumen Ejecutivo</h1>
        <p className="text-muted-foreground">Vista ejecutiva de rendimiento y eficiencia del negocio, con tus ventas reales</p>
      </div>

      <div className="mb-8">
        <GlobalFiltersComponent
          filters={filters}
          onChange={setFilters}
          branches={branches}
          sellers={sellers}
          categories={categories}
          showHourFilter
        />
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          No se pudieron cargar las ventas: {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-cyan-500/10 bg-card p-10 text-center text-muted-foreground">
          Cargando ventas...
        </div>
      ) : (
        <>
          {data.tickets === 0 && (
            <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
              No hay ventas con estos filtros. Probá con otra fecha, otra franja horaria o quitá algún filtro.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <KPICard
              title="Ventas Totales"
              value={formatCurrency(data.totalSales)}
              change={data.change.sales}
              changeLabel="vs período anterior"
              icon={DollarSign}
              sparklineData={data.spark((d) => d.sales)}
              onClick={() => router.push("/dashboard/ventas/historial")}
            />
            <KPICard
              title="Total Tickets"
              value={String(data.tickets)}
              change={data.change.tickets}
              changeLabel="vs período anterior"
              icon={ShoppingCart}
              sparklineData={data.spark((d) => d.tickets)}
              onClick={() => router.push("/dashboard/ventas/historial")}
            />
            <KPICard
              title="Ticket Promedio"
              value={formatCurrency(data.avgTicket)}
              change={data.change.avg}
              changeLabel="vs período anterior"
              icon={BarChart3}
            />
            <KPICard
              title="Unidades Vendidas"
              value={String(data.units)}
              icon={Package}
              sparklineData={data.spark((d) => d.units)}
            />
            <KPICard
              title="Tickets por Hora"
              value={data.ticketsPerHour.toFixed(1)}
              subtitle="Por hora con ventas"
              icon={Clock}
              onClick={() => router.push("/dashboard/estadisticas/ventas/productividad-horaria")}
            />
            <KPICard
              title="Ventas por Hora"
              value={formatCurrency(data.salesPerHour)}
              subtitle="Por hora con ventas"
              icon={TrendingUp}
              onClick={() => router.push("/dashboard/estadisticas/ventas/productividad-horaria")}
            />
            <KPICard title="Unidades por Ticket" value={data.unitsPerTicket.toFixed(2)} icon={ShoppingBag} />
            <KPICard title="Ventas Anuladas" value={String(data.voided)} icon={Ban} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard
              title={data.oneDay ? "Tendencia de Ventas (últimos 14 días)" : "Tendencia de Ventas Diarias"}
              subtitle="Facturación por día"
            >
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.daily} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    {chartDefs()}
                    <CartesianGrid {...gridProps} />
                    <XAxis dataKey="date" {...axisProps} dy={8} interval="preserveStartEnd" minTickGap={24} />
                    <YAxis {...axisProps} tickFormatter={moneyTick} width={52} />
                    <Tooltip cursor={cursorLine} content={<ChartTooltip valueFormatter={(v) => formatCurrency(v)} />} />
                    <Area
                      type="monotone"
                      dataKey="sales"
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

            <ChartCard title="Ventas por Categoría" subtitle="Participación en la facturación">
              <DonutChart
                data={data.categoryData.map((c) => ({ name: c.name, value: c.value }))}
                valueFormatter={(v) => formatCurrency(v)}
                centerLabel="Facturado"
                centerValue={formatCurrency(data.categoryData.reduce((a, c) => a + c.value, 0))}
              />
            </ChartCard>

            <ChartCard title="Ventas por Hora" subtitle="Cuándo se vende más">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.hourly} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    {chartDefs()}
                    <CartesianGrid {...gridProps} />
                    <XAxis dataKey="hour" {...axisProps} dy={6} interval={2} />
                    <YAxis {...axisProps} tickFormatter={moneyTick} width={52} />
                    <Tooltip cursor={cursorBar} content={<ChartTooltip valueFormatter={(v) => formatCurrency(v)} />} />
                    <Bar dataKey="sales" name="Ventas" fill={barFill("cyan")} radius={[6, 6, 0, 0]} maxBarSize={26} {...ANIMATION} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            <ChartCard title="Ventas por Turno" subtitle="Mañana, tarde y noche">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.shiftData} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
                    {chartDefs()}
                    <CartesianGrid {...gridProps} horizontal={false} vertical />
                    <XAxis type="number" {...axisProps} tickFormatter={moneyTick} />
                    <YAxis dataKey="shift" type="category" {...axisProps} width={70} />
                    <Tooltip cursor={cursorBar} content={<ChartTooltip valueFormatter={(v) => formatCurrency(v)} />} />
                    <Bar dataKey="sales" name="Ventas" fill={barFillH("indigo")} radius={[0, 8, 8, 0]} maxBarSize={30} {...ANIMATION} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            <ChartCard title="Top Vendedores" subtitle="Ranking por facturación" className="lg:col-span-2">
              {data.sellerData.length === 0 ? (
                <p className="py-16 text-center text-sm text-muted-foreground">Sin ventas para mostrar.</p>
              ) : (
                <div style={{ height: Math.max(220, data.sellerData.length * 52) }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.sellerData} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                      {chartDefs()}
                      <CartesianGrid {...gridProps} horizontal={false} vertical />
                      <XAxis type="number" {...axisProps} tickFormatter={moneyTick} />
                      <YAxis dataKey="name" type="category" {...axisProps} width={130} />
                      <Tooltip cursor={cursorBar} content={<ChartTooltip valueFormatter={(v) => formatCurrency(v)} />} />
                      <Bar dataKey="sales" name="Ventas" fill={barFillH("emerald")} radius={[0, 8, 8, 0]} maxBarSize={26} {...ANIMATION} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </ChartCard>
          </div>
        </>
      )}
    </div>
  )
}
