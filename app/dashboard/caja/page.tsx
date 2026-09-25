"use client"

import type React from "react"

import Link from "next/link"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Wallet,
  Banknote,
  CreditCard,
  QrCode,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Plus,
  RefreshCw,
  PiggyBank,
  History,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useEmployeePermissions } from "@/lib/hooks/use-employee-permissions"
import { useToast } from "@/components/ui/toast-provider"
import { formatCurrency } from "@/lib/utils/currency"

interface CashRegister {
  id: string
  opening_balance: number
  closing_balance: number | null
  status: string
  opened_at: string
  closed_at: string | null
  shift?: string | null
  cashier_name?: string | null
  expected_cash?: number | null
  counted_cash?: number | null
  cash_difference?: number | null
  withdrawn_amount?: number | null
  withdrawn_destination?: string | null
  left_for_next?: number | null
  shift_sales_total?: number | null
}

interface Transaction {
  id: string
  type: string
  direction?: string | null
  amount: number
  payment_method: string | null
  notes: string | null
  created_at: string
}

interface SalesByMethod {
  cash: number
  card: number
  qr: number
  other: number
  cashCount: number
  cardCount: number
  qrCount: number
}

const EMPTY_SALES: SalesByMethod = { cash: 0, card: 0, qr: 0, other: 0, cashCount: 0, cardCount: 0, qrCount: 0 }

const SHIFTS = ["Mañana", "Tarde", "Noche"]

const MOVEMENT_TYPES = [
  { value: "expense", label: "Gasto (limpieza, delivery, etc.)", direction: "out" },
  { value: "owner_withdrawal", label: "Retiro del dueño", direction: "out" },
  { value: "supplier_payment", label: "Pago a proveedor", direction: "out" },
  { value: "employee_advance", label: "Vale a empleado", direction: "out" },
  { value: "other_out", label: "Otro egreso", direction: "out" },
  { value: "change_in", label: "Ingreso de cambio (monedas / billetes chicos)", direction: "in" },
  { value: "other_in", label: "Otro ingreso", direction: "in" },
] as const

const MOVEMENT_LABEL: Record<string, string> = {
  expense: "Gasto",
  owner_withdrawal: "Retiro del dueño",
  supplier_payment: "Pago a proveedor",
  employee_advance: "Vale a empleado",
  other_out: "Egreso",
  change_in: "Ingreso de cambio",
  other_in: "Ingreso",
  deposit: "Depósito",
}

const DESTINATION_LABEL: Record<string, string> = {
  safe: "Caja fuerte",
  bank: "Banco",
  owner: "Retiro del dueño",
}

const isIncome = (t: Transaction) => t.direction === "in"

function isMissingFunction(error: any) {
  const msg = String(error?.message || "").toLowerCase()
  return error?.code === "PGRST202" || msg.includes("could not find the function") || msg.includes("does not exist")
}

function toSalesByMethod(sales: { total_amount: number; payment_method: string | null }[]): SalesByMethod {
  const byMethod: SalesByMethod = { ...EMPTY_SALES }
  sales.forEach((s) => {
    const amount = Number(s.total_amount) || 0
    switch (s.payment_method?.toLowerCase()) {
      case "cash":
      case "efectivo":
        byMethod.cash += amount
        byMethod.cashCount++
        break
      case "card":
      case "tarjeta":
        byMethod.card += amount
        byMethod.cardCount++
        break
      case "qr":
      case "transfer":
      case "transferencia":
        byMethod.qr += amount
        byMethod.qrCount++
        break
      default:
        // Un metodo desconocido NO es efectivo: antes se sumaba a la caja y inflaba el esperado.
        byMethod.other += amount
    }
  })
  return byMethod
}

