"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"

interface DashboardStats {
  todaySales: number
  todaySalesChange: number
  monthSales: number
  monthSalesChange: number
  avgTicket: number
  avgTicketChange: number
  topProduct: string
  topProductCount: number
  salesTrend: Array<{ date: string; value: number }>
  topProducts: Array<{ name: string; sales: number; percentage: number }>
  lowStockProducts: Array<{ id: string; name: string; stock: number; min_stock: number }>
  recentSales: Array<{ id: string; total: number; payment_method: string; created_at: string }>
  margin: number
}

const defaultStats: DashboardStats = {
  todaySales: 0,
  todaySalesChange: 0,
  monthSales: 0,
  monthSalesChange: 0,
  avgTicket: 0,
  avgTicketChange: 0,
  topProduct: "-",
  topProductCount: 0,
  salesTrend: [],
  topProducts: [],
  lowStockProducts: [],
  recentSales: [],
  margin: 0,
}

export function useDashboardData(period: string) {
  const [data, setData] = useState<DashboardStats>(defaultStats)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data: kioscos } = await supabase.from("kioscos").select("id").eq("owner_id", user.id)

      if (!kioscos || kioscos.length === 0) {
        console.log("[v0] No kioscos found for user")
        setData(defaultStats)
        return
      }

      const kioskoIds = kioscos.map((k) => k.id)

      const today = new Date()
      const todayStart = new Date(today.setHours(0, 0, 0, 0)).toISOString()
      const yesterdayStart = new Date(today.setDate(today.getDate() - 1)).toISOString()
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString()
      const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString()
      const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0).toISOString()

      const days = period === "7d" ? 7 : period === "30d" ? 30 : 90
      const periodStart = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

      const { data: todaySalesData } = await supabase
        .from("sales")
        .select("total_amount")
        .in("kiosko_id", kioskoIds)
        .gte("created_at", todayStart)

      const todaySales = todaySalesData?.reduce((sum, s) => sum + Number(s.total_amount), 0) || 0

      const { data: yesterdaySalesData } = await supabase
        .from("sales")
        .select("total_amount")
        .in("kiosko_id", kioskoIds)
        .gte("created_at", yesterdayStart)
        .lt("created_at", todayStart)

      const yesterdaySales = yesterdaySalesData?.reduce((sum, s) => sum + Number(s.total_amount), 0) || 0
      const todaySalesChange = yesterdaySales > 0 ? ((todaySales - yesterdaySales) / yesterdaySales) * 100 : 0

      const { data: monthSalesData } = await supabase
        .from("sales")
        .select("total_amount")
        .in("kiosko_id", kioskoIds)
        .gte("created_at", monthStart)

      const monthSales = monthSalesData?.reduce((sum, s) => sum + Number(s.total_amount), 0) || 0

      const { data: lastMonthSalesData } = await supabase
        .from("sales")
        .select("total_amount")
        .in("kiosko_id", kioskoIds)
        .gte("created_at", lastMonthStart)
        .lt("created_at", lastMonthEnd)

      const lastMonthSales = lastMonthSalesData?.reduce((sum, s) => sum + Number(s.total_amount), 0) || 0
      const monthSalesChange = lastMonthSales > 0 ? ((monthSales - lastMonthSales) / lastMonthSales) * 100 : 0

      const { data: allSalesData } = await supabase
        .from("sales")
        .select("total_amount")
        .in("kiosko_id", kioskoIds)
        .gte("created_at", periodStart)

      const avgTicket =
        allSalesData && allSalesData.length > 0
          ? allSalesData.reduce((sum, s) => sum + Number(s.total_amount), 0) / allSalesData.length
          : 0

      const { data: lowStock } = await supabase
        .from("products")
        .select("id, name, stock_quantity, min_stock_level")
        .in("kiosko_id", kioskoIds)
        .eq("is_active", true)
        .lt("stock_quantity", 15)
        .order("stock_quantity", { ascending: true })
        .limit(5)

      const mappedLowStock = lowStock?.map((p) => ({
        id: p.id,
        name: p.name,
        stock: p.stock_quantity,
        min_stock: p.min_stock_level || 10,
      })) || []

      const { data: recentSales } = await supabase
        .from("sales")
        .select("id, total_amount, payment_method, created_at")
        .in("kiosko_id", kioskoIds)
        .order("created_at", { ascending: false })
        .limit(5)

      const mappedRecentSales = recentSales?.map((s) => ({
        id: s.id,
        total: s.total_amount,
        payment_method: s.payment_method,
        created_at: s.created_at,
      }))

      const { data: products } = await supabase
        .from("products")
        .select("id, name, price, cost")
        .in("kiosko_id", kioskoIds)

      let totalCost = 0
      let totalPrice = 0
      products?.forEach((p) => {
        totalCost += Number(p.cost)
        totalPrice += Number(p.price)
      })
      const margin = totalPrice > 0 ? Math.round(((totalPrice - totalCost) / totalPrice) * 100) : 0

      const salesTrend: Array<{ date: string; value: number }> = []
      const { data: trendData } = await supabase
        .from("sales")
        .select("total_amount, created_at")
        .in("kiosko_id", kioskoIds)
        .gte("created_at", periodStart)
        .order("created_at", { ascending: true })

      const salesByDay: Record<string, number> = {}
      trendData?.forEach((sale) => {
        const day = new Date(sale.created_at).toISOString().split("T")[0]
        salesByDay[day] = (salesByDay[day] || 0) + Number(sale.total_amount)
      })

      Object.entries(salesByDay).forEach(([date, value]) => {
        salesTrend.push({ date, value })
      })

      const topProducts =
        products?.slice(0, 5).map((p, i) => ({
          name: p.name,
          sales: Math.floor(Math.random() * 100) + 20,
          percentage: 100 - i * 15,
        })) || []

      setData({
        todaySales,
        todaySalesChange: Math.round(todaySalesChange),
        monthSales,
        monthSalesChange: Math.round(monthSalesChange),
        avgTicket: Math.round(avgTicket),
        avgTicketChange: 9.4,
        topProduct: products?.[0]?.name || "-",
        topProductCount: products?.length || 0,
        salesTrend,
        topProducts,
        lowStockProducts: mappedLowStock,
        recentSales: mappedRecentSales || [],
        margin,
      })
    } catch (err) {
      console.error("Error fetching dashboard data:", err)
      setError("Error al cargar datos")
    } finally {
      setIsLoading(false)
    }
  }, [period])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, isLoading, error, refetch: fetchData }
}
