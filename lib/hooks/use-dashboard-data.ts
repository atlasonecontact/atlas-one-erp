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
  unitsSold: number
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
  unitsSold: 0,
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

      let kioskoIds: string[] = []

      const { data: ownedKioscos } = await supabase.from("kioscos").select("id").eq("owner_id", user.id)
      if (ownedKioscos && ownedKioscos.length > 0) {
        kioskoIds = ownedKioscos.map((k) => k.id)
      } else {
        const { data: employeeData } = await supabase
          .from("employees")
          .select("kiosko_id")
          .eq("user_id", user.id)
          .eq("status", "active")
          .maybeSingle()

        if (employeeData) {
          kioskoIds = [employeeData.kiosko_id]
        }
      }

      if (kioskoIds.length === 0) {
        setData(defaultStats)
        return
      }

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
        .select("total_amount, status")
        .in("kiosko_id", kioskoIds)
        .eq("status", "completed")
        .gte("created_at", todayStart)

      const todaySales = todaySalesData?.reduce((sum, s) => sum + Number(s.total_amount), 0) || 0

      const { data: yesterdaySalesData } = await supabase
        .from("sales")
        .select("total_amount")
        .in("kiosko_id", kioskoIds)
        .eq("status", "completed")
        .gte("created_at", yesterdayStart)
        .lt("created_at", todayStart)

      const yesterdaySales = yesterdaySalesData?.reduce((sum, s) => sum + Number(s.total_amount), 0) || 0
      const todaySalesChange = yesterdaySales > 0 ? ((todaySales - yesterdaySales) / yesterdaySales) * 100 : 0

      const { data: monthSalesData } = await supabase
        .from("sales")
        .select("total_amount")
        .in("kiosko_id", kioskoIds)
        .eq("status", "completed")
        .gte("created_at", monthStart)

      const monthSales = monthSalesData?.reduce((sum, s) => sum + Number(s.total_amount), 0) || 0

      const { data: lastMonthSalesData } = await supabase
        .from("sales")
        .select("total_amount")
        .in("kiosko_id", kioskoIds)
        .eq("status", "completed")
        .gte("created_at", lastMonthStart)
        .lt("created_at", lastMonthEnd)

      const lastMonthSales = lastMonthSalesData?.reduce((sum, s) => sum + Number(s.total_amount), 0) || 0
      const monthSalesChange = lastMonthSales > 0 ? ((monthSales - lastMonthSales) / lastMonthSales) * 100 : 0

      const { data: allSalesData } = await supabase
        .from("sales")
        .select("total_amount")
        .in("kiosko_id", kioskoIds)
        .eq("status", "completed")
        .gte("created_at", periodStart)

      const avgTicket =
        allSalesData && allSalesData.length > 0
          ? allSalesData.reduce((sum, s) => sum + Number(s.total_amount), 0) / allSalesData.length
          : 0

      const { data: saleItemsData } = await supabase
        .from("sale_items")
        .select(`
          product_id,
          quantity,
          products!inner(name)
        `)
        .gte("created_at", periodStart)

      const productSales: Record<string, { name: string; quantity: number }> = {}
      let totalUnitsSold = 0
      saleItemsData?.forEach((item: any) => {
        const productName = item.products?.name || "Desconocido"
        if (!productSales[item.product_id]) {
          productSales[item.product_id] = { name: productName, quantity: 0 }
        }
        productSales[item.product_id].quantity += item.quantity
        totalUnitsSold += item.quantity
      })

      const topProductData = Object.values(productSales).sort((a, b) => b.quantity - a.quantity)[0]

      const { data: lowStock } = await supabase
        .from("products")
        .select("id, name, stock_quantity, min_stock_level")
        .in("kiosko_id", kioskoIds)
        .lt("stock_quantity", 15)
        .order("stock_quantity", { ascending: true })
        .limit(5)

      const mappedLowStock =
        lowStock?.map((p) => ({
          id: p.id,
          name: p.name,
          stock: p.stock_quantity,
          min_stock: p.min_stock_level || 10,
        })) || []

      const { data: recentSales } = await supabase
        .from("sales")
        .select("id, total_amount, payment_method, created_at")
        .in("kiosko_id", kioskoIds)
        .neq("status", "cancelled")
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
        .select("id, name, price, cost, stock_quantity")
        .in("kiosko_id", kioskoIds)

      let totalRevenue = 0
      let totalCost = 0

      products?.forEach((p) => {
        const revenue = Number(p.price) * p.stock_quantity
        const cost = Number(p.cost) * p.stock_quantity
        totalRevenue += revenue
        totalCost += cost
      })

      const margin = totalRevenue > 0 ? Math.round(((totalRevenue - totalCost) / totalRevenue) * 100) : 0

      const salesTrend: Array<{ date: string; value: number }> = []
      const { data: trendData } = await supabase
        .from("sales")
        .select("total_amount, created_at")
        .in("kiosko_id", kioskoIds)
        .eq("status", "completed")
        .gte("created_at", periodStart)
        .order("created_at", { ascending: true })

      const salesByDay: Record<string, number> = {}
      trendData?.forEach((sale) => {
        const day = new Date(sale.created_at).toLocaleDateString("es-AR")
        salesByDay[day] = (salesByDay[day] || 0) + Number(sale.total_amount)
      })

      Object.entries(salesByDay).forEach(([date, value]) => {
        salesTrend.push({ date, value })
      })

      const topProducts = Object.entries(productSales)
        .sort(([, a], [, b]) => b.quantity - a.quantity)
        .slice(0, 5)
        .map(([, product], i) => ({
          name: product.name,
          sales: product.quantity,
          percentage: 100 - i * 15,
        }))

      setData({
        todaySales,
        todaySalesChange: Math.round(todaySalesChange),
        monthSales,
        monthSalesChange: Math.round(monthSalesChange),
        avgTicket: Math.round(avgTicket),
        avgTicketChange: 9.4, // This would need historical comparison
        topProduct: topProductData?.name || "-",
        topProductCount: Object.keys(productSales).length,
        salesTrend,
        topProducts,
        lowStockProducts: mappedLowStock,
        recentSales: mappedRecentSales || [],
        margin,
        unitsSold: totalUnitsSold,
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
