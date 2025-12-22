"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Package, Plus, Minus, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface Product {
  id: string
  name: string
  category: string
  stock_quantity: number
}

interface StockMovementModalProps {
  open: boolean
  onClose: () => void
  kioskoId: string
  onSuccess: () => void
}

export function StockMovementModal({ open, onClose, kioskoId, onSuccess }: StockMovementModalProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [movementType, setMovementType] = useState<"in" | "out">("in")
  const [quantity, setQuantity] = useState<number>(1)
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    if (open && kioskoId) {
      loadProducts()
    }
  }, [open, kioskoId])

  useEffect(() => {
    if (searchQuery.trim()) {
      setFilteredProducts(
        products.filter(p => 
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.category.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    } else {
      setFilteredProducts(products.slice(0, 10))
    }
  }, [searchQuery, products])

  const loadProducts = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("products")
      .select("id, name, category, stock_quantity")
      .eq("kiosko_id", kioskoId)
      .eq("is_active", true)
      .order("name")

    if (!error && data) {
      setProducts(data)
      setFilteredProducts(data.slice(0, 10))
    }
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProduct || quantity <= 0) return

    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      // 1. Create stock movement
      const { error: movementError } = await supabase
        .from("stock_movements")
        .insert({
          product_id: selectedProduct.id,
          kiosko_id: kioskoId,
          movement_type: movementType,
          quantity: quantity,
          reason: reason || (movementType === "in" ? "Ingreso manual" : "Salida manual"),
          created_by: user?.id,
        })

      if (movementError) throw movementError

      // 2. Update product stock
      const newStock = movementType === "in" 
        ? selectedProduct.stock_quantity + quantity
        : Math.max(0, selectedProduct.stock_quantity - quantity)

      const { error: updateError } = await supabase
        .from("products")
        .update({ 
          stock_quantity: newStock,
          updated_at: new Date().toISOString()
        })
        .eq("id", selectedProduct.id)

      if (updateError) throw updateError

      // Reset form
      setSelectedProduct(null)
      setQuantity(1)
      setReason("")
      setSearchQuery("")
      
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error("Error saving movement:", error)
      alert("Error al guardar el movimiento: " + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleClose = () => {
    setSelectedProduct(null)
    setQuantity(1)
    setReason("")
    setSearchQuery("")
    onClose()
  }

  const reasons = {
    in: [
      "Compra a proveedor",
      "Devolución de cliente",
      "Ajuste de inventario",
      "Transferencia entre sucursales",
      "Donación recibida",
      "Otro"
    ],
    out: [
      "Venta (sin registrar)",
      "Producto dañado",
      "Producto vencido",
      "Robo/Pérdida",
      "Donación",
      "Ajuste de inventario",
      "Otro"
    ]
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-[#0a0f1a] border-cyan-500/20 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Package className="w-5 h-5 text-cyan-400" />
            Movimiento de Stock
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-2">
          {/* Movement Type */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setMovementType("in")}
              className={`p-4 rounded-xl border-2 transition-all ${
                movementType === "in"
                  ? "border-green-500 bg-green-500/10"
                  : "border-cyan-500/20 bg-transparent hover:border-cyan-500/40"
              }`}
            >
              <div className="flex items-center justify-center gap-2 mb-1">
                <ArrowUpRight className={`w-5 h-5 ${movementType === "in" ? "text-green-400" : "text-gray-400"}`} />
                <Plus className={`w-4 h-4 ${movementType === "in" ? "text-green-400" : "text-gray-400"}`} />
              </div>
              <p className={`text-sm font-medium ${movementType === "in" ? "text-green-400" : "text-gray-400"}`}>
                Entrada
              </p>
              <p className="text-xs text-gray-500 mt-1">Agregar stock</p>
            </button>
            <button
              type="button"
              onClick={() => setMovementType("out")}
              className={`p-4 rounded-xl border-2 transition-all ${
                movementType === "out"
                  ? "border-red-500 bg-red-500/10"
                  : "border-cyan-500/20 bg-transparent hover:border-cyan-500/40"
              }`}
            >
              <div className="flex items-center justify-center gap-2 mb-1">
                <ArrowDownRight className={`w-5 h-5 ${movementType === "out" ? "text-red-400" : "text-gray-400"}`} />
                <Minus className={`w-4 h-4 ${movementType === "out" ? "text-red-400" : "text-gray-400"}`} />
              </div>
              <p className={`text-sm font-medium ${movementType === "out" ? "text-red-400" : "text-gray-400"}`}>
                Salida
              </p>
              <p className="text-xs text-gray-500 mt-1">Quitar stock</p>
            </button>
          </div>

          {/* Product Search */}
          <div className="space-y-2">
            <Label className="text-gray-300">Producto</Label>
            {selectedProduct ? (
              <div className="flex items-center justify-between p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                <div>
                  <p className="text-white font-medium">{selectedProduct.name}</p>
                  <p className="text-xs text-gray-400">
                    Stock actual: <span className="text-cyan-400 font-mono">{selectedProduct.stock_quantity}</span> unidades
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedProduct(null)}
                  className="text-gray-400 hover:text-white"
                >
                  Cambiar
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    type="text"
                    placeholder="Buscar producto..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-[#0d1424] border-cyan-500/20 text-white"
                  />
                </div>
                <div className="max-h-40 overflow-y-auto rounded-lg border border-cyan-500/10 bg-[#0d1424]">
                  {loading ? (
                    <p className="p-3 text-gray-500 text-sm text-center">Cargando productos...</p>
                  ) : filteredProducts.length === 0 ? (
                    <p className="p-3 text-gray-500 text-sm text-center">No se encontraron productos</p>
                  ) : (
                    filteredProducts.map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => setSelectedProduct(product)}
                        className="w-full text-left p-3 hover:bg-cyan-500/10 transition-colors border-b border-cyan-500/5 last:border-0"
                      >
                        <p className="text-white text-sm font-medium">{product.name}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-gray-500">{product.category}</span>
                          <span className="text-xs text-cyan-400">Stock: {product.stock_quantity}</span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <Label className="text-gray-300">Cantidad</Label>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="border-cyan-500/20 text-gray-400 hover:text-white bg-transparent"
              >
                <Minus className="w-4 h-4" />
              </Button>
              <Input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                className="w-24 text-center bg-[#0d1424] border-cyan-500/20 text-white text-xl font-mono"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setQuantity(quantity + 1)}
                className="border-cyan-500/20 text-gray-400 hover:text-white bg-transparent"
              >
                <Plus className="w-4 h-4" />
              </Button>
              <div className="flex gap-1 ml-2">
                {[5, 10, 25, 50].map(n => (
                  <Button
                    key={n}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(n)}
                    className="border-cyan-500/20 text-gray-400 hover:text-white bg-transparent px-2"
                  >
                    +{n}
                  </Button>
                ))}
              </div>
            </div>
            {selectedProduct && movementType === "out" && quantity > selectedProduct.stock_quantity && (
              <p className="text-xs text-red-400">
                ⚠️ La cantidad es mayor al stock actual ({selectedProduct.stock_quantity})
              </p>
            )}
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label className="text-gray-300">Motivo</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="bg-[#0d1424] border-cyan-500/20 text-white">
                <SelectValue placeholder="Seleccionar motivo..." />
              </SelectTrigger>
              <SelectContent className="bg-[#0d1424] border-cyan-500/20">
                {reasons[movementType].map((r) => (
                  <SelectItem key={r} value={r} className="text-white hover:bg-white/10">
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Preview */}
          {selectedProduct && (
            <div className={`p-3 rounded-lg border ${
              movementType === "in" 
                ? "bg-green-500/10 border-green-500/20" 
                : "bg-red-500/10 border-red-500/20"
            }`}>
              <p className="text-sm text-gray-300">
                {movementType === "in" ? "Nuevo stock:" : "Stock resultante:"}
              </p>
              <p className={`text-2xl font-bold font-mono ${
                movementType === "in" ? "text-green-400" : "text-red-400"
              }`}>
                {movementType === "in" 
                  ? selectedProduct.stock_quantity + quantity
                  : Math.max(0, selectedProduct.stock_quantity - quantity)
                } unidades
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1 border-cyan-500/20 text-gray-400 hover:text-white bg-transparent"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!selectedProduct || quantity <= 0 || saving}
              className={`flex-1 font-semibold ${
                movementType === "in"
                  ? "bg-green-500 hover:bg-green-400 text-black"
                  : "bg-red-500 hover:bg-red-400 text-white"
              }`}
            >
              {saving ? "Guardando..." : movementType === "in" ? "Agregar Stock" : "Quitar Stock"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
