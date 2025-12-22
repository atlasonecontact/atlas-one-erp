"use client"

import { useState, useEffect, useCallback, useRef } from "react"

export interface ScannedProduct {
  barcode: string
  timestamp: Date
}

interface ScannerConfig {
  onScan: (barcode: string) => void
  minLength?: number // Minimum barcode length
  maxLength?: number // Maximum barcode length
  scanTimeout?: number // Time in ms to wait for complete barcode
  preventDefaultKeys?: boolean // Prevent default behavior for scanned keys
}

export function useScanner(config: ScannerConfig) {
  const [isListening, setIsListening] = useState(false)
  const [lastScan, setLastScan] = useState<ScannedProduct | null>(null)
  const [isBluetoothSupported, setIsBluetoothSupported] = useState(false)
  const [bluetoothDevice, setBluetoothDevice] = useState<BluetoothDevice | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const bufferRef = useRef<string>("")
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastKeyTime = useRef<number>(0)

  const {
    onScan,
    minLength = 4,
    maxLength = 50,
    scanTimeout = 100, // Scanners typically send characters very fast (< 50ms between chars)
    preventDefaultKeys = true,
  } = config

  // Check Bluetooth support
  useEffect(() => {
    if (typeof navigator !== "undefined" && "bluetooth" in navigator) {
      setIsBluetoothSupported(true)
    }
  }, [])

  // Keyboard scanner handler (for USB/wired scanners)
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!isListening) return

      const now = Date.now()
      const key = event.key

      // Reset buffer if too much time passed between keystrokes
      if (now - lastKeyTime.current > scanTimeout) {
        bufferRef.current = ""
      }
      lastKeyTime.current = now

      // Handle Enter key - scanner sends Enter at the end
      if (key === "Enter") {
        const barcode = bufferRef.current.trim()

        if (barcode.length >= minLength && barcode.length <= maxLength) {
          // Valid barcode
          const scannedProduct: ScannedProduct = {
            barcode,
            timestamp: new Date(),
          }
          setLastScan(scannedProduct)
          onScan(barcode)

          if (preventDefaultKeys) {
            event.preventDefault()
          }
        }

        bufferRef.current = ""
        return
      }

      // Only accept alphanumeric characters for barcode
      if (key.length === 1 && /[a-zA-Z0-9\-]/.test(key)) {
        bufferRef.current += key

        if (preventDefaultKeys) {
          // Prevent default only if it looks like a fast scan sequence
          const isScanning = now - lastKeyTime.current < scanTimeout
          if (isScanning && bufferRef.current.length > 3) {
            event.preventDefault()
          }
        }
      }
    },
    [isListening, minLength, maxLength, scanTimeout, onScan, preventDefaultKeys]
  )

  // Start listening for keyboard input (USB scanners)
  const startListening = useCallback(() => {
    setIsListening(true)
    bufferRef.current = ""
    setError(null)
  }, [])

  // Stop listening
  const stopListening = useCallback(() => {
    setIsListening(false)
    bufferRef.current = ""
  }, [])

  // Attach/detach keyboard listener
  useEffect(() => {
    if (isListening) {
      window.addEventListener("keydown", handleKeyDown, { capture: true })
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown, { capture: true })
    }
  }, [isListening, handleKeyDown])

  // Connect to Bluetooth scanner
  const connectBluetoothScanner = useCallback(async () => {
    if (!isBluetoothSupported) {
      setError("Bluetooth no está soportado en este navegador")
      return false
    }

    setIsConnecting(true)
    setError(null)

    try {
      // @ts-ignore - TypeScript doesn't have full Web Bluetooth types
      const device = await navigator.bluetooth.requestDevice({
        filters: [
          { namePrefix: "Scanner" },
          { namePrefix: "Barcode" },
          { namePrefix: "BT" },
          { namePrefix: "HID" },
        ],
        optionalServices: [
          "0000fff0-0000-1000-8000-00805f9b34fb", // Common scanner service
          "0000180f-0000-1000-8000-00805f9b34fb", // Battery service
          "49535343-fe7d-4ae5-8fa9-9fafd205e455", // Nordic UART
        ],
      })

      if (device) {
        setBluetoothDevice(device)

        // Connect to GATT server
        const server = await device.gatt?.connect()
        if (!server) throw new Error("No se pudo conectar al servidor GATT")

        // Most Bluetooth barcode scanners work as HID keyboards
        // So we just need to listen for keyboard events
        setIsListening(true)

        device.addEventListener("gattserverdisconnected", () => {
          setBluetoothDevice(null)
          setIsListening(false)
        })

        return true
      }
    } catch (err: any) {
      if (err.name === "NotFoundError") {
        setError("No se encontró ningún scanner. Asegúrate de que esté encendido y en modo de emparejamiento.")
      } else {
        setError(err.message || "Error al conectar con el scanner")
      }
      return false
    } finally {
      setIsConnecting(false)
    }
  }, [isBluetoothSupported])

  // Disconnect Bluetooth scanner
  const disconnectBluetoothScanner = useCallback(() => {
    if (bluetoothDevice?.gatt?.connected) {
      bluetoothDevice.gatt.disconnect()
    }
    setBluetoothDevice(null)
    setIsListening(false)
  }, [bluetoothDevice])

  // Manual barcode input (for testing or manual entry)
  const manualScan = useCallback(
    (barcode: string) => {
      if (barcode.length >= minLength && barcode.length <= maxLength) {
        const scannedProduct: ScannedProduct = {
          barcode: barcode.trim(),
          timestamp: new Date(),
        }
        setLastScan(scannedProduct)
        onScan(barcode.trim())
        return true
      }
      return false
    },
    [minLength, maxLength, onScan]
  )

  // Cleanup
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return {
    isListening,
    lastScan,
    isBluetoothSupported,
    bluetoothDevice,
    isConnecting,
    error,
    startListening,
    stopListening,
    connectBluetoothScanner,
    disconnectBluetoothScanner,
    manualScan,
    clearError: () => setError(null),
  }
}
