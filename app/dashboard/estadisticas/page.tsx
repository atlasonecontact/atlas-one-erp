"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DollarSign, Users, Package, ShoppingCart, Download, Filter, ArrowUp, ArrowDown } from "lucide-react"
import { useDashboardData } from "@/lib/hooks/use-dashboard-data"
import { useTheme } from "@/lib/theme-context"

export default function EstadisticasPage() {
  const [period, setPeriod] = useState("30d")
  const { data, isLoading } = useDashboardData(period)
  const { config } = useTheme()

  const salesByCategory = [
    { name: "Bebidas", value: 35, color: "#06b6d4" },
    { name: "Snacks", value: 28, color: "#10b981" },
    { name: "Golosinas", value: 22, color: "#f59e0b" },
    { name: "Cigarrillos", value: 15, color: "#ef4444" },
  ]

  const hourlyData = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}:00`,
    sales: Math.floor(Math.random() * 100) + 20,
  }))

  const employeePerformance = [
    { name: "Juan Pérez", sales: 45, transactions: 120 },
    { name: "María García", sales: 38, transactions: 95 },
    { name: "Carlos López", sales: 32, transactions: 88 },
    { name: "Ana Martínez", sales: 28, transactions: 75 },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Estadísticas Detalladas</h1>
          <p className="text-gray-400 text-sm">Análisis profundo de tu negocio</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2 border-cyan-500/20 text-cyan-400 bg-transparent">
            <Filter className="w-4 h-4" />
            Filtros
          </Button>
          <Button className="gap-2 text-black" style={{ backgroundColor: config.primary }}>
            <Download className="w-4 h-4" />
            Exportar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Ingresos Totales",
            value: "$245,800",
            change: "+12.5%",
            isPositive: true,
            icon: DollarSign,
            color: "#06b6d4",
          },
          {
            label: "Transacciones",
            value: "1,234",
            change: "+8.3%",
            isPositive: true,
            icon: ShoppingCart,
            color: "#10b981",
          },
          {
            label: "Productos Vendidos",
            value: "3,456",
            change: "-2.1%",
            isPositive: false,
            icon: Package,
            color: "#f59e0b",
          },
          {
            label: "Clientes Activos",
            value: "892",
            change: "+5.7%",
            isPositive: true,
            icon: Users,
            color: "#8b5cf6",
          },
        ].map((stat, i) => (
          <div key={i} className="rounded-xl border bg-[#0a0f1a] p-5" style={{ borderColor: config.border }}>
            <div className="flex items-center justify-between mb-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${stat.color}20` }}
              >
                <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
              </div>
              <div className={`flex items-center gap-1 text-sm ${stat.isPositive ? "text-green-400" : "text-red-400"}`}>
                {stat.isPositive ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                {stat.change}
              </div>
            </div>
            <p className="text-2xl font-bold text-white mb-1">{stat.value}</p>
            <p className="text-sm text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="bg-[#0a0f1a] border" style={{ borderColor: config.border }}>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="productos">Productos</TabsTrigger>
          <TabsTrigger value="empleados">Empleados</TabsTrigger>
          <TabsTrigger value="horarios">Horarios</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-xl border bg-[#0a0f1a] p-6" style={{ borderColor: config.border }}>
              <h3 className="text-lg font-semibold text-white mb-4">Ventas por Categoría</h3>
              <div className="h-80">
                {/* Placeholder for Pie Chart */}
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="grid grid-cols-2 gap-4">
                      {salesByCategory.map((cat) => (
                        <div key={cat.name} className="flex items-center gap-3">
                          <div className="w-4 h-4 rounded" style={{ backgroundColor: cat.color }} />
                          <div>
                            <p className="text-sm text-white font-medium">{cat.name}</p>
                            <p className="text-xs text-gray-500">{cat.value}%</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border bg-[#0a0f1a] p-6" style={{ borderColor: config.border }}>
              <h3 className="text-lg font-semibold text-white mb-4">Métodos de Pago</h3>
              <div className="space-y-4">
                {[
                  { method: "Efectivo", amount: "$98,500", percentage: 40, color: "#06b6d4" },
                  { method: "Tarjeta", amount: "$73,800", percentage: 30, color: "#10b981" },
                  { method: "QR/Transferencia", amount: "$49,200", percentage: 20, color: "#f59e0b" },
                  { method: "Cuenta Corriente", amount: "$24,300", percentage: 10, color: "#8b5cf6" },
                ].map((payment) => (
                  <div key={payment.method}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-white">{payment.method}</span>
                      <span className="text-sm text-gray-400">{payment.amount}</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${payment.percentage}%`, backgroundColor: payment.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="productos" className="space-y-6 mt-6">
          <div className="rounded-xl border bg-[#0a0f1a]" style={{ borderColor: config.border }}>
            <div className="p-6 border-b" style={{ borderColor: config.border }}>
              <h3 className="text-lg font-semibold text-white">Rendimiento de Productos</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b" style={{ borderColor: config.border }}>
                  <tr>
                    <th className="text-left p-4 text-sm font-medium text-gray-400">Producto</th>
                    <th className="text-right p-4 text-sm font-medium text-gray-400">Ventas</th>
                    <th className="text-right p-4 text-sm font-medium text-gray-400">Unidades</th>
                    <th className="text-right p-4 text-sm font-medium text-gray-400">Tendencia</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topProducts.map((product, i) => (
                    <tr key={product.name} className="border-b" style={{ borderColor: config.border }}>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
                            style={{ backgroundColor: config.primaryMuted, color: config.primary }}
                          >
                            {i + 1}
                          </div>
                          <span className="text-white">{product.name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-right text-white">${product.sales.toLocaleString()}</td>
                      <td className="p-4 text-right text-gray-400">{product.units}</td>
                      <td className="p-4 text-right">
                        <span className="text-green-400 flex items-center justify-end gap-1">
                          <ArrowUp className="w-4 h-4" />+{Math.floor(Math.random() * 20)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="empleados" className="space-y-6 mt-6">
          <div className="rounded-xl border bg-[#0a0f1a]" style={{ borderColor: config.border }}>
            <div className="p-6 border-b" style={{ borderColor: config.border }}>
              <h3 className="text-lg font-semibold text-white">Rendimiento de Empleados</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {employeePerformance.map((employee, i) => (
                  <div key={employee.name} className="flex items-center gap-4">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center font-semibold"
                      style={{ backgroundColor: config.primaryMuted, color: config.primary }}
                    >
                      {employee.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-white font-medium">{employee.name}</p>
                        <p className="text-sm text-gray-400">{employee.transactions} transacciones</p>
                      </div>
                      <div className="w-full h-2 rounded-full bg-white/5">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${employee.sales}%`,
                            backgroundColor: config.primary,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="horarios" className="space-y-6 mt-6">
          <div className="rounded-xl border bg-[#0a0f1a] p-6" style={{ borderColor: config.border }}>
            <h3 className="text-lg font-semibold text-white mb-4">Ventas por Hora</h3>
            <div className="h-80">
              {/* Placeholder for Bar Chart */}
              <div className="grid grid-cols-12 gap-1 h-full items-end">
                {hourlyData.slice(8, 22).map((item, i) => (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <div
                      className="w-full rounded-t transition-all hover:opacity-80"
                      style={{
                        height: `${(item.sales / 120) * 100}%`,
                        backgroundColor: config.primary,
                      }}
                    />
                    <span className="text-xs text-gray-500">{item.hour}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
