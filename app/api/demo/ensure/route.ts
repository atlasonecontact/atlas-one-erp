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
      return NextResponse.json({ error: "Tipo de demo invalido" }, { status: 400 })
    }

    const email = demoEmail(type)
    const password = "Demo123456!"

    const supabase = createAdminClient()

    console.log("[v0] Demo API - Verificando usuario:", email)

    // Método 1: Intentar verificar el usuario directamente con getUserByEmail
    try {
      const { data: userData, error: getUserError } = await supabase.auth.admin.getUserByEmail(email)
      
      if (getUserError) {
        console.log("[v0] Demo API - Error getUserByEmail:", getUserError.message)
        // Si falla, intentar método alternativo
      } else if (userData?.user) {
        console.log("[v0] Demo API - Usuario encontrado con getUserByEmail")
        return NextResponse.json({
          ok: true,
          email,
          password,
        })
      }
    } catch (err) {
      console.log("[v0] Demo API - Excepción getUserByEmail:", err)
    }

    // Método 2: Verificar en la tabla de usuarios (profiles o similar)
    try {
      const { data: profileData, error: profileError } = await supabase
        .from("usuarios")
        .select("id, email")
        .eq("email", email)
        .single()

      if (profileError) {
        console.log("[v0] Demo API - Error verificando en tabla usuarios:", profileError.message)
      } else if (profileData) {
        console.log("[v0] Demo API - Usuario encontrado en tabla usuarios")
        return NextResponse.json({
          ok: true,
          email,
          password,
        })
      }
    } catch (err) {
      console.log("[v0] Demo API - Excepción verificando tabla usuarios:", err)
    }

    // Método 3: Si ambos fallan, intentar login directo (si el usuario existe, el login funcionará)
    console.log("[v0] Demo API - Intentando validación mediante signIn")
    try {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (!signInError && signInData?.user) {
        console.log("[v0] Demo API - Usuario validado mediante signIn")
        // Cerrar sesión inmediatamente (solo estábamos probando credenciales)
        await supabase.auth.signOut()
        
        return NextResponse.json({
          ok: true,
          email,
          password,
        })
      }
      
      console.log("[v0] Demo API - Error en signIn:", signInError?.message)
    } catch (err) {
      console.log("[v0] Demo API - Excepción en signIn:", err)
    }

    // Si todos los métodos fallan, asumir que el usuario no existe
    console.log("[v0] Demo API - Usuario no encontrado después de todos los intentos")
    return NextResponse.json(
      { 
        error: `El usuario demo "${type}" no está configurado. Por favor usa el login normal o contacta al administrador.`,
        email,
        password, // Devolvemos las credenciales por si acaso el usuario quiere intentar manualmente
      },
      { status: 404 },
    )
  } catch (error: unknown) {
    console.error("[v0] Demo API - Error general:", error)
    const message = error instanceof Error ? error.message : "Error interno"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
