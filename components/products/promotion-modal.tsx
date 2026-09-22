"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X, Search, Plus, Minus, Trash2, Gift, CheckCircle2 } from "lucide-react"

interface ProductOption {
  id: string
  name: string
  price: number
  stock: number
}

export interface PromotionItemInput {
  product_id: string
  quantity: number
}

export interface Promotion {
  id: string
  name: string
  price: number
  items: (PromotionItemInput & { product_name?: string })[]
}

interface PromotionModalProps {
  open: boolean
  onClose: () => void
  promotion: Promotion | null
  products: ProductOption[]
  onSave: (promotion: { id?: string; name: string; price: number }, items: PromotionItemInput[]) => void
  onDelete?: (id: string) => void
}

export function PromotionModal({ open, onClose, promotion, products, onSave, onDelete }: PromotionModalProps) {
  const [name, setName] = useState("")
  const [price, setPrice] = useState("")
  const [items, setItems] = useState<{ product_id: string; quantity: number }[]>([])
  const [search, setSearch] = useState("")

  useEffect(() => {
    if (!open) return
    if (promotion) {
      setName(promotion.name)
      setPrice(String(promotion.price))
      setItems(promotion.items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })))
    } else {
      setName("")
      setPrice("")
      setItems([])
    }
    setSearch("")
  }, [open, promotion])

  if (!open) return null

  const productById = (id: string) => products.find((p) => p.id === id)

  const addProduct = (productId: string) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product_id === productId)
      if (existing) {
        return prev.map((i) => (i.product_id === productId ? { ...i, quantity: i.quantity + 1 } : i))
      }
      return [...prev, { product_id: productId, quantity: 1 }]
    })
  }

  const updateQty = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.product_id !== productId))
      return
    }
    setItems((prev) => prev.map((i) => (i.product_id === productId ? { ...i, quantity } : i)))
  }

  const normalTotal = items.reduce((sum, i) => sum + (productById(i.product_id)?.price || 0) * i.quantity, 0)
  const promoPrice = Number(price) || 0
  const discount = normalTotal - promoPrice
  const discountPct = normalTotal > 0 ? (discount / normalTotal) * 100 : 0

  const filteredProducts =
    search.trim().length === 0
      ? []
      : products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase())).slice(0, 8)

  const canSave = name.trim().length > 0 && items.length > 0 && promoPrice > 0

  const handleSubmit = () => {
    if (!canSave) return
    onSave({ id: promotion?.id, name: name.trim(), price: promoPrice }, items)
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0a0f1a] border border-cyan-500/20 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-cyan-500/10 shrink-0">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Gift className="w-5 h-5 text-cyan-400" />
            {promotion ? "Editar promoción" : "Nueva promoción"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="space-y-2">
            <Label className="text-gray-300">Nombre de la promoción</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: 2 Cocas + 1 Fernet"
              className="bg-[#0d1424] border-cyan-500/20 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300">Buscar productos para agregar al combo</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar producto..."
                className="pl-9 bg-[#0d1424] border-cyan-500/20 text-white"
              />
            </div>
            {filteredProducts.length > 0 && (
              <div className="rounded-lg border border-cyan-500/10 overflow-hidden">
                {filteredProducts.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      addProduct(p.id)
                      setSearch("")
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-left text-sm hover:bg-white/5 border-b border-cyan-500/5 last:border-0"
                  >
                    <span className="text-white">{p.name}</span>
                    <span className="text-cyan-400">${p.price.toLocaleString("es-AR")}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {items.length > 0 && (
            <div className="space-y-2">
              <Label className="text-gray-300">Productos del combo</Label>
              <div className="space-y-2">
                {items.map((item) => {
                  const p = productById(item.product_id)
                  if (!p) return null
                  return (
                    <div
                      key={item.product_id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-cyan-500/10"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{p.name}</p>
                        <p className="text-xs text-gray-500">${p.price.toLocaleString("es-AR")} c/u</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateQty(item.product_id, item.quantity - 1)}
                          className="w-7 h-7 rounded-md bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-6 text-center text-sm text-white">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQty(item.product_id, item.quantity + 1)}
                          className="w-7 h-7 rounded-md bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => updateQty(item.product_id, 0)}
                        className="w-7 h-7 rounded-md flex items-center justify-center text-gray-500 hover:text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-gray-300">Precio de la promoción</Label>
            <Input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Ej: 3500"
              className="bg-[#0d1424] border-cyan-500/20 text-white text-lg"
            />
          </div>

          {items.length > 0 && promoPrice > 0 && (
            <div className="p-4 rounded-lg bg-white/5 border border-cyan-500/10 space-y-1 text-sm">
              <div className="flex justify-between text-gray-400">
                <span>Precio normal sumado</span>
                <span>${normalTotal.toLocaleString("es-AR")}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Precio de la promoción</span>
                <span className="text-cyan-400">${promoPrice.toLocaleString("es-AR")}</span>
              </div>
              <div className="flex justify-between font-semibold pt-1 border-t border-cyan-500/10">
                <span className={discount >= 0 ? "text-emerald-400" : "text-red-400"}>Descuento</span>
                <span className={discount >= 0 ? "text-emerald-400" : "text-red-400"}>
                  ${discount.toLocaleString("es-AR")} ({discountPct.toFixed(0)}%)
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-cyan-500/10 shrink-0 flex gap-3">
          {promotion && onDelete && (
            <Button
              type="button"
              variant="outline"
              onClick={() => onDelete(promotion.id)}
              className="border-red-500/30 text-red-400 hover:bg-red-500/10 bg-transparent"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1 border-cyan-500/20 text-gray-400 hover:text-white bg-transparent"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!canSave}
            className="flex-1 gap-2 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold"
          >
            <CheckCircle2 className="w-4 h-4" />
            {promotion ? "Guardar cambios" : "Crear promoción"}
          </Button>
        </div>
      </div>
    </div>
  )
}
