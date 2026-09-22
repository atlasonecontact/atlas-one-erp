"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, PackagePlus, ClipboardList, Pencil, Barcode, CalendarClock } from "lucide-react"

interface DetailProduct {
  id: string
  name: string
  brand?: string
  category: string
  subcategory?: string
  supplier?: string
  cost: number
  price: number
  stock: number
  barcode?: string
  status: string
  expiration_date?: string | null
}

interface ProductDetailModalProps {
  open: boolean
  onClose: () => void
  product: DetailProduct | null
  onEdit: (product: DetailProduct) => void
  onQuickAddStock: (product: DetailProduct, quantity: number) => void
  onStartReception: (product: DetailProduct) => void
}

// Cajita de detalle que se abre al escanear un producto ya cargado (pistolita
// o camara) en /dashboard/productos: para consultar rapido sin tener que
// buscarlo a mano en la tabla.
export function ProductDetailModal({
  open,
  onClose,
  product,
  onEdit,
  onQuickAddStock,
  onStartReception,
}: ProductDetailModalProps) {
  const [quickStockQty, setQuickStockQty] = useState("")

  if (!open || !product) return null

  const margin = product.price > 0 ? ((product.price - product.cost) / product.price) * 100 : 0

  const handleQuickAdd = () => {
    const qty = Number(quickStockQty)
    if (!qty || qty <= 0) return
    onQuickAddStock(product, qty)
    setQuickStockQty("")
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0a0f1a] border border-cyan-500/20 rounded-2xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-cyan-500/10 shrink-0">
          <h2 className="text-lg font-bold text-white">Producto encontrado</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          <div className="p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/20 space-y-1">
            <p className="text-white font-semibold text-lg">{product.name}</p>
            <p className="text-sm text-gray-400">
              {product.category}
              {product.subcategory ? ` · ${product.subcategory}` : ""}
              {product.brand ? ` · ${product.brand}` : ""}
            </p>
            {product.barcode && (
              <p className="flex items-center gap-1.5 text-xs text-gray-500 pt-1">
                <Barcode className="w-3.5 h-3.5" />
                {product.barcode}
              </p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="p-3 rounded-lg bg-white/5 border border-cyan-500/10">
              <p className="text-gray-500">Stock</p>
              <p className={`font-semibold ${product.stock <= 10 ? "text-yellow-400" : "text-white"}`}>
                {product.stock} un.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-white/5 border border-cyan-500/10">
              <p className="text-gray-500">Costo</p>
              <p className="text-white font-semibold">${product.cost.toLocaleString("es-AR")}</p>
            </div>
            <div className="p-3 rounded-lg bg-white/5 border border-cyan-500/10">
              <p className="text-gray-500">Precio</p>
              <p className="text-cyan-400 font-semibold">${product.price.toLocaleString("es-AR")}</p>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm px-1">
            <span className="text-gray-500">Margen</span>
            <span className={margin >= 30 ? "text-emerald-400" : margin >= 10 ? "text-amber-400" : "text-red-400"}>
              {margin.toFixed(1)}%
            </span>
          </div>

          {product.supplier && (
            <div className="flex items-center justify-between text-sm px-1">
              <span className="text-gray-500">Proveedor</span>
              <span className="text-gray-300">{product.supplier}</span>
            </div>
          )}

          {product.expiration_date && (
            <div className="flex items-center gap-1.5 text-sm px-1 text-gray-400">
              <CalendarClock className="w-3.5 h-3.5" />
              Vence: {new Date(product.expiration_date).toLocaleDateString("es-AR")}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm text-gray-300">Agregar stock rápido</label>
            <div className="flex gap-2">
              <Input
                type="number"
                value={quickStockQty}
                onChange={(e) => setQuickStockQty(e.target.value)}
                placeholder="Cantidad"
                className="bg-[#0d1424] border-cyan-500/20 text-white"
              />
              <Button
                type="button"
                onClick={handleQuickAdd}
                disabled={!quickStockQty || Number(quickStockQty) <= 0}
                className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold gap-2 shrink-0"
              >
                <PackagePlus className="w-4 h-4" />
                Agregar
              </Button>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onStartReception(product)
                onClose()
              }}
              className="flex-1 border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/10 bg-transparent gap-2"
            >
              <ClipboardList className="w-4 h-4" />
              Recepción
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onEdit(product)
                onClose()
              }}
              className="flex-1 border-cyan-500/20 text-gray-300 hover:bg-white/10 bg-transparent gap-2"
            >
              <Pencil className="w-4 h-4" />
              Editar ficha
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
