"use client"

import { useState } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { ChartCard, chartDefs, ChartTooltip, DonutChart, ANIMATION, axisProps, barFill, cursorBar, gridProps } from "@/components/charts/chart-theme"

interface InventoryChartsProps {
  isLoading?: boolean
}

const rotationData = [
  { name: "Ene", value: 4.2 },
  { name: "Feb", value: 3.8 },
  { name: "Mar", value: 4.5 },
  { name: "Abr", value: 5.1 },
  { name: "May", value: 4.8 },
  { name: "Jun", value: 5.5 },
  { name: "Jul", value: 5.2 },
  { name: "Ago", value: 4.9 },
  { name: "Sep", value: 5.8 },
  { name: "Oct", value: 6.2 },
  { name: "Nov", value: 5.9 },
  { name: "Dic", value: 6.5 },
]

const stockBreakdownData = [
  { name: "Bebidas", value: 35, color: "#06b6d4" },
  { name: "Snacks", value: 25, color: "#22c55e" },
  { name: "Cigarrillos", value: 20, color: "#f59e0b" },
  { name: "Lácteos", value: 12, color: "#8b5cf6" },
  { name: "Otros", value: 8, color: "#ec4899" },
]

export function InventoryRotationChart({ isLoading }: InventoryChartsProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-5">
        <div className="h-6 w-40 bg-white/5 rounded animate-pulse mb-4" />
        <div className="h-[200px] bg-white/5 rounded animate-pulse" />
      </div>
    )
  }

  return (
    <ChartCard
      title="Rotación de Inventario"
      subtitle="Veces/año por mes"
      action={<span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-400">+18%</span>}
    >
      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rotationData} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
            {chartDefs()}
            <CartesianGrid {...gridProps} />
            <XAxis dataKey="name" {...axisProps} dy={6} />
            <YAxis {...axisProps} domain={[0, 8]} />
            <Tooltip cursor={cursorBar} content={<ChartTooltip valueFormatter={(v) => `${v.toFixed(1)}x`} />} />
            <Bar dataKey="value" name="Rotación" fill={barFill("cyan")} radius={[6, 6, 0, 0]} maxBarSize={28} {...ANIMATION} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}

export function StockBreakdownChart({ isLoading }: InventoryChartsProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-5">
        <div className="h-6 w-40 bg-white/5 rounded animate-pulse mb-4" />
        <div className="h-[200px] bg-white/5 rounded animate-pulse" />
      </div>
    )
  }

  return (
    <ChartCard title="Porcentaje de Quiebre" subtitle="Por categoría">
      <DonutChart
        data={stockBreakdownData.map((d) => ({ name: d.name, value: d.value }))}
        valueFormatter={(v) => `${v}%`}
        centerLabel="Total"
        centerValue="3.2%"
        height={200}
      />
    </ChartCard>
  )
}

export function InventoryKPICards({ isLoading }: InventoryChartsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-4">
            <div className="h-4 w-20 bg-white/5 rounded animate-pulse mb-2" />
            <div className="h-8 w-24 bg-white/5 rounded animate-pulse" />
          </div>
        ))}
      </div>
    )
  }

  const kpis = [
    { 
      label: "Valor de Inventario", 
      value: "$2.847.500", 
      change: 5.2, 
      positive: true,
      color: "text-cyan-400"
    },
    { 
      label: "Días de Inventario", 
      value: "18.4", 
      suffix: "días",
      change: -2.3, 
      positive: true, // Lower is better
      color: "text-green-400"
    },
    { 
      label: "GMROI", 
      value: "3.24", 
      change: 8.1, 
      positive: true,
      color: "text-purple-400"
    },
    { 
      label: "Tasa de Merma", 
      value: "1.2", 
      suffix: "%",
      change: -0.3, 
      positive: true, // Lower is better
      color: "text-yellow-400"
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4">
      {kpis.map((kpi) => (
        <div key={kpi.label} className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">{kpi.label}</span>
            <span className={`text-xs ${kpi.positive ? "text-green-400" : "text-red-400"}`}>
              {kpi.change > 0 ? "+" : ""}{kpi.change}%
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</span>
            {kpi.suffix && <span className="text-sm text-gray-500">{kpi.suffix}</span>}
          </div>
        </div>
      ))}
    </div>
  )
}

export function OutOfStockList({ isLoading }: InventoryChartsProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-5">
        <div className="h-6 w-40 bg-white/5 rounded animate-pulse mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-white/5 rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const outOfStock = [
    { name: "Coca-Cola 500ml", category: "Bebidas", lastSale: "Hace 2 días", urgency: "high" },
    { name: "Marlboro Box", category: "Cigarrillos", lastSale: "Hace 1 día", urgency: "high" },
    { name: "Papas Lays 150g", category: "Snacks", lastSale: "Hace 3 días", urgency: "medium" },
    { name: "Yogur Activia", category: "Lácteos", lastSale: "Hace 5 días", urgency: "low" },
    { name: "Red Bull 250ml", category: "Bebidas", lastSale: "Hace 1 día", urgency: "high" },
  ]

  return (
    <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-white">Productos sin Stock</h3>
          <p className="text-xs text-gray-500">{outOfStock.length} productos</p>
        </div>
        <span className="text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-400">
          Urgente
        </span>
      </div>
      <div className="space-y-2">
        {outOfStock.map((product, i) => (
          <div 
            key={i}
            className={`flex items-center justify-between p-3 rounded-lg border ${
              product.urgency === "high" 
                ? "bg-red-500/10 border-red-500/20"
                : product.urgency === "medium"
                  ? "bg-yellow-500/10 border-yellow-500/20"
                  : "bg-white/5 border-white/10"
            }`}
          >
            <div>
              <p className="text-sm text-white">{product.name}</p>
              <p className="text-xs text-gray-500">{product.category}</p>
            </div>
            <div className="text-right">
              <p className={`text-xs ${
                product.urgency === "high" ? "text-red-400" : "text-gray-400"
              }`}>
                {product.lastSale}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
