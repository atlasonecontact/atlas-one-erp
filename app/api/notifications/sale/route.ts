import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { kioskoId, saleId, total, items, itemsSummary, paymentMethod } = await request.json()

    const supabase = await createServerClient()

    const { data: kiosko, error: kioskoError } = await supabase.from("kioscos").select("id, name").eq("id", kioskoId).single()

    if (kioskoError) {
      throw kioskoError
    }

    const { data: notif, error: notifError } = await supabase
      .from("notification_configs")
      .select("whatsapp_enabled, whatsapp_phone, whatsapp_verified, telegram_enabled, telegram_chat_id, telegram_verified")
      .eq("kiosko_id", kioskoId)
      .maybeSingle()

    if (notifError) {
      throw notifError
    }

    if (!kiosko) {
      return NextResponse.json({ error: "Kiosko not found" }, { status: 404 })
    }

    const message = `
Nueva Venta - ${kiosko.name}

ID: ${saleId}
Total: $${total.toLocaleString()}
Items: ${items} (${itemsSummary})
Método: ${paymentMethod}
Hora: ${new Date().toLocaleString("es-AR")}
    `.trim()

    const notifications = []

    // Send WhatsApp notification if configured and verified
    if (
      notif?.whatsapp_enabled &&
      notif?.whatsapp_phone &&
      notif?.whatsapp_verified &&
      process.env.WHATSAPP_ACCESS_TOKEN &&
      process.env.WHATSAPP_PHONE_NUMBER_ID
    ) {
      try {
        const whatsappResponse = await fetch(
          `https://graph.facebook.com/v17.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              messaging_product: "whatsapp",
              to: notif.whatsapp_phone.replace(/[^0-9]/g, ""),
              type: "text",
              text: { body: message },
            }),
          },
        )

        if (whatsappResponse.ok) {
          notifications.push({ type: "whatsapp", status: "sent" })
        }
      } catch (error) {
        console.error("[v0] WhatsApp notification error:", error)
        notifications.push({ type: "whatsapp", status: "failed" })
      }
    }

    // Send Telegram notification if configured and verified
    if (notif?.telegram_enabled && notif?.telegram_chat_id && notif?.telegram_verified && process.env.TELEGRAM_BOT_TOKEN) {
      try {
        const telegramResponse = await fetch(
          `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: notif.telegram_chat_id,
              text: message,
              parse_mode: "HTML",
            }),
          },
        )

        if (telegramResponse.ok) {
          notifications.push({ type: "telegram", status: "sent" })
        }
      } catch (error) {
        console.error("[v0] Telegram notification error:", error)
        notifications.push({ type: "telegram", status: "failed" })
      }
    }

    return NextResponse.json({ success: true, notifications })
  } catch (error: any) {
    console.error("[v0] Sale notification error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
