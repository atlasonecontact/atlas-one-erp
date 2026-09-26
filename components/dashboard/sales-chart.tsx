"use client"

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
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
} from "@/components/charts/chart-theme"
import { moneyTick } from "@/lib/analytics/tickets"

const data = [
  { date: "1 Mar", value: 8500 },
  { date: "5 Mar", value: 9200 },
  { date: "8 Mar", value: 8800 },
  { date: "12 Mar", value: 10500 },
  { date: "15 Mar", value: 9800 },
  { date: "18 Mar", value: 11200 },
  { date: "22 Mar", value: 12800 },
  { date: "25 Mar", value: 11500 },
  { date: "28 Mar", value: 14200 },
  { date: "31 Mar", value: 15200 },
]

export function SalesChart() {
  return (
    <ChartCard title="Evolución de ventas" subtitle="Últimos 30 días">
      <div className="h-[290px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
            <ChartGradients />
            <CartesianGrid {...gridProps} />
            <XAxis dataKey="date" {...axisProps} dy={8} />
            <YAxis {...axisProps} tickFormatter={moneyTick} width={52} />
            <Tooltip
              cursor={cursorLine}
              content={<ChartTooltip valueFormatter={(v) => `$${Math.round(v).toLocaleString("es-AR")}`} />}
            />
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
  )
}
