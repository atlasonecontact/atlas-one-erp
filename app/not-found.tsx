import Link from "next/link"
import { AtlasLogo } from "@/components/atlas-logo"
import { SearchX } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#030712] flex items-center justify-center p-8">
      <div className="fixed inset-0 bg-[linear-gradient(rgba(0,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none" />
      <div className="w-full max-w-md relative z-10 text-center">
        <Link href="/" className="flex items-center justify-center gap-3 mb-8">
          <AtlasLogo className="w-10 h-10" />
          <span className="text-xl font-bold text-cyan-400">ATLAS ONE</span>
        </Link>

        <div className="rounded-2xl border border-cyan-500/20 bg-[#0a0f1a]/80 backdrop-blur-xl p-8">
          <div className="w-16 h-16 rounded-full bg-cyan-500/10 flex items-center justify-center mx-auto mb-6">
            <SearchX className="w-8 h-8 text-cyan-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Página no encontrada</h2>
          <p className="text-gray-400 text-sm mb-6">El link que seguiste no existe o ya no está disponible.</p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center bg-cyan-500 hover:bg-cyan-400 text-black font-semibold h-11 px-8 rounded-md"
          >
            Ir al login
          </Link>
        </div>
      </div>
    </div>
  )
}
