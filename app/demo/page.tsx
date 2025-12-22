"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export default function DemoPage() {
  const router = useRouter()
  const [status, setStatus] = useState("Iniciando demo...")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const initDemo = async () => {
      const supabase = createClient()

      try {
        // Check if already logged in
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
          setStatus("Ya estás logueado, redirigiendo...")
          router.push("/dashboard")
          return
        }

        // Try to login with demo credentials
        setStatus("Conectando con cuenta demo...")
        
        const demoEmail = "demo@atlasone.com"
        const demoPassword = "demo123456"

        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: demoEmail,
          password: demoPassword,
        })

        if (signInError) {
          // Demo user doesn't exist or wrong password
          // Try to create it (will fail if already exists, that's ok)
          setStatus("Creando cuenta demo...")
          
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: demoEmail,
            password: demoPassword,
            options: {
              data: {
                full_name: "Usuario Demo",
                role: "owner",
                business_name: "Kiosco Demo"
              }
            }
          })

          if (signUpError && !signUpError.message.includes("already")) {
            throw new Error(`No se pudo crear cuenta demo: ${signUpError.message}`)
          }

          // If signup worked, try login again
          if (signUpData?.user) {
            const { error: retryError } = await supabase.auth.signInWithPassword({
              email: demoEmail,
              password: demoPassword,
            })

            if (retryError) {
              // Possibly needs email confirmation
              setError("La cuenta demo requiere confirmación de email. Por favor usa tu propia cuenta.")
              setTimeout(() => router.push("/login"), 3000)
              return
            }
          } else {
            // Try login once more in case user existed
            const { error: finalError } = await supabase.auth.signInWithPassword({
              email: demoEmail,
              password: demoPassword,
            })

            if (finalError) {
              setError("No se pudo acceder a la cuenta demo. Redirigiendo al login...")
              setTimeout(() => router.push("/login"), 2000)
              return
            }
          }
        }

        setStatus("¡Listo! Entrando al dashboard...")
        router.push("/dashboard")

      } catch (err: any) {
        console.error("Demo error:", err)
        setError(err.message || "Error al iniciar demo")
        setTimeout(() => router.push("/login"), 3000)
      }
    }

    initDemo()
  }, [router])

  return (
    <div className="min-h-screen bg-[#030712] flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        {!error ? (
          <>
            <div className="w-16 h-16 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-6" />
            <h2 className="text-xl font-semibold text-white mb-2">Modo Demo</h2>
            <p className="text-gray-400">{status}</p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">⚠️</span>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Aviso</h2>
            <p className="text-amber-300">{error}</p>
            <p className="text-gray-500 text-sm mt-4">Redirigiendo...</p>
          </>
        )}

        {/* Demo info */}
        <div className="mt-8 p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-left">
          <p className="text-cyan-400 font-medium text-sm mb-2">💡 Credenciales de Demo</p>
          <p className="text-gray-400 text-sm">
            Email: <span className="text-white font-mono">demo@atlasone.com</span>
          </p>
          <p className="text-gray-400 text-sm">
            Contraseña: <span className="text-white font-mono">demo123456</span>
          </p>
        </div>
      </div>
    </div>
  )
}
