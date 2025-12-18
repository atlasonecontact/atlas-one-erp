"use client"

import { useState } from "react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

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
  const [activePoint, setActivePoint] = useState<{ date: string; value: number } | null>(null)

  return (
    <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-5">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Evolución de ventas</h3>
          <p className="text-sm text-gray-500">Últimos 30 días</p>
        </div>
        {activePoint && (
          <div className="text-right">
            <p className="text-sm text-gray-400">{activePoint.date}</p>
            <p className="text-xl font-bold text-cyan-400">${activePoint.value.toLocaleString()}</p>
          </div>
        )}
      </div>

      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            onMouseMove={(e) => {
              if (e.activePayload) {
                setActivePoint(e.activePayload[0].payload)
              }
            }}
            onMouseLeave={() => setActivePoint(null)}
          >
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(34, 211, 238, 0.1)" vertical={false} />
            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} dy={10} />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748b", fontSize: 12 }}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              dx={-10}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0a0f1a",
                border: "1px solid rgba(34, 211, 238, 0.2)",
                borderRadius: "8px",
                color: "#fff",
              }}
              formatter={(value: number) => [`$${value.toLocaleString()}`, "Ventas"]}
              labelStyle={{ color: "#94a3b8" }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#22d3ee"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorValue)"
              dot={false}
              activeDot={{ r: 6, fill: "#22d3ee", stroke: "#0a0f1a", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
