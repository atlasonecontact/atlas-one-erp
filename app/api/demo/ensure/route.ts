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

async function seedDemoData(admin: any, userId: string, kioskoId: string, type: DemoType) {
  // Crear categorías
  const categories = [
    { name: "Bebidas", description: "Bebidas frías y calientes", color: "#00d4ff" },
    { name: "Snacks", description: "Papas, galletas y snacks", color: "#ff6b6b" },
    { name: "Cigarrillos", description: "Tabaco y cigarrillos", color: "#ffd93d" },
    { name: "Lácteos", description: "Leche, yogurt y derivados", color: "#6bcb77" },
    { name: "Golosinas", description: "Chocolates y caramelos", color: "#a8e6cf" },
    { name: "Limpieza", description: "Productos de limpieza", color: "#4ecdc4" },
  ]

  const { data: createdCategories } = await admin
    .from("categories")
    .insert(
      categories.map((cat) => ({
        kiosko_id: kioskoId,
        name: cat.name,
        description: cat.description,
        color: cat.color,
      }))
    )
    .select()

  // Crear productos de ejemplo
  const products = [
    { sku: "BEB-COCA-500", name: "Coca Cola 500ml", category: "Bebidas", cost: 500, price: 1000, stock: 50, min_stock: 20, barcode: "7790895001235" },
    { sku: "BEB-SPRITE-500", name: "Sprite 500ml", category: "Bebidas", cost: 500, price: 1000, stock: 40, min_stock: 20, barcode: "7790895001242" },
    { sku: "BEB-AGUA-500", name: "Agua Mineral 500ml", category: "Bebidas", cost: 300, price: 600, stock: 60, min_stock: 30, barcode: "7790895001259" },
    { sku: "SNA-LAYS-95", name: "Lays Clásicas 95g", category: "Snacks", cost: 600, price: 1200, stock: 30, min_stock: 15, barcode: "7790895002011" },
    { sku: "SNA-PEPITOS", name: "Pepitos 130g", category: "Snacks", cost: 400, price: 800, stock: 25, min_stock: 12, barcode: "7790895002028" },
    { sku: "CIG-MARLBORO", name: "Marlboro Box 20", category: "Cigarrillos", cost: 900, price: 1800, stock: 15, min_stock: 20, barcode: "7790895002141" },
    { sku: "LAC-LECHE-1L", name: "Leche La Serenísima 1L", category: "Lácteos", cost: 450, price: 850, stock: 24, min_stock: 12, barcode: "7790895003102" },
    { sku: "GOL-MILKA-100", name: "Chocolate Milka 100g", category: "Golosinas", cost: 500, price: 950, stock: 25, min_stock: 12, barcode: "7790895004102" },
    { sku: "LIM-CIFF-500", name: "Cif Crema 500ml", category: "Limpieza", cost: 800, price: 1500, stock: 15, min_stock: 8, barcode: "7790895005102" },
  ]

  await admin.from("products").insert(
    products.map((prod) => ({
      kiosko_id: kioskoId,
      sku: prod.sku,
      name: prod.name,
      category: prod.category,
      cost: prod.cost,
      price: prod.price,
      stock_quantity: prod.stock,
      min_stock_level: prod.min_stock,
      barcode: prod.barcode,
      is_active: true,
    }))
  )

  // Crear proveedores de ejemplo
  const suppliers = [
    { name: "Distribuidora Norte", contact: "Carlos García", email: "carlos@distnorte.com", phone: "11-4444-5555" },
    { name: "Bebidas del Sur", contact: "María López", email: "maria@bebidasdelsur.com", phone: "11-6666-7777" },
  ]

  await admin.from("suppliers").insert(
    suppliers.map((sup) => ({
      kiosko_id: kioskoId,
      name: sup.name,
      contact_name: sup.contact,
      email: sup.email,
      phone: sup.phone,
    }))
  )

  // Crear empleados de ejemplo
  const employees = [
    { username: "maria.gonzalez", name: "María González", position: "Cajero", permissions: { can_sell: true, can_manage_cash: true, can_view_reports: false, can_manage_products: false } },
    { username: "pedro.sanchez", name: "Pedro Sánchez", position: "Cajero", permissions: { can_sell: true, can_manage_cash: true, can_view_reports: false, can_manage_products: false } },
  ]

  await admin.from("employees").insert(
    employees.map((emp) => ({
      kiosko_id: kioskoId,
      username: emp.username,
      name: emp.name,
      position: emp.position,
      status: "active",
      permissions: emp.permissions,
    }))
  )

  // Crear ventas de ejemplo (últimos 30 días)
  const sales = []
  for (let i = 0; i < 30; i++) {
    const saleDate = new Date()
    saleDate.setDate(saleDate.getDate() - i)
    
    const numSales = Math.floor(Math.random() * 5) + 3
    for (let j = 0; j < numSales; j++) {
      sales.push({
        kiosko_id: kioskoId,
        sale_number: `VTA-DEMO-${String(i * 10 + j).padStart(6, "0")}`,
        total_amount: (Math.random() * 5000 + 500).toFixed(2),
        payment_method: ["cash", "card", "transfer"][Math.floor(Math.random() * 3)],
        status: "completed",
        created_at: saleDate.toISOString(),
      })
    }
  }

  await admin.from("sales").insert(sales)
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

    // Crear o actualizar profile con telegram_chat_id ficticio para demos
    const demoTelegramChatId = `DEMO_${type.toUpperCase().replace(/-/g, "_")}_${Math.floor(Math.random() * 1000000)}`
    
    await admin.from("profiles").upsert(
      {
        id: userId,
        username: email.split("@")[0],
        full_name: `Usuario Demo - ${demoBusinessName(type)}`,
        role: "owner",
        business_name: demoBusinessName(type),
        theme: "cyan",
        telegram_chat_id: demoTelegramChatId,
      },
      { onConflict: "id" },
    )

    // Verificar si ya existe un kiosko para este usuario
    const { data: existingKiosko } = await admin
      .from("kioscos")
      .select("id")
      .eq("owner_id", userId)
      .maybeSingle()

    let kioskoId = existingKiosko?.id

    // Si no existe, crear kiosko con datos
    if (!kioskoId) {
      const { data: newKiosko, error: kioskoError } = await admin
        .from("kioscos")
        .insert({
          owner_id: userId,
          name: `${demoBusinessName(type)} - Central`,
          location: "Av. Corrientes 1234",
          city: "CABA",
          phone: "11-4444-5555",
          cuit: "30-12345678-9",
          status: "active",
        })
        .select()
        .single()

      if (kioskoError) {
        console.error("[api/demo/ensure] Error creating kiosko:", kioskoError)
        return NextResponse.json({ error: "Error al crear kiosko demo" }, { status: 500 })
      }

      kioskoId = newKiosko.id

      // Seed demo data
      try {
        await seedDemoData(admin, userId, kioskoId, type)
      } catch (seedError) {
        console.error("[api/demo/ensure] Error seeding data:", seedError)
        // No retornamos error aquí porque el kiosko ya fue creado
      }
    }

    return NextResponse.json({ ok: true, email, password, kioskoId })
  } catch (error: any) {
    console.error("[api/demo/ensure]", error)
    return NextResponse.json({ error: error?.message || "Error interno" }, { status: 500 })
  }
}
