"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Download, Printer, Calendar, Clock, User, Building2, CreditCard, RefreshCw } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { createClient } from "@/lib/supabase/client"
import { formatCurrency } from "@/lib/utils/currency"
import { useToast } from "@/components/ui/toast-provider"
import { paymentLabel, shiftOf, shiftFromLabel, SHIFT_LABEL, OWNER_LABEL, TZ } from "@/lib/analytics/tickets"

export const dynamic = "force-dynamic"

const dateFmt = new Intl.DateTimeFormat("es-AR", { timeZone: TZ, day: "2-digit", month: "2-digit", year: "numeric" })
const timeFmt = new Intl.DateTimeFormat("es-AR", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false })
const hourFmt = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", hour12: false })

interface Line {
  name: string
  category: string
  quantity: number
  unitPrice: number
  subtotal: number
  cost: number
}

interface TicketDetail {
  id: string
  number: string
  status: string
  createdAt: string
  branch: string
  seller: string
  sellerId: string | null
  payment: string | null
  total: number
  lines: Line[]
  kioskoId: string
  registerShift: string | null
  invoice: { type: string; number: string; cae: string | null; status: string } | null
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default function TicketDetailPage() {
  const router = useRouter()
  const params = useParams()
  const ticketId = decodeURIComponent(params.id as string)
  const supabase = useMemo(() => createClient(), [])

  const [ticket, setTicket] = useState<TicketDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOwner, setIsOwner] = useState(false)
  const [staff, setStaff] = useState<Array<{ id: string; name: string }>>([])
  const [savingSeller, setSavingSeller] = useState(false)
  const toast = useToast()

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        if (!UUID.test(ticketId)) {
          if (!cancelled) setTicket(null)
          return
        }
        const { data: sale, error: saleError } = await supabase
          .from("sales")
          .select("id, sale_number, kiosko_id, employee_id, total_amount, payment_method, status, created_at, cash_registers(shift)")
          .eq("id", ticketId)
          .maybeSingle()
        if (saleError) throw saleError
        if (!sale) {
          if (!cancelled) setTicket(null)
          return
        }

