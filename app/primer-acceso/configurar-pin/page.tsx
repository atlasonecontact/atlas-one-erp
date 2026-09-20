"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AtlasLogo } from "@/components/atlas-logo"
import { KeyRound } from "lucide-react"

export default function ConfigurarPinPage() {
  const router = useRouter()
  const [pin, setPin] = useState("")
  const [confirmPin, setConfirmPin] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const goToDashboard = () => {
    router.push("/dashboard")
    router.refresh()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!/^\d{4,6}$/.test(pin)) {
      setError("El PIN debe tener entre 4 y 6 números")
      return
    }
    if (pin !== confirmPin) {
      setError("Los PIN no coinciden")
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch("/api/employees/set-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setError(json.error || "No se pudo guardar el PIN")
        return
      }
      goToDashboard()
    } catch (err) {
      console.error("[configurar-pin]", err)
      setError("Error al guardar el PIN. Intentá nuevamente.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#030712] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-[linear-gradient(rgba(0,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none" />
      <div className="fixed top-0 right-0 w-[300px] lg:w-[600px] h-[300px] lg:h-[600px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="flex items-center justify-center mb-8">
          <AtlasLogo variant="horizontal" />
        </div>

        <div className="rounded-2xl border border-cyan-500/20 bg-[#0a0f1a]/80 backdrop-blur-xl p-6 sm:p-8">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto mb-4">
              <KeyRound className="w-7 h-7 text-cyan-400" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Configurá tu PIN rápido</h2>
            <p className="text-sm text-gray-400">
              Te va a servir para volver a entrar al punto de venta sin escribir tu contraseña cada vez. Es opcional.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-gray-300 text-sm">PIN (4 a 6 números)</Label>
              <Input
                type="password"
                inputMode="numeric"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="••••"
                className="bg-[#0d1424] border-cyan-500/20 text-white h-11 sm:h-12 text-center text-2xl tracking-widest"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300 text-sm">Repetir PIN</Label>
              <Input
                type="password"
                inputMode="numeric"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="••••"
                className="bg-[#0d1424] border-cyan-500/20 text-white h-11 sm:h-12 text-center text-2xl tracking-widest"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-semibold h-11 sm:h-12"
            >
              {isLoading ? "Guardando..." : "Guardar y continuar"}
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={goToDashboard}
              className="w-full text-gray-500 hover:text-white"
            >
              Configurar más tarde
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
