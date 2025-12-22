"use client"

import { Button } from "@/components/ui/button"
import { ShoppingCart, Trash2, Minus, Plus, X } from "lucide-react"
import type { CartItem } from "@/app/dashboard/ventas/page"

interface CartProps {
  items: CartItem[]
  subtotal: number
  tax: number
  total: number
  onUpdateQuantity: (id: string, quantity: number) => void
  onRemove: (id: string) => void
  onClear: () => void
  onCheckout: () => void
}

export function Cart({ items, subtotal, tax, total, onUpdateQuantity, onRemove, onClear, onCheckout }: CartProps) {
  return (
    <div className="w-96 flex flex-col rounded-xl border border-cyan-500/10 bg-[#0a0f1a]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-cyan-500/10">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-cyan-400" />
          <h2 className="font-semibold text-white">Carrito</h2>
          {items.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 text-xs">{items.length}</span>
          )}
        </div>
        {items.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="text-gray-400 hover:text-red-400 hover:bg-red-500/10"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <ShoppingCart className="w-12 h-12 mb-3 opacity-50" />
            <p className="text-sm">El carrito está vacío</p>
            <p className="text-xs mt-1">Agrega productos para comenzar</p>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-cyan-500/10">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{item.name}</p>
                <p className="text-sm text-cyan-400">${item.price.toLocaleString()}</p>
              </div>

              {/* Quantity controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                  className="w-7 h-7 rounded-md bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center text-sm text-white">{item.quantity}</span>
                <button
                  onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                  disabled={item.quantity >= item.stock}
                  className="w-7 h-7 rounded-md bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => onRemove(item.id)}
                className="w-7 h-7 rounded-md flex items-center justify-center text-gray-500 hover:text-red-400 hover:bg-red-500/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Summary */}
      {items.length > 0 && (
        <div className="p-4 border-t border-cyan-500/10 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Subtotal</span>
            <span className="text-white">${subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">IVA (21%)</span>
            <span className="text-white">${tax.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-lg font-bold pt-2 border-t border-cyan-500/10">
            <span className="text-white">Total</span>
            <span className="text-cyan-400">${total.toLocaleString()}</span>
          </div>

          <Button
            onClick={onCheckout}
            className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-semibold py-5 mt-2"
          >
            Cobrar
          </Button>
        </div>
      )}
    </div>
  )
}
