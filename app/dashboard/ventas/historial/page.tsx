"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { demoSales } from "@/lib/demo-data"
import { Search, Download, Eye, ArrowLeft, Calendar, CreditCard, Banknote, QrCode } from "lucide-react"
import Link from "next/link"

export default function HistorialVentasPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDate, setSelectedDate] = useState("")

  const filteredSales = demoSales.filter((sale) => {
    const matchesSearch = sale.id.toString().includes(searchQuery)
    const matchesDate = !selectedDate || sale.date.includes(selectedDate)
    return matchesSearch && matchesDate
  })

  const getMethodIcon = (method: string) => {
    switch (method) {
      case "Efectivo":
        return <Banknote className="w-4 h-4" />
      case "Tarjeta":
        return <CreditCard className="w-4 h-4" />
      case "QR":
        return <QrCode className="w-4 h-4" />
      default:
        return <Banknote className="w-4 h-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/ventas">
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Historial de Ventas</h1>
            <p className="text-gray-400 text-sm">Consulta todas las transacciones realizadas</p>
          </div>
        </div>
        <Button variant="outline" className="border-cyan-500/20 text-gray-400 hover:text-white bg-transparent gap-2">
          <Download className="w-4 h-4" />
          Exportar
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            type="text"
            placeholder="Buscar por ID de venta..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-[#0a0f1a] border-cyan-500/10 text-white placeholder:text-gray-500"
          />
        </div>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="pl-10 bg-[#0a0f1a] border-cyan-500/10 text-white w-48"
          />
        </div>
      </div>

      {/* Sales table */}
      <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-cyan-500/10">
              <th className="text-left text-sm font-medium text-gray-400 p-4">ID</th>
              <th className="text-left text-sm font-medium text-gray-400 p-4">Fecha</th>
              <th className="text-left text-sm font-medium text-gray-400 p-4">Items</th>
              <th className="text-left text-sm font-medium text-gray-400 p-4">Método</th>
              <th className="text-left text-sm font-medium text-gray-400 p-4">Total</th>
              <th className="text-left text-sm font-medium text-gray-400 p-4">Estado</th>
              <th className="text-right text-sm font-medium text-gray-400 p-4">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredSales.map((sale) => (
              <tr key={sale.id} className="border-b border-cyan-500/5 hover:bg-white/5 transition-colors">
                <td className="p-4">
                  <span className="text-cyan-400 font-mono">#{sale.id.toString().padStart(4, "0")}</span>
                </td>
                <td className="p-4 text-white">{sale.date}</td>
                <td className="p-4 text-gray-400">{sale.items} productos</td>
                <td className="p-4">
                  <div className="flex items-center gap-2 text-gray-400">
                    {getMethodIcon(sale.method)}
                    {sale.method}
                  </div>
                </td>
                <td className="p-4">
                  <span className="text-white font-medium">${sale.total.toLocaleString()}</span>
                </td>
                <td className="p-4">
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                    Completada
                  </span>
                </td>
                <td className="p-4 text-right">
                  <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                    <Eye className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
