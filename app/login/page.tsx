"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AtlasLogo } from "@/components/atlas-logo"
import { Eye, EyeOff, Mail, Lock, ArrowRight, Store } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { getSingleOrNull } from "@/lib/supabase/utils"

type DemoBusinessType =
  | "maxi-kiosco"
  | "mini-market"
  | "licoreria"
  | "vinoteca"
  | "libreria"
  | "jugueteria"
  | "dietetica"

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isDemoLoading, setIsDemoLoading] = useState(false)
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [showDemoOptions, setShowDemoOptions] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const supabase = createClient()

    try {
      let emailToUse = identifier

      // If identifier doesn't contain @, it might be a username
      if (!identifier.includes("@")) {
        const employee = await getSingleOrNull(
          supabase.from("employees").select("user_id").eq("username", identifier).single(),
        )

        if (employee?.user_id) {
          // Use the employee's internal email format
          emailToUse = `${identifier}@atlasone.internal`
        }
      }

      const { error: authError } = await supabase.auth.signInWithPassword({
        email: emailToUse,
        password,
      })

      if (authError) {
        if (authError.message === "Invalid login credentials") {
          setError("Usuario/email o contraseña incorrectos")
        } else if (authError.message === "Email not confirmed") {
          setError("Por favor confirma tu email antes de iniciar sesión")
        } else {
          setError(authError.message)
        }
        return
      }

      router.push("/dashboard")
      router.refresh()
    } catch (err) {
      console.error("[v0] Login error:", err)
      setError("Error al iniciar sesión. Intenta nuevamente.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDemoLogin = async () => {
    setIdentifier("demo@atlasone.com")
    setPassword("demo123456")
  }

  const handleQuickDemo = async (type: DemoBusinessType) => {
    setIsDemoLoading(true)
    setError("")

    const supabase = createClient()

    try {
      // Llamar al endpoint para crear/asegurar la cuenta demo
      const ensureRes = await fetch("/api/demo/ensure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      })

      const ensureJson = await ensureRes.json().catch(() => ({}))
      if (!ensureRes.ok) {
        throw new Error(ensureJson?.error || "No se pudo preparar la cuenta demo")
      }

      const email = ensureJson.email as string
      const demoPassword = (ensureJson.password as string) || "Demo123456!"

      if (!email) {
        throw new Error("Respuesta inválida al preparar la cuenta demo")
      }

      // Hacer login automático
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: demoPassword,
      })

      if (signInError) {
        throw new Error(signInError.message)
      }

      router.push("/dashboard")
      router.refresh()
    } catch (err: any) {
      console.error("[v0] Demo login error:", err)
      setError(err?.message || "Error al iniciar demo. Intenta nuevamente.")
    } finally {
      setIsDemoLoading(false)
    }
  }

  const demoTypes: Array<{ type: DemoBusinessType; label: string; icon: string }> = [
    { type: "maxi-kiosco", label: "Maxi Kiosco", icon: "🏪" },
    { type: "mini-market", label: "Mini Market", icon: "🏬" },
    { type: "licoreria", label: "Licorería", icon: "🍷" },
    { type: "vinoteca", label: "Vinoteca", icon: "🍾" },
    { type: "libreria", label: "Librería", icon: "📚" },
    { type: "jugueteria", label: "Juguetería", icon: "🧸" },
    { type: "dietetica", label: "Dietética", icon: "🌿" },
  ]

  return (
    <div className="min-h-screen bg-[#030712] flex flex-col lg:flex-row">
      {/* Background effects */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(0,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none" />
      <div className="fixed top-0 right-0 w-[300px] lg:w-[600px] h-[300px] lg:h-[600px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Left side - Branding - hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative">
        <Link href="/" className="z-10">
          <AtlasLogo variant="horizontal" />
        </Link>

        <div className="z-10">
          <h1 className="text-3xl xl:text-4xl font-bold text-white mb-4 leading-tight">
            Gestiona tu negocio
            <br />
            <span className="text-cyan-400">de manera inteligente</span>
          </h1>
          <p className="text-gray-400 text-base xl:text-lg max-w-md">
            El sistema ERP más completo para kioscos, minimarkets y comercios minoristas.
          </p>
        </div>

        <p className="text-sm text-gray-600 z-10">© 2025 Atlas One. Todos los derechos reservados.</p>
      </div>

      {/* Right side - Login form - responsive */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center justify-center mb-8">
            <AtlasLogo variant="horizontal" />
          </div>

          <div className="rounded-2xl border border-cyan-500/20 bg-[#0a0f1a]/80 backdrop-blur-xl p-6 sm:p-8">
            <div className="text-center mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Bienvenido de vuelta</h2>
              <p className="text-sm sm:text-base text-gray-400">Ingresa tus credenciales para continuar</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs sm:text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="identifier" className="text-gray-300 text-sm">
                  Usuario o Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <Input
                    id="identifier"
                    type="text"
                    placeholder="usuario o tu@email.com"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="pl-10 bg-[#0d1424] border-cyan-500/20 text-white placeholder:text-gray-500 focus:border-cyan-500 focus:ring-cyan-500/20 h-11 sm:h-12"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-gray-300 text-sm">
                    Contraseña
                  </Label>
                  <Link href="/forgot-password" className="text-xs sm:text-sm text-cyan-400 hover:text-cyan-300">
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 bg-[#0d1424] border-cyan-500/20 text-white placeholder:text-gray-500 focus:border-cyan-500 focus:ring-cyan-500/20 h-11 sm:h-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 p-1"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-semibold h-11 sm:h-12 group"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                ) : (
                  <>
                    Iniciar Sesión
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 sm:mt-8 pt-6 border-t border-cyan-500/10 text-center">
              <p className="text-sm sm:text-base text-gray-400">
                ¿No tienes cuenta?{" "}
                <Link href="/register" className="text-cyan-400 hover:text-cyan-300 font-medium">
                  Crear cuenta
                </Link>
              </p>
            </div>
          </div>

          <div className="mt-4 sm:mt-6 p-4 rounded-xl border border-cyan-500/10 bg-cyan-500/5">
            <p className="text-xs sm:text-sm text-gray-400 text-center mb-3">
              <span className="text-cyan-400 font-medium">✨ Demo Rápida:</span> Prueba con datos precargados
            </p>

            {!showDemoOptions ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDemoOptions(true)}
                className="w-full border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300 bg-transparent text-sm h-10 sm:h-11"
                disabled={isDemoLoading}
              >
                <Store className="w-4 h-4 mr-2" />
                Ver opciones de demo
              </Button>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  {demoTypes.map((demo) => (
                    <Button
                      key={demo.type}
                      type="button"
                      variant="outline"
                      onClick={() => handleQuickDemo(demo.type)}
                      disabled={isDemoLoading}
                      className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300 bg-transparent text-xs py-2 h-auto min-h-[44px]"
                    >
                      {isDemoLoading ? (
                        <div className="w-4 h-4 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
                      ) : (
                        <span className="flex flex-col items-center gap-1">
                          <span className="text-base">{demo.icon}</span>
                          <span className="text-xs">{demo.label}</span>
                        </span>
                      )}
                    </Button>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowDemoOptions(false)}
                  className="w-full text-xs text-gray-500 hover:text-gray-300"
                >
                  Cancelar
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
