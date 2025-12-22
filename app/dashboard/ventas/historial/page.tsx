"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Download, Eye, ArrowLeft, Calendar, CreditCard, Banknote, QrCode, RefreshCw } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

interface Sale {
  id: string
  sale_number: string
  total_amount: number
  payment_method: string
  status: string
  created_at: string
  items_count?: number
}

export default function HistorialVentasPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDate, setSelectedDate] = useState("")
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [kioskoId, setKioskoId] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    loadUserAndSales()
  }, [])

  const loadUserAndSales = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    // Check if user is an employee
    const { data: employeeData } = await supabase
      .from("employees")
      .select("kiosko_id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle()

    let targetKioskoId: string | null = null

    if (employeeData) {
      targetKioskoId = employeeData.kiosko_id
    } else {
      const { data: kioscos } = await supabase
        .from("kioscos")
        .select("id")
        .eq("owner_id", user.id)
        .limit(1)

      if (kioscos && kioscos.length > 0) {
        targetKioskoId = kioscos[0].id
      }
    }

    if (targetKioskoId) {
      setKioskoId(targetKioskoId)
      await loadSales(targetKioskoId)
    }
    setLoading(false)
  }

  const loadSales = async (kiosko_id: string) => {
    const { data, error } = await supabase
      .from("sales")
      .select(`
        id,
        sale_number,
        total_amount,
        payment_method,
        status,
        created_at,
        sale_items(quantity)
      `)
      .eq("kiosko_id", kiosko_id)
      .order("created_at", { ascending: false })
      .limit(100)

    if (!error && data) {
      const mappedSales = data.map((s: any) => ({
        id: s.id,
        sale_number: s.sale_number,
        total_amount: s.total_amount,
        payment_method: s.payment_method || "Efectivo",
        status: s.status || "completed",
        created_at: s.created_at,
        items_count: s.sale_items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0,
      }))
      setSales(mappedSales)
    }
  }

  const filteredSales = sales.filter((sale) => {
    const matchesSearch = sale.sale_number?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          sale.id.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesDate = !selectedDate || sale.created_at.includes(selectedDate)
    return matchesSearch && matchesDate
  })

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("es-AR", {
      day: "2-digit",
      month: "2-digit", 
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getMethodIcon = (method: string) => {
    switch (method?.toLowerCase()) {
      case "efectivo":
      case "cash":
        return <Banknote className="w-4 h-4" />
      case "tarjeta":
      case "card":
        return <CreditCard className="w-4 h-4" />
      case "qr":
        return <QrCode className="w-4 h-4" />
      default:
        return <Banknote className="w-4 h-4" />
    }
  }

  const getMethodLabel = (method: string) => {
    switch (method?.toLowerCase()) {
      case "cash":
        return "Efectivo"
      case "card":
        return "Tarjeta"
      case "qr":
        return "QR"
      default:
        return method || "Efectivo"
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
                  No hay ventas registradas
                </td>
              </tr>
            ) : (
              filteredSales.map((sale) => (
                <tr key={sale.id} className="border-b border-cyan-500/5 hover:bg-white/5 transition-colors">
                  <td className="p-4">
                    <span className="text-cyan-400 font-mono">{sale.sale_number}</span>
                  </td>
                  <td className="p-4 text-white">{formatDate(sale.created_at)}</td>
                  <td className="p-4 text-gray-400">{sale.items_count} productos</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-gray-400">
                      {getMethodIcon(sale.payment_method)}
                      {getMethodLabel(sale.payment_method)}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-white font-medium">${Number(sale.total_amount).toLocaleString()}</span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      sale.status === "completed" 
                        ? "bg-green-500/20 text-green-400" 
                        : "bg-yellow-500/20 text-yellow-400"
                    }`}>
                      {sale.status === "completed" ? "Completada" : "Pendiente"}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
