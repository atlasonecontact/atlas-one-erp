"use client"

import type { ReactNode } from "react"
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"
import { cn } from "@/lib/utils"

// Tema unico para todos los graficos de Atlas One: paleta, degrades, ejes, tooltip y donut.

export const PALETTE = {
  cyan: "#22d3ee",
  indigo: "#818cf8",
  emerald: "#34d399",
  amber: "#fbbf24",
  rose: "#fb7185",
  violet: "#a78bfa",
  sky: "#38bdf8",
  lime: "#a3e635",
} as const

export type ChartColor = keyof typeof PALETTE
export const COLOR_ORDER: ChartColor[] = ["cyan", "indigo", "emerald", "amber", "rose", "violet", "sky", "lime"]
export const colorAt = (i: number) => PALETTE[COLOR_ORDER[i % COLOR_ORDER.length]]
export const nameAt = (i: number) => COLOR_ORDER[i % COLOR_ORDER.length]

/** Degrade vertical para barras. */
export const barFill = (c: ChartColor) => `url(#atlas-bar-${c})`
/** Degrade horizontal para barras acostadas. */
export const barFillH = (c: ChartColor) => `url(#atlas-barh-${c})`
/** Degrade que se desvanece hacia abajo, para areas. */
export const areaFill = (c: ChartColor) => `url(#atlas-area-${c})`

/** Definiciones SVG. Se llama como funcion ({chartDefs()}) porque recharts solo dibuja elementos SVG dentro del grafico. */
export function chartDefs() {
  return (
    <defs>
      {(Object.keys(PALETTE) as ChartColor[]).flatMap((name) => [
        <linearGradient key={`bar-${name}`} id={`atlas-bar-${name}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={PALETTE[name]} stopOpacity={1} />
          <stop offset="100%" stopColor={PALETTE[name]} stopOpacity={0.45} />
        </linearGradient>,
        <linearGradient key={`barh-${name}`} id={`atlas-barh-${name}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={PALETTE[name]} stopOpacity={0.45} />
          <stop offset="100%" stopColor={PALETTE[name]} stopOpacity={1} />
        </linearGradient>,
        <linearGradient key={`area-${name}`} id={`atlas-area-${name}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={PALETTE[name]} stopOpacity={0.4} />
          <stop offset="100%" stopColor={PALETTE[name]} stopOpacity={0} />
        </linearGradient>,
      ])}
    </defs>
  )
}

export const gridProps = {
  strokeDasharray: "3 6",
  stroke: "rgba(148,163,184,0.14)",
  vertical: false,
} as const

export const axisProps = {
  tick: { fill: "var(--muted-foreground)", fontSize: 12 },
  axisLine: false,
  tickLine: false,
} as const

export const legendProps = {
  iconType: "circle" as const,
  iconSize: 8,
  wrapperStyle: { fontSize: 12, color: "var(--muted-foreground)", paddingTop: 10 },
}

export const cursorBar = { fill: "rgba(148,163,184,0.08)", radius: 6 }
export const cursorLine = { stroke: "rgba(148,163,184,0.35)", strokeDasharray: "4 4" }
export const ANIMATION = { animationDuration: 700, animationEasing: "ease-out" as const }

const hexFromFill = (fill?: string) => {
  if (!fill) return undefined
  const m = /atlas-(?:bar|barh|area)-(\w+)/.exec(fill)
  if (m && m[1] in PALETTE) return PALETTE[m[1] as ChartColor]
  return fill
}

interface TooltipProps {
  active?: boolean
  payload?: any[]
  label?: any
  valueFormatter?: (value: number, name: string) => string
  labelFormatter?: (label: any) => string
}

/** Tooltip oscuro tipo "vidrio" con puntos de color por serie. */
export function ChartTooltip({ active, payload, label, valueFormatter, labelFormatter }: TooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  const title = labelFormatter ? labelFormatter(label) : label ?? payload[0]?.payload?.name
  return (
    <div className="min-w-[140px] rounded-xl border border-border bg-popover/95 px-3.5 py-2.5 text-xs shadow-2xl backdrop-blur">
      {title !== undefined && title !== "" && <p className="mb-1.5 font-semibold text-foreground">{String(title)}</p>}
      <div className="space-y-1">
        {payload.map((p, i) => {
          const dot = hexFromFill(p.color) || hexFromFill(p.payload?.color) || hexFromFill(p.fill) || colorAt(i)
          const name = p.name ?? p.dataKey
          const value = typeof p.value === "number" && valueFormatter ? valueFormatter(p.value, String(name)) : p.value
          return (
            <div key={i} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-2 text-muted-foreground">
                <span className="h-2 w-2 rounded-full" style={{ background: dot }} />
                {String(name)}
              </span>
              <span className="font-semibold text-foreground">{String(value)}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/** Tarjeta contenedora comun de graficos. */
export function ChartCard({
  title,
  subtitle,
  action,
  children,
  className,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card p-5 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.6)] sm:p-6",
        className,
      )}
    >
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
            <span className="h-4 w-1 rounded-full bg-gradient-to-b from-cyan-300 to-indigo-400" />
            <span className="truncate">{title}</span>
          </h3>
          {subtitle && <p className="mt-1 pl-3 text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

export function EmptyChart({ message = "Sin datos para mostrar." }: { message?: string }) {
  return <p className="py-16 text-center text-sm text-muted-foreground">{message}</p>
}

export interface DonutDatum {
  name: string
  value: number
}

/** Donut con total al centro y leyenda con porcentajes. */
export function DonutChart({
  data,
  valueFormatter = (v) => String(v),
  centerLabel = "Total",
  centerValue,
  height = 240,
}: {
  data: DonutDatum[]
  valueFormatter?: (v: number, name: string) => string
  centerLabel?: string
  centerValue?: string
  height?: number
}) {
  const total = data.reduce((a, d) => a + d.value, 0)
  if (data.length === 0 || total <= 0) return <EmptyChart />
  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row">
      <div className="relative w-full max-w-[240px] shrink-0" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<ChartTooltip valueFormatter={valueFormatter} />} />
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="68%"
              outerRadius="92%"
              paddingAngle={3}
              cornerRadius={6}
              stroke="none"
              {...ANIMATION}
            >
              {data.map((d, i) => (
                <Cell key={d.name} fill={colorAt(i)} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{centerLabel}</span>
          <span className="text-lg font-bold text-foreground">{centerValue ?? valueFormatter(total, "Total")}</span>
        </div>
      </div>
      <ul className="w-full min-w-0 flex-1 space-y-2">
        {data.map((d, i) => (
          <li key={d.name} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2 text-foreground">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: colorAt(i) }} />
              <span className="truncate">{d.name}</span>
            </span>
            <span className="shrink-0 text-muted-foreground">
              <span className="font-semibold text-foreground">{Math.round((d.value / total) * 100)}%</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
