import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { pin } = (await req.json().catch(() => ({}))) as { pin?: string }

    if (!pin || !/^\d{4,6}$/.test(pin)) {
      return NextResponse.json({ error: "El PIN debe tener entre 4 y 6 números" }, { status: 400 })
    }

    const admin = createAdminClient()

    // El PIN nunca se guarda en texto plano: se hashea en la base (pgcrypto/bcrypt,
    // scripts/223_hash_employee_pins.sql) antes de escribirlo.
    const { data: pinHash, error: hashError } = await admin.rpc("hash_pin", { p_pin: pin })
    if (hashError || !pinHash) {
      console.error("[api/employees/set-pin] hash_pin error:", hashError)
      return NextResponse.json({ error: "No se pudo procesar el PIN" }, { status: 500 })
    }

    const { error } = await admin
      .from("employees")
      .update({ pin_hash: pinHash, updated_at: new Date().toISOString() })
      .eq("user_id", user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[api/employees/set-pin]", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
