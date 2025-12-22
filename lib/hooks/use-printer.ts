"use client"

import { useState, useEffect, useCallback, useRef } from "react"

type PrinterType = "thermal" | "standard"

interface PrinterDevice {
  id: string
  name: string
  type: PrinterType
  connected: boolean
}

interface PrintOptions {
  copies?: number
  paperWidth?: 58 | 80 // mm for thermal printers
  cutPaper?: boolean
}

interface ReceiptData {
  storeName: string
  storeAddress?: string
  ticketNumber: string
  date: Date
  items: { name: string; quantity: number; price: number }[]
  subtotal: number
  tax: number
  total: number
  paymentMethod: string
  footer?: string
}

export function usePrinter() {
  const [devices, setDevices] = useState<PrinterDevice[]>([])
  const [selectedDevice, setSelectedDevice] = useState<PrinterDevice | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const characteristicRef = useRef<BluetoothRemoteGATTCharacteristic | null>(null)

  // Check if Web Bluetooth is supported
  useEffect(() => {
    if (typeof navigator !== "undefined" && "bluetooth" in navigator) {
      setIsSupported(true)
    }
  }, [])

  // ESC/POS commands for thermal printers
  const ESC_POS = {
    INIT: new Uint8Array([0x1b, 0x40]), // Initialize printer
    ALIGN_CENTER: new Uint8Array([0x1b, 0x61, 0x01]),
    ALIGN_LEFT: new Uint8Array([0x1b, 0x61, 0x00]),
    ALIGN_RIGHT: new Uint8Array([0x1b, 0x61, 0x02]),
    BOLD_ON: new Uint8Array([0x1b, 0x45, 0x01]),
    BOLD_OFF: new Uint8Array([0x1b, 0x45, 0x00]),
    DOUBLE_HEIGHT_ON: new Uint8Array([0x1b, 0x21, 0x10]),
    DOUBLE_HEIGHT_OFF: new Uint8Array([0x1b, 0x21, 0x00]),
    LINE_FEED: new Uint8Array([0x0a]),
    CUT_PAPER: new Uint8Array([0x1d, 0x56, 0x00]), // Full cut
    PARTIAL_CUT: new Uint8Array([0x1d, 0x56, 0x01]),
    DRAWER_OPEN: new Uint8Array([0x1b, 0x70, 0x00, 0x19, 0xfa]), // Open cash drawer
  }

  // Convert string to bytes
  const textToBytes = (text: string): Uint8Array => {
    const encoder = new TextEncoder()
    return encoder.encode(text)
  }

  // Combine multiple Uint8Arrays
  const concatBytes = (...arrays: Uint8Array[]): Uint8Array => {
    const totalLength = arrays.reduce((acc, arr) => acc + arr.length, 0)
    const result = new Uint8Array(totalLength)
    let offset = 0
    for (const arr of arrays) {
      result.set(arr, offset)
      offset += arr.length
    }
    return result
  }

  // Search for Bluetooth printers
  const scanForPrinters = useCallback(async () => {
    if (!isSupported) {
      setError("Bluetooth no está soportado en este navegador")
      return
    }

    setIsConnecting(true)
    setError(null)

    try {
      // @ts-ignore - TypeScript doesn't have full Web Bluetooth types
      const device = await navigator.bluetooth.requestDevice({
        // Accept all printers - common services for thermal printers
        filters: [
          { services: ["000018f0-0000-1000-8000-00805f9b34fb"] }, // Common thermal printer service
          { namePrefix: "Printer" },
          { namePrefix: "POS" },
          { namePrefix: "MTP" },
          { namePrefix: "MPT" },
          { namePrefix: "BlueTooth Printer" },
          { namePrefix: "Gprinter" },
          { namePrefix: "Xprinter" },
        ],
        optionalServices: [
          "000018f0-0000-1000-8000-00805f9b34fb",
          "e7810a71-73ae-499d-8c15-faa9aef0c3f2", // Another common printer service
          "49535343-fe7d-4ae5-8fa9-9fafd205e455", // Nordic UART Service
        ],
      })

      if (device) {
        const newDevice: PrinterDevice = {
          id: device.id,
          name: device.name || "Impresora desconocida",
          type: "thermal",
          connected: false,
        }

        setDevices((prev) => {
          const exists = prev.find((d) => d.id === device.id)
          if (exists) return prev
          return [...prev, newDevice]
        })

        // Try to connect
        await connectToDevice(device)
      }
    } catch (err: any) {
      if (err.name === "NotFoundError") {
        setError("No se encontró ninguna impresora. Asegúrate de que esté encendida y en modo de emparejamiento.")
      } else {
        setError(err.message || "Error al buscar impresoras")
      }
    } finally {
      setIsConnecting(false)
    }
  }, [isSupported])

  // Connect to a specific device
  const connectToDevice = async (device: BluetoothDevice) => {
    try {
      const server = await device.gatt?.connect()
      if (!server) throw new Error("No se pudo conectar al servidor GATT")

      // Try common printer services
      const serviceUUIDs = [
        "000018f0-0000-1000-8000-00805f9b34fb",
        "e7810a71-73ae-499d-8c15-faa9aef0c3f2",
        "49535343-fe7d-4ae5-8fa9-9fafd205e455",
      ]

      let service: BluetoothRemoteGATTService | null = null
      for (const uuid of serviceUUIDs) {
        try {
          service = await server.getPrimaryService(uuid)
          break
        } catch {
          continue
        }
      }

      if (!service) throw new Error("No se encontró servicio de impresión")

      // Get characteristics
      const characteristics = await service.getCharacteristics()
      const writeChar = characteristics.find(
        (c) => c.properties.write || c.properties.writeWithoutResponse
      )

      if (!writeChar) throw new Error("No se encontró característica de escritura")

      characteristicRef.current = writeChar

      const connectedDevice: PrinterDevice = {
        id: device.id,
        name: device.name || "Impresora",
        type: "thermal",
        connected: true,
      }

      setSelectedDevice(connectedDevice)
      setDevices((prev) => prev.map((d) => (d.id === device.id ? connectedDevice : d)))

      // Listen for disconnection
      device.addEventListener("gattserverdisconnected", () => {
        setSelectedDevice(null)
        setDevices((prev) => prev.map((d) => (d.id === device.id ? { ...d, connected: false } : d)))
        characteristicRef.current = null
      })

      return true
    } catch (err: any) {
      setError(err.message || "Error al conectar con la impresora")
      return false
    }
  }

  // Print receipt
  const printReceipt = useCallback(async (data: ReceiptData, options?: PrintOptions): Promise<boolean> => {
    if (!characteristicRef.current) {
      // Fallback to window.print() for USB/wired printers
      printViaWindow(data)
      return true
    }

    try {
      const char = characteristicRef.current

      // Build receipt
      const commands: Uint8Array[] = [ESC_POS.INIT]

      // Header
      commands.push(ESC_POS.ALIGN_CENTER)
      commands.push(ESC_POS.BOLD_ON)
      commands.push(ESC_POS.DOUBLE_HEIGHT_ON)
      commands.push(textToBytes(data.storeName))
      commands.push(ESC_POS.LINE_FEED)
      commands.push(ESC_POS.DOUBLE_HEIGHT_OFF)
      commands.push(ESC_POS.BOLD_OFF)

      if (data.storeAddress) {
        commands.push(textToBytes(data.storeAddress))
        commands.push(ESC_POS.LINE_FEED)
      }

      commands.push(ESC_POS.LINE_FEED)
      commands.push(ESC_POS.ALIGN_LEFT)

      // Ticket info
      commands.push(textToBytes(`Ticket: ${data.ticketNumber}`))
      commands.push(ESC_POS.LINE_FEED)
      commands.push(textToBytes(`Fecha: ${data.date.toLocaleString("es-AR")}`))
      commands.push(ESC_POS.LINE_FEED)
      commands.push(textToBytes("--------------------------------"))
      commands.push(ESC_POS.LINE_FEED)

      // Items
      for (const item of data.items) {
        const line = `${item.quantity}x ${item.name}`
        const price = `$${(item.price * item.quantity).toLocaleString()}`
        const spaces = Math.max(1, 32 - line.length - price.length)
        commands.push(textToBytes(line + " ".repeat(spaces) + price))
        commands.push(ESC_POS.LINE_FEED)
      }

      commands.push(textToBytes("--------------------------------"))
      commands.push(ESC_POS.LINE_FEED)

      // Totals
      const subtotalLine = `Subtotal:${" ".repeat(32 - 9 - `$${data.subtotal.toLocaleString()}`.length)}$${data.subtotal.toLocaleString()}`
      const taxLine = `IVA (21%):${" ".repeat(32 - 10 - `$${data.tax.toLocaleString()}`.length)}$${data.tax.toLocaleString()}`

      commands.push(textToBytes(subtotalLine))
      commands.push(ESC_POS.LINE_FEED)
      commands.push(textToBytes(taxLine))
      commands.push(ESC_POS.LINE_FEED)

      commands.push(ESC_POS.BOLD_ON)
      commands.push(ESC_POS.DOUBLE_HEIGHT_ON)
      const totalLine = `TOTAL:${" ".repeat(Math.max(1, 26 - `$${data.total.toLocaleString()}`.length))}$${data.total.toLocaleString()}`
      commands.push(textToBytes(totalLine))
      commands.push(ESC_POS.LINE_FEED)
      commands.push(ESC_POS.DOUBLE_HEIGHT_OFF)
      commands.push(ESC_POS.BOLD_OFF)

      commands.push(textToBytes("--------------------------------"))
      commands.push(ESC_POS.LINE_FEED)

      // Payment method
      const methodNames: Record<string, string> = {
        cash: "Efectivo",
        card: "Tarjeta",
        qr: "Código QR",
        transfer: "Transferencia",
      }
      commands.push(ESC_POS.ALIGN_CENTER)
      commands.push(textToBytes(`Pago: ${methodNames[data.paymentMethod] || data.paymentMethod}`))
      commands.push(ESC_POS.LINE_FEED)
      commands.push(ESC_POS.LINE_FEED)

      // Footer
      commands.push(textToBytes(data.footer || "¡Gracias por su compra!"))
      commands.push(ESC_POS.LINE_FEED)
      commands.push(ESC_POS.LINE_FEED)
      commands.push(ESC_POS.LINE_FEED)

      // Cut paper if supported
      if (options?.cutPaper !== false) {
        commands.push(ESC_POS.PARTIAL_CUT)
      }

      // Send to printer
      const finalData = concatBytes(...commands)

      // Send in chunks (Bluetooth has max packet size)
      const chunkSize = 100
      for (let i = 0; i < finalData.length; i += chunkSize) {
        const chunk = finalData.slice(i, i + chunkSize)
        if (char.properties.writeWithoutResponse) {
          await char.writeValueWithoutResponse(chunk)
        } else {
          await char.writeValue(chunk)
        }
        // Small delay between chunks
        await new Promise((resolve) => setTimeout(resolve, 50))
      }

      return true
    } catch (err: any) {
      setError(err.message || "Error al imprimir")
      return false
    }
  }, [])

  // Fallback print via window
  const printViaWindow = (data: ReceiptData) => {
    const printWindow = window.open("", "_blank", "width=300,height=600")
    if (!printWindow) return

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Ticket</title>
          <style>
            body { font-family: 'Courier New', monospace; font-size: 12px; width: 80mm; margin: 0; padding: 10px; }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .large { font-size: 16px; }
            .line { border-top: 1px dashed #000; margin: 8px 0; }
            .row { display: flex; justify-content: space-between; }
            @media print {
              body { width: 80mm; }
              @page { margin: 0; size: 80mm auto; }
            }
          </style>
        </head>
        <body>
          <div class="center bold large">${data.storeName}</div>
          ${data.storeAddress ? `<div class="center">${data.storeAddress}</div>` : ""}
          <div class="line"></div>
          <div>Ticket: ${data.ticketNumber}</div>
          <div>Fecha: ${data.date.toLocaleString("es-AR")}</div>
          <div class="line"></div>
          ${data.items.map((item) => `
            <div class="row">
              <span>${item.quantity}x ${item.name}</span>
              <span>$${(item.price * item.quantity).toLocaleString()}</span>
            </div>
          `).join("")}
          <div class="line"></div>
          <div class="row"><span>Subtotal</span><span>$${data.subtotal.toLocaleString()}</span></div>
          <div class="row"><span>IVA (21%)</span><span>$${data.tax.toLocaleString()}</span></div>
          <div class="line"></div>
          <div class="row bold large"><span>TOTAL</span><span>$${data.total.toLocaleString()}</span></div>
          <div class="line"></div>
          <div class="center">Pago: ${data.paymentMethod}</div>
          <div class="center" style="margin-top: 20px;">${data.footer || "¡Gracias por su compra!"}</div>
        </body>
      </html>
    `

    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 250)
  }

  // Open cash drawer
  const openCashDrawer = useCallback(async (): Promise<boolean> => {
    if (!characteristicRef.current) {
      setError("No hay impresora conectada para abrir la caja")
      return false
    }

    try {
      const char = characteristicRef.current
      if (char.properties.writeWithoutResponse) {
        await char.writeValueWithoutResponse(ESC_POS.DRAWER_OPEN)
      } else {
        await char.writeValue(ESC_POS.DRAWER_OPEN)
      }
      return true
    } catch (err: any) {
      setError(err.message || "Error al abrir la caja")
      return false
    }
  }, [])

  // Disconnect
  const disconnect = useCallback(() => {
    if (selectedDevice) {
      characteristicRef.current = null
      setSelectedDevice(null)
      setDevices((prev) => prev.map((d) => (d.id === selectedDevice.id ? { ...d, connected: false } : d)))
    }
  }, [selectedDevice])

  return {
    devices,
    selectedDevice,
    isConnecting,
    isSupported,
    error,
    scanForPrinters,
    printReceipt,
    printViaWindow,
    openCashDrawer,
    disconnect,
    clearError: () => setError(null),
  }
}
