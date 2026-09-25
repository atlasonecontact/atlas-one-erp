"use client"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { DollarSign, Receipt, TrendingUp, Search, FileText, Building2, Wallet, CheckCircle2 } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useToast } from "@/components/ui/toast-provider"
import { formatCurrency } from "@/lib/utils/currency"

interface Purchase {
  id: string
  purchase_number: string
  supplier_name: string
  total_amount: number
  payment_status: string
  total_paid: number
  created_at: string
}

interface Payment {
  id: string
  payment_number: string
  payment_date: string
  amount: number
  payment_method: string
  reference_number: string | null
  notes: string | null
  purchase_id: string
  purchases: {
    purchase_number: string
    supplier_name: string
  }
}

export default function PagoProveedoresPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [filteredPurchases, setFilteredPurchases] = useState<Purchase[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null)
  const [loading, setLoading] = useState(true)
  const [tableError, setTableError] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer")
  const [referenceNumber, setReferenceNumber] = useState("")
  const [paymentNotes, setPaymentNotes] = useState("")

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
  const toast = useToast()

  const [kioskoId, setKioskoId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deductFromCash, setDeductFromCash] = useState(true)
  const [openRegisterId, setOpenRegisterId] = useState<string | null>(null)
  const [showFreeDialog, setShowFreeDialog] = useState(false)
  const [freeSupplier, setFreeSupplier] = useState("")

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    const filtered = purchases.filter(
      (p) =>
        p.purchase_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    setFilteredPurchases(filtered)
  }, [searchTerm, purchases])

  async function resolveKiosko(): Promise<string | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null
    const { data: kioscos } = await supabase.from("kioscos").select("id").eq("owner_id", user.id).limit(1)
    if (kioscos && kioscos.length > 0) return kioscos[0].id
    const { data: emp } = await supabase
      .from("employees")
      .select("kiosko_id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle()
    return emp?.kiosko_id ?? null
  }

  async function loadData() {
    setLoading(true)
    setTableError(false)
    try {
      const kiosko = await resolveKiosko()
      setKioskoId(kiosko)
      if (!kiosko) {
        toast.error("No se encontró tu kiosco", "Tu usuario no figura como dueño ni empleado activo de ningún kiosco.")
        return
      }

      const { data: register } = await supabase
        .from("cash_registers")
        .select("id")
        .eq("kiosko_id", kiosko)
        .eq("status", "open")
        .order("opened_at", { ascending: false })
        .limit(1)
        .maybeSingle()
      setOpenRegisterId(register?.id ?? null)

      const { data: purchasesData, error: purchasesError } = await supabase
        .from("purchases")
        .select("*")
        .eq("kiosko_id", kiosko)
        .order("created_at", { ascending: false })

      if (purchasesError) throw purchasesError
      setPurchases(purchasesData || [])
      setFilteredPurchases(purchasesData || [])

      const { data: paymentsData, error: paymentsError } = await supabase
        .from("supplier_payments")
        .select(`
          *,
          purchases (
            purchase_number,
            supplier_name
          )
        `)
        .or(`kiosko_id.eq.${kiosko},kiosko_id.is.null`)
        .order("payment_date", { ascending: false })

      if (paymentsError) {
        if (paymentsError.message.includes("table") || paymentsError.message.includes("schema cache")) {
          setTableError(true)
          return
        }
        throw paymentsError
      }
      setPayments(paymentsData || [])
    } catch (error: any) {
      console.error("[Pagos] Error al cargar los datos:", error)
      toast.error("No se pudieron cargar los pagos", error?.message || "Probá de nuevo")
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setIsDialogOpen(false)
    setShowFreeDialog(false)
    setSelectedPurchase(null)
    setPaymentAmount("")
    setPaymentMethod("bank_transfer")
    setReferenceNumber("")
    setPaymentNotes("")
    setFreeSupplier("")
  }

  // Un pago puede ser contra una orden de compra o suelto (sin OC): en ese caso el
  // proveedor queda anotado al principio de las notas.
  async function handleRegisterPayment() {
    if (saving) return
    const amount = Number.parseFloat(paymentAmount)
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Monto inválido", "Ingresá un monto mayor a cero")
      return
    }
    if (!kioskoId) {
      toast.error("No se encontró tu kiosco", "Recargá la página e intentá de nuevo")
      return
    }

    let supplierName = selectedPurchase?.supplier_name ?? freeSupplier.trim()
    if (!selectedPurchase && !supplierName) {
      toast.error("Falta el proveedor", "Escribí a quién le pagás")
      return
    }
    if (selectedPurchase) {
      const pending = selectedPurchase.total_amount - (selectedPurchase.total_paid || 0)
      if (amount > pending + 0.009) {
        toast.error("El monto supera lo pendiente", `Lo pendiente de esta OC es ${formatCurrency(pending)}`)
        return
      }
    }

    setSaving(true)
    try {
      const payNumber = `PAY-${Date.now().toString(36).toUpperCase()}`
      const notes = selectedPurchase
        ? paymentNotes || null
        : `Proveedor: ${supplierName}${paymentNotes ? ` — ${paymentNotes}` : ""}`

      const { error } = await supabase.from("supplier_payments").insert({
        purchase_id: selectedPurchase?.id ?? null,
        kiosko_id: kioskoId,
        payment_number: payNumber,
        amount,
        payment_method: paymentMethod,
        reference_number: referenceNumber || null,
        notes,
      })

      if (error) throw error

      let cashNote = ""
      if (paymentMethod === "cash" && deductFromCash) {
        if (openRegisterId) {
          const { error: cashError } = await supabase.rpc("add_cash_movement", {
            p_register: openRegisterId,
            p_type: "supplier_payment",
            p_direction: "out",
            p_amount: amount,
            p_notes: `Pago a proveedor ${supplierName}`,
          })
          cashNote = cashError ? " (no se pudo descontar de la caja)" : " y se descontó de la caja"
        } else {
          cashNote = " (no hay caja abierta, no se descontó de la caja)"
        }
      }

      toast.success("Pago registrado", `${formatCurrency(amount)} a ${supplierName}${cashNote}`)
      resetForm()
      await loadData()
    } catch (error: any) {
      console.error("[Pagos] Error al registrar el pago:", error)
      toast.error("No se pudo registrar el pago", error?.message || "Probá de nuevo")
    } finally {
      setSaving(false)
    }
  }

  const totalPendingAmount = purchases
    .filter((p) => p.payment_status !== "paid")
    .reduce((sum, p) => sum + (p.total_amount - (p.total_paid || 0)), 0)

  const totalPaidAmount = payments.reduce((sum, p) => sum + p.amount, 0)

  const unpaidCount = purchases.filter((p) => p.payment_status === "unpaid").length
  const partialCount = purchases.filter((p) => p.payment_status === "partial").length

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Pagado</Badge>
      case "partial":
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Pago Parcial</Badge>
      case "unpaid":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">No Pagado</Badge>
      default:
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">{status}</Badge>
    }
  }

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      cash: "Efectivo",
      bank_transfer: "Transferencia",
      check: "Cheque",
      debit_card: "Débito",
      credit_card: "Crédito",
      mercadopago: "Mercado Pago",
    }
    return labels[method] || method
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando pagos...</p>
        </div>
      </div>
    )
  }

  if (tableError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-8">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-gradient-to-br from-amber-900/20 to-gray-900 border-amber-500/30">
            <CardHeader>
              <div className="flex items-start gap-4">
                <div className="p-3 bg-amber-500/20 rounded-lg">
                  <FileText className="w-8 h-8 text-amber-400" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-xl text-amber-400 mb-2">Configuración Inicial Requerida</CardTitle>
                  <p className="text-gray-300 mb-4">
                    Para usar el módulo de Pago a Proveedores, primero debes ejecutar el script SQL de configuración.
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700/50">
                <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 text-sm">
                    1
                  </span>
                  Ejecutar Script SQL
                </h3>
                <p className="text-gray-400 text-sm mb-3 ml-8">
                  El script{" "}
                  <code className="bg-gray-800 px-2 py-1 rounded text-cyan-400">
                    scripts/create_supplier_payments.sql
                  </code>{" "}
                  creará las tablas necesarias.
                </p>
              </div>

              <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700/50">
                <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 text-sm">
                    2
                  </span>
                  Qué incluye el script
                </h3>
                <ul className="text-gray-400 text-sm space-y-2 ml-8">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>
                      Tabla <code className="text-cyan-400">supplier_payments</code> para registrar pagos
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Trigger para actualizar estado de pago automáticamente</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Integración con finanzas del negocio</span>
                  </li>
                </ul>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <Button onClick={() => loadData()} className="bg-cyan-500 hover:bg-cyan-600 text-white">
                  Reintentar Conexión
                </Button>
                <p className="text-sm text-gray-500">
                  Después de ejecutar el script, haz click en "Reintentar Conexión"
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Pago a Proveedores</h1>
            <p className="text-gray-400">
              Gestiona los pagos de órdenes de compra y mantén tu flujo de caja bajo control
            </p>
          </div>
          <Button
            onClick={() => {
              setSelectedPurchase(null)
              setPaymentAmount("")
              setShowFreeDialog(true)
            }}
            className="bg-cyan-500 hover:bg-cyan-600 text-white"
          >
            <DollarSign className="w-4 h-4 mr-1" />
            Pagar sin orden de compra
          </Button>
        </div>

        <Dialog open={showFreeDialog} onOpenChange={(open) => (open ? setShowFreeDialog(true) : resetForm())}>
          <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-md">
            <DialogHeader>
              <DialogTitle>Pago a proveedor</DialogTitle>
              <DialogDescription className="text-gray-400">
                Para pagos que no están asociados a una orden de compra (repartidor, factura suelta, etc.)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="free-supplier">Proveedor</Label>
                <Input
                  id="free-supplier"
                  value={freeSupplier}
                  onChange={(e) => setFreeSupplier(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white"
                  placeholder="Ej: Distribuidora Norte"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="free-amount">Monto</Label>
                <Input
                  id="free-amount"
                  type="number"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white"
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label>Método de pago</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="cash">Efectivo</SelectItem>
                    <SelectItem value="bank_transfer">Transferencia Bancaria</SelectItem>
                    <SelectItem value="check">Cheque</SelectItem>
                    <SelectItem value="debit_card">Tarjeta de Débito</SelectItem>
                    <SelectItem value="credit_card">Tarjeta de Crédito</SelectItem>
                    <SelectItem value="mercadopago">Mercado Pago</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {paymentMethod === "cash" && (
                <label className="flex items-center gap-2 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={deductFromCash}
                    onChange={(e) => setDeductFromCash(e.target.checked)}
                  />
                  Descontar de la caja del turno
                  {!openRegisterId && <span className="text-amber-400">(no hay caja abierta)</span>}
                </label>
              )}
              <div className="space-y-2">
                <Label htmlFor="free-notes">Notas (opcional)</Label>
                <Textarea
                  id="free-notes"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white"
                  rows={2}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={resetForm}
                  className="flex-1 border-gray-700 text-white hover:bg-gray-800"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleRegisterPayment}
                  disabled={saving}
                  className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-white"
                >
                  {saving ? "Guardando..." : "Registrar pago"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700/50 hover:border-cyan-500/30 transition-all">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-400">Monto Pendiente</CardTitle>
                <Wallet className="w-5 h-5 text-red-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-400">${totalPendingAmount.toFixed(2)}</div>
              <p className="text-xs text-gray-500 mt-1">{unpaidCount + partialCount} OC pendientes</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700/50 hover:border-cyan-500/30 transition-all">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-400">Total Pagado</CardTitle>
                <CheckCircle2 className="w-5 h-5 text-green-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">${totalPaidAmount.toFixed(2)}</div>
              <p className="text-xs text-gray-500 mt-1">{payments.length} pagos registrados</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700/50 hover:border-cyan-500/30 transition-all">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-400">OC No Pagadas</CardTitle>
                <FileText className="w-5 h-5 text-red-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{unpaidCount}</div>
              <p className="text-xs text-gray-500 mt-1">Órdenes sin pagar</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700/50 hover:border-cyan-500/30 transition-all">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-400">Pagos Parciales</CardTitle>
                <TrendingUp className="w-5 h-5 text-amber-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{partialCount}</div>
              <p className="text-xs text-gray-500 mt-1">Con pago parcial</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="bg-gray-800/50 border border-gray-700/50">
            <TabsTrigger value="pending">Órdenes Pendientes</TabsTrigger>
            <TabsTrigger value="history">Historial de Pagos</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  placeholder="Buscar por número OC o proveedor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-800/50 border-gray-700 text-white"
                />
              </div>
            </div>

            <Card className="bg-gray-900/50 border-gray-700/50">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-700/50">
                        <th className="text-left p-4 text-sm font-semibold text-gray-400">Número OC</th>
                        <th className="text-left p-4 text-sm font-semibold text-gray-400">Proveedor</th>
                        <th className="text-left p-4 text-sm font-semibold text-gray-400">Fecha</th>
                        <th className="text-right p-4 text-sm font-semibold text-gray-400">Monto Total</th>
                        <th className="text-right p-4 text-sm font-semibold text-gray-400">Pagado</th>
                        <th className="text-right p-4 text-sm font-semibold text-gray-400">Pendiente</th>
                        <th className="text-center p-4 text-sm font-semibold text-gray-400">Estado</th>
                        <th className="text-center p-4 text-sm font-semibold text-gray-400">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPurchases.filter((p) => p.payment_status !== "paid").length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-gray-500">
                            No hay órdenes de compra pendientes de pago
                          </td>
                        </tr>
                      ) : (
                        filteredPurchases
                          .filter((p) => p.payment_status !== "paid")
                          .map((purchase) => {
                            const pending = purchase.total_amount - (purchase.total_paid || 0)
                            return (
                              <tr
                                key={purchase.id}
                                className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"
                              >
                                <td className="p-4">
                                  <div className="flex items-center gap-2">
                                    <Receipt className="w-4 h-4 text-cyan-400" />
                                    <span className="text-white font-medium">{purchase.purchase_number}</span>
                                  </div>
                                </td>
                                <td className="p-4">
                                  <div className="flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-gray-400" />
                                    <span className="text-gray-300">{purchase.supplier_name}</span>
                                  </div>
                                </td>
                                <td className="p-4 text-gray-400">
                                  {format(new Date(purchase.created_at), "dd MMM yyyy", { locale: es })}
                                </td>
                                <td className="p-4 text-right text-white font-semibold">
                                  ${purchase.total_amount.toFixed(2)}
                                </td>
                                <td className="p-4 text-right text-green-400 font-medium">
                                  ${(purchase.total_paid || 0).toFixed(2)}
                                </td>
                                <td className="p-4 text-right text-red-400 font-medium">${pending.toFixed(2)}</td>
                                <td className="p-4 text-center">{getPaymentStatusBadge(purchase.payment_status)}</td>
                                <td className="p-4 text-center">
                                  <Dialog
                                    open={isDialogOpen && selectedPurchase?.id === purchase.id}
                                    onOpenChange={(open) => {
                                      setIsDialogOpen(open)
                                      if (!open) setSelectedPurchase(null)
                                    }}
                                  >
                                    <DialogTrigger asChild>
                                      <Button
                                        size="sm"
                                        onClick={() => {
                                          setSelectedPurchase(purchase)
                                          setPaymentAmount(pending.toFixed(2))
                                        }}
                                        className="bg-cyan-500 hover:bg-cyan-600 text-white"
                                      >
                                        <DollarSign className="w-4 h-4 mr-1" />
                                        Registrar Pago
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-md">
                                      <DialogHeader>
                                        <DialogTitle>Registrar Pago</DialogTitle>
                                        <DialogDescription className="text-gray-400">
                                          OC: {purchase.purchase_number} - {purchase.supplier_name}
                                        </DialogDescription>
                                      </DialogHeader>
                                      <div className="space-y-4">
                                        <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50">
                                          <div className="flex justify-between text-sm mb-2">
                                            <span className="text-gray-400">Monto Total:</span>
                                            <span className="text-white font-semibold">
                                              ${purchase.total_amount.toFixed(2)}
                                            </span>
                                          </div>
                                          <div className="flex justify-between text-sm mb-2">
                                            <span className="text-gray-400">Pagado:</span>
                                            <span className="text-green-400 font-medium">
                                              ${(purchase.total_paid || 0).toFixed(2)}
                                            </span>
                                          </div>
                                          <div className="flex justify-between text-sm pt-2 border-t border-gray-700/50">
                                            <span className="text-gray-400">Pendiente:</span>
                                            <span className="text-red-400 font-bold">${pending.toFixed(2)}</span>
                                          </div>
                                        </div>

                                        <div className="space-y-2">
                                          <Label htmlFor="amount">Monto a Pagar</Label>
                                          <Input
                                            id="amount"
                                            type="number"
                                            step="0.01"
                                            value={paymentAmount}
                                            onChange={(e) => setPaymentAmount(e.target.value)}
                                            className="bg-gray-800 border-gray-700 text-white"
                                            placeholder="0.00"
                                          />
                                        </div>

                                        <div className="space-y-2">
                                          <Label htmlFor="method">Método de Pago</Label>
                                          <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                            <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-gray-800 border-gray-700">
                                              <SelectItem value="bank_transfer">Transferencia Bancaria</SelectItem>
                                              <SelectItem value="cash">Efectivo</SelectItem>
                                              <SelectItem value="check">Cheque</SelectItem>
                                              <SelectItem value="debit_card">Tarjeta de Débito</SelectItem>
                                              <SelectItem value="credit_card">Tarjeta de Crédito</SelectItem>
                                              <SelectItem value="mercadopago">Mercado Pago</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>

                                        {paymentMethod === "cash" && (
                                          <label className="flex items-center gap-2 text-sm text-gray-300">
                                            <input
                                              type="checkbox"
                                              checked={deductFromCash}
                                              onChange={(e) => setDeductFromCash(e.target.checked)}
                                            />
                                            Descontar de la caja del turno
                                            {!openRegisterId && <span className="text-amber-400">(no hay caja abierta)</span>}
                                          </label>
                                        )}

                                        <div className="space-y-2">
                                          <Label htmlFor="reference">Número de Referencia (Opcional)</Label>
                                          <Input
                                            id="reference"
                                            value={referenceNumber}
                                            onChange={(e) => setReferenceNumber(e.target.value)}
                                            className="bg-gray-800 border-gray-700 text-white"
                                            placeholder="Ej: Comprobante #123456"
                                          />
                                        </div>

                                        <div className="space-y-2">
                                          <Label htmlFor="notes">Notas (Opcional)</Label>
                                          <Textarea
                                            id="notes"
                                            value={paymentNotes}
                                            onChange={(e) => setPaymentNotes(e.target.value)}
                                            className="bg-gray-800 border-gray-700 text-white"
                                            placeholder="Información adicional..."
                                            rows={3}
                                          />
                                        </div>

                                        <div className="flex gap-3 pt-4">
                                          <Button
                                            variant="outline"
                                            onClick={() => setIsDialogOpen(false)}
                                            className="flex-1 border-gray-700 text-white hover:bg-gray-800"
                                          >
                                            Cancelar
                                          </Button>
                                          <Button
                                            onClick={handleRegisterPayment}
                                            disabled={saving}
                                            className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-white"
                                          >
                                            {saving ? "Guardando..." : "Registrar Pago"}
                                          </Button>
                                        </div>
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                </td>
                              </tr>
                            )
                          })
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card className="bg-gray-900/50 border-gray-700/50">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-700/50">
                        <th className="text-left p-4 text-sm font-semibold text-gray-400">Número Pago</th>
                        <th className="text-left p-4 text-sm font-semibold text-gray-400">OC</th>
                        <th className="text-left p-4 text-sm font-semibold text-gray-400">Proveedor</th>
                        <th className="text-left p-4 text-sm font-semibold text-gray-400">Fecha</th>
                        <th className="text-right p-4 text-sm font-semibold text-gray-400">Monto</th>
                        <th className="text-left p-4 text-sm font-semibold text-gray-400">Método</th>
                        <th className="text-left p-4 text-sm font-semibold text-gray-400">Referencia</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-gray-500">
                            No hay pagos registrados
                          </td>
                        </tr>
                      ) : (
                        payments.map((payment) => (
                          <tr
                            key={payment.id}
                            className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"
                          >
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <Receipt className="w-4 h-4 text-cyan-400" />
                                <span className="text-white font-medium">{payment.payment_number}</span>
                              </div>
                            </td>
                            <td className="p-4 text-gray-300">{payment.purchases?.purchase_number || "Sin OC"}</td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-300">
                                  {payment.purchases?.supplier_name ||
                                    payment.notes?.match(/^Proveedor: (.*?)(?: — |$)/)?.[1] ||
                                    "-"}
                                </span>
                              </div>
                            </td>
                            <td className="p-4 text-gray-400">
                              {format(new Date(payment.payment_date), "dd MMM yyyy", { locale: es })}
                            </td>
                            <td className="p-4 text-right text-green-400 font-semibold">
                              ${payment.amount.toFixed(2)}
                            </td>
                            <td className="p-4">
                              <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                                {getPaymentMethodLabel(payment.payment_method)}
                              </Badge>
                            </td>
                            <td className="p-4 text-gray-400">{payment.reference_number || "-"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
