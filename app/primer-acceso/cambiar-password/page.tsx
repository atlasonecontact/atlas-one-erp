"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AtlasLogo } from "@/components/atlas-logo"
import { Lock, ShieldCheck } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function CambiarPasswordInicialPage() {
  const router = useRouter()
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (newPassword.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres")
      return
    }
    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden")
      return
    }

    setIsLoading(true)
    try {
      const supabase = createClient()
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
      if (updateError) {
        setError(updateError.message)
        return
      }

      const res = await fetch("/api/employees/complete-first-login", { method: "POST" })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setError(json.error || "No se pudo completar el cambio de contraseña")
        return
      }

      router.push("/primer-acceso/configurar-pin")
      router.refresh()
    } catch (err) {
      console.error("[cambiar-password-inicial]", err)
      setError("Error al cambiar la contraseña. Intentá nuevamente.")
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
              <ShieldCheck className="w-7 h-7 text-cyan-400" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Creá tu nueva contraseña</h2>
            <p className="text-sm text-gray-400">
              Por seguridad, tenés que elegir tu propia contraseña antes de continuar.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-gray-300 text-sm">Nueva contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  className="pl-10 bg-[#0d1424] border-cyan-500/20 text-white h-11 sm:h-12"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300 text-sm">Confirmar contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repetí la contraseña"
                  className="pl-10 bg-[#0d1424] border-cyan-500/20 text-white h-11 sm:h-12"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-semibold h-11 sm:h-12"
            >
              {isLoading ? "Guardando..." : "Continuar"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
