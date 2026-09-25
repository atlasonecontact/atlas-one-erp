"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Wallet,
  Receipt,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  PiggyBank,
  CreditCard,
  Banknote,
  Calculator
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useTheme } from "@/lib/theme-context"

interface FinanceStats {
  totalRevenue: number
  totalCosts: number
  grossProfit: number
  grossMargin: number
  totalExpenses: number
  netProfit: number
  cashInHand: number
  receivables: number
  payables: number
  revenueByDay: { date: string; revenue: number; costs: number }[]
  topCostCategories: { category: string; amount: number }[]
}

export default function FinanzasEstadisticasPage() {
  const [period, setPeriod] = useState("30d")
  const [stats, setStats] = useState<FinanceStats | null>(null)
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

      // Get sales with items for cost calculation
      const { data: sales } = await supabase
        .from("sales")
        .select("id, total_amount, created_at")
        .in("kiosko_id", kioskoIds)
        .neq("status", "cancelled")
        .gte("created_at", startDate.toISOString())

      const saleIds = sales?.map(s => s.id) || []
      
      // Get sale items with product costs
      const { data: saleItems } = await supabase
        .from("sale_items")
        .select("quantity, unit_price, products(cost, category)")
        .in("sale_id", saleIds)

      // Calculate revenue and costs
      let totalRevenue = 0
      let totalCosts = 0
      const categoryCosts = new Map<string, number>()

      saleItems?.forEach(item => {
        const revenue = item.quantity * Number(item.unit_price)
        const cost = item.quantity * (Number((item.products as any)?.cost) || 0)
        const category = (item.products as any)?.category || "Sin categoría"
        
        totalRevenue += revenue
        totalCosts += cost
        categoryCosts.set(category, (categoryCosts.get(category) || 0) + cost)
      })

      // Get cash register expenses
      const { data: expenses } = await supabase
        .from("cash_register_transactions")
        .select("amount, created_at")
        .eq("type", "expense")
        .gte("created_at", startDate.toISOString())

      const totalExpenses = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0

      // Get purchases (payables/costs)
      const { data: purchases } = await supabase
        .from("purchases")
        .select("total_amount, status, created_at")
        .in("kiosko_id", kioskoIds)
        .gte("created_at", startDate.toISOString())

      const payables = purchases?.filter(p => p.status === "pending")
        .reduce((sum, p) => sum + Number(p.total_amount), 0) || 0

      // Get current cash in registers
      const { data: openRegisters } = await supabase
        .from("cash_registers")
        .select("opening_balance, closing_balance")
        .in("kiosko_id", kioskoIds)
        .eq("status", "open")

      let cashInHand = 0
      openRegisters?.forEach(r => {
        cashInHand += Number(r.opening_balance) || 0
      })
      // Add today's cash sales
      const todaySales = sales?.filter(s => {
        const saleDate = new Date(s.created_at).toDateString()
        return saleDate === new Date().toDateString()
      })
      cashInHand += todaySales?.reduce((sum, s) => sum + Number(s.total_amount), 0) || 0
      cashInHand -= totalExpenses

      // Revenue by day
      const dayMap = new Map<string, { revenue: number; costs: number }>()
      sales?.forEach(s => {
        const date = new Date(s.created_at).toISOString().split('T')[0]
        const existing = dayMap.get(date) || { revenue: 0, costs: 0 }
        dayMap.set(date, {
          revenue: existing.revenue + Number(s.total_amount),
          costs: existing.costs
        })
      })
      const revenueByDay = Array.from(dayMap.entries())
        .map(([date, data]) => ({ date, revenue: data.revenue, costs: data.costs }))
        .sort((a, b) => a.date.localeCompare(b.date))

      // Top cost categories
      const topCostCategories = Array.from(categoryCosts.entries())
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5)

      const grossProfit = totalRevenue - totalCosts
      const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0
      const netProfit = grossProfit - totalExpenses

      setStats({
        totalRevenue,
        totalCosts,
        grossProfit,
        grossMargin,
        totalExpenses,
        netProfit,
        cashInHand,
        receivables: 0, // Would need accounts receivable table
        payables,
        revenueByDay,
        topCostCategories
      })
    } catch (err) {
      console.error("Error loading finance stats:", err)
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Estadísticas Financieras</h1>
          <p className="text-gray-400 text-sm">Control de ingresos, costos y rentabilidad</p>
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

      {/* Main KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white mb-1">{formatCurrency(stats?.totalRevenue || 0)}</p>
          <p className="text-sm text-gray-500">Ingresos Brutos</p>
        </div>

        <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-red-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white mb-1">{formatCurrency(stats?.totalCosts || 0)}</p>
          <p className="text-sm text-gray-500">Costo de Ventas</p>
        </div>

        <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
            </div>
            <span className="text-sm text-cyan-400">{stats?.grossMargin.toFixed(1)}%</span>
          </div>
          <p className="text-2xl font-bold text-white mb-1">{formatCurrency(stats?.grossProfit || 0)}</p>
          <p className="text-sm text-gray-500">Ganancia Bruta</p>
        </div>

        <div className={`rounded-xl border bg-[#0a0f1a] p-5 ${(stats?.netProfit || 0) >= 0 ? "border-green-500/20" : "border-red-500/20"}`}>
          <div className="flex items-center justify-between mb-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${(stats?.netProfit || 0) >= 0 ? "bg-green-500/20" : "bg-red-500/20"}`}>
              <PiggyBank className={`w-5 h-5 ${(stats?.netProfit || 0) >= 0 ? "text-green-400" : "text-red-400"}`} />
            </div>
          </div>
          <p className={`text-2xl font-bold mb-1 ${(stats?.netProfit || 0) >= 0 ? "text-green-400" : "text-red-400"}`}>
            {formatCurrency(stats?.netProfit || 0)}
          </p>
          <p className="text-sm text-gray-500">Ganancia Neta</p>
        </div>
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
              <Banknote className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Efectivo en Caja</p>
              <p className="text-xl font-bold text-white">{formatCurrency(stats?.cashInHand || 0)}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
              <Calculator className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Gastos Operativos</p>
              <p className="text-xl font-bold text-white">{formatCurrency(stats?.totalExpenses || 0)}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Cuentas por Pagar</p>
              <p className="text-xl font-bold text-white">{formatCurrency(stats?.payables || 0)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Costos por Categoría */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Costos por Categoría</h3>
          <div className="space-y-4">
            {stats?.topCostCategories.map((cat) => {
              const maxCost = stats.topCostCategories[0]?.amount || 1
              const percentage = (cat.amount / maxCost) * 100
              return (
                <div key={cat.category}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-white">{cat.category}</span>
                    <span className="text-sm text-gray-400">{formatCurrency(cat.amount)}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full bg-red-500 transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
            {(!stats?.topCostCategories || stats.topCostCategories.length === 0) && (
              <p className="text-gray-500 text-center py-4">Sin datos de costos</p>
            )}
          </div>
        </div>

        {/* Resumen del Período */}
        <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Resumen del Período</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
              <span className="text-gray-400">Ingresos</span>
              <span className="text-green-400 font-medium">{formatCurrency(stats?.totalRevenue || 0)}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
              <span className="text-gray-400">Costo de ventas</span>
              <span className="text-red-400 font-medium">-{formatCurrency(stats?.totalCosts || 0)}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
              <span className="text-gray-400">Gastos operativos</span>
              <span className="text-red-400 font-medium">-{formatCurrency(stats?.totalExpenses || 0)}</span>
            </div>
            <div className="border-t border-cyan-500/10 pt-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-cyan-500/10">
                <span className="text-white font-medium">Resultado Neto</span>
                <span className={`font-bold text-lg ${(stats?.netProfit || 0) >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {formatCurrency(stats?.netProfit || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
