import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

// Telegram Bot Webhook Handler - Following official Telegram Bot API best practices
// https://core.telegram.org/bots/tutorial
// Uses admin client to bypass RLS since webhook requests come from Telegram (no user session)

const COMMANDS = {
  START: "/start",
  KIOSCOS: "/kioscos",
  VENTAS: "/ventas",
  MES: "/mes",
  STOCK: "/stock",
  AYUDA: "/ayuda",
  HELP: "/help",
} as const

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const botToken = process.env.TELEGRAM_BOT_TOKEN

    if (!botToken) {
      return NextResponse.json({ ok: true })
    }

    // Handle both message and callback_query updates
    const message = body.message || body.edited_message
    const callbackQuery = body.callback_query

    // Handle callback queries (inline button presses)
    if (callbackQuery) {
      await handleCallbackQuery(botToken, callbackQuery)
      return NextResponse.json({ ok: true })
    }

    if (!message) {
      return NextResponse.json({ ok: true })
    }

    const chatId = message.chat.id
    const text = (message.text || "").trim()
    const firstName = message.from?.first_name || "Usuario"

    // Ignore non-command messages in groups (only respond to commands)
    if (message.chat.type !== "private" && !text.startsWith("/")) {
      return NextResponse.json({ ok: true })
    }

    // Use admin client to bypass RLS - webhook has no user session
    const supabase = createAdminClient()

    // Find owner by telegram_chat_id in profiles
    let ownerId: string | null = null
    let ownerKioscos: { id: string; name: string }[] = []

    const { data: ownerProfile } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("telegram_chat_id", chatId.toString())
      .maybeSingle()

    if (ownerProfile) {
      ownerId = ownerProfile.id
      const { data: allKioscos } = await supabase.from("kioscos").select("id, name, owner_id").eq("owner_id", ownerId)

      ownerKioscos = allKioscos || []
    } else {
      // Fallback: Search by notification_configs
      const { data: configs } = await supabase
        .from("notification_configs")
        .select("kiosko_id, kioscos(id, name, owner_id)")
        .eq("telegram_chat_id", chatId.toString())

      if (configs && configs.length > 0) {
        const firstConfig = configs[0]
        const kioscoData = firstConfig.kioscos as any
        ownerId = kioscoData?.owner_id

        if (ownerId) {
          const { data: allKioscos } = await supabase
            .from("kioscos")
            .select("id, name, owner_id")
            .eq("owner_id", ownerId)

          ownerKioscos = allKioscos || []
        }
      }
    }

    // Extract command and arguments
    const [command, ...args] = text.split(" ")
    const argument = args.join(" ").trim()

    // Route commands
    switch (
      command.toLowerCase().split("@")[0] // Remove @botname suffix
    ) {
      case COMMANDS.START:
        await handleStart(botToken, chatId, firstName, ownerKioscos)
        break

      case COMMANDS.KIOSCOS:
        await handleKioscos(botToken, chatId, ownerKioscos)
        break

      case COMMANDS.VENTAS:
        await handleVentas(botToken, chatId, ownerKioscos, argument, supabase)
        break

      case COMMANDS.MES:
        await handleMes(botToken, chatId, ownerKioscos, argument, supabase)
        break

      case COMMANDS.STOCK:
        await handleStock(botToken, chatId, ownerKioscos, argument, supabase)
        break

      case COMMANDS.AYUDA:
      case COMMANDS.HELP:
        await handleAyuda(botToken, chatId, ownerKioscos)
        break

      default:
        if (text.startsWith("/")) {
          await sendMessage(botToken, chatId, `Comando no reconocido.\n\nUsa /ayuda para ver los comandos disponibles.`)
        }
        break
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true })
  }
}

// Command Handlers

