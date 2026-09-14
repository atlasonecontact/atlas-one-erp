"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { X, Flashlight, FlashlightOff, SwitchCamera, Zap, Camera } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/lib/theme-context"
import { BarcodeDetector } from "barcode-detector"

interface CameraScannerProps {
  isOpen: boolean
  onClose: () => void
  onScan: (barcode: string) => void
}

export function CameraScanner({ isOpen, onClose, onScan }: CameraScannerProps) {
  const { config } = useTheme()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [isFlashOn, setIsFlashOn] = useState(false)
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment")
  const [isScanning, setIsScanning] = useState(false)
  const [lastScanned, setLastScanned] = useState<string | null>(null)
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastScannedRef = useRef<string | null>(null)
  const [barcodeSupported, setBarcodeSupported] = useState(true)

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }
    lastScannedRef.current = null
    setIsScanning(false)
  }, [])

  const startCamera = useCallback(async () => {
    try {
      stopCamera()

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setHasPermission(true)
        setIsScanning(true)

        // Start barcode detection
        startBarcodeDetection()
      }
    } catch {
      setHasPermission(false)
    }
  }, [facingMode, stopCamera])

  const startBarcodeDetection = useCallback(() => {
    try {
      const barcodeDetector = new BarcodeDetector({
        formats: ["ean_13", "ean_8", "code_128", "code_39", "qr_code", "upc_a", "upc_e"],
      })

      scanIntervalRef.current = setInterval(async () => {
        if (!videoRef.current) return

        try {
          const barcodes = await barcodeDetector.detect(videoRef.current)
          if (barcodes.length > 0) {
            const barcode = barcodes[0].rawValue
            if (barcode && barcode !== lastScannedRef.current) {
              lastScannedRef.current = barcode
              setLastScanned(barcode)

              // Haptic feedback if available
              if (navigator.vibrate) {
                navigator.vibrate(100)
              }

              onScan(barcode)

              // Reset after 2 seconds to allow rescanning
              setTimeout(() => {
                lastScannedRef.current = null
                setLastScanned(null)
              }, 2000)
            }
          }
        } catch {
          // Ignore detection errors
        }
      }, 200)
    } catch {
      setBarcodeSupported(false)
    }
  }, [onScan])

  const toggleFlash = useCallback(async () => {
    if (!streamRef.current) return

    const track = streamRef.current.getVideoTracks()[0]
    // @ts-ignore - torch is not in TS types
    const capabilities = track.getCapabilities?.()

    if (capabilities?.torch) {
      try {
        // @ts-ignore
        await track.applyConstraints({ advanced: [{ torch: !isFlashOn }] })
        setIsFlashOn(!isFlashOn)
      } catch {
        // Flash not available
      }
    }
  }, [isFlashOn])

  const switchCamera = useCallback(() => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"))
  }, [])

  useEffect(() => {
    if (isOpen) {
      startCamera()
    } else {
      stopCamera()
    }

    return () => stopCamera()
  }, [isOpen, startCamera, stopCamera])

  useEffect(() => {
    if (isOpen && hasPermission) {
      startCamera()
    }
  }, [facingMode])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 safe-area-top bg-gradient-to-b from-black/80 to-transparent">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-black/50 text-white hover:bg-black/70"
        >
          <X className="w-6 h-6" />
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFlash}
            className="w-10 h-10 rounded-full bg-black/50 text-white hover:bg-black/70"
          >
            {isFlashOn ? (
              <Flashlight className="w-5 h-5" style={{ color: config.primary }} />
            ) : (
              <FlashlightOff className="w-5 h-5" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={switchCamera}
            className="w-10 h-10 rounded-full bg-black/50 text-white hover:bg-black/70"
          >
            <SwitchCamera className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Camera View */}
      <div className="flex-1 relative">
        {hasPermission === false ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
            <Camera className="w-16 h-16 text-gray-500 mb-4" />
            <h3 className="text-white text-lg font-semibold mb-2">Permiso de cámara requerido</h3>
            <p className="text-gray-400 text-sm mb-4">Permite el acceso a la cámara para escanear códigos de barras</p>
            <Button
              onClick={startCamera}
              style={{ backgroundColor: config.primary }}
              className="text-black font-semibold"
            >
              Permitir Cámara
            </Button>
          </div>
        ) : (
          <>
            <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" playsInline muted autoPlay />

            {/* Scan overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Darkened areas */}
              <div className="absolute inset-0 bg-black/50" />

              {/* Scan window */}
              <div className="relative w-72 h-72">
                {/* Clear window */}
                <div
                  className="absolute inset-0 bg-transparent"
                  style={{
                    boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.5)",
                  }}
                />

                {/* Corners */}
                <div
                  className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 rounded-tl-lg"
                  style={{ borderColor: config.primary }}
                />
                <div
                  className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 rounded-tr-lg"
                  style={{ borderColor: config.primary }}
                />
                <div
                  className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 rounded-bl-lg"
                  style={{ borderColor: config.primary }}
                />
                <div
                  className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 rounded-br-lg"
                  style={{ borderColor: config.primary }}
                />

                {/* Scanning line animation */}
                {isScanning && (
                  <div
                    className="absolute left-2 right-2 h-0.5 animate-pulse"
                    style={{
                      backgroundColor: config.primary,
                      animation: "scanLine 2s ease-in-out infinite",
                      top: "50%",
                    }}
                  />
                )}
              </div>
            </div>

            {/* Last scanned indicator */}
            {lastScanned && (
              <div
                className="absolute bottom-32 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full flex items-center gap-2"
                style={{ backgroundColor: config.primary }}
              >
                <Zap className="w-4 h-4 text-black" />
                <span className="text-black font-semibold">{lastScanned}</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-6 safe-area-bottom bg-gradient-to-t from-black/80 to-transparent">
        <p className="text-center text-white text-sm mb-4">
          {barcodeSupported ? "Apuntá al código de barras para escanearlo" : "Ingresá el código manualmente"}
        </p>

        {/* Manual input button */}
        <Button
          variant="outline"
          onClick={() => {
            const code = prompt("Ingresá el código manualmente:")
            if (code) {
              onScan(code)
              onClose()
            }
          }}
          className="w-full border-white/20 text-white hover:bg-white/10"
        >
          Ingresar código manualmente
        </Button>
      </div>

      <style jsx>{`
        @keyframes scanLine {
          0%, 100% { transform: translateY(-100px); opacity: 0.5; }
          50% { transform: translateY(100px); opacity: 1; }
        }
      `}</style>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
