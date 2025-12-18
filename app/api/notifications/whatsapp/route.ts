import { type NextRequest, NextResponse } from "next/server"

// Para usar WhatsApp Business Cloud API necesitas:
// 1. Crear una app en Meta for Developers
// 2. Configurar WhatsApp Business API
// 3. Obtener el Phone Number ID y Access Token
// 4. Agregar las env vars: WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_ACCESS_TOKEN

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, message } = await request.json()

    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN

    if (!phoneNumberId || !accessToken) {
      console.error("[v0] WhatsApp credentials not configured")
      return NextResponse.json(
        { error: "WhatsApp not configured. Add WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN env vars." },
        { status: 500 },
      )
    }

    const response = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: phoneNumber,
        type: "text",
        text: { body: message },
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error("[v0] WhatsApp API error:", error)
      return NextResponse.json({ error: "Failed to send WhatsApp message" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] WhatsApp notification error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Webhook para recibir mensajes de WhatsApp
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const mode = searchParams.get("hub.mode")
  const token = searchParams.get("hub.verify_token")
  const challenge = searchParams.get("hub.challenge")

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || "atlas_one_verify_token"

  if (mode === "subscribe" && token === verifyToken) {
    return new NextResponse(challenge, { status: 200 })
  }

  return NextResponse.json({ error: "Verification failed" }, { status: 403 })
}
