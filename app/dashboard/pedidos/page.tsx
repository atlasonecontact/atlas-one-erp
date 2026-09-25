"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Bike,
  ShoppingBag,
  Clock,
  CheckCircle,
  XCircle,
  ChefHat,
  Package,
  Truck,
  RefreshCw,
  Phone,
  MapPin,
  User,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface ExternalOrder {
  id: string
  provider: "pedidosya" | "rappi" | "other"
  provider_order_id: string
  status: string
  customer_name: string | null
  customer_phone: string | null
  customer_address: string | null
  customer_notes: string | null
  items: any[]
  subtotal: number
  delivery_fee: number
  discount: number
  total: number
  driver_name: string | null
  driver_phone: string | null
  estimated_pickup_time: string | null
  received_at: string
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "Pendiente", color: "bg-yellow-500", icon: Clock },
  confirmed: { label: "Confirmado", color: "bg-blue-500", icon: CheckCircle },
  preparing: { label: "Preparando", color: "bg-orange-500", icon: ChefHat },
  ready: { label: "Listo", color: "bg-green-500", icon: Package },
  picked_up: { label: "En camino", color: "bg-purple-500", icon: Truck },
  delivered: { label: "Entregado", color: "bg-emerald-500", icon: CheckCircle },
  cancelled: { label: "Cancelado", color: "bg-red-500", icon: XCircle },
  rejected: { label: "Rechazado", color: "bg-red-600", icon: XCircle },
}

const providerConfig: Record<string, { label: string; color: string; icon: any }> = {
  pedidosya: { label: "Pedidos Ya", color: "bg-red-500", icon: Bike },
  rappi: { label: "Rappi", color: "bg-orange-500", icon: ShoppingBag },
  other: { label: "Otro", color: "bg-gray-500", icon: Package },
}

