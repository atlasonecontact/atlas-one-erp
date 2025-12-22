"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Printer, X, CheckCircle, Bluetooth, Usb, Loader2 } from "lucide-react"
import type { CartItem } from "@/app/dashboard/ventas/page"
import { usePrinter } from "@/lib/hooks/use-printer"
import { useToast } from "@/components/ui/toast-provider"

interface ReceiptModalProps {
  open: boolean
  onClose: () => void
  items: CartItem[]
  total: number
  method: string
  storeName?: string
  storeAddress?: string
}

export function ReceiptModal({ open, onClose, items, total, method, storeName = "ATLAS ONE", storeAddress }: ReceiptModalProps) {
  const subtotal = total / 1.21
  const tax = total - subtotal
  const saleId = Math.floor(Math.random() * 9000) + 1000
  const [isPrinting, setIsPrinting] = useState(false)

  const { 
    selectedDevice, 
    isConnecting, 
    isSupported, 
    error, 
    scanForPrinters, 
    printReceipt, 
    printViaWindow,
    clearError 
  } = usePrinter()
  const toast = useToast()

  const handlePrint = async () => {
    setIsPrinting(true)
    
    try {
      const receiptData = {
        storeName,
        storeAddress,
        ticketNumber: `V-${saleId}`,
        date: new Date(),
        items: items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
        subtotal,
        tax,
        total,
        paymentMethod: method,
        footer: "¡Gracias por su compra!",
      }

      if (selectedDevice?.connected) {
        // Print via Bluetooth
        const success = await printReceipt(receiptData, { cutPaper: true })
        if (success) {
          toast.success("Ticket impreso", "Se envió correctamente a la impresora")
        } else {
          toast.error("Error al imprimir", error || "Intenta de nuevo")
        }
      } else {
        // Print via browser
        printViaWindow(receiptData)
        toast.success("Imprimiendo...", "Se abrió el diálogo de impresión del sistema")
      }
    } catch (err: any) {
      toast.error("Error al imprimir", err.message || "Intenta de nuevo")
    } finally {
      setIsPrinting(false)
    }
  }

  const handleConnectPrinter = async () => {
    clearError()
    await scanForPrinters()
    if (error) {
      toast.error("Error de conexión", error)
    }
  }

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
          {/* Printer status */}
          {isSupported && (
            <div className="mb-4 p-3 rounded-lg bg-white/5 border border-cyan-500/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bluetooth className={`w-4 h-4 ${selectedDevice?.connected ? "text-green-400" : "text-gray-500"}`} />
                  <span className="text-sm text-gray-300">
                    {selectedDevice?.connected 
                      ? `Conectado: ${selectedDevice.name}` 
                      : "Impresora no conectada"}
                  </span>
                </div>
                {!selectedDevice?.connected && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleConnectPrinter}
                    disabled={isConnecting}
                    className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 bg-transparent text-xs h-7"
                  >
                    {isConnecting ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      "Conectar"
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Receipt preview */}
          <div className="bg-white text-black rounded-lg p-6 font-mono text-sm">
            <div className="text-center border-b border-dashed border-gray-300 pb-4 mb-4">
              <h3 className="text-lg font-bold">{storeName}</h3>
              {storeAddress && <p className="text-xs text-gray-500">{storeAddress}</p>}
            </div>

            <div className="border-b border-dashed border-gray-300 pb-4 mb-4">
              <div className="flex justify-between text-xs text-gray-500 mb-2">
                <span>Ticket #V-{saleId}</span>
                <span>{new Date().toLocaleString("es-AR")}</span>
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
                Pagado con: {method === "cash" ? "Efectivo" : method === "card" ? "Tarjeta" : method === "qr" ? "QR" : method}
              </p>
              <p className="text-xs text-gray-500 mt-2">¡Gracias por su compra!</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <Button
              variant="outline"
              onClick={handlePrint}
              disabled={isPrinting}
              className="flex-1 border-cyan-500/20 text-gray-300 hover:text-white bg-transparent gap-2"
            >
              {isPrinting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : selectedDevice?.connected ? (
                <Bluetooth className="w-4 h-4" />
              ) : (
                <Printer className="w-4 h-4" />
              )}
              {isPrinting ? "Imprimiendo..." : "Imprimir"}
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
