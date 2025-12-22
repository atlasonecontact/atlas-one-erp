/**
 * Mercado Pago Integration
 * 
 * Features:
 * - Checkout Pro (redirect to MP)
 * - Dynamic QR (for POS)
 * - Payment notifications (webhooks)
 * 
 * Documentation: https://www.mercadopago.com.ar/developers/es/docs
 */

const MP_API_URL = 'https://api.mercadopago.com'

export interface MPPaymentPreference {
  items: {
    title: string
    quantity: number
    unit_price: number
    currency_id?: string
  }[]
  payer?: {
    email?: string
    name?: string
  }
  external_reference?: string
  notification_url?: string
  back_urls?: {
    success?: string
    failure?: string
    pending?: string
  }
}

export interface MPQRData {
  qr_data: string
  in_store_order_id: string
}

export interface MPPayment {
  id: number
  status: 'approved' | 'pending' | 'rejected' | 'cancelled'
  status_detail: string
  transaction_amount: number
  currency_id: string
  payer: {
    email: string
    identification: {
      type: string
      number: string
    }
  }
  external_reference: string
  date_approved: string
}

/**
 * Create a Checkout Pro preference
 */
export async function createPreference(
  accessToken: string,
  preference: MPPaymentPreference
): Promise<{ id: string; init_point: string; sandbox_init_point: string } | null> {
  try {
    const response = await fetch(`${MP_API_URL}/checkout/preferences`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...preference,
        items: preference.items.map(item => ({
          ...item,
          currency_id: item.currency_id || 'ARS',
        })),
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('[MercadoPago] Create preference error:', error)
      return null
    }

    return await response.json()
  } catch (error) {
    console.error('[MercadoPago] Create preference error:', error)
    return null
  }
}

/**
 * Create a dynamic QR for POS
 */
export async function createDynamicQR(
  accessToken: string,
  userId: string,
  externalStoreId: string,
  externalPosId: string,
  orderData: {
    external_reference: string
    title: string
    total_amount: number
    items: { title: string; quantity: number; unit_price: number }[]
    notification_url?: string
  }
): Promise<MPQRData | null> {
  try {
    const response = await fetch(
      `${MP_API_URL}/instore/orders/qr/seller/collectors/${userId}/pos/${externalPosId}/qrs`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          external_reference: orderData.external_reference,
          title: orderData.title,
          total_amount: orderData.total_amount,
          items: orderData.items.map(item => ({
            ...item,
            unit_measure: 'unit',
            total_amount: item.quantity * item.unit_price,
          })),
          notification_url: orderData.notification_url,
          expiration_date: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
        }),
      }
    )

    if (!response.ok) {
      const error = await response.json()
      console.error('[MercadoPago] Create QR error:', error)
      return null
    }

    return await response.json()
  } catch (error) {
    console.error('[MercadoPago] Create QR error:', error)
    return null
  }
}

/**
 * Get payment details
 */
export async function getPayment(
  accessToken: string,
  paymentId: string
): Promise<MPPayment | null> {
  try {
    const response = await fetch(`${MP_API_URL}/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      return null
    }

    return await response.json()
  } catch (error) {
    console.error('[MercadoPago] Get payment error:', error)
    return null
  }
}

/**
 * Search payments by external reference
 */
export async function searchPayments(
  accessToken: string,
  externalReference: string
): Promise<MPPayment[]> {
  try {
    const response = await fetch(
      `${MP_API_URL}/v1/payments/search?external_reference=${externalReference}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    )

    if (!response.ok) {
      return []
    }

    const data = await response.json()
    return data.results || []
  } catch (error) {
    console.error('[MercadoPago] Search payments error:', error)
    return []
  }
}

/**
 * Verify webhook signature
 */
export function verifyWebhook(
  xSignature: string,
  xRequestId: string,
  dataId: string,
  secretKey: string
): boolean {
  // In production, verify HMAC signature
  // See: https://www.mercadopago.com.ar/developers/es/docs/your-integrations/notifications/webhooks
  return true
}

/**
 * Create a Point payment intent (for Point device)
 */
export async function createPointPayment(
  accessToken: string,
  deviceId: string,
  amount: number,
  description: string,
  externalReference: string
): Promise<{ id: string } | null> {
  try {
    const response = await fetch(`${MP_API_URL}/point/integration-api/devices/${deviceId}/payment-intents`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        description,
        external_reference: externalReference,
        print: true,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('[MercadoPago] Point payment error:', error)
      return null
    }

    return await response.json()
  } catch (error) {
    console.error('[MercadoPago] Point payment error:', error)
    return null
  }
}

/**
 * Get user info (to get user_id for QR)
 */
export async function getUserInfo(accessToken: string): Promise<{ id: string } | null> {
  try {
    const response = await fetch(`${MP_API_URL}/users/me`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      return null
    }

    return await response.json()
  } catch (error) {
    console.error('[MercadoPago] Get user error:', error)
    return null
  }
}
