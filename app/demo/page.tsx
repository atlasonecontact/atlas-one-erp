"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

type DemoBusinessType =
  | "maxi-kiosco"
  | "mini-market"
  | "licoreria"
  | "vinoteca"
  | "libreria"
  | "jugueteria"
  | "dietetica"

export default function DemoPage() {
  const router = useRouter()
  const [status, setStatus] = useState("Elegí un rubro para iniciar la demo")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedType, setSelectedType] = useState<DemoBusinessType>("maxi-kiosco")
  const [demoEmail, setDemoEmail] = useState<string | null>(null)
  const [demoPassword, setDemoPassword] = useState<string | null>(null)

  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient()

      try {
        // Check if already logged in
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
          setStatus("Ya estás logueado, redirigiendo...")
          router.push("/dashboard")
          return
        }
      } catch (err: any) {
        console.error("Demo error:", err)
        setError(err.message || "Error al iniciar demo")
      }
    }

    checkSession()
  }, [router])

  const typeLabel: Record<DemoBusinessType, string> = {
    "maxi-kiosco": "Maxi kiosco",
    "mini-market": "Mini market",
    licoreria: "Licorería",
    vinoteca: "Vinoteca",
    libreria: "Librería",
    jugueteria: "Juguetería",
    dietetica: "Dietética",
  }

  const startDemo = async () => {
    setError(null)
    setIsLoading(true)
    setStatus("Preparando cuenta demo...")

    const supabase = createClient()

    try {
      const ensureRes = await fetch("/api/demo/ensure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: selectedType }),
      })

      const ensureJson = await ensureRes.json().catch(() => ({}))
      if (!ensureRes.ok) {
        throw new Error(ensureJson?.error || "No se pudo preparar la cuenta demo")
      }

      const email = ensureJson.email as string
      const password = (ensureJson.password as string) || null
      if (!email) {
        throw new Error("Respuesta inválida al preparar la cuenta demo")
      }
      setDemoEmail(email)
      setDemoPassword(password)

      setStatus("Conectando con la cuenta demo...")
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: password || "Demo123456!",
      })

      if (signInError) {
        throw new Error(signInError.message)
      }

      setStatus("¡Listo! Entrando al dashboard...")
      router.push("/dashboard")
    } catch (err: any) {
      console.error("Demo error:", err)
      setError(err?.message || "Error al iniciar demo")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#030712] flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <h2 className="text-xl font-semibold text-white mb-2">Modo Demo</h2>
        <p className="text-gray-400 mb-6">{status}</p>

        <div className="rounded-lg bg-[#0a0f1a]/80 border border-cyan-500/20 p-4 text-left">
          <label className="block text-sm text-gray-300 mb-2">Rubro</label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as DemoBusinessType)}
            disabled={isLoading}
            className="w-full rounded-md bg-[#0d1424] border border-cyan-500/20 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
          >
            {Object.entries(typeLabel).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={startDemo}
            disabled={isLoading}
            className="mt-4 w-full bg-cyan-500 hover:bg-cyan-400 disabled:opacity-60 text-black font-semibold py-2 rounded-md"
          >
            {isLoading ? "Iniciando..." : "Iniciar Demo"}
          </button>

          {error && (
            <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Demo info */}
        <div className="mt-8 p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-left">
          <p className="text-cyan-400 font-medium text-sm mb-2">Credenciales de Demo</p>
          <p className="text-gray-400 text-sm">
            Email: <span className="text-white font-mono">{demoEmail || `demo.${selectedType}@atlasone.com`}</span>
          </p>
          <p className="text-gray-400 text-sm">
            Contraseña: <span className="text-white font-mono">{demoPassword || "Demo123456!"}</span>
          </p>
        </div>
      </div>
    </div>
  )
}
