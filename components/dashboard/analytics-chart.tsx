"use client"

import { useState } from "react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, ComposedChart, Line } from "recharts"

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

export function AnalyticsChart({ 
  data = defaultData, 
  title = "Analítica", 
  subtitle = "Últimos 12 Meses",
  isLoading = false,
  type = "combined"
}: AnalyticsChartProps) {
  const [activePoint, setActivePoint] = useState<{ month: string; sales: number; units?: number } | null>(null)

  if (isLoading) {
    return (
      <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-5">
        <div className="flex justify-between items-center mb-6">
          <div className="h-5 bg-white/10 rounded w-24 animate-pulse" />
          <div className="h-8 bg-white/10 rounded w-32 animate-pulse" />
        </div>
        <div className="h-[280px] bg-white/5 rounded animate-pulse" />
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-5">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <p className="text-sm text-gray-500">{subtitle}</p>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 text-xs bg-cyan-500/20 text-cyan-400 rounded-lg">
            Fact vs Unid
          </button>
        </div>
      </div>

      {activePoint && (
        <div className="mb-4 p-3 rounded-lg bg-white/5 border border-cyan-500/20 inline-flex gap-6">
          <div>
            <p className="text-xs text-gray-400">{activePoint.month} 2024</p>
            <p className="text-sm text-gray-400">Total facturado</p>
            <p className="text-xl font-bold text-white">${activePoint.sales.toLocaleString('es-AR')}</p>
          </div>
          {activePoint.units && (
            <div>
              <p className="text-xs text-gray-400">&nbsp;</p>
              <p className="text-sm text-gray-400">Unidades</p>
              <p className="text-xl font-bold text-cyan-400">{activePoint.units}</p>
            </div>
          )}
        </div>
      )}

      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          {type === "combined" ? (
            <ComposedChart
              data={data}
              onMouseMove={(e) => {
                if (e.activePayload) {
                  setActivePoint(e.activePayload[0].payload)
                }
              }}
              onMouseLeave={() => setActivePoint(null)}
            >
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(34, 211, 238, 0.1)" vertical={false} />
              <XAxis 
                dataKey="month" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: "#64748b", fontSize: 12 }} 
                dy={10} 
              />
              <YAxis
                yAxisId="left"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#64748b", fontSize: 12 }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                dx={-10}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#64748b", fontSize: 12 }}
                dx={10}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0a0f1a",
                  border: "1px solid rgba(34, 211, 238, 0.2)",
                  borderRadius: "8px",
                  color: "#fff",
                }}
                formatter={(value: number, name: string) => [
                  name === "sales" ? `$${value.toLocaleString()}` : value,
                  name === "sales" ? "Facturación" : "Unidades"
                ]}
                labelStyle={{ color: "#94a3b8" }}
              />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="sales"
                stroke="#22d3ee"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorSales)"
                dot={false}
                activeDot={{ r: 6, fill: "#22d3ee", stroke: "#0a0f1a", strokeWidth: 2 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="units"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: "#3b82f6" }}
              />
            </ComposedChart>
          ) : (
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
                <linearGradient id="colorValue2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(34, 211, 238, 0.1)" vertical={false} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} dy={10} />
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
                dataKey="sales"
                stroke="#22d3ee"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorValue2)"
                dot={false}
                activeDot={{ r: 6, fill: "#22d3ee", stroke: "#0a0f1a", strokeWidth: 2 }}
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

      <div className="flex items-center gap-6 mt-4 pt-4 border-t border-cyan-500/10">
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-cyan-400" />
          <span className="text-xs text-gray-400">Facturación</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-blue-500" />
          <span className="text-xs text-gray-400">Unidades Vendidas</span>
        </div>
      </div>
    </div>
  )
}