        const {
          data: { user },
        } = await supabase.auth.getUser()
        const [{ data: items, error: itemsError }, { data: branch }, { data: staffRow }, { data: allStaff }, { data: inv }, { data: ownerRow }] = await Promise.all([
          supabase
            .from("sale_items")
            .select("product_name, quantity, unit_price, cost_price, subtotal, products(name, category, cost)")
            .eq("sale_id", sale.id),
          supabase.from("kioscos").select("name").eq("id", sale.kiosko_id).maybeSingle(),
          sale.employee_id
            ? supabase.from("employees").select("name").eq("id", sale.employee_id).maybeSingle()
            : Promise.resolve({ data: null }),
          supabase.from("employees").select("id, name").eq("kiosko_id", sale.kiosko_id).order("name"),
          supabase
            .from("invoices")
            .select("tipo_comprobante, punto_venta, numero_comprobante, cae, status")
            .eq("sale_id", sale.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
          user
            ? supabase.from("kioscos").select("id").eq("id", sale.kiosko_id).eq("owner_id", user.id).maybeSingle()
            : Promise.resolve({ data: null }),
        ])
        if (itemsError) throw itemsError

        const lines: Line[] = (items || []).map((r: any) => {
          const qty = Number(r.quantity) || 0
          return {
            name: r.product_name || r.products?.name || "Producto",
            category: r.products?.category || "Sin categoría",
            quantity: qty,
            unitPrice: Number(r.unit_price) || 0,
            subtotal: Number(r.subtotal) || 0,
            cost: (Number(r.cost_price ?? r.products?.cost ?? 0) || 0) * qty,
          }
        })

        if (cancelled) return
        setTicket({
          id: sale.id,
          number: sale.sale_number,
          status: sale.status || "completed",
          createdAt: sale.created_at,
          branch: branch?.name || "-",
          seller: sale.employee_id ? (staffRow as any)?.name || "Empleado" : OWNER_LABEL,
          sellerId: sale.employee_id,
          payment: sale.payment_method,
          total: Number(sale.total_amount) || 0,
          lines,
          kioskoId: sale.kiosko_id,
          registerShift: (Array.isArray((sale as any).cash_registers) ? (sale as any).cash_registers[0]?.shift : (sale as any).cash_registers?.shift) ?? null,
          invoice: inv
            ? {
                type: ({ 1: "Factura A", 6: "Factura B", 11: "Factura C" } as Record<number, string>)[Number((inv as any).tipo_comprobante)] || "Factura",
                number: `${String((inv as any).punto_venta ?? 0).padStart(4, "0")}-${String((inv as any).numero_comprobante ?? 0).padStart(8, "0")}`,
                cae: (inv as any).cae ?? null,
                status: (inv as any).status || "emitida",
              }
            : null,
        })
        setIsOwner(!!ownerRow)
        setStaff((allStaff || []).map((e: any) => ({ id: e.id, name: e.name || "Empleado" })))
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "No se pudo cargar el ticket")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [supabase, ticketId])

  const back = (
    <Button variant="ghost" onClick={() => router.back()} className="text-muted-foreground hover:text-foreground hover:bg-accent">
      <ArrowLeft className="w-4 h-4 mr-2" />
      Volver a Tickets
    </Button>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="flex h-64 items-center justify-center">
          <RefreshCw className="w-8 h-8 text-cyan-500 animate-spin" />
        </div>
      </div>
    )
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="mb-8">{back}</div>
        <Card className="bg-card border-cyan-500/20 p-8 max-w-xl mx-auto text-center">
          <p className="text-foreground font-semibold mb-2">{error ? "No se pudo cargar el ticket" : "Ticket no encontrado"}</p>
          <p className="text-sm text-muted-foreground">{error || "Puede que haya sido eliminado o que no tengas acceso."}</p>
        </Card>
      </div>
    )
  }

  const totalQuantity = ticket.lines.reduce((sum, p) => sum + p.quantity, 0)
  const subtotal = ticket.lines.reduce((sum, p) => sum + p.subtotal, 0)
  const totalCost = ticket.lines.reduce((sum, p) => sum + p.cost, 0)
  const hasCost = totalCost > 0
  const totalMargin = hasCost && subtotal > 0 ? ((subtotal - totalCost) / subtotal) * 100 : null
  const hour = Number.parseInt(hourFmt.format(new Date(ticket.createdAt)), 10) % 24
  const voided = ticket.status === "cancelled"

  const changeSeller = async (value: string) => {
    if (!ticket) return
    setSavingSeller(true)
    const { error: rpcError } = await supabase.rpc("set_sale_seller", { p_sale: ticket.id, p_employee: value || null })
    setSavingSeller(false)
    if (rpcError) {
      toast.error("No se pudo cambiar el vendedor", rpcError.message)
      return
    }
    const name = value ? staff.find((m) => m.id === value)?.name || "Empleado" : OWNER_LABEL
    setTicket({ ...ticket, sellerId: value || null, seller: name })
    toast.success("Vendedor actualizado", name)
  }

  const handleDownload = () => {
    const rows = [
      ["Producto", "Categoría", "Cantidad", "Precio unitario", "Subtotal"],
      ...ticket.lines.map((l) => [l.name, l.category, String(l.quantity), String(l.unitPrice), String(l.subtotal)]),
    ]
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\r\n")
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `ticket_${ticket.number}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="flex items-center justify-between mb-8 print:hidden">
        {back}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="bg-popover border-border hover:bg-accent hover:border-cyan-500/50"
          >
            <Printer className="w-4 h-4 mr-2" />
            Imprimir
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="bg-popover border-border hover:bg-accent hover:border-cyan-500/50"
          >
            <Download className="w-4 h-4 mr-2" />
            Descargar CSV
          </Button>
        </div>
      </div>

      <Card className="bg-card border-cyan-500/20 p-4 md:p-8 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Detalle de Venta</h1>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-2xl font-mono text-cyan-400 break-all">{ticket.number}</span>
            {voided ? (
              <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Anulada</Badge>
            ) : (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Completado</Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-muted p-4 rounded-lg">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">Fecha</span>
            </div>
            <div className="text-foreground font-semibold">{dateFmt.format(new Date(ticket.createdAt))}</div>
          </div>
          <div className="bg-muted p-4 rounded-lg">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Clock className="w-4 h-4" />
              <span className="text-sm">Hora</span>
            </div>
            <div className="text-foreground font-semibold">{timeFmt.format(new Date(ticket.createdAt))}</div>
          </div>
          <div className="bg-muted p-4 rounded-lg">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Building2 className="w-4 h-4" />
              <span className="text-sm">Sucursal</span>
            </div>
            <div className="text-foreground font-semibold">{ticket.branch}</div>
          </div>
          <div className="bg-muted p-4 rounded-lg">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Clock className="w-4 h-4" />
              <span className="text-sm">Turno</span>
            </div>
            <div className="text-foreground font-semibold">
              {SHIFT_LABEL[shiftFromLabel(ticket.registerShift) ?? shiftOf(hour)]}
            </div>
            <div className="text-xs text-muted-foreground">{shiftFromLabel(ticket.registerShift) ? "Según la caja" : "Según la hora"}</div>
          </div>
          <div className="bg-muted p-4 rounded-lg">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <User className="w-4 h-4" />
              <span className="text-sm">Vendedor</span>
            </div>
            {isOwner ? (
              <select
                value={ticket.sellerId ?? ""}
                disabled={savingSeller}
                onChange={(e) => changeSeller(e.target.value)}
                className="h-9 w-full rounded-md border border-border bg-popover px-2 text-sm font-semibold text-foreground"
              >
                <option value="">{OWNER_LABEL}</option>
                {staff.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="text-foreground font-semibold">{ticket.seller}</div>
            )}
          </div>
          <div className="bg-muted p-4 rounded-lg">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <CreditCard className="w-4 h-4" />
              <span className="text-sm">Método de Pago</span>
            </div>
            <div className="text-foreground font-semibold">{paymentLabel(ticket.payment)}</div>
          </div>
        </div>

        <Separator className="my-8 bg-border" />

        <div className="mb-8">
          <h2 className="text-xl font-bold text-foreground mb-4">Productos</h2>
          {/* Mobile: cards */}
          <div className="space-y-2 md:hidden">
            {ticket.lines.length === 0 ? (
              <p className="p-6 text-center text-muted-foreground">Esta venta no tiene productos registrados.</p>
            ) : (
              ticket.lines.map((line, i) => {
                const margin = line.cost > 0 && line.subtotal > 0 ? ((line.subtotal - line.cost) / line.subtotal) * 100 : null
                return (
                  <div key={i} className="rounded-lg border border-border bg-muted p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-foreground">{line.name}</p>
                        <p className="text-xs text-muted-foreground">{line.category}</p>
                      </div>
                      <p className="font-semibold text-foreground">{formatCurrency(line.subtotal)}</p>
                    </div>
                    <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                      <Badge className="bg-muted text-muted-foreground border-border">{line.quantity} unid.</Badge>
                      <span>{formatCurrency(line.unitPrice)} c/u</span>
                      {margin !== null && (
                        <span className={margin >= 30 ? "text-green-400" : "text-yellow-400"}>{margin.toFixed(1)}% margen</span>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Desktop: tabla */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[560px]">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="text-left p-3 text-cyan-400 font-semibold">Producto</th>
                  <th className="text-left p-3 text-cyan-400 font-semibold">Categoría</th>
                  <th className="text-center p-3 text-cyan-400 font-semibold">Cantidad</th>
                  <th className="text-right p-3 text-cyan-400 font-semibold">Precio Unit.</th>
                  <th className="text-right p-3 text-cyan-400 font-semibold">Subtotal</th>
                  <th className="text-right p-3 text-cyan-400 font-semibold">Margen %</th>
                </tr>
              </thead>
              <tbody>
                {ticket.lines.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-muted-foreground">
                      Esta venta no tiene productos registrados.
                    </td>
                  </tr>
                ) : (
                  ticket.lines.map((line, i) => {
                    const margin = line.cost > 0 && line.subtotal > 0 ? ((line.subtotal - line.cost) / line.subtotal) * 100 : null
                    return (
                      <tr key={i} className="border-b border-border">
                        <td className="p-3 text-foreground font-medium">{line.name}</td>
                        <td className="p-3 text-muted-foreground">{line.category}</td>
                        <td className="p-3 text-center">
                          <Badge className="bg-muted text-muted-foreground border-border">{line.quantity}</Badge>
                        </td>
                        <td className="p-3 text-right text-muted-foreground">{formatCurrency(line.unitPrice)}</td>
                        <td className="p-3 text-right text-foreground font-semibold">{formatCurrency(line.subtotal)}</td>
                        <td className="p-3 text-right">
                          {margin === null ? (
                            <span className="text-muted-foreground">-</span>
                          ) : (
                            <span className={margin >= 30 ? "text-green-400" : "text-yellow-400"}>{margin.toFixed(1)}%</span>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <Separator className="my-8 bg-border" />

        <div className="mb-8">
          <h2 className="text-xl font-bold text-foreground mb-4">Facturación</h2>
          {ticket.invoice ? (
            <div className="bg-muted p-4 rounded-lg flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-foreground font-semibold">
                  {ticket.invoice.type} {ticket.invoice.number}
                </div>
                {ticket.invoice.cae && <div className="text-xs text-muted-foreground font-mono">CAE {ticket.invoice.cae}</div>}
              </div>
              <Badge
                className={
                  ticket.invoice.status === "emitida"
                    ? "bg-green-500/20 text-green-400 border-green-500/30"
                    : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                }
              >
                {ticket.invoice.status === "emitida" ? "Emitida" : ticket.invoice.status}
              </Badge>
            </div>
          ) : (
            <div className="bg-muted p-4 rounded-lg text-sm text-muted-foreground">
              Esta venta no tiene factura electrónica emitida.
            </div>
          )}
        </div>

        <Separator className="my-8 bg-border" />

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground mb-4">Resumen</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-muted p-4 rounded-lg">
              <div className="text-muted-foreground text-sm mb-1">Total Unidades</div>
              <div className="text-2xl font-bold text-foreground">{totalQuantity}</div>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <div className="text-muted-foreground text-sm mb-1">Subtotal</div>
              <div className="text-2xl font-bold text-foreground">{formatCurrency(subtotal)}</div>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <div className="text-muted-foreground text-sm mb-1">Costo Total</div>
              <div className="text-2xl font-bold text-muted-foreground">{hasCost ? formatCurrency(totalCost) : "-"}</div>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <div className="text-muted-foreground text-sm mb-1">Margen Total</div>
              <div className="text-2xl font-bold text-green-400">{totalMargin === null ? "-" : `${totalMargin.toFixed(1)}%`}</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-cyan-500/10 to-cyan-600/10 p-6 rounded-lg border border-cyan-500/30 mt-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-muted-foreground text-sm mb-1">Total de la Venta</div>
                <div className="text-4xl font-bold text-foreground">{formatCurrency(ticket.total)}</div>
              </div>
              <div className="text-right">
                <div className="text-muted-foreground text-sm mb-1">Ganancia Neta</div>
                <div className="text-3xl font-bold text-green-400">{hasCost ? formatCurrency(subtotal - totalCost) : "-"}</div>
              </div>
            </div>
            {!hasCost && (
              <p className="mt-3 text-xs text-muted-foreground">
                Los productos de esta venta no tienen costo cargado, por eso no se calcula el margen.
              </p>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
