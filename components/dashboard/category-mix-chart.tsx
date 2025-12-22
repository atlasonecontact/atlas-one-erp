"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"

interface CategoryMixProps {
  data?: { name: string; value: number; color: string }[]
  title?: string
  isLoading?: boolean
}

const defaultData = [
  { name: "Bebidas", value: 35, color: "#22d3ee" },
  { name: "Alimentos", value: 42, color: "#3b82f6" },
  { name: "Tabaco", value: 23, color: "#8b5cf6" },
]

export function CategoryMixChart({ data = defaultData, title = "Mix de Ventas por Categoría", isLoading = false }: CategoryMixProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0)

  if (isLoading) {
    return (
      <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-5 h-full">
        <div className="h-4 bg-white/10 rounded w-40 mb-4 animate-pulse" />
        <div className="flex items-center justify-center h-[200px]">
          <div className="w-32 h-32 rounded-full bg-white/10 animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-5 h-full">
      <h3 className="text-sm font-medium text-white mb-4">{title}</h3>
      
      <div className="flex items-center gap-4">
        <div className="relative w-32 h-32 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={35}
                outerRadius={55}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0a0f1a",
                  border: "1px solid rgba(34, 211, 238, 0.2)",
                  borderRadius: "8px",
                  color: "#fff",
                  fontSize: "12px",
                }}
                formatter={(value: number) => [`${value}%`, ""]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-2 flex-1">
          {data.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm text-gray-300">{item.name}</span>
              </div>
              <span className="text-sm font-medium text-white">{item.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
