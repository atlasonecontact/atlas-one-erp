"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { AtlasLogo } from "@/components/atlas-logo"
import { CheckCircle, AlertCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

function CallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      const supabase = createClient()

      try {
        const errorDescription = searchParams.get("error_description")
        if (errorDescription) {
          throw new Error(errorDescription)
        }

        const code = searchParams.get("code")
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) throw error
        } else {
          // Flujo implícito: el SDK ya parseó el hash de la URL al cargar.
          const { data, error } = await supabase.auth.getSession()
          if (error) throw error
          if (!data.session) {
            throw new Error("Tu cuenta ya fue confirmada. Iniciá sesión con tu email y contraseña.")
          }
        }

        if (cancelled) return
        setStatus("success")
        setTimeout(() => {
          if (!cancelled) router.replace("/login?confirmed=true")
        }, 1200)
      } catch (err) {
        console.error("[v0] Auth callback error:", err)
        if (cancelled) return
        setStatus("error")
        setMessage(
          err instanceof Error
            ? err.message
            : "El link de confirmación no es válido o ya expiró. Probá iniciar sesión directamente.",
        )
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [router, searchParams])

  return (
    <div className="min-h-screen bg-[#030712] flex items-center justify-center p-8">
      <div className="fixed inset-0 bg-[linear-gradient(rgba(0,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none" />
      <div className="w-full max-w-md relative z-10">
        <Link href="/" className="flex items-center justify-center gap-3 mb-8">
          <AtlasLogo className="w-10 h-10" />
          <span className="text-xl font-bold text-cyan-400">ATLAS ONE</span>
        </Link>

        <div className="rounded-2xl border border-cyan-500/20 bg-[#0a0f1a]/80 backdrop-blur-xl p-8 text-center">
          {status === "loading" && (
            <>
              <div className="w-12 h-12 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-6" />
              <h2 className="text-xl font-bold text-white mb-2">Confirmando tu cuenta...</h2>
              <p className="text-gray-400 text-sm">Esto toma solo un segundo</p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">¡Cuenta confirmada!</h2>
              <p className="text-gray-400 text-sm">Redirigiendo al login...</p>
            </>
          )}

          {status === "error" && (
            <>
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">No pudimos confirmar el link</h2>
              <p className="text-gray-400 text-sm mb-6">{message}</p>
              <Link
                href="/login"
                className="inline-flex items-center justify-center bg-cyan-500 hover:bg-cyan-400 text-black font-semibold h-11 px-8 rounded-md"
              >
                Ir al login
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function CallbackFallback() {
  return (
    <div className="min-h-screen bg-[#030712] flex items-center justify-center p-8">
      <div className="w-12 h-12 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<CallbackFallback />}>
      <CallbackContent />
    </Suspense>
  )
}
