"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Trophy, TrendingUp, Users, Clock, Download, RefreshCw } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
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
import { useTickets, ymdToday, shiftYmd, moneyTick, SHIFT_LABEL, type ShiftKey } from "@/lib/analytics/tickets"

export const dynamic = "force-dynamic"

const SHIFT_KEYS: ShiftKey[] = ["morning", "afternoon", "night"]
const SHIFTS = SHIFT_KEYS.map((k) => SHIFT_LABEL[k])

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
  const days = period === "7d" ? 7 : period === "30d" ? 30 : 90
  const today = ymdToday()
  const from = shiftYmd(today, -(days - 1))
  const { tickets, loading, error } = useTickets(from, today, false)

  // El turno se deduce de la hora de cada venta: mañana 6-14h, tarde 14-22h, noche 22-6h.
  const stats = useMemo(() => {
    const bySeller = new Map<string, SellerStats>()
    tickets.forEach((t) => {
      const key = t.sellerId || "none"
      let s = bySeller.get(key)
      if (!s) {
        s = {
          seller: t.seller,
          total: 0,
          tickets: 0,
          byShift: SHIFTS.map((shift) => ({ shift, sales: 0, tickets: 0 })),
        }
        bySeller.set(key, s)
      }
      const shiftLabel = SHIFT_LABEL[t.shift]
      const b = s.byShift.find((x) => x.shift === shiftLabel)!
      b.sales += t.total
      b.tickets += 1
      s.total += t.total
      s.tickets += 1
    })
    const sellers = [...bySeller.values()].sort((a, b) => b.total - a.total)
    const byShiftTotals: ShiftSales[] = SHIFTS.map((shift) => ({
      shift,
      sales: sellers.reduce((sum, s) => sum + (s.byShift.find((b) => b.shift === shift)?.sales ?? 0), 0),
      tickets: sellers.reduce((sum, s) => sum + (s.byShift.find((b) => b.shift === shift)?.tickets ?? 0), 0),
    }))
    return { sellers, byShiftTotals }
  }, [tickets])

  const formatMoney = (value: number) => formatCurrency(value)

  const exportCsv = () => {
    const rows = [
      ["Vendedor", ...SHIFTS, "Total", "Tickets"],
      ...stats.sellers.map((s) => [s.seller, ...s.byShift.map((b) => String(b.sales)), String(s.total), String(s.tickets)]),
    ]
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(";")).join("\r\n")
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `desempeno_vendedores_${from}_${today}.csv`
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
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Desempeño por Vendedor</h1>
          <p className="text-muted-foreground mt-1">Cuánto vendió cada vendedor, turno por turno, con tus ventas reales</p>
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
            disabled={stats.sellers.length === 0}
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
      {!error && stats.sellers.length === 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
          No hay ventas en los últimos {days} días.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-cyan-500/10 bg-gradient-to-br from-[#0a0f1a] to-[#0d1525] p-6">
          <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center mb-4">
            <Trophy className="w-6 h-6 text-yellow-400" />
          </div>
          <p className="text-2xl font-bold text-foreground mb-1 truncate">{topSeller ? topSeller.seller : "-"}</p>
          <p className="text-sm text-muted-foreground">Vendedor Top {topSeller ? `(${formatMoney(topSeller.total)})` : ""}</p>
        </div>

        <div className="rounded-xl border border-cyan-500/10 bg-gradient-to-br from-[#0a0f1a] to-[#0d1525] p-6">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center mb-4">
            <TrendingUp className="w-6 h-6 text-cyan-400" />
          </div>
          <p className="text-3xl font-bold text-foreground mb-1">{formatMoney(avgTicket)}</p>
          <p className="text-sm text-muted-foreground">Ticket Promedio</p>
        </div>

        <div className="rounded-xl border border-cyan-500/10 bg-gradient-to-br from-[#0a0f1a] to-[#0d1525] p-6">
          <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center mb-4">
            <Users className="w-6 h-6 text-green-400" />
          </div>
          <p className="text-3xl font-bold text-foreground mb-1">{stats.sellers.length}</p>
          <p className="text-sm text-muted-foreground">Vendedores Activos</p>
        </div>

        <div className="rounded-xl border border-cyan-500/10 bg-gradient-to-br from-[#0a0f1a] to-[#0d1525] p-6">
          <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-4">
            <Clock className="w-6 h-6 text-purple-400" />
          </div>
          <p className="text-3xl font-bold text-foreground mb-1">{bestShift && bestShift.sales > 0 ? bestShift.shift : "-"}</p>
          <p className="text-sm text-muted-foreground">Turno Más Productivo</p>
        </div>
      </div>

      <ChartCard title="Ventas por Vendedor y Turno" subtitle="Facturación de cada vendedor según el turno de la caja">
        <div className="h-[340px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              {chartDefs()}
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="seller" {...axisProps} dy={6} />
              <YAxis {...axisProps} tickFormatter={moneyTick} width={52} />
              <Tooltip cursor={cursorBar} content={<ChartTooltip valueFormatter={(v) => formatMoney(v)} />} />
              <Legend {...legendProps} />
              {SHIFTS.map((shift, i) => (
                <Bar
                  key={shift}
                  dataKey={shift}
                  stackId="turno"
                  fill={barFill(["cyan", "violet", "amber"][i] as "cyan" | "violet" | "amber")}
                  radius={i === SHIFTS.length - 1 ? [8, 8, 0, 0] : [0, 0, 0, 0]}
                  maxBarSize={56}
                  {...ANIMATION}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <div className="rounded-xl border border-cyan-500/10 bg-card p-6">
        <h3 className="text-lg font-semibold text-foreground mb-6">Ranking de Vendedores</h3>
        {/* Mobile: cards */}
        <div className="space-y-2 md:hidden">
          {stats.sellers.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Sin ventas para mostrar.</p>
          ) : (
            stats.sellers.map((s, i) => (
              <div key={s.seller + i} className="rounded-lg border border-border bg-accent/50 p-3">
                <div className="flex items-center gap-3">
                  {i === 0 ? (
                    <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-yellow-500/20 text-xs font-bold text-yellow-400">
                      1
                    </span>
                  ) : i === 1 ? (
                    <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-400/20 text-xs font-bold text-muted-foreground">
                      2
                    </span>
                  ) : i === 2 ? (
                    <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-700/20 text-xs font-bold text-orange-400">
                      3
                    </span>
                  ) : (
                    <span className="w-6 shrink-0 pl-1.5 text-xs text-muted-foreground">{i + 1}</span>
                  )}
                  <p className="flex-1 truncate font-medium text-foreground">{s.seller}</p>
                  <span className="font-semibold text-cyan-400">{formatMoney(s.total)}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 pl-9 text-xs text-muted-foreground">
                  {s.byShift.map((b) => (
                    <span key={b.shift}>
                      {b.shift}: {formatMoney(b.sales)}
                    </span>
                  ))}
                  <span className="text-muted-foreground">{s.tickets} tickets</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop: tabla */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b border-gray-800">
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
              {stats.sellers.length === 0 ? (
                <tr>
                  <td colSpan={SHIFTS.length + 4} className="py-8 text-center text-muted-foreground">
                    Sin ventas para mostrar.
                  </td>
                </tr>
              ) : (
                stats.sellers.map((s, i) => (
                  <tr key={s.seller + i} className="border-b border-gray-800/50 last:border-0">
                    <td className="py-3 pr-4">
                      {i === 0 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-bold">
                          1
                        </span>
                      ) : i === 1 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-400/20 text-muted-foreground text-xs font-bold">
                          2
                        </span>
                      ) : i === 2 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-700/20 text-orange-400 text-xs font-bold">
                          3
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs pl-1.5">{i + 1}</span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-foreground font-medium">{s.seller}</td>
                    {s.byShift.map((b) => (
                      <td key={b.shift} className="py-3 pr-4 text-right text-muted-foreground">
                        {formatMoney(b.sales)}
                      </td>
                    ))}
                    <td className="py-3 pr-4 text-right text-cyan-400 font-semibold">{formatMoney(s.total)}</td>
                    <td className="py-3 text-right text-muted-foreground">{s.tickets}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
