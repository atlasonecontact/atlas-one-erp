"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Product {
  id: number
  name: string
  category: string
  cost: number
  price: number
  stock: number
  status: string
}

interface ProductModalProps {
  open: boolean
  onClose: () => void
  product: Product | null
  onSave: (product: Product) => void
}

const categories = [
  "Bebidas",
  "Bebidas Alcohólicas",
  "Snacks",
  "Golosinas",
  "Cigarrillos",
  "Energizantes",
  "Lácteos",
  "Panadería",
]

export function ProductModal({ open, onClose, product, onSave }: ProductModalProps) {
  const [formData, setFormData] = useState<Product>({
    id: 0,
    name: "",
    category: "Bebidas",
    cost: 0,
    price: 0,
    stock: 0,
    status: "active",
  })

  useEffect(() => {
    if (product) {
      setFormData(product)
    } else {
      setFormData({
        id: 0,
        name: "",
        category: "Bebidas",
        cost: 0,
        price: 0,
        stock: 0,
        status: "active",
      })
    }
  }, [product])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#0a0f1a] border-cyan-500/20 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{product ? "Editar Producto" : "Nuevo Producto"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-gray-300">Nombre del producto</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej: Gaseosa Cola 500ml"
              className="bg-[#0d1424] border-cyan-500/20 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300">Categoría</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
              <SelectTrigger className="bg-[#0d1424] border-cyan-500/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#0d1424] border-cyan-500/20">
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat} className="text-white hover:bg-white/10">
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Costo</Label>
              <Input
                type="number"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: Number(e.target.value) })}
                className="bg-[#0d1424] border-cyan-500/20 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Precio de venta</Label>
              <Input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                className="bg-[#0d1424] border-cyan-500/20 text-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300">Stock inicial</Label>
            <Input
              type="number"
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
              className="bg-[#0d1424] border-cyan-500/20 text-white"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-cyan-500/20 text-gray-400 hover:text-white bg-transparent"
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold">
              {product ? "Guardar Cambios" : "Crear Producto"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
