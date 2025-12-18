export interface WhatsAppMessage {
  phoneNumber: string
  message: string
}

export interface SaleNotification {
  saleId: string
  total: number
  items: number
  paymentMethod: string
  timestamp: string
}

export async function sendWhatsAppNotification(data: WhatsAppMessage): Promise<boolean> {
  try {
    // Usando la API de WhatsApp Business Cloud API
    const response = await fetch("/api/notifications/whatsapp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })

    return response.ok
  } catch (error) {
    console.error("[v0] WhatsApp notification error:", error)
    return false
  }
}

export function formatSaleMessage(sale: SaleNotification): string {
  return `🛒 *Nueva Venta - Atlas One*

💰 Total: $${sale.total.toLocaleString()}
📦 Productos: ${sale.items}
💳 Pago: ${sale.paymentMethod}
🕐 ${new Date(sale.timestamp).toLocaleString("es-AR")}

ID: ${sale.saleId}`
}

export function formatStatsMessage(stats: {
  dailySales: number
  dailyTotal: number
  monthlySales: number
  monthlyTotal: number
}): string {
  return `📊 *Estadísticas - Atlas One*

*Hoy:*
🛒 ${stats.dailySales} ventas
💰 $${stats.dailyTotal.toLocaleString()}

*Este mes:*
🛒 ${stats.monthlySales} ventas
💰 $${stats.monthlyTotal.toLocaleString()}`
}
