"use client"

import { useState, useEffect } from "react"
import { ShoppingCart, Package, AlertTriangle, UserPlus, RefreshCw, ArrowDownToLine, ArrowUpFromLine } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface Activity {
  icon: React.ReactNode
  title: string
  description: string
  time: string
  color: "cyan" | "green" | "yellow" | "red"
}

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "Ahora"
  if (diffMins < 60) return `Hace ${diffMins} min`
  if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? "s" : ""}`
  return `Hace ${diffDays} día${diffDays > 1 ? "s" : ""}`
}

export function RecentActivity() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadActivities()
  }, [])

  const loadActivities = async () => {
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

      const allActivities: (Activity & { timestamp: Date })[] = []

      // Get recent sales
      const { data: recentSales } = await supabase
        .from("sales")
        .select("id, total_amount, created_at, payment_method")
        .in("kiosko_id", kioskoIds)
        .neq("status", "cancelled")
        .order("created_at", { ascending: false })
        .limit(5)

      recentSales?.forEach(sale => {
        allActivities.push({
          icon: <ShoppingCart className="w-4 h-4" />,
          title: "Nueva venta registrada",
          description: `Venta #${sale.id.slice(0, 8)} - $${Number(sale.total_amount).toLocaleString('es-AR')} (${sale.payment_method || 'Efectivo'})`,
          time: formatTimeAgo(new Date(sale.created_at)),
          color: "cyan",
          timestamp: new Date(sale.created_at)
        })
      })

      // Get recent stock movements
      const { data: stockMovements } = await supabase
        .from("stock_movements")
        .select("id, product_id, quantity, movement_type, created_at, products(name)")
        .in("kiosko_id", kioskoIds)
        .order("created_at", { ascending: false })
        .limit(5)

      stockMovements?.forEach(mov => {
        const productName = (mov.products as any)?.name || "Producto"
        const isIncome = mov.movement_type === "entrada" || mov.movement_type === "purchase" || mov.movement_type === "adjustment_in"
        allActivities.push({
          icon: isIncome ? <ArrowDownToLine className="w-4 h-4" /> : <ArrowUpFromLine className="w-4 h-4" />,
          title: isIncome ? "Ingreso de stock" : "Egreso de stock",
          description: `${productName} (${isIncome ? "+" : "-"}${mov.quantity} uds)`,
          time: formatTimeAgo(new Date(mov.created_at)),
          color: isIncome ? "green" : "yellow",
          timestamp: new Date(mov.created_at)
        })
      })

      // Get low stock products (as alerts)
      const { data: lowStockProducts } = await supabase
        .from("products")
        .select("id, name, stock_quantity, min_stock_level, updated_at")
        .in("kiosko_id", kioskoIds)
        .order("updated_at", { ascending: false })
        .limit(10)

      lowStockProducts?.forEach(product => {
        if (product.stock_quantity <= (product.min_stock_level || 10)) {
          allActivities.push({
            icon: <AlertTriangle className="w-4 h-4" />,
            title: "Alerta de stock bajo",
            description: `${product.name} (${product.stock_quantity} unidades)`,
            time: formatTimeAgo(new Date(product.updated_at)),
            color: "yellow",
            timestamp: new Date(product.updated_at)
          })
        }
      })

      // Get recent employee shifts - Nota: esta tabla puede no existir en todas las instalaciones
      let shifts: any[] = []
      try {
        const { data: shiftsData } = await supabase
          .from("employee_shifts")
          .select("id, employee_id, start_time, end_time")
          .in("kiosko_id", kioskoIds)
          .order("start_time", { ascending: false })
          .limit(3)
        shifts = shiftsData || []
      } catch (e) {
        // Tabla puede no existir
      }

      shifts?.forEach(shift => {
        const empName = "Empleado"
        
        if (!shift.end_time) {
          allActivities.push({
            icon: <UserPlus className="w-4 h-4" />,
            title: "Turno iniciado",
            description: `${empName} comenzó su turno`,
            time: formatTimeAgo(new Date(shift.start_time)),
            color: "cyan",
            timestamp: new Date(shift.start_time)
          })
        }
      })

      // Get recent purchases
      const { data: purchases } = await supabase
        .from("purchases")
        .select("id, total_amount, status, created_at, supplier_name")
        .in("kiosko_id", kioskoIds)
        .order("created_at", { ascending: false })
        .limit(3)

      purchases?.forEach(purchase => {
        const providerName = purchase.supplier_name || "Proveedor"
        allActivities.push({
          icon: <Package className="w-4 h-4" />,
          title: "Compra registrada",
          description: `${providerName} - $${Number(purchase.total_amount).toLocaleString('es-AR')}`,
          time: formatTimeAgo(new Date(purchase.created_at)),
          color: "green",
          timestamp: new Date(purchase.created_at)
        })
      })

      // Sort by timestamp and take first 8
      allActivities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      setActivities(allActivities.slice(0, 8).map(({ timestamp, ...rest }) => rest))

    } catch (err) {
      console.error("Error loading activities:", err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-5">
        <h3 className="text-lg font-semibold text-white mb-4">Actividad reciente</h3>
        <div className="flex items-center justify-center h-32">
          <RefreshCw className="w-6 h-6 text-cyan-500 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-5">
      <h3 className="text-lg font-semibold text-white mb-4">Actividad reciente</h3>

      <div className="space-y-4">
        {activities.map((activity, i) => (
          <div key={i} className="flex items-start gap-4 p-3 rounded-lg hover:bg-white/5 transition-colors">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                activity.color === "cyan"
                  ? "bg-cyan-500/20 text-cyan-400"
                  : activity.color === "green"
                    ? "bg-green-500/20 text-green-400"
                    : activity.color === "red"
                      ? "bg-red-500/20 text-red-400"
                      : "bg-yellow-500/20 text-yellow-400"
              }`}
            >
              {activity.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white">{activity.title}</p>
              <p className="text-sm text-gray-500 truncate">{activity.description}</p>
            </div>
            <span className="text-xs text-gray-600 whitespace-nowrap">{activity.time}</span>
          </div>
        ))}

        {activities.length === 0 && (
          <p className="text-gray-500 text-center py-4">Sin actividad reciente</p>
        )}
      </div>
    </div>
  )
}
