"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScanLine, Loader2 } from "lucide-react"
import { CameraScanner } from "@/components/mobile/camera-scanner"
import { useToast } from "@/components/ui/toast-provider"

interface Product {
  id: string
  name: string
  category: string
  cost: number
  price: number
  stock: number
  barcode?: string
  status: string
}

interface ProductModalProps {
  open: boolean
  onClose: () => void
  product: Product | null
  onSave: (product: Product) => void
  products?: Product[]
  onProductMatched?: (product: Product) => void
}

const categoryKeywords: Array<{ category: string; keywords: string[] }> = [
  { category: "Lácteos", keywords: ["dairies", "dairy", "milk", "cheese", "yogurt", "dulce-de-leche"] },
  { category: "Bebidas Alcohólicas", keywords: ["beer", "wine", "alcoholic", "cerveza", "vino"] },
  { category: "Energizantes", keywords: ["energy-drink", "energy-drinks"] },
  { category: "Bebidas", keywords: ["beverages", "drinks", "waters", "sodas", "juices", "bebida"] },
  { category: "Golosinas", keywords: ["candies", "chocolates", "sweets", "golosina"] },
  { category: "Snacks", keywords: ["snacks", "chips", "crackers"] },
  { category: "Panadería", keywords: ["breads", "bakery", "pastries", "pan"] },
]

function guessCategory(tags: string[]): string | null {
  const lowerTags = tags.map((t) => t.toLowerCase())
  for (const { category, keywords } of categoryKeywords) {
    if (keywords.some((kw) => lowerTags.some((tag) => tag.includes(kw)))) {
      return category
    }
  }
  return null
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

export function ProductModal({ open, onClose, product, onSave, products = [], onProductMatched }: ProductModalProps) {
  const toast = useToast()
  const [formData, setFormData] = useState<Product>({
    id: "",
    name: "",
    category: "Bebidas",
    cost: 0,
    price: 0,
    stock: 0,
    barcode: "",
    status: "active",
  })
  const [showScanner, setShowScanner] = useState(false)
  const [isLookingUp, setIsLookingUp] = useState(false)

  useEffect(() => {
    if (product) {
      setFormData(product)
    } else {
      setFormData({
        id: "",
        name: "",
        category: "Bebidas",
        cost: 0,
        price: 0,
        stock: 0,
        barcode: "",
        status: "active",
      })
    }
  }, [product])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  const lookupExternal = async (code: string) => {
    setIsLookingUp(true)
    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${code}.json`)
      const data = await res.json()

      if (data.status === 1 && data.product) {
        const p = data.product
        const baseName = p.product_name_es || p.product_name || ""
        const brand = (p.brands || "").split(",")[0].trim()
        const quantity = p.quantity || ""

        if (baseName) {
          const fullName = [brand, baseName, quantity].filter(Boolean).join(" ")
          const guessedCategory = guessCategory(p.categories_tags || [])

          setFormData((prev) => ({
            ...prev,
            name: fullName,
            category: guessedCategory || prev.category,
          }))
          toast.success("Producto encontrado", fullName)
        } else {
          setFormData((prev) => ({ ...prev, name: `Producto ${code}` }))
          toast.info("Código escaneado", "No encontramos el nombre, editá el que pusimos por defecto")
        }
      } else {
        setFormData((prev) => ({ ...prev, name: `Producto ${code}` }))
        toast.info("Código escaneado", "Producto no encontrado en la base de datos, editá el nombre por defecto")
      }
    } catch {
      setFormData((prev) => ({ ...prev, name: `Producto ${code}` }))
      toast.warning("No se pudo buscar el producto", "Revisá tu conexión y editá el nombre por defecto")
    } finally {
      setIsLookingUp(false)
    }
  }

  const handleBarcodeScanned = (code: string) => {
    setShowScanner(false)

    const existing = products.find((p) => p.barcode && p.barcode === code)
    if (existing) {
      setFormData(existing)
      onProductMatched?.(existing)
      toast.info("Ya tenés este producto cargado", `${existing.name} · Stock actual: ${existing.stock}`)
      return
    }

    setFormData((prev) => ({ ...prev, barcode: code }))
    lookupExternal(code)
  }

  return (
    <>
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

          <div className="space-y-2">
            <Label className="text-gray-300">Código de barras (opcional)</Label>
            <div className="flex gap-2">
              <Input
                value={formData.barcode || ""}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                placeholder="Ej: 7790001234567"
                className="bg-[#0d1424] border-cyan-500/20 text-white"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowScanner(true)}
                disabled={isLookingUp}
                className="border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300 bg-transparent shrink-0 px-3"
              >
                {isLookingUp ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanLine className="w-4 h-4" />}
              </Button>
            </div>
            {isLookingUp && <p className="text-xs text-cyan-400">Buscando producto...</p>}
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

    <CameraScanner isOpen={showScanner} onClose={() => setShowScanner(false)} onScan={handleBarcodeScanned} />
    </>
  )
}
