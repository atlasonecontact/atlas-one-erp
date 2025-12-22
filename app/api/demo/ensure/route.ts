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

function demoBusinessName(type: DemoType) {
  switch (type) {
    case "maxi-kiosco":
      return "Maxi Kiosco Demo"
    case "mini-market":
      return "Mini Market Demo"
    case "licoreria":
      return "Licorería Demo"
    case "vinoteca":
      return "Vinoteca Demo"
    case "libreria":
      return "Librería Demo"
    case "jugueteria":
      return "Juguetería Demo"
    case "dietetica":
      return "Dietetica Demo"
    default:
      return "Demo"
  }
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
    const password = process.env.DEMO_PASSWORD || "Demo123456!"

    // Create (or ensure) demo auth user
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: `Usuario Demo - ${demoBusinessName(type)}`,
        role: "owner",
        business_name: demoBusinessName(type),
        demo_type: type,
      },
    })

    // If already exists, ignore and just ensure profile
    if (createError && !(createError.message || "").toLowerCase().includes("already")) {
      return NextResponse.json({ error: createError.message }, { status: 400 })
    }

    let userId = created?.user?.id
    if (!userId) {
      // El usuario ya existe, buscarlo por email
      const { data: listData, error: listError } = await admin.auth.admin.listUsers()
      if (listError) {
        return NextResponse.json({ error: listError.message }, { status: 400 })
      }
      const existingUser = listData.users.find(u => u.email === email)
      userId = existingUser?.id
    }

    if (!userId) {
      return NextResponse.json({ error: "No se pudo determinar el usuario demo" }, { status: 400 })
    }

    await admin.from("profiles").upsert(
      {
        id: userId,
        username: email.split("@")[0],
        full_name: `Usuario Demo - ${demoBusinessName(type)}`,
        role: "owner",
        business_name: demoBusinessName(type),
        theme: "cyan",
      },
      { onConflict: "id" },
    )

    return NextResponse.json({ ok: true, email, password })
  } catch (error: any) {
    console.error("[api/demo/ensure]", error)
    return NextResponse.json({ error: error?.message || "Error interno" }, { status: 500 })
  }
}
