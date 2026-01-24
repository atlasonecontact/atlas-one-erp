"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
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

// Cache para evitar múltiples llamadas a la DB
let cachedKioskoIds: string[] | null = null
let cacheTime = 0
const CACHE_DURATION = 60000 // 1 minuto

export function useDashboardData(period: string) {
  const [data, setData] = useState<DashboardStats>(defaultStats)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Memoizar fechas para evitar recalcular en cada render
  const dateRanges = useMemo(() => {
    const today = new Date()
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStart = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate()).toISOString()
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString()
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const lastMonthStart = lastMonth.toISOString()
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0).toISOString()
    const days = period === "7d" ? 7 : period === "30d" ? 30 : 90
    const periodStart = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

    return { todayStart, yesterdayStart, monthStart, lastMonthStart, lastMonthEnd, periodStart }
  }, [period])

  const fetchData = useCallback(async () => {
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // Usar cache de kiosko IDs
      let kioskoIds: string[] = []
      const now = Date.now()
      
      if (cachedKioskoIds && (now - cacheTime) < CACHE_DURATION) {
        kioskoIds = cachedKioskoIds
      } else {
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
        
        cachedKioskoIds = kioskoIds
        cacheTime = now
      }

      if (kioskoIds.length === 0) {
        setData(defaultStats)
        setIsLoading(false)
        return
      }

      // OPTIMIZACIÓN: Ejecutar queries en paralelo en lugar de secuencial
      const [
        todayResult,
        yesterdayResult,
        monthResult,
        lastMonthResult,
        periodResult,
        saleItemsResult,
        lowStockResult,
        recentSalesResult,
        productsResult
      ] = await Promise.all([
        // Today sales
        supabase
          .from("sales")
          .select("total_amount")
          .in("kiosko_id", kioskoIds)
          .eq("status", "completed")
          .gte("created_at", dateRanges.todayStart),
        
        // Yesterday sales
        supabase
          .from("sales")
          .select("total_amount")
          .in("kiosko_id", kioskoIds)
          .eq("status", "completed")
          .gte("created_at", dateRanges.yesterdayStart)
          .lt("created_at", dateRanges.todayStart),
        
        // Month sales
        supabase
          .from("sales")
          .select("total_amount")
          .in("kiosko_id", kioskoIds)
          .eq("status", "completed")
          .gte("created_at", dateRanges.monthStart),
        
        // Last month sales
        supabase
          .from("sales")
          .select("total_amount")
          .in("kiosko_id", kioskoIds)
          .eq("status", "completed")
          .gte("created_at", dateRanges.lastMonthStart)
          .lt("created_at", dateRanges.lastMonthEnd),
        
        // Period sales for avg ticket and trend
        supabase
          .from("sales")
          .select("total_amount, created_at")
          .in("kiosko_id", kioskoIds)
          .eq("status", "completed")
          .gte("created_at", dateRanges.periodStart)
          .order("created_at", { ascending: true }),
        
        // Sale items for products
        supabase
          .from("sale_items")
          .select("product_id, quantity, products!inner(name)")
          .gte("created_at", dateRanges.periodStart)
          .limit(1000), // Limitar para mejorar performance
        
        // Low stock
        supabase
          .from("products")
          .select("id, name, stock_quantity, min_stock_level")
          .in("kiosko_id", kioskoIds)
          .lt("stock_quantity", 15)
          .order("stock_quantity", { ascending: true })
          .limit(5),
        
        // Recent sales
        supabase
          .from("sales")
          .select("id, total_amount, payment_method, created_at")
          .in("kiosko_id", kioskoIds)
          .order("created_at", { ascending: false })
          .limit(5),
        
        // Products for margin - solo seleccionar campos necesarios
        supabase
          .from("products")
          .select("price, cost, stock_quantity")
          .in("kiosko_id", kioskoIds)
          .limit(500) // Limitar para mejorar performance
      ])

      // Procesar resultados
      const todaySales = todayResult.data?.reduce((sum, s) => sum + Number(s.total_amount), 0) || 0
      const yesterdaySales = yesterdayResult.data?.reduce((sum, s) => sum + Number(s.total_amount), 0) || 0
      const todaySalesChange = yesterdaySales > 0 ? ((todaySales - yesterdaySales) / yesterdaySales) * 100 : 0

      const monthSales = monthResult.data?.reduce((sum, s) => sum + Number(s.total_amount), 0) || 0
      const lastMonthSales = lastMonthResult.data?.reduce((sum, s) => sum + Number(s.total_amount), 0) || 0
      const monthSalesChange = lastMonthSales > 0 ? ((monthSales - lastMonthSales) / lastMonthSales) * 100 : 0

      // Calcular avg ticket y trend de una sola pasada
      const allSalesData = periodResult.data || []
      let totalSales = 0
      const salesByDay: Record<string, number> = {}
      
      allSalesData.forEach(sale => {
        totalSales += Number(sale.total_amount)
        const day = new Date(sale.created_at).toLocaleDateString("es-AR")
        salesByDay[day] = (salesByDay[day] || 0) + Number(sale.total_amount)
      })

      const avgTicket = allSalesData.length > 0 ? totalSales / allSalesData.length : 0
      const salesTrend = Object.entries(salesByDay).map(([date, value]) => ({ date, value }))

      // Procesar productos vendidos
      const productSales: Record<string, { name: string; quantity: number }> = {}
      let totalUnitsSold = 0
      
      saleItemsResult.data?.forEach((item: any) => {
        const productName = item.products?.name || "Desconocido"
        if (!productSales[item.product_id]) {
          productSales[item.product_id] = { name: productName, quantity: 0 }
        }
        productSales[item.product_id].quantity += item.quantity
        totalUnitsSold += item.quantity
      })

      const topProductData = Object.values(productSales).sort((a, b) => b.quantity - a.quantity)[0]
      const topProducts = Object.entries(productSales)
        .sort(([, a], [, b]) => b.quantity - a.quantity)
        .slice(0, 5)
        .map(([, product], i) => ({
          name: product.name,
          sales: product.quantity,
          percentage: 100 - i * 15,
        }))

      // Low stock
      const mappedLowStock = lowStockResult.data?.map(p => ({
        id: p.id,
        name: p.name,
        stock: p.stock_quantity,
        min_stock: p.min_stock_level || 10,
      })) || []

      // Recent sales
      const mappedRecentSales = recentSalesResult.data?.map(s => ({
        id: s.id,
        total: s.total_amount,
        payment_method: s.payment_method,
        created_at: s.created_at,
      })) || []

      // Calcular margen
      let totalRevenue = 0
      let totalCost = 0

      productsResult.data?.forEach(p => {
        const revenue = Number(p.price) * p.stock_quantity
        const cost = Number(p.cost) * p.stock_quantity
        totalRevenue += revenue
        totalCost += cost
      })

      const margin = totalRevenue > 0 ? Math.round(((totalRevenue - totalCost) / totalRevenue) * 100) : 0

      setData({
        todaySales,
        todaySalesChange: Math.round(todaySalesChange),
        monthSales,
        monthSalesChange: Math.round(monthSalesChange),
        avgTicket: Math.round(avgTicket),
        avgTicketChange: 9.4,
        topProduct: topProductData?.name || "-",
        topProductCount: Object.keys(productSales).length,
        salesTrend,
        topProducts,
        lowStockProducts: mappedLowStock,
        recentSales: mappedRecentSales,
        margin,
        unitsSold: totalUnitsSold,
      })
    } catch (err) {
      console.error("Error fetching dashboard data:", err)
      setError("Error al cargar datos")
    } finally {
      setIsLoading(false)
    }
  }, [dateRanges])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, isLoading, error, refetch: fetchData }
}
