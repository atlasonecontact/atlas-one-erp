"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus, Eye, DollarSign, Package, CheckCircle2, XCircle, Clock } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface PurchaseWithItems {
  id: string
  supplier_name: string
  purchase_number: string
  total_amount: number
  status: string
  payment_status: string
  created_at: string
  total_units?: number
}

export default function PedidoProveedorPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [purchases, setPurchases] = useState<PurchaseWithItems[]>([])
  const [loading, setLoading] = useState(true)
  const [kioskoId, setKioskoId] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    loadUserAndPurchases()
  }, [])

  const loadUserAndPurchases = async () => {
    setLoading(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    const { data: employeeData } = await supabase
      .from("employees")
      .select("kiosko_id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle()

    let targetKioskoId: string | null = null

    if (employeeData) {
      targetKioskoId = employeeData.kiosko_id
    } else {
      const { data: kioscos } = await supabase.from("kioscos").select("id").eq("owner_id", user.id).limit(1)

      if (kioscos && kioscos.length > 0) {
        targetKioskoId = kioscos[0].id
      }
    }

    if (targetKioskoId) {
      setKioskoId(targetKioskoId)
      await loadPurchases(targetKioskoId)
    }
    setLoading(false)
  }

  const loadPurchases = async (kiosko_id: string) => {
    // Get purchases with items to calculate total units
    const { data: purchasesData, error } = await supabase
      .from("purchases")
      .select(`
        *,
        purchase_items (
          quantity
        )
      `)
      .eq("kiosko_id", kiosko_id)
      .order("created_at", { ascending: false })

    if (!error && purchasesData) {
      // Calculate total units for each purchase
      const purchasesWithUnits = purchasesData.map((p: any) => ({
        id: p.id,
        supplier_name: p.supplier_name,
        purchase_number: p.purchase_number,
        total_amount: p.total_amount,
        status: p.status,
        payment_status: p.payment_status || "unpaid",
        created_at: p.created_at,
        total_units: p.purchase_items?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || 0,
      }))
      setPurchases(purchasesWithUnits)
    }
  }

  const filteredPurchases = purchases.filter(
    (p) =>
      p.supplier_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.purchase_number.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle2 className="w-4 h-4" />
      case "unpaid":
        return <XCircle className="w-4 h-4" />
      case "partial":
        return <Clock className="w-4 h-4" />
      default:
        return <XCircle className="w-4 h-4" />
    }
  }

  const getPaymentStatusStyle = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "unpaid":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      case "partial":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case "paid":
        return "Pagada"
      case "unpaid":
        return "No Pagada"
      case "partial":
        return "Pago Parcial"
      default:
        return "No Pagada"
    }
  }

  const stats = {
    totalOrders: purchases.length,
    totalPaid: purchases.filter((p) => p.payment_status === "paid").length,
    totalUnpaid: purchases.filter((p) => p.payment_status === "unpaid").length,
    totalAmount: purchases.reduce((sum, p) => sum + Number(p.total_amount), 0),
    totalUnits: purchases.reduce((sum, p) => sum + (p.total_units || 0), 0),
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Pedido a Proveedor OC</h1>
          <p className="text-gray-400 text-sm">Gestiona las órdenes de compra y su estado de pago</p>
        </div>
        <Button className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold gap-2">
          <Plus className="w-4 h-4" />
          Nueva Orden de Compra
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
              <Package className="w-5 h-5 text-cyan-400" />
            </div>
            <p className="text-sm text-gray-400">Total OC</p>
          </div>
          <p className="text-2xl font-bold text-white">{stats.totalOrders}</p>
        </div>

        <div className="rounded-xl border border-green-500/10 bg-[#0a0f1a] p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-sm text-gray-400">Pagadas</p>
          </div>
          <p className="text-2xl font-bold text-green-400">{stats.totalPaid}</p>
        </div>

        <div className="rounded-xl border border-red-500/10 bg-[#0a0f1a] p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-400" />
            </div>
            <p className="text-sm text-gray-400">No Pagadas</p>
          </div>
          <p className="text-2xl font-bold text-red-400">{stats.totalUnpaid}</p>
        </div>

        <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-cyan-400" />
            </div>
            <p className="text-sm text-gray-400">Monto Total</p>
          </div>
          <p className="text-xl font-bold text-white">${stats.totalAmount.toLocaleString()}</p>
        </div>

        <div className="rounded-xl border border-purple-500/10 bg-[#0a0f1a] p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Package className="w-5 h-5 text-purple-400" />
            </div>
            <p className="text-sm text-gray-400">Unidades</p>
          </div>
          <p className="text-2xl font-bold text-purple-400">{stats.totalUnits.toLocaleString()}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <Input
          type="text"
          placeholder="Buscar por proveedor o número de OC..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-[#0a0f1a] border-cyan-500/10 text-white placeholder:text-gray-500"
        />
      </div>

      {/* Orders Table */}
      <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-cyan-500/10 bg-[#0a0f1a]">
                <th className="text-left text-sm font-medium text-gray-400 p-4">Número OC</th>
                <th className="text-left text-sm font-medium text-gray-400 p-4">Proveedor</th>
                <th className="text-left text-sm font-medium text-gray-400 p-4">Fecha</th>
                <th className="text-right text-sm font-semibold text-purple-400 p-4 bg-purple-500/5">
                  <div className="flex items-center justify-end gap-2">
                    <Package className="w-4 h-4" />
                    Unidades Pedidas
                  </div>
                </th>
                <th className="text-right text-sm font-medium text-gray-400 p-4">Monto Total</th>
                <th className="text-center text-sm font-semibold text-cyan-400 p-4 bg-cyan-500/5">
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Estado de Pago
                  </div>
                </th>
                <th className="text-right text-sm font-medium text-gray-400 p-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">
                    Cargando órdenes de compra...
                  </td>
                </tr>
              ) : filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">
                    No hay órdenes de compra registradas
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((purchase) => (
                  <tr key={purchase.id} className="border-b border-cyan-500/5 hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <span className="text-cyan-400 font-mono font-semibold">{purchase.purchase_number}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-white font-medium">{purchase.supplier_name}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-gray-400">{formatDate(purchase.created_at)}</span>
                    </td>
                    <td className="p-4 text-right bg-purple-500/5">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                        <Package className="w-4 h-4" />
                        {purchase.total_units?.toLocaleString() || 0} un.
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <span className="text-white font-semibold text-lg">
                        ${Number(purchase.total_amount).toLocaleString()}
                      </span>
                    </td>
                    <td className="p-4 bg-cyan-500/5">
                      <div className="flex justify-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-semibold text-sm ${getPaymentStatusStyle(purchase.payment_status)}`}
                        >
                          {getPaymentStatusIcon(purchase.payment_status)}
                          {getPaymentStatusText(purchase.payment_status)}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10"
                      >
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
    </div>
  )
}
