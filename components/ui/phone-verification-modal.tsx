"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Phone, MessageCircle, Send, CheckCircle, AlertTriangle, Loader2, RefreshCw } from "lucide-react"

interface PhoneVerificationModalProps {
  open: boolean
  onClose: () => void
  onVerified: (phone: string) => void
  currentPhone: string
  newPhone: string
  kioskoName?: string
}

export function PhoneVerificationModal({
  open,
  onClose,
  onVerified,
  currentPhone,
  newPhone,
  kioskoName = "tu kiosco",
}: PhoneVerificationModalProps) {
  const [step, setStep] = useState<"confirm" | "verify" | "success">("confirm")
  const [verificationCode, setVerificationCode] = useState("")
  const [generatedCode, setGeneratedCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleConfirmChange = async () => {
    setIsLoading(true)
    setError("")

    try {
      // Generar código de verificación (6 dígitos)
      const code = Math.floor(100000 + Math.random() * 900000).toString()
      setGeneratedCode(code)

      // En producción, aquí se enviaría el código por SMS o WhatsApp
      // Por ahora, lo mostramos en pantalla para testing
      console.log(`[PhoneVerification] Código generado: ${code}`)

      setStep("verify")
    } catch (err: any) {
      setError(err.message || "Error al enviar código de verificación")
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyCode = async () => {
    setIsLoading(true)
    setError("")

    try {
      if (verificationCode !== generatedCode) {
        setError("Código incorrecto. Intentá de nuevo.")
        setIsLoading(false)
        return
      }

      // Código correcto
      setStep("success")
      
      // Notificar al padre después de un breve delay para mostrar el éxito
      setTimeout(() => {
        onVerified(newPhone)
      }, 1500)
    } catch (err: any) {
      setError(err.message || "Error al verificar el código")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendCode = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    setGeneratedCode(code)
    setVerificationCode("")
    setError("")
    console.log(`[PhoneVerification] Nuevo código generado: ${code}`)
  }

  const handleClose = () => {
    setStep("confirm")
    setVerificationCode("")
    setGeneratedCode("")
    setError("")
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[450px] bg-[#0a0f1a] border-cyan-500/20">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Phone className="w-5 h-5 text-cyan-400" />
            {step === "success" ? "¡Teléfono verificado!" : "Verificar nuevo teléfono"}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {step === "confirm" && "El teléfono se usa para notificaciones de WhatsApp y Telegram"}
            {step === "verify" && "Ingresá el código que te enviamos"}
            {step === "success" && "Tu número fue verificado correctamente"}
          </DialogDescription>
        </DialogHeader>

        {/* Step: Confirm Change */}
        {step === "confirm" && (
          <div className="space-y-4 py-4">
            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <div className="flex gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-200">
                  <p className="font-semibold mb-1">⚠️ Cambio de teléfono detectado</p>
                  <p className="text-amber-300/80">
                    Al cambiar el teléfono, las integraciones con WhatsApp y Telegram se desactivarán hasta que verifiques el nuevo número.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-white/5">
                <Label className="text-gray-500 text-xs">Teléfono actual</Label>
                <p className="text-gray-400 font-mono">{currentPhone || "No configurado"}</p>
              </div>
              
              <div className="flex justify-center">
                <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center">
                  <span className="text-cyan-400">↓</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                <Label className="text-cyan-400 text-xs">Nuevo teléfono</Label>
                <p className="text-white font-mono text-lg">{newPhone}</p>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <p className="text-sm text-blue-200">
                <span className="font-semibold">📱 ¿Cómo funciona?</span>
                <br />
                Te enviaremos un código de 6 dígitos al nuevo número para confirmar que es tuyo.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={handleClose} className="flex-1 border-cyan-500/30 text-gray-300">
                Cancelar
              </Button>
              <Button 
                onClick={handleConfirmChange} 
                disabled={isLoading}
                className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-black"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Enviar código"
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step: Verify Code */}
        {step === "verify" && (
          <div className="space-y-4 py-4">
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
              <MessageCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <p className="text-sm text-green-200">
                Enviamos un código de verificación a
              </p>
              <p className="text-white font-mono text-lg mt-1">{newPhone}</p>
            </div>

            {/* Demo: mostrar código (solo para testing) */}
            <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 text-center">
              <p className="text-xs text-purple-400">🧪 Modo demo - Código de prueba:</p>
              <p className="text-purple-300 font-mono text-2xl tracking-widest">{generatedCode}</p>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Código de verificación</Label>
              <Input
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="bg-[#0d1424] border-cyan-500/20 text-white text-center text-2xl font-mono tracking-widest"
                maxLength={6}
                autoFocus
              />
              {error && (
                <p className="text-red-400 text-sm text-center">{error}</p>
              )}
            </div>

            <button
              type="button"
              onClick={handleResendCode}
              className="text-cyan-400 text-sm hover:text-cyan-300 flex items-center gap-1 mx-auto"
            >
              <RefreshCw className="w-3 h-3" />
              Reenviar código
            </button>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={handleClose} className="flex-1 border-cyan-500/30 text-gray-300">
                Cancelar
              </Button>
              <Button 
                onClick={handleVerifyCode} 
                disabled={isLoading || verificationCode.length !== 6}
                className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-black"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  "Verificar"
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step: Success */}
        {step === "success" && (
          <div className="space-y-4 py-6 text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">¡Verificación exitosa!</h3>
              <p className="text-gray-400">
                El teléfono <span className="text-cyan-400 font-mono">{newPhone}</span> fue verificado correctamente.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
              <p className="text-sm text-cyan-200">
                Ahora podés recibir notificaciones por WhatsApp y Telegram en este número.
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
