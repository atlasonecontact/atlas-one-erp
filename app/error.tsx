"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AtlasLogo } from "@/components/atlas-logo"
import { AlertTriangle } from "lucide-react"

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[v0] Unhandled error:", error)
  }, [error])

  return (
    <div className="min-h-screen bg-[#030712] flex items-center justify-center p-8">
      <div className="fixed inset-0 bg-[linear-gradient(rgba(0,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none" />
      <div className="w-full max-w-md relative z-10 text-center">
        <Link href="/" className="flex items-center justify-center gap-3 mb-8">
          <AtlasLogo className="w-10 h-10" />
          <span className="text-xl font-bold text-cyan-400">ATLAS ONE</span>
        </Link>

        <div className="rounded-2xl border border-cyan-500/20 bg-[#0a0f1a]/80 backdrop-blur-xl p-8">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Algo salió mal</h2>
          <p className="text-gray-400 text-sm mb-6">
            Ocurrió un error inesperado. Podés reintentar o volver al login.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <button
              onClick={() => reset()}
              className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold h-11 px-6 rounded-md"
            >
              Reintentar
            </button>
            <Link
              href="/login"
              className="inline-flex items-center justify-center border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 font-semibold h-11 px-6 rounded-md"
            >
              Ir al login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
