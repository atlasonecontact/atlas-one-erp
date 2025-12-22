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

    // Verificar que el usuario demo existe (fue creado por el script SQL 200_create_demo_users.sql)
    const { data: listData, error: listError } = await admin.auth.admin.listUsers()
    if (listError) {
      return NextResponse.json({ error: listError.message }, { status: 400 })
    }

    const user = listData.users.find((u) => u.email === email)
    if (!user) {
      return NextResponse.json(
        {
          error: `Usuario demo no encontrado. Ejecutá el script SQL: scripts/200_create_demo_users.sql`,
        },
        { status: 404 }
      )
    }

    const userId = user.id

    // Verificar que tiene kiosko
    const { data: kiosko } = await admin.from("kioscos").select("id").eq("owner_id", userId).limit(1).maybeSingle()

    if (!kiosko) {
      return NextResponse.json(
        {
          error: `El usuario demo existe pero no tiene kiosko. Ejecutá el script SQL: scripts/200_create_demo_users.sql`,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      email,
      password,
      kioskoId: kiosko.id,
    })
  } catch (error: any) {
    console.error("[api/demo/ensure]", error)
    return NextResponse.json({ error: error?.message || "Error interno" }, { status: 500 })
  }
}