async function handleStart(
  botToken: string,
  chatId: number,
  firstName: string,
  ownerKioscos: { id: string; name: string }[],
) {
  const isLinked = ownerKioscos.length > 0

  const message = `
<b>Hola ${firstName}!</b>

<b>Tu Chat ID es:</b>
<code>${chatId}</code>

${isLinked ? `<b>Kioscos vinculados:</b> ${ownerKioscos.length}` : `<b>Estado:</b> No vinculado`}

<b>Como configurarlo:</b>
1. Copia el numero de arriba (toca para copiar)
2. Anda a Atlas ONE - Configuracion - Notificaciones
3. Pegalo en el campo "Chat ID de Telegram"
4. Presiona "Probar Telegram"
5. Guarda los cambios
6. Listo! Vas a recibir notificaciones

<b>Comandos disponibles:</b>
/kioscos - Ver tus kioscos
/ventas - Ver ventas del dia
/ventas [nombre] - Ver ventas de un kiosco
/mes - Resumen del mes
/stock - Ver productos con stock bajo
/ayuda - Mas informacion
  `.trim()

  const keyboard = isLinked
    ? {
        inline_keyboard: [
          [
            { text: "Ver Ventas de Hoy", callback_data: "ventas_hoy" },
            { text: "Ver Stock Bajo", callback_data: "stock_bajo" },
          ],
          [{ text: "Mis Kioscos", callback_data: "mis_kioscos" }],
        ],
      }
    : undefined

  await sendMessage(botToken, chatId, message, keyboard)
}

async function handleKioscos(botToken: string, chatId: number, ownerKioscos: { id: string; name: string }[]) {
  if (ownerKioscos.length === 0) {
    await sendNotLinkedMessage(botToken, chatId)
    return
  }

  const kioscoList = ownerKioscos.map((k, i) => `${i + 1}. <b>${k.name}</b>`).join("\n")

  const message = `
<b>Tus Kioscos</b>

${kioscoList}

<b>Tip:</b> Usa los comandos con el nombre del kiosco:
<code>/ventas ${ownerKioscos[0]?.name || "MiKiosco"}</code>
<code>/stock ${ownerKioscos[0]?.name || "MiKiosco"}</code>

O sin nombre para ver un resumen general.
  `.trim()

  await sendMessage(botToken, chatId, message)
}

async function handleVentas(
  botToken: string,
  chatId: number,
  ownerKioscos: { id: string; name: string }[],
  kioscoName: string,
  supabase: any,
) {
  if (ownerKioscos.length === 0) {
    await sendNotLinkedMessage(botToken, chatId)
    return
  }

  let targetKioscos = ownerKioscos
  if (kioscoName) {
    targetKioscos = ownerKioscos.filter((k) => k.name.toLowerCase().includes(kioscoName.toLowerCase()))
    if (targetKioscos.length === 0) {
      await sendMessage(botToken, chatId, `No encontre un kiosco con ese nombre.\n\nUsa /kioscos para ver la lista.`)
      return
    }
  }

  const kioskoIds = targetKioscos.map((k) => k.id)
  const today = new Date().toISOString().split("T")[0]

  const { data: sales } = await supabase
    .from("sales")
    .select("kiosko_id, total_amount, created_at")
    .in("kiosko_id", kioskoIds)
    .gte("created_at", `${today}T00:00:00`)
    .lte("created_at", `${today}T23:59:59`)

  if (!sales || sales.length === 0) {
    const scope = kioscoName ? `en ${targetKioscos[0]?.name}` : "en tus kioscos"
    await sendMessage(botToken, chatId, `No hay ventas registradas hoy ${scope}.`)
    return
  }

  const salesByKiosco = new Map<string, { count: number; total: number }>()
  sales.forEach((s: any) => {
    const existing = salesByKiosco.get(s.kiosko_id) || { count: 0, total: 0 }
    salesByKiosco.set(s.kiosko_id, {
      count: existing.count + 1,
      total: existing.total + Number(s.total_amount),
    })
  })

  let message = `<b>Ventas de Hoy</b>\n\n`
  let grandTotal = 0
  let grandCount = 0

  salesByKiosco.forEach((data, kId) => {
    const kiosko = targetKioscos.find((k) => k.id === kId)
    if (kiosko) {
      message += `<b>${kiosko.name}</b>\n`
      message += `   ${data.count} ventas\n`
      message += `   $${data.total.toLocaleString("es-AR")}\n\n`
      grandTotal += data.total
      grandCount += data.count
    }
  })

  if (targetKioscos.length > 1) {
    message += `---------------\n`
    message += `<b>TOTAL:</b> ${grandCount} ventas - $${grandTotal.toLocaleString("es-AR")}`
  }

  message += `\n\n${new Date().toLocaleTimeString("es-AR")}`

  await sendMessage(botToken, chatId, message.trim())
}

