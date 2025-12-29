"use client"

import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Download, Printer, Calendar, Clock, User, Building2, CreditCard } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export const dynamic = "force-dynamic"

export default function TicketDetailPage() {
  const router = useRouter()
  const params = useParams()
  const ticketId = params.id as string

  // Mock data - En producción vendría de Supabase
  const ticket = {
    id: ticketId,
    date: new Date(),
    branch: "Sucursal Centro",
    shift: "Tarde",
    seller: "María García",
    sellerId: "EMP-001",
    paymentMethod: "Tarjeta de Crédito",
    products: [
      {
        id: 1,
        name: "Coca Cola 2L",
        category: "Bebidas",
        quantity: 2,
        unitPrice: 350,
        subtotal: 700,
        cost: 250,
        margin: 28.6,
      },
      {
        id: 2,
        name: "Papas Lays 150g",
        category: "Snacks",
        quantity: 3,
        unitPrice: 280,
        subtotal: 840,
        cost: 180,
        margin: 35.7,
      },
      {
        id: 3,
        name: "Marlboro Box 20u",
        category: "Cigarrillos",
        quantity: 1,
        unitPrice: 890,
        subtotal: 890,
        cost: 720,
        margin: 19.1,
      },
      {
        id: 4,
        name: "Alfajor Milka Oreo",
        category: "Golosinas",
        quantity: 5,
        unitPrice: 180,
        subtotal: 900,
        cost: 110,
        margin: 38.9,
      },
    ],
  }

  const totalQuantity = ticket.products.reduce((sum, p) => sum + p.quantity, 0)
  const subtotal = ticket.products.reduce((sum, p) => sum + p.subtotal, 0)
  const totalCost = ticket.products.reduce((sum, p) => sum + p.cost * p.quantity, 0)
  const totalMargin = ((subtotal - totalCost) / subtotal) * 100

  const handlePrint = () => {
    window.print()
  }

  const handleDownload = () => {
    console.log("Downloading ticket...")
    // Implementar descarga de PDF
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-8">
      {/* Header Actions */}
      <div className="flex items-center justify-between mb-8">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="text-gray-400 hover:text-white hover:bg-white/5"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a Tickets
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="bg-gray-800/50 border-gray-700 hover:bg-gray-800 hover:border-cyan-500/50"
          >
            <Printer className="w-4 h-4 mr-2" />
            Imprimir
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="bg-gray-800/50 border-gray-700 hover:bg-gray-800 hover:border-cyan-500/50"
          >
            <Download className="w-4 h-4 mr-2" />
            Descargar PDF
          </Button>
        </div>
      </div>

      {/* Ticket Detail Card */}
      <Card className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-cyan-500/20 p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Detalle de Venta</h1>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-mono text-cyan-400">{ticket.id}</span>
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Completado</Badge>
          </div>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800/50 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">Fecha</span>
            </div>
            <div className="text-white font-semibold">{format(ticket.date, "dd/MM/yyyy", { locale: es })}</div>
          </div>
          <div className="bg-gray-800/50 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <Clock className="w-4 h-4" />
              <span className="text-sm">Hora</span>
            </div>
            <div className="text-white font-semibold">{format(ticket.date, "HH:mm", { locale: es })}</div>
          </div>
          <div className="bg-gray-800/50 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <Building2 className="w-4 h-4" />
              <span className="text-sm">Sucursal</span>
            </div>
            <div className="text-white font-semibold">{ticket.branch}</div>
          </div>
          <div className="bg-gray-800/50 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <Clock className="w-4 h-4" />
              <span className="text-sm">Turno</span>
            </div>
            <div className="text-white font-semibold">{ticket.shift}</div>
          </div>
          <div className="bg-gray-800/50 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <User className="w-4 h-4" />
              <span className="text-sm">Vendedor</span>
            </div>
            <div className="text-white font-semibold">{ticket.seller}</div>
            <div className="text-xs text-gray-500">{ticket.sellerId}</div>
          </div>
          <div className="bg-gray-800/50 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <CreditCard className="w-4 h-4" />
              <span className="text-sm">Método de Pago</span>
            </div>
            <div className="text-white font-semibold">{ticket.paymentMethod}</div>
          </div>
        </div>

        <Separator className="my-8 bg-gray-700" />

        {/* Products Table */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Productos</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800/80 border-b border-gray-700">
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
                {ticket.products.map((product) => (
                  <tr key={product.id} className="border-b border-gray-800/50">
                    <td className="p-3 text-white font-medium">{product.name}</td>
                    <td className="p-3 text-gray-400">{product.category}</td>
                    <td className="p-3 text-center">
                      <Badge className="bg-gray-800 text-gray-300 border-gray-700">{product.quantity}</Badge>
                    </td>
                    <td className="p-3 text-right text-gray-300">${product.unitPrice.toFixed(2)}</td>
                    <td className="p-3 text-right text-white font-semibold">${product.subtotal.toFixed(2)}</td>
                    <td className="p-3 text-right">
                      <span className={product.margin >= 30 ? "text-green-400" : "text-yellow-400"}>
                        {product.margin.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <Separator className="my-8 bg-gray-700" />

        {/* Summary */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white mb-4">Resumen</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-800/50 p-4 rounded-lg">
              <div className="text-gray-400 text-sm mb-1">Total Unidades</div>
              <div className="text-2xl font-bold text-white">{totalQuantity}</div>
            </div>
            <div className="bg-gray-800/50 p-4 rounded-lg">
              <div className="text-gray-400 text-sm mb-1">Subtotal</div>
              <div className="text-2xl font-bold text-white">${subtotal.toFixed(2)}</div>
            </div>
            <div className="bg-gray-800/50 p-4 rounded-lg">
              <div className="text-gray-400 text-sm mb-1">Costo Total</div>
              <div className="text-2xl font-bold text-gray-400">${totalCost.toFixed(2)}</div>
            </div>
            <div className="bg-gray-800/50 p-4 rounded-lg">
              <div className="text-gray-400 text-sm mb-1">Margen Total</div>
              <div className="text-2xl font-bold text-green-400">{totalMargin.toFixed(1)}%</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-cyan-500/10 to-cyan-600/10 p-6 rounded-lg border border-cyan-500/30 mt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-gray-400 text-sm mb-1">Total de la Venta</div>
                <div className="text-4xl font-bold text-white">${subtotal.toFixed(2)}</div>
              </div>
              <div className="text-right">
                <div className="text-gray-400 text-sm mb-1">Ganancia Neta</div>
                <div className="text-3xl font-bold text-green-400">${(subtotal - totalCost).toFixed(2)}</div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
