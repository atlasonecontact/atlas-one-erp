"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AtlasLogo } from "@/components/atlas-logo"
import { Eye, EyeOff, Mail, Lock, User, Building2, ArrowRight, Check, AlertCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    businessName: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const validatePassword = () => {
    if (formData.password.length < 6) {
      return "La contraseña debe tener al menos 6 caracteres"
    }
    if (formData.password !== formData.confirmPassword) {
      return "Las contraseñas no coinciden"
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    if (formData.email === "demo@atlasone.com" || formData.email.includes("demo")) {
      setError("No puedes registrarte con credenciales de demo. Usa la cuenta demo existente para probar.")
      setIsLoading(false)
      return
    }

    if (!formData.email || !formData.password || !formData.name || !formData.businessName) {
      setError("Por favor completa todos los campos requeridos")
      setIsLoading(false)
      return
    }

    const passwordError = validatePassword()
    if (passwordError) {
      setError(passwordError)
      setIsLoading(false)
      return
    }

    const supabase = createClient()

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/dashboard`,
          data: {
            full_name: formData.name,
            business_name: formData.businessName,
          },
        },
      })

      if (authError) {
        console.error("[v0] Auth error:", authError)
        if (authError.message.includes("already registered")) {
          setError("Este email ya está registrado. Intenta iniciar sesión.")
        } else if (authError.message.includes("Database error")) {
          setError("Error de base de datos. Por favor intenta nuevamente en unos segundos.")
        } else {
          setError(authError.message)
        }
        setIsLoading(false)
        return
      }

      if (authData.user) {
        const { error: profileError } = await supabase.from("profiles").insert({
          id: authData.user.id,
          username: formData.email.split("@")[0],
          full_name: formData.name,
          business_name: formData.businessName,
          role: "owner",
        })

        if (profileError) {
          console.error("[v0] Profile creation error:", profileError)
        }
      }

      setSuccess(true)
    } catch (err) {
      console.error("[v0] Registration error:", err)
      setError("Error al crear la cuenta. Intenta nuevamente.")
    } finally {
      setIsLoading(false)
    }
  }

  const features = [
    "Punto de venta rápido e intuitivo",
    "Control de inventario en tiempo real",
    "Reportes y análisis avanzados",
    "Gestión de empleados y roles",
  ]

  if (success) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center p-8">
        <div className="fixed inset-0 bg-[linear-gradient(rgba(0,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none" />
        <div className="w-full max-w-md relative z-10">
          <div className="rounded-2xl border border-cyan-500/20 bg-[#0a0f1a]/80 backdrop-blur-xl p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-cyan-500/20 flex items-center justify-center mx-auto mb-6">
              <Mail className="w-8 h-8 text-cyan-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Verifica tu email</h2>
            <p className="text-gray-400 mb-2">Hemos enviado un enlace de verificación a:</p>
            <p className="text-cyan-400 font-semibold mb-6">{formData.email}</p>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-6 text-left">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-200">
                  <p className="font-semibold mb-1">Acción requerida</p>
                  <p className="text-amber-300/80">
                    Revisa tu bandeja de entrada y haz clic en el enlace para activar tu cuenta. No podrás iniciar
                    sesión hasta verificar tu email.
                  </p>
                </div>
              </div>
            </div>
            <Link href="/login">
              <Button className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-semibold">
                Ir a Iniciar Sesión
              </Button>
            </Link>
            <p className="text-xs text-gray-500 mt-4">¿No recibiste el email? Revisa tu carpeta de spam</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#030712] flex">
      {/* Background effects */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(0,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Left side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center justify-center mb-12">
            <AtlasLogo variant="horizontal" />
          </div>

          <div className="rounded-2xl border border-cyan-500/20 bg-[#0a0f1a]/80 backdrop-blur-xl p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Crea tu cuenta</h2>
              <p className="text-gray-400">Empieza a gestionar tu negocio hoy</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex gap-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-300">
                  Nombre completo
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Tu nombre"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="pl-10 bg-[#0d1424] border-cyan-500/20 text-white placeholder:text-gray-500 focus:border-cyan-500 focus:ring-cyan-500/20"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessName" className="text-gray-300">
                  Nombre de la Empresa
                </Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <Input
                    id="businessName"
                    type="text"
                    placeholder="Ej: Kioscos La Esquina"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    className="pl-10 bg-[#0d1424] border-cyan-500/20 text-white placeholder:text-gray-500 focus:border-cyan-500 focus:ring-cyan-500/20"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500">Luego podrás agregar tus kioscos individuales</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pl-10 bg-[#0d1424] border-cyan-500/20 text-white placeholder:text-gray-500 focus:border-cyan-500 focus:ring-cyan-500/20"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-300">
                  Contraseña
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="pl-10 pr-10 bg-[#0d1424] border-cyan-500/20 text-white placeholder:text-gray-500 focus:border-cyan-500 focus:ring-cyan-500/20"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500">Mínimo 6 caracteres</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-300">
                  Repetir contraseña
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="pl-10 pr-10 bg-[#0d1424] border-cyan-500/20 text-white placeholder:text-gray-500 focus:border-cyan-500 focus:ring-cyan-500/20"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Las contraseñas no coinciden
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-semibold py-5 group"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                ) : (
                  <>
                    Crear Cuenta
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-cyan-500/10 text-center">
              <p className="text-gray-400">
                ¿Ya tienes cuenta?{" "}
                <Link href="/login" className="text-cyan-400 hover:text-cyan-300 font-medium">
                  Inicia sesión
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative">
        <Link href="/" className="z-10 self-end">
          <AtlasLogo variant="horizontal" />
        </Link>

        <div className="z-10">
          <h1 className="text-4xl font-bold text-white mb-6 leading-tight">
            Todo lo que necesitas
            <br />
            <span className="text-cyan-400">en un solo lugar</span>
          </h1>

          <ul className="space-y-4">
            {features.map((feature, i) => (
              <li key={i} className="flex items-center gap-3 text-gray-300">
                <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center">
                  <Check className="w-4 h-4 text-cyan-400" />
                </div>
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-sm text-gray-600 z-10">© 2025 Atlas One. Todos los derechos reservados.</p>
      </div>
    </div>
  )
}
