"use client"

import { useState, useEffect } from "react"
import { Lightbulb, AlertTriangle, Clock, TrendingUp, Package, RefreshCw } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface Insight {
  icon: React.ReactNode
  title: string
  value: string
  color: "cyan" | "yellow" | "green" | "red"
}

export function SmartInsights() {
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadInsights()
  }, [])

  const loadInsights = async () => {
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

      const today = new Date()
      const todayStart = new Date(today.setHours(0, 0, 0, 0)).toISOString()
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      const twoWeeksAgo = new Date()
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)

      const newInsights: Insight[] = []

      // 1. Top selling products today
      const { data: todaySales } = await supabase
        .from("sales")
        .select("id")
        .in("kiosko_id", kioskoIds)
        .gte("created_at", todayStart)

      if (todaySales && todaySales.length > 0) {
        const saleIds = todaySales.map(s => s.id)
        const { data: topProducts } = await supabase
          .from("sale_items")
          .select("product_id, quantity, products(name)")
          .in("sale_id", saleIds)

        const productSales = new Map<string, number>()
        topProducts?.forEach(item => {
          const name = (item.products as any)?.name || "Producto"
          productSales.set(name, (productSales.get(name) || 0) + item.quantity)
        })

        const uniqueProducts = productSales.size
        newInsights.push({
          icon: <Package className="w-4 h-4" />,
          title: "Productos vendidos hoy",
          value: `${uniqueProducts} productos diferentes`,
          color: "cyan"
        })
      }

      // 2. Low stock alerts
      const { data: lowStockProducts } = await supabase
        .from("products")
        .select("id, name, stock_quantity, min_stock_level")
        .in("kiosko_id", kioskoIds)

      const lowStock = lowStockProducts?.filter(p => 
        p.stock_quantity <= (p.min_stock_level || 10)
      ) || []

      if (lowStock.length > 0) {
        newInsights.push({
          icon: <AlertTriangle className="w-4 h-4" />,
          title: "Productos con stock bajo",
          value: `${lowStock.length} productos a reponer`,
          color: "yellow"
        })
      } else {
        newInsights.push({
          icon: <AlertTriangle className="w-4 h-4" />,
          title: "Stock saludable",
          value: "Sin alertas de stock",
          color: "green"
        })
      }

      // 3. Peak hours
      const { data: recentSales } = await supabase
        .from("sales")
        .select("created_at")
        .in("kiosko_id", kioskoIds)
        .gte("created_at", weekAgo.toISOString())

      const hourCounts = new Map<number, number>()
      recentSales?.forEach(sale => {
        const hour = new Date(sale.created_at).getHours()
        hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1)
      })

      let peakHour = 12
      let maxCount = 0
      hourCounts.forEach((count, hour) => {
        if (count > maxCount) {
          maxCount = count
          peakHour = hour
        }
      })

      newInsights.push({
        icon: <Clock className="w-4 h-4" />,
        title: "Horario pico",
        value: `${peakHour}:00 - ${(peakHour + 1) % 24}:00 hs`,
        color: "cyan"
      })

      // 4. Weekly trend
      const { data: thisWeekSales } = await supabase
        .from("sales")
        .select("total_amount")
        .in("kiosko_id", kioskoIds)
        .gte("created_at", weekAgo.toISOString())

      const { data: lastWeekSales } = await supabase
        .from("sales")
        .select("total_amount")
        .in("kiosko_id", kioskoIds)
        .gte("created_at", twoWeeksAgo.toISOString())
        .lt("created_at", weekAgo.toISOString())

      const thisWeekTotal = thisWeekSales?.reduce((sum, s) => sum + Number(s.total_amount), 0) || 0
      const lastWeekTotal = lastWeekSales?.reduce((sum, s) => sum + Number(s.total_amount), 0) || 0

      const trend = lastWeekTotal > 0 
        ? ((thisWeekTotal - lastWeekTotal) / lastWeekTotal * 100) 
        : 0

      newInsights.push({
        icon: <TrendingUp className="w-4 h-4" />,
        title: "Tendencia semanal",
        value: `${trend >= 0 ? "+" : ""}${trend.toFixed(1)}% vs anterior`,
        color: trend >= 0 ? "green" : "red"
      })

      setInsights(newInsights)
    } catch (err) {
      console.error("Error loading insights:", err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-5 h-full">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
            <Lightbulb className="w-4 h-4 text-cyan-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">Smart Insights</h3>
        </div>
        <div className="flex items-center justify-center h-32">
          <RefreshCw className="w-6 h-6 text-cyan-500 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-5 h-full">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
          <Lightbulb className="w-4 h-4 text-cyan-400" />
        </div>
        <h3 className="text-lg font-semibold text-white">Smart Insights</h3>
      </div>

      <div className="space-y-4">
        {insights.map((insight, i) => (
          <div
            key={i}
            className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-cyan-500/10 hover:border-cyan-500/20 transition-colors"
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                insight.color === "cyan"
                  ? "bg-cyan-500/20 text-cyan-400"
                  : insight.color === "yellow"
                    ? "bg-yellow-500/20 text-yellow-400"
                    : insight.color === "red"
                      ? "bg-red-500/20 text-red-400"
                      : "bg-green-500/20 text-green-400"
              }`}
            >
              {insight.icon}
            </div>
            <div>
              <p className="text-sm text-gray-400">{insight.title}</p>
              <p
                className={`text-sm font-medium ${
                  insight.color === "cyan"
                    ? "text-cyan-400"
                    : insight.color === "yellow"
                      ? "text-yellow-400"
                      : insight.color === "red"
                        ? "text-red-400"
                        : "text-green-400"
                }`}
              >
                {insight.value}
              </p>
            </div>
          </div>
        ))}

        {insights.length === 0 && (
          <p className="text-gray-500 text-center py-4">Sin insights disponibles</p>
        )}
      </div>
    </div>
  )
}