async function handleMes(
  botToken: string,
  chatId: number,
  ownerKioscos: { id: string; name: string }[],
  kioscoName: string,
  supabase: any,
) {
  if (ownerKioscos.length === 0) {
    await sendNotLinkedMessage(botToken, chatId)
    return
  }

  let targetKioscos = ownerKioscos
  if (kioscoName) {
    targetKioscos = ownerKioscos.filter((k) => k.name.toLowerCase().includes(kioscoName.toLowerCase()))
    if (targetKioscos.length === 0) {
      await sendMessage(botToken, chatId, `No encontre un kiosco con ese nombre.\n\nUsa /kioscos para ver la lista.`)
      return
    }
  }

  const kioskoIds = targetKioscos.map((k) => k.id)

  // Get first day of current month
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0]

  const { data: sales } = await supabase
    .from("sales")
    .select("kiosko_id, total_amount, created_at")
    .in("kiosko_id", kioskoIds)
    .gte("created_at", `${firstDay}T00:00:00`)
    .lte("created_at", `${lastDay}T23:59:59`)

  if (!sales || sales.length === 0) {
    const scope = kioscoName ? `en ${targetKioscos[0]?.name}` : "en tus kioscos"
    await sendMessage(botToken, chatId, `No hay ventas registradas este mes ${scope}.`)
    return
  }

  const salesByKiosco = new Map<string, { count: number; total: number }>()
  sales.forEach((s: any) => {
    const existing = salesByKiosco.get(s.kiosko_id) || { count: 0, total: 0 }
    salesByKiosco.set(s.kiosko_id, {
      count: existing.count + 1,
      total: existing.total + Number(s.total_amount),
    })
  })

  const monthName = now.toLocaleDateString("es-AR", { month: "long" })
  let message = `<b>Resumen de ${monthName.charAt(0).toUpperCase() + monthName.slice(1)}</b>\n\n`
  let grandTotal = 0
  let grandCount = 0

  salesByKiosco.forEach((data, kId) => {
    const kiosko = targetKioscos.find((k) => k.id === kId)
    if (kiosko) {
      message += `<b>${kiosko.name}</b>\n`
      message += `   ${data.count} ventas\n`
      message += `   $${data.total.toLocaleString("es-AR")}\n\n`
      grandTotal += data.total
      grandCount += data.count
    }
  })

  if (targetKioscos.length > 1) {
    message += `---------------\n`
    message += `<b>TOTAL:</b> ${grandCount} ventas - $${grandTotal.toLocaleString("es-AR")}`
  }

  // Calculate daily average
  const daysElapsed = now.getDate()
  const dailyAvg = grandTotal / daysElapsed

  message += `\n\n<b>Promedio diario:</b> $${dailyAvg.toLocaleString("es-AR", { maximumFractionDigits: 0 })}`

  await sendMessage(botToken, chatId, message.trim())
}

