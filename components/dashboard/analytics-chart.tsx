"use client"

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Line, Legend } from "recharts"
import {
  ChartCard,
  ChartGradients,
  ChartTooltip,
  PALETTE,
  ANIMATION,
  areaFill,
  axisProps,
  cursorLine,
  gridProps,
  legendProps,
} from "@/components/charts/chart-theme"
import { moneyTick } from "@/lib/analytics/tickets"

interface AnalyticsChartProps {
  data?: { month: string; sales: number; units?: number }[]
  title?: string
  subtitle?: string
  isLoading?: boolean
  type?: "area" | "bar" | "combined"
}

const defaultData = [
  { month: "Feb", sales: 85000, units: 280 },
  { month: "Mar", sales: 92000, units: 310 },
  { month: "Abr", sales: 88000, units: 295 },
  { month: "May", sales: 105000, units: 340 },
  { month: "Jun", sales: 98000, units: 320 },
  { month: "Jul", sales: 112000, units: 365 },
  { month: "Ago", sales: 125000, units: 410 },
  { month: "Sep", sales: 118000, units: 385 },
]

const money = (v: number) => `$${Math.round(v).toLocaleString("es-AR")}`

export function AnalyticsChart({
  data = defaultData,
  title = "Analítica",
  subtitle = "Últimos 12 Meses",
  isLoading = false,
  type = "combined",
}: AnalyticsChartProps) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-white/[0.07] bg-[#0a0f1a] p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="h-5 w-24 animate-pulse rounded bg-white/10" />
          <div className="h-8 w-32 animate-pulse rounded bg-white/10" />
        </div>
        <div className="h-[280px] animate-pulse rounded-xl bg-white/5" />
      </div>
    )
  }

  const tooltip = (
    <Tooltip
      cursor={cursorLine}
      content={<ChartTooltip valueFormatter={(v, name) => (name === "Facturación" || name === "Ventas" ? money(v) : String(v))} />}
    />
  )

  return (
    <ChartCard title={title} subtitle={subtitle}>
      <div className="h-[290px]">
        <ResponsiveContainer width="100%" height="100%">
          {type === "combined" ? (
            <ComposedChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
              <ChartGradients />
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="month" {...axisProps} dy={8} />
              <YAxis yAxisId="left" {...axisProps} tickFormatter={moneyTick} width={52} />
              <YAxis yAxisId="right" orientation="right" {...axisProps} width={40} />
              {tooltip}
              <Legend {...legendProps} />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="sales"
                name="Facturación"
                stroke={PALETTE.cyan}
                strokeWidth={2.5}
                fill={areaFill("cyan")}
                dot={false}
                activeDot={{ r: 6, fill: PALETTE.cyan, stroke: "#0a0f1a", strokeWidth: 3 }}
                {...ANIMATION}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="units"
                name="Unidades"
                stroke={PALETTE.indigo}
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, fill: PALETTE.indigo, stroke: "#0a0f1a", strokeWidth: 3 }}
                {...ANIMATION}
              />
            </ComposedChart>
          ) : (
            <AreaChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
              <ChartGradients />
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="month" {...axisProps} dy={8} />
              <YAxis {...axisProps} tickFormatter={moneyTick} width={52} />
              {tooltip}
              <Area
                type="monotone"
                dataKey="sales"
                name="Ventas"
                stroke={PALETTE.cyan}
                strokeWidth={2.5}
                fill={areaFill("cyan")}
                dot={false}
                activeDot={{ r: 6, fill: PALETTE.cyan, stroke: "#0a0f1a", strokeWidth: 3 }}
                {...ANIMATION}
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}
