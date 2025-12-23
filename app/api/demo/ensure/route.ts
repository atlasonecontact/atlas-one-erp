import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

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

    const supabase = await createClient()

    const { data: kioscoData, error: kioscoError } = await supabase
      .from("kioscos")
      .select(`
        id,
        name,
        owner_id,
        profiles!kioscos_owner_id_fkey(id, email)
      `)
      .eq("profiles.email", email)
      .single()

    if (kioscoError || !kioscoData) {
      console.error("[demo/ensure] Error finding demo kiosko:", { email, error: kioscoError })
      return NextResponse.json(
        {
          error: `No se encontró un kiosco para el usuario demo ${type}. Contactá al administrador.`,
        },
        { status: 404 },
      )
    }

    console.log("[demo/ensure] Successfully found demo setup:", {
      email,
      kioskoId: kioscoData.id,
      kioskoName: kioscoData.name,
    })

    return NextResponse.json({
      ok: true,
      email,
      password,
      kioskoId: kioscoData.id,
      kioskoName: kioscoData.name,
    })
  } catch (error: any) {
    console.error("[api/demo/ensure] Unexpected error:", error)
    return NextResponse.json({ error: error?.message || "Error interno" }, { status: 500 })
  }
}
