"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DollarSign, Users, Package, ShoppingCart, Download, Filter, ArrowUp, ArrowDown, RefreshCw } from "lucide-react"
import { useDashboardData } from "@/lib/hooks/use-dashboard-data"
import { useTheme } from "@/lib/theme-context"
import { createClient } from "@/lib/supabase/client"

interface StatsData {
  totalRevenue: number
  totalTransactions: number
  totalProducts: number
  totalEmployees: number
  revenueChange: number
  transactionsChange: number
  productsChange: number
  employeesChange: number
  salesByCategory: { name: string; value: number; color: string }[]
  paymentMethods: { method: string; amount: number; percentage: number; color: string }[]
  hourlyData: { hour: string; sales: number }[]
  employeePerformance: { name: string; sales: number; transactions: number }[]
}

export default function EstadisticasPage() {
  const [period, setPeriod] = useState("30d")
  const { data, isLoading } = useDashboardData(period)
  const { config } = useTheme()
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loadingStats, setLoadingStats] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadStats()
  }, [period])

  const loadStats = async () => {
    setLoadingStats(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: kioscos } = await supabase
        .from("kioscos")
        .select("id")
        .eq("owner_id", user.id)
      
      if (!kioscos || kioscos.length === 0) {
        setLoadingStats(false)
        return
      }
      const kioskoIds = kioscos.map(k => k.id)

      const days = period === "7d" ? 7 : period === "30d" ? 30 : 90
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)
      const prevStartDate = new Date()
      prevStartDate.setDate(prevStartDate.getDate() - days * 2)

      // Current period sales
      const { data: currentSales } = await supabase
        .from("sales")
        .select("id, total_amount, payment_method, created_at")
        .in("kiosko_id", kioskoIds)
        .gte("created_at", startDate.toISOString())

      // Previous period for comparison
      const { data: prevSales } = await supabase
        .from("sales")
        .select("total_amount")
        .in("kiosko_id", kioskoIds)
        .gte("created_at", prevStartDate.toISOString())
        .lt("created_at", startDate.toISOString())

      // Get employees
      const { data: employees } = await supabase
        .from("employees")
        .select("id, first_name, last_name")
        .in("kiosko_id", kioskoIds)

      // Get products with categories
      const { data: products } = await supabase
        .from("products")
        .select("id, name, category")
        .in("kiosko_id", kioskoIds)

      // Get sale items for category and employee breakdown
      const saleIds = currentSales?.map(s => s.id) || []
      const { data: saleItems } = await supabase
        .from("sale_items")
        .select("sale_id, product_id, quantity, unit_price, products(category)")
        .in("sale_id", saleIds)

      // Get sales with employee info
      const { data: salesWithEmployee } = await supabase
        .from("sales")
        .select("id, total_amount, employee_id")
        .in("kiosko_id", kioskoIds)
        .gte("created_at", startDate.toISOString())

      // Calculate totals
      const totalRevenue = currentSales?.reduce((sum, s) => sum + Number(s.total_amount), 0) || 0
      const prevRevenue = prevSales?.reduce((sum, s) => sum + Number(s.total_amount), 0) || 0
      const totalTransactions = currentSales?.length || 0
      const prevTransactions = prevSales?.length || 0
      const totalProducts = products?.length || 0
      const totalEmployees = employees?.length || 0

      const revenueChange = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0
      const transactionsChange = prevTransactions > 0 ? ((totalTransactions - prevTransactions) / prevTransactions) * 100 : 0

      // Sales by category
      const categoryMap = new Map<string, number>()
      saleItems?.forEach(item => {
        const cat = (item.products as any)?.category || "Sin categoría"
        categoryMap.set(cat, (categoryMap.get(cat) || 0) + Number(item.quantity) * Number(item.unit_price))
      })
      const colors = ["#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"]
      const totalCatAmount = Array.from(categoryMap.values()).reduce((a, b) => a + b, 0)
      const salesByCategory = Array.from(categoryMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([name, amount], i) => ({
          name,
          value: totalCatAmount > 0 ? Math.round((amount / totalCatAmount) * 100) : 0,
          color: colors[i % colors.length]
        }))

      // Payment methods
      const paymentMap = new Map<string, number>()
      currentSales?.forEach(s => {
        const method = s.payment_method || "Efectivo"
        paymentMap.set(method, (paymentMap.get(method) || 0) + Number(s.total_amount))
      })
      const paymentColors: Record<string, string> = {
        "Efectivo": "#06b6d4", "efectivo": "#06b6d4",
        "Tarjeta": "#10b981", "tarjeta": "#10b981",
        "QR": "#f59e0b", "qr": "#f59e0b",
        "Transferencia": "#8b5cf6", "transferencia": "#8b5cf6"
      }
      const paymentMethods = Array.from(paymentMap.entries())
        .map(([method, amount]) => ({
          method: method.charAt(0).toUpperCase() + method.slice(1),
          amount,
          percentage: totalRevenue > 0 ? Math.round((amount / totalRevenue) * 100) : 0,
          color: paymentColors[method] || "#06b6d4"
        }))
        .sort((a, b) => b.amount - a.amount)

      // Hourly data
      const hourMap = new Map<number, number>()
      for (let i = 0; i < 24; i++) hourMap.set(i, 0)
      currentSales?.forEach(s => {
        const hour = new Date(s.created_at).getHours()
        hourMap.set(hour, (hourMap.get(hour) || 0) + Number(s.total_amount))
      })
      const hourlyData = Array.from({ length: 24 }, (_, i) => ({
        hour: `${i}:00`,
        sales: hourMap.get(i) || 0
      }))

      // Employee performance
      const empMap = new Map<string, { sales: number; transactions: number }>()
      salesWithEmployee?.forEach(s => {
        if (s.employee_id) {
          const emp = employees?.find(e => e.id === s.employee_id)
          const name = emp ? `${emp.first_name} ${emp.last_name || ""}`.trim() : "Sin asignar"
          const existing = empMap.get(name) || { sales: 0, transactions: 0 }
          empMap.set(name, {
            sales: existing.sales + Number(s.total_amount),
            transactions: existing.transactions + 1
          })
        }
      })
      const maxEmpSales = Math.max(...Array.from(empMap.values()).map(e => e.sales), 1)
      const employeePerformance = Array.from(empMap.entries())
        .map(([name, data]) => ({
          name,
          sales: Math.round((data.sales / maxEmpSales) * 100),
          transactions: data.transactions
        }))
        .sort((a, b) => b.transactions - a.transactions)
        .slice(0, 5)

      setStats({
        totalRevenue,
        totalTransactions,
        totalProducts,
        totalEmployees,
        revenueChange,
        transactionsChange,
        productsChange: 0,
        employeesChange: 0,
        salesByCategory,
        paymentMethods,
        hourlyData,
        employeePerformance
      })
    } catch (err) {
      console.error("Error loading stats:", err)
    } finally {
      setLoadingStats(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(value)
  }

  if (loadingStats) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-cyan-500 animate-spin" />
      </div>
    )
  }

  const kpiStats = [
    {
      label: "Ingresos Totales",
      value: formatCurrency(stats?.totalRevenue || 0),
      change: `${stats?.revenueChange >= 0 ? "+" : ""}${stats?.revenueChange.toFixed(1)}%`,
      isPositive: (stats?.revenueChange || 0) >= 0,
      icon: DollarSign,
      color: "#06b6d4",
    },
    {
      label: "Transacciones",
      value: (stats?.totalTransactions || 0).toLocaleString(),
      change: `${stats?.transactionsChange >= 0 ? "+" : ""}${stats?.transactionsChange.toFixed(1)}%`,
      isPositive: (stats?.transactionsChange || 0) >= 0,
      icon: ShoppingCart,
      color: "#10b981",
    },
    {
      label: "Productos",
      value: (stats?.totalProducts || 0).toLocaleString(),
      change: "Total",
      isPositive: true,
      icon: Package,
      color: "#f59e0b",
    },
    {
      label: "Empleados Activos",
      value: (stats?.totalEmployees || 0).toLocaleString(),
      change: "Total",
      isPositive: true,
      icon: Users,
      color: "#8b5cf6",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Estadísticas Detalladas</h1>
          <p className="text-gray-400 text-sm">Análisis profundo de tu negocio</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-[#0a0f1a] border border-cyan-500/20 rounded-lg p-1">
            {["7d", "30d", "90d"].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  period === p ? "bg-cyan-500/20 text-cyan-400" : "text-gray-400 hover:text-white"
                }`}
              >
                {p === "7d" ? "7D" : p === "30d" ? "30D" : "90D"}
              </button>
            ))}
          </div>
          <Button 
            onClick={loadStats}
            variant="outline" 
            className="gap-2 border-cyan-500/20 text-cyan-400 bg-transparent"
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiStats.map((stat, i) => (
          <div key={i} className="rounded-xl border bg-[#0a0f1a] p-5" style={{ borderColor: config.border }}>
            <div className="flex items-center justify-between mb-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${stat.color}20` }}
              >
                <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
              </div>
              {stat.change !== "Total" && (
                <div className={`flex items-center gap-1 text-sm ${stat.isPositive ? "text-green-400" : "text-red-400"}`}>
                  {stat.isPositive ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                  {stat.change}
                </div>
              )}
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
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="grid grid-cols-2 gap-4">
                      {(stats?.salesByCategory || []).map((cat) => (
                        <div key={cat.name} className="flex items-center gap-3">
                          <div className="w-4 h-4 rounded" style={{ backgroundColor: cat.color }} />
                          <div>
                            <p className="text-sm text-white font-medium">{cat.name}</p>
                            <p className="text-xs text-gray-500">{cat.value}%</p>
                          </div>
                        </div>
                      ))}
                      {(!stats?.salesByCategory || stats.salesByCategory.length === 0) && (
                        <p className="text-gray-500 col-span-2">Sin datos</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border bg-[#0a0f1a] p-6" style={{ borderColor: config.border }}>
              <h3 className="text-lg font-semibold text-white mb-4">Métodos de Pago</h3>
              <div className="space-y-4">
                {(stats?.paymentMethods || []).map((payment) => (
                  <div key={payment.method}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-white">{payment.method}</span>
                      <span className="text-sm text-gray-400">{formatCurrency(payment.amount)}</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${payment.percentage}%`, backgroundColor: payment.color }}
                      />
                    </div>
                  </div>
                ))}
                {(!stats?.paymentMethods || stats.paymentMethods.length === 0) && (
                  <p className="text-gray-500 text-center py-4">Sin datos de pagos</p>
                )}
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
                {(stats?.employeePerformance || []).map((employee, i) => (
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
                {(!stats?.employeePerformance || stats.employeePerformance.length === 0) && (
                  <p className="text-gray-500 text-center py-4">Sin datos de empleados</p>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="horarios" className="space-y-6 mt-6">
          <div className="rounded-xl border bg-[#0a0f1a] p-6" style={{ borderColor: config.border }}>
            <h3 className="text-lg font-semibold text-white mb-4">Ventas por Hora</h3>
            <div className="h-80">
              <div className="grid grid-cols-14 gap-1 h-full items-end">
                {(stats?.hourlyData || []).slice(8, 22).map((item, i) => {
                  const maxSales = Math.max(...(stats?.hourlyData || []).map(h => h.sales), 1)
                  return (
                    <div key={i} className="flex flex-col items-center gap-2">
                      <div
                        className="w-full rounded-t transition-all hover:opacity-80"
                        style={{
                          height: `${(item.sales / maxSales) * 100}%`,
                          minHeight: item.sales > 0 ? "4px" : "0",
                          backgroundColor: config.primary,
                        }}
                      />
                      <span className="text-xs text-gray-500">{item.hour}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
