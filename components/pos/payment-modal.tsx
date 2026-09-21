"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Banknote, CreditCard, QrCode, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/utils/currency"

interface PaymentModalProps {
  open: boolean
  onClose: () => void
  total: number
  onPayment: (method: string) => void
  kioskoId: string
  cartItems: Array<{ id: string; name: string; price: number; quantity: number }>
  employeeName?: string
}

const paymentMethods = [
  { id: "cash", label: "Efectivo", icon: Banknote },
  { id: "card", label: "Tarjeta", icon: CreditCard },
  { id: "qr", label: "QR", icon: QrCode },
]

export function PaymentModal({ open, onClose, total, onPayment, kioskoId, cartItems, employeeName }: PaymentModalProps) {
  const [selectedMethod, setSelectedMethod] = useState("cash")
  const [cashReceived, setCashReceived] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  const cashAmount = Number.parseFloat(cashReceived) || 0
  const change = cashAmount - total

  const handlePayment = async () => {
    setIsProcessing(true)
    const methodLabel = paymentMethods.find((m) => m.id === selectedMethod)?.label || selectedMethod

    try {
      // Call the onPayment callback which saves to database
      await onPayment(selectedMethod)

      const saleData = {
        kioskoId,
        saleId: `V-${Date.now()}`,
        total: total,
        items: cartItems.length,
        itemsSummary: cartItems.map((i) => `${i.quantity}x ${i.name}`).join(", "),
        paymentMethod: methodLabel,
        timestamp: new Date().toISOString(),
        employeeName: employeeName || undefined,
      }

      // Send notification via unified API route
      await fetch("/api/notifications/sale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(saleData),
      })

      setCashReceived("")
    } catch (error) {
      console.error("[v0] Error processing payment:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#0a0f1a] border-cyan-500/20 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Procesar Pago</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Total */}
          <div className="text-center p-6 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
            <p className="text-sm text-gray-400 mb-1">Total a cobrar</p>
            <p className="text-4xl font-bold text-cyan-400">{formatCurrency(total)}</p>
          </div>

          {/* Payment methods */}
          <div className="space-y-3">
            <p className="text-sm text-gray-400">Método de pago</p>
            <div className="grid grid-cols-3 gap-3">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all",
                    selectedMethod === method.id
                      ? "border-cyan-500 bg-cyan-500/10 text-cyan-400"
                      : "border-cyan-500/10 text-gray-400 hover:border-cyan-500/30",
                  )}
                >
                  <method.icon className="w-6 h-6" />
                  <span className="text-sm font-medium">{method.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Cash input */}
          {selectedMethod === "cash" && (
            <div className="space-y-3">
              <p className="text-sm text-gray-400">Efectivo recibido</p>
              <Input
                type="number"
                placeholder="$0"
                value={cashReceived}
                onChange={(e) => setCashReceived(e.target.value)}
                className="bg-[#0d1424] border-cyan-500/20 text-white text-2xl text-center py-6"
              />
              {cashAmount >= total ? (
                <div className="flex justify-between p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <span className="text-green-400">Vuelto</span>
                  <span className="text-green-400 font-bold">{formatCurrency(change)}</span>
                </div>
              ) : (
                <div className="flex justify-between p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <span className="text-amber-400 text-sm">Falta recibir</span>
                  <span className="text-amber-400 font-bold">{formatCurrency(total - cashAmount)}</span>
                </div>
              )}
            </div>
          )}

          {/* Confirm button */}
          <Button
            onClick={handlePayment}
            disabled={(selectedMethod === "cash" && cashAmount < total) || isProcessing}
            className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-semibold py-6 text-lg gap-2"
          >
            {isProcessing ? (
              "Procesando..."
            ) : (
              <>
                <Check className="w-5 h-5" />
                Confirmar Pago
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
