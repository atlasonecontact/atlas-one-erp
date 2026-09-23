"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
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
import { useRouter, useSearchParams } from "next/navigation"
import { compressImage } from "@/lib/utils/compress-image"
import { useEmployeePermissions } from "@/lib/hooks/use-employee-permissions"
import { AccessDenied } from "@/components/ui/access-denied"
import { useToast } from "@/components/ui/toast-provider"

interface Product {
  id: string
  name: string
  sku: string
  category: string
  cost: number
  barcode: string
  stock_quantity: number
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
  supplier_contact?: string | null
  notes?: string | null
  received_by_name: string
  total_amount: number
  status: string
  receipt_photo_url: string | null
  cancel_reason?: string | null
  created_at: string
}

export default function RecepcionMercaderiaPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const toast = useToast()
  const [user, setUser] = useState<any>(null)
  const { permissions, loading: permsLoading, isOwner } = useEmployeePermissions()
  const [kioskoId, setKioskoId] = useState<string | null>(null)
  const [employeeInfo, setEmployeeInfo] = useState<{ id: string; name: string | null } | null>(null)

  // Borrador -> confirmar: el stock solo cambia al confirmar (ver scripts/209)
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null)
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const idempotencyKeyRef = useRef<string>("")
  const [cancelTarget, setCancelTarget] = useState<MerchandiseReceipt | null>(null)
  const [cancelReason, setCancelReason] = useState("")
  const [cancelling, setCancelling] = useState(false)
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

  // Auto-select product when arriving from Productos → "Iniciar Recepción"
  useEffect(() => {
    const productId = searchParams.get("product_id")
    if (!productId || products.length === 0 || selectedProduct) return

    const product = products.find((p) => p.id === productId)
    if (product) {
      selectProduct(product)
      toast.info("Producto seleccionado", product.name)
    }
  }, [products, searchParams])

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
      if (!scannerMode || showConfirm || cancelTarget) return

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
  }, [barcodeBuffer, lastKeyTime, scannerMode, items, products, showConfirm, cancelTarget])

  async function loadUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push("/login")
      return
    }
    setUser(user)

    // El dueño manda primero (mismo criterio que useEmployeePermissions); antes
    // solo se miraba employees y un dueño sin fila de empleado no podia usar
    // la pantalla.
    const { data: kioscos } = await supabase.from("kioscos").select("id").eq("owner_id", user.id).limit(1)
    const { data: employee } = await supabase
      .from("employees")
      .select("id, name, kiosko_id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle()

    if (employee) setEmployeeInfo({ id: employee.id, name: employee.name })

    if (kioscos && kioscos.length > 0) {
      setKioskoId(kioscos[0].id)
    } else if (employee) {
      setKioskoId(employee.kiosko_id)
    }
  }

  async function loadProducts() {
    const { data, error } = await supabase
      .from("products")
      .select("id, name, sku, category, cost, barcode, stock_quantity")
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
      toast.warning(
        "Producto no encontrado",
        `Código ${barcode} no está cargado. Creálo desde Productos con este código.`,
      )
      router.push(`/dashboard/productos?new_barcode=${barcode}`)
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
      toast.success("Cantidad incrementada", `${product.name}: ${updatedItems[existingIndex].quantity} unidades`)
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
      toast.success("Producto identificado", `${product.name} · Costo: $${product.cost.toLocaleString()}`)
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

  function resetForm() {
    setReceiptNumber("")
    setReceiptDate(new Date().toISOString().split("T")[0])
    setSupplierName("")
    setSupplierContact("")
    setReceiptPhoto(null)
    setReceiptPhotoPreview(null)
    setExistingPhotoUrl(null)
    setNotes("")
    setItems([])
    setEditingDraftId(null)
  }

  function errorMessage(error: unknown) {
    const message = (error as any)?.message
    return message ? String(message) : "Intentá nuevamente en unos segundos"
  }

  // Guarda la recepcion como borrador (no toca el stock). Si ya se estaba
  // editando un borrador, lo actualiza en vez de crear otro.
  async function persistDraft(): Promise<string> {
    if (!kioskoId || !user) throw new Error("Sesión no válida")

    let photoUrl = existingPhotoUrl
    if (receiptPhoto) {
      const uploaded = await uploadPhoto()
      if (uploaded) photoUrl = uploaded
    }

    const { data, error } = await supabase.rpc("save_receipt_draft", {
      p_receipt: {
        kiosko_id: kioskoId,
        receipt_id: editingDraftId,
        receipt_number: receiptNumber,
        receipt_date: receiptDate,
        supplier_name: supplierName,
        supplier_contact: supplierContact,
        receipt_photo_url: photoUrl,
        received_by_employee_id: employeeInfo?.id ?? null,
        received_by_name: employeeInfo?.name || user.email,
        notes,
        items: items.map((item) => ({
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_cost: item.unit_cost,
        })),
      },
    })

    if (error) throw error
    const receiptId = data?.receipt_id as string
    setEditingDraftId(receiptId)
    return receiptId
  }

  async function handleSaveDraft() {
    if (saving || confirming) return
    if (!receiptNumber || !supplierName || items.length === 0) {
      toast.warning("Faltan datos", "Completá remito, proveedor y al menos un producto")
      return
    }

    setSaving(true)
    try {
      await persistDraft()
      toast.success("Borrador guardado", "El stock no se modificó. Podés confirmarlo cuando quieras.")
      resetForm()
      loadReceipts()
    } catch (error) {
      console.error("Error saving draft:", error)
      toast.error("Error al guardar el borrador", errorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  // Confirmar abre el resumen con el impacto exacto en stock; recien al
  // aceptarlo ahi se suma la mercaderia.
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!kioskoId || !user || items.length === 0) return
    idempotencyKeyRef.current = crypto.randomUUID()
    setShowConfirm(true)
  }

  async function confirmReceipt() {
    if (confirming) return
    setConfirming(true)
    try {
      const receiptId = await persistDraft()
      const { data, error } = await supabase.rpc("confirm_receipt", {
        p_receipt_id: receiptId,
        p_idempotency_key: idempotencyKeyRef.current,
      })
      if (error) throw error

      setShowConfirm(false)
      resetForm()
      loadReceipts()
      loadProducts()
      toast.success(
        data?.already_confirmed ? "La recepción ya estaba confirmada" : "Recepción confirmada",
        "El stock fue actualizado",
      )
    } catch (error) {
      console.error("Error confirming receipt:", error)
      toast.error("Error al confirmar la recepción", errorMessage(error))
    } finally {
      setConfirming(false)
    }
  }

  async function continueDraft(receipt: MerchandiseReceipt) {
    const { data, error } = await supabase
      .from("merchandise_receipt_items")
      .select("product_id, product_name, quantity, unit_cost, subtotal")
      .eq("receipt_id", receipt.id)

    if (error || !data) {
      toast.error("No se pudo abrir el borrador", errorMessage(error))
      return
    }

    resetForm()
    setEditingDraftId(receipt.id)
    setReceiptNumber(receipt.receipt_number)
    setReceiptDate(receipt.receipt_date)
    setSupplierName(receipt.supplier_name)
    setSupplierContact(receipt.supplier_contact || "")
    setNotes(receipt.notes || "")
    setExistingPhotoUrl(receipt.receipt_photo_url)
    setReceiptPhotoPreview(receipt.receipt_photo_url)
    setItems(
      data.map((row: any) => ({
        product_id: row.product_id,
        product_name: row.product_name,
        quantity: Number(row.quantity),
        unit_cost: Number(row.unit_cost) || 0,
        subtotal: Number(row.subtotal) || 0,
      })),
    )
    window.scrollTo({ top: 0, behavior: "smooth" })
    toast.info("Borrador cargado", `Remito ${receipt.receipt_number}`)
  }

  async function submitCancel() {
    if (!cancelTarget || cancelling) return
    setCancelling(true)
    try {
      const { error } = await supabase.rpc("cancel_receipt", {
        p_receipt_id: cancelTarget.id,
        p_reason: cancelReason.trim() || null,
      })
      if (error) throw error

      toast.success(
        cancelTarget.status === "draft" ? "Borrador descartado" : "Recepción anulada",
        cancelTarget.status === "draft" ? undefined : "El stock se revirtió con un movimiento compensatorio",
      )
      if (editingDraftId === cancelTarget.id) resetForm()
      setCancelTarget(null)
      setCancelReason("")
      loadReceipts()
      loadProducts()
    } catch (error) {
      console.error("Error cancelling receipt:", error)
      toast.error("No se pudo anular", errorMessage(error))
    } finally {
      setCancelling(false)
    }
  }

  const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0)

  // Impacto exacto en stock por producto (una fila por producto aunque este
  // repetido en varias lineas): stock actual + recibido = stock nuevo.
  const stockImpact = Object.values(
    items.reduce(
      (acc, item) => {
        const current = products.find((p) => p.id === item.product_id)?.stock_quantity ?? 0
        acc[item.product_id] = {
          name: item.product_name,
          add: (acc[item.product_id]?.add ?? 0) + item.quantity,
          current,
        }
        return acc
      },
      {} as Record<string, { name: string; add: number; current: number }>,
    ),
  )
  const totalUnits = items.reduce((sum, item) => sum + item.quantity, 0)
  const filteredReceipts = receipts.filter(
    (r) =>
      r.receipt_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.supplier_name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  if (!permsLoading && !(permissions.can_receive_merchandise && permissions.can_stock_entry)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
        <div className="max-w-3xl mx-auto">
          <AccessDenied
            title="No tenés permiso para recibir mercadería"
            message="Necesitás los permisos 'Recibir mercadería' e 'Ingresar mercadería a stock' habilitados. Pedile a tu dueño de kiosco que te los active desde Empleados."
          />
        </div>
      </div>
    )
  }

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
            {editingDraftId && (
              <div className="p-3 bg-amber-950/30 border border-amber-900/50 rounded-lg text-sm text-amber-300">
                Estás editando un <strong>borrador</strong>: todavía no se sumó nada al stock. El stock cambia
                recién cuando confirmás la recepción.
              </div>
            )}

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
                onClick={resetForm}
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                {editingDraftId ? "Cancelar edición" : "Limpiar"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleSaveDraft}
                disabled={saving || confirming || !receiptNumber || !supplierName || items.length === 0}
                className="border-cyan-700 text-cyan-300 hover:bg-cyan-950/40"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Guardando..." : "Guardar borrador"}
              </Button>
              <Button
                type="submit"
                disabled={saving || confirming || !receiptNumber || !supplierName || items.length === 0}
                className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Confirmar recepción
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
                  {receipt.status === "draft" ? (
                    <FileText className="w-5 h-5 text-amber-400" />
                  ) : receipt.status === "cancelled" ? (
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-white font-semibold ${receipt.status === "cancelled" ? "line-through opacity-60" : ""}`}
                      >
                        {receipt.receipt_number}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          receipt.status === "draft"
                            ? "bg-amber-500/20 text-amber-300"
                            : receipt.status === "cancelled"
                              ? "bg-red-500/20 text-red-300"
                              : "bg-green-500/20 text-green-300"
                        }`}
                      >
                        {receipt.status === "draft"
                          ? "Borrador"
                          : receipt.status === "cancelled"
                            ? "Anulada"
                            : "Confirmada"}
                      </span>
                    </div>
                    <div className="text-sm text-slate-400">
                      {receipt.supplier_name} • {new Date(receipt.receipt_date).toLocaleDateString()}
                      {receipt.status === "cancelled" && receipt.cancel_reason ? ` • ${receipt.cancel_reason}` : ""}
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
                  {receipt.status === "draft" && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => continueDraft(receipt)}
                        className="border-cyan-700 text-cyan-300 hover:bg-cyan-950/40"
                      >
                        Continuar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setCancelTarget(receipt)}
                        className="border-slate-700 text-slate-300"
                      >
                        Descartar
                      </Button>
                    </>
                  )}
                  {receipt.status === "confirmed" && isOwner && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCancelTarget(receipt)}
                      className="border-red-800 text-red-300 hover:bg-red-950/30"
                    >
                      Anular
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

        {/* Resumen antes de confirmar: impacto exacto en stock */}
        {showConfirm && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
              <div className="p-6 border-b border-slate-800">
                <h2 className="text-xl font-bold text-white">Confirmar recepción</h2>
                <p className="text-sm text-slate-400 mt-1">
                  Remito {receiptNumber} • {supplierName} • {totalUnits} unidades
                </p>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-2">
                <p className="text-sm text-slate-300 mb-3">
                  Al confirmar se va a sumar este stock. No se puede editar después: si hay un error, se anula y
                  queda registrado.
                </p>
                {stockImpact.map((row) => (
                  <div
                    key={row.name}
                    className="flex items-center justify-between bg-slate-800/40 rounded-lg px-4 py-3 border border-slate-800"
                  >
                    <span className="text-white font-medium">{row.name}</span>
                    <span className="text-slate-300 text-sm">
                      {row.current} + <span className="text-cyan-400 font-semibold">{row.add}</span> ={" "}
                      <span className="text-white font-bold">{row.current + row.add}</span> un.
                    </span>
                  </div>
                ))}
                <div className="flex justify-end pt-3 text-slate-300">
                  Total del remito:{" "}
                  <span className="ml-2 text-cyan-400 font-bold">${totalAmount.toFixed(2)}</span>
                </div>
              </div>
              <div className="p-6 border-t border-slate-800 flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowConfirm(false)}
                  disabled={confirming}
                  className="border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  Volver
                </Button>
                <Button
                  type="button"
                  onClick={confirmReceipt}
                  disabled={confirming}
                  className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white"
                >
                  {confirming ? "Confirmando..." : "Confirmar y sumar al stock"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Anular recepción confirmada / descartar borrador */}
        {cancelTarget && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-4">
              <h2 className="text-xl font-bold text-white">
                {cancelTarget.status === "draft" ? "Descartar borrador" : "Anular recepción"}
              </h2>
              <p className="text-sm text-slate-300">
                Remito {cancelTarget.receipt_number} • {cancelTarget.supplier_name}
                {cancelTarget.status === "draft"
                  ? ". No se modificó el stock, solo se descarta el borrador."
                  : ". Se va a restar del stock lo que se había sumado, con un movimiento compensatorio que queda en el historial (el original no se borra)."}
              </p>
              <div className="space-y-2">
                <Label className="text-slate-300">Motivo (opcional)</Label>
                <Textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  rows={3}
                  className="bg-slate-800/50 border-slate-700 text-white"
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setCancelTarget(null)
                    setCancelReason("")
                  }}
                  disabled={cancelling}
                  className="border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  Volver
                </Button>
                <Button
                  type="button"
                  onClick={submitCancel}
                  disabled={cancelling}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {cancelling ? "Procesando..." : cancelTarget.status === "draft" ? "Descartar" : "Anular recepción"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
