import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

type Body = {
  kioskoId: string
  email: string
  password: string
  fullName: string
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = (await req.json()) as Partial<Body>
    const kioskoId = body.kioskoId?.trim()
    const email = body.email?.trim().toLowerCase()
    const password = body.password
    const fullName = body.fullName?.trim()

    if (!kioskoId || !email || !password || !fullName) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "La contraseña debe tener al menos 8 caracteres" }, { status: 400 })
    }

    // Authorization: only kiosko owner can create employee users
    const { data: kiosko, error: kioskoError } = await supabase
      .from("kioscos")
      .select("id, owner_id")
      .eq("id", kioskoId)
      .single()

    if (kioskoError || !kiosko) {
      return NextResponse.json({ error: "Kiosco no encontrado" }, { status: 404 })
    }

    if (kiosko.owner_id !== user.id) {
      return NextResponse.json({ error: "No autorizado para este kiosco" }, { status: 403 })
    }

    const admin = createAdminClient()

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: "employee",
      },
    })

    if (createError || !created.user) {
      const msg = createError?.message || "No se pudo crear el usuario"
      // Common case: email already exists
      if (msg.toLowerCase().includes("already") || msg.toLowerCase().includes("exists")) {
        return NextResponse.json({ error: "El email ya está registrado" }, { status: 409 })
      }
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    // Ensure profile exists for employee user
    await admin.from("profiles").upsert(
      {
        id: created.user.id,
        username: email.split("@")[0],
        full_name: fullName,
        role: "employee",
        business_name: "",
      },
      { onConflict: "id" },
    )

    return NextResponse.json({ userId: created.user.id })
  } catch (error: any) {
    console.error("[api/employees/create-user]", error)
    return NextResponse.json({ error: error?.message || "Error interno" }, { status: 500 })
  }
}
