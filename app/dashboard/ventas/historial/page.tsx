"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Search,
  Download,
  Eye,
  ArrowLeft,
  Calendar,
  CreditCard,
  Banknote,
  QrCode,
  RefreshCw,
  X,
  Ban,
  RotateCcw,
} from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/toast-provider"
import { formatCurrency } from "@/lib/utils/currency"

interface Sale {
  id: string
  sale_number: string
  total_amount: number
  payment_method: string
  status: string
  created_at: string
  items_count?: number
  cancel_reason?: string | null
}

interface SaleItem {
  product_id: string
  name: string
  quantity: number
  unit_price: number
  subtotal: number
}

interface SaleDetail extends Sale {
  register_open: boolean
  items: SaleItem[]
}

// Se guarda al "anular y rehacer" para que el POS cargue el carrito de la venta anulada.
const REDO_CART_KEY = "atlas.redoSale.v1"

function todayInArgentina() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Buenos_Aires" }).format(new Date())
}

function shiftDate(iso: string, days: number) {
  const d = new Date(`${iso}T12:00:00`)
  d.setDate(d.getDate() + days)
  return new Intl.DateTimeFormat("en-CA").format(d)
}

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

const getMethodLabel = (method: string) => {
  switch (method?.toLowerCase()) {
    case "cash":
    case "efectivo":
      return "Efectivo"
    case "card":
    case "tarjeta":
      return "Tarjeta"
    case "transfer":
      return "Transferencia"
    case "qr":
      return "QR"
    default:
      return method || "Efectivo"
  }
}

const getMethodIcon = (method: string) => {
  switch (method?.toLowerCase()) {
    case "card":
    case "tarjeta":
      return <CreditCard className="w-4 h-4" />
    case "qr":
      return <QrCode className="w-4 h-4" />
    default:
      return <Banknote className="w-4 h-4" />
  }
}

