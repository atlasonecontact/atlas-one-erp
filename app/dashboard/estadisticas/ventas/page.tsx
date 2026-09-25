"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { 
  DollarSign, 
  ShoppingCart, 
  TrendingUp, 
  TrendingDown,
  Download,
  Calendar,
  Users,
  CreditCard,
  Banknote,
  QrCode,
  RefreshCw,
  ArrowUp,
  ArrowDown
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useTheme } from "@/lib/theme-context"

interface SaleStats {
  totalSales: number
  totalTransactions: number
  averageTicket: number
  topPaymentMethod: string
  salesByMethod: { method: string; amount: number; count: number }[]
  salesByDay: { date: string; amount: number; count: number }[]
  salesByHour: { hour: number; amount: number; count: number }[]
  topEmployees: { name: string; sales: number; transactions: number }[]
  comparison: { current: number; previous: number; change: number }
}

export default function VentasEstadisticasPage() {
  const [period, setPeriod] = useState("30d")
  const [stats, setStats] = useState<SaleStats | null>(null)
  const [loading, setLoading] = useState(true)
  const { config } = useTheme()
  const supabase = createClient()

  useEffect(() => {
    loadStats()
  }, [period])

  const loadStats = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: kioscos } = await supabase
        .from("kioscos")
        .select("id")
        .eq("owner_id", user.id)
      
      if (!kioscos || kioscos.length === 0) {
        setLoading(false)
        return
      }
      const kioskoIds = kioscos.map(k => k.id)

      // Calculate date range
      const days = period === "7d" ? 7 : period === "30d" ? 30 : 90
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)
      const previousStart = new Date(startDate)
      previousStart.setDate(previousStart.getDate() - days)

      // Get current period sales
      const { data: sales } = await supabase
        .from("sales")
        .select("id, total_amount, payment_method, employee_id, created_at, employees(name)")
        .in("kiosko_id", kioskoIds)
        .neq("status", "cancelled")
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: false })

      // Get previous period sales for comparison
      const { data: previousSales } = await supabase
        .from("sales")
        .select("total_amount")
        .in("kiosko_id", kioskoIds)
        .neq("status", "cancelled")
        .gte("created_at", previousStart.toISOString())
        .lt("created_at", startDate.toISOString())

      const currentTotal = sales?.reduce((sum, s) => sum + Number(s.total_amount), 0) || 0
      const previousTotal = previousSales?.reduce((sum, s) => sum + Number(s.total_amount), 0) || 0
      const changePercent = previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0

      // Sales by payment method
      const methodMap = new Map<string, { amount: number; count: number }>()
      sales?.forEach(s => {
        const method = s.payment_method || "cash"
        const existing = methodMap.get(method) || { amount: 0, count: 0 }
        methodMap.set(method, {
          amount: existing.amount + Number(s.total_amount),
          count: existing.count + 1
        })
      })
      const salesByMethod = Array.from(methodMap.entries()).map(([method, data]) => ({
        method: method === "cash" ? "Efectivo" : method === "card" ? "Tarjeta" : method === "qr" ? "QR" : method,
        amount: data.amount,
        count: data.count
      })).sort((a, b) => b.amount - a.amount)

      // Sales by day
      const dayMap = new Map<string, { amount: number; count: number }>()
      sales?.forEach(s => {
        const date = new Date(s.created_at).toISOString().split('T')[0]
        const existing = dayMap.get(date) || { amount: 0, count: 0 }
        dayMap.set(date, {
          amount: existing.amount + Number(s.total_amount),
          count: existing.count + 1
        })
      })
      const salesByDay = Array.from(dayMap.entries())
        .map(([date, data]) => ({ date, amount: data.amount, count: data.count }))
        .sort((a, b) => a.date.localeCompare(b.date))

      // Sales by hour
      const hourMap = new Map<number, { amount: number; count: number }>()
      sales?.forEach(s => {
        const hour = new Date(s.created_at).getHours()
        const existing = hourMap.get(hour) || { amount: 0, count: 0 }
        hourMap.set(hour, {
          amount: existing.amount + Number(s.total_amount),
          count: existing.count + 1
        })
      })
      const salesByHour = Array.from(hourMap.entries())
        .map(([hour, data]) => ({ hour, amount: data.amount, count: data.count }))
        .sort((a, b) => a.hour - b.hour)

      // Top employees
      const employeeMap = new Map<string, { name: string; sales: number; transactions: number }>()
      sales?.forEach(s => {
        const empName = (s.employees as any)?.name || "Sin asignar"
        const existing = employeeMap.get(empName) || { name: empName, sales: 0, transactions: 0 }
        employeeMap.set(empName, {
          name: empName,
          sales: existing.sales + Number(s.total_amount),
          transactions: existing.transactions + 1
        })
      })
      const topEmployees = Array.from(employeeMap.values())
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 5)

      setStats({
        totalSales: currentTotal,
        totalTransactions: sales?.length || 0,
        averageTicket: sales?.length ? currentTotal / sales.length : 0,
        topPaymentMethod: salesByMethod[0]?.method || "N/A",
        salesByMethod,
        salesByDay,
        salesByHour,
        topEmployees,
        comparison: {
          current: currentTotal,
          previous: previousTotal,
          change: changePercent
        }
      })
    } catch (err) {
      console.error("Error loading sales stats:", err)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(value)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-cyan-500 animate-spin" />
      </div>
    )
  }

  const peakHour = stats?.salesByHour.reduce((max, h) => h.amount > max.amount ? h : max, { hour: 0, amount: 0, count: 0 })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Estadísticas de Ventas</h1>
          <p className="text-gray-400 text-sm">Análisis detallado de ventas</p>
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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-cyan-400" />
            </div>
            <div className={`flex items-center gap-1 text-sm ${stats?.comparison.change && stats.comparison.change >= 0 ? "text-green-400" : "text-red-400"}`}>
              {stats?.comparison.change && stats.comparison.change >= 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
              {Math.abs(stats?.comparison.change || 0).toFixed(1)}%
            </div>
          </div>
          <p className="text-2xl font-bold text-white mb-1">{formatCurrency(stats?.totalSales || 0)}</p>
          <p className="text-sm text-gray-500">Ventas Totales</p>
        </div>

        <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-green-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white mb-1">{stats?.totalTransactions.toLocaleString()}</p>
          <p className="text-sm text-gray-500">Transacciones</p>
        </div>

        <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-yellow-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white mb-1">{formatCurrency(stats?.averageTicket || 0)}</p>
          <p className="text-sm text-gray-500">Ticket Promedio</p>
        </div>

        <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-purple-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white mb-1">{peakHour?.hour}:00</p>
          <p className="text-sm text-gray-500">Hora Pico</p>
        </div>
      </div>

      {/* Métodos de Pago & Top Empleados */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Métodos de Pago */}
        <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Métodos de Pago</h3>
          <div className="space-y-4">
            {stats?.salesByMethod.map((method) => {
              const total = stats.totalSales || 1
              const percentage = (method.amount / total) * 100
              const getIcon = (m: string) => {
                if (m === "Efectivo") return <Banknote className="w-5 h-5" />
                if (m === "Tarjeta") return <CreditCard className="w-5 h-5" />
                return <QrCode className="w-5 h-5" />
              }
              return (
                <div key={method.method}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-cyan-400">{getIcon(method.method)}</span>
                      <span className="text-sm text-white">{method.method}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm text-white">{formatCurrency(method.amount)}</span>
                      <span className="text-xs text-gray-500 ml-2">({method.count} op.)</span>
                    </div>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full bg-cyan-500 transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
            {(!stats?.salesByMethod || stats.salesByMethod.length === 0) && (
              <p className="text-gray-500 text-center py-4">Sin datos de métodos de pago</p>
            )}
          </div>
        </div>

        {/* Top Empleados */}
        <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Top Vendedores</h3>
          <div className="space-y-4">
            {stats?.topEmployees.map((employee, i) => {
              const maxSales = stats.topEmployees[0]?.sales || 1
              const percentage = (employee.sales / maxSales) * 100
              return (
                <div key={employee.name} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-semibold">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-white font-medium">{employee.name}</p>
                      <p className="text-sm text-gray-400">{employee.transactions} ventas</p>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full bg-cyan-500 transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-cyan-400 mt-1">{formatCurrency(employee.sales)}</p>
                  </div>
                </div>
              )
            })}
            {(!stats?.topEmployees || stats.topEmployees.length === 0) && (
              <p className="text-gray-500 text-center py-4">Sin datos de empleados</p>
            )}
          </div>
        </div>
      </div>

      {/* Ventas por Hora */}
      <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Ventas por Hora del Día</h3>
        <div className="flex items-end gap-1 h-40">
          {Array.from({ length: 24 }, (_, i) => {
            const hourData = stats?.salesByHour.find(h => h.hour === i)
            const maxAmount = Math.max(...(stats?.salesByHour.map(h => h.amount) || [1]))
            const height = hourData ? (hourData.amount / maxAmount) * 100 : 5
            return (
              <div key={i} className="flex-1 flex flex-col items-center">
                <div 
                  className="w-full bg-cyan-500/50 hover:bg-cyan-500 rounded-t transition-colors cursor-pointer"
                  style={{ height: `${height}%` }}
                  title={`${i}:00 - ${formatCurrency(hourData?.amount || 0)}`}
                />
                {i % 4 === 0 && (
                  <span className="text-xs text-gray-500 mt-2">{i}h</span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
