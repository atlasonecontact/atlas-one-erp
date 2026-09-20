"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScanLine, Loader2, Plus, Trash2, PackagePlus, ClipboardList, Pencil } from "lucide-react"
import { CameraScanner } from "@/components/mobile/camera-scanner"
import { useToast } from "@/components/ui/toast-provider"
import { createClient } from "@/lib/supabase/client"

export interface ProductLot {
  id?: string
  lot_number: string
  quantity: number
  expiration_date: string
}

export interface Product {
  id: string
  name: string
  sku?: string
  brand?: string
  variant?: string
  presentation?: string
  category: string
  subcategory?: string
  supplier?: string
  net_content?: number
  unit?: string
  cost: number
  cost_ex_vat?: number
  cost_inc_vat?: number
  vat_rate?: number
  price: number
  stock: number
  min_stock?: number
  max_stock?: number
  barcode?: string
  status: string
  kiosko_id?: string
  track_expiration?: boolean
  expiration_date?: string | null
  lots?: ProductLot[]
}

interface ProductModalProps {
  open: boolean
  onClose: () => void
  product: Product | null
  onSave: (product: Product, lots: ProductLot[]) => void
  products?: Product[]
  onProductMatched?: (product: Product) => void
  onQuickAddStock?: (product: Product, quantity: number) => void
  onStartReception?: (product: Product) => void
  initialBarcode?: string
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

const EMPTY_PRODUCT: Product = {
  id: "",
  name: "",
  sku: "",
  brand: "",
  variant: "",
  presentation: "",
  category: "Bebidas",
  subcategory: "",
  supplier: "",
  net_content: undefined,
  unit: "",
  cost: 0,
  vat_rate: 21,
  price: 0,
  stock: 0,
  min_stock: undefined,
  max_stock: undefined,
  barcode: "",
  status: "active",
  track_expiration: false,
  expiration_date: null,
}

export function ProductModal({
  open,
  onClose,
  product,
  onSave,
  products = [],
  onProductMatched,
  onQuickAddStock,
  onStartReception,
  initialBarcode,
}: ProductModalProps) {
  const toast = useToast()
  const [formData, setFormData] = useState<Product>(EMPTY_PRODUCT)
  const [lots, setLots] = useState<ProductLot[]>([])
  const [showLots, setShowLots] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const [isLookingUp, setIsLookingUp] = useState(false)
  const [matchedProduct, setMatchedProduct] = useState<Product | null>(null)
  const [quickStockQty, setQuickStockQty] = useState("")

  useEffect(() => {
    if (open) {
      setMatchedProduct(null)
      setQuickStockQty("")
      if (product) {
        setFormData(product)
        setLots(product.lots || [])
        setShowLots(!!(product.lots && product.lots.length > 0))
      } else {
        setFormData(initialBarcode ? { ...EMPTY_PRODUCT, barcode: initialBarcode } : EMPTY_PRODUCT)
        setLots([])
        setShowLots(false)
      }
    }
  }, [product, open, initialBarcode])

  const margin = formData.price > 0 ? ((formData.price - formData.cost) / formData.price) * 100 : 0

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trackExpiration = showLots || !!formData.expiration_date
    onSave({ ...formData, track_expiration: trackExpiration }, showLots ? lots : [])
  }

  const addLot = () => {
    setLots((prev) => [...prev, { lot_number: "", quantity: 0, expiration_date: "" }])
  }

  const updateLot = (index: number, field: keyof ProductLot, value: string | number) => {
    setLots((prev) => prev.map((lot, i) => (i === index ? { ...lot, [field]: value } : lot)))
  }

  const removeLot = (index: number) => {
    setLots((prev) => prev.filter((_, i) => i !== index))
  }

  const lotsTotal = lots.reduce((sum, l) => sum + (Number(l.quantity) || 0), 0)

  const lookupSharedCatalog = async (code: string): Promise<{ name: string; category?: string } | null> => {
    const supabase = createClient()
    const { data } = await supabase.from("barcode_catalog").select("name, category").eq("barcode", code).maybeSingle()
    return data?.name ? { name: data.name, category: data.category ?? undefined } : null
  }