function StatusBadge({ status }: { status: string }) {
  const styles =
    status === "completed"
      ? "bg-green-500/20 text-green-400"
      : status === "cancelled"
        ? "bg-red-500/20 text-red-400"
        : "bg-yellow-500/20 text-yellow-400"
  const label = status === "completed" ? "Completada" : status === "cancelled" ? "Anulada" : "Pendiente"
  return <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${styles}`}>{label}</span>
}

export default function HistorialVentasPage() {
  const router = useRouter()
  const toast = useToast()
  const supabase = createClient()

  const [searchQuery, setSearchQuery] = useState("")
  const [dateFrom, setDateFrom] = useState(todayInArgentina())
  const [dateTo, setDateTo] = useState(todayInArgentina())
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [kioskoId, setKioskoId] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [detail, setDetail] = useState<SaleDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [voidMode, setVoidMode] = useState<null | "void" | "redo">(null)
  const [voidReason, setVoidReason] = useState("")
  const [voiding, setVoiding] = useState(false)

  const loadSales = useCallback(
    async (kiosko: string, from: string, to: string) => {
      setLoading(true)
      setLoadError(null)
      const { data, error } = await supabase.rpc("sales_history", {
        p_kiosko: kiosko,
        p_from: from || null,
        p_to: to || null,
      })
      if (error) {
        setLoadError(error.message)
        setSales([])
      } else {
        setSales(
          ((data as any[]) || []).map((s) => ({
            id: s.id,
            sale_number: s.sale_number,
            total_amount: Number(s.total_amount),
            payment_method: s.payment_method || "cash",
            status: s.status || "completed",
            created_at: s.created_at,
            items_count: Number(s.items_count) || 0,
            cancel_reason: s.cancel_reason,
          })),
        )
      }
      setLoading(false)
    },
    [supabase],
  )

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      let target: string | null = null
      const { data: kioscos } = await supabase.from("kioscos").select("id").eq("owner_id", user.id).limit(1)
      if (kioscos && kioscos.length > 0) {
        target = kioscos[0].id
      } else {
        const { data: emp } = await supabase
          .from("employees")
          .select("kiosko_id")
          .eq("user_id", user.id)
          .eq("status", "active")
          .maybeSingle()
        target = emp?.kiosko_id ?? null
      }

      if (target) {
        setKioskoId(target)
      } else {
        setLoading(false)
      }
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (kioskoId) loadSales(kioskoId, dateFrom, dateTo)
  }, [kioskoId, dateFrom, dateTo, loadSales])

  const setRange = (from: string, to: string) => {
    setDateFrom(from)
    setDateTo(to)
  }

  const today = todayInArgentina()
  const chips = [
    { label: "Hoy", from: today, to: today },
    { label: "Ayer", from: shiftDate(today, -1), to: shiftDate(today, -1) },
    { label: "Últimos 7 días", from: shiftDate(today, -6), to: today },
    { label: "Este mes", from: `${today.slice(0, 7)}-01`, to: today },
    { label: "Todas", from: "", to: "" },
  ]

  const filteredSales = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return sales
    return sales.filter((s) => s.sale_number?.toLowerCase().includes(q) || s.id.toLowerCase().includes(q))
  }, [sales, searchQuery])

  const summary = useMemo(() => {
    const ok = filteredSales.filter((s) => s.status === "completed")
    return {
      count: ok.length,
      total: ok.reduce((sum, s) => sum + s.total_amount, 0),
      voided: filteredSales.filter((s) => s.status === "cancelled").length,
    }
  }, [filteredSales])

  const openDetail = async (sale: Sale) => {
    setVoidMode(null)
    setVoidReason("")
    setDetail({ ...sale, register_open: false, items: [] })
    setDetailLoading(true)
    const { data, error } = await supabase.rpc("sale_detail", { p_sale: sale.id })
    if (error || !data) {
      toast.error("No se pudo abrir la venta", error?.message || "Probá de nuevo")
      setDetail(null)
    } else {
      const d = data as any
      setDetail({
        id: d.id,
        sale_number: d.sale_number,
        total_amount: Number(d.total_amount),
        payment_method: d.payment_method || "cash",
        status: d.status,
        created_at: d.created_at,
        cancel_reason: d.cancel_reason,
        register_open: !!d.register_open,
        items: (d.items || []).map((i: any) => ({
          product_id: i.product_id,
          name: i.name,
          quantity: Number(i.quantity),
          unit_price: Number(i.unit_price),
          subtotal: Number(i.subtotal),
        })),
      })
    }
    setDetailLoading(false)
  }

  const closeDetail = () => {
    setDetail(null)
    setVoidMode(null)
    setVoidReason("")
  }

  const confirmVoid = async () => {
    if (!detail || !voidMode) return
    setVoiding(true)
    const { error } = await supabase.rpc("void_sale", { p_sale: detail.id, p_reason: voidReason.trim() || null })
    setVoiding(false)
    if (error) {
      toast.error("No se pudo anular la venta", error.message)
      return
    }

    if (voidMode === "redo") {
      try {
        window.localStorage.setItem(
          REDO_CART_KEY,
          JSON.stringify({
            sale_number: detail.sale_number,
            items: detail.items.map((i) => ({ product_id: i.product_id, name: i.name, quantity: i.quantity })),
          }),
        )
      } catch {
        // si no hay localStorage, el usuario arma la venta a mano
      }
      toast.success("Venta anulada", "Cargamos los productos en el punto de venta para que la rehagas")
      router.push("/dashboard/ventas")
      return
    }

    toast.success("Venta anulada", "El stock volvió al inventario y ya no cuenta en la caja")
    closeDetail()
    if (kioskoId) loadSales(kioskoId, dateFrom, dateTo)
  }

  const exportCsv = () => {
    const rows = [["Venta", "Fecha", "Items", "Método", "Total", "Estado"]]
    filteredSales.forEach((s) =>
      rows.push([
        s.sale_number,
        formatDate(s.created_at),
        String(s.items_count ?? 0),
        getMethodLabel(s.payment_method),
        String(s.total_amount),
        s.status === "completed" ? "Completada" : s.status === "cancelled" ? "Anulada" : "Pendiente",
      ]),
    )
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\r\n")
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `ventas_${dateFrom || "todas"}_${dateTo || "todas"}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const activeChip = chips.find((c) => c.from === dateFrom && c.to === dateTo)?.label

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/ventas">
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Historial de Ventas</h1>
            <p className="text-gray-400 text-sm">Consultá, corregí o anulá las ventas realizadas</p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={exportCsv}
          disabled={filteredSales.length === 0}
          className="border-cyan-500/20 text-gray-400 hover:text-white bg-transparent gap-2"
        >
          <Download className="w-4 h-4" />
          Exportar
        </Button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          {chips.map((c) => (
            <button
              key={c.label}
              onClick={() => setRange(c.from, c.to)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                activeChip === c.label
                  ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300"
                  : "border-white/10 text-gray-400 hover:text-white"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="flex items-end gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              type="text"
              placeholder="Buscar por número de venta..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[#0a0f1a] border-cyan-500/10 text-white placeholder:text-gray-500"
            />
          </div>
          <label className="text-xs text-gray-400 space-y-1">
            Desde
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              <Input
                type="date"
                value={dateFrom}
                max={dateTo || undefined}
                onChange={(e) => setDateFrom(e.target.value)}
                className="pl-10 bg-[#0a0f1a] border-cyan-500/10 text-white w-44"
              />
            </div>
          </label>
          <label className="text-xs text-gray-400 space-y-1">
            Hasta
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              <Input
                type="date"
                value={dateTo}
                min={dateFrom || undefined}
                onChange={(e) => setDateTo(e.target.value)}
                className="pl-10 bg-[#0a0f1a] border-cyan-500/10 text-white w-44"
              />
            </div>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-4">
          <p className="text-xs text-gray-400">Ventas</p>
          <p className="text-xl font-bold text-white">{summary.count}</p>
        </div>
        <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-4">
          <p className="text-xs text-gray-400">Total vendido</p>
          <p className="text-xl font-bold text-green-400">{formatCurrency(summary.total)}</p>
        </div>
        <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-4">
          <p className="text-xs text-gray-400">Anuladas</p>
          <p className="text-xl font-bold text-red-400">{summary.voided}</p>
        </div>
      </div>

      {loadError && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
          No se pudo cargar el historial: {loadError}. Falta correr el script 216 en la base de datos.
        </div>
      )}

      <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr className="border-b border-cyan-500/10">
              <th className="text-left text-sm font-medium text-gray-400 p-4">ID</th>
              <th className="text-left text-sm font-medium text-gray-400 p-4">Fecha</th>
              <th className="text-left text-sm font-medium text-gray-400 p-4">Items</th>
              <th className="text-left text-sm font-medium text-gray-400 p-4">Método</th>
              <th className="text-left text-sm font-medium text-gray-400 p-4">Total</th>
              <th className="text-left text-sm font-medium text-gray-400 p-4">Estado</th>
              <th className="text-right text-sm font-medium text-gray-400 p-4">Ver</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-500">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                  Cargando ventas...
                </td>
              </tr>
            ) : filteredSales.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-500">
                  No hay ventas en este período
                </td>
              </tr>
            ) : (
              filteredSales.map((sale) => (
                <tr key={sale.id} className="border-b border-cyan-500/5 hover:bg-white/5 transition-colors">
                  <td className="p-4">
                    <span className={`font-mono ${sale.status === "cancelled" ? "text-gray-500 line-through" : "text-cyan-400"}`}>
                      {sale.sale_number}
                    </span>
                  </td>
                  <td className="p-4 text-white whitespace-nowrap">{formatDate(sale.created_at)}</td>
                  <td className="p-4 text-gray-400">{sale.items_count} productos</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-gray-400">
                      {getMethodIcon(sale.payment_method)}
                      {getMethodLabel(sale.payment_method)}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`font-medium ${sale.status === "cancelled" ? "text-gray-500 line-through" : "text-white"}`}>
                      {formatCurrency(sale.total_amount)}
                    </span>
                  </td>
                  <td className="p-4">
                    <StatusBadge status={sale.status} />
                  </td>
                  <td className="p-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openDetail(sale)}
                      title="Ver artículos de la venta"
                      className="text-cyan-400 hover:text-white"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {detail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={closeDetail}
        >
          <div
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-cyan-500/20 bg-[#0a0f1a] p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-white">Venta {detail.sale_number}</h2>
                <p className="text-sm text-gray-400">{formatDate(detail.created_at)}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={detail.status} />
                <Button variant="ghost" size="icon" onClick={closeDetail} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            <div className="rounded-lg border border-white/10 divide-y divide-white/5">
              {detailLoading ? (
                <div className="p-6 text-center text-gray-500">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
                  Cargando artículos...
                </div>
              ) : detail.items.length === 0 ? (
                <p className="p-4 text-sm text-gray-500 text-center">Esta venta no tiene artículos registrados.</p>
              ) : (
                detail.items.map((item, idx) => (
                  <div key={`${item.product_id}-${idx}`} className="flex items-center justify-between gap-3 p-3">
                    <div className="min-w-0">
                      <p className="text-white text-sm truncate">{item.name}</p>
                      <p className="text-xs text-gray-500">
                        {item.quantity} × {formatCurrency(item.unit_price)}
                      </p>
                    </div>
                    <p className="text-white font-medium text-sm shrink-0">{formatCurrency(item.subtotal)}</p>
                  </div>
                ))
              )}
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-gray-400">
                {getMethodIcon(detail.payment_method)}
                {getMethodLabel(detail.payment_method)}
              </span>
              <span className="text-xl font-bold text-white">{formatCurrency(detail.total_amount)}</span>
            </div>

            {detail.status === "cancelled" && detail.cancel_reason && (
              <p className="text-sm text-red-300">Motivo de la anulación: {detail.cancel_reason}</p>
            )}

            {detail.status === "completed" && !detailLoading && (
              <div className="border-t border-white/10 pt-4 space-y-3">
                {voidMode ? (
                  <>
                    <p className="text-sm text-amber-300">
                      {voidMode === "redo"
                        ? "Se anula esta venta, vuelve el stock y los productos quedan cargados en el punto de venta para cobrarla de nuevo."
                        : "Se anula esta venta, vuelve el stock al inventario y deja de contar en la caja."}
                    </p>
                    <Input
                      value={voidReason}
                      onChange={(e) => setVoidReason(e.target.value)}
                      placeholder="Motivo (opcional): ej. me equivoqué de producto"
                      className="bg-[#050810] border-cyan-500/10 text-white"
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setVoidMode(null)}
                        disabled={voiding}
                        className="flex-1 border-white/10 text-gray-300 bg-transparent"
                      >
                        Volver
                      </Button>
                      <Button
                        onClick={confirmVoid}
                        disabled={voiding}
                        className="flex-1 bg-red-600 hover:bg-red-500 text-white"
                      >
                        {voiding ? "Anulando..." : "Confirmar anulación"}
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      onClick={() => setVoidMode("redo")}
                      className="flex-1 min-w-[180px] bg-cyan-600 hover:bg-cyan-500 text-white gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Anular y rehacer
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setVoidMode("void")}
                      className="flex-1 min-w-[140px] border-red-500/30 text-red-400 hover:text-red-300 bg-transparent gap-2"
                    >
                      <Ban className="w-4 h-4" />
                      Solo anular
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
