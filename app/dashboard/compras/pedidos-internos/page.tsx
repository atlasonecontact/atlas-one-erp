"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Search,
  Plus,
  Check,
  Clock,
  Truck,
  RefreshCw,
  PackageCheck,
  Building2,
  Warehouse,
  AlertCircle,
  ChevronRight,
  X,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { NuevoPedidoInternoModal } from "@/components/compras/nuevo-pedido-interno-modal"
import { AprobarPedidoInternoModal } from "@/components/compras/aprobar-pedido-interno-modal"
import { useEmployeePermissions } from "@/lib/hooks/use-employee-permissions"
import { useToast } from "@/components/ui/toast-provider"
import { AccessDenied } from "@/components/ui/access-denied"

interface PedidoInterno {
  id: string
  numero_pedido: string
  kiosco_id: string
  tipo_destino: string
  destino_kiosco_id: string | null
  destino_nombre?: string
  origen_kiosco_id: string | null
  origen_nombre?: string | null
  solicitante_nombre?: string
  estado: string
  observaciones: string | null
  motivo_rechazo: string | null
  fecha_solicitud: string
  fecha_recepcion: string | null
  items_count: number
  items_total: number
}

export default function PedidosInternosPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [approvingPedido, setApprovingPedido] = useState<PedidoInterno | null>(null)
  const [pedidos, setPedidos] = useState<PedidoInterno[]>([])
  const [loading, setLoading] = useState(true)
  const [kioskoId, setKioskoId] = useState<string | null>(null)
  const [allKioscoIds, setAllKioscoIds] = useState<string[]>([])
  const [canApprove, setCanApprove] = useState(false)
  const [selectedPedido, setSelectedPedido] = useState<string | null>(null)
  const [pedidoItems, setPedidoItems] = useState<any[]>([])
  const { permissions, loading: permsLoading } = useEmployeePermissions()
  const toast = useToast()

  const supabase = createClient()

  useEffect(() => {
    loadUserAndPedidos()
  }, [])

  const loadUserAndPedidos = async () => {
    setLoading(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    const { data: employeeData } = await supabase
      .from("employees")
      .select("kiosko_id, permissions")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle()

    let targetKioskoId: string | null = null
    // El dueño (o un gerente con permiso) tiene que ver los pedidos de TODAS
    // sus sucursales, no sólo la propia — si no, nunca se entera de un
    // pedido pendiente hecho desde otro local.
    let loadKioskoIds: string[] = []
    let ownerId: string | null = null
    let canApproveNow = false

    if (employeeData) {
      targetKioskoId = employeeData.kiosko_id
      loadKioskoIds = [employeeData.kiosko_id]
      if (employeeData.permissions?.can_approve_internal_orders) {
        const { data: kioskoRow } = await supabase
          .from("kioscos")
          .select("owner_id")
          .eq("id", employeeData.kiosko_id)
          .single()
        ownerId = kioskoRow?.owner_id ?? null
        canApproveNow = true
      }
    } else {
      const { data: kioscos } = await supabase.from("kioscos").select("id, owner_id").eq("owner_id", user.id)
      if (kioscos && kioscos.length > 0) {
        targetKioskoId = kioscos[0].id
        loadKioskoIds = kioscos.map((k) => k.id)
        ownerId = user.id
        canApproveNow = true
      }
    }

    // Un gerente con permiso ve (y puede aprobar) los pedidos de todas las
    // sucursales del mismo dueño, no sólo la propia.
    if (ownerId && canApproveNow && employeeData) {
      const { data: allOwnerKioscos } = await supabase.from("kioscos").select("id").eq("owner_id", ownerId)
      if (allOwnerKioscos) {
        loadKioskoIds = allOwnerKioscos.map((k) => k.id)
      }
    }

    setCanApprove(canApproveNow)

    if (targetKioskoId) {
      setKioskoId(targetKioskoId)
      setAllKioscoIds(loadKioskoIds)
      await loadPedidos(loadKioskoIds)
    }
    setLoading(false)
  }

  const loadPedidos = async (kiosko_ids: string[]) => {
    const { data, error } = await supabase
      .from("pedidos_internos")
      .select(`
        *,
        destino:destino_kiosco_id(name),
        origen:origen_kiosco_id(name),
        solicitante:kiosco_id(name)
      `)
      .in("kiosco_id", kiosko_ids)
      .order("created_at", { ascending: false })

    if (!error && data) {
      const pedidosWithItems = await Promise.all(
        data.map(async (pedido: any) => {
          const { data: items, count } = await supabase
            .from("pedidos_internos_items")
            .select("cantidad", { count: "exact" })
            .eq("pedido_id", pedido.id)

          const totalItems = items?.reduce((sum, item) => sum + item.cantidad, 0) || 0

          return {
            ...pedido,
            destino_nombre: pedido.destino?.name || "Stock Central",
            origen_nombre: pedido.origen?.name || null,
            solicitante_nombre: pedido.solicitante?.name || "",
            items_count: count || 0,
            items_total: totalItems,
          }
        }),
      )

      setPedidos(pedidosWithItems)
    }
  }

  const loadPedidoItems = async (pedidoId: string) => {
    const { data, error } = await supabase
      .from("pedidos_internos_items")
      .select(`
        *,
        producto:producto_id(name, category)
      `)
      .eq("pedido_id", pedidoId)

    if (!error && data) {
      setPedidoItems(data)
    }
  }

  const handleVerDetalle = async (pedidoId: string) => {
    setSelectedPedido(pedidoId === selectedPedido ? null : pedidoId)
    if (pedidoId !== selectedPedido) {
      await loadPedidoItems(pedidoId)
    }
  }

  const handleMarcarRecibido = async (pedidoId: string) => {
    // El stock ya se movió al aprobar: esto sólo confirma que la mercadería
    // llegó físicamente, no vuelve a tocar stock_quantity.
    const { error } = await supabase
      .from("pedidos_internos")
      .update({
        estado: "recibido",
        fecha_recepcion: new Date().toISOString(),
      })
      .eq("id", pedidoId)

    if (!error) {
      await loadPedidos(allKioscoIds)
    }
  }

  const handleRechazar = async (pedidoId: string) => {
    const motivo = window.prompt("Motivo del rechazo (opcional):")?.trim() || null
    const { error } = await supabase.rpc("reject_pedido_interno", {
      p_pedido_id: pedidoId,
      p_reason: motivo,
    })

    if (error) {
      toast.error("No se pudo rechazar", error.message)
    } else {
      toast.success("Pedido rechazado", "No se movió stock de ningún lado")
      await loadPedidos(allKioscoIds)
    }
  }

  const filteredPedidos = pedidos.filter(
    (p) =>
      p.numero_pedido.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.solicitante_nombre || "").toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusIcon = (estado: string) => {
    switch (estado) {
      case "recibido":
        return <Check className="w-4 h-4" />
      case "aprobado":
        return <Truck className="w-4 h-4" />
      case "pendiente":
        return <Clock className="w-4 h-4" />
      case "en_proceso":
        return <Truck className="w-4 h-4" />
      case "rechazado":
      case "cancelado":
        return <AlertCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const getStatusStyle = (estado: string) => {
    switch (estado) {
      case "recibido":
        return "bg-green-500/20 text-green-400"
      case "aprobado":
        return "bg-cyan-500/20 text-cyan-400"
      case "pendiente":
        return "bg-yellow-500/20 text-yellow-400"
      case "en_proceso":
        return "bg-cyan-500/20 text-cyan-400"
      case "rechazado":
      case "cancelado":
        return "bg-red-500/20 text-red-400"
      default:
        return "bg-gray-500/20 text-gray-400"
    }
  }

  const getEstadoLabel = (estado: string) => {
    switch (estado) {
      case "recibido":
        return "Recibido"
      case "aprobado":
        return "Aprobado"
      case "pendiente":
        return "Pendiente"
      case "en_proceso":
        return "En Proceso"
      case "rechazado":
        return "Rechazado"
      case "cancelado":
        return "Cancelado"
      default:
        return estado
    }
  }

  const stats = {
    pendientes: pedidos.filter((p) => p.estado === "pendiente").length,
    enProceso: pedidos.filter((p) => p.estado === "en_proceso").length,
    recibidos: pedidos.filter((p) => p.estado === "recibido").length,
  }

  if (!permsLoading && !permissions.can_view_internal_orders) {
    return (
      <div className="space-y-6">
        <AccessDenied
          title="No tenés permiso para ver pedidos internos"
          message="Pedile a tu dueño de kiosco que te habilite 'Consultar pedidos internos' desde Empleados."
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Pedidos Internos</h1>
          <p className="text-gray-400 text-sm">Gestiona pedidos de mercadería entre sucursales y stock central</p>
        </div>
        {permissions.can_create_internal_order && (
          <Button
            onClick={() => setShowModal(true)}
            className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold gap-2"
          >
            <Plus className="w-4 h-4" />
            Nuevo Pedido
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Pendientes</p>
              <p className="text-2xl font-bold text-yellow-400">{stats.pendientes}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
              <Truck className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">En Proceso</p>
              <p className="text-2xl font-bold text-cyan-400">{stats.enProceso}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <PackageCheck className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Recibidos</p>
              <p className="text-2xl font-bold text-green-400">{stats.recibidos}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <Input
          type="text"
          placeholder="Buscar por número o destino..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-[#0a0f1a] border-cyan-500/10 text-white placeholder:text-gray-500"
        />
      </div>

      {/* Pedidos: cards en mobile, tabla en desktop */}
      <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] overflow-hidden">
        {/* Mobile */}
        <div className="md:hidden divide-y divide-cyan-500/10">
          {loading ? (
            <div className="p-8 text-center text-gray-500">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
              Cargando pedidos...
            </div>
          ) : filteredPedidos.length === 0 ? (
            <p className="p-8 text-center text-gray-500">No hay pedidos internos registrados</p>
          ) : (
            filteredPedidos.map((pedido) => (
              <div key={pedido.id} className="p-4 space-y-3">
                <button className="w-full text-left" onClick={() => handleVerDetalle(pedido.id)}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-cyan-400 font-mono text-sm">{pedido.numero_pedido}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <Building2 className="w-4 h-4 text-purple-400 shrink-0" />
                        <span className="text-white text-sm truncate">{pedido.solicitante_nombre}</span>
                      </div>
                      {pedido.origen_nombre && (
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <Warehouse className="w-3 h-3" /> desde {pedido.origen_nombre}
                        </p>
                      )}
                    </div>
                    <span
                      className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusStyle(pedido.estado)}`}
                    >
                      {getStatusIcon(pedido.estado)}
                      {getEstadoLabel(pedido.estado)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-400 mt-2">
                    <span>
                      {pedido.items_count} items ({pedido.items_total} unidades)
                    </span>
                    <span>{formatDate(pedido.fecha_solicitud)}</span>
                  </div>
                </button>

                <div className="flex items-center gap-2">
                  {pedido.estado === "pendiente" && canApprove && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setApprovingPedido(pedido)}
                        className="flex-1 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        Aprobar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRechazar(pedido.id)}
                        className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10 gap-1.5"
                      >
                        <X className="w-4 h-4" />
                        Rechazar
                      </Button>
                    </>
                  )}
                  {pedido.estado === "aprobado" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMarcarRecibido(pedido.id)}
                      className="flex-1 border-green-500/30 text-green-400 hover:bg-green-500/10 gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      Recibido
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleVerDetalle(pedido.id)}
                    className="text-gray-400 hover:text-white gap-1.5"
                  >
                    Ver detalle
                    <ChevronRight
                      className={`w-4 h-4 transition-transform ${selectedPedido === pedido.id ? "rotate-90" : ""}`}
                    />
                  </Button>
                </div>

                {selectedPedido === pedido.id && (
                  <div className="rounded-lg bg-white/5 p-3 space-y-3">
                    {pedido.observaciones && (
                      <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                        <p className="text-sm text-gray-300">
                          <span className="font-medium text-cyan-400">Observaciones:</span> {pedido.observaciones}
                        </p>
                      </div>
                    )}
                    {pedido.motivo_rechazo && (
                      <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                        <p className="text-sm text-gray-300">
                          <span className="font-medium text-red-400">Motivo del rechazo:</span>{" "}
                          {pedido.motivo_rechazo}
                        </p>
                      </div>
                    )}
                    <div className="space-y-2">
                      {pedidoItems.map((item: any) => (
                        <div key={item.id} className="flex items-center justify-between text-sm border-b border-cyan-500/5 pb-2">
                          <div className="min-w-0">
                            <p className="text-white truncate">{item.producto?.name || "N/A"}</p>
                            <p className="text-xs text-gray-500">{item.producto?.category || "N/A"}</p>
                          </div>
                          <div className="text-right shrink-0 ml-2">
                            <p className="text-white">{item.cantidad} ped.</p>
                            <p className="text-xs text-cyan-400">{item.cantidad_recibida} recib.</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Desktop */}
        <table className="hidden md:table w-full">
          <thead>
            <tr className="border-b border-cyan-500/10">
              <th className="text-left text-sm font-medium text-gray-400 p-4">Número</th>
              <th className="text-left text-sm font-medium text-gray-400 p-4">Solicitante</th>
              <th className="text-left text-sm font-medium text-gray-400 p-4">Items</th>
              <th className="text-left text-sm font-medium text-gray-400 p-4">Fecha Solicitud</th>
              <th className="text-left text-sm font-medium text-gray-400 p-4">Estado</th>
              <th className="text-right text-sm font-medium text-gray-400 p-4">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                  Cargando pedidos...
                </td>
              </tr>
            ) : filteredPedidos.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">
                  No hay pedidos internos registrados
                </td>
              </tr>
            ) : (
              filteredPedidos.map((pedido) => (
                <>
                  <tr
                    key={pedido.id}
                    className="border-b border-cyan-500/5 hover:bg-white/5 transition-colors cursor-pointer"
                    onClick={() => handleVerDetalle(pedido.id)}
                  >
                    <td className="p-4">
                      <span className="text-cyan-400 font-mono">{pedido.numero_pedido}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-purple-400" />
                        <div>
                          <span className="text-white">{pedido.solicitante_nombre}</span>
                          {pedido.origen_nombre && (
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <Warehouse className="w-3 h-3" /> desde {pedido.origen_nombre}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-gray-400">
                        {pedido.items_count} items ({pedido.items_total} unidades)
                      </span>
                    </td>
                    <td className="p-4 text-gray-400">{formatDate(pedido.fecha_solicitud)}</td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusStyle(pedido.estado)}`}
                      >
                        {getStatusIcon(pedido.estado)}
                        {getEstadoLabel(pedido.estado)}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {pedido.estado === "pendiente" && canApprove && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                setApprovingPedido(pedido)
                              }}
                              className="text-cyan-400 hover:text-cyan-300"
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Aprobar
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleRechazar(pedido.id)
                              }}
                              className="text-red-400 hover:text-red-300"
                            >
                              <X className="w-4 h-4 mr-1" />
                              Rechazar
                            </Button>
                          </>
                        )}
                        {pedido.estado === "aprobado" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleMarcarRecibido(pedido.id)
                            }}
                            className="text-green-400 hover:text-green-300"
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Recibido
                          </Button>
                        )}
                        <ChevronRight
                          className={`w-4 h-4 text-gray-400 transition-transform ${selectedPedido === pedido.id ? "rotate-90" : ""}`}
                        />
                      </div>
                    </td>
                  </tr>
                  {selectedPedido === pedido.id && (
                    <tr className="bg-white/5">
                      <td colSpan={6} className="p-6">
                        <div className="space-y-4">
                          <h4 className="text-sm font-semibold text-white mb-3">Detalle del Pedido</h4>
                          {pedido.observaciones && (
                            <div className="mb-4 p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                              <p className="text-sm text-gray-300">
                                <span className="font-medium text-cyan-400">Observaciones:</span> {pedido.observaciones}
                              </p>
                            </div>
                          )}
                          {pedido.motivo_rechazo && (
                            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                              <p className="text-sm text-gray-300">
                                <span className="font-medium text-red-400">Motivo del rechazo:</span>{" "}
                                {pedido.motivo_rechazo}
                              </p>
                            </div>
                          )}
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-cyan-500/20">
                                <th className="text-left text-xs font-medium text-gray-500 pb-2">Producto</th>
                                <th className="text-left text-xs font-medium text-gray-500 pb-2">Categoría</th>
                                <th className="text-right text-xs font-medium text-gray-500 pb-2">Cantidad</th>
                                <th className="text-right text-xs font-medium text-gray-500 pb-2">Recibida</th>
                                <th className="text-left text-xs font-medium text-gray-500 pb-2">Notas</th>
                              </tr>
                            </thead>
                            <tbody>
                              {pedidoItems.map((item: any) => (
                                <tr key={item.id} className="border-b border-cyan-500/5">
                                  <td className="py-2 text-sm text-white">{item.producto?.name || "N/A"}</td>
                                  <td className="py-2 text-sm text-gray-400">{item.producto?.category || "N/A"}</td>
                                  <td className="py-2 text-sm text-white text-right">{item.cantidad}</td>
                                  <td className="py-2 text-sm text-cyan-400 text-right">{item.cantidad_recibida}</td>
                                  <td className="py-2 text-sm text-gray-400">{item.observaciones || "-"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))
            )}
          </tbody>
        </table>
      </div>

      {kioskoId && (
        <NuevoPedidoInternoModal
          open={showModal}
          onClose={() => setShowModal(false)}
          kioskoId={kioskoId}
          onSuccess={() => loadPedidos(allKioscoIds)}
        />
      )}

      {approvingPedido && (
        <AprobarPedidoInternoModal
          open={!!approvingPedido}
          onClose={() => setApprovingPedido(null)}
          pedido={approvingPedido}
          onSuccess={() => {
            setApprovingPedido(null)
            loadPedidos(allKioscoIds)
          }}
        />
      )}
    </div>
  )
}
