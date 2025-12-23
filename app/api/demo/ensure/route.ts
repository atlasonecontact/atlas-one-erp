import { NextResponse, type NextRequest } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

const DEMO_TYPES = [
  "maxi-kiosco",
  "mini-market",
  "licoreria",
  "vinoteca",
  "libreria",
  "jugueteria",
  "dietetica",
] as const

type DemoType = (typeof DEMO_TYPES)[number]

type Body = {
  type: DemoType
}

function demoEmail(type: DemoType) {
  return `demo.${type}@atlasone.com`
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<Body>
    const type = body.type as DemoType

    if (!type || !DEMO_TYPES.includes(type)) {
      return NextResponse.json({ error: "Tipo de demo inválido" }, { status: 400 })
    }

    const email = demoEmail(type)
    const password = "Demo123456!"

    const supabase = createAdminClient()

    // Verify the demo user exists in auth.users
    const {
      data: { users },
      error: usersError,
    } = await supabase.auth.admin.listUsers()

    if (usersError) {
      console.error("[demo/ensure] Error fetching users:", usersError)
      return NextResponse.json(
        { error: "Error al verificar usuario demo. Contactá al administrador." },
        { status: 500 },
      )
    }

    const demoUser = users?.find((u) => u.email === email)

    if (!demoUser) {
      console.error("[demo/ensure] Demo user not found:", { email, type })
      return NextResponse.json(
        { error: `No se encontró el usuario demo ${type}. Ejecutá el script SQL: scripts/200_create_demo_users.sql` },
        { status: 404 },
      )
    }

    console.log("[demo/ensure] Demo user verified:", {
      email,
      userId: demoUser.id,
      type,
    })

    // Return credentials - the login flow will handle kiosco selection
    return NextResponse.json({
      ok: true,
      email,
      password,
    })
  } catch (error: any) {
    console.error("[api/demo/ensure] Unexpected error:", error)
    return NextResponse.json({ error: error?.message || "Error interno" }, { status: 500 })
  }
}
