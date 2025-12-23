"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Printer, X, CheckCircle, Bluetooth, Loader2, FileText, ShieldAlert } from "lucide-react"
import { Badge } from "@/components/ui/badge"
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
  saleId?: string
  saleNumber?: string
  kioskoId?: string
  arcaStatus?: { ready: boolean; reason?: string; environment?: string }
  isOfflineSale?: boolean
}

const invoiceTypes = [
  { id: 6, label: "Factura B", helper: "Consumidor final / monotributo" },
  { id: 1, label: "Factura A", helper: "Responsable inscripto" },
  { id: 11, label: "Factura C", helper: "Monotributista emisor" },
]

export function ReceiptModal({
  open,
  onClose,
  items,
  total,
  method,
  storeName = "ATLAS ONE",
  storeAddress,
  saleId: saleIdProp,
  saleNumber,
  kioskoId,
  arcaStatus,
  isOfflineSale,
}: ReceiptModalProps) {
  const subtotal = total / 1.21
  const tax = total - subtotal
  const localTicketId = Math.floor(Math.random() * 9000) + 1000
  const [isPrinting, setIsPrinting] = useState(false)
  const [isInvoicing, setIsInvoicing] = useState(false)
  const [invoiceType, setInvoiceType] = useState<number>(6)
  const [invoiceMessage, setInvoiceMessage] = useState<string>("")
  const [invoiceSuccess, setInvoiceSuccess] = useState<boolean | null>(null)

  const {
    selectedDevice,
    isConnecting,
    isSupported,
    error,
    scanForPrinters,
    printReceipt,
    printViaWindow,
    clearError,
  } = usePrinter()
  const toast = useToast()

  const handlePrint = async () => {
    setIsPrinting(true)
    
    try {
      const receiptData = {
        storeName,
        storeAddress,
        ticketNumber: saleNumber || `V-${saleIdProp || localTicketId}`,
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

  const handleInvoice = async () => {
    if (!saleIdProp || !kioskoId) {
      setInvoiceSuccess(false)
      setInvoiceMessage("Necesitamos la venta para facturar.")
      return
    }
    if (isOfflineSale) {
      setInvoiceSuccess(false)
      setInvoiceMessage("Factura bloqueada: esta venta está offline, se emitirá al sincronizar.")
      return
    }
    if (!arcaStatus?.ready) {
      setInvoiceSuccess(false)
      setInvoiceMessage(arcaStatus?.reason || "Activa ARCA en Integraciones.")
      return
    }

    setIsInvoicing(true)
    setInvoiceMessage("")
    try {
      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saleId: saleIdProp, tipoComprobante: invoiceType }),
      })

      const json = await response.json()
      if (!response.ok) {
        setInvoiceSuccess(false)
        setInvoiceMessage(json?.error || "No se pudo emitir la factura.")
        return
      }

      setInvoiceSuccess(true)
      setInvoiceMessage(
        `Factura generada (#${json?.invoice?.numeroComprobante || "-"}) CAE ${json?.invoice?.cae || "pendiente"}`,
      )
      toast.success("Factura emitida", "Se guardó en la base de datos")
    } catch (err: any) {
      console.error("[Factura] Error:", err)
      setInvoiceSuccess(false)
      setInvoiceMessage(err?.message || "No se pudo emitir la factura.")
    } finally {
      setIsInvoicing(false)
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
                <span>Ticket #{saleNumber || `V-${saleIdProp || localTicketId}`}</span>
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

          {/* Invoice CTA */}
          <div className="mt-4 p-4 rounded-lg border border-cyan-500/10 bg-white/5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-white">Generar factura</p>
                <p className="text-xs text-gray-400">Guarda el comprobante en la base de datos</p>
              </div>
              {arcaStatus?.ready ? (
                <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30">ARCA OK</Badge>
              ) : (
                <Badge variant="outline" className="border-amber-500/40 text-amber-300">Bloqueado</Badge>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              {invoiceTypes.map((type) => (
                <button
                  key={type.id}
                  disabled={!arcaStatus?.ready || isOfflineSale}
                  onClick={() => setInvoiceType(type.id)}
                  className={`rounded-lg border px-3 py-2 text-left transition ${
                    invoiceType === type.id
                      ? "border-cyan-500 bg-cyan-500/10 text-white"
                      : "border-white/10 text-gray-300 hover:border-cyan-500/40"
                  } ${!arcaStatus?.ready || isOfflineSale ? "opacity-60 cursor-not-allowed" : ""}`}
                >
                  <div className="text-sm font-semibold">{type.label}</div>
                  <div className="text-[11px] text-gray-400">{type.helper}</div>
                </button>
              ))}
            </div>

            {!arcaStatus?.ready && (
              <div className="flex items-start gap-2 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg p-2">
                <ShieldAlert className="w-4 h-4 mt-0.5" />
                <span>{arcaStatus?.reason || "Activa ARCA en Integraciones."}</span>
              </div>
            )}
            {isOfflineSale && (
              <div className="flex items-start gap-2 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg p-2">
                <ShieldAlert className="w-4 h-4 mt-0.5" />
                <span>Esta venta se guardó offline. Generaremos la factura al sincronizar.</span>
              </div>
            )}

            <Button
              onClick={handleInvoice}
              disabled={!saleIdProp || !arcaStatus?.ready || isOfflineSale || isInvoicing}
              className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-semibold gap-2"
            >
              {isInvoicing ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              {isInvoicing ? "Generando..." : "Generar factura"}
            </Button>

            {invoiceMessage && (
              <p className={`text-xs ${invoiceSuccess ? "text-emerald-400" : "text-amber-300"}`}>{invoiceMessage}</p>
            )}
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
