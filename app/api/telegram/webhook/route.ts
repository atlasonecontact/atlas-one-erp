import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

// Telegram Bot Webhook Handler
// Este endpoint recibe los mensajes de Telegram y responde automáticamente

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const botToken = process.env.TELEGRAM_BOT_TOKEN

    if (!botToken) {
      console.error("[Telegram Webhook] Bot token not configured")
      return NextResponse.json({ ok: true })
    }

    // Extract message data
    const message = body.message
    if (!message) {
      return NextResponse.json({ ok: true })
    }

    const chatId = message.chat.id
    const text = message.text || ""
    const firstName = message.from?.first_name || "Usuario"

    console.log(`[Telegram] Received message from ${chatId}: ${text}`)

    // Handle /start command - Return the Chat ID
    if (text === "/start" || text.startsWith("/start")) {
      const welcomeMessage = `
👋 ¡Hola ${firstName}!

🆔 <b>Tu Chat ID es:</b>
<code>${chatId}</code>

📋 <b>¿Cómo usarlo?</b>
1. Copiá el número de arriba (tocá para copiar)
2. Andá a Atlas ONE → Configuración → Integraciones
3. Pegalo en el campo "Chat ID de Telegram"
4. ¡Listo! Vas a recibir notificaciones de ventas

🤖 <b>Comandos disponibles:</b>
/ventas - Ver ventas del día
/stock - Ver productos con stock bajo
/ayuda - Más información

💡 Una vez configurado, te llegará un mensaje cada vez que hagas una venta.
      `.trim()

      await sendTelegramMessage(botToken, chatId, welcomeMessage)
      return NextResponse.json({ ok: true })
    }

    // Handle /ventas command
    if (text === "/ventas") {
      // Try to find kiosko linked to this chat ID
      const supabase = await createServerClient()
      
      const { data: config } = await supabase
        .from("notification_configs")
        .select("kiosko_id")
        .eq("telegram_chat_id", chatId.toString())
        .maybeSingle()

      if (!config) {
        await sendTelegramMessage(botToken, chatId, 
          `⚠️ No encontré un kiosco vinculado a este chat.\n\nAsegurate de configurar tu Chat ID (${chatId}) en Atlas ONE → Configuración → Integraciones.`
        )
        return NextResponse.json({ ok: true })
      }

      // Get today's sales
      const today = new Date().toISOString().split('T')[0]
      const { data: sales } = await supabase
        .from("sales")
        .select("total_amount, created_at")
        .eq("kiosko_id", config.kiosko_id)
        .eq("status", "completed")
        .gte("created_at", `${today}T00:00:00`)
        .lte("created_at", `${today}T23:59:59`)

      if (!sales || sales.length === 0) {
        await sendTelegramMessage(botToken, chatId, "📊 No hay ventas registradas hoy.")
        return NextResponse.json({ ok: true })
      }

      const total = sales.reduce((sum, s) => sum + Number(s.total_amount), 0)
      const message = `
📊 <b>Ventas de Hoy</b>

🛒 Cantidad: <b>${sales.length} ventas</b>
💰 Total: <b>$${total.toLocaleString("es-AR")}</b>
📈 Promedio: $${Math.round(total / sales.length).toLocaleString("es-AR")}

🕐 Actualizado: ${new Date().toLocaleTimeString("es-AR")}
      `.trim()

      await sendTelegramMessage(botToken, chatId, message)
      return NextResponse.json({ ok: true })
    }

    // Handle /stock command
    if (text === "/stock") {
      const supabase = await createServerClient()
      
      const { data: config } = await supabase
        .from("notification_configs")
        .select("kiosko_id")
        .eq("telegram_chat_id", chatId.toString())
        .maybeSingle()

      if (!config) {
        await sendTelegramMessage(botToken, chatId, 
          `⚠️ No encontré un kiosco vinculado.\n\nConfigurá tu Chat ID (${chatId}) en Atlas ONE.`
        )
        return NextResponse.json({ ok: true })
      }

      // Get low stock products
      const { data: products } = await supabase
        .from("products")
        .select("name, stock_quantity, min_stock_level")
        .eq("kiosko_id", config.kiosko_id)
        .eq("is_active", true)
        .order("stock_quantity", { ascending: true })
        .limit(10)

      const lowStock = products?.filter(p => p.stock_quantity <= (p.min_stock_level || 5)) || []

      if (lowStock.length === 0) {
        await sendTelegramMessage(botToken, chatId, "✅ ¡No hay productos con stock bajo!")
        return NextResponse.json({ ok: true })
      }

      const productList = lowStock
        .map(p => `• ${p.name}: <b>${p.stock_quantity}</b> unid.`)
        .join("\n")

      const message = `
⚠️ <b>Productos con Stock Bajo</b>

${productList}

💡 Tip: Hacé un pedido a proveedores desde la app.
      `.trim()

      await sendTelegramMessage(botToken, chatId, message)
      return NextResponse.json({ ok: true })
    }

    // Handle /ayuda or /help command
    if (text === "/ayuda" || text === "/help") {
      const helpMessage = `
🤖 <b>Atlas ONE Bot - Ayuda</b>

<b>Comandos disponibles:</b>

/start - Ver tu Chat ID para configurar
/ventas - Resumen de ventas del día
/stock - Ver productos con stock bajo
/ayuda - Este mensaje de ayuda

<b>Notificaciones automáticas:</b>
• 🛒 Cada venta que hagas
• ⚠️ Alertas de stock bajo
• 📊 Resumen diario (pronto)

<b>¿Problemas?</b>
Contactanos en soporte@atlasone.com
      `.trim()

      await sendTelegramMessage(botToken, chatId, helpMessage)
      return NextResponse.json({ ok: true })
    }

    // Default response for unknown commands
    if (text.startsWith("/")) {
      await sendTelegramMessage(botToken, chatId, 
        `❓ Comando no reconocido.\n\nUsá /ayuda para ver los comandos disponibles.`
      )
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error("[Telegram Webhook] Error:", error)
    // Always return 200 to Telegram to avoid retries
    return NextResponse.json({ ok: true })
  }
}

async function sendTelegramMessage(botToken: string, chatId: number, text: string) {
  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: "HTML",
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error("[Telegram] Send message error:", error)
    }
  } catch (error) {
    console.error("[Telegram] Send error:", error)
  }
}

// GET endpoint for webhook verification
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    status: "Atlas ONE Telegram Bot Webhook",
    info: "This endpoint receives Telegram bot updates",
    setup: "Use Telegram API to set webhook to this URL"
  })
}
