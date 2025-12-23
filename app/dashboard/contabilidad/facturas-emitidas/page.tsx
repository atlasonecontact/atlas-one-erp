"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Filter, Download, Eye, FileText, Calendar, DollarSign, AlertTriangle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

type InvoiceRow = {
  id: string
  kiosko_id: string
  tipo_comprobante: number
  punto_venta: number
  numero_comprobante: number
  fecha_emision: string | null
  razon_social_receptor: string | null
  numero_documento_receptor: string | null
  importe_total: number
  status: string
  cae?: string | null
  created_at?: string
}

const typeLabels: Record<number, string> = {
  1: "Factura A",
  6: "Factura B",
  11: "Factura C",
}

const pad = (value: number | string | null | undefined, size: number) => String(value ?? "").padStart(size, "0")

const getStatusBadge = (status: string) => {
  switch (status) {
    case "emitida":
      return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Emitida</Badge>
    case "anulada":
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Anulada</Badge>
    case "error":
      return <Badge className="bg-red-500/15 text-red-300 border-red-500/30">Error</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

const getTypeBadge = (type: number) => {
  const label = typeLabels[type] || `Tipo ${type}`
  if (type === 1) return <Badge variant="outline" className="border-blue-500/30 text-blue-400">{label}</Badge>
  if (type === 11) return <Badge variant="outline" className="border-purple-500/30 text-purple-400">{label}</Badge>
  return <Badge variant="outline" className="border-emerald-500/30 text-emerald-400">{label}</Badge>
}

export default function FacturasEmitidasPage() {
  const supabase = createClient()
  const [searchQuery, setSearchQuery] = useState("")
  const [invoices, setInvoices] = useState<InvoiceRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>("")
  const [arcaWarning, setArcaWarning] = useState<string>("")

  useEffect(() => {
    loadInvoices()
  }, [])

  const loadInvoices = async () => {
    setIsLoading(true)
    setError("")
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      let kioskoIds: string[] = []

      const { data: employee } = await supabase
        .from("employees")
        .select("kiosko_id")
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle()

      if (employee?.kiosko_id) {
        kioskoIds = [employee.kiosko_id]
      } else {
        const { data: kioskos } = await supabase.from("kioscos").select("id").eq("owner_id", user.id)
        kioskoIds = kioskos?.map((k) => k.id) || []
      }

      if (kioskoIds.length === 0) {
        setInvoices([])
        return
      }

      // Check ARCA setup to surface UI warning
      const { data: arcaConfigs } = await supabase
        .from("integration_configs")
        .select("kiosko_id, arca_enabled")
        .in("kiosko_id", kioskoIds)

      if (!arcaConfigs || arcaConfigs.length === 0) {
        setArcaWarning("Activa ARCA en Integraciones para emitir facturas electrónicas.")
      } else if (arcaConfigs.some((c) => !c.arca_enabled)) {
        setArcaWarning("Algunas sucursales tienen ARCA desactivado: emisión bloqueada en esos puntos de venta.")
      } else {
        setArcaWarning("")
      }

      const { data, error: invoicesError } = await supabase
        .from("invoices")
        .select(
          "id, kiosko_id, tipo_comprobante, punto_venta, numero_comprobante, fecha_emision, razon_social_receptor, numero_documento_receptor, importe_total, status, cae, created_at",
        )
        .in("kiosko_id", kioskoIds)
        .order("created_at", { ascending: false })
        .limit(200)

      if (invoicesError) throw invoicesError

      setInvoices((data as InvoiceRow[]) || [])
    } catch (err: any) {
      console.error("[Facturas] Error cargando facturas:", err)
      setError(err?.message || "No pudimos cargar las facturas")
    } finally {
      setIsLoading(false)
    }
  }

  const filtered = useMemo(() => {
    const query = searchQuery.toLowerCase()
    return invoices.filter((inv) => {
      const numero = `${pad(inv.punto_venta, 4)}-${pad(inv.numero_comprobante, 8)}`
      return (
        numero.toLowerCase().includes(query) ||
        (inv.razon_social_receptor || "").toLowerCase().includes(query) ||
        (inv.numero_documento_receptor || "").toLowerCase().includes(query) ||
        (typeLabels[inv.tipo_comprobante] || "").toLowerCase().includes(query)
      )
    })
  }, [searchQuery, invoices])

  const totalEmitido = filtered.filter((i) => i.status === "emitida").reduce((acc, i) => acc + Number(i.importe_total || 0), 0)
  const totalFacturas = filtered.filter((i) => i.status === "emitida").length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Facturas Emitidas</h1>
          <p className="text-gray-400">Historial de comprobantes fiscales guardados en la base</p>
        </div>
        <div className="flex items-center gap-3">
          <Card className="bg-[#0a0f1a] border-gray-800">
            <CardContent className="p-4 flex items-center gap-3">
              <FileText className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-xs text-gray-400">Total Facturas</p>
                <p className="text-lg font-bold text-white">{totalFacturas}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#0a0f1a] border-gray-800">
            <CardContent className="p-4 flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              <div>
                <p className="text-xs text-gray-400">Total Facturado</p>
                <p className="text-lg font-bold text-white">${totalEmitido.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {arcaWarning && (
        <div className="flex items-start gap-3 p-4 rounded-lg border border-amber-500/30 bg-amber-500/5 text-amber-200">
          <AlertTriangle className="w-5 h-5 mt-0.5" />
          <div className="text-sm leading-relaxed">{arcaWarning}</div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 p-4 rounded-lg border border-red-500/30 bg-red-500/5 text-red-200">
          <AlertTriangle className="w-5 h-5 mt-0.5" />
          <div className="text-sm leading-relaxed">{error}</div>
        </div>
      )}

      {/* Filters */}
      <Card className="bg-[#0a0f1a] border-gray-800">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                type="text"
                placeholder="Buscar por número, cliente o documento..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-[#030712] border-gray-800"
              />
            </div>
            <Button variant="outline" className="border-gray-700 bg-transparent" disabled>
              <Calendar className="w-4 h-4 mr-2" />
              Fecha
            </Button>
            <Button variant="outline" className="border-gray-700 bg-transparent" disabled>
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </Button>
            <Button variant="outline" className="border-gray-700 bg-transparent">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-[#0a0f1a] border-gray-800">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-800 hover:bg-transparent">
                <TableHead className="text-gray-400">Número</TableHead>
                <TableHead className="text-gray-400">Tipo</TableHead>
                <TableHead className="text-gray-400">Fecha</TableHead>
                <TableHead className="text-gray-400">Receptor</TableHead>
                <TableHead className="text-gray-400">Doc.</TableHead>
                <TableHead className="text-gray-400 text-right">Monto</TableHead>
                <TableHead className="text-gray-400">Estado</TableHead>
                <TableHead className="text-gray-400 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow className="border-gray-800">
                  <TableCell colSpan={8} className="text-center text-gray-500 py-10">
                    Cargando facturas...
                  </TableCell>
                </TableRow>
              )}

              {!isLoading && filtered.length === 0 && (
                <TableRow className="border-gray-800">
                  <TableCell colSpan={8} className="text-center text-gray-500 py-10">
                    No hay facturas para mostrar
                  </TableCell>
                </TableRow>
              )}

              {!isLoading &&
                filtered.map((invoice) => {
                  const numero = `${pad(invoice.punto_venta, 4)}-${pad(invoice.numero_comprobante, 8)}`
                  const formattedDate = invoice.fecha_emision
                    ? new Date(invoice.fecha_emision).toLocaleDateString("es-AR")
                    : "-"
                  const monto = Number(invoice.importe_total || 0)

                  return (
                    <TableRow key={invoice.id} className="border-gray-800 hover:bg-white/5">
                      <TableCell className="font-mono text-white">{numero}</TableCell>
                      <TableCell>{getTypeBadge(invoice.tipo_comprobante)}</TableCell>
                      <TableCell className="text-gray-300">{formattedDate}</TableCell>
                      <TableCell className="text-white">{invoice.razon_social_receptor || "-"}</TableCell>
                      <TableCell className="text-gray-400 font-mono">{invoice.numero_documento_receptor || "-"}</TableCell>
                      <TableCell className={`text-right font-medium ${monto < 0 ? "text-red-400" : "text-white"}`}>
                        ${Math.abs(monto).toLocaleString()}
                      </TableCell>
                      <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
