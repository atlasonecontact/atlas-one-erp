import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { PRIVACY_VERSION, TERMS_VERSION } from "@/lib/legal/documents"

// Registra la aceptación de Términos y Condiciones + Política de Privacidad: guarda un
// evento inmutable por documento en user_legal_acceptances (con IP y navegador, que sólo
// el servidor puede leer de forma confiable) y actualiza el estado rápido en profiles.
export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  const ipAddress =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || null
  const userAgent = request.headers.get("user-agent")
  const acceptedAt = new Date().toISOString()

  const { error: auditError } = await supabase.from("user_legal_acceptances").insert([
    {
      user_id: user.id,
      document_type: "terms",
      version: TERMS_VERSION,
      accepted_at: acceptedAt,
      ip_address: ipAddress,
      user_agent: userAgent,
    },
    {
      user_id: user.id,
      document_type: "privacy",
      version: PRIVACY_VERSION,
      accepted_at: acceptedAt,
      ip_address: ipAddress,
      user_agent: userAgent,
    },
  ])

  if (auditError) {
    console.error("[legal/accept] No se pudo registrar la evidencia de aceptación:", auditError)
    return NextResponse.json({ error: auditError.message }, { status: 500 })
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      terms_accepted_at: acceptedAt,
      terms_version: TERMS_VERSION,
      privacy_accepted_at: acceptedAt,
      privacy_version: PRIVACY_VERSION,
    })
    .eq("id", user.id)

  if (profileError) {
    console.error("[legal/accept] No se pudo actualizar profiles:", profileError)
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, acceptedAt })
}
