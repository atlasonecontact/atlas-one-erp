"use client"

import { useMemo, useState } from "react"
import { Wallet, Receipt, TrendingUp, Percent, ArrowUp, ArrowDown, RefreshCw, QrCode, Landmark } from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import {
  ChartCard,
  chartDefs,
  ChartTooltip,
  DonutChart,
  PALETTE,
  ANIMATION,
  areaFill,
  axisProps,
  cursorLine,
  gridProps,
} from "@/components/charts/chart-theme"
import { formatCurrency } from "@/lib/utils/currency"
import { useTickets, ymdToday, shiftYmd, moneyTick, pct } from "@/lib/analytics/tickets"

export const dynamic = "force-dynamic"

// "Wallets" en este sistema son las ventas cobradas por QR o Transferencia (Mercado Pago, MODO,
// Ualá, etc. entran todas por ahí). No hay integración con cada billetera para saber marca,
// banco destino, comisión o si ya se acreditó — sólo se muestra lo que el POS registra de verdad.
export default function IngresosWalletsPage() {
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
    const isWallet = (m: string | null) => ["qr", "transfer"].includes((m || "").toLowerCase())
    const walletTickets = all.filter((t) => isWallet(t.payment))
    const prevWallet = previous.tickets.filter((t) => isWallet(t.payment))

    const totalRevenue = walletTickets.reduce((a, t) => a + t.total, 0)
    const prevRevenue = prevWallet.reduce((a, t) => a + t.total, 0)
    const totalAll = all.reduce((a, t) => a + t.total, 0)
    const avgTicket = walletTickets.length > 0 ? totalRevenue / walletTickets.length : 0
    const shareOfTotal = totalAll > 0 ? (totalRevenue / totalAll) * 100 : 0

    const qr = walletTickets.filter((t) => (t.payment || "").toLowerCase() === "qr")
    const transfer = walletTickets.filter((t) => (t.payment || "").toLowerCase() === "transfer")

    const dayIndex = new Map<string, number>()
    const dailySales = Array.from({ length: days }, (_, i) => {
      const ymd = shiftYmd(from, i)
      dayIndex.set(ymd, i)
      const [, m, d] = ymd.split("-")
      return { date: `${d}/${m}`, value: 0 }
    })
    walletTickets.forEach((t) => {
      const idx = dayIndex.get(t.day)
      if (idx !== undefined) dailySales[idx].value += t.total
    })

    const byMethod = [
      { name: "QR", value: qr.reduce((a, t) => a + t.total, 0), count: qr.length },
      { name: "Transferencia", value: transfer.reduce((a, t) => a + t.total, 0), count: transfer.length },
    ]

    const recent = [...walletTickets].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 100)

    return { totalRevenue, prevRevenue, avgTicket, shareOfTotal, count: walletTickets.length, dailySales, byMethod, recent }
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
          <h1 className="text-3xl font-bold text-foreground">Ingresos por Wallets</h1>
          <p className="mt-1 text-muted-foreground">Ventas cobradas por QR o transferencia, con tus datos reales</p>
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
      {!error && stats.count === 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
          No hay ventas por QR o transferencia en los últimos {days} días.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-cyan-500/10 bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/20">
              <Wallet className="h-6 w-6 text-cyan-400" />
            </div>
            {cmp !== undefined && (
              <div className={`flex items-center gap-1 text-sm ${cmp >= 0 ? "text-green-400" : "text-red-400"}`}>
                {cmp >= 0 ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                {Math.abs(cmp).toFixed(1)}%
              </div>
            )}
          </div>
          <p className="mb-1 text-3xl font-bold text-foreground">{formatCurrency(stats.totalRevenue)}</p>
          <p className="text-sm text-muted-foreground">Ingresos por Wallet</p>
          {cmp !== undefined && <p className="mt-1 text-xs text-muted-foreground">vs {days} días anteriores</p>}
        </div>

        <div className="rounded-xl border border-cyan-500/10 bg-card p-6">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/20">
            <Receipt className="h-6 w-6 text-blue-400" />
          </div>
          <p className="mb-1 text-3xl font-bold text-foreground">{stats.count.toLocaleString("es-AR")}</p>
          <p className="text-sm text-muted-foreground">Transacciones</p>
        </div>

        <div className="rounded-xl border border-cyan-500/10 bg-card p-6">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/20">
            <TrendingUp className="h-6 w-6 text-green-400" />
          </div>
          <p className="mb-1 text-3xl font-bold text-foreground">{formatCurrency(stats.avgTicket)}</p>
          <p className="text-sm text-muted-foreground">Ticket Promedio</p>
        </div>

        <div className="rounded-xl border border-cyan-500/10 bg-card p-6">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/20">
            <Percent className="h-6 w-6 text-purple-400" />
          </div>
          <p className="mb-1 text-3xl font-bold text-foreground">{stats.shareOfTotal.toFixed(1)}%</p>
          <p className="text-sm text-muted-foreground">del total de ventas</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="Ingresos por Wallet - Tendencia" subtitle={`Últimos ${days} días`}>
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
                  name="Wallet"
                  stroke={PALETTE.violet}
                  strokeWidth={2.5}
                  fill={areaFill("violet")}
                  dot={false}
                  activeDot={{ r: 6, fill: PALETTE.violet, stroke: "var(--card)", strokeWidth: 3 }}
                  {...ANIMATION}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="QR vs Transferencia" subtitle="Participación en el período">
          <DonutChart
            data={stats.byMethod}
            valueFormatter={(v) => formatCurrency(v)}
            centerLabel="Wallets"
            centerValue={formatCurrency(stats.totalRevenue)}
          />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex items-center justify-between rounded-xl border border-cyan-500/10 bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/15">
              <QrCode className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <p className="font-medium text-foreground">QR</p>
              <p className="text-xs text-muted-foreground">{stats.byMethod[0].count} transacciones</p>
            </div>
          </div>
          <p className="text-xl font-bold text-foreground">{formatCurrency(stats.byMethod[0].value)}</p>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-cyan-500/10 bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500/15">
              <Landmark className="h-5 w-5 text-sky-400" />
            </div>
            <div>
              <p className="font-medium text-foreground">Transferencia</p>
              <p className="text-xs text-muted-foreground">{stats.byMethod[1].count} transacciones</p>
            </div>
          </div>
          <p className="text-xl font-bold text-foreground">{formatCurrency(stats.byMethod[1].value)}</p>
        </div>
      </div>

      <div className="rounded-xl border border-cyan-500/10 bg-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <h3 className="text-lg font-semibold text-foreground">Últimas Ventas por Wallet</h3>
          <span className="rounded-full border border-cyan-500/20 px-2 py-0.5 text-xs text-cyan-400">
            {stats.recent.length}
          </span>
        </div>
        {/* Mobile: cards */}
        <div className="space-y-2 md:hidden">
          {stats.recent.map((t) => (
            <div key={t.id} className="rounded-lg border border-border bg-accent/50 p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-foreground">{t.branch}</p>
                  <p className="text-xs text-muted-foreground">{t.seller}</p>
                </div>
                <span className="text-sm font-semibold text-foreground">{formatCurrency(t.total)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span
                  className={`rounded-full px-2 py-0.5 ${
                    (t.payment || "").toLowerCase() === "qr"
                      ? "bg-violet-500/15 text-violet-300"
                      : "bg-sky-500/15 text-sky-300"
                  }`}
                >
                  {(t.payment || "").toLowerCase() === "qr" ? "QR" : "Transferencia"}
                </span>
                <span className="text-muted-foreground">
                  {new Date(t.createdAt).toLocaleString("es-AR", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <p className="mt-1 font-mono text-xs text-muted-foreground" title={t.number}>
                #{t.number.slice(-8)}
              </p>
            </div>
          ))}
          {stats.recent.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">Sin ventas por wallet en este período.</p>
          )}
        </div>

        {/* Desktop: tabla */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-2 pr-4 font-medium">Fecha</th>
                <th className="py-2 pr-4 font-medium">Método</th>
                <th className="py-2 pr-4 font-medium">Sucursal</th>
                <th className="py-2 pr-4 font-medium">Vendedor</th>
                <th className="py-2 pr-4 font-medium">Nº Venta</th>
                <th className="py-2 pl-4 text-right font-medium">Monto</th>
              </tr>
            </thead>
            <tbody>
              {stats.recent.map((t) => (
                <tr key={t.id} className="border-b border-border hover:bg-accent/50">
                  <td className="py-2.5 pr-4 text-muted-foreground">
                    {new Date(t.createdAt).toLocaleString("es-AR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="py-2.5 pr-4">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        (t.payment || "").toLowerCase() === "qr"
                          ? "bg-violet-500/15 text-violet-300"
                          : "bg-sky-500/15 text-sky-300"
                      }`}
                    >
                      {(t.payment || "").toLowerCase() === "qr" ? "QR" : "Transferencia"}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4 text-muted-foreground">{t.branch}</td>
                  <td className="py-2.5 pr-4 text-muted-foreground">{t.seller}</td>
                  <td className="py-2.5 pr-4 font-mono text-xs text-muted-foreground" title={t.number}>
                    {t.number.slice(-8)}
                  </td>
                  <td className="py-2.5 pl-4 text-right font-semibold text-foreground">{formatCurrency(t.total)}</td>
                </tr>
              ))}
              {stats.recent.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    Sin ventas por wallet en este período.
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
