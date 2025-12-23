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
  // Notification preference commands
  CONFIG: "/config",
  SILENCIAR: "/silenciar",
  ACTIVAR: "/activar",
  RESUMEN: "/resumen",
  UMBRAL: "/umbral",
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

      case COMMANDS.CONFIG:
        await handleConfig(botToken, chatId, ownerId, supabase)
        break

      case COMMANDS.SILENCIAR:
        await handleSilenciar(botToken, chatId, ownerId, argument, supabase)
        break

      case COMMANDS.ACTIVAR:
        await handleActivar(botToken, chatId, ownerId, supabase)
        break

      case COMMANDS.RESUMEN:
        await handleResumen(botToken, chatId, ownerId, argument, supabase)
        break

      case COMMANDS.UMBRAL:
        await handleUmbral(botToken, chatId, ownerId, argument, supabase)
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

<b>📊 Consultas:</b>
/kioscos - Ver lista de tus kioscos
/ventas [nombre] - Ventas de hoy
/mes [nombre] - Resumen del mes
/stock [nombre] - Stock bajo

<b>🔔 Notificaciones:</b>
/config - Ver y cambiar preferencias
/silenciar [horas] - Silenciar (ej: 2)
/activar - Reactivar notificaciones
/resumen on|off - Resumen diario
/umbral [monto] - Solo ventas > monto

<b>Ejemplos:</b>
<code>/ventas Centro</code> - Ventas de "Kiosco Centro"
<code>/silenciar 4</code> - Silenciar 4 horas
<code>/umbral 5000</code> - Solo ventas > $5000

