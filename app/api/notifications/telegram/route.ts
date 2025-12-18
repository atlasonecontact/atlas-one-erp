import { type NextRequest, NextResponse } from "next/server"

// Para usar Telegram Bot necesitas:
// 1. Crear un bot con @BotFather en Telegram
// 2. Obtener el Bot Token
// 3. Agregar la env var: TELEGRAM_BOT_TOKEN

export async function POST(request: NextRequest) {
  try {
    const { chatId, message } = await request.json()

    const botToken = process.env.TELEGRAM_BOT_TOKEN

    if (!botToken) {
      console.error("[v0] Telegram bot token not configured")
      return NextResponse.json({ error: "Telegram not configured. Add TELEGRAM_BOT_TOKEN env var." }, { status: 500 })
    }

    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error("[v0] Telegram API error:", error)
      return NextResponse.json({ error: "Failed to send Telegram message" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Telegram notification error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
