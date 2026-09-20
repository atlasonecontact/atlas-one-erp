import { NextResponse, type NextRequest } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(req: NextRequest) {
  try {
    const { username } = (await req.json().catch(() => ({}))) as { username?: string }
    const clean = username?.trim().toLowerCase()

    if (!clean) {
      return NextResponse.json({ error: "Falta el usuario" }, { status: 400 })
    }

    const admin = createAdminClient()
    const { data } = await admin
      .from("employees")
      .select("email, status")
      .eq("username", clean)
      .maybeSingle()

    if (!data?.email) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    if (data.status && data.status !== "active") {
      return NextResponse.json({ error: "Este usuario no tiene acceso habilitado" }, { status: 403 })
    }

    return NextResponse.json({ email: data.email })
  } catch (error: any) {
    console.error("[api/auth/resolve-username]", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
