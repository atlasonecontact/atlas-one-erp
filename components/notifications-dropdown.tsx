"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Bell, ShoppingCart, AlertTriangle, Package, Clock, RefreshCw, Check, Trash2, PackageSearch } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { createClient } from "@/lib/supabase/client"
import { useTheme } from "@/lib/theme-context"

interface Notification {
  id: string
  type: "sale" | "stock" | "order" | "approval" | "system"
  title: string
  message: string
  time: Date
  read: boolean
  kioskoName?: string
  href?: string
  urgent?: boolean
}

const READ_KEY = "atlas.notifications.read.v1"

function loadReadIds(): Set<string> {
  try {
    const raw = window.localStorage.getItem(READ_KEY)
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch {
    return new Set()
  }
}

function saveReadIds(ids: Set<string>) {
  try {
    window.localStorage.setItem(READ_KEY, JSON.stringify([...ids]))
  } catch {
    // localStorage no disponible (navegación privada, etc.): no es crítico.
  }
}

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "Ahora"
  if (diffMins < 60) return `${diffMins}m`
  if (diffHours < 24) return `${diffHours}h`
  return `${diffDays}d`
}

export function NotificationsDropdown() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const { config } = useTheme()
  const supabase = createClient()

  useEffect(() => {
    loadNotifications()

    // Refresh every 30 seconds
    const interval = setInterval(loadNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: ownKioscos } = await supabase.from("kioscos").select("id, name, owner_id").eq("owner_id", user.id)

      let kioskoIds: string[] = []
      let kioskoMap = new Map<string, string>()
      let canApprove = false
      let approvalKioskoIds: string[] = []

      if (ownKioscos && ownKioscos.length > 0) {
        kioskoIds = ownKioscos.map((k) => k.id)
        kioskoMap = new Map(ownKioscos.map((k) => [k.id, k.name]))
        canApprove = true
        approvalKioskoIds = kioskoIds
      } else {
        const { data: employeeData } = await supabase
          .from("employees")
          .select("kiosko_id, permissions, kioscos(id, name, owner_id)")
          .eq("user_id", user.id)
          .eq("status", "active")
          .maybeSingle()

        if (employeeData) {
          kioskoIds = [employeeData.kiosko_id]
          const kioskoRow = (employeeData as any).kioscos
          if (kioskoRow) kioskoMap.set(kioskoRow.id, kioskoRow.name)

          if (employeeData.permissions?.can_approve_internal_orders && kioskoRow?.owner_id) {
            canApprove = true
            const { data: siblingKioscos } = await supabase
              .from("kioscos")
              .select("id, name")
              .eq("owner_id", kioskoRow.owner_id)
            if (siblingKioscos) {
              approvalKioskoIds = siblingKioscos.map((k) => k.id)
              siblingKioscos.forEach((k) => kioskoMap.set(k.id, k.name))
            }
          }
        }
      }

      if (kioskoIds.length === 0) {
        setLoading(false)
        return
      }

      const newNotifications: Notification[] = []

      // Pedidos internos esperando aprobación — sólo para quien puede
      // aprobar (dueño, o empleado con el permiso). Es lo más urgente:
      // mientras no se aprueba, el stock no se mueve de ningún lado.
      if (canApprove && approvalKioskoIds.length > 0) {
        const { data: pendingOrders } = await supabase
          .from("pedidos_internos")
          .select("id, kiosco_id, numero_pedido, fecha_solicitud")
          .in("kiosco_id", approvalKioskoIds)
          .eq("estado", "pendiente")
          .order("fecha_solicitud", { ascending: false })
          .limit(10)

        pendingOrders?.forEach((order) => {
          newNotifications.push({
            id: `approval-${order.id}`,
            type: "approval",
            title: "Pedido de stock para aprobar",
            message: `${order.numero_pedido} — pedido por ${kioskoMap.get(order.kiosco_id) || "una sucursal"}`,
            time: new Date(order.fecha_solicitud),
            read: false,
            urgent: true,
            href: "/dashboard/compras/pedidos-internos",
          })
        })
      }

      // Get recent sales (last hour)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
      const { data: recentSales } = await supabase
        .from("sales")
        .select("id, kiosko_id, total_amount, created_at")
        .in("kiosko_id", kioskoIds)
        .gte("created_at", oneHourAgo.toISOString())
        .order("created_at", { ascending: false })
        .limit(5)

      recentSales?.forEach(sale => {
        newNotifications.push({
          id: `sale-${sale.id}`,
          type: "sale",
          title: "Nueva venta",
          message: `$${Number(sale.total_amount).toLocaleString('es-AR')}`,
          time: new Date(sale.created_at),
          read: false,
          kioskoName: kioskoMap.get(sale.kiosko_id)
        })
      })

      // Get low stock alerts
      const { data: lowStockProducts } = await supabase
        .from("products")
        .select("id, kiosko_id, name, stock_quantity, min_stock_level, updated_at")
        .in("kiosko_id", kioskoIds)
        .order("updated_at", { ascending: false })
        .limit(20)

      lowStockProducts?.forEach(product => {
        if (product.stock_quantity <= (product.min_stock_level || 10)) {
          newNotifications.push({
            id: `stock-${product.id}`,
            type: "stock",
            title: "Stock bajo",
            message: `${product.name}: ${product.stock_quantity} unidades`,
            time: new Date(product.updated_at),
            read: false,
            kioskoName: kioskoMap.get(product.kiosko_id),
            href: "/dashboard/productos",
          })
        }
      })

      // Sort by time (las urgentes de aprobación van siempre primero)
      newNotifications.sort((a, b) => {
        if (!!a.urgent !== !!b.urgent) return a.urgent ? -1 : 1
        return b.time.getTime() - a.time.getTime()
      })

      // Take first 10, aplicando el estado de leído guardado localmente —
      // antes esto se perdía en cada actualización (cada 30s) y la
      // campanita parecía tener algo nuevo todo el tiempo.
      const readIds = loadReadIds()
      const limitedNotifications = newNotifications.slice(0, 10).map((n) => ({ ...n, read: readIds.has(n.id) }))

      setNotifications(limitedNotifications)
      setUnreadCount(limitedNotifications.filter(n => !n.read).length)
    } catch (err) {
      console.error("Error loading notifications:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    const readIds = loadReadIds()
    readIds.add(notification.id)
    saveReadIds(readIds)
    setNotifications((prev) => prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n)))
    setUnreadCount((prev) => Math.max(0, prev - (notification.read ? 0 : 1)))

    if (notification.href) router.push(notification.href)
  }

  const markAllRead = () => {
    const readIds = loadReadIds()
    notifications.forEach((n) => readIds.add(n.id))
    saveReadIds(readIds)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  const clearAll = () => {
    setNotifications([])
    setUnreadCount(0)
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "sale":
        return <ShoppingCart className="w-4 h-4 text-green-400" />
      case "stock":
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />
      case "approval":
        return <PackageSearch className="w-4 h-4 text-red-400" />
      case "order":
        return <Package className="w-4 h-4 text-cyan-400" />
      default:
        return <Bell className="w-4 h-4 text-gray-400" />
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-gray-400 hover:text-white hover:bg-white/5">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold text-white"
              style={{ backgroundColor: notifications.some((n) => n.urgent && !n.read) ? "#ef4444" : config.primary }}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-80 bg-[#0a0f1a] text-white max-h-[500px] overflow-hidden flex flex-col"
        style={{ borderColor: config.border }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b" style={{ borderColor: config.border }}>
          <h3 className="font-semibold">Notificaciones</h3>
          <div className="flex items-center gap-2">
            {notifications.length > 0 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-gray-400 hover:text-white"
                  onClick={markAllRead}
                  title="Marcar todas como leídas"
                >
                  <Check className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-gray-400 hover:text-white"
                  onClick={clearAll}
                  title="Limpiar todas"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-gray-400 hover:text-white"
              onClick={loadNotifications}
              title="Actualizar"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto max-h-[400px]">
          {loading && notifications.length === 0 ? (
            <div className="flex items-center justify-center p-8">
              <RefreshCw className="w-6 h-6 text-cyan-500 animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No hay notificaciones</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: config.border }}>
              {notifications.map(notification => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-3 transition-colors ${notification.href ? "cursor-pointer" : ""} hover:bg-white/5 ${
                    notification.urgent && !notification.read
                      ? "bg-red-500/10"
                      : !notification.read
                        ? "bg-cyan-500/5"
                        : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{getIcon(notification.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-white truncate">
                          {notification.urgent && "⚠️ "}
                          {notification.title}
                        </p>
                        <span className="text-xs text-gray-500 whitespace-nowrap flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTimeAgo(notification.time)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 truncate">{notification.message}</p>
                      {notification.kioskoName && (
                        <p className="text-xs text-gray-600 mt-0.5">{notification.kioskoName}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
