/**
 * Script para crear cuentas demo
 * Ejecutar con: npx tsx scripts/create-demo-accounts.ts
 */

import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Falta configurar NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

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

async function createDemoAccount(type: DemoType) {
  const email = demoEmail(type)
  const password = process.env.DEMO_PASSWORD || "Demo123456!"

  console.log(`\n🔧 Creando cuenta: ${email}`)

  try {
    // Intentar crear usuario
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

    let userId = created?.user?.id

    // Si ya existe, buscar por email
    if (createError) {
      if (!createError.message.toLowerCase().includes("already")) {
        console.error(`   ❌ Error creando: ${createError.message}`)
        return
      }
      console.log("   ⚠️  Usuario ya existe, buscando...")
      const { data: listData } = await admin.auth.admin.listUsers()
      const existing = listData.users.find((u) => u.email === email)
      userId = existing?.id
    }

    if (!userId) {
      console.error("   ❌ No se pudo determinar el ID del usuario")
      return
    }

    // Crear o actualizar perfil
    const { error: profileError } = await admin.from("profiles").upsert(
      {
        id: userId,
        username: email.split("@")[0],
        full_name: `Usuario Demo - ${demoBusinessName(type)}`,
        role: "owner",
        business_name: demoBusinessName(type),
        theme: "cyan",
      },
      { onConflict: "id" }
    )

    if (profileError) {
      console.error(`   ❌ Error en perfil: ${profileError.message}`)
      return
    }

    console.log(`   ✅ Cuenta creada: ${email}`)
    console.log(`   📧 Email: ${email}`)
    console.log(`   🔑 Password: ${password}`)
  } catch (error: any) {
    console.error(`   ❌ Error: ${error.message}`)
  }
}

async function main() {
  console.log("🚀 Creando cuentas demo para Atlas ONE...\n")
  console.log("=" .repeat(50))

  for (const type of DEMO_TYPES) {
    await createDemoAccount(type)
  }

  console.log("\n" + "=".repeat(50))
  console.log("✅ Proceso completado")
  console.log("\n📋 Resumen de cuentas demo:")
  for (const type of DEMO_TYPES) {
    console.log(`   • ${demoEmail(type)} / Demo123456!`)
  }
}

main()
