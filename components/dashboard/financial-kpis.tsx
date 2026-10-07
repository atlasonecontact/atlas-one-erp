"use client"

import { useState, useEffect } from "react"
import { TrendingUp, Target, Clock, DollarSign, Users, Package, AlertTriangle, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

interface FinancialKPIsProps {
  data?: {
    grossMargin: number
    breakEvenPoint: number
    cashConversionCycle: number
  }
  isLoading?: boolean
}

interface InventoryKPIsProps {
  data?: {
    inventoryTurnover: number
    daysOfInventory: number
    shrinkageRate: number
  }
  isLoading?: boolean
}

interface PerformanceKPIsProps {
  data?: {
    salesPerEmployee: number
    laborCost: number
    itemsPerTicket: number
  }
  isLoading?: boolean
}

interface ControlKPIsProps {
  data?: {
    cashDifference: number
    returnRate: number
    chargebackRate: number
  }
  isLoading?: boolean
}

function KPIRow({ icon, label, value, suffix = "", trend, variant = "default" }: {
  icon: React.ReactNode
  label: string
  value: string | number
  suffix?: string
  trend?: "up" | "down" | "neutral"
  variant?: "default" | "success" | "warning" | "danger"
}) {
  const variantColors = {
    default: "text-foreground",
    success: "text-green-400",
    warning: "text-yellow-400",
    danger: "text-red-400",
  }

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
          {icon}
        </div>
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <span className={cn("text-lg font-bold", variantColors[variant])}>
        {typeof value === 'number' ? value.toLocaleString('es-AR') : value}{suffix}
      </span>
    </div>
  )
}

export function FinancialKPIs({ data, isLoading = false }: FinancialKPIsProps) {
  const [kpiData, setKpiData] = useState({
    grossMargin: 0,
    breakEvenPoint: 0,
    cashConversionCycle: 0,
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (data) {
      setKpiData(data)
      setLoading(false)
      return
    }
    loadData()
  }, [data])

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Sucursales propias, o la del empleado si el que entró no es el dueño.
      let kioskoIds: string[] = []
      const { data: owned } = await supabase.from("kioscos").select("id").eq("owner_id", user.id)
      if (owned && owned.length > 0) {
        kioskoIds = owned.map((k) => k.id)
      } else {
        const { data: emp } = await supabase
          .from("employees")
          .select("kiosko_id")
          .eq("user_id", user.id)
          .eq("status", "active")
          .maybeSingle()
        if (emp?.kiosko_id) kioskoIds = [emp.kiosko_id]
      }

      if (kioskoIds.length === 0) {
        setLoading(false)
        return
      }

      const days = 30
      const periodStart = new Date()
      periodStart.setDate(periodStart.getDate() - days)

      const monthStart = new Date()
      monthStart.setDate(1)
      monthStart.setHours(0, 0, 0, 0)

      const [{ data: sales }, { data: monthSales }, { data: products }, { data: purchases }] = await Promise.all([
        supabase
          .from("sales")
          .select("id, total_amount")
          .in("kiosko_id", kioskoIds)
          .neq("status", "cancelled")
          .gte("created_at", periodStart.toISOString()),
        supabase
          .from("sales")
          .select("total_amount")
          .in("kiosko_id", kioskoIds)
          .neq("status", "cancelled")
          .gte("created_at", monthStart.toISOString()),
        supabase.from("products").select("stock_quantity, cost").in("kiosko_id", kioskoIds),
        supabase
          .from("purchases")
          .select("total_amount, total_paid, payment_status")
          .in("kiosko_id", kioskoIds)
          .neq("payment_status", "paid"),
      ])

      // Margen bruto real: ingresos y costo de lo efectivamente vendido en los últimos 30 días
      // (no el margen de catálogo, que no refleja qué se vendió más).
      const saleIds = (sales || []).map((s) => s.id)
      let totalRevenue = 0
      let cogs = 0
      if (saleIds.length > 0) {
        const { data: saleItems } = await supabase
          .from("sale_items")
          .select("sale_id, quantity, unit_price, cost_price, products(cost)")
          .in("sale_id", saleIds)
        saleItems?.forEach((it: any) => {
          const qty = Number(it.quantity) || 0
          const unitCost = Number(it.cost_price ?? it.products?.cost ?? 0) || 0
          totalRevenue += qty * (Number(it.unit_price) || 0)
          cogs += qty * unitCost
        })
      }
      const grossMargin = totalRevenue > 0 ? Math.round(((totalRevenue - cogs) / totalRevenue) * 100 * 10) / 10 : 0

      const totalSales = monthSales?.reduce((sum, s) => sum + Number(s.total_amount), 0) || 0
      const breakEvenPoint = Math.round(totalSales * 0.4) // Estimate based on 40% of sales

      // Ciclo de conversión de efectivo = días de inventario + días de cobro - días de pago a proveedores.
      // No hay cuenta corriente de clientes (fiado) en el sistema todavía, así que días de cobro = 0.
      const inventoryValue = products?.reduce((sum, p) => sum + (Number(p.stock_quantity) || 0) * (Number(p.cost) || 0), 0) || 0
      const payables = purchases?.reduce((sum, p) => sum + (Number(p.total_amount) - Number(p.total_paid || 0)), 0) || 0
      const daysInventoryOutstanding = cogs > 0 ? (inventoryValue / cogs) * days : 0
      const daysPayableOutstanding = cogs > 0 ? (payables / cogs) * days : 0
      const cashConversionCycle = Math.round(daysInventoryOutstanding - daysPayableOutstanding)

      setKpiData({
        grossMargin,
        breakEvenPoint,
        cashConversionCycle,
      })
    } catch (err) {
      console.error("Error loading financial KPIs:", err)
    } finally {
      setLoading(false)
    }
  }

  const isLoadingState = isLoading || loading

  if (isLoadingState) {
    return (
      <div className="rounded-xl border border-cyan-500/10 bg-card p-5">
        <div className="h-4 bg-muted rounded w-32 mb-4 animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-10 bg-accent rounded animate-pulse" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-cyan-500/10 bg-card p-5 relative overflow-hidden">
      <h3 className="text-sm font-medium text-foreground mb-4">KPIs Financieros</h3>
      <div className="space-y-1 divide-y divide-cyan-500/10">
        <KPIRow 
          icon={<TrendingUp className="w-4 h-4" />} 
          label="Margen Bruto" 
          value={kpiData.grossMargin} 
          suffix="%" 
          variant="success"
        />
        <KPIRow 
          icon={<Target className="w-4 h-4" />} 
          label="Punto de Equilibrio" 
          value={`$${(kpiData.breakEvenPoint / 1000).toFixed(0)}k`}
        />
        <KPIRow 
          icon={<Clock className="w-4 h-4" />} 
          label="Ciclo de Conversión" 
          value={kpiData.cashConversionCycle} 
          suffix=" días"
        />
      </div>
    </div>
  )
}

