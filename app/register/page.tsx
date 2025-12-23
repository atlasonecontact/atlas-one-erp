"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AtlasLogo } from "@/components/atlas-logo"
import { Mail, User, Building2, ArrowRight, Check, AlertCircle, Bell, Sparkles } from "lucide-react"

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    businessName: "",
    email: "",
  })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    if (!formData.email || !formData.name) {
      setError("Por favor completa tu nombre y email")
      setIsLoading(false)
      return
    }

    // Simulate newsletter subscription
    // In production, this would call an API to save to a newsletter list
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      setSuccess(true)
    } catch (err) {
      console.error("Newsletter error:", err)
      setError("Error al suscribirse. Intenta nuevamente.")
    } finally {
      setIsLoading(false)
    }
  }

  const features = [
    "Novedades y actualizaciones del sistema",
    "Tips para optimizar tu negocio",
    "Acceso anticipado a nuevas funciones",
    "Descuentos exclusivos para suscriptores",
  ]

  if (success) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center p-8">
        <div className="fixed inset-0 bg-[linear-gradient(rgba(0,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none" />
        <div className="w-full max-w-md relative z-10">
          <div className="rounded-2xl border border-cyan-500/20 bg-[#0a0f1a]/80 backdrop-blur-xl p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-cyan-500/20 flex items-center justify-center mx-auto mb-6">
              <Check className="w-8 h-8 text-cyan-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">¡Te has suscrito!</h2>
            <p className="text-gray-400 mb-2">Te mantendremos informado en:</p>
            <p className="text-cyan-400 font-semibold mb-6">{formData.email}</p>
            <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-4 mb-6 text-left">
              <div className="flex gap-3">
                <Sparkles className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-cyan-200">
                  <p className="font-semibold mb-1">¡Gracias por tu interés!</p>
                  <p className="text-cyan-300/80">
                    Te avisaremos cuando Atlas One esté disponible para registro público. 
                    Mientras tanto, puedes probar el sistema en modo demo.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Link href="/demo" className="flex-1">
                <Button className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-semibold">
                  Probar Demo
                </Button>
              </Link>
              <Link href="/" className="flex-1">
                <Button variant="outline" className="w-full border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10">
                  Volver al Inicio
                </Button>
              </Link>
            </div>
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
              <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center mx-auto mb-4">
                <Bell className="w-6 h-6 text-cyan-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Suscríbete a nuestro Newsletter</h2>
              <p className="text-gray-400">Sé el primero en enterarte cuando abramos el registro</p>
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
                  Nombre de tu Negocio <span className="text-gray-500">(opcional)</span>
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
                  />
                </div>
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

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-semibold py-5 group"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                ) : (
                  <>
                    Suscribirse
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>

              <p className="text-xs text-gray-500 text-center">
                No spam. Solo te avisaremos de novedades importantes.
              </p>
            </form>

            <div className="mt-6 pt-6 border-t border-cyan-500/10 text-center space-y-3">
              <p className="text-gray-400">
                ¿Quieres probar el sistema?{" "}
                <Link href="/demo" className="text-cyan-400 hover:text-cyan-300 font-medium">
                  Accede al Demo
                </Link>
              </p>
              <p className="text-gray-500 text-sm">
                ¿Ya tienes cuenta?{" "}
                <Link href="/login" className="text-cyan-400 hover:text-cyan-300 font-medium">
                  Inicia sesión
                </Link>
              </p>
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
            Próximamente
            <br />
            <span className="text-cyan-400">Atlas One ERP</span>
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