export default function PedidosPage() {
  const [orders, setOrders] = useState<ExternalOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<ExternalOrder | null>(null)
  const [filter, setFilter] = useState<"all" | "active" | "completed">("active")
  const [kioskoId, setKioskoId] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    loadUserAndOrders()

    // Suscripción en tiempo real para nuevos pedidos
    const channel = supabase
      .channel("external_orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "external_orders" }, () => {
        loadOrders()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    if (kioskoId) {
      loadOrders()
    }
  }, [kioskoId, filter])

  const loadUserAndOrders = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { data: employee } = await supabase
      .from("employees")
      .select("kiosko_id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle()

    if (employee) {
      setKioskoId(employee.kiosko_id)
      return
    }

    // Check if owner
    const { data: kiosko } = await supabase.from("kioscos").select("id").eq("owner_id", user.id).limit(1).maybeSingle()

    if (kiosko) {
      setKioskoId(kiosko.id)
    }
  }

  const loadOrders = async () => {
    if (!kioskoId) return
    setIsLoading(true)

    let query = supabase
      .from("external_orders")
      .select("*")
      .eq("kiosko_id", kioskoId)
      .order("received_at", { ascending: false })

    if (filter === "active") {
      query = query.in("status", ["pending", "confirmed", "preparing", "ready", "picked_up"])
    } else if (filter === "completed") {
      query = query.in("status", ["delivered", "cancelled", "rejected"])
    }

    const { data } = await query.limit(50)
    setOrders(data || [])
    setIsLoading(false)
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    await supabase
      .from("external_orders")
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
        ...(newStatus === "picked_up" ? { actual_pickup_time: new Date().toISOString() } : {}),
        ...(newStatus === "delivered" ? { actual_delivery_time: new Date().toISOString() } : {}),
      })
      .eq("id", orderId)

    await loadOrders()
    if (selectedOrder?.id === orderId) {
      setSelectedOrder({ ...selectedOrder, status: newStatus })
    }
  }

  const getNextStatus = (currentStatus: string): string | null => {
    const flow: Record<string, string> = {
      pending: "confirmed",
      confirmed: "preparing",
      preparing: "ready",
      ready: "picked_up",
      picked_up: "delivered",
    }
    return flow[currentStatus] || null
  }

  const activeOrders = orders.filter((o) =>
    ["pending", "confirmed", "preparing", "ready", "picked_up"].includes(o.status),
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Pedidos Delivery</h1>
          <p className="text-gray-400 text-sm">Pedidos de Pedidos Ya, Rappi y otras apps</p>
        </div>
        <Button
          onClick={loadOrders}
          variant="outline"
          className="border-cyan-500/20 text-gray-400 hover:text-white bg-transparent"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-400">
                {orders.filter((o) => o.status === "pending").length}
              </p>
              <p className="text-xs text-gray-400">Pendientes</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-orange-500/20 bg-orange-500/10 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
              <ChefHat className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-400">
                {orders.filter((o) => o.status === "preparing").length}
              </p>
              <p className="text-xs text-gray-400">Preparando</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <Package className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-400">{orders.filter((o) => o.status === "ready").length}</p>
              <p className="text-xs text-gray-400">Listos</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-purple-500/20 bg-purple-500/10 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Truck className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-400">
                {orders.filter((o) => o.status === "picked_up").length}
              </p>
              <p className="text-xs text-gray-400">En camino</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <Button
          variant={filter === "active" ? "default" : "outline"}
          onClick={() => setFilter("active")}
          className={filter === "active" ? "bg-cyan-500 text-black" : "border-cyan-500/20 text-gray-400 bg-transparent"}
        >
          Activos ({activeOrders.length})
        </Button>
        <Button
          variant={filter === "all" ? "default" : "outline"}
          onClick={() => setFilter("all")}
          className={filter === "all" ? "bg-cyan-500 text-black" : "border-cyan-500/20 text-gray-400 bg-transparent"}
        >
          Todos
        </Button>
        <Button
          variant={filter === "completed" ? "default" : "outline"}
          onClick={() => setFilter("completed")}
          className={
            filter === "completed" ? "bg-cyan-500 text-black" : "border-cyan-500/20 text-gray-400 bg-transparent"
          }
        >
          Completados
        </Button>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {orders.length === 0 ? (
          <div className="col-span-2 text-center py-12 border border-cyan-500/10 rounded-xl bg-[#0a0f1a]/50">
            <Package className="w-12 h-12 mx-auto mb-3 text-gray-600" />
            <p className="text-gray-400">No hay pedidos {filter === "active" ? "activos" : ""}</p>
            <p className="text-sm text-gray-500 mt-1">
              Los pedidos de Pedidos Ya y Rappi aparecerán aquí automáticamente
            </p>
          </div>
        ) : (
          orders.map((order) => {
            const status = statusConfig[order.status] || statusConfig.pending
            const provider = providerConfig[order.provider] || providerConfig.other
            const StatusIcon = status.icon
            const ProviderIcon = provider.icon
            const nextStatus = getNextStatus(order.status)

            return (
              <div
                key={order.id}
                className={`rounded-xl border bg-[#0a0f1a] p-4 cursor-pointer transition-all hover:border-cyan-500/30 ${
                  selectedOrder?.id === order.id ? "border-cyan-500" : "border-cyan-500/10"
                }`}
                onClick={() => setSelectedOrder(order)}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg ${provider.color}/20 flex items-center justify-center`}>
                      <ProviderIcon
                        className={`w-4 h-4 ${provider.color.replace("bg-", "text-").replace("-500", "-400")}`}
                      />
                    </div>
                    <div>
                      <span className="text-white font-medium">{provider.label}</span>
                      <span className="text-gray-500 text-sm ml-2">#{order.provider_order_id}</span>
                    </div>
                  </div>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${status.color}/20`}>
                    <StatusIcon className={`w-3 h-3 ${status.color.replace("bg-", "text-").replace("-500", "-400")}`} />
                    <span className={`text-xs ${status.color.replace("bg-", "text-").replace("-500", "-400")}`}>
                      {status.label}
                    </span>
                  </div>
                </div>

                {/* Customer */}
                <div className="space-y-1 mb-3">
                  {order.customer_name && (
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="text-white">{order.customer_name}</span>
                    </div>
                  )}
                  {order.customer_address && (
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                      <span className="text-gray-400 line-clamp-1">{order.customer_address}</span>
                    </div>
                  )}
                </div>

                {/* Items preview */}
                <div className="text-sm text-gray-400 mb-3">
                  {order.items.slice(0, 2).map((item: any, i: number) => (
                    <div key={i} className="flex justify-between">
                      <span>
                        {item.quantity}x {item.name || item.title}
                      </span>
                      <span>${(item.quantity * item.price).toLocaleString()}</span>
                    </div>
                  ))}
                  {order.items.length > 2 && <span className="text-gray-500">+{order.items.length - 2} más...</span>}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-cyan-500/10">
                  <div>
                    <span className="text-gray-500 text-xs">
                      {new Date(order.received_at).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-cyan-400">${order.total.toLocaleString()}</span>
                    {nextStatus && (
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          updateOrderStatus(order.id, nextStatus)
                        }}
                        className="bg-cyan-500 hover:bg-cyan-400 text-black text-xs"
                      >
                        {statusConfig[nextStatus]?.label || "Siguiente"}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Order Detail Modal (simplified inline) */}
      {selectedOrder && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="bg-[#0a0f1a] rounded-xl border border-cyan-500/20 max-w-lg w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Pedido #{selectedOrder.provider_order_id}</h2>
                <Button variant="ghost" size="sm" onClick={() => setSelectedOrder(null)} className="text-gray-400">
                  ✕
                </Button>
              </div>

              {/* Status */}
              <div className={`p-3 rounded-lg ${statusConfig[selectedOrder.status].color}/10 flex items-center gap-2`}>
                {(() => {
                  const StatusIcon = statusConfig[selectedOrder.status].icon
                  return (
                    <StatusIcon
                      className={`w-5 h-5 ${statusConfig[selectedOrder.status].color.replace("bg-", "text-").replace("-500", "-400")}`}
                    />
                  )
                })()}
                <span className="text-white font-medium">{statusConfig[selectedOrder.status].label}</span>
              </div>

              {/* Customer Info */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-400">Cliente</h3>
                {selectedOrder.customer_name && <p className="text-white">{selectedOrder.customer_name}</p>}
                {selectedOrder.customer_phone && (
                  <a href={`tel:${selectedOrder.customer_phone}`} className="flex items-center gap-2 text-cyan-400">
                    <Phone className="w-4 h-4" />
                    {selectedOrder.customer_phone}
                  </a>
                )}
                {selectedOrder.customer_address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                    <span className="text-gray-300">{selectedOrder.customer_address}</span>
                  </div>
                )}
                {selectedOrder.customer_notes && (
                  <div className="p-2 bg-amber-500/10 rounded border border-amber-500/20">
                    <p className="text-amber-200 text-sm">{selectedOrder.customer_notes}</p>
                  </div>
                )}
              </div>

              {/* Items */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-400">Productos</h3>
                <div className="space-y-2">
                  {selectedOrder.items.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between p-2 bg-white/5 rounded">
                      <span className="text-white">
                        {item.quantity}x {item.name || item.title}
                      </span>
                      <span className="text-gray-400">${(item.quantity * item.price).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="border-t border-cyan-500/10 pt-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Subtotal</span>
                  <span className="text-white">${selectedOrder.subtotal.toLocaleString()}</span>
                </div>
                {selectedOrder.delivery_fee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Envío</span>
                    <span className="text-white">${selectedOrder.delivery_fee.toLocaleString()}</span>
                  </div>
                )}
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Descuento</span>
                    <span className="text-green-400">-${selectedOrder.discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-cyan-500/10">
                  <span className="text-white">Total</span>
                  <span className="text-cyan-400">${selectedOrder.total.toLocaleString()}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                {getNextStatus(selectedOrder.status) && (
                  <Button
                    onClick={() => {
                      updateOrderStatus(selectedOrder.id, getNextStatus(selectedOrder.status)!)
                    }}
                    className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-black"
                  >
                    Marcar como {statusConfig[getNextStatus(selectedOrder.status)!]?.label}
                  </Button>
                )}
                {selectedOrder.status === "pending" && (
                  <Button
                    onClick={() => updateOrderStatus(selectedOrder.id, "rejected")}
                    variant="outline"
                    className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                  >
                    Rechazar
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