  const lookupOpenFoodFacts = async (code: string): Promise<{ name: string; category?: string } | null> => {
    const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${code}.json`)
    const data = await res.json()
    if (data.status !== 1 || !data.product) return null

    const p = data.product
    const baseName = p.product_name_es || p.product_name || ""
    if (!baseName) return null

    const brand = (p.brands || "").split(",")[0].trim()
    const quantity = p.quantity || ""
    const fullName = [brand, baseName, quantity].filter(Boolean).join(" ")
    return { name: fullName, category: guessCategory(p.categories_tags || []) ?? undefined }
  }

  const lookupUpcItemDb = async (code: string): Promise<{ name: string } | null> => {
    const res = await fetch(`/api/barcode-lookup?upc=${code}`)
    const data = await res.json()
    const item = data.items?.[0]
    if (!item?.title) return null

    const brand = (item.brand || "").trim()
    const name =
      brand && !item.title.toLowerCase().startsWith(brand.toLowerCase()) ? `${brand} ${item.title}` : item.title
    return { name }
  }

  const lookupExternal = async (code: string) => {
    setIsLookingUp(true)
    try {
      const found =
        (await lookupSharedCatalog(code).catch(() => null)) ??
        (await lookupOpenFoodFacts(code).catch(() => null)) ??
        (await lookupUpcItemDb(code).catch(() => null))

      if (found) {
        setFormData((prev) => ({
          ...prev,
          name: found.name,
          category: found.category || prev.category,
        }))
        toast.success("Producto encontrado", found.name)
      } else {
        setFormData((prev) => ({ ...prev, name: `Producto ${code}` }))
        toast.info("Código escaneado", "No lo encontramos en ninguna base, editá el nombre por defecto")
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
    checkBarcode(code)
  }

  const checkBarcode = (code: string) => {
    const existing = products.find((p) => p.barcode && p.barcode === code && p.id !== formData.id)
    if (existing) {
      setMatchedProduct(existing)
      onProductMatched?.(existing)
      return
    }
    setFormData((prev) => ({ ...prev, barcode: code }))
    lookupExternal(code)
  }

  const handleBarcodeBlur = () => {
    if (formData.barcode && formData.barcode.trim().length >= 6) {
      checkBarcode(formData.barcode.trim())
    }
  }

  const handleQuickAddStock = () => {
    const qty = Number(quickStockQty)
    if (!matchedProduct || !qty || qty <= 0) return
    onQuickAddStock?.(matchedProduct, qty)
    setQuickStockQty("")
    setMatchedProduct(null)
    onClose()
  }

  const handleStartReception = () => {
    if (!matchedProduct) return
    onStartReception?.(matchedProduct)
    setMatchedProduct(null)
    onClose()
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="bg-[#0a0f1a] border-cyan-500/20 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          {matchedProduct ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">Ya tenés este producto cargado</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/20 space-y-1">
                  <p className="text-white font-semibold text-lg">{matchedProduct.name}</p>
                  <p className="text-sm text-gray-400">
                    {matchedProduct.category}
                    {matchedProduct.brand ? ` · ${matchedProduct.brand}` : ""}
                  </p>
                  <div className="grid grid-cols-3 gap-3 pt-2 text-sm">
                    <div>
                      <p className="text-gray-500">Stock actual</p>
                      <p className="text-white font-medium">{matchedProduct.stock} un.</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Costo</p>
                      <p className="text-white font-medium">${matchedProduct.cost.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Precio</p>
                      <p className="text-white font-medium">${matchedProduct.price.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300">Agregar stock rápido</Label>
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
                      onClick={handleQuickAddStock}
                      disabled={!quickStockQty || Number(quickStockQty) <= 0}
                      className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold gap-2 shrink-0"
                    >
                      <PackagePlus className="w-4 h-4" />
                      Agregar Stock
                    </Button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleStartReception}
                    className="flex-1 border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/10 bg-transparent gap-2"
                  >
                    <ClipboardList className="w-4 h-4" />
                    Iniciar Recepción
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setFormData(matchedProduct)
                      setLots(matchedProduct.lots || [])
                      setShowLots(!!(matchedProduct.lots && matchedProduct.lots.length > 0))
                      setMatchedProduct(null)
                    }}
                    className="flex-1 border-cyan-500/20 text-gray-300 hover:bg-white/10 bg-transparent gap-2"
                  >
                    <Pencil className="w-4 h-4" />
                    Editar ficha
                  </Button>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setMatchedProduct(null)}
                  className="w-full text-gray-500 hover:text-white"
                >
                  Cancelar
                </Button>
              </div>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">{product ? "Editar Producto" : "Nuevo Producto"}</DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Código de barras / EAN-13</Label>
                  <div className="flex gap-2">
                    <Input
                      value={formData.barcode || ""}
                      onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                      onBlur={handleBarcodeBlur}
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

                <div className="space-y-2">
                  <Label className="text-gray-300">Nombre del producto</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej: Gaseosa Cola 500ml"
                    className="bg-[#0d1424] border-cyan-500/20 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-300">Marca</Label>
                    <Input
                      value={formData.brand || ""}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      placeholder="Ej: Coca-Cola"
                      className="bg-[#0d1424] border-cyan-500/20 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-300">Línea / Variante</Label>
                    <Input
                      value={formData.variant || ""}
                      onChange={(e) => setFormData({ ...formData, variant: e.target.value })}
                      placeholder="Ej: Zero"
                      className="bg-[#0d1424] border-cyan-500/20 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-300">Categoría</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
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
                  <div className="space-y-2">
                    <Label className="text-gray-300">Subcategoría</Label>
                    <Input
                      value={formData.subcategory || ""}
                      onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                      placeholder="Ej: Gaseosas"
                      className="bg-[#0d1424] border-cyan-500/20 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300">Proveedor</Label>
                  <Input
                    value={formData.supplier || ""}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    placeholder="Ej: Distribuidora Norte"
                    className="bg-[#0d1424] border-cyan-500/20 text-white"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
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
                  <div className="space-y-2">
                    <Label className="text-gray-300">Margen</Label>
                    <div className="h-10 flex items-center px-3 rounded-md bg-[#0d1424] border border-cyan-500/20 text-cyan-400 font-medium">
                      {margin.toFixed(1)}%
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-300">IVA (%)</Label>
                    <Input
                      type="number"
                      value={formData.vat_rate ?? ""}
                      onChange={(e) => setFormData({ ...formData, vat_rate: Number(e.target.value) })}
                      placeholder="Ej: 21"
                      className="bg-[#0d1424] border-cyan-500/20 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-300">Unidad de medida</Label>
                    <Input
                      value={formData.unit || ""}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      placeholder="Ej: unidad, kg, l"
                      className="bg-[#0d1424] border-cyan-500/20 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-300">Stock inicial</Label>
                    <Input
                      type="number"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                      disabled={showLots}
                      className="bg-[#0d1424] border-cyan-500/20 text-white disabled:opacity-50"
                    />
                    {showLots && <p className="text-xs text-gray-500">Se calcula de los lotes: {lotsTotal}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-300">Stock mínimo</Label>
                    <Input
                      type="number"
                      value={formData.min_stock ?? ""}
                      onChange={(e) => setFormData({ ...formData, min_stock: Number(e.target.value) })}
                      className="bg-[#0d1424] border-cyan-500/20 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-300">Stock máximo</Label>
                    <Input
                      type="number"
                      value={formData.max_stock ?? ""}
                      onChange={(e) => setFormData({ ...formData, max_stock: Number(e.target.value) })}
                      className="bg-[#0d1424] border-cyan-500/20 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300">Fecha de vencimiento (opcional)</Label>
                  <Input
                    type="date"
                    value={formData.expiration_date || ""}
                    onChange={(e) => setFormData({ ...formData, expiration_date: e.target.value })}
                    disabled={showLots}
                    className="bg-[#0d1424] border-cyan-500/20 text-white disabled:opacity-50"
                  />
                </div>

                <div className="space-y-3 p-4 rounded-lg bg-white/5 border border-cyan-500/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-gray-300">Gestionar por lotes</Label>
                      <p className="text-xs text-gray-500">Cantidad y vencimiento por lote de este producto</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowLots((prev) => !prev)}
                      className="border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/10 bg-transparent"
                    >
                      {showLots ? "Ocultar" : "Activar"}
                    </Button>
                  </div>

                  {showLots && (
                    <div className="space-y-3 pt-2">
                      {lots.map((lot, i) => (
                        <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end">
                          <div className="space-y-1">
                            <Label className="text-xs text-gray-500">Lote</Label>
                            <Input
                              value={lot.lot_number}
                              onChange={(e) => updateLot(i, "lot_number", e.target.value)}
                              placeholder="Nº lote"
                              className="bg-[#0d1424] border-cyan-500/20 text-white h-9"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-gray-500">Cantidad</Label>
                            <Input
                              type="number"
                              value={lot.quantity}
                              onChange={(e) => updateLot(i, "quantity", Number(e.target.value))}
                              className="bg-[#0d1424] border-cyan-500/20 text-white h-9"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-gray-500">Vencimiento</Label>
                            <Input
                              type="date"
                              value={lot.expiration_date}
                              onChange={(e) => updateLot(i, "expiration_date", e.target.value)}
                              className="bg-[#0d1424] border-cyan-500/20 text-white h-9"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeLot(i)}
                            className="text-gray-500 hover:text-red-400 h-9 w-9 shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addLot}
                        className="border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/10 bg-transparent gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Agregar lote
                      </Button>
                      {lots.length > 0 && (
                        <p className="text-xs text-gray-500">Stock total por lotes: {lotsTotal} unidades</p>
                      )}
                    </div>
                  )}
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
            </>
          )}
        </DialogContent>
      </Dialog>

      <CameraScanner isOpen={showScanner} onClose={() => setShowScanner(false)} onScan={handleBarcodeScanned} />
    </>
  )
}
