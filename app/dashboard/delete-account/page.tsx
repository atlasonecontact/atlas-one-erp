"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertTriangle, Trash2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function DeleteAccountPage() {
  const router = useRouter()
  const [confirmText, setConfirmText] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState("")

  const handleDelete = async () => {
    if (confirmText !== "ELIMINAR") {
      setError('Debes escribir "ELIMINAR" para confirmar')
      return
    }

    setIsDeleting(true)
    setError("")

    const supabase = createClient()

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/login")
        return
      }

      // Delete all related data
      const { data: chain } = await supabase.from("chains").select("id").eq("owner_id", user.id).single()

      if (chain) {
        // Delete kioscos and all related data
        await supabase.from("kioscos").delete().eq("chain_id", chain.id)
        // Delete chain
        await supabase.from("chains").delete().eq("id", chain.id)
      }

      // Delete profile
      await supabase.from("profiles").delete().eq("id", user.id)

      // Delete auth user (this will cascade delete everything)
      const { error: deleteError } = await supabase.rpc("delete_user")

      if (deleteError) {
        console.error("[v0] Error deleting user:", deleteError)
        setError("Error al eliminar la cuenta. Contacta con soporte.")
        return
      }

      // Sign out
      await supabase.auth.signOut()
      router.push("/")
    } catch (err) {
      console.error("[v0] Error:", err)
      setError("Error al eliminar la cuenta. Intenta nuevamente.")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Eliminar Cuenta</h1>
        <p className="text-gray-400 text-sm">Esta acción no se puede deshacer</p>
      </div>

      <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6">
        <div className="flex gap-4 mb-6">
          <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Advertencia: Acción Irreversible</h3>
            <p className="text-gray-400 text-sm mb-4">
              Al eliminar tu cuenta, se eliminarán permanentemente todos tus datos:
            </p>
            <ul className="text-sm text-gray-400 space-y-2 list-disc list-inside">
              <li>Tu cadena y todos los kioscos</li>
              <li>Todos los empleados y sus accesos</li>
              <li>Productos, stock y configuraciones</li>
              <li>Historial de ventas y transacciones</li>
              <li>Reportes y estadísticas</li>
              <li>Configuraciones de notificaciones</li>
            </ul>
          </div>
        </div>

        <div className="space-y-4 border-t border-red-500/10 pt-6">
          <div className="space-y-2">
            <Label htmlFor="confirm" className="text-gray-300">
              Para confirmar, escribe <span className="text-red-400 font-bold">ELIMINAR</span> en el campo:
            </Label>
            <Input
              id="confirm"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="ELIMINAR"
              className="bg-[#0d1424] border-red-500/20 text-white placeholder:text-gray-500"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="flex-1 border-gray-700 text-gray-300 hover:bg-white/5"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDelete}
              disabled={isDeleting || confirmText !== "ELIMINAR"}
              className="flex-1 bg-red-500 hover:bg-red-400 text-white font-semibold"
            >
              {isDeleting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar Cuenta
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
