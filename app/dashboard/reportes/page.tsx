"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { salesByDay, topProducts } from "@/lib/demo-data"
import { Download, FileText, Table, Calendar } from "lucide-react"

const pieData = [
  { name: "Bebidas", value: 35, color: "#22d3ee" },
  { name: "Snacks", value: 25, color: "#06b6d4" },
  { name: "Cigarrillos", value: 20, color: "#0891b2" },
  { name: "Golosinas", value: 12, color: "#0e7490" },
  { name: "Otros", value: 8, color: "#155e75" },
]

export default function ReportesPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("week")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Reportes</h1>
          <p className="text-gray-400 text-sm">Análisis y estadísticas de tu negocio</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-[#0a0f1a] border border-cyan-500/10 rounded-lg p-1">
            {["week", "month", "year"].map((p) => (
              <button
                key={p}
                onClick={() => setSelectedPeriod(p)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  selectedPeriod === p ? "bg-cyan-500/20 text-cyan-400" : "text-gray-400 hover:text-white"
                }`}
              >
                {p === "week" ? "Semana" : p === "month" ? "Mes" : "Año"}
              </button>
            ))}
          </div>
          <Button variant="outline" className="border-cyan-500/20 text-gray-400 hover:text-white bg-transparent gap-2">
            <Calendar className="w-4 h-4" />
            Personalizado
          </Button>
        </div>
      </div>

      {/* Export buttons */}
      <div className="flex items-center gap-3">
        <Button variant="outline" className="border-cyan-500/20 text-gray-400 hover:text-white bg-transparent gap-2">
          <FileText className="w-4 h-4" />
          Exportar PDF
        </Button>
        <Button variant="outline" className="border-cyan-500/20 text-gray-400 hover:text-white bg-transparent gap-2">
          <Table className="w-4 h-4" />
          Exportar Excel
        </Button>
        <Button variant="outline" className="border-cyan-500/20 text-gray-400 hover:text-white bg-transparent gap-2">
          <Download className="w-4 h-4" />
          Descargar Todo
        </Button>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales by Day */}
        <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Ventas por Día</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(34, 211, 238, 0.1)" vertical={false} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0a0f1a",
                    border: "1px solid rgba(34, 211, 238, 0.2)",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, "Ventas"]}
                />
                <Bar dataKey="sales" fill="#22d3ee" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sales by Category */}
        <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Ventas por Categoría</h3>
          <div className="h-[300px] flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0a0f1a",
                    border: "1px solid rgba(34, 211, 238, 0.2)",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                  formatter={(value: number) => [`${value}%`, ""]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {pieData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-gray-400">{item.name}</span>
                  <span className="text-sm text-white font-medium">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top Products Table */}
      <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-5">
        <h3 className="text-lg font-semibold text-white mb-4">Top Productos</h3>
        <div className="space-y-4">
          {topProducts.map((product, i) => (
            <div key={i} className="flex items-center gap-4">
              <span className="text-2xl font-bold text-cyan-400 w-8">#{i + 1}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium">{product.name}</span>
                  <span className="text-gray-400">{product.sales} unidades</span>
                </div>
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-cyan-400"
                    style={{ width: `${product.percentage}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
