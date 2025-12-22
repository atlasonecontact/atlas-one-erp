"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PurchaseModal } from "@/components/purchases/purchase-modal"
import { Search, Plus, Eye, Check, Clock, Truck, RefreshCw } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface Purchase {
  id: string
  supplier_name: string
  purchase_number: string
  total_amount: number
  status: string
  created_at: string
}

export default function ComprasPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)
  const [kioskoId, setKioskoId] = useState<string | null>(null)
  const [stats, setStats] = useState({ monthTotal: 0, pendingCount: 0, pendingTotal: 0, supplierCount: 0 })

  const supabase = createClient()

  useEffect(() => {
    loadUserAndPurchases()
  }, [])

  const loadUserAndPurchases = async () => {
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
      await loadPurchases(targetKioskoId)
    }
    setLoading(false)
  }

  const loadPurchases = async (kiosko_id: string) => {
    const { data, error } = await supabase
      .from("purchases")
      .select("*")
      .eq("kiosko_id", kiosko_id)
      .order("created_at", { ascending: false })

    if (!error && data) {
      setPurchases(data)
      calculateStats(data)
    }
  }

  const calculateStats = (purchaseData: Purchase[]) => {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    
    const monthPurchases = purchaseData.filter(p => new Date(p.created_at) >= monthStart)
    const monthTotal = monthPurchases.reduce((sum, p) => sum + Number(p.total_amount), 0)
    
    const pending = purchaseData.filter(p => p.status === "pending")
    const pendingTotal = pending.reduce((sum, p) => sum + Number(p.total_amount), 0)
    
    const uniqueSuppliers = new Set(monthPurchases.map(p => p.supplier_name))
    
    setStats({
      monthTotal,
      pendingCount: pending.length,
      pendingTotal,
      supplierCount: uniqueSuppliers.size,
    })
  }

  const filteredPurchases = purchases.filter((p) => 
    p.supplier_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("es-AR")
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <Check className="w-4 h-4" />
      case "pending":
        return <Clock className="w-4 h-4" />
      case "transit":
        return <Truck className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/20 text-green-400"
      case "pending":
        return "bg-yellow-500/20 text-yellow-400"
      case "transit":
        return "bg-cyan-500/20 text-cyan-400"
      default:
        return "bg-gray-500/20 text-gray-400"
    }
  }

  const handleNewPurchase = async (purchase: { supplier: string; total: number; status: string }) => {
    if (!kioskoId) {
      alert("No hay kiosko seleccionado")
      return
    }

    const purchaseNumber = `C-${Date.now()}`
    const { data, error } = await supabase
      .from("purchases")
      .insert({
        kiosko_id: kioskoId,
        supplier_name: purchase.supplier,
        purchase_number: purchaseNumber,
        total_amount: purchase.total,
        status: purchase.status || "pending",
      })
      .select()
      .single()

    if (!error && data) {
      setPurchases((prev) => [data, ...prev])
      calculateStats([data, ...purchases])
    }
    setShowModal(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Compras</h1>
          <p className="text-gray-400 text-sm">Gestiona las órdenes de compra a proveedores</p>
        </div>
        <Button
          onClick={() => setShowModal(true)}
          className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold gap-2"
        >
          <Plus className="w-4 h-4" />
          Nueva Compra
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-5">
          <p className="text-sm text-gray-400 mb-1">Compras del mes</p>
          <p className="text-2xl font-bold text-white">${stats.monthTotal.toLocaleString()}</p>
          <p className="text-xs text-green-400 mt-1">{purchases.filter(p => p.status === "completed").length} órdenes completadas</p>
        </div>
        <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-5">
          <p className="text-sm text-gray-400 mb-1">Pendientes</p>
          <p className="text-2xl font-bold text-yellow-400">{stats.pendingCount}</p>
          <p className="text-xs text-gray-500 mt-1">${stats.pendingTotal.toLocaleString()} en espera</p>
        </div>
        <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-5">
          <p className="text-sm text-gray-400 mb-1">Proveedores activos</p>
          <p className="text-2xl font-bold text-cyan-400">{stats.supplierCount}</p>
          <p className="text-xs text-gray-500 mt-1">Este mes</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <Input
          type="text"
          placeholder="Buscar por proveedor..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-[#0a0f1a] border-cyan-500/10 text-white placeholder:text-gray-500"
        />
      </div>

      {/* Purchases table */}
      <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-cyan-500/10">
              <th className="text-left text-sm font-medium text-gray-400 p-4">ID</th>
              <th className="text-left text-sm font-medium text-gray-400 p-4">Proveedor</th>
              <th className="text-left text-sm font-medium text-gray-400 p-4">Fecha</th>
              <th className="text-left text-sm font-medium text-gray-400 p-4">Total</th>
              <th className="text-left text-sm font-medium text-gray-400 p-4">Estado</th>
              <th className="text-right text-sm font-medium text-gray-400 p-4">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                  Cargando compras...
                </td>
              </tr>
            ) : filteredPurchases.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">
                  No hay compras registradas
                </td>
              </tr>
            ) : (
              filteredPurchases.map((purchase) => (
                <tr key={purchase.id} className="border-b border-cyan-500/5 hover:bg-white/5 transition-colors">
                  <td className="p-4">
                    <span className="text-cyan-400 font-mono">{purchase.purchase_number}</span>
                  </td>
                  <td className="p-4 text-white font-medium">{purchase.supplier_name}</td>
                  <td className="p-4 text-gray-400">{formatDate(purchase.created_at)}</td>
                  <td className="p-4 text-white">${Number(purchase.total_amount).toLocaleString()}</td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusStyle(purchase.status)}`}
                    >
                      {getStatusIcon(purchase.status)}
                      {purchase.status === "completed"
                        ? "Completada"
                        : purchase.status === "pending"
                          ? "Pendiente"
                          : "En tránsito"}
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

      <PurchaseModal open={showModal} onClose={() => setShowModal(false)} onSave={handleNewPurchase} />
    </div>
  )
}
