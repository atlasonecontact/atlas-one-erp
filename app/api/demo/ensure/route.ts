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

    const admin = createAdminClient()
    const email = demoEmail(type)
    const password = "Demo123456!"

    const { data: listData, error: listError } = await admin.auth.admin.listUsers()
    if (listError) {
      console.error("[demo/ensure] Error listing users:", listError)
      return NextResponse.json({ error: listError.message }, { status: 400 })
    }

    const user = listData.users.find((u) => u.email === email)
    if (!user) {
      console.error("[demo/ensure] Demo user not found:", email)
      return NextResponse.json(
        {
          error: `Usuario demo no encontrado. Ejecutá el script SQL: scripts/200_create_demo_users.sql`,
        },
        { status: 404 },
      )
    }

    const userId = user.id
    console.log("[demo/ensure] Found demo user:", { email, userId })

    // Verificar que tiene kiosko con más debugging
    const { data: kioscos, error: kioscoError } = await admin
      .from("kioscos")
      .select("id, name, owner_id")
      .eq("owner_id", userId)

    console.log("[demo/ensure] Kioscos query result:", { kioscos, error: kioscoError, userId })

    if (kioscoError) {
      console.error("[demo/ensure] Error querying kioscos:", kioscoError)
      return NextResponse.json({ error: "Error al buscar kioscos: " + kioscoError.message }, { status: 500 })
    }

    if (!kioscos || kioscos.length === 0) {
      console.error("[demo/ensure] No kioscos found for user:", { userId, email })
      return NextResponse.json(
        {
          error: `El usuario demo existe pero no tiene kioscos asociados. Verificá que el owner_id en la tabla kioscos coincida con el user_id: ${userId}`,
        },
        { status: 500 },
      )
    }

    const kiosko = kioscos[0]
    console.log("[demo/ensure] Successfully found kiosko:", kiosko)

    return NextResponse.json({
      ok: true,
      email,
      password,
      kioskoId: kiosko.id,
      kioskoName: kiosko.name,
    })
  } catch (error: any) {
    console.error("[api/demo/ensure] Unexpected error:", error)
    return NextResponse.json({ error: error?.message || "Error interno" }, { status: 500 })
  }
}
