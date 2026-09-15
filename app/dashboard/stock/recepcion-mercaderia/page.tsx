"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import {
  Plus,
  FileText,
  User,
  Calendar,
  Package,
  Trash2,
  Save,
  Camera,
  Search,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { compressImage } from "@/lib/utils/compress-image"

interface Product {
  id: string
  name: string
  sku: string
  category: string
  cost: number
  barcode: string
}

interface ReceiptItem {
  product_id: string
  product_name: string
  quantity: number
  unit_cost: number
  subtotal: number
}

interface MerchandiseReceipt {
  id: string
  receipt_number: string
  receipt_date: string
  supplier_name: string
  received_by_name: string
  total_amount: number
  status: string
  receipt_photo_url: string | null
  created_at: string
}

export default function RecepcionMercaderiaPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [kioskoId, setKioskoId] = useState<string | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [receipts, setReceipts] = useState<MerchandiseReceipt[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  // Form state
  const [receiptNumber, setReceiptNumber] = useState("")
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().split("T")[0])
  const [supplierName, setSupplierName] = useState("")
  const [supplierContact, setSupplierContact] = useState("")
  const [receiptPhoto, setReceiptPhoto] = useState<File | null>(null)
  const [receiptPhotoPreview, setReceiptPhotoPreview] = useState<string | null>(null)
  const [notes, setNotes] = useState("")
  const [items, setItems] = useState<ReceiptItem[]>([])

  // Item form state
  const [selectedProduct, setSelectedProduct] = useState<string>("")
  const [quantity, setQuantity] = useState<number>(1)
  const [unitCost, setUnitCost] = useState<number>(0)

  // New states for product search, scanner, and suppliers
  const [productSearchQuery, setProductSearchQuery] = useState("")
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [showProductDropdown, setShowProductDropdown] = useState(false)
  const [barcodeBuffer, setBarcodeBuffer] = useState("")
  const [lastKeyTime, setLastKeyTime] = useState(0)
  const [suppliers, setSuppliers] = useState<string[]>([])
  const [filteredSuppliers, setFilteredSuppliers] = useState<string[]>([])
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false)
  const [scannerMode, setScannerMode] = useState(true) // Scanner enabled by default

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    loadUser()
  }, [])

  useEffect(() => {
    if (kioskoId) {
      loadProducts()
      loadReceipts()
      loadSuppliers()
    }
  }, [kioskoId])

  // Filter products when search query changes
  useEffect(() => {
    if (productSearchQuery) {
      const filtered = products.filter(
        (p) =>
          p.name.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
          p.sku?.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
          p.category?.toLowerCase().includes(productSearchQuery.toLowerCase()),
      )
      setFilteredProducts(filtered)
      setShowProductDropdown(true)
    } else {
      setFilteredProducts([])
      setShowProductDropdown(false)
    }
  }, [productSearchQuery, products])

  // Filter suppliers when search query changes
  useEffect(() => {
    if (supplierName) {
      const filtered = suppliers.filter((s) => s.toLowerCase().includes(supplierName.toLowerCase()))
      setFilteredSuppliers(filtered)
      setShowSupplierDropdown(filtered.length > 0)
    } else {
      setFilteredSuppliers([])
      setShowSupplierDropdown(false)
    }
  }, [supplierName, suppliers])

  // Listener for barcode scanner input
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!scannerMode) return

      const currentTime = new Date().getTime()

      // If more than 100ms have passed since the last key, reset buffer
      if (currentTime - lastKeyTime > 100) {
        setBarcodeBuffer("")
      }

      setLastKeyTime(currentTime)

      // Enter indicates end of scan
      if (e.key === "Enter") {
        e.preventDefault()
        if (barcodeBuffer.length > 0) {
          handleBarcodeScanned(barcodeBuffer)
          setBarcodeBuffer("")
        }
      } else if (e.key.length === 1) {
        // Only single characters (no Shift, Ctrl, etc)
        setBarcodeBuffer((prev) => prev + e.key)
      }
    }

    window.addEventListener("keypress", handleKeyPress)
    return () => window.removeEventListener("keypress", handleKeyPress)
  }, [barcodeBuffer, lastKeyTime, scannerMode, items, products])

  async function loadUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push("/login")
      return
    }
    setUser(user)

    const { data: employee } = await supabase.from("employees").select("kiosko_id").eq("user_id", user.id).single()

    if (employee) {
      setKioskoId(employee.kiosko_id)
    }
  }

  async function loadProducts() {
    const { data, error } = await supabase
      .from("products")
      .select("id, name, sku, category, cost, barcode")
      .eq("kiosko_id", kioskoId)
      .eq("is_active", true)
      .order("name")

    if (data) setProducts(data)
  }

  async function loadReceipts() {
    const { data, error } = await supabase
      .from("merchandise_receipts")
      .select("*")
      .eq("kiosko_id", kioskoId)
      .order("created_at", { ascending: false })
      .limit(50)

    if (data) setReceipts(data)
  }

  // Load unique suppliers from previous receipts
  async function loadSuppliers() {
    const { data } = await supabase
      .from("merchandise_receipts")
      .select("supplier_name")
      .eq("kiosko_id", kioskoId)
      .order("supplier_name")

    if (data) {
      const uniqueSuppliers = [...new Set(data.map((d) => d.supplier_name).filter(Boolean))]
      setSuppliers(uniqueSuppliers)
    }
  }

  // Handle scanned barcode
  function handleBarcodeScanned(barcode: string) {
    console.log("[v0] Barcode scanned:", barcode)

    const product = products.find((p) => p.barcode === barcode)

    if (!product) {
      alert(`Producto con código de barras ${barcode} no encontrado`)
      return
    }

    // Search if the product is already in the list
    const existingIndex = items.findIndex((item) => item.product_id === product.id)

    if (existingIndex >= 0) {
      // Increment quantity by 1
      const updatedItems = [...items]
      updatedItems[existingIndex].quantity += 1
      updatedItems[existingIndex].subtotal =
        updatedItems[existingIndex].quantity * updatedItems[existingIndex].unit_cost
      setItems(updatedItems)
      console.log("[v0] Product quantity incremented:", product.name)
    } else {
      // Add new product with quantity 1
      setItems([
        ...items,
        {
          product_id: product.id,
          product_name: product.name,
          quantity: 1,
          unit_cost: product.cost,
          subtotal: product.cost,
        },
      ])
      console.log("[v0] Product added:", product.name)
    }
  }

  // Select product from filtered list
  function selectProduct(product: Product) {
    setSelectedProduct(product.id)
    setProductSearchQuery(product.name)
    setUnitCost(product.cost)
    setShowProductDropdown(false)
  }

  // Select supplier from list
  function selectSupplier(supplier: string) {
    setSupplierName(supplier)
    setShowSupplierDropdown(false)
  }

  function addItem() {
    if (!selectedProduct || quantity <= 0) return

    const product = products.find((p) => p.id === selectedProduct)
    if (!product) return

    const cost = unitCost > 0 ? unitCost : product.cost
    const subtotal = quantity * cost

    setItems([
      ...items,
      {
        product_id: product.id,
        product_name: product.name,
        quantity,
        unit_cost: cost,
        subtotal,
      },
    ])

    // Reset form
    setSelectedProduct("")
    setProductSearchQuery("")
    setQuantity(1)
    setUnitCost(0)
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index))
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      const compressed = await compressImage(file)
      setReceiptPhoto(compressed)
      const reader = new FileReader()
      reader.onloadend = () => {
        setReceiptPhotoPreview(reader.result as string)
      }
      reader.readAsDataURL(compressed)
    }
  }

  async function uploadPhoto(): Promise<string | null> {
    if (!receiptPhoto || !kioskoId) return null

    const fileExt = receiptPhoto.name.split(".").pop()
    const fileName = `${kioskoId}/${Date.now()}.${fileExt}`

    const { data, error } = await supabase.storage.from("receipts").upload(fileName, receiptPhoto)

    if (error) {
      console.error("Error uploading photo:", error)
      return null
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("receipts").getPublicUrl(fileName)

    return publicUrl
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!kioskoId || !user) return

    setLoading(true)

    try {
      // Upload photo if exists
      let photoUrl = null
      if (receiptPhoto) {
        photoUrl = await uploadPhoto()
      }

      // Get employee info
      const { data: employee } = await supabase.from("employees").select("id, name").eq("user_id", user.id).single()

      const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0)

      // Create receipt
      const { data: receipt, error: receiptError } = await supabase
        .from("merchandise_receipts")
        .insert({
          kiosko_id: kioskoId,
          receipt_number: receiptNumber,
          receipt_date: receiptDate,
          supplier_name: supplierName,
          supplier_contact: supplierContact,
          receipt_photo_url: photoUrl,
          received_by_employee_id: employee?.id,
          received_by_name: employee?.name || user.email,
          total_amount: totalAmount,
          notes,
          status: "received",
        })
        .select()
        .single()

      if (receiptError) throw receiptError

      // Create receipt items
      const itemsToInsert = items.map((item) => ({
        receipt_id: receipt.id,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_cost: item.unit_cost,
        subtotal: item.subtotal,
      }))

      const { error: itemsError } = await supabase.from("merchandise_receipt_items").insert(itemsToInsert)

      if (itemsError) throw itemsError

      // Update product stock
      for (const item of items) {
        const { data: product } = await supabase
          .from("products")
          .select("stock_quantity")
          .eq("id", item.product_id)
          .single()

        if (product) {
          await supabase
            .from("products")
            .update({
              stock_quantity: (product.stock_quantity || 0) + item.quantity,
            })
            .eq("id", item.product_id)

          // Record stock movement
          await supabase.from("stock_movements").insert({
            kiosko_id: kioskoId,
            product_id: item.product_id,
            movement_type: "receipt",
            quantity: item.quantity,
            reference_id: receipt.id,
            reason: `Recepción de mercadería - Remito ${receiptNumber}`,
            created_by: employee?.id,
          })
        }
      }

      // Reset form
      setReceiptNumber("")
      setReceiptDate(new Date().toISOString().split("T")[0])
      setSupplierName("")
      setSupplierContact("")
      setReceiptPhoto(null)
      setReceiptPhotoPreview(null)
      setNotes("")
      setItems([])

      // Reload receipts
      loadReceipts()

      alert("Recepción de mercadería registrada exitosamente")
    } catch (error) {
      console.error("Error creating receipt:", error)
      alert("Error al registrar la recepción")
    } finally {
      setLoading(false)
    }
  }

  const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0)
  const filteredReceipts = receipts.filter(
    (r) =>
      r.receipt_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.supplier_name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Recepción de Mercadería</h1>
            <p className="text-slate-400 mt-1">Registra el ingreso de productos con trazabilidad completa</p>
          </div>
          {/* Toggle for enabling/disabling scanner */}
          <div className="flex items-center gap-3 bg-slate-800/50 rounded-lg px-4 py-2 border border-slate-700">
            <label className="text-sm text-slate-300 flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={scannerMode}
                onChange={(e) => setScannerMode(e.target.checked)}
                className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-900"
              />
              Scanner de Código de Barras {scannerMode ? "Activado" : "Desactivado"}
            </label>
          </div>
        </div>

        {/* New Receipt Form */}
        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-xl p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Receipt Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  Número de Remito/Factura *
                </Label>
                <Input
                  value={receiptNumber}
                  onChange={(e) => setReceiptNumber(e.target.value)}
                  placeholder="R-12345"
                  required
                  className="bg-slate-800/50 border-slate-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-cyan-400" />
                  Fecha *
                </Label>
                <Input
                  type="date"
                  value={receiptDate}
                  onChange={(e) => setReceiptDate(e.target.value)}
                  required
                  className="bg-slate-800/50 border-slate-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300 flex items-center gap-2">
                  <User className="w-4 h-4 text-cyan-400" />
                  Recibido por
                </Label>
                <Input
                  value={user?.email || "Cargando..."}
                  disabled
                  className="bg-slate-800/30 border-slate-700 text-slate-400"
                />
              </div>
            </div>

            {/* Supplier Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Autocompletion for supplier */}
              <div className="space-y-2 relative">
                <Label className="text-slate-300">Proveedor *</Label>
                <Input
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  placeholder="Nombre del proveedor"
                  required
                  className="bg-slate-800/50 border-slate-700 text-white"
                  onFocus={() => supplierName && setShowSupplierDropdown(true)}
                />
                {showSupplierDropdown && filteredSuppliers.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                    {filteredSuppliers.map((supplier, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => selectSupplier(supplier)}
                        className="w-full text-left px-4 py-2 text-white hover:bg-slate-700 transition-colors"
                      >
                        {supplier}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Contacto del Proveedor</Label>
                <Input
                  value={supplierContact}
                  onChange={(e) => setSupplierContact(e.target.value)}
                  placeholder="Teléfono o email"
                  className="bg-slate-800/50 border-slate-700 text-white"
                />
              </div>
            </div>

            {/* Photo Upload */}
            <div className="space-y-2">
              <Label className="text-slate-300 flex items-center gap-2">
                <Camera className="w-4 h-4 text-cyan-400" />
                Foto del Remito (Recomendable)
              </Label>
              <div className="flex items-center gap-4">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="bg-slate-800/50 border-slate-700 text-white"
                />
                {receiptPhotoPreview && (
                  <img
                    src={receiptPhotoPreview || "/placeholder.svg"}
                    alt="Preview"
                    className="w-20 h-20 object-cover rounded border border-slate-700"
                  />
                )}
              </div>
            </div>

            {/* Add Products Section */}
            <div className="border-t border-slate-800 pt-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-cyan-400" />
                Productos Recibidos
              </h3>

              {/* Information about scanner */}
              {scannerMode && (
                <div className="mb-4 p-3 bg-cyan-950/30 border border-cyan-900/50 rounded-lg">
                  <p className="text-sm text-cyan-300">
                    <strong>Scanner activado:</strong> Escanea el código de barras del producto para agregarlo
                    automáticamente. Cada escaneo suma 1 unidad. Puedes seguir escaneando o ajustar la cantidad
                    manualmente después.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                {/* Product search with autocompletion */}
                <div className="md:col-span-2 space-y-2 relative">
                  <Label className="text-slate-300">Producto *</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      value={productSearchQuery}
                      onChange={(e) => setProductSearchQuery(e.target.value)}
                      placeholder="Buscar por nombre, SKU o categoría..."
                      className="pl-10 bg-slate-800/50 border-slate-700 text-white"
                      onFocus={() => productSearchQuery && setShowProductDropdown(true)}
                    />
                  </div>
                  {showProductDropdown && filteredProducts.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                      {filteredProducts.map((product) => (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => selectProduct(product)}
                          className="w-full text-left px-4 py-3 text-white hover:bg-slate-700 transition-colors border-b border-slate-700 last:border-b-0"
                        >
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-slate-400">
                            {product.category} • SKU: {product.sku} • ${product.cost.toFixed(2)}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">Cantidad *</Label>
                  <Input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Number.parseInt(e.target.value) || 1)}
                    className="bg-slate-800/50 border-slate-700 text-white"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        // Focus on next field (unit cost)
                        const nextInput = document.querySelector(
                          'input[type="number"][step="0.01"]',
                        ) as HTMLInputElement
                        nextInput?.focus()
                      }
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">Costo Unitario</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={unitCost}
                    onChange={(e) => setUnitCost(Number.parseFloat(e.target.value) || 0)}
                    className="bg-slate-800/50 border-slate-700 text-white"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        addItem()
                      }
                    }}
                  />
                </div>
              </div>

              <Button
                type="button"
                onClick={addItem}
                disabled={!selectedProduct || quantity <= 0}
                className="bg-cyan-600 hover:bg-cyan-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Agregar Producto
              </Button>

              {/* Items List */}
              {items.length > 0 && (
                <div className="mt-6 space-y-2">
                  <div className="grid grid-cols-12 gap-4 text-sm font-medium text-slate-400 px-4 py-2">
                    <div className="col-span-5">Producto</div>
                    <div className="col-span-2 text-right">Cantidad</div>
                    <div className="col-span-2 text-right">Costo Unit.</div>
                    <div className="col-span-2 text-right">Subtotal</div>
                    <div className="col-span-1"></div>
                  </div>
                  {items.map((item, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-12 gap-4 items-center bg-slate-800/30 rounded-lg px-4 py-3 border border-slate-800"
                    >
                      <div className="col-span-5 text-white font-medium">{item.product_name}</div>
                      <div className="col-span-2 text-right text-slate-300">{item.quantity} un.</div>
                      <div className="col-span-2 text-right text-slate-300">${item.unit_cost.toFixed(2)}</div>
                      <div className="col-span-2 text-right text-cyan-400 font-semibold">
                        ${item.subtotal.toFixed(2)}
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => removeItem(index)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-950/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {/* Total */}
                  <div className="flex justify-end pt-4 border-t border-slate-800">
                    <div className="text-right">
                      <div className="text-sm text-slate-400">Total</div>
                      <div className="text-2xl font-bold text-cyan-400">${totalAmount.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label className="text-slate-300">Notas / Observaciones</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notas adicionales sobre la recepción..."
                rows={3}
                className="bg-slate-800/50 border-slate-700 text-white"
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setReceiptNumber("")
                  setSupplierName("")
                  setSupplierContact("")
                  setReceiptPhoto(null)
                  setReceiptPhotoPreview(null)
                  setNotes("")
                  setItems([])
                }}
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Limpiar
              </Button>
              <Button
                type="submit"
                disabled={loading || !receiptNumber || !supplierName || items.length === 0}
                className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? "Guardando..." : "Registrar Recepción"}
              </Button>
            </div>
          </form>
        </Card>

        {/* Receipts History */}
        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Historial de Recepciones</h2>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por remito o proveedor..."
                className="pl-10 bg-slate-800/50 border-slate-700 text-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            {filteredReceipts.map((receipt) => (
              <div
                key={receipt.id}
                className="flex items-center justify-between bg-slate-800/30 rounded-lg p-4 border border-slate-800 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {receipt.status === "received" ? (
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                  ) : receipt.status === "discrepancy" ? (
                    <AlertTriangle className="w-5 h-5 text-yellow-400" />
                  ) : (
                    <FileText className="w-5 h-5 text-cyan-400" />
                  )}
                  <div>
                    <div className="text-white font-semibold">{receipt.receipt_number}</div>
                    <div className="text-sm text-slate-400">
                      {receipt.supplier_name} • {new Date(receipt.receipt_date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="text-sm text-slate-400">Recibido por</div>
                    <div className="text-white">{receipt.received_by_name}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-slate-400">Total</div>
                    <div className="text-lg font-bold text-cyan-400">${receipt.total_amount.toFixed(2)}</div>
                  </div>
                  {receipt.receipt_photo_url && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(receipt.receipt_photo_url!, "_blank")}
                      className="border-slate-700 text-slate-300"
                    >
                      <Camera className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {filteredReceipts.length === 0 && (
              <div className="text-center py-12 text-slate-400">No se encontraron recepciones</div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
