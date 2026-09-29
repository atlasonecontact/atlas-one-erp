import Link from "next/link"
import { AtlasLogo } from "@/components/atlas-logo"
import { TERMS_TEXT, TERMS_VERSION } from "@/lib/legal/documents"

export const metadata = {
  title: "Términos y Condiciones — Atlas One",
}

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-[#030712] px-4 py-10 sm:py-16">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="mb-8 flex items-center gap-3">
          <AtlasLogo className="h-8 w-8" />
          <span className="text-lg font-bold text-cyan-400">ATLAS ONE</span>
        </Link>
        <div className="rounded-2xl border border-cyan-500/20 bg-[#0a0f1a]/80 p-6 sm:p-8">
          <h1 className="mb-1 text-2xl font-bold text-white">Términos y Condiciones</h1>
          <p className="mb-6 text-xs text-gray-500">Versión {TERMS_VERSION}</p>
          <div className="whitespace-pre-line text-sm leading-relaxed text-gray-300">{TERMS_TEXT}</div>
        </div>
      </div>
    </div>
  )
}
