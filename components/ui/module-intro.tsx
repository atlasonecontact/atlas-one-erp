"use client"

import { useEffect, useState } from "react"
import { HelpCircle, Info, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface ModuleIntroProps {
  /** Clave unica para recordar si el usuario lo cerro (ej. "ventas", "caja"). */
  id: string
  title?: string
  children: React.ReactNode
  className?: string
}

const STORAGE_PREFIX = "atlas.moduleIntro.collapsed."

/**
 * Mini resumen colapsable que explica que hace la pantalla. Arranca abierto;
 * si el usuario lo cierra, la preferencia queda guardada en este dispositivo
 * (localStorage) y no vuelve a aparecer solo hasta que lo abra de nuevo.
 */
export function ModuleIntro({ id, title = "¿Qué es esta pantalla?", children, className }: ModuleIntroProps) {
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(STORAGE_PREFIX + id) === "1")
    } catch {
      // localStorage no disponible: se queda abierto, no es critico.
    }
  }, [id])

  const toggle = () => {
    const next = !collapsed
    setCollapsed(next)
    try {
      window.localStorage.setItem(STORAGE_PREFIX + id, next ? "1" : "0")
    } catch {
      // no-op
    }
  }

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={toggle}
        className={cn(
          "mb-4 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors",
          className,
        )}
      >
        <HelpCircle className="w-3.5 h-3.5" />
        ¿Qué es esto? Mostrar ayuda
      </button>
    )
  }

  return (
    <div
      className={cn(
        "mb-4 flex items-start gap-3 rounded-xl border border-cyan-500/15 bg-cyan-500/5 p-4",
        className,
      )}
    >
      <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        {title && <p className="text-sm font-semibold text-foreground mb-1">{title}</p>}
        <p className="text-sm text-muted-foreground leading-relaxed">{children}</p>
      </div>
      <button
        type="button"
        onClick={toggle}
        aria-label="Ocultar ayuda"
        className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
