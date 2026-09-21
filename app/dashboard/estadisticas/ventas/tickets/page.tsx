"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Search, Download, ChevronLeft, ChevronRight } from "lucide-react"
import { GlobalFiltersComponent, type GlobalFilters } from "@/components/dashboard/global-filters"
import { Card } from "@/components/ui/card"
import { DemoDataBanner } from "@/components/ui/demo-data-banner"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { subDays, format } from "date-fns"
import { es } from "date-fns/locale"

export const dynamic = "force-dynamic"

interface Ticket {
  id: string
  date: Date
  branch: string
  shift: string
  seller: string
  total: number
  units: number
  paymentMethod: string
  margin: number
}

export default function TicketsTablePage() {
  const router = useRouter()
  const [filters, setFilters] = useState<GlobalFilters>({
    dateRange: {
      from: subDays(new Date(), 30),
      to: new Date(),
    },
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

  // Mock data - En producción vendría de Supabase
  const mockTickets: Ticket[] = Array.from({ length: 150 }, (_, i) => ({
    id: `#V-${17000 + i}`,
    date: subDays(new Date(), Math.floor(Math.random() * 30)),
    branch: ["Central", "Sucursal Norte", "Sucursal Sur"][Math.floor(Math.random() * 3)],
    shift: ["Mañana", "Tarde", "Noche"][Math.floor(Math.random() * 3)],
    seller: ["Juan Pérez", "María García", "Carlos Rodríguez", "Ana Martínez"][Math.floor(Math.random() * 4)],
    total: Math.floor(Math.random() * 300) + 50,
    units: Math.floor(Math.random() * 8) + 1,
    paymentMethod: ["Efectivo", "Tarjeta", "QR", "Transferencia"][Math.floor(Math.random() * 4)],
    margin: Math.floor(Math.random() * 40) + 10,
  }))

  const filteredTickets = mockTickets.filter((ticket) => ticket.id.toLowerCase().includes(searchTerm.toLowerCase()))

  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage)
  const paginatedTickets = filteredTickets.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handleExport = (format: "csv" | "excel") => {
    console.log(`Exporting to ${format}...`)
    // Implementar lógica de exportación
  }

  const paymentMethodColors = {
    Efectivo: "bg-green-500/20 text-green-400 border-green-500/30",
    Tarjeta: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    QR: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    Transferencia: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-8">
      <DemoDataBanner />
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Tickets de Venta</h1>
        <p className="text-gray-400">Tabla detallada de todas las transacciones</p>
      </div>

      {/* Global Filters */}
      <div className="mb-8">
        <GlobalFiltersComponent filters={filters} onChange={setFilters} />
      </div>

      {/* Table Controls */}
      <Card className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-cyan-500/20 p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar por ID de ticket..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-800/50 border-gray-700 focus:border-cyan-500"
            />
          </div>

          {/* Export Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("csv")}
              className="bg-gray-800/50 border-gray-700 hover:bg-gray-800 hover:border-cyan-500/50"
            >
              <Download className="w-4 h-4 mr-2" />
              CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("excel")}
              className="bg-gray-800/50 border-gray-700 hover:bg-gray-800 hover:border-cyan-500/50"
            >
              <Download className="w-4 h-4 mr-2" />
              Excel
            </Button>
          </div>
        </div>
      </Card>

      {/* Data Table */}
      <Card className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-cyan-500/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800/80 border-b border-gray-700">
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
                <th className="text-right p-4 text-cyan-400 font-semibold">Margen %</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTickets.map((ticket, index) => (
                <tr
                  key={ticket.id}
                  onClick={() => router.push(`/dashboard/estadisticas/ventas/tickets/${ticket.id}`)}
                  className="border-b border-gray-800/50 hover:bg-gray-800/50 cursor-pointer transition-colors"
                >
                  <td className="p-4 text-white font-mono">{ticket.id}</td>
                  <td className="p-4 text-gray-300">{format(ticket.date, "dd/MM/yyyy", { locale: es })}</td>
                  <td className="p-4 text-gray-300">{format(ticket.date, "HH:mm", { locale: es })}</td>
                  <td className="p-4 text-gray-300">{ticket.branch}</td>
                  <td className="p-4 text-gray-300">{ticket.shift}</td>
                  <td className="p-4 text-gray-300">{ticket.seller}</td>
                  <td className="p-4 text-right text-white font-semibold">${ticket.total.toFixed(2)}</td>
                  <td className="p-4 text-center">
                    <Badge className="bg-gray-800 text-gray-300 border-gray-700">{ticket.units}</Badge>
                  </td>
                  <td className="p-4">
                    <Badge className={paymentMethodColors[ticket.paymentMethod as keyof typeof paymentMethodColors]}>
                      {ticket.paymentMethod}
                    </Badge>
                  </td>
                  <td className="p-4 text-right">
                    <span className={ticket.margin >= 30 ? "text-green-400" : "text-yellow-400"}>{ticket.margin}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between p-4 border-t border-gray-800">
          <div className="text-sm text-gray-400">
            Mostrando {(currentPage - 1) * itemsPerPage + 1} a{" "}
            {Math.min(currentPage * itemsPerPage, filteredTickets.length)} de {filteredTickets.length} tickets
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="bg-gray-800/50 border-gray-700 hover:bg-gray-800 hover:border-cyan-500/50"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-white font-semibold">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="bg-gray-800/50 border-gray-700 hover:bg-gray-800 hover:border-cyan-500/50"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
