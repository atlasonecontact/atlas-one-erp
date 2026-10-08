"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Search, Download, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react"
import { GlobalFiltersComponent, type GlobalFilters } from "@/components/dashboard/global-filters"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils/currency"
import Link from "next/link"
import { subDays } from "date-fns"
import {
  useTickets,
  applyFilters,
  categoryOptions,
  productsWithoutCost,
  ymdOf,
  paymentLabel,
  SHIFT_LABEL,
  TZ,
} from "@/lib/analytics/tickets"

export const dynamic = "force-dynamic"

const dateFmt = new Intl.DateTimeFormat("es-AR", { timeZone: TZ, day: "2-digit", month: "2-digit", year: "numeric" })
const timeFmt = new Intl.DateTimeFormat("es-AR", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false })

const paymentColors: Record<string, string> = {
  cash: "bg-green-500/20 text-green-400 border-green-500/30",
  card: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  qr: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  transfer: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
}

const shortId = (number: string) => `#${number.slice(-6).toUpperCase()}`

export default function TicketsTablePage() {
  const router = useRouter()
  const [filters, setFilters] = useState<GlobalFilters>({
    dateRange: { from: subDays(new Date(), 29), to: new Date() },
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [invoiceFilter, setInvoiceFilter] = useState<"" | "yes" | "no">("")
  const itemsPerPage = 20

  const from = ymdOf(filters.dateRange.from)
  const to = ymdOf(filters.dateRange.to)
  const { tickets, branches, sellers, loading, error } = useTickets(from, to, true)
  const categories = useMemo(() => categoryOptions(tickets), [tickets])

  const filteredTickets = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    return applyFilters(tickets, filters)
      .filter((t) => !q || t.number.toLowerCase().includes(q) || shortId(t.number).toLowerCase().includes(q))
      .filter((t) => (invoiceFilter === "yes" ? !!t.invoice : invoiceFilter === "no" ? !t.invoice : true))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [tickets, filters, searchTerm, invoiceFilter])

  useEffect(() => {
    setCurrentPage(1)
  }, [filters, searchTerm, invoiceFilter])

  const noCost = useMemo(() => productsWithoutCost(filteredTickets), [filteredTickets])
  const invoicedCount = filteredTickets.filter((t) => t.invoice).length

  const totalPages = Math.max(1, Math.ceil(filteredTickets.length / itemsPerPage))
  const page = Math.min(currentPage, totalPages)
  const paginatedTickets = filteredTickets.slice((page - 1) * itemsPerPage, page * itemsPerPage)
  const marginOf = (total: number, cost: number) => (cost > 0 && total > 0 ? ((total - cost) / total) * 100 : null)

  const handleExport = () => {
    const header = ["ID Ticket", "Fecha", "Hora", "Sucursal", "Turno", "Vendedor", "Total", "Unidades", "Método de pago", "Factura", "Margen %"]
    const rows = filteredTickets.map((t) => {
      const m = marginOf(t.total, t.cost)
      return [
        t.number,
        dateFmt.format(new Date(t.createdAt)),
        timeFmt.format(new Date(t.createdAt)),
        t.branch,
        SHIFT_LABEL[t.shift],
        t.seller,
        String(t.total),
        String(t.units),
        paymentLabel(t.payment),
        t.invoice ? `${t.invoice.type} ${t.invoice.number}` : "Sin factura",
        m === null ? "" : m.toFixed(1),
      ]
    })
    const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\r\n")
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `tickets_${from}_${to}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Tickets de Venta</h1>
        <p className="text-muted-foreground">Tabla detallada de todas las transacciones reales</p>
      </div>

      <div className="mb-8">
        <GlobalFiltersComponent
          filters={filters}
          onChange={setFilters}
          branches={branches}
          sellers={sellers}
          categories={categories}
          showHourFilter
          allowRange
        />
      </div>

      <Card className="bg-card border-cyan-500/20 p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="relative flex-1 max-w-md w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar por número de ticket..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-popover border-border focus:border-cyan-500"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
          <select
            value={invoiceFilter}
            onChange={(e) => setInvoiceFilter(e.target.value as "" | "yes" | "no")}
            className="h-9 rounded-md border border-border bg-popover px-3 text-sm text-foreground"
          >
            <option value="">Facturación: todos</option>
            <option value="yes">Solo facturados</option>
            <option value="no">Sin factura</option>
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={filteredTickets.length === 0}
            className="bg-popover border-border hover:bg-accent hover:border-cyan-500/50"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
          </div>
        </div>
        {!loading && filteredTickets.length > 0 && (
          <p className="mt-3 text-xs text-muted-foreground">
            {invoicedCount} de {filteredTickets.length} tickets tienen factura electrónica.
          </p>
        )}
      </Card>

      {!loading && noCost.length > 0 && (
        <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
          {noCost.length === 1 ? "1 producto vendido no tiene" : `${noCost.length} productos vendidos no tienen`} costo cargado, por eso
          su margen no se calcula: {noCost.slice(0, 4).join(", ")}
          {noCost.length > 4 ? "…" : ""}.{" "}
          <Link href="/dashboard/productos" className="underline hover:text-amber-200">
            Cargar costos en Productos
          </Link>
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          No se pudieron cargar las ventas: {error}
        </div>
      )}

      <Card className="bg-card border-cyan-500/20 overflow-hidden">
        {/* Mobile: cards */}
        <div className="divide-y divide-border md:hidden">
          {loading ? (
            <div className="p-10 text-center text-muted-foreground">
              <RefreshCw className="mx-auto mb-2 h-6 w-6 animate-spin" />
              Cargando tickets...
            </div>
          ) : paginatedTickets.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground">No hay tickets con estos filtros</div>
          ) : (
            paginatedTickets.map((ticket) => {
              const margin = marginOf(ticket.total, ticket.cost)
              return (
                <div
                  key={ticket.id}
                  onClick={() => router.push(`/dashboard/estadisticas/ventas/tickets/${ticket.id}`)}
                  className="cursor-pointer p-4 transition-colors hover:bg-accent active:bg-accent"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-mono text-foreground" title={ticket.number}>
                        {shortId(ticket.number)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {dateFmt.format(new Date(ticket.createdAt))} · {timeFmt.format(new Date(ticket.createdAt))}
                      </p>
                    </div>
                    <span className="font-semibold text-foreground">{formatCurrency(ticket.total)}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge className="bg-muted text-muted-foreground border-border">{ticket.units} unid.</Badge>
                    <Badge className={paymentColors[(ticket.payment || "").toLowerCase()] || "bg-muted text-muted-foreground border-border"}>
                      {paymentLabel(ticket.payment)}
                    </Badge>
                    {ticket.invoice ? (
                      <Badge
                        className={
                          ticket.invoice.status === "emitida"
                            ? "bg-green-500/20 text-green-400 border-green-500/30"
                            : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                        }
                      >
                        {ticket.invoice.type} {ticket.invoice.number}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">Sin factura</span>
                    )}
                    {margin !== null && (
                      <span className={`text-xs ${margin >= 30 ? "text-green-400" : "text-yellow-400"}`}>
                        {margin.toFixed(1)}% margen
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {ticket.branch} · {SHIFT_LABEL[ticket.shift]} · {ticket.seller}
                  </p>
                </div>
              )
            })
          )}
        </div>

        {/* Desktop: tabla */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[1000px]">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="text-left p-4 text-cyan-400 font-semibold">ID Ticket</th>
                <th className="text-left p-4 text-cyan-400 font-semibold">Fecha</th>
                <th className="text-left p-4 text-cyan-400 font-semibold">Hora</th>
                <th className="text-left p-4 text-cyan-400 font-semibold">Sucursal</th>
                <th className="text-left p-4 text-cyan-400 font-semibold">Turno</th>
                <th className="text-left p-4 text-cyan-400 font-semibold">Vendedor</th>
                <th className="text-right p-4 text-cyan-400 font-semibold">Total</th>
                <th className="text-center p-4 text-cyan-400 font-semibold">Unidades</th>
                <th className="text-left p-4 text-cyan-400 font-semibold">Método Pago</th>
                <th className="text-left p-4 text-cyan-400 font-semibold">Factura</th>
                <th className="text-right p-4 text-cyan-400 font-semibold">Margen %</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={11} className="p-10 text-center text-muted-foreground">
                    <RefreshCw className="mx-auto mb-2 h-6 w-6 animate-spin" />
                    Cargando tickets...
                  </td>
                </tr>
              ) : paginatedTickets.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-10 text-center text-muted-foreground">
                    No hay tickets con estos filtros
                  </td>
                </tr>
              ) : (
                paginatedTickets.map((ticket) => {
                  const margin = marginOf(ticket.total, ticket.cost)
                  return (
                    <tr
                      key={ticket.id}
                      onClick={() => router.push(`/dashboard/estadisticas/ventas/tickets/${ticket.id}`)}
                      className="border-b border-border hover:bg-accent cursor-pointer transition-colors"
                    >
                      <td className="p-4 text-foreground font-mono" title={ticket.number}>
                        {shortId(ticket.number)}
                      </td>
                      <td className="p-4 text-muted-foreground">{dateFmt.format(new Date(ticket.createdAt))}</td>
                      <td className="p-4 text-muted-foreground">{timeFmt.format(new Date(ticket.createdAt))}</td>
                      <td className="p-4 text-muted-foreground">{ticket.branch}</td>
                      <td className="p-4 text-muted-foreground" title={ticket.shiftFromRegister ? "Según la caja" : "Según la hora"}>{SHIFT_LABEL[ticket.shift]}</td>
                      <td className="p-4 text-muted-foreground">{ticket.seller}</td>
                      <td className="p-4 text-right text-foreground font-semibold">{formatCurrency(ticket.total)}</td>
                      <td className="p-4 text-center">
                        <Badge className="bg-muted text-muted-foreground border-border">{ticket.units}</Badge>
                      </td>
                      <td className="p-4">
                        <Badge className={paymentColors[(ticket.payment || "").toLowerCase()] || "bg-muted text-muted-foreground border-border"}>
                          {paymentLabel(ticket.payment)}
                        </Badge>
                      </td>
                      <td className="p-4">
                        {ticket.invoice ? (
                          <Badge
                            className={
                              ticket.invoice.status === "emitida"
                                ? "bg-green-500/20 text-green-400 border-green-500/30"
                                : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                            }
                            title={ticket.invoice.cae ? `CAE ${ticket.invoice.cae}` : undefined}
                          >
                            {ticket.invoice.type} {ticket.invoice.number}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">Sin factura</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
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

        <div className="flex items-center justify-between p-4 border-t border-border">
          <div className="text-sm text-muted-foreground">
            {filteredTickets.length === 0
              ? "0 tickets"
              : `Mostrando ${(page - 1) * itemsPerPage + 1} a ${Math.min(page * itemsPerPage, filteredTickets.length)} de ${filteredTickets.length} tickets`}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="bg-popover border-border hover:bg-accent hover:border-cyan-500/50"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-foreground font-semibold">
              Página {page} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="bg-popover border-border hover:bg-accent hover:border-cyan-500/50"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
