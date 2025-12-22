"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts"
import {
  Download,
  FileText,
  TableIcon,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  Clock,
  AlertTriangle,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface SalesMetrics {
  totalSales: number
  totalRevenue: number
  averageTicket: number
  totalUnits: number
  conversionRate: number
  topEmployee: string
  topEmployeeSales: number
  lowStockItems: number
  outOfStockItems: number
  inventoryValue: number
  stockRotation: number
}

export default function ReportesPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("week")
  const [selectedKiosko, setSelectedKiosko] = useState<string>("")
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all")
  const [metrics, setMetrics] = useState<SalesMetrics | null>(null)
  const [salesByDay, setSalesByDay] = useState<any[]>([])
  const [salesByCategory, setSalesByCategory] = useState<any[]>([])
  const [topProducts, setTopProducts] = useState<any[]>([])
  const [employeePerformance, setEmployeePerformance] = useState<any[]>([])
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([])
  const [hourlyData, setHourlyData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [kioscos, setKioscos] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [dateRange, setDateRange] = useState({ start: "", end: "" })

  const supabase = createClient()

  useEffect(() => {
    loadUserAndKioscos()
  }, [])

  useEffect(() => {
    if (selectedKiosko) {
      loadDashboardData()
      loadEmployees()
    }
  }, [selectedKiosko, selectedPeriod, selectedEmployee, dateRange])

  const loadUserAndKioscos = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { data: employeeData } = await supabase
      .from("employees")
      .select("kiosko_id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle()

    if (employeeData) {
      setSelectedKiosko(employeeData.kiosko_id)
      const { data: kioscoData } = await supabase.from("kioscos").select("*").eq("id", employeeData.kiosko_id).single()
      if (kioscoData) setKioscos([kioscoData])
    } else {
      // Owner - load all kioscos
      const { data: kioskosData } = await supabase.from("kioscos").select("*").eq("owner_id", user.id).order("name")
      if (kioskosData && kioskosData.length > 0) {
        setKioscos(kioskosData)
        setSelectedKiosko(kioskosData[0].id)
      }
    }
  }

  const loadEmployees = async () => {
    const { data } = await supabase
      .from("employees")
      .select("id, name")
      .eq("kiosko_id", selectedKiosko)
      .eq("status", "active")
      .order("name")

    if (data) setEmployees(data)
  }

  const getDateRange = () => {
    const end = new Date()
    const start = new Date()

    if (dateRange.start && dateRange.end) {
      return { start: new Date(dateRange.start), end: new Date(dateRange.end) }
    }

    switch (selectedPeriod) {
      case "week":
        start.setDate(start.getDate() - 7)
        break
      case "month":
        start.setMonth(start.getMonth() - 1)
        break
      case "year":
        start.setFullYear(start.getFullYear() - 1)
        break
    }

    return { start, end }
  }

  const loadDashboardData = async () => {
    setIsLoading(true)
    const { start, end } = getDateRange()

    let salesQuery = supabase
      .from("sales")
      .select(
        `
        *,
        sale_items (
          quantity,
          unit_price,
          subtotal,
          product_id,
          products (name, category)
        ),
        employees (name)
      `,
      )
      .eq("kiosko_id", selectedKiosko)
      .eq("payment_status", "completed")
      .gte("created_at", start.toISOString())
      .lte("created_at", end.toISOString())

    if (selectedEmployee !== "all") {
      salesQuery = salesQuery.eq("employee_id", selectedEmployee)
    }

    const { data: salesData } = await salesQuery

    if (!salesData) {
      setIsLoading(false)
      return
    }

    const totalRevenue = salesData.reduce((acc, sale) => acc + Number(sale.total_amount), 0)
    const totalSales = salesData.length
    const totalUnits = salesData.reduce(
      (acc, sale) => acc + sale.sale_items.reduce((sum: number, item: any) => sum + item.quantity, 0),
      0,
    )
    const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0

    const employeeStats: any = {}
    salesData.forEach((sale) => {
      const empName = sale.employees?.name || "Sin asignar"
      if (!employeeStats[empName]) {
        employeeStats[empName] = { name: empName, sales: 0, revenue: 0, units: 0 }
      }
      employeeStats[empName].sales += 1
      employeeStats[empName].revenue += Number(sale.total_amount)
      employeeStats[empName].units += sale.sale_items.reduce((sum: number, item: any) => sum + item.quantity, 0)
    })

    const employeePerf = Object.values(employeeStats)
      .sort((a: any, b: any) => b.revenue - a.revenue)
      .slice(0, 5)
    setEmployeePerformance(employeePerf as any)

    const topEmp = employeePerf[0] as any
    const topEmployee = topEmp?.name || "N/A"
    const topEmployeeSales = topEmp?.sales || 0

    const dayStats: any = {}
    salesData.forEach((sale) => {
      const day = new Date(sale.created_at).toLocaleDateString("es-AR", { weekday: "short" })
      if (!dayStats[day]) dayStats[day] = 0
      dayStats[day] += Number(sale.total_amount)
    })
    setSalesByDay(Object.entries(dayStats).map(([day, sales]) => ({ day, sales })))

    const categoryStats: any = {}
    let totalCategoryRevenue = 0
    salesData.forEach((sale) => {
      sale.sale_items.forEach((item: any) => {
        const category = item.products?.category || "Sin categoría"
        const subtotal = Number(item.subtotal)
        if (!categoryStats[category]) categoryStats[category] = 0
        categoryStats[category] += subtotal
        totalCategoryRevenue += subtotal
      })
    })

    const categoryData = Object.entries(categoryStats).map(([name, value]: any) => ({
      name,
      value: ((value / totalCategoryRevenue) * 100).toFixed(1),
      amount: value,
    }))
    setSalesByCategory(categoryData)

    const productStats: any = {}
    salesData.forEach((sale) => {
      sale.sale_items.forEach((item: any) => {
        const productName = item.products?.name || "Producto eliminado"
        if (!productStats[productName]) {
          productStats[productName] = { name: productName, units: 0, revenue: 0 }
        }
        productStats[productName].units += item.quantity
        productStats[productName].revenue += Number(item.subtotal)
      })
    })

    const topProds = Object.values(productStats)
      .sort((a: any, b: any) => b.revenue - a.revenue)
      .slice(0, 10)
      .map((p: any, i: number, arr: any[]) => ({
        ...p,
        percentage: arr[0].revenue > 0 ? (p.revenue / arr[0].revenue) * 100 : 0,
      }))
    setTopProducts(topProds)

    const hourlyStats: any = {}
    for (let i = 0; i < 24; i++) {
      hourlyStats[i] = 0
    }
    salesData.forEach((sale) => {
      const hour = new Date(sale.created_at).getHours()
      hourlyStats[hour] += Number(sale.total_amount)
    })
    setHourlyData(
      Object.entries(hourlyStats).map(([hour, sales]) => ({
        hour: `${hour}:00`,
        sales,
      })),
    )

    const { data: productsData } = await supabase.from("products").select("*").eq("kiosko_id", selectedKiosko)

    let lowStockItems = 0
    let outOfStockItems = 0
    let inventoryValue = 0
    const lowStockProds: any[] = []

    if (productsData) {
      productsData.forEach((p) => {
        const stock = p.stock_quantity || 0
        const minStock = p.min_stock_level || 10
        inventoryValue += stock * (p.cost || p.price || 0)

        if (stock === 0) {
          outOfStockItems++
          lowStockProds.push({ ...p, status: "out" })
        } else if (stock <= minStock) {
          lowStockItems++
          lowStockProds.push({ ...p, status: "low" })
        }
      })
    }

    setLowStockProducts(lowStockProds.slice(0, 10))

    const avgInventory = productsData ? productsData.reduce((acc, p) => acc + (p.stock_quantity || 0), 0) : 1
    const stockRotation = avgInventory > 0 ? totalUnits / avgInventory : 0

    setMetrics({
      totalSales,
      totalRevenue,
      averageTicket,
      totalUnits,
      conversionRate: 0, // Would need traffic data
      topEmployee,
      topEmployeeSales,
      lowStockItems,
      outOfStockItems,
      inventoryValue,
      stockRotation,
    })

    setIsLoading(false)
  }

  const COLORS = ["#22d3ee", "#06b6d4", "#0891b2", "#0e7490", "#155e75", "#164e63"]

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-120px)] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard de Ventas & Facturación</h1>
          <p className="text-gray-400 text-sm">Análisis completo de rendimiento comercial</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {kioscos.length > 1 && (
            <Select value={selectedKiosko} onValueChange={setSelectedKiosko}>
              <SelectTrigger className="w-[180px] bg-[#0a0f1a] border-cyan-500/10">
                <SelectValue placeholder="Seleccionar kiosco" />
              </SelectTrigger>
              <SelectContent>
                {kioscos.map((k) => (
                  <SelectItem key={k.id} value={k.id}>
                    {k.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
            <SelectTrigger className="w-[180px] bg-[#0a0f1a] border-cyan-500/10">
              <SelectValue placeholder="Todos los empleados" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los empleados</SelectItem>
              {employees.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1 bg-[#0a0f1a] border border-cyan-500/10 rounded-lg p-1">
            {["week", "month", "year"].map((p) => (
              <button
                key={p}
                onClick={() => {
                  setSelectedPeriod(p)
                  setDateRange({ start: "", end: "" })
                }}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  selectedPeriod === p ? "bg-cyan-500/20 text-cyan-400" : "text-gray-400 hover:text-white"
                }`}
              >
                {p === "week" ? "Semana" : p === "month" ? "Mes" : "Año"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <Card className="bg-[#0a0f1a] border-cyan-500/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Facturación Total</CardTitle>
            <DollarSign className="h-4 w-4 text-cyan-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">${metrics?.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">
              En {selectedPeriod === "week" ? "7 días" : selectedPeriod === "month" ? "30 días" : "12 meses"}
            </p>
          </CardContent>
        </Card>

        {/* Total Sales */}
        <Card className="bg-[#0a0f1a] border-cyan-500/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Ventas Realizadas</CardTitle>
            <ShoppingCart className="h-4 w-4 text-cyan-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{metrics?.totalSales}</div>
            <p className="text-xs text-gray-500 mt-1">{metrics?.totalUnits} unidades vendidas</p>
          </CardContent>
        </Card>

        {/* Average Ticket */}
        <Card className="bg-[#0a0f1a] border-cyan-500/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Ticket Promedio</CardTitle>
            <TrendingUp className="h-4 w-4 text-cyan-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">${metrics?.averageTicket.toFixed(2)}</div>
            <p className="text-xs text-gray-500 mt-1">Por transacción</p>
          </CardContent>
        </Card>

        {/* Top Employee */}
        <Card className="bg-[#0a0f1a] border-cyan-500/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Mejor Vendedor</CardTitle>
            <Users className="h-4 w-4 text-cyan-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white truncate">{metrics?.topEmployee}</div>
            <p className="text-xs text-gray-500 mt-1">{metrics?.topEmployeeSales} ventas</p>
          </CardContent>
        </Card>

        {/* Stock Rotation */}
        <Card className="bg-[#0a0f1a] border-cyan-500/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Rotación de Stock</CardTitle>
            <Package className="h-4 w-4 text-cyan-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{metrics?.stockRotation.toFixed(2)}x</div>
            <p className="text-xs text-gray-500 mt-1">Veces por período</p>
          </CardContent>
        </Card>

        {/* Inventory Value */}
        <Card className="bg-[#0a0f1a] border-cyan-500/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Valor de Inventario</CardTitle>
            <DollarSign className="h-4 w-4 text-cyan-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">${metrics?.inventoryValue.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">Costo total del stock</p>
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card className="bg-[#0a0f1a] border-cyan-500/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Alertas de Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{metrics?.lowStockItems}</div>
            <p className="text-xs text-gray-500 mt-1">{metrics?.outOfStockItems} sin stock</p>
          </CardContent>
        </Card>

        {/* Units per Sale */}
        <Card className="bg-[#0a0f1a] border-cyan-500/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Unidades por Venta</CardTitle>
            <Clock className="h-4 w-4 text-cyan-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {metrics?.totalSales ? (metrics.totalUnits / metrics.totalSales).toFixed(1) : 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">Promedio de items</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales by Day */}
        <Card className="bg-[#0a0f1a] border-cyan-500/10">
          <CardHeader>
            <CardTitle className="text-white">Ventas por Día</CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        {/* Sales by Category */}
        <Card className="bg-[#0a0f1a] border-cyan-500/10">
          <CardHeader>
            <CardTitle className="text-white">Ventas por Categoría</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center gap-8">
              <ResponsiveContainer width="60%" height="100%">
                <PieChart>
                  <Pie
                    data={salesByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {salesByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0a0f1a",
                      border: "1px solid rgba(34, 211, 238, 0.2)",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                    formatter={(value: number, name, props: any) => [
                      `${value}% ($${props.payload.amount.toLocaleString()})`,
                      "",
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 flex-1">
                {salesByCategory.map((item, i) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-sm text-gray-400 flex-1 truncate">{item.name}</span>
                    <span className="text-sm text-white font-medium">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0a0f1a] border-cyan-500/10">
          <CardHeader>
            <CardTitle className="text-white">Patrón de Ventas por Hora</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(34, 211, 238, 0.1)" />
                  <XAxis
                    dataKey="hour"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    interval={2}
                  />
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
                  <Line type="monotone" dataKey="sales" stroke="#22d3ee" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0a0f1a] border-cyan-500/10">
          <CardHeader>
            <CardTitle className="text-white">Rendimiento de Empleados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={employeePerformance} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(34, 211, 238, 0.1)" horizontal={false} />
                  <XAxis
                    type="number"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 12 }}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 12 }}
                    width={100}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0a0f1a",
                      border: "1px solid rgba(34, 211, 238, 0.2)",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                    formatter={(value: number, name: string, props: any) => [
                      `$${value.toLocaleString()} (${props.payload.sales} ventas)`,
                      "Facturación",
                    ]}
                  />
                  <Bar dataKey="revenue" fill="#22d3ee" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products Table */}
        <Card className="bg-[#0a0f1a] border-cyan-500/10">
          <CardHeader>
            <CardTitle className="text-white">Top 10 Productos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.map((product, i) => (
                <div key={i} className="flex items-center gap-4">
                  <span className="text-xl font-bold text-cyan-400 w-8">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2 gap-2">
                      <span className="text-white font-medium truncate">{product.name}</span>
                      <div className="flex items-center gap-3 text-sm whitespace-nowrap">
                        <span className="text-gray-400">{product.units} uds</span>
                        <span className="text-cyan-400 font-medium">${product.revenue.toLocaleString()}</span>
                      </div>
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
          </CardContent>
        </Card>

        <Card className="bg-[#0a0f1a] border-cyan-500/10">
          <CardHeader>
            <CardTitle className="text-white">Alertas de Inventario</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lowStockProducts.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No hay alertas de stock</p>
              ) : (
                lowStockProducts.map((product, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-cyan-500/10"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-white truncate">{product.name}</div>
                      <div className="text-sm text-gray-400">{product.category || "Sin categoría"}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-sm font-medium text-white">{product.stock_quantity || 0} uds</div>
                        <div className="text-xs text-gray-500">Mín: {product.min_stock_level || 10}</div>
                      </div>
                      <div
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          product.status === "out" ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-400"
                        }`}
                      >
                        {product.status === "out" ? "Sin stock" : "Bajo"}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="outline" className="border-cyan-500/20 text-gray-400 hover:text-white bg-transparent gap-2">
          <FileText className="w-4 h-4" />
          Exportar PDF
        </Button>
        <Button variant="outline" className="border-cyan-500/20 text-gray-400 hover:text-white bg-transparent gap-2">
          <TableIcon className="w-4 h-4" />
          Exportar Excel
        </Button>
        <Button variant="outline" className="border-cyan-500/20 text-gray-400 hover:text-white bg-transparent gap-2">
          <Download className="w-4 h-4" />
          Descargar Reporte Completo
        </Button>
      </div>
    </div>
  )
}