async function handleStock(
  botToken: string,
  chatId: number,
  ownerKioscos: { id: string; name: string }[],
  kioscoName: string,
  supabase: any,
) {
  if (ownerKioscos.length === 0) {
    await sendNotLinkedMessage(botToken, chatId)
    return
  }

  let targetKioscos = ownerKioscos
  if (kioscoName) {
    targetKioscos = ownerKioscos.filter((k) => k.name.toLowerCase().includes(kioscoName.toLowerCase()))
    if (targetKioscos.length === 0) {
      await sendMessage(botToken, chatId, `No encontre un kiosco con ese nombre.\n\nUsa /kioscos para ver la lista.`)
      return
    }
  }

  const kioskoIds = targetKioscos.map((k) => k.id)

  const { data: products } = await supabase
    .from("products")
    .select("kiosko_id, name, stock_quantity, min_stock_level")
    .in("kiosko_id", kioskoIds)
    .order("stock_quantity", { ascending: true })
    .limit(20)

  const lowStock = products?.filter((p: any) => p.stock_quantity <= (p.min_stock_level || 10)) || []

  if (lowStock.length === 0) {
    const scope = kioscoName ? `en ${targetKioscos[0]?.name}` : ""
    await sendMessage(botToken, chatId, `No hay productos con stock bajo ${scope}!`)
    return
  }

  const stockByKiosco = new Map<string, { name: string; stock: number }[]>()
  lowStock.forEach((p: any) => {
    const existing = stockByKiosco.get(p.kiosko_id) || []
    existing.push({ name: p.name, stock: p.stock_quantity })
    stockByKiosco.set(p.kiosko_id, existing)
  })

  let message = `<b>Productos con Stock Bajo</b>\n\n`

  stockByKiosco.forEach((prods, kId) => {
    const kiosko = targetKioscos.find((k) => k.id === kId)
    if (kiosko) {
      message += `<b>${kiosko.name}</b>\n`
      prods.slice(0, 5).forEach((p) => {
        message += `   - ${p.name}: <b>${p.stock}</b> unid.\n`
      })
      if (prods.length > 5) {
        message += `   ... y ${prods.length - 5} mas\n`
      }
      message += `\n`
    }
  })

  message += `Hace un pedido a proveedores desde la app.`

  await sendMessage(botToken, chatId, message.trim())
}

async function handleAyuda(botToken: string, chatId: number, ownerKioscos: { id: string; name: string }[]) {
  const message = `
<b>Atlas ONE Bot - Ayuda</b>

<b>Vinculado a:</b> ${ownerKioscos.length} kiosco${ownerKioscos.length !== 1 ? "s" : ""}

<b>Comandos disponibles:</b>

/kioscos - Ver lista de tus kioscos
/ventas - Ventas de hoy (todos)
/ventas [nombre] - Ventas de un kiosco
/mes - Resumen del mes actual
/mes [nombre] - Resumen de un kiosco
/stock - Stock bajo (todos)
/stock [nombre] - Stock de un kiosco
/ayuda - Este mensaje

<b>Ejemplos:</b>
- <code>/ventas</code> - Resumen de todos
- <code>/ventas Centro</code> - Solo "Kiosco Centro"
- <code>/mes</code> - Ventas del mes
- <code>/stock Estacion</code> - Stock de "Kiosco Estacion"

<b>Notificaciones automaticas:</b>
- Cada venta que hagas
- Alertas de stock bajo

<b>Problemas?</b>
soporte@atlasone.app
  `.trim()

  await sendMessage(botToken, chatId, message)
}

async function handleCallbackQuery(botToken: string, query: any) {
  const chatId = query.message?.chat.id
  const data = query.data
  const queryId = query.id

  // Answer the callback to remove loading state
  await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callback_query_id: queryId }),
  })

  if (!chatId) return

  // Handle different callback data
  switch (data) {
    case "ventas_hoy":
      await sendMessage(botToken, chatId, "Usa /ventas para ver las ventas de hoy.")
      break
    case "stock_bajo":
      await sendMessage(botToken, chatId, "Usa /stock para ver productos con stock bajo.")
      break
    case "mis_kioscos":
      await sendMessage(botToken, chatId, "Usa /kioscos para ver tus kioscos.")
      break
  }
}

async function sendNotLinkedMessage(botToken: string, chatId: number) {
  await sendMessage(
    botToken,
    chatId,
    `No encontre ningun kiosco vinculado a este chat.\n\n<b>Tu Chat ID:</b> <code>${chatId}</code>\n\n<b>Pasos para vincular:</b>\n1. Abri Atlas ONE\n2. Anda a Configuracion - Notificaciones\n3. Pega el Chat ID\n4. Presiona "Probar Telegram"\n5. Guarda los cambios\n\nDespues de eso, usa /start para verificar.`,
  )
}

async function sendMessage(botToken: string, chatId: number, text: string, replyMarkup?: any) {
  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: "HTML",
        reply_markup: replyMarkup,
      }),
    })
  } catch {
    // Silent fail
  }
}

export async function GET() {
  return NextResponse.json({
    status: "Atlas ONE Telegram Bot Webhook",
    info: "This endpoint receives Telegram bot updates",
    commands: Object.values(COMMANDS),
  })
}
