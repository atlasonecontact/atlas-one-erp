"use client"

import { useEffect, useState } from "react"
import { AlertTriangle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

const ADMIN_EMAIL = "atlasonecontact@gmail.com"
const SUPPORT_WHATSAPP = "https://wa.me/5491173678389"

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("es-AR")
}

// Cartel de "hay que pagar la suscripcion", visible para el dueño de la
// cuenta en todo el dashboard cuando profiles.next_payment_due_at ya paso.
// No bloquea nada (el corte duro ya existe via access_status=suspended desde
// /dashboard/admin/cuentas) — esto es el aviso antes de llegar a eso.
export function SubscriptionDueBanner() {
  const [dueDate, setDueDate] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const supabase = createClient()

    const load = async () => {
      const { data: userData } = await supabase.auth.getUser()
      const user = userData?.user
      if (!user || user.email === ADMIN_EMAIL) return

      const { data: profile } = await supabase
        .from("profiles")
        .select("next_payment_due_at")
        .eq("id", user.id)
        .single()

      if (!active) return
      const due = profile?.next_payment_due_at as string | null
      if (due && new Date(due + "T00:00:00") < new Date(new Date().toDateString())) {
        setDueDate(due)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [])

  if (!dueDate) return null

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 bg-red-600 px-4 py-2 text-center text-sm font-medium text-white">
      <AlertTriangle className="h-4 w-4 shrink-0" />
      <span>
        Tu suscripción de Atlas One venció el {formatDate(dueDate)}. Abonala para seguir usando el sistema sin interrupciones.
      </span>
      <a
        href={SUPPORT_WHATSAPP}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 rounded-md bg-white/20 px-2.5 py-0.5 font-semibold underline-offset-2 hover:bg-white/30 hover:underline"
      >
        Pagar ahora
      </a>
    </div>
  )
}