export function InventoryKPIs({ data, isLoading = false }: InventoryKPIsProps) {
  const [kpiData, setKpiData] = useState({
    inventoryTurnover: 0,
    daysOfInventory: 0,
    shrinkageRate: 0,
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (data) {
      setKpiData(data)
      setLoading(false)
      return
    }
    loadData()
  }, [data])

  const loadData = async () => {
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

      // Get product count and stock
      const { data: products } = await supabase
        .from("products")
        .select("stock_quantity, cost")
        .in("kiosko_id", kioskoIds)

      const totalProducts = products?.length || 0
      const totalStock = products?.reduce((sum, p) => sum + (p.stock_quantity || 0), 0) || 0
      
      // Calculate inventory turnover (sales / avg inventory)
      const monthStart = new Date()
      monthStart.setMonth(monthStart.getMonth() - 1)
      
      const { data: saleItems } = await supabase
        .from("sale_items")
        .select("quantity")
        .gte("created_at", monthStart.toISOString())

      const totalSold = saleItems?.reduce((sum, s) => sum + s.quantity, 0) || 0
      const inventoryTurnover = totalStock > 0 ? Math.round((totalSold / totalStock) * 10) / 10 : 0
      const daysOfInventory = inventoryTurnover > 0 ? Math.round(30 / inventoryTurnover) : 30

      setKpiData({
        inventoryTurnover,
        daysOfInventory,
        shrinkageRate: 0, // Would need stock_movements to calculate
      })
    } catch (err) {
      console.error("Error loading inventory KPIs:", err)
    } finally {
      setLoading(false)
    }
  }

  const isLoadingState = isLoading || loading

  if (isLoadingState) {
    return (
      <div className="rounded-xl border border-cyan-500/10 bg-card p-5">
        <div className="h-4 bg-muted rounded w-32 mb-4 animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-10 bg-accent rounded animate-pulse" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-cyan-500/10 bg-card p-5">
      <h3 className="text-sm font-medium text-foreground mb-4">Inventario y Stock</h3>
      <div className="space-y-1 divide-y divide-cyan-500/10">
        <KPIRow 
          icon={<Package className="w-4 h-4" />} 
          label="Rotación de Inventario" 
          value={kpiData.inventoryTurnover} 
          suffix="x"
          variant="success"
        />
        <KPIRow 
          icon={<Clock className="w-4 h-4" />} 
          label="Días de Inventario" 
          value={kpiData.daysOfInventory} 
          suffix=" días"
        />
        <KPIRow 
          icon={<AlertTriangle className="w-4 h-4" />} 
          label="Tasa de Merma" 
          value={kpiData.shrinkageRate} 
          suffix="%"
          variant={kpiData.shrinkageRate > 5 ? "danger" : kpiData.shrinkageRate > 3 ? "warning" : "success"}
        />
      </div>
    </div>
  )
}

