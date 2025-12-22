"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Wallet, Banknote, CreditCard, QrCode, TrendingUp, TrendingDown, DollarSign, Plus, RefreshCw } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface CashRegister {
  id: string
  opening_balance: number
  closing_balance: number | null
  status: string
  opened_at: string
  closed_at: string | null
}

interface Transaction {
  id: string
  type: string
  amount: number
  payment_method: string | null
  notes: string | null
  created_at: string
}

interface SalesByMethod {
  cash: number
  card: number
  qr: number
  cashCount: number
  cardCount: number
  qrCount: number
}

export default function CajaPage() {
  const [isOpen, setIsOpen] = useState(false)
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [showOpenModal, setShowOpenModal] = useState(false)
  const [openingBalance, setOpeningBalance] = useState(0)
  const [newOpeningBalance, setNewOpeningBalance] = useState("")
  const [expenses, setExpenses] = useState<Transaction[]>([])
  const [salesByMethod, setSalesByMethod] = useState<SalesByMethod>({ cash: 0, card: 0, qr: 0, cashCount: 0, cardCount: 0, qrCount: 0 })
  const [currentRegister, setCurrentRegister] = useState<CashRegister | null>(null)
  const [loading, setLoading] = useState(true)
  const [kioskoId, setKioskoId] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    loadUserAndCashRegister()
  }, [])

  const loadUserAndCashRegister = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    // Get kiosko
    const { data: employeeData } = await supabase
      .from("employees")
      .select("kiosko_id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle()

    let targetKioskoId: string | null = null

    if (employeeData) {
      targetKioskoId = employeeData.kiosko_id
    } else {
      const { data: kioscos } = await supabase
        .from("kioscos")
        .select("id")
        .eq("owner_id", user.id)
        .limit(1)

      if (kioscos && kioscos.length > 0) {
        targetKioskoId = kioscos[0].id
      }
    }

    if (targetKioskoId) {
      setKioskoId(targetKioskoId)
      await loadCashRegister(targetKioskoId)
      await loadTodaySales(targetKioskoId)
    }
    setLoading(false)
  }

  const loadCashRegister = async (kiosko_id: string) => {
    // Get today's open register or create one
    const today = new Date()
    today.setHours(0, 0, 0, 0)

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
      await loadTransactions(register.id)
    } else {
      setIsOpen(false)
    }
  }

  const loadTransactions = async (registerId: string) => {
    const { data } = await supabase
      .from("cash_register_transactions")
      .select("*")
      .eq("cash_register_id", registerId)
      .eq("type", "expense")
      .order("created_at", { ascending: false })

    if (data) {
      setExpenses(data)
    }
  }

  const loadTodaySales = async (kiosko_id: string) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { data: sales } = await supabase
      .from("sales")
      .select("total_amount, payment_method")
      .eq("kiosko_id", kiosko_id)
      .gte("created_at", today.toISOString())

    if (sales) {
      const byMethod: SalesByMethod = { cash: 0, card: 0, qr: 0, cashCount: 0, cardCount: 0, qrCount: 0 }
      sales.forEach((s) => {
        const amount = Number(s.total_amount)
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
            byMethod.qr += amount
            byMethod.qrCount++
            break
          default:
            byMethod.cash += amount
            byMethod.cashCount++
        }
      })
      setSalesByMethod(byMethod)
    }
  }

  const handleOpenCash = async () => {
    if (!kioskoId) return
    
    const balance = Number(newOpeningBalance) || 0
    const { data, error } = await supabase
      .from("cash_registers")
      .insert({
        kiosko_id: kioskoId,
        opening_balance: balance,
        status: "open",
      })
      .select()
      .single()

    if (!error && data) {
      setCurrentRegister(data)
      setOpeningBalance(balance)
      setIsOpen(true)
      setShowOpenModal(false)
      setNewOpeningBalance("")
    }
  }

  const handleCloseCash = async () => {
    if (!currentRegister) return
    
    const { error } = await supabase
      .from("cash_registers")
      .update({
        closing_balance: currentBalance,
        status: "closed",
        closed_at: new Date().toISOString(),
      })
      .eq("id", currentRegister.id)

    if (!error) {
      setIsOpen(false)
      setCurrentRegister(null)
      setExpenses([])
    }
  }

  const totalSales = salesByMethod.cash + salesByMethod.card + salesByMethod.qr
  const totalExpenses = expenses.reduce((acc, e) => acc + Number(e.amount), 0)
  const currentBalance = openingBalance + salesByMethod.cash - totalExpenses
  const totalTransactions = salesByMethod.cashCount + salesByMethod.cardCount + salesByMethod.qrCount

  const handleAddExpense = async (description: string, amount: number) => {
    if (!currentRegister) return

    const { data, error } = await supabase
      .from("cash_register_transactions")
      .insert({
        cash_register_id: currentRegister.id,
        type: "expense",
        amount: amount,
        notes: description,
      })
      .select()
      .single()

    if (!error && data) {
      setExpenses((prev) => [data, ...prev])
    }
    setShowExpenseModal(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-cyan-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Caja</h1>
          <p className="text-gray-400 text-sm">Control de caja y movimientos del día</p>
        </div>
        <div className="flex items-center gap-3">
          {isOpen && (
            <Button
              onClick={() => setShowExpenseModal(true)}
              variant="outline"
              className="border-cyan-500/20 text-gray-400 hover:text-white bg-transparent gap-2"
            >
              <Plus className="w-4 h-4" />
              Registrar Gasto
            </Button>
          )}
          <Button
            onClick={() => isOpen ? handleCloseCash() : setShowOpenModal(true)}
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
        <div className="flex items-center justify-between">
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
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400">Balance actual</p>
            <p className="text-3xl font-bold text-white">${currentBalance.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-400">Apertura</span>
            <DollarSign className="w-5 h-5 text-cyan-400" />
          </div>
          <p className="text-2xl font-bold text-white">${openingBalance.toLocaleString()}</p>
        </div>

        <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-400">Ventas totales</span>
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <p className="text-2xl font-bold text-green-400">${totalSales.toLocaleString()}</p>
        </div>

        <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-400">Gastos</span>
            <TrendingDown className="w-5 h-5 text-red-400" />
          </div>
          <p className="text-2xl font-bold text-red-400">${totalExpenses.toLocaleString()}</p>
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
              <p className="text-xl font-bold text-white">${salesByMethod.cash.toLocaleString()}</p>
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
              <p className="text-xl font-bold text-white">${salesByMethod.card.toLocaleString()}</p>
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
              <p className="text-xl font-bold text-white">${salesByMethod.qr.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Expenses */}
        <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Gastos del Día</h3>
          {expenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <TrendingDown className="w-12 h-12 mb-3 opacity-50" />
              <p className="text-sm">No hay gastos registrados</p>
            </div>
          ) : (
            <div className="space-y-3">
              {expenses.map((expense) => (
                <div key={expense.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                  <div>
                    <p className="text-white font-medium">{expense.notes || 'Gasto'}</p>
                    <p className="text-xs text-gray-500">{new Date(expense.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <p className="text-red-400 font-bold">-${expense.amount.toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Expense Modal */}
      <ExpenseModal open={showExpenseModal} onClose={() => setShowExpenseModal(false)} onSave={handleAddExpense} />
    </div>
  )
}

function ExpenseModal({
  open,
  onClose,
  onSave,
}: {
  open: boolean
  onClose: () => void
  onSave: (description: string, amount: number) => void
}) {
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(description, Number(amount))
    setDescription("")
    setAmount("")
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#0a0f1a] border-cyan-500/20 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Registrar Gasto</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-gray-300">Descripción</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: Compra de insumos"
              className="bg-[#0d1424] border-cyan-500/20 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-gray-300">Monto</Label>
            <Input
              type="number"
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
              disabled={!description || !amount}
              className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold"
            >
              Registrar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
