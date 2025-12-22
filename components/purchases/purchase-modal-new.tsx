"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Plus, Trash2, Package, ShoppingBag } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface Product {
  id: string
  name: string
  category: string
  cost: number
  stock_quantity: number
}

interface PurchaseItem {
  product: Product
  quantity: number
  unitCost: number
}

interface PurchaseModalProps {
  open: boolean
  onClose: () => void
  kioskoId: string
  onSuccess: () => void
}

const defaultSuppliers = [
  "Coca-Cola", 
  "Pepsico", 
  "Mondelez", 
  "Philip Morris", 
  "Red Bull", 
  "La Serenísima", 
  "Arcor", 
  "Danone", 
  "Nestlé",
  "Otro proveedor"
]

export function PurchaseModalNew({ open, onClose, kioskoId, onSuccess }: PurchaseModalProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [items, setItems] = useState<PurchaseItem[]>([])
  const [supplier, setSupplier] = useState("")
  const [customSupplier, setCustomSupplier] = useState("")
  const [notes, setNotes] = useState("")
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
        ).slice(0, 8)
      )
    } else {
      setFilteredProducts([])
    }
  }, [searchQuery, products])

  const loadProducts = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("products")
      .select("id, name, category, cost, stock_quantity")
      .eq("kiosko_id", kioskoId)
      .eq("is_active", true)
      .order("name")

    if (!error && data) {
      setProducts(data)
    }
    setLoading(false)
  }

  const addProduct = (product: Product) => {
    const existing = items.find(i => i.product.id === product.id)
    if (existing) {
      setItems(items.map(i => 
        i.product.id === product.id 
          ? { ...i, quantity: i.quantity + 1 }
          : i
      ))
    } else {
      setItems([...items, { 
        product, 
        quantity: 1, 
        unitCost: product.cost || 0 
      }])
    }
    setSearchQuery("")
  }

  const updateItemQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId)
    } else {
      setItems(items.map(i => 
        i.product.id === productId ? { ...i, quantity } : i
      ))
    }
  }

  const updateItemCost = (productId: string, unitCost: number) => {
    setItems(items.map(i => 
      i.product.id === productId ? { ...i, unitCost } : i
    ))
  }

  const removeItem = (productId: string) => {
    setItems(items.filter(i => i.product.id !== productId))
  }

  const total = items.reduce((sum, i) => sum + (i.quantity * i.unitCost), 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (items.length === 0 || !supplier) return

    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const supplierName = supplier === "Otro proveedor" ? customSupplier : supplier
      const purchaseNumber = `C-${Date.now()}`

      // 1. Create purchase record
      const { data: purchase, error: purchaseError } = await supabase
        .from("purchases")
        .insert({
          kiosko_id: kioskoId,
          supplier_name: supplierName,
          purchase_number: purchaseNumber,
          total_amount: total,
          status: "completed",
          notes: notes || null,
        })
        .select()
        .single()

      if (purchaseError) throw purchaseError

      // 2. Create purchase items
      const purchaseItems = items.map(item => ({
        purchase_id: purchase.id,
        product_id: item.product.id,
        quantity: item.quantity,
        unit_cost: item.unitCost,
        subtotal: item.quantity * item.unitCost,
      }))

      const { error: itemsError } = await supabase
        .from("purchase_items")
        .insert(purchaseItems)

      if (itemsError) throw itemsError

      // 3. Update stock and create movements for each product
      for (const item of items) {
        // Create stock movement
        await supabase.from("stock_movements").insert({
          product_id: item.product.id,
          kiosko_id: kioskoId,
          movement_type: "purchase",
          quantity: item.quantity,
          reason: `Compra ${purchaseNumber} - ${supplierName}`,
          reference_id: purchase.id,
          created_by: user?.id,
        })

        // Update product stock
        const newStock = item.product.stock_quantity + item.quantity
        await supabase
          .from("products")
          .update({ 
            stock_quantity: newStock,
            cost: item.unitCost, // Update cost with latest purchase price
            updated_at: new Date().toISOString()
          })
          .eq("id", item.product.id)
      }

      // Reset form
      setItems([])
      setSupplier("")
      setCustomSupplier("")
      setNotes("")
      setSearchQuery("")
      
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error("Error saving purchase:", error)
      alert("Error al guardar la compra: " + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleClose = () => {
    setItems([])
    setSupplier("")
    setCustomSupplier("")
    setNotes("")
    setSearchQuery("")
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-[#0a0f1a] border-cyan-500/20 text-white max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-cyan-400" />
            Nueva Orden de Compra
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="space-y-4 overflow-y-auto flex-1 pr-2">
            {/* Supplier */}
            <div className="space-y-2">
              <Label className="text-gray-300">Proveedor</Label>
              <Select value={supplier} onValueChange={setSupplier}>
                <SelectTrigger className="bg-[#0d1424] border-cyan-500/20 text-white">
                  <SelectValue placeholder="Seleccionar proveedor..." />
                </SelectTrigger>
                <SelectContent className="bg-[#0d1424] border-cyan-500/20">
                  {defaultSuppliers.map((s) => (
                    <SelectItem key={s} value={s} className="text-white hover:bg-white/10">
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {supplier === "Otro proveedor" && (
                <Input
                  placeholder="Nombre del proveedor..."
                  value={customSupplier}
                  onChange={(e) => setCustomSupplier(e.target.value)}
                  className="bg-[#0d1424] border-cyan-500/20 text-white mt-2"
                />
              )}
            </div>

            {/* Product Search */}
            <div className="space-y-2">
              <Label className="text-gray-300">Agregar productos</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  type="text"
                  placeholder="Buscar producto para agregar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-[#0d1424] border-cyan-500/20 text-white"
                />
              </div>
              {filteredProducts.length > 0 && (
                <div className="rounded-lg border border-cyan-500/10 bg-[#0d1424] max-h-40 overflow-y-auto">
                  {filteredProducts.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => addProduct(product)}
                      className="w-full text-left p-3 hover:bg-cyan-500/10 transition-colors border-b border-cyan-500/5 last:border-0 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-white text-sm font-medium">{product.name}</p>
                        <span className="text-xs text-gray-500">{product.category}</span>
                      </div>
                      <Plus className="w-4 h-4 text-cyan-400" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Items List */}
            {items.length > 0 && (
              <div className="space-y-2">
                <Label className="text-gray-300">Productos en la compra ({items.length})</Label>
                <div className="rounded-lg border border-cyan-500/10 bg-[#0d1424] divide-y divide-cyan-500/10">
                  {items.map((item) => (
                    <div key={item.product.id} className="p-3 flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-cyan-500/10 flex items-center justify-center">
                        <Package className="w-4 h-4 text-cyan-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{item.product.name}</p>
                        <p className="text-xs text-gray-500">
                          Stock actual: {item.product.stock_quantity} → 
                          <span className="text-green-400"> {item.product.stock_quantity + item.quantity}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Cantidad</p>
                          <Input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) => updateItemQuantity(item.product.id, Number(e.target.value))}
                            className="w-16 h-8 text-center bg-[#0a0f1a] border-cyan-500/20 text-white text-sm"
                          />
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Costo unit.</p>
                          <Input
                            type="number"
                            min={0}
                            step={0.01}
                            value={item.unitCost}
                            onChange={(e) => updateItemCost(item.product.id, Number(e.target.value))}
                            className="w-20 h-8 text-right bg-[#0a0f1a] border-cyan-500/20 text-white text-sm"
                          />
                        </div>
                        <div className="text-right w-20">
                          <p className="text-xs text-gray-500">Subtotal</p>
                          <p className="text-sm font-medium text-cyan-400">
                            ${(item.quantity * item.unitCost).toLocaleString()}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(item.product.id)}
                          className="text-gray-400 hover:text-red-400 h-8 w-8"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label className="text-gray-300">Notas (opcional)</Label>
              <Input
                placeholder="Factura #, observaciones..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="bg-[#0d1424] border-cyan-500/20 text-white"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 mt-4 border-t border-cyan-500/10 space-y-4">
            {/* Total */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
              <span className="text-gray-300">Total de la compra:</span>
              <span className="text-2xl font-bold text-cyan-400">${total.toLocaleString()}</span>
            </div>

            {/* Info about stock */}
            {items.length > 0 && (
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-sm text-green-300">
                ✓ Al confirmar, se agregará automáticamente el stock de {items.length} producto(s) y se registrará el movimiento.
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
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
                disabled={items.length === 0 || !supplier || (supplier === "Otro proveedor" && !customSupplier) || saving}
                className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold"
              >
                {saving ? "Guardando..." : "Confirmar Compra"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
