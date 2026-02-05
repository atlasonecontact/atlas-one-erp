"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AtlasLogo } from "@/components/atlas-logo"
import { Store, Check } from "lucide-react"

export default function RegisterPage() {
  const features = [
    "Punto de venta rápido e intuitivo",
    "Control de inventario en tiempo real",
    "Reportes y análisis avanzados",
    "Gestión de empleados y roles",
  ]

  return (
    <div className="min-h-screen bg-[#030712] flex">
      {/* Background effects */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(0,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Left side - Message */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center justify-center mb-12">
            <AtlasLogo variant="horizontal" />
          </div>

          <div className="rounded-2xl border border-cyan-500/20 bg-[#0a0f1a]/80 backdrop-blur-xl p-8">
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-cyan-500/10 text-cyan-400 mb-6">
                <Store className="w-8 h-8" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">Registro Cerrado Temporalmente</h2>
              <p className="text-gray-400 mb-8 max-w-sm mx-auto">
                Estamos mejorando nuestra plataforma. Por el momento, el registro de nuevas cuentas está deshabilitado.
              </p>
              <Button
                asChild
                className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold h-11 sm:h-12 px-8"
              >
                <Link href="/login">
                  Volver al Login
                </Link>
              </Button>
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
