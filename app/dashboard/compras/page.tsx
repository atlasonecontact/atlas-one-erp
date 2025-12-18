"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { demoPurchases } from "@/lib/demo-data"
import { PurchaseModal } from "@/components/purchases/purchase-modal"
import { Search, Plus, Eye, Check, Clock, Truck } from "lucide-react"

export default function ComprasPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [purchases, setPurchases] = useState(demoPurchases)

  const filteredPurchases = purchases.filter((p) => p.supplier.toLowerCase().includes(searchQuery.toLowerCase()))

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

  const handleNewPurchase = (purchase: (typeof demoPurchases)[0]) => {
    setPurchases((prev) => [{ ...purchase, id: Date.now() }, ...prev])
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
          <p className="text-2xl font-bold text-white">$60,500</p>
          <p className="text-xs text-green-400 mt-1">4 órdenes completadas</p>
        </div>
        <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-5">
          <p className="text-sm text-gray-400 mb-1">Pendientes</p>
          <p className="text-2xl font-bold text-yellow-400">1</p>
          <p className="text-xs text-gray-500 mt-1">$12,000 en espera</p>
        </div>
        <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-5">
          <p className="text-sm text-gray-400 mb-1">Proveedores activos</p>
          <p className="text-2xl font-bold text-cyan-400">4</p>
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
            {filteredPurchases.map((purchase) => (
              <tr key={purchase.id} className="border-b border-cyan-500/5 hover:bg-white/5 transition-colors">
                <td className="p-4">
                  <span className="text-cyan-400 font-mono">#{purchase.id.toString().padStart(4, "0")}</span>
                </td>
                <td className="p-4 text-white font-medium">{purchase.supplier}</td>
                <td className="p-4 text-gray-400">{purchase.date}</td>
                <td className="p-4 text-white">${purchase.total.toLocaleString()}</td>
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
            ))}
          </tbody>
        </table>
      </div>

      <PurchaseModal open={showModal} onClose={() => setShowModal(false)} onSave={handleNewPurchase} />
    </div>
  )
}
