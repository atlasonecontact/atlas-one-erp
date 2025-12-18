import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.message?.text) {
      return NextResponse.json({ ok: true })
    }

    const chatId = body.message.chat.id.toString()
    const text = body.message.text.toLowerCase()
    const botToken = process.env.TELEGRAM_BOT_TOKEN

    if (!botToken) {
      return NextResponse.json({ error: "Bot not configured" }, { status: 500 })
    }

    const supabase = await createServerClient()

    const { data: notif, error: notifError } = await supabase
      .from("notification_configs")
      .select("kiosko_id")
      .eq("telegram_chat_id", chatId)
      .eq("telegram_verified", true)
      .eq("whatsapp_verified", true)
      .maybeSingle()

    if (notifError) {
      throw notifError
    }

    const { data: kiosko, error: kioskoError } = notif?.kiosko_id
      ? await supabase.from("kioscos").select("id, name").eq("id", notif.kiosko_id).single()
      : { data: null, error: null }

    if (kioskoError) {
      throw kioskoError
    }

    if (!kiosko) {
      const responseMessage = `⚠️ <b>Acceso No Autorizado</b>

Tu número de teléfono no está verificado o no corresponde a ningún kiosco registrado.

Por favor, contacta al administrador para verificar tu cuenta en la sección de Configuración > Integraciones.`

      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: responseMessage,
          parse_mode: "HTML",
        }),
      })

      return NextResponse.json({ ok: true })
    }

    let responseMessage = ""

    // Comandos disponibles
    if (text === "/start") {
      responseMessage = `¡Bienvenido a Atlas One! 🎉

<b>Kiosco:</b> ${kiosko.name}

<b>Comandos disponibles:</b>
/ventas - Ver ventas de hoy
/mes - Ver estadísticas del mes
/stock - Ver productos con bajo stock
/ayuda - Ver todos los comandos`
    } else if (text === "/ventas" || text === "/hoy") {
      const today = new Date().toISOString().split("T")[0]

      const { data: sales } = await supabase
        .from("sales")
        .select("total_amount")
        .eq("kiosko_id", kiosko.id)
        .gte("created_at", `${today}T00:00:00`)
        .lte("created_at", `${today}T23:59:59`)

      const dailyTotal = sales?.reduce((sum, sale: any) => sum + (sale.total_amount || 0), 0) || 0
      const dailySales = sales?.length || 0

      responseMessage = `📊 <b>Ventas de Hoy - ${kiosko.name}</b>

🛒 ${dailySales} ventas
💰 $${dailyTotal.toLocaleString("es-AR")}
📍 Kiosco: ${kiosko.name}`
    } else if (text === "/mes") {
      const now = new Date()
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

      const { data: sales } = await supabase
        .from("sales")
        .select("total_amount")
        .eq("kiosko_id", kiosko.id)
        .gte("created_at", firstDay)

      const monthlyTotal = sales?.reduce((sum, sale: any) => sum + (sale.total_amount || 0), 0) || 0
      const monthlySales = sales?.length || 0

      responseMessage = `📊 <b>Estadísticas del Mes - ${kiosko.name}</b>

🛒 ${monthlySales} ventas
💰 $${monthlyTotal.toLocaleString("es-AR")}
📈 Promedio: $${monthlySales > 0 ? (monthlyTotal / monthlySales).toLocaleString("es-AR") : 0}
📍 Kiosco: ${kiosko.name}`
    } else if (text === "/stock") {
      const { data: products } = await supabase
        .from("products")
        .select("name, stock_quantity, min_stock_level")
        .eq("kiosko_id", kiosko.id)
        .lt("stock_quantity", 10)
        .order("stock_quantity", { ascending: true })
        .limit(5)

      if (!products || products.length === 0) {
        responseMessage = `✅ <b>Stock OK - ${kiosko.name}</b>

Todos los productos tienen stock suficiente.`
      } else {
        responseMessage = `⚠️ <b>Productos con Bajo Stock - ${kiosko.name}</b>

    ${products.map((p: any) => `• ${p.name}: ${p.stock_quantity} unidades`).join("\n")}

📍 Kiosco: ${kiosko.name}`
      }
    } else if (text === "/ayuda" || text === "/help") {
      responseMessage = `🤖 <b>Comandos de Atlas One</b>
<b>Kiosco:</b> ${kiosko.name}

<b>Ventas:</b>
/ventas - Ventas de hoy
/mes - Estadísticas del mes

<b>Inventario:</b>
/stock - Productos con bajo stock

<b>Ayuda:</b>
/ayuda - Mostrar este mensaje

Las ventas se notifican automáticamente en tiempo real 🔔`
    } else {
      responseMessage = "No entiendo ese comando. Usa /ayuda para ver los comandos disponibles."
    }

    // Enviar respuesta
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: responseMessage,
        parse_mode: "HTML",
      }),
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[v0] Telegram webhook error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
