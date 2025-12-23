import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

// Telegram Bot Webhook Handler
// Este endpoint recibe los mensajes de Telegram y responde automáticamente
// Vinculado al DUEÑO de los kioscos, no a un kiosco específico

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

    console.log(`[v0][Telegram] Received message from chatId ${chatId}: ${text}`)

    const supabase = await createServerClient()

    // PRIMERO: Buscar owner por telegram_chat_id en profiles (método preferido)
    let ownerId: string | null = null
    let ownerKioscos: { id: string; name: string }[] = []

    console.log(`[v0][Telegram] Searching for owner with telegram_chat_id: ${chatId}`)

    const { data: ownerProfile, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("telegram_chat_id", chatId.toString())
      .maybeSingle()

    console.log(`[v0][Telegram] Profile search result:`, ownerProfile, profileError)

    if (ownerProfile) {
      ownerId = ownerProfile.id
      console.log(`[v0][Telegram] Found owner by profile: ${ownerId} (${ownerProfile.full_name})`)

      // Try to find kioscos by owner_id
      const { data: allKioscos, error: kioscosError } = await supabase
        .from("kioscos")
        .select("id, name, owner_id")
        .eq("owner_id", ownerId)

      console.log(`[v0][Telegram] Kioscos query result for owner ${ownerId}:`, allKioscos, kioscosError)

      ownerKioscos = allKioscos || []
      console.log(`[v0][Telegram] Found ${ownerKioscos.length} kioscos for owner ${ownerId}`)
    } else {
      // FALLBACK: Buscar por notification_configs (legacy)
      console.log(`[v0][Telegram] No profile found, trying notification_configs...`)
      const { data: configs, error: configsError } = await supabase
        .from("notification_configs")
        .select("kiosko_id, kioscos(id, name, owner_id)")
        .eq("telegram_chat_id", chatId.toString())

      console.log(`[v0][Telegram] Notification configs result:`, configs, configsError)

      if (configs && configs.length > 0) {
        const firstConfig = configs[0]
        const kioscoData = firstConfig.kioscos as any
        ownerId = kioscoData?.owner_id
        console.log(`[v0][Telegram] Found owner by notification_config: ${ownerId}`)

        if (ownerId) {
          const { data: allKioscos } = await supabase
            .from("kioscos")
            .select("id, name, owner_id")
            .eq("owner_id", ownerId)

          ownerKioscos = allKioscos || []
          console.log(`[v0][Telegram] Found ${ownerKioscos.length} kioscos via notification_config`)
        }
      }
    }

    // Handle /start command - Return the Chat ID (siempre funciona)
    if (text === "/start" || text.startsWith("/start")) {
      const welcomeMessage = `
👋 ¡Hola ${firstName}!

🆔 <b>Tu Chat ID es:</b>
<code>${chatId}</code>

📋 <b>¿Cómo configurarlo?</b>
1. Copiá el número de arriba (tocá para copiar)
2. Andá a Atlas ONE → Configuración → Integraciones
3. Pegalo en el campo "Chat ID de Telegram"
4. Presioná "Probar Telegram"
5. Guardá los cambios
6. ¡Listo! Vas a recibir notificaciones

🤖 <b>Comandos disponibles:</b>
/kioscos - Ver tus kioscos
/ventas - Ver ventas del día
/ventas [nombre] - Ver ventas de un kiosco
/stock - Ver productos con stock bajo
/ayuda - Más información

${ownerKioscos.length > 0 ? `✅ Ya tenés ${ownerKioscos.length} kiosco(s) vinculados.` : "⏳ Aún no estás vinculado. Configurá tu Chat ID en la app."}
      `.trim()

      await sendTelegramMessage(botToken, chatId, welcomeMessage)
      return NextResponse.json({ ok: true })
    }

    // Check if user is linked
    if (ownerKioscos.length === 0) {
      await sendTelegramMessage(
        botToken,
        chatId,
        `⚠️ No encontré ningún kiosco vinculado a este chat.\n\n<b>Tu Chat ID:</b> <code>${chatId}</code>\n\n<b>Pasos para vincular:</b>\n1. Abrí Atlas ONE\n2. Andá a Configuración → Integraciones\n3. Pegá el Chat ID\n4. Presioná "Probar Telegram"\n5. Guardá los cambios\n\nDespués de eso, usá /start para verificar.`,
      )
      return NextResponse.json({ ok: true })
    }

    // Handle /kioscos command - list all owner's kioscos
    if (text === "/kioscos") {
      const kioscoList = ownerKioscos.map((k, i) => `${i + 1}. <b>${k.name}</b>`).join("\n")

      const message = `
🏪 <b>Tus Kioscos</b>

${kioscoList}

💡 Usá los comandos con el nombre del kiosco:
• <code>/ventas ${ownerKioscos[0]?.name || "MiKiosco"}</code>
• <code>/stock ${ownerKioscos[0]?.name || "MiKiosco"}</code>

O sin nombre para ver un resumen general.
      `.trim()

      await sendTelegramMessage(botToken, chatId, message)
      return NextResponse.json({ ok: true })
    }

    // Handle /ventas command (with optional kiosco name)
    if (text.startsWith("/ventas")) {
      const kioscoName = text.replace("/ventas", "").trim()

      // Filter kioscos by name if provided
      let targetKioscos = ownerKioscos
      if (kioscoName) {
        targetKioscos = ownerKioscos.filter((k) => k.name.toLowerCase().includes(kioscoName.toLowerCase()))
        if (targetKioscos.length === 0) {
          await sendTelegramMessage(
            botToken,
            chatId,
            `❌ No encontré un kiosco con ese nombre.\n\nUsá /kioscos para ver la lista.`,
          )
          return NextResponse.json({ ok: true })
        }
      }

      const kioskoIds = targetKioscos.map((k) => k.id)

      // Get today's sales
      const today = new Date().toISOString().split("T")[0]
      const { data: sales } = await supabase
        .from("sales")
        .select("kiosko_id, total_amount, created_at")
        .in("kiosko_id", kioskoIds)
        .gte("created_at", `${today}T00:00:00`)
        .lte("created_at", `${today}T23:59:59`)

      if (!sales || sales.length === 0) {
        const scope = kioscoName ? `en ${targetKioscos[0]?.name}` : "en tus kioscos"
        await sendTelegramMessage(botToken, chatId, `📊 No hay ventas registradas hoy ${scope}.`)
        return NextResponse.json({ ok: true })
      }

      // Group by kiosco
      const salesByKiosco = new Map<string, { count: number; total: number }>()
      sales.forEach((s) => {
        const existing = salesByKiosco.get(s.kiosko_id) || { count: 0, total: 0 }
        salesByKiosco.set(s.kiosko_id, {
          count: existing.count + 1,
          total: existing.total + Number(s.total_amount),
        })
      })

      let message = `📊 <b>Ventas de Hoy</b>\n\n`
      let grandTotal = 0
      let grandCount = 0

      salesByKiosco.forEach((data, kId) => {
        const kiosko = targetKioscos.find((k) => k.id === kId)
        if (kiosko) {
          message += `🏪 <b>${kiosko.name}</b>\n`
          message += `   🛒 ${data.count} ventas\n`
          message += `   💰 $${data.total.toLocaleString("es-AR")}\n\n`
          grandTotal += data.total
          grandCount += data.count
        }
      })

      if (targetKioscos.length > 1) {
        message += `━━━━━━━━━━━━━━━\n`
        message += `📈 <b>TOTAL:</b> ${grandCount} ventas - $${grandTotal.toLocaleString("es-AR")}`
      }

      message += `\n\n🕐 ${new Date().toLocaleTimeString("es-AR")}`

      await sendTelegramMessage(botToken, chatId, message.trim())
      return NextResponse.json({ ok: true })
    }

    // Handle /stock command (with optional kiosco name)
    if (text.startsWith("/stock")) {
      const kioscoName = text.replace("/stock", "").trim()

      let targetKioscos = ownerKioscos
      if (kioscoName) {
        targetKioscos = ownerKioscos.filter((k) => k.name.toLowerCase().includes(kioscoName.toLowerCase()))
        if (targetKioscos.length === 0) {
          await sendTelegramMessage(
            botToken,
            chatId,
            `❌ No encontré un kiosco con ese nombre.\n\nUsá /kioscos para ver la lista.`,
          )
          return NextResponse.json({ ok: true })
        }
      }

      const kioskoIds = targetKioscos.map((k) => k.id)

      // Get low stock products
      const { data: products } = await supabase
        .from("products")
        .select("kiosko_id, name, stock_quantity, min_stock_level")
        .in("kiosko_id", kioskoIds)
        .order("stock_quantity", { ascending: true })
        .limit(20)

      const lowStock = products?.filter((p) => p.stock_quantity <= (p.min_stock_level || 10)) || []

      if (lowStock.length === 0) {
        const scope = kioscoName ? `en ${targetKioscos[0]?.name}` : ""
        await sendTelegramMessage(botToken, chatId, `✅ ¡No hay productos con stock bajo ${scope}!`)
        return NextResponse.json({ ok: true })
      }

      // Group by kiosco
      const stockByKiosco = new Map<string, { name: string; stock: number }[]>()
      lowStock.forEach((p) => {
        const existing = stockByKiosco.get(p.kiosko_id) || []
        existing.push({ name: p.name, stock: p.stock_quantity })
        stockByKiosco.set(p.kiosko_id, existing)
      })

      let message = `⚠️ <b>Productos con Stock Bajo</b>\n\n`

      stockByKiosco.forEach((prods, kId) => {
        const kiosko = targetKioscos.find((k) => k.id === kId)
        if (kiosko) {
          message += `🏪 <b>${kiosko.name}</b>\n`
          prods.slice(0, 5).forEach((p) => {
            message += `   • ${p.name}: <b>${p.stock}</b> unid.\n`
          })
          if (prods.length > 5) {
            message += `   ... y ${prods.length - 5} más\n`
          }
          message += `\n`
        }
      })

      message += `💡 Hacé un pedido a proveedores desde la app.`

      await sendTelegramMessage(botToken, chatId, message.trim())
      return NextResponse.json({ ok: true })
    }

    // Handle /ayuda or /help command
    if (text === "/ayuda" || text === "/help") {
      const helpMessage = `
🤖 <b>Atlas ONE Bot - Ayuda</b>

📱 <b>Vinculado a:</b> ${ownerKioscos.length} kiosco${ownerKioscos.length > 1 ? "s" : ""}

<b>Comandos disponibles:</b>

/kioscos - Ver lista de tus kioscos
/ventas - Ventas de hoy (todos)
/ventas [nombre] - Ventas de un kiosco
/stock - Stock bajo (todos)
/stock [nombre] - Stock de un kiosco
/ayuda - Este mensaje

<b>Ejemplos:</b>
• <code>/ventas</code> → Resumen de todos
• <code>/ventas Centro</code> → Solo "Kiosco Centro"
• <code>/stock Estación</code> → Stock de "Kiosco Estación"

<b>Notificaciones automáticas:</b>
• 🛒 Cada venta que hagas
• ⚠️ Alertas de stock bajo

<b>¿Problemas?</b>
Contactanos en soporte@atlasone.com
      `.trim()

      await sendTelegramMessage(botToken, chatId, helpMessage)
      return NextResponse.json({ ok: true })
    }

    // Default response for unknown commands
    if (text.startsWith("/")) {
      await sendTelegramMessage(
        botToken,
        chatId,
        `❓ Comando no reconocido.\n\nUsá /ayuda para ver los comandos disponibles.`,
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
    setup: "Use Telegram API to set webhook to this URL",
  })
}
