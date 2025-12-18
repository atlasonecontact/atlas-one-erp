"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Wallet, Banknote, CreditCard, QrCode, TrendingUp, TrendingDown, DollarSign, Plus } from "lucide-react"

export default function CajaPage() {
  const [isOpen, setIsOpen] = useState(true)
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [openingBalance] = useState(5000)
  const [expenses, setExpenses] = useState([
    { id: 1, description: "Compra de bolsas", amount: 500, time: "09:30" },
    { id: 2, description: "Limpieza", amount: 1200, time: "12:00" },
  ])

  const salesByMethod = {
    cash: 8500,
    card: 4200,
    qr: 2500,
  }

  const totalSales = salesByMethod.cash + salesByMethod.card + salesByMethod.qr
  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0)
  const currentBalance = openingBalance + salesByMethod.cash - totalExpenses

  const handleAddExpense = (description: string, amount: number) => {
    setExpenses((prev) => [
      ...prev,
      {
        id: Date.now(),
        description,
        amount,
        time: new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }),
      },
    ])
    setShowExpenseModal(false)
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
          <Button
            onClick={() => setShowExpenseModal(true)}
            variant="outline"
            className="border-cyan-500/20 text-gray-400 hover:text-white bg-transparent gap-2"
          >
            <Plus className="w-4 h-4" />
            Registrar Gasto
          </Button>
          <Button
            onClick={() => setIsOpen(!isOpen)}
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
          <p className="text-2xl font-bold text-white">24</p>
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
                  <p className="text-xs text-gray-500">12 transacciones</p>
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
                  <p className="text-xs text-gray-500">8 transacciones</p>
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
                  <p className="text-xs text-gray-500">4 transacciones</p>
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
                    <p className="text-white font-medium">{expense.description}</p>
                    <p className="text-xs text-gray-500">{expense.time}</p>
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