export default function CajaPage() {
  const [isOpen, setIsOpen] = useState(false)
  const [showMovementModal, setShowMovementModal] = useState(false)
  const [showOpenModal, setShowOpenModal] = useState(false)
  const [showCloseModal, setShowCloseModal] = useState(false)
  const [openingBalance, setOpeningBalance] = useState(0)
  const [newOpeningBalance, setNewOpeningBalance] = useState("")
  const [shift, setShift] = useState("")
  const [movements, setMovements] = useState<Transaction[]>([])
  const [salesByMethod, setSalesByMethod] = useState<SalesByMethod>(EMPTY_SALES)
  const [currentRegister, setCurrentRegister] = useState<CashRegister | null>(null)
  const [lastClosed, setLastClosed] = useState<CashRegister | null>(null)
  const [history, setHistory] = useState<CashRegister[]>([])
  const [earnings, setEarnings] = useState<{ today: number; month: number; safe: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [opening, setOpening] = useState(false)
  const [kioskoId, setKioskoId] = useState<string | null>(null)
  const { isOwner } = useEmployeePermissions()

  const supabase = createClient()
  const toast = useToast()

  useEffect(() => {
    loadUserAndCashRegister()
  }, [])

  useEffect(() => {
    if (kioskoId && isOwner) loadEarnings(kioskoId)
  }, [kioskoId, isOwner])

  useEffect(() => {
    // Al abrir el modal, se sugiere lo que quedo en la caja del turno anterior.
    if (showOpenModal && newOpeningBalance === "" && lastClosed) {
      const left = lastClosed.left_for_next ?? lastClosed.closing_balance
      if (left != null) setNewOpeningBalance(String(left))
    }
  }, [showOpenModal])

  const loadUserAndCashRegister = async () => {
    setLoading(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    const { data: employeeData } = await supabase
      .from("employees")
      .select("kiosko_id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle()

    let targetKioskoId: string | null = null

    if (employeeData) {
      targetKioskoId = employeeData.kiosko_id
    } else {
      const { data: kioscos } = await supabase.from("kioscos").select("id").eq("owner_id", user.id).limit(1)
      if (kioscos && kioscos.length > 0) targetKioskoId = kioscos[0].id
    }

    if (targetKioskoId) {
      setKioskoId(targetKioskoId)
      await loadCashRegister(targetKioskoId)
      await loadHistory(targetKioskoId)
    } else {
      console.warn("[Caja] No se encontró kiosko para el usuario")
    }
    setLoading(false)
  }

  const loadCashRegister = async (kiosko_id: string) => {
    const { data: register } = await supabase
      .from("cash_registers")
      .select("*")
      .eq("kiosko_id", kiosko_id)
      .eq("status", "open")
      .order("opened_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (register) {
      setCurrentRegister(register)
      setIsOpen(true)
      setOpeningBalance(Number(register.opening_balance))
      await Promise.all([loadMovements(register.id), loadSales(kiosko_id, register.opened_at)])
    } else {
      setCurrentRegister(null)
      setIsOpen(false)
      setMovements([])
      setSalesByMethod(EMPTY_SALES)
    }
  }

  const loadMovements = async (registerId: string) => {
    const { data } = await supabase
      .from("cash_register_transactions")
      .select("*")
      .eq("cash_register_id", registerId)
      .order("created_at", { ascending: false })

    if (data) setMovements(data)
  }

  // Las ventas se cuentan desde que se abrio ESTA caja (no desde la medianoche),
  // asi dos turnos el mismo dia no se mezclan.
  const loadSales = async (kiosko_id: string, since: string) => {
    const { data: sales } = await supabase
      .from("sales")
      .select("total_amount, payment_method")
      .eq("kiosko_id", kiosko_id)
      .gte("created_at", since)
      .or("status.is.null,status.eq.completed")

    if (sales) setSalesByMethod(toSalesByMethod(sales))
  }

  const loadHistory = async (kiosko_id: string) => {
    const { data } = await supabase
      .from("cash_registers")
      .select("*")
      .eq("kiosko_id", kiosko_id)
      .eq("status", "closed")
      .not("counted_cash", "is", null)
      .order("closed_at", { ascending: false })
      .limit(15)

    if (data) {
      setHistory(data)
      setLastClosed(data[0] ?? null)
    }
  }

  // Lo ganado (todas las ventas): hoy y en el mes hasta hoy. Solo lo ve el dueño.
  const loadEarnings = async (kiosko_id: string) => {
    const { data, error } = await supabase.rpc("earnings_summary", { p_kiosko: kiosko_id })
    if (!error && data) setEarnings({ today: Number(data.today), month: Number(data.month), safe: Number(data.safe ?? 0) })
  }

  const handleOpenCash = async () => {
    if (!kioskoId) {
      toast.error(
        "No se encontró tu kiosco",
        "Tu usuario no figura como empleado activo de ningún kiosco. Pedile al dueño que revise tu alta en Empleados.",
      )
      return
    }
    if (opening) return
    setOpening(true)

    try {
      const balance = Number(newOpeningBalance) || 0

      const { data: rpcData, error: rpcError } = await supabase.rpc("open_cash_register", {
        p_kiosko: kioskoId,
        p_opening: balance,
        p_shift: shift || null,
        p_employee: null,
      })

      if (rpcError && !isMissingFunction(rpcError)) throw rpcError

      if (rpcError) {
        // Base sin scripts/212 todavia: alta directa como antes.
        const { data: existing } = await supabase
          .from("cash_registers")
          .select("id")
          .eq("kiosko_id", kioskoId)
          .eq("status", "open")
          .limit(1)
          .maybeSingle()
        if (!existing) {
          const { error } = await supabase
            .from("cash_registers")
            .insert({ kiosko_id: kioskoId, opening_balance: balance, status: "open" })
          if (error) throw error
        }
      } else if (rpcData && rpcData.created === false) {
        toast.info("La caja ya estaba abierta", "Se muestra la caja abierta actual")
      } else {
        toast.success("Caja abierta", `Saldo inicial ${formatCurrency(balance)}`)
      }

      setShowOpenModal(false)
      setNewOpeningBalance("")
      setShift("")
      await loadCashRegister(kioskoId)
    } catch (error: any) {
      console.error("[Caja] Error al abrir la caja:", error)
      toast.error("No se pudo abrir la caja", error?.message || "Intentá nuevamente en unos segundos")
    } finally {
      setOpening(false)
    }
  }

  const handleConfirmCloseCash = async (countedCash: number, notes: string, withdrawn: number, destination: string) => {
    if (!currentRegister || !kioskoId) return

    const { data, error } = await supabase.rpc("close_cash_register", {
      p_register: currentRegister.id,
      p_counted: countedCash,
      p_withdrawn: withdrawn,
      p_destination: withdrawn > 0 ? destination : null,
      p_notes: notes || null,
    })

    let difference = countedCash - currentBalance

    if (error && isMissingFunction(error)) {
      // Base sin scripts/212 todavia: cierre simple como antes (sin retiro ni cuenta de plata).
      const { error: updError } = await supabase
        .from("cash_registers")
        .update({
          closing_balance: countedCash,
          expected_cash: currentBalance,
          counted_cash: countedCash,
          cash_difference: difference,
          closing_notes: notes || null,
          status: "closed",
          closed_at: new Date().toISOString(),
        })
        .eq("id", currentRegister.id)
      if (updError) {
        console.error("Error closing cash register:", updError)
        toast.error("No se pudo cerrar la caja", updError.message)
        return
      }
    } else if (error) {
      console.error("Error closing cash register:", error)
      toast.error("No se pudo cerrar la caja", error.message)
      return
    } else if (data && typeof data.difference === "number") {
      difference = Number(data.difference)
    }

    setShowCloseModal(false)
    toast.success(
      "Caja cerrada",
      difference === 0
        ? "El conteo coincide con lo esperado"
        : `Diferencia de ${formatCurrency(Math.abs(difference))} ${difference > 0 ? "sobrante" : "faltante"}`,
    )
    await loadCashRegister(kioskoId)
    await loadHistory(kioskoId)
    if (isOwner) await loadEarnings(kioskoId)
  }

  const totalSales = salesByMethod.cash + salesByMethod.card + salesByMethod.qr + salesByMethod.other
  const totalIn = movements.filter(isIncome).reduce((acc, m) => acc + Number(m.amount), 0)
  const totalOut = movements.filter((m) => !isIncome(m)).reduce((acc, m) => acc + Number(m.amount), 0)
  const currentBalance = openingBalance + salesByMethod.cash + totalIn - totalOut
  const totalTransactions = salesByMethod.cashCount + salesByMethod.cardCount + salesByMethod.qrCount

  const handleAddMovement = async (type: string, direction: string, description: string, amount: number) => {
    if (!currentRegister) return

    const { data, error } = await supabase
      .from("cash_register_transactions")
      .insert({
        cash_register_id: currentRegister.id,
        type,
        direction,
        amount,
        payment_method: "cash",
        notes: description,
      })
      .select()
      .single()

    if (error || !data) {
      console.error("[Caja] Error al registrar el movimiento:", error)
      toast.error("No se pudo registrar el movimiento", error?.message || "Intentá nuevamente")
      return
    }

    setMovements((prev) => [data, ...prev])
    setShowMovementModal(false)
    toast.success(direction === "in" ? "Ingreso registrado" : "Egreso registrado", formatCurrency(amount))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-cyan-500 animate-spin" />
      </div>
    )
  }

  if (!kioskoId) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Caja</h1>
            <p className="text-gray-400 text-sm">Control de caja y movimientos del día</p>
          </div>
        </div>

        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-8 text-center">
          <div className="w-16 h-16 rounded-xl flex items-center justify-center bg-yellow-500/20 text-yellow-400 mx-auto mb-4">
            <Wallet className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No hay kiosko configurado</h3>
          <p className="text-gray-400 mb-6">
            Para usar la caja, primero necesitás configurar un kiosko en tu cuenta.
            <br />
            Andá a Configuración para crear tu primer kiosko.
          </p>
          <Button
            onClick={() => (window.location.href = "/dashboard/configuracion")}
            className="bg-cyan-500 hover:bg-cyan-400 text-black"
          >
            Ir a Configuración
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Caja</h1>
          <p className="text-gray-400 text-sm">Control de caja y movimientos del turno</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Button
            onClick={() => {
              if (!isOpen) {
                toast.info("Abrí la caja primero", "Los movimientos se registran dentro de un turno con la caja abierta")
                return
              }
              setShowMovementModal(true)
            }}
            variant="outline"
            className={`border-cyan-500/20 text-gray-400 hover:text-white bg-transparent gap-2 ${isOpen ? "" : "opacity-60"}`}
          >
            <Plus className="w-4 h-4" />
            Movimiento
          </Button>
          <Button
            onClick={() => (isOpen ? setShowCloseModal(true) : setShowOpenModal(true))}
            className={isOpen ? "bg-red-500 hover:bg-red-400 text-white" : "bg-cyan-500 hover:bg-cyan-400 text-black"}
          >
            {isOpen ? "Cerrar Caja" : "Abrir Caja"}
          </Button>
        </div>
      </div>

      {/* Status Card */}
      <div
        className={`rounded-xl border p-6 ${isOpen ? "border-green-500/30 bg-green-500/10" : "border-red-500/30 bg-red-500/10"}`}
      >
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center ${isOpen ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}
            >
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Estado de caja</p>
              <p className={`text-xl font-bold ${isOpen ? "text-green-400" : "text-red-400"}`}>
                {isOpen ? "Caja Abierta" : "Caja Cerrada"}
              </p>
              {isOpen && currentRegister && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {currentRegister.shift ? `Turno ${currentRegister.shift} · ` : ""}
                  {currentRegister.cashier_name ? `${currentRegister.cashier_name} · ` : ""}
                  desde {new Date(currentRegister.opened_at).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" })}
                </p>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400">Efectivo esperado en caja</p>
            <p className="text-3xl font-bold text-white">{formatCurrency(currentBalance)}</p>
          </div>
        </div>
      </div>

      {/* Ganado (solo dueño) */}
      {isOwner && earnings && (
        <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-8 flex-wrap">
              <div className="flex items-center gap-3">
                <PiggyBank className="w-7 h-7 text-amber-400" />
                <div>
                  <p className="text-xs text-gray-300">En la caja fuerte</p>
                  <p className="text-2xl font-bold text-amber-400">{formatCurrency(earnings.safe)}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-300">Ganado este mes (hasta hoy)</p>
                <p className="text-2xl font-bold text-green-400">{formatCurrency(earnings.month)}</p>
                <p className="text-xs text-gray-400">Hoy: {formatCurrency(earnings.today)}</p>
              </div>
            </div>
            <Link href="/dashboard/caja/plata" className="text-sm text-cyan-400 hover:text-cyan-300">
              Ver Caja fuerte mes por mes →
            </Link>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-400">Apertura</span>
            <DollarSign className="w-5 h-5 text-cyan-400" />
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(openingBalance)}</p>
        </div>

        <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-400">Ventas del turno</span>
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <p className="text-2xl font-bold text-green-400">{formatCurrency(totalSales)}</p>
        </div>

        <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-400">Egresos</span>
            <TrendingDown className="w-5 h-5 text-red-400" />
          </div>
          <p className="text-2xl font-bold text-red-400">{formatCurrency(totalOut)}</p>
          {totalIn > 0 && <p className="text-xs text-gray-500 mt-1">Ingresos: {formatCurrency(totalIn)}</p>}
        </div>

        <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-400">Transacciones</span>
            <Wallet className="w-5 h-5 text-cyan-400" />
          </div>
          <p className="text-2xl font-bold text-white">{totalTransactions}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Methods Breakdown */}
        <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Desglose por Método de Pago</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <Banknote className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Efectivo</p>
                  <p className="text-xs text-gray-500">{salesByMethod.cashCount} transacciones</p>
                </div>
              </div>
              <p className="text-xl font-bold text-white">{formatCurrency(salesByMethod.cash)}</p>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Tarjeta</p>
                  <p className="text-xs text-gray-500">{salesByMethod.cardCount} transacciones</p>
                </div>
              </div>
              <p className="text-xl font-bold text-white">{formatCurrency(salesByMethod.card)}</p>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <QrCode className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-white font-medium">QR / Transferencia</p>
                  <p className="text-xs text-gray-500">{salesByMethod.qrCount} transacciones</p>
                </div>
              </div>
              <p className="text-xl font-bold text-white">{formatCurrency(salesByMethod.qr)}</p>
            </div>

            {salesByMethod.other > 0 && (
              <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
                <p className="text-white font-medium">Otros métodos</p>
                <p className="text-xl font-bold text-white">{formatCurrency(salesByMethod.other)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Movements */}
        <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Movimientos del turno</h3>
          {movements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <TrendingDown className="w-12 h-12 mb-3 opacity-50" />
              <p className="text-sm">No hay movimientos registrados</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {movements.map((m) => (
                <div key={m.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                  <div className="min-w-0">
                    <p className="text-white font-medium truncate">{m.notes || MOVEMENT_LABEL[m.type] || "Movimiento"}</p>
                    <p className="text-xs text-gray-500">
                      {MOVEMENT_LABEL[m.type] || m.type} ·{" "}
                      {new Date(m.created_at).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <p className={`font-bold shrink-0 ${isIncome(m) ? "text-green-400" : "text-red-400"}`}>
                    {isIncome(m) ? "+" : "-"}
                    {formatCurrency(m.amount)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Historial de cierres */}
      <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-5">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <History className="w-5 h-5 text-cyan-400" />
          Historial de cierres
        </h3>
        {history.length === 0 ? (
          <p className="text-sm text-gray-500 py-6 text-center">Todavía no hay cierres de caja.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-white/10">
                  <th className="py-2 pr-4 font-medium">Cierre</th>
                  <th className="py-2 pr-4 font-medium">Turno</th>
                  <th className="py-2 pr-4 font-medium text-right">Ganado</th>
                  <th className="py-2 pr-4 font-medium text-right">Esperado</th>
                  <th className="py-2 pr-4 font-medium text-right">Contado</th>
                  <th className="py-2 pr-4 font-medium text-right">Diferencia</th>
                  <th className="py-2 pr-4 font-medium text-right">Retiro</th>
                  <th className="py-2 font-medium text-right">Queda</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => {
                  const diff = Number(h.cash_difference ?? 0)
                  const hasWithdrawal = Number(h.withdrawn_amount ?? 0) > 0
                  return (
                    <tr key={h.id} className="border-b border-white/5 text-gray-300">
                      <td className="py-3 pr-4 whitespace-nowrap">
                        {h.closed_at
                          ? new Date(h.closed_at).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" })
                          : "-"}
                      </td>
                      <td className="py-3 pr-4 whitespace-nowrap">
                        {h.shift || "-"}
                        {h.cashier_name ? <span className="text-gray-500"> · {h.cashier_name}</span> : null}
                      </td>
                      <td className="py-3 pr-4 text-right text-green-400 font-semibold">
                        {h.shift_sales_total != null ? formatCurrency(Number(h.shift_sales_total)) : "-"}
                      </td>
                      <td className="py-3 pr-4 text-right">{h.expected_cash != null ? formatCurrency(Number(h.expected_cash)) : "-"}</td>
                      <td className="py-3 pr-4 text-right">{h.counted_cash != null ? formatCurrency(Number(h.counted_cash)) : "-"}</td>
                      <td
                        className={`py-3 pr-4 text-right font-semibold ${
                          diff === 0 ? "text-green-400" : "text-red-400"
                        }`}
                      >
                        {h.cash_difference == null ? "-" : diff === 0 ? "Coincide" : `${diff > 0 ? "+" : "-"}${formatCurrency(Math.abs(diff))}`}
                      </td>
                      <td className="py-3 pr-4 text-right whitespace-nowrap">
                        {hasWithdrawal
                          ? `${formatCurrency(Number(h.withdrawn_amount))} → ${DESTINATION_LABEL[h.withdrawn_destination || ""] || ""}`
                          : "-"}
                      </td>
                      <td className="py-3 text-right">{h.left_for_next != null ? formatCurrency(Number(h.left_for_next)) : "-"}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <MovementModal open={showMovementModal} onClose={() => setShowMovementModal(false)} onSave={handleAddMovement} />

      <CloseCashModal
        open={showCloseModal}
        onClose={() => setShowCloseModal(false)}
        expectedCash={currentBalance}
        openingBalance={openingBalance}
        shiftSales={totalSales}
        onConfirm={handleConfirmCloseCash}
      />

      {/* Open Cash Modal */}
      <Dialog open={showOpenModal} onOpenChange={setShowOpenModal}>
        <DialogContent className="bg-[#0a0f1a] border-cyan-500/20 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Abrir Caja</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Turno</Label>
              <div className="grid grid-cols-3 gap-2">
                {SHIFTS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setShift(shift === s ? "" : s)}
                    className={`py-2 rounded-lg border text-sm transition-colors ${
                      shift === s
                        ? "border-cyan-500 bg-cyan-500/10 text-cyan-400"
                        : "border-cyan-500/10 text-gray-400 hover:border-cyan-500/30"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Saldo inicial</Label>
              <Input
                type="number"
                value={newOpeningBalance}
                onChange={(e) => setNewOpeningBalance(e.target.value)}
                placeholder="$0"
                className="bg-[#0d1424] border-cyan-500/20 text-white"
              />
              <p className="text-xs text-gray-500">
                {lastClosed && (lastClosed.left_for_next ?? lastClosed.closing_balance) != null
                  ? `Quedó en la caja del turno anterior: ${formatCurrency(Number(lastClosed.left_for_next ?? lastClosed.closing_balance))}. Corregilo si contaste otra cosa.`
                  : "Ingresá el dinero con el que iniciás la caja"}
              </p>
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowOpenModal(false)}
                className="flex-1 border-cyan-500/20 text-gray-400 hover:text-white bg-transparent"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleOpenCash}
                disabled={opening}
                className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold"
              >
                {opening ? "Abriendo..." : "Abrir Caja"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function MovementModal({
  open,
  onClose,
  onSave,
}: {
  open: boolean
  onClose: () => void
  onSave: (type: string, direction: string, description: string, amount: number) => Promise<void> | void
}) {
  const [type, setType] = useState<string>("expense")
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [saving, setSaving] = useState(false)

  const selected = MOVEMENT_TYPES.find((t) => t.value === type) ?? MOVEMENT_TYPES[0]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (saving) return
    setSaving(true)
    await onSave(selected.value, selected.direction, description.trim(), Number(amount))
    setSaving(false)
    setDescription("")
    setAmount("")
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#0a0f1a] border-cyan-500/20 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Movimiento de caja</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-gray-300">Tipo</Label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full h-10 rounded-md bg-[#0d1424] border border-cyan-500/20 text-white px-3 text-sm"
            >
              {MOVEMENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.direction === "in" ? "Ingreso · " : "Egreso · "}
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label className="text-gray-300">Descripción</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: compra de insumos de limpieza"
              className="bg-[#0d1424] border-cyan-500/20 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-gray-300">Monto</Label>
            <Input
              type="number"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="$0"
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
            <Button
              type="submit"
              disabled={saving || !description.trim() || !(Number(amount) > 0)}
              className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold"
            >
              {saving ? "Guardando..." : "Registrar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function CloseCashModal({
  open,
  onClose,
  expectedCash,
  openingBalance,
  shiftSales,
  onConfirm,
}: {
  open: boolean
  onClose: () => void
  expectedCash: number
  openingBalance: number
  shiftSales: number
  onConfirm: (countedCash: number, notes: string, withdrawn: number, destination: string) => Promise<void> | void
}) {
  const [counted, setCounted] = useState("")
  const [notes, setNotes] = useState("")
  const [left, setLeft] = useState("")
  const [destination, setDestination] = useState<"safe" | "owner">("safe")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    // Lo que se deja en la caja para el proximo turno (cambio) arranca igual al saldo de apertura.
    if (open) setLeft(String(openingBalance || 0))
  }, [open, openingBalance])

  const countedAmount = Number.parseFloat(counted) || 0
  const difference = countedAmount - expectedCash
  // Todo lo contado que no se deja en la caja se guarda (caja fuerte) o lo retira el dueño.
  const leftAmount = Math.min(Math.max(Number.parseFloat(left) || 0, 0), countedAmount)
  const withdrawnAmount = Math.max(countedAmount - leftAmount, 0)
  const canSubmit = counted !== "" && countedAmount >= 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit || submitting) return
    setSubmitting(true)
    await onConfirm(countedAmount, notes, withdrawnAmount, destination)
    setSubmitting(false)
    setCounted("")
    setNotes("")
    setDestination("safe")
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#0a0f1a] border-cyan-500/20 text-white max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Cerrar Caja — Arqueo</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="flex justify-between p-4 rounded-lg bg-green-500/10 border border-green-500/20">
            <div>
              <p className="text-green-300">Ganado en este turno</p>
              <p className="text-xs text-gray-400">Todas las ventas: se suma completo a la Caja fuerte</p>
            </div>
            <span className="text-green-400 font-bold">{formatCurrency(shiftSales)}</span>
          </div>

          <div className="flex justify-between p-4 rounded-lg bg-white/5">
            <span className="text-gray-400">Efectivo esperado (teórico)</span>
            <span className="text-white font-bold">{formatCurrency(expectedCash)}</span>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300">Efectivo contado en caja</Label>
            <Input
              type="number"
              min="0"
              value={counted}
              onChange={(e) => setCounted(e.target.value)}
              placeholder="$0"
              autoFocus
              className="bg-[#0d1424] border-cyan-500/20 text-white text-xl text-center py-5"
            />
            <p className="text-xs text-gray-500">Contá el efectivo físico de la caja antes de confirmar el cierre</p>
          </div>

          {counted !== "" && (
            <div
              className={`flex justify-between p-4 rounded-lg border ${
                difference === 0 ? "bg-green-500/10 border-green-500/20" : "bg-amber-500/10 border-amber-500/20"
              }`}
            >
              <span className={difference === 0 ? "text-green-400" : "text-amber-400"}>
                {difference === 0 ? "Coincide" : difference > 0 ? "Sobrante" : "Faltante"}
              </span>
              <span className={`font-bold ${difference === 0 ? "text-green-400" : "text-amber-400"}`}>
                {formatCurrency(Math.abs(difference))}
              </span>
            </div>
          )}

          <div className="space-y-3 p-4 rounded-lg border border-cyan-500/10 bg-white/[0.03]">
            <div className="space-y-2">
              <Label className="text-gray-300">Queda en la caja para el próximo turno (cambio)</Label>
              <Input
                type="number"
                min="0"
                value={left}
                onChange={(e) => setLeft(e.target.value)}
                placeholder="$0"
                className="bg-[#0d1424] border-cyan-500/20 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">El efectivo que sacás de la caja va a</Label>
              <div className="grid grid-cols-2 gap-2">
                {(["safe", "owner"] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDestination(d)}
                    className={`py-2 rounded-lg border text-sm transition-colors ${
                      destination === d
                        ? "border-cyan-500 bg-cyan-500/10 text-cyan-400"
                        : "border-cyan-500/10 text-gray-400 hover:border-cyan-500/30"
                    }`}
                  >
                    {DESTINATION_LABEL[d]}
                  </button>
                ))}
              </div>
            </div>

            {counted !== "" && (
              <div className="flex justify-between text-sm pt-1">
                <span className="text-gray-400">
                  {destination === "safe" ? "Efectivo a la caja fuerte" : "Efectivo que retira el dueño"}
                </span>
                <span className="text-white font-semibold">{formatCurrency(withdrawnAmount)}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300">Notas (opcional)</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: faltante por vuelto mal dado"
              className="bg-[#0d1424] border-cyan-500/20 text-white"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-cyan-500/20 text-gray-400 hover:text-white bg-transparent"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!canSubmit || submitting}
              className="flex-1 bg-red-500 hover:bg-red-400 text-white font-semibold"
            >
              {submitting ? "Cerrando..." : "Confirmar Cierre"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
