"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ShieldCheck, ChevronDown, ChevronUp } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { PRIVACY_TEXT, PRIVACY_VERSION, TERMS_TEXT, TERMS_VERSION } from "@/lib/legal/documents"

export function TermsGate() {
  const [visible, setVisible] = useState(false)
  const [expanded, setExpanded] = useState<"terms" | "privacy" | null>(null)
  const [checked, setChecked] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false
    const supabase = createClient()

    const check = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user || cancelled) return

      const { data: profile, error: selectError } = await supabase
        .from("profiles")
        .select("terms_accepted_at, terms_version, privacy_accepted_at, privacy_version")
        .eq("id", user.id)
        .maybeSingle()
      if (cancelled) return

      if (selectError) {
        console.error("[TermsGate] No se pudo leer el estado de aceptación:", selectError)
      }

      const termsOk = profile?.terms_accepted_at && profile.terms_version === TERMS_VERSION
      const privacyOk = profile?.privacy_accepted_at && profile.privacy_version === PRIVACY_VERSION
      if (!termsOk || !privacyOk) {
        setVisible(true)
      }
    }

    check()
    return () => {
      cancelled = true
    }
  }, [])

  const accept = async () => {
    if (!checked) return
    setSaving(true)
    setError("")
    try {
      const res = await fetch("/api/legal/accept", { method: "POST" })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        // Mostramos siempre el error real del servidor (no un texto adivinado), para no
        // quedarnos "a ciegas" si la causa no es la migración de base de datos.
        setError(`No pudimos guardar tu aceptación (${body?.error || `HTTP ${res.status}`}).`)
        return
      }
      setVisible(false)
    } catch (err) {
      console.error("[TermsGate] Error de red al aceptar:", err)
      setError("No pudimos conectarnos para guardar tu aceptación. Revisá tu conexión y probá de nuevo.")
    } finally {
      setSaving(false)
    }
  }

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl border border-cyan-500/20 bg-card p-6 shadow-2xl sm:p-8">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/15">
            <ShieldCheck className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Términos y Privacidad</h2>
            <p className="text-xs text-muted-foreground">Antes de seguir usando Atlas One, aceptalos</p>
          </div>
        </div>

        <p className="mb-3 text-sm text-muted-foreground">
          Para usar Atlas One necesitamos que leas y aceptes nuestros Términos y Condiciones y nuestra Política de
          Privacidad. Podés abrir el texto completo de cada uno acá abajo, o en su propia página.
        </p>

        <div className="mb-3 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setExpanded((v) => (v === "terms" ? null : "terms"))}
            className="flex items-center gap-1 text-xs font-medium text-cyan-400 hover:text-cyan-300"
          >
            Términos y Condiciones {expanded === "terms" ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
          <Link href="/terminos" target="_blank" className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground">
            (abrir en otra pestaña)
          </Link>
        </div>

        {expanded === "terms" && (
          <div className="mb-4 max-h-56 overflow-y-auto whitespace-pre-line rounded-lg border border-border bg-muted p-4 text-xs leading-relaxed text-muted-foreground">
            {TERMS_TEXT}
          </div>
        )}

        <div className="mb-3 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setExpanded((v) => (v === "privacy" ? null : "privacy"))}
            className="flex items-center gap-1 text-xs font-medium text-cyan-400 hover:text-cyan-300"
          >
            Política de Privacidad {expanded === "privacy" ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
          <Link href="/privacidad" target="_blank" className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground">
            (abrir en otra pestaña)
          </Link>
        </div>

        {expanded === "privacy" && (
          <div className="mb-4 max-h-56 overflow-y-auto whitespace-pre-line rounded-lg border border-border bg-muted p-4 text-xs leading-relaxed text-muted-foreground">
            {PRIVACY_TEXT}
          </div>
        )}

        <label className="mb-4 flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="mt-0.5 h-5 w-5 shrink-0 accent-cyan-500"
          />
          <span className="text-sm text-muted-foreground">
            Leí y acepto los Términos y Condiciones y la Política de Privacidad de Atlas One.
          </span>
        </label>

        {error && <p className="mb-3 text-xs text-red-400">{error}</p>}

        <button
          type="button"
          disabled={!checked || saving}
          onClick={accept}
          className="h-11 w-full rounded-lg bg-cyan-500 font-semibold text-black transition-colors hover:bg-cyan-400 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
        >
          {saving ? "Guardando..." : "Aceptar y continuar"}
        </button>
      </div>
    </div>
  )
}
