import { type NextRequest, NextResponse } from "next/server"

// API para configurar el webhook de Telegram
// POST: Configura el webhook
// GET: Verifica el estado del webhook

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

export async function POST(request: NextRequest) {
  try {
    if (!BOT_TOKEN) {
      return NextResponse.json(
        { error: "TELEGRAM_BOT_TOKEN no está configurado en las variables de entorno" },
        { status: 500 }
      )
    }

    // Get the webhook URL from the request or use the default
    const body = await request.json().catch(() => ({}))
    const webhookUrl = body.webhookUrl || `${process.env.NEXT_PUBLIC_APP_URL || 'https://v0-atlas-one-erp-demo.vercel.app'}/api/telegram/webhook`

    // Set the webhook
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ["message", "callback_query"],
        drop_pending_updates: true,
      }),
    })

    const result = await response.json()

    if (result.ok) {
      return NextResponse.json({
        success: true,
        message: "Webhook configurado correctamente",
        webhookUrl,
        telegramResponse: result,
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.description || "Error al configurar webhook",
        telegramResponse: result,
      }, { status: 400 })
    }
  } catch (error: any) {
    console.error("[Telegram Setup] Error:", error)
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!BOT_TOKEN) {
      return NextResponse.json({
        configured: false,
        error: "TELEGRAM_BOT_TOKEN no está configurado",
        help: "Agregá TELEGRAM_BOT_TOKEN en las variables de entorno de Vercel",
      })
    }

    // Get webhook info
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`)
    const webhookInfo = await response.json()

    // Get bot info
    const botResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getMe`)
    const botInfo = await botResponse.json()

    return NextResponse.json({
      configured: true,
      botToken: BOT_TOKEN ? "✓ Configurado" : "✗ No configurado",
      bot: botInfo.ok ? {
        username: botInfo.result.username,
        firstName: botInfo.result.first_name,
        canJoinGroups: botInfo.result.can_join_groups,
      } : null,
      webhook: webhookInfo.ok ? {
        url: webhookInfo.result.url || "No configurado",
        hasCustomCertificate: webhookInfo.result.has_custom_certificate,
        pendingUpdateCount: webhookInfo.result.pending_update_count,
        lastErrorDate: webhookInfo.result.last_error_date 
          ? new Date(webhookInfo.result.last_error_date * 1000).toISOString()
          : null,
        lastErrorMessage: webhookInfo.result.last_error_message || null,
      } : null,
      telegramResponse: webhookInfo,
    })
  } catch (error: any) {
    console.error("[Telegram Setup] Error getting info:", error)
    return NextResponse.json(
      { error: error.message || "Error al obtener información" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!BOT_TOKEN) {
      return NextResponse.json(
        { error: "TELEGRAM_BOT_TOKEN no está configurado" },
        { status: 500 }
      )
    }

    // Delete the webhook
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/deleteWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ drop_pending_updates: true }),
    })

    const result = await response.json()

    return NextResponse.json({
      success: result.ok,
      message: result.ok ? "Webhook eliminado" : "Error al eliminar webhook",
      telegramResponse: result,
    })
  } catch (error: any) {
    console.error("[Telegram Setup] Error deleting webhook:", error)
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    )
  }
}
