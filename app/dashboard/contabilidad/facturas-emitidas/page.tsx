"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Filter, Download, Eye, FileText, Calendar, DollarSign } from "lucide-react"

// Mock data
const invoicesData = [
  {
    id: "FA-0001-00001234",
    type: "Factura A",
    date: "2024-12-20",
    client: "Distribuidora Norte S.A.",
    cuit: "30-71234567-8",
    amount: 125000.0,
    status: "emitida",
  },
  {
    id: "FB-0001-00001235",
    type: "Factura B",
    date: "2024-12-19",
    client: "Juan Pérez",
    cuit: "20-12345678-9",
    amount: 8500.0,
    status: "emitida",
  },
  {
    id: "NC-0001-00000456",
    type: "Nota de Crédito",
    date: "2024-12-18",
    client: "Comercial Sur S.R.L.",
    cuit: "30-98765432-1",
    amount: -15000.0,
    status: "emitida",
  },
  {
    id: "FA-0001-00001233",
    type: "Factura A",
    date: "2024-12-17",
    client: "Tech Solutions S.A.",
    cuit: "30-45678901-2",
    amount: 250000.0,
    status: "anulada",
  },
  {
    id: "FB-0001-00001234",
    type: "Factura B",
    date: "2024-12-16",
    client: "María García",
    cuit: "27-87654321-0",
    amount: 12350.0,
    status: "emitida",
  },
]

const getStatusBadge = (status: string) => {
  switch (status) {
    case "emitida":
      return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Emitida</Badge>
    case "anulada":
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Anulada</Badge>
    case "pendiente":
      return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Pendiente</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

const getTypeBadge = (type: string) => {
  if (type.includes("Crédito")) {
    return (
      <Badge variant="outline" className="border-red-500/30 text-red-400">
        {type}
      </Badge>
    )
  }
  if (type.includes("Débito")) {
    return (
      <Badge variant="outline" className="border-orange-500/30 text-orange-400">
        {type}
      </Badge>
    )
  }
  if (type.includes("A")) {
    return (
      <Badge variant="outline" className="border-blue-500/30 text-blue-400">
        {type}
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="border-emerald-500/30 text-emerald-400">
      {type}
    </Badge>
  )
}

export default function FacturasEmitidasPage() {
  const [searchQuery, setSearchQuery] = useState("")

  const totalEmitido = invoicesData.filter((i) => i.status === "emitida").reduce((acc, i) => acc + i.amount, 0)

  const totalFacturas = invoicesData.filter((i) => i.status === "emitida").length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Facturas Emitidas</h1>
          <p className="text-gray-400">Historial de comprobantes fiscales</p>
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

      {/* Filters */}
      <Card className="bg-[#0a0f1a] border-gray-800">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                type="text"
                placeholder="Buscar por número, cliente o CUIT..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-[#030712] border-gray-800"
              />
            </div>
            <Button variant="outline" className="border-gray-700 bg-transparent">
              <Calendar className="w-4 h-4 mr-2" />
              Fecha
            </Button>
            <Button variant="outline" className="border-gray-700 bg-transparent">
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
                <TableHead className="text-gray-400">Cliente</TableHead>
                <TableHead className="text-gray-400">CUIT</TableHead>
                <TableHead className="text-gray-400 text-right">Monto</TableHead>
                <TableHead className="text-gray-400">Estado</TableHead>
                <TableHead className="text-gray-400 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoicesData.map((invoice) => (
                <TableRow key={invoice.id} className="border-gray-800 hover:bg-white/5">
                  <TableCell className="font-mono text-white">{invoice.id}</TableCell>
                  <TableCell>{getTypeBadge(invoice.type)}</TableCell>
                  <TableCell className="text-gray-300">{new Date(invoice.date).toLocaleDateString("es-AR")}</TableCell>
                  <TableCell className="text-white">{invoice.client}</TableCell>
                  <TableCell className="text-gray-400 font-mono">{invoice.cuit}</TableCell>
                  <TableCell className={`text-right font-medium ${invoice.amount < 0 ? "text-red-400" : "text-white"}`}>
                    ${Math.abs(invoice.amount).toLocaleString()}
                  </TableCell>
                  <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
