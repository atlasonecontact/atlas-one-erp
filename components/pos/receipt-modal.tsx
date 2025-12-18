"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Printer, X, CheckCircle } from "lucide-react"
import type { CartItem } from "@/app/dashboard/ventas/page"

interface ReceiptModalProps {
  open: boolean
  onClose: () => void
  items: CartItem[]
  total: number
  method: string
}

export function ReceiptModal({ open, onClose, items, total, method }: ReceiptModalProps) {
  const subtotal = total / 1.21
  const tax = total - subtotal
  const saleId = Math.floor(Math.random() * 9000) + 1000

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#0a0f1a] border-cyan-500/20 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <CheckCircle className="w-6 h-6 text-green-400" />
            Venta Completada
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {/* Receipt preview */}
          <div className="bg-white text-black rounded-lg p-6 font-mono text-sm">
            <div className="text-center border-b border-dashed border-gray-300 pb-4 mb-4">
              <h3 className="text-lg font-bold">ATLAS ONE</h3>
              <p className="text-xs text-gray-500">Minimarket Express</p>
              <p className="text-xs text-gray-500">Sucursal Principal</p>
            </div>

            <div className="border-b border-dashed border-gray-300 pb-4 mb-4">
              <div className="flex justify-between text-xs text-gray-500 mb-2">
                <span>Ticket #{saleId}</span>
                <span>{new Date().toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-2 border-b border-dashed border-gray-300 pb-4 mb-4">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between">
                  <span>
                    {item.quantity}x {item.name}
                  </span>
                  <span>${(item.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>${subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>IVA (21%)</span>
                <span>${tax.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-300 mt-2">
                <span>TOTAL</span>
                <span>${total.toLocaleString()}</span>
              </div>
            </div>

            <div className="text-center mt-4 pt-4 border-t border-dashed border-gray-300">
              <p className="text-xs text-gray-500">
                Pagado con: {method === "cash" ? "Efectivo" : method === "card" ? "Tarjeta" : "QR"}
              </p>
              <p className="text-xs text-gray-500 mt-2">¡Gracias por su compra!</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <Button
              variant="outline"
              className="flex-1 border-cyan-500/20 text-gray-400 hover:text-white bg-transparent gap-2"
            >
              <Printer className="w-4 h-4" />
              Imprimir
            </Button>
            <Button onClick={onClose} className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold gap-2">
              <X className="w-4 h-4" />
              Cerrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
