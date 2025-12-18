export interface TelegramMessage {
  chatId: string
  message: string
}

export async function sendTelegramNotification(data: TelegramMessage): Promise<boolean> {
  try {
    const response = await fetch("/api/notifications/telegram", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })

    return response.ok
  } catch (error) {
    console.error("[v0] Telegram notification error:", error)
    return false
  }
}