export function PerformanceKPIs({ data, isLoading = false }: PerformanceKPIsProps) {
  const [kpiData, setKpiData] = useState({
    salesPerEmployee: 0,
    laborCost: 0,
    itemsPerTicket: 0,
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (data) {
      setKpiData(data)
      setLoading(false)
      return
    }
    loadData()
  }, [data])

  const loadData = async () => {
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

      // Get employees
      const { data: employees } = await supabase
        .from("employees")
        .select("id, salary")
        .in("kiosko_id", kioskoIds)
        .eq("status", "active")

      const employeeCount = employees?.length || 1

      // Get monthly sales
      const monthStart = new Date()
      monthStart.setDate(1)
      monthStart.setHours(0, 0, 0, 0)
      
      const { data: sales } = await supabase
        .from("sales")
        .select("id, total_amount")
        .in("kiosko_id", kioskoIds)
        .neq("status", "cancelled")
        .gte("created_at", monthStart.toISOString())

      const totalSales = sales?.reduce((sum, s) => sum + Number(s.total_amount), 0) || 0
      const salesPerEmployee = Math.round(totalSales / employeeCount)

      // Get items per ticket
      const { data: saleItems } = await supabase
        .from("sale_items")
        .select("sale_id, quantity")
        .gte("created_at", monthStart.toISOString())

      const saleCount = sales?.length || 1
      const totalItems = saleItems?.reduce((sum, s) => sum + s.quantity, 0) || 0
      const itemsPerTicket = Math.round((totalItems / saleCount) * 10) / 10

      // Calculate labor cost %
      const totalSalaries = employees?.reduce((sum, e) => sum + (Number(e.salary) || 0), 0) || 0
      const laborCost = totalSales > 0 ? Math.round((totalSalaries / totalSales) * 100 * 10) / 10 : 0

      setKpiData({
        salesPerEmployee,
        laborCost,
        itemsPerTicket,
      })
    } catch (err) {
      console.error("Error loading performance KPIs:", err)
    } finally {
      setLoading(false)
    }
  }

  const isLoadingState = isLoading || loading

  if (isLoadingState) {
    return (
      <div className="rounded-xl border border-cyan-500/10 bg-card p-5">
        <div className="h-4 bg-muted rounded w-40 mb-4 animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-10 bg-accent rounded animate-pulse" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-cyan-500/10 bg-card p-5">
      <h3 className="text-sm font-medium text-foreground mb-4">Desempeño del Personal</h3>
      <div className="space-y-1 divide-y divide-cyan-500/10">
        <KPIRow 
          icon={<Users className="w-4 h-4" />} 
          label="Ventas por Empleado" 
          value={`$${kpiData.salesPerEmployee.toLocaleString()}`}
        />
        <KPIRow 
          icon={<DollarSign className="w-4 h-4" />} 
          label="Costo Laboral" 
          value={kpiData.laborCost} 
          suffix="%"
        />
        <KPIRow 
          icon={<Package className="w-4 h-4" />} 
          label="Artículos por Ticket" 
          value={kpiData.itemsPerTicket} 
          suffix=" prod."
        />
      </div>
    </div>
  )
}

export function ControlKPIs({ data, isLoading = false }: ControlKPIsProps) {
  const [kpiData, setKpiData] = useState({
    cashDifference: 0,
    returnRate: 0,
    chargebackRate: 0,
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (data) {
      setKpiData(data)
      setLoading(false)
      return
    }
    loadData()
  }, [data])

  const loadData = async () => {
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

      // Get today's cash register
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const { data: registers } = await supabase
        .from("cash_registers")
        .select("opening_balance, closing_balance")
        .in("kiosko_id", kioskoIds)
        .gte("opened_at", today.toISOString())

      // Calculate difference
      let cashDiff = 0
      registers?.forEach(r => {
        if (r.closing_balance !== null) {
          cashDiff += (Number(r.closing_balance) - Number(r.opening_balance))
        }
      })

      setKpiData({
        cashDifference: Math.round(cashDiff),
        returnRate: 0, // Would need returns table
        chargebackRate: 0, // Would need chargebacks table
      })
    } catch (err) {
      console.error("Error loading control KPIs:", err)
    } finally {
      setLoading(false)
    }
  }

  const isLoadingState = isLoading || loading

  if (isLoadingState) {
    return (
      <div className="rounded-xl border border-cyan-500/10 bg-card p-5">
        <div className="h-4 bg-muted rounded w-36 mb-4 animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-10 bg-accent rounded animate-pulse" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-cyan-500/10 bg-card p-5">
      <h3 className="text-sm font-medium text-foreground mb-4">Control y Seguridad</h3>
      <div className="space-y-1 divide-y divide-cyan-500/10">
        <KPIRow 
          icon={<DollarSign className="w-4 h-4" />} 
          label="Diferencia de Caja" 
          value={`$${kpiData.cashDifference}`}
          variant={kpiData.cashDifference < 0 ? "danger" : "success"}
        />
        <KPIRow 
          icon={<Package className="w-4 h-4" />} 
          label="Tasa de Devoluciones" 
          value={kpiData.returnRate} 
          suffix="%"
          variant={kpiData.returnRate > 5 ? "warning" : "default"}
        />
        <KPIRow 
          icon={<ShieldCheck className="w-4 h-4" />} 
          label="Tasa de Contracargos" 
          value={kpiData.chargebackRate} 
          suffix="%"
          variant={kpiData.chargebackRate > 3 ? "danger" : "default"}
        />
      </div>
    </div>
  )
}
