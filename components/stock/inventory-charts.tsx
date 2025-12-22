"use client"

import { useState } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

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
    <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-white">Rotación de Inventario</h3>
          <p className="text-xs text-gray-500">Veces/año por mes</p>
        </div>
        <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs">
          <span>+18%</span>
        </div>
      </div>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rotationData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#6b7280', fontSize: 10 }}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#6b7280', fontSize: 10 }}
              domain={[0, 8]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0d1424",
                border: "1px solid rgba(6, 182, 212, 0.2)",
                borderRadius: "8px",
                color: "#fff"
              }}
              formatter={(value: number) => [`${value.toFixed(1)}x`, "Rotación"]}
            />
            <Bar 
              dataKey="value" 
              fill="url(#barGradient)" 
              radius={[4, 4, 0, 0]}
            />
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.4} />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
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

  const total = stockBreakdownData.reduce((acc, d) => acc + d.value, 0)

  return (
    <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-white">Porcentaje de Quiebre</h3>
          <p className="text-xs text-gray-500">Por categoría</p>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <div className="h-[180px] w-[180px] relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={stockBreakdownData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                dataKey="value"
                paddingAngle={2}
              >
                {stockBreakdownData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-white">3.2%</span>
            <span className="text-xs text-gray-500">Total</span>
          </div>
        </div>
        <div className="flex-1 space-y-2">
          {stockBreakdownData.map((item) => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm text-gray-400">{item.name}</span>
              </div>
              <span className="text-sm font-medium text-white">{item.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
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
