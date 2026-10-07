"use client"

import { useEffect, useMemo, useState } from "react"
import { Search, Download, RefreshCw, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import { formatCurrency } from "@/lib/utils/currency"

const TZ = "America/Argentina/Buenos_Aires"
const PAGE = 1000
const MAX_PAGES = 30

const dayFmt = new Intl.DateTimeFormat("en-CA", { timeZone: TZ })
const dateFmt = new Intl.DateTimeFormat("es-AR", { timeZone: TZ, day: "2-digit", month: "2-digit", year: "numeric" })
const timeFmt = new Intl.DateTimeFormat("es-AR", {
  timeZone: TZ,
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
})
const hourFmt = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", hour12: false })

const todayStr = () => dayFmt.format(new Date())
const shiftDay = (iso: string, days: number) => {
  const d = new Date(`${iso}T12:00:00-03:00`)
  d.setDate(d.getDate() + days)
  return dayFmt.format(d)
}

const PAYMENT_LABELS: Record<string, string> = {
  cash: "Efectivo",
  card: "Tarjeta",
  qr: "QR / Wallet",
  transfer: "Transferencia",
}
const paymentLabel = (m: string | null) => (m ? PAYMENT_LABELS[m.toLowerCase()] || m : "-")

interface Row {
  id: string
  createdAt: string
  saleNumber: string
  product: string
  category: string
  quantity: number
  unitPrice: number
  subtotal: number
  payment: string | null
  sellerId: string | null
  seller: string
  branchId: string
  branch: string
  status: string
  hour: number
}

type SortKey = "date" | "product" | "quantity" | "subtotal"

const selectClass =
  "h-10 w-full min-w-0 rounded-md border border-cyan-500/10 bg-card px-3 text-sm text-foreground focus:border-cyan-500/40 focus:outline-none"

export default function HistorialVentasDatasetPage() {
  const supabase = useMemo(() => createClient(), [])

  const [dateFrom, setDateFrom] = useState(todayStr())
  const [dateTo, setDateTo] = useState(todayStr())
  const [search, setSearch] = useState("")
  const [payment, setPayment] = useState("")
  const [sellerFilter, setSellerFilter] = useState("")
  const [hourFrom, setHourFrom] = useState("")
  const [hourTo, setHourTo] = useState("")
  const [includeVoided, setIncludeVoided] = useState(false)

  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [truncated, setTruncated] = useState(false)
  const [multiBranch, setMultiBranch] = useState(false)
  const [staffOptions, setStaffOptions] = useState<Array<{ id: string; name: string }>>([])

  const [sortKey, setSortKey] = useState<SortKey>("date")
  const [sortDesc, setSortDesc] = useState(true)
  const [pageSize, setPageSize] = useState(50)
  const [page, setPage] = useState(1)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError(null)
      setTruncated(false)
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        let branches: Array<{ id: string; name: string }> = []
        const { data: owned } = await supabase.from("kioscos").select("id, name").eq("owner_id", user.id)
        if (owned && owned.length > 0) {
          branches = owned.map((k: any) => ({ id: k.id, name: k.name || "Sucursal" }))
        } else {
          const { data: emp } = await supabase
            .from("employees")
            .select("kiosko_id")
            .eq("user_id", user.id)
            .eq("status", "active")
            .maybeSingle()
          if (emp?.kiosko_id) branches = [{ id: emp.kiosko_id, name: "Mi sucursal" }]
        }
        if (branches.length === 0) {
          if (!cancelled) setRows([])
          return
        }
        const ids = branches.map((b) => b.id)
        const branchName = new Map(branches.map((b) => [b.id, b.name]))

        const { data: staff } = await supabase.from("employees").select("id, name").in("kiosko_id", ids)
        const staffName = new Map((staff || []).map((e: any) => [e.id, e.name || "Empleado"]))
        if (!cancelled) {
          setStaffOptions(
            (staff || [])
              .map((e: any) => ({ id: e.id as string, name: (e.name || "Empleado") as string }))
              .sort((a, b) => a.name.localeCompare(b.name)),
          )
        }

        const start = new Date(`${dateFrom}T00:00:00-03:00`)
        const end = new Date(new Date(`${dateTo}T00:00:00-03:00`).getTime() + 24 * 60 * 60 * 1000)

        const all: any[] = []
        let capped = false
        for (let i = 0; i < MAX_PAGES; i++) {
          const { data, error: err } = await supabase
            .from("sale_items")
            .select(
              "id, product_name, quantity, unit_price, subtotal, products(name, category), sales!inner(sale_number, created_at, payment_method, status, kiosko_id, employee_id)",
            )
            .in("sales.kiosko_id", ids)
            .gte("sales.created_at", start.toISOString())
            .lt("sales.created_at", end.toISOString())
            .order("id", { ascending: true })
            .range(i * PAGE, i * PAGE + PAGE - 1)
          if (err) throw err
          all.push(...(data || []))
          if (!data || data.length < PAGE) break
          if (i === MAX_PAGES - 1) capped = true
        }

        const mapped: Row[] = all.map((r) => {
          const s = r.sales
          const h = Number.parseInt(hourFmt.format(new Date(s.created_at)), 10)
          return {
            id: r.id,
            createdAt: s.created_at,
            saleNumber: s.sale_number,
            product: r.product_name || r.products?.name || "Producto",
            category: r.products?.category || "Sin categoría",
            quantity: Number(r.quantity) || 0,
            unitPrice: Number(r.unit_price) || 0,
            subtotal: Number(r.subtotal) || 0,
            payment: s.payment_method,
            sellerId: s.employee_id,
            seller: s.employee_id ? staffName.get(s.employee_id) || "Empleado" : "Dueño",
            branchId: s.kiosko_id,
            branch: branchName.get(s.kiosko_id) || "-",
            status: s.status || "completed",
            hour: h === 24 ? 0 : h,
          }
        })

        if (cancelled) return
        setRows(mapped)
        setTruncated(capped)
        setMultiBranch(branches.length > 1)
        setPage(1)
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "No se pudo cargar el historial")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [supabase, dateFrom, dateTo])

  // Vendedores: los empleados cargados en "Empleados" + el dueño (ventas sin empleado asignado).
  const sellers = useMemo(
    () => [["none", "Dueño"] as [string, string], ...staffOptions.map((m) => [m.id, m.name] as [string, string])],
    [staffOptions],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const hf = hourFrom === "" ? 0 : Number(hourFrom)
    const ht = hourTo === "" ? 24 : Number(hourTo)
    const list = rows.filter((r) => {
      if (!includeVoided && r.status === "cancelled") return false
      if (payment && (r.payment || "").toLowerCase() !== payment) return false
      if (sellerFilter && (r.sellerId || "none") !== sellerFilter) return false
      if (hf !== ht) {
        const ok = hf < ht ? r.hour >= hf && r.hour < ht : r.hour >= hf || r.hour < ht
        if (!ok) return false
      }
      if (q && !r.product.toLowerCase().includes(q) && !r.saleNumber.toLowerCase().includes(q)) return false
      return true
    })
    const dir = sortDesc ? -1 : 1
    list.sort((a, b) => {
      switch (sortKey) {
        case "product":
          return a.product.localeCompare(b.product) * dir
        case "quantity":
          return (a.quantity - b.quantity) * dir
        case "subtotal":
          return (a.subtotal - b.subtotal) * dir
        default:
          return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir
      }
    })
    return list
  }, [rows, search, payment, sellerFilter, hourFrom, hourTo, includeVoided, sortKey, sortDesc])

  useEffect(() => {
    setPage(1)
  }, [search, payment, sellerFilter, hourFrom, hourTo, includeVoided, pageSize])

  const totals = useMemo(() => {
    const valid = filtered.filter((r) => r.status !== "cancelled")
    return {
      lines: filtered.length,
      units: valid.reduce((a, r) => a + r.quantity, 0),
      amount: valid.reduce((a, r) => a + r.subtotal, 0),
    }
  }, [filtered])

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const current = Math.min(page, pages)
  const visible = filtered.slice((current - 1) * pageSize, current * pageSize)

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDesc(!sortDesc)
    else {
      setSortKey(key)
      setSortDesc(key === "date" || key === "subtotal" || key === "quantity")
    }
  }

  const exportCsv = () => {
    const header = ["Fecha", "Hora", "N° venta", "Producto", "Categoría", "Cantidad", "Precio unitario", "Subtotal", "Método de pago", "Vendedor"]
    if (multiBranch) header.push("Sucursal")
    header.push("Estado")
    const lines = filtered.map((r) => {
      const cols = [
        dateFmt.format(new Date(r.createdAt)),
        timeFmt.format(new Date(r.createdAt)),
        r.saleNumber,
        r.product,
        r.category,
        String(r.quantity),
        String(r.unitPrice),
        String(r.subtotal),
        paymentLabel(r.payment),
        r.seller,
      ]
      if (multiBranch) cols.push(r.branch)
      cols.push(r.status === "cancelled" ? "Anulada" : "Completada")
      return cols
    })
    const csv = [header, ...lines].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\r\n")
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `historial_ventas_${dateFrom}_${dateTo}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const today = todayStr()
  const chips = [
    { label: "Hoy", from: today, to: today },
    { label: "Ayer", from: shiftDay(today, -1), to: shiftDay(today, -1) },
    { label: "Últimos 7 días", from: shiftDay(today, -6), to: today },
    { label: "Este mes", from: `${today.slice(0, 7)}-01`, to: today },
  ]
  const activeChip = chips.find((c) => c.from === dateFrom && c.to === dateTo)?.label

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k ? sortDesc ? <ArrowDown className="ml-1 inline h-3 w-3" /> : <ArrowUp className="ml-1 inline h-3 w-3" /> : null

  const th = "whitespace-nowrap px-2.5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
  const thSort = `${th} cursor-pointer select-none hover:text-foreground`

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Historial de Ventas</h1>
          <p className="text-sm text-muted-foreground">Cada producto vendido, en formato de tabla: fecha, hora, método de pago y más</p>
        </div>
        <Button
          variant="outline"
          onClick={exportCsv}
          disabled={filtered.length === 0}
          className="gap-2 border-cyan-500/20 bg-transparent text-muted-foreground hover:text-foreground"
        >
          <Download className="h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      <div className="space-y-4 rounded-xl border border-cyan-500/10 bg-card p-4">
        <div className="flex flex-wrap items-center gap-2">
          {chips.map((c) => (
            <button
              key={c.label}
              onClick={() => {
                setDateFrom(c.from)
                setDateTo(c.to)
              }}
              className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                activeChip === c.label
                  ? "border-cyan-500/40 bg-cyan-500/20 text-cyan-300"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(200px,1fr))]">
          <label className="space-y-1 text-xs text-muted-foreground">
            Desde
            <Input
              type="date"
              value={dateFrom}
              max={dateTo}
              onChange={(e) => e.target.value && setDateFrom(e.target.value)}
              className="border-cyan-500/10 bg-input text-foreground"
            />
          </label>
          <label className="space-y-1 text-xs text-muted-foreground">
            Hasta
            <Input
              type="date"
              value={dateTo}
              min={dateFrom}
              max={today}
              onChange={(e) => e.target.value && setDateTo(e.target.value)}
              className="border-cyan-500/10 bg-input text-foreground"
            />
          </label>
          <label className="space-y-1 text-xs text-muted-foreground">
            Hora desde
            <select value={hourFrom} onChange={(e) => setHourFrom(e.target.value)} className={selectClass}>
              <option value="">00:00</option>
              {Array.from({ length: 23 }, (_, i) => i + 1).map((h) => (
                <option key={h} value={h}>
                  {String(h).padStart(2, "0")}:00
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-xs text-muted-foreground">
            Hora hasta
            <select value={hourTo} onChange={(e) => setHourTo(e.target.value)} className={selectClass}>
              <option value="">24:00</option>
              {Array.from({ length: 23 }, (_, i) => i + 1).map((h) => (
                <option key={h} value={h}>
                  {String(h).padStart(2, "0")}:00
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-xs text-muted-foreground">
            Método de pago
            <select value={payment} onChange={(e) => setPayment(e.target.value)} className={selectClass}>
              <option value="">Todos</option>
              <option value="cash">Efectivo</option>
              <option value="card">Tarjeta</option>
              <option value="qr">QR / Wallet</option>
              <option value="transfer">Transferencia</option>
            </select>
          </label>
          <label className="space-y-1 text-xs text-muted-foreground">
            Vendedor
            <select value={sellerFilter} onChange={(e) => setSellerFilter(e.target.value)} className={selectClass}>
              <option value="">Todos</option>
              {sellers.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="relative min-w-[240px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar producto o número de venta..."
              className="border-cyan-500/10 bg-input pl-10 text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input type="checkbox" checked={includeVoided} onChange={(e) => setIncludeVoided(e.target.checked)} />
            Incluir ventas anuladas
          </label>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-cyan-500/10 bg-card p-4">
          <p className="text-xs text-muted-foreground">Filas</p>
          <p className="text-xl font-bold text-foreground">{totals.lines}</p>
        </div>
        <div className="rounded-xl border border-cyan-500/10 bg-card p-4">
          <p className="text-xs text-muted-foreground">Unidades vendidas</p>
          <p className="text-xl font-bold text-foreground">{totals.units}</p>
        </div>
        <div className="rounded-xl border border-cyan-500/10 bg-card p-4">
          <p className="text-xs text-muted-foreground">Total vendido</p>
          <p className="text-xl font-bold text-green-400">{formatCurrency(totals.amount)}</p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          No se pudo cargar el historial: {error}
        </div>
      )}
      {truncated && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
          Hay demasiadas filas en este período y se muestran solo las primeras {MAX_PAGES * PAGE}. Acortá el rango de fechas.
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-cyan-500/10 bg-card">
        {loading ? (
          <div className="p-10 text-center text-muted-foreground">
            <RefreshCw className="mx-auto mb-2 h-6 w-6 animate-spin" />
            Cargando ventas...
          </div>
        ) : visible.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">No hay ventas con estos filtros</div>
        ) : (
          <>
            {/* Pantallas medianas y chicas: una tarjeta por producto vendido */}
            <div className="divide-y divide-cyan-500/10 xl:hidden">
              {visible.map((r) => {
                const voided = r.status === "cancelled"
                return (
                  <div key={r.id} className="space-y-2 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className={`font-medium break-words ${voided ? "text-muted-foreground line-through" : "text-foreground"}`}>{r.product}</p>
                        <p className="text-xs text-muted-foreground">{r.category}</p>
                      </div>
                      <p className={`shrink-0 font-semibold ${voided ? "text-muted-foreground line-through" : "text-foreground"}`}>
                        {formatCurrency(r.subtotal)}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-4">
                      <div>
                        <span className="text-muted-foreground">Fecha </span>
                        <span className="text-gray-200">{dateFmt.format(new Date(r.createdAt))}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Hora </span>
                        <span className="font-mono text-gray-200">{timeFmt.format(new Date(r.createdAt))}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Cant. </span>
                        <span className="text-gray-200">
                          {r.quantity} × {formatCurrency(r.unitPrice)}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Pago </span>
                        <span className="text-gray-200">{paymentLabel(r.payment)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Vendedor </span>
                        <span className="text-gray-200">{r.seller}</span>
                      </div>
                      {multiBranch && (
                        <div>
                          <span className="text-muted-foreground">Sucursal </span>
                          <span className="text-gray-200">{r.branch}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-muted-foreground">Venta </span>
                        <span className="font-mono text-cyan-400" title={r.saleNumber}>
                          #{r.saleNumber.slice(-6).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <span
                          className={`rounded-full px-2 py-0.5 font-medium ${
                            voided ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"
                          }`}
                        >
                          {voided ? "Anulada" : "Completada"}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Computadoras: tabla que se ajusta al ancho, sin scroll lateral */}
            <table className="hidden w-full table-fixed xl:table">
              <thead>
                <tr className="border-b border-cyan-500/10">
                  <th className={`${thSort} w-[118px]`} onClick={() => toggleSort("date")}>
                    Fecha / Hora
                    <SortIcon k="date" />
                  </th>
                  <th className={thSort} onClick={() => toggleSort("product")}>
                    Producto
                    <SortIcon k="product" />
                  </th>
                  <th className={`${thSort} w-[64px] text-right`} onClick={() => toggleSort("quantity")}>
                    Cant.
                    <SortIcon k="quantity" />
                  </th>
                  <th className={`${th} hidden w-[104px] text-right 2xl:table-cell`}>Precio unit.</th>
                  <th className={`${thSort} w-[110px] text-right`} onClick={() => toggleSort("subtotal")}>
                    Subtotal
                    <SortIcon k="subtotal" />
                  </th>
                  <th className={`${th} w-[120px]`}>Pago</th>
                  <th className={`${th} w-[130px]`}>Vendedor</th>
                  {multiBranch && <th className={`${th} w-[120px]`}>Sucursal</th>}
                  <th className={`${th} w-[112px]`}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((r) => {
                  const voided = r.status === "cancelled"
                  const muted = voided ? "text-muted-foreground line-through" : "text-foreground"
                  return (
                    <tr key={r.id} className="border-b border-cyan-500/5 align-top text-sm transition-colors hover:bg-accent">
                      <td className="px-2.5 py-3">
                        <p className={`whitespace-nowrap ${muted}`}>{dateFmt.format(new Date(r.createdAt))}</p>
                        <p className="font-mono text-xs text-muted-foreground">{timeFmt.format(new Date(r.createdAt))}</p>
                      </td>
                      <td className="px-2.5 py-3">
                        <p className={`break-words ${muted}`}>{r.product}</p>
                        <p className="text-xs text-muted-foreground">
                          {r.category} ·{" "}
                          <span className="font-mono text-cyan-400" title={r.saleNumber}>
                            #{r.saleNumber.slice(-6).toUpperCase()}
                          </span>
                        </p>
                      </td>
                      <td className={`px-2.5 py-3 text-right ${muted}`}>{r.quantity}</td>
                      <td className="hidden whitespace-nowrap px-2.5 py-3 text-right text-muted-foreground 2xl:table-cell">
                        {formatCurrency(r.unitPrice)}
                      </td>
                      <td className={`whitespace-nowrap px-2.5 py-3 text-right font-medium ${muted}`}>{formatCurrency(r.subtotal)}</td>
                      <td className="px-2.5 py-3 text-muted-foreground">{paymentLabel(r.payment)}</td>
                      <td className="px-2.5 py-3 text-muted-foreground break-words">{r.seller}</td>
                      {multiBranch && <td className="px-2.5 py-3 text-muted-foreground break-words">{r.branch}</td>}
                      <td className="px-2.5 py-3">
                        <span
                          className={`whitespace-nowrap rounded-full px-2 py-1 text-xs font-medium ${
                            voided ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"
                          }`}
                        >
                          {voided ? "Anulada" : "Completada"}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
        <label className="flex items-center gap-2">
          Filas por página
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="h-9 rounded-md border border-cyan-500/10 bg-card px-2 text-foreground"
          >
            {[25, 50, 100, 200].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            disabled={current <= 1}
            onClick={() => setPage(current - 1)}
            className="h-9 w-9 border-cyan-500/20 bg-transparent"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span>
            Página {current} de {pages}
          </span>
          <Button
            variant="outline"
            size="icon"
            disabled={current >= pages}
            onClick={() => setPage(current + 1)}
            className="h-9 w-9 border-cyan-500/20 bg-transparent"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
