import { FlaskConical } from "lucide-react"

export function DemoDataBanner() {
  return (
    <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm mb-4">
      <FlaskConical className="w-4 h-4 shrink-0" />
      <span>
        Datos de ejemplo — este panel todavía no está conectado a tus ventas reales.
      </span>
    </div>
  )
}
