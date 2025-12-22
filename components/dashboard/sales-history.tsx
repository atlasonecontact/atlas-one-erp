"use client"

import { ShoppingCart, Package, DollarSign, TrendingUp, ChevronDown } from "lucide-react"
import Image from "next/image"

interface Sale {
  id: string
  product: string
  customer?: string
  units: number
  amount: number
  date: string
}

interface SalesHistoryProps {
  sales?: Sale[]
  isLoading?: boolean
}

const defaultSales: Sale[] = [
  { id: "1", product: "Tesla", customer: "Juan Pérez", units: 12, amount: 18450, date: "26 Sep" },
  { id: "2", product: "iPhone 15 Pro", customer: "Marta Gómez", units: 34, amount: 46582, date: "25 Sep" },
  { id: "3", product: "PlayStation 5", customer: "Carlos Vázquez", units: 16, amount: 8560, date: "25 Sep" },
  { id: "4", product: "Nike Air Max", customer: "Laura Rivas", units: 21, amount: 5460, date: "24 Sep" },
]

export function SalesHistory({ sales = defaultSales, isLoading = false }: SalesHistoryProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-5">
        <div className="flex justify-between items-center mb-4">
          <div className="h-5 bg-white/10 rounded w-32 animate-pulse" />
          <div className="h-8 bg-white/10 rounded w-24 animate-pulse" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-16 bg-white/5 rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-white">Historial de Ventas</h3>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 text-xs bg-white/5 text-gray-400 rounded-lg hover:bg-white/10">
            Todo
          </button>
          <button className="px-3 py-1.5 text-xs bg-white/5 text-gray-400 rounded-lg hover:bg-white/10">
            Diaria
          </button>
          <button className="px-3 py-1.5 text-xs bg-cyan-500/20 text-cyan-400 rounded-lg">
            Semanal
          </button>
          <button className="px-3 py-1.5 text-xs text-cyan-400 flex items-center gap-1">
            Filtrar
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>
      </div>

      <table className="w-full">
        <thead>
          <tr className="border-b border-cyan-500/10">
            <th className="text-left text-xs text-gray-500 pb-3 font-medium">Producto</th>
            <th className="text-left text-xs text-gray-500 pb-3 font-medium">Cliente</th>
            <th className="text-right text-xs text-gray-500 pb-3 font-medium">Unidades</th>
            <th className="text-right text-xs text-gray-500 pb-3 font-medium">Facturado</th>
            <th className="text-right text-xs text-gray-500 pb-3 font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {sales.map((sale, index) => (
            <tr key={sale.id} className="border-b border-cyan-500/5 hover:bg-white/5">
              <td className="py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
                    <Package className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{sale.product}</p>
                    <p className="text-xs text-gray-500">Producto #{sale.id}</p>
                  </div>
                </div>
              </td>
              <td className="py-4">
                <div>
                  <p className="text-sm text-white">{sale.customer || "Cliente anónimo"}</p>
                  <p className="text-xs text-gray-500">{sale.customer ? `${sale.customer.toLowerCase().replace(' ', '')}@email.com` : ""}</p>
                </div>
              </td>
              <td className="py-4 text-right">
                <span className="text-sm text-white">{sale.units}</span>
              </td>
              <td className="py-4 text-right">
                <span className="text-sm font-medium text-white">${sale.amount.toLocaleString('es-AR')}</span>
              </td>
              <td className="py-4 text-right">
                <button className="text-xs text-gray-400 flex items-center gap-1 ml-auto">
                  {sale.date}
                  <ChevronDown className="w-3 h-3" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