<b>Notificaciones automaticas:</b>
✅ Cada venta
✅ Alertas de stock bajo
📊 Resumen diario (opcional)

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

  // Get owner for config callbacks
  const supabase = createAdminClient()
  let ownerId: string | null = null

  const { data: ownerProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("telegram_chat_id", chatId.toString())
    .maybeSingle()

  if (ownerProfile) {
    ownerId = ownerProfile.id
  }

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

    // Config callbacks
    case "config_mute_1h":
      if (ownerId) {
        const mutedUntil = new Date(Date.now() + 1 * 60 * 60 * 1000)
        await supabase.from("notification_preferences").upsert({
          profile_id: ownerId,
          kiosko_id: null,
          is_muted: true,
          muted_until: mutedUntil.toISOString(),
        }, { onConflict: "profile_id,kiosko_id" })
        await sendMessage(botToken, chatId, `🔇 Silenciado por 1 hora.\nUsa /activar para reactivar.`)
      }
      break

    case "config_mute_8h":
      if (ownerId) {
        const mutedUntil = new Date(Date.now() + 8 * 60 * 60 * 1000)
        await supabase.from("notification_preferences").upsert({
          profile_id: ownerId,
          kiosko_id: null,
          is_muted: true,
          muted_until: mutedUntil.toISOString(),
        }, { onConflict: "profile_id,kiosko_id" })
        await sendMessage(botToken, chatId, `🔇 Silenciado por 8 horas.\nUsa /activar para reactivar.`)
      }
      break

    case "config_unmute":
      if (ownerId) {
        await supabase.from("notification_preferences").upsert({
          profile_id: ownerId,
          kiosko_id: null,
          is_muted: false,
          muted_until: null,
        }, { onConflict: "profile_id,kiosko_id" })
        await sendMessage(botToken, chatId, `🔔 Notificaciones activadas.`)
      }
      break

    case "config_toggle_summary":
      if (ownerId) {
        const { data: currentPrefs } = await supabase
          .from("notification_preferences")
          .select("notify_daily_summary")
          .eq("profile_id", ownerId)
          .is("kiosko_id", null)
          .maybeSingle()

        const newValue = !(currentPrefs?.notify_daily_summary ?? false)
        await supabase.from("notification_preferences").upsert({
          profile_id: ownerId,
          kiosko_id: null,
          notify_daily_summary: newValue,
        }, { onConflict: "profile_id,kiosko_id" })

        if (newValue) {
          await sendMessage(botToken, chatId, `📊 Resumen diario <b>activado</b>.\nRecibiras un resumen a las 20:00hs.`)
        } else {
          await sendMessage(botToken, chatId, `📊 Resumen diario <b>desactivado</b>.`)
        }
      }
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

// ============================================================================
// Notification Preference Commands
// ============================================================================

async function handleConfig(botToken: string, chatId: number, ownerId: string | null, supabase: any) {
  if (!ownerId) {
    await sendNotLinkedMessage(botToken, chatId)
    return
  }

  // Get current preferences
  const { data: prefs } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("profile_id", ownerId)
    .is("kiosko_id", null)
    .maybeSingle()

  const notifySales = prefs?.notify_sales ?? true
  const notifyLowStock = prefs?.notify_low_stock ?? true
  const notifyDailySummary = prefs?.notify_daily_summary ?? false
  const minSaleAmount = prefs?.min_sale_amount ?? 0
  const isMuted = prefs?.is_muted ?? false
  const summaryTime = prefs?.summary_time ?? "20:00"

  const message = `
<b>Configuracion de Notificaciones</b>

<b>Estado:</b> ${isMuted ? "🔇 Silenciado" : "🔔 Activo"}

<b>Notificaciones activas:</b>
${notifySales ? "✅" : "❌"} Ventas ${minSaleAmount > 0 ? `(> $${minSaleAmount})` : "(todas)"}
${notifyLowStock ? "✅" : "❌"} Stock bajo
${notifyDailySummary ? "✅" : "❌"} Resumen diario ${notifyDailySummary ? `(${summaryTime}hs)` : ""}

<b>Comandos disponibles:</b>
/silenciar [horas] - Silenciar (ej: /silenciar 2)
/activar - Reactivar notificaciones
/resumen on|off - Resumen diario
/umbral [monto] - Solo ventas > monto

<b>Ejemplos:</b>
<code>/silenciar 4</code> - Silenciar 4 horas
<code>/umbral 5000</code> - Solo ventas > $5000
<code>/umbral 0</code> - Todas las ventas
<code>/resumen on</code> - Activar resumen diario
  `.trim()

  const keyboard = {
    inline_keyboard: [
      [
        { text: isMuted ? "🔔 Activar" : "🔇 Silenciar 1h", callback_data: isMuted ? "config_unmute" : "config_mute_1h" },
        { text: "🔇 Silenciar 8h", callback_data: "config_mute_8h" },
      ],
      [
        { text: notifyDailySummary ? "📊 Desactivar Resumen" : "📊 Activar Resumen", callback_data: "config_toggle_summary" },
      ],
    ],
  }

  await sendMessage(botToken, chatId, message, keyboard)
}

async function handleSilenciar(botToken: string, chatId: number, ownerId: string | null, hours: string, supabase: any) {
  if (!ownerId) {
    await sendNotLinkedMessage(botToken, chatId)
    return
  }

  const hoursNum = parseInt(hours) || 1
  const mutedUntil = new Date(Date.now() + hoursNum * 60 * 60 * 1000)

  // Upsert preference
  await supabase
    .from("notification_preferences")
    .upsert({
      profile_id: ownerId,
      kiosko_id: null,
      is_muted: true,
      muted_until: mutedUntil.toISOString(),
    }, {
      onConflict: "profile_id,kiosko_id",
    })

  await sendMessage(
    botToken,
    chatId,
    `🔇 <b>Notificaciones silenciadas</b>\n\nNo recibiras notificaciones hasta las ${mutedUntil.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}.\n\nUsa /activar para reactivar antes.`
  )
}

async function handleActivar(botToken: string, chatId: number, ownerId: string | null, supabase: any) {
  if (!ownerId) {
    await sendNotLinkedMessage(botToken, chatId)
    return
  }

  await supabase
    .from("notification_preferences")
    .upsert({
      profile_id: ownerId,
      kiosko_id: null,
      is_muted: false,
      muted_until: null,
    }, {
      onConflict: "profile_id,kiosko_id",
    })

  await sendMessage(botToken, chatId, `🔔 <b>Notificaciones activadas</b>\n\nVolveras a recibir todas las notificaciones.`)
}

async function handleResumen(botToken: string, chatId: number, ownerId: string | null, onOff: string, supabase: any) {
  if (!ownerId) {
    await sendNotLinkedMessage(botToken, chatId)
    return
  }

  const enable = onOff.toLowerCase() === "on" || onOff.toLowerCase() === "si" || onOff === "1"
  const disable = onOff.toLowerCase() === "off" || onOff.toLowerCase() === "no" || onOff === "0"

  if (!enable && !disable) {
    await sendMessage(botToken, chatId, `Uso: <code>/resumen on</code> o <code>/resumen off</code>`)
    return
  }

  await supabase
    .from("notification_preferences")
    .upsert({
      profile_id: ownerId,
      kiosko_id: null,
      notify_daily_summary: enable,
    }, {
      onConflict: "profile_id,kiosko_id",
    })

  if (enable) {
    await sendMessage(botToken, chatId, `📊 <b>Resumen diario activado</b>\n\nRecibiras un resumen de ventas todos los dias a las 20:00hs.`)
  } else {
    await sendMessage(botToken, chatId, `📊 <b>Resumen diario desactivado</b>\n\nYa no recibiras el resumen diario.`)
  }
}

async function handleUmbral(botToken: string, chatId: number, ownerId: string | null, amount: string, supabase: any) {
  if (!ownerId) {
    await sendNotLinkedMessage(botToken, chatId)
    return
  }

  const amountNum = parseFloat(amount.replace(/[^0-9.]/g, "")) || 0

  await supabase
    .from("notification_preferences")
    .upsert({
      profile_id: ownerId,
      kiosko_id: null,
      min_sale_amount: amountNum,
      notify_large_sales: amountNum > 0,
    }, {
      onConflict: "profile_id,kiosko_id",
    })

  if (amountNum > 0) {
    await sendMessage(
      botToken,
      chatId,
      `💰 <b>Umbral configurado</b>\n\nSolo recibiras notificaciones de ventas mayores a $${amountNum.toLocaleString("es-AR")}.\n\nUsa <code>/umbral 0</code> para recibir todas.`
    )
  } else {
    await sendMessage(botToken, chatId, `💰 <b>Umbral eliminado</b>\n\nRecibiras notificaciones de todas las ventas.`)
  }
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
