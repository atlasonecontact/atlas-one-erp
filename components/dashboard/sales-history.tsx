"use client"

import { useState, useEffect } from "react"
import { Package, Receipt } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface SaleRecord {
  id: string
  sale_number: string
  total_amount: number
  payment_method: string
  created_at: string
  employee?: { name: string } | null
  items?: Array<{
    product_name: string
    quantity: number
    subtotal: number
  }>
}

interface SalesHistoryProps {
  isLoading?: boolean
  kioskoId?: string
}

export function SalesHistory({ isLoading: externalLoading = false, kioskoId }: SalesHistoryProps) {
  const [sales, setSales] = useState<SaleRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "day" | "week">("week")

  const supabase = createClient()

  useEffect(() => {
    loadSales()
  }, [filter])

  const loadSales = async () => {
    setLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // Get user's kioscos
      let kioskoIds: string[] = []
      if (kioskoId) {
        kioskoIds = [kioskoId]
      } else {
        const { data: kioscos } = await supabase.from("kioscos").select("id").eq("owner_id", user.id)

        if (kioscos && kioscos.length > 0) {
          kioskoIds = kioscos.map((k) => k.id)
        }
      }

      if (kioskoIds.length === 0) {
        setLoading(false)
        return
      }

      // Calculate date range
      const now = new Date()
      let startDate: Date
      if (filter === "day") {
        startDate = new Date(now.setHours(0, 0, 0, 0))
      } else if (filter === "week") {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      } else {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      }

      const { data: salesData, error } = await supabase
        .from("sales")
        .select(`
          id,
          sale_number,
          total_amount,
          payment_method,
          created_at,
          employees (name),
          sale_items (
            quantity,
            subtotal,
            products (name)
          )
        `)
        .in("kiosko_id", kioskoIds)
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: false })
        .limit(20)

      if (error) {
        console.error("Error loading sales:", error)
        return
      }

      const mappedSales: SaleRecord[] = (salesData || []).map((s: any) => ({
        id: s.id,
        sale_number: s.sale_number,
        total_amount: Number(s.total_amount),
        payment_method: s.payment_method || "efectivo",
        created_at: s.created_at,
        employee: s.employees,
        items:
          s.sale_items?.map((item: any) => ({
            product_name: item.products?.name || "Producto",
            quantity: item.quantity,
            subtotal: Number(item.subtotal),
          })) || [],
      }))

      setSales(mappedSales)
    } catch (err) {
      console.error("Error:", err)
    } finally {
      setLoading(false)
    }
  }

  const isLoading = externalLoading || loading
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("es-AR", { day: "numeric", month: "short" })
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })
  }

  const getPaymentMethodLabel = (method: string) => {
    const methods: Record<string, string> = {
      efectivo: "Efectivo",
      cash: "Efectivo",
      tarjeta: "Tarjeta",
      card: "Tarjeta",
      qr: "QR",
      transfer: "Transferencia",
    }
    return methods[method?.toLowerCase()] || method || "Efectivo"
  }

  if (isLoading) {
    return (
      <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-4 lg:p-5">
        <div className="flex justify-between items-center mb-4">
          <div className="h-5 bg-white/10 rounded w-32 animate-pulse" />
          <div className="h-8 bg-white/10 rounded w-24 animate-pulse" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-white/5 rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-4 lg:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h3 className="text-sm font-medium text-white">Historial de Ventas</h3>
        <div className="flex gap-2 overflow-x-auto">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 text-xs rounded-lg whitespace-nowrap ${filter === "all" ? "bg-cyan-500/20 text-cyan-400" : "bg-white/5 text-gray-400 hover:bg-white/10"}`}
          >
            Todo
          </button>
          <button
            onClick={() => setFilter("day")}
            className={`px-3 py-1.5 text-xs rounded-lg whitespace-nowrap ${filter === "day" ? "bg-cyan-500/20 text-cyan-400" : "bg-white/5 text-gray-400 hover:bg-white/10"}`}
          >
            Diaria
          </button>
          <button
            onClick={() => setFilter("week")}
            className={`px-3 py-1.5 text-xs rounded-lg whitespace-nowrap ${filter === "week" ? "bg-cyan-500/20 text-cyan-400" : "bg-white/5 text-gray-400 hover:bg-white/10"}`}
          >
            Semanal
          </button>
        </div>
      </div>

      {sales.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <Receipt className="w-12 h-12 mb-3 opacity-50" />
          <p className="text-sm">No hay ventas en este período</p>
        </div>
      ) : (
        <>
          <div className="lg:hidden space-y-3">
            {sales.map((sale) => {
              const totalUnits = sale.items?.reduce((sum, item) => sum + item.quantity, 0) || 0
              const mainProduct = sale.items?.[0]?.product_name || "Venta"

              return (
                <div key={sale.id} className="p-4 rounded-lg bg-white/5 border border-cyan-500/10">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
                        <Package className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">#{sale.sale_number}</p>
                        <p className="text-xs text-gray-500">{sale.employee?.name || "Sistema"}</p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-white">
                      ${sale.total_amount.toLocaleString("es-AR")}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-white">{mainProduct}</p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">
                        {totalUnits} unid.{" "}
                        {sale.items && sale.items.length > 1 ? `(${sale.items.length} productos)` : ""}
                      </span>
                      <span className="text-gray-400 bg-white/5 px-2 py-1 rounded">
                        {getPaymentMethodLabel(sale.payment_method)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{formatDate(sale.created_at)}</span>
                      <span>{formatTime(sale.created_at)}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-cyan-500/10">
                  <th className="text-left text-xs text-gray-500 pb-3 font-medium">Venta</th>
                  <th className="text-left text-xs text-gray-500 pb-3 font-medium">Productos</th>
                  <th className="text-right text-xs text-gray-500 pb-3 font-medium">Método</th>
                  <th className="text-right text-xs text-gray-500 pb-3 font-medium">Total</th>
                  <th className="text-right text-xs text-gray-500 pb-3 font-medium">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => {
                  const totalUnits = sale.items?.reduce((sum, item) => sum + item.quantity, 0) || 0
                  const mainProduct = sale.items?.[0]?.product_name || "Venta"

                  return (
                    <tr key={sale.id} className="border-b border-cyan-500/5 hover:bg-white/5">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
                            <Package className="w-5 h-5 text-cyan-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">#{sale.sale_number}</p>
                            <p className="text-xs text-gray-500">{sale.employee?.name || "Sistema"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <div>
                          <p className="text-sm text-white">{mainProduct}</p>
                          <p className="text-xs text-gray-500">
                            {totalUnits} unid.{" "}
                            {sale.items && sale.items.length > 1 ? `(${sale.items.length} productos)` : ""}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 text-right">
                        <span className="text-xs text-gray-400 bg-white/5 px-2 py-1 rounded">
                          {getPaymentMethodLabel(sale.payment_method)}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <span className="text-sm font-medium text-white">
                          ${sale.total_amount.toLocaleString("es-AR")}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <div className="text-right">
                          <p className="text-xs text-gray-400">{formatDate(sale.created_at)}</p>
                          <p className="text-xs text-gray-500">{formatTime(sale.created_at)}</p>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
