import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { kioskoId, saleId, total, items, itemsSummary, paymentMethod, employeeName } = await request.json()

    const supabase = await createServerClient()

    // Get kiosko with owner info
    const { data: kiosko, error: kioskoError } = await supabase
      .from("kioscos")
      .select("id, name, owner_id")
      .eq("id", kioskoId)
      .single()

    if (kioskoError) {
      throw kioskoError
    }

    if (!kiosko) {
      return NextResponse.json({ error: "Kiosko not found" }, { status: 404 })
    }

    // Check user notification preferences
    const { data: prefs } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("profile_id", kiosko.owner_id)
      .or(`kiosko_id.eq.${kioskoId},kiosko_id.is.null`)
      .order("kiosko_id", { nullsFirst: false })
      .limit(1)
      .maybeSingle()

    // Check if notifications should be sent based on preferences
    const shouldNotify = checkNotificationPreferences(prefs, total, paymentMethod)
    
    if (!shouldNotify) {
      console.log("[v0] Sale notification skipped due to preferences:", { saleId, kioskoId })
      return NextResponse.json({ success: true, notifications: [], skipped: true, reason: "preferences" })
    }

    // Get notification config for kiosko
    const { data: notif, error: notifError } = await supabase
      .from("notification_configs")
      .select("whatsapp_enabled, whatsapp_phone, whatsapp_verified, telegram_enabled, telegram_chat_id, telegram_verified")
      .eq("kiosko_id", kioskoId)
      .maybeSingle()

    if (notifError) {
      console.error("[v0] Notification config error:", notifError)
    }

    // Also get owner's profile for fallback notification settings
    const { data: ownerProfile } = await supabase
      .from("profiles")
      .select("telegram_chat_id, whatsapp_phone")
      .eq("id", kiosko.owner_id)
      .maybeSingle()

    const formattedTimestamp = new Intl.DateTimeFormat("es-AR", {
      dateStyle: "short",
      timeStyle: "short",
      timeZone: "America/Argentina/Buenos_Aires",
    }).format(new Date())

    const message = `
🛒 <b>Nueva Venta - ${kiosko.name}</b>

💰 Total: <b>$${total.toLocaleString()}</b>
📦 Items: ${items} (${itemsSummary})
💳 Método: ${paymentMethod}
${employeeName ? `👤 Vendedor: ${employeeName}` : ""}
🕐 ${formattedTimestamp}

#${saleId}
    `.trim()

    const notifications = []

    // Determine which WhatsApp number to use (kiosko config or owner profile)
    const whatsappPhone = notif?.whatsapp_phone || ownerProfile?.whatsapp_phone
    const whatsappEnabled = notif?.whatsapp_enabled && notif?.whatsapp_verified

    // Send WhatsApp notification if configured and verified
    if (
      whatsappEnabled &&
      whatsappPhone &&
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
              to: whatsappPhone.replace(/[^0-9]/g, ""),
              type: "text",
              text: { body: message.replace(/<[^>]*>/g, "") }, // Strip HTML for WhatsApp
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

    // Determine which Telegram chat to use (kiosko config or owner profile)
    const telegramChatId = notif?.telegram_chat_id || ownerProfile?.telegram_chat_id
    const telegramEnabled = (notif?.telegram_enabled && notif?.telegram_verified) || ownerProfile?.telegram_chat_id

    // Send Telegram notification if configured
    if (
      telegramEnabled &&
      telegramChatId &&
      process.env.TELEGRAM_BOT_TOKEN
    ) {
      try {
        const telegramResponse = await fetch(
          `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: telegramChatId,
              text: message,
              parse_mode: "HTML",
            }),
          },
        )

        if (telegramResponse.ok) {
          notifications.push({ type: "telegram", status: "sent" })
        } else {
          const errorData = await telegramResponse.json()
          console.error("[v0] Telegram API error:", errorData)
          notifications.push({ type: "telegram", status: "failed" })
        }
      } catch (error) {
        console.error("[v0] Telegram notification error:", error)
        notifications.push({ type: "telegram", status: "failed" })
      }
    }

    console.log("[v0] Sale notification sent:", { saleId, kioskoId, notifications })
    return NextResponse.json({ success: true, notifications })
  } catch (error: any) {
    console.error("[v0] Sale notification error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
/**
 * Check if notification should be sent based on user preferences
 */
function checkNotificationPreferences(
  prefs: any,
  saleAmount: number,
  paymentMethod: string
): boolean {
  // No preferences = send all notifications (default behavior)
  if (!prefs) return true

  // Check if muted
  if (prefs.is_muted) {
    // Check if mute has expired
    if (prefs.muted_until) {
      const mutedUntil = new Date(prefs.muted_until)
      if (mutedUntil > new Date()) {
        return false // Still muted
      }
    } else {
      return false // Permanently muted
    }
  }

  // Check quiet hours
  if (prefs.quiet_hours_start && prefs.quiet_hours_end) {
    const now = new Date()
    const currentHour = now.getHours()
    const currentMinutes = now.getMinutes()
    const currentTimeMinutes = currentHour * 60 + currentMinutes

    const [startHour, startMin] = prefs.quiet_hours_start.split(":").map(Number)
    const [endHour, endMin] = prefs.quiet_hours_end.split(":").map(Number)
    const startMinutes = startHour * 60 + startMin
    const endMinutes = endHour * 60 + endMin

    if (startMinutes < endMinutes) {
      // Normal range (e.g., 09:00 to 18:00)
      if (currentTimeMinutes >= startMinutes && currentTimeMinutes <= endMinutes) {
        return false
      }
    } else {
      // Wrapping range (e.g., 22:00 to 08:00)
      if (currentTimeMinutes >= startMinutes || currentTimeMinutes <= endMinutes) {
        return false
      }
    }
  }

  // Check if sales notifications are enabled
  if (!prefs.notify_sales) {
    return false
  }

  // Check sale amount threshold
  if (prefs.notify_large_sales && prefs.min_sale_amount > 0) {
    if (saleAmount < prefs.min_sale_amount) {
      return false
    }
  }

  // Check payment type filter
  if (prefs.notify_payment_type && prefs.payment_types && prefs.payment_types.length > 0) {
    const normalizedPaymentMethod = paymentMethod?.toLowerCase() || ""
    if (!prefs.payment_types.some((pt: string) => normalizedPaymentMethod.includes(pt.toLowerCase()))) {
      return false
    }
  }

  return true
}
