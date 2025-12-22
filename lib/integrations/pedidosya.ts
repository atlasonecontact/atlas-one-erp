/**
 * Pedidos Ya Integration
 * 
 * Features:
 * - Receive orders
 * - Update order status
 * - Sync menu/products
 * - Control availability
 * 
 * Note: Requires partnership with Pedidos Ya for API access
 */

const PEYA_API_URL = 'https://api.pedidosya.com'

export interface PeyaOrder {
  id: string
  code: string
  state: 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'DISPATCHED' | 'DELIVERED' | 'CANCELLED'
  registeredDate: string
  deliveryDate: string
  pickup: boolean
  restaurant: {
    id: string
    name: string
  }
  user: {
    name: string
    phone: string
    address: {
      street: string
      corner: string
      city: string
      area: string
    }
  }
  payment: {
    paymentAmount: number
    tip: number
    online: boolean
  }
  details: {
    product: {
      id: string
      name: string
      unitPrice: number
    }
    quantity: number
    total: number
    optionGroups: {
      name: string
      options: { name: string; amount: number }[]
    }[]
    notes: string
  }[]
  notes: string
}

export interface PeyaProduct {
  id: string
  integrationCode: string
  name: string
  description: string
  price: number
  enabled: boolean
  section: string
  image?: string
}

export interface PeyaAuthToken {
  accessToken: string
  expiresIn: number
  tokenType: string
}

/**
 * Get OAuth token
 */
export async function authenticate(
  clientId: string,
  clientSecret: string
): Promise<PeyaAuthToken | null> {
  try {
    const response = await fetch(`${PEYA_API_URL}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
      }),
    })

    if (!response.ok) {
      console.error('[PedidosYa] Auth error:', await response.text())
      return null
    }

    const data = await response.json()
    return {
      accessToken: data.access_token,
      expiresIn: data.expires_in,
      tokenType: data.token_type,
    }
  } catch (error) {
    console.error('[PedidosYa] Auth error:', error)
    return null
  }
}

/**
 * Get pending orders
 */
export async function getPendingOrders(
  accessToken: string,
  restaurantId: string
): Promise<PeyaOrder[]> {
  try {
    const response = await fetch(
      `${PEYA_API_URL}/v3/orders?restaurantId=${restaurantId}&state=PENDING`,
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
    return data.orders || []
  } catch (error) {
    console.error('[PedidosYa] Get orders error:', error)
    return []
  }
}

/**
 * Confirm an order
 */
export async function confirmOrder(
  accessToken: string,
  orderId: string,
  cookingTime: number = 30 // minutes
): Promise<boolean> {
  try {
    const response = await fetch(`${PEYA_API_URL}/v3/orders/${orderId}/confirm`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cookingTime,
      }),
    })

    return response.ok
  } catch (error) {
    console.error('[PedidosYa] Confirm order error:', error)
    return false
  }
}

/**
 * Reject an order
 */
export async function rejectOrder(
  accessToken: string,
  orderId: string,
  reason: string
): Promise<boolean> {
  try {
    const response = await fetch(`${PEYA_API_URL}/v3/orders/${orderId}/reject`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reason,
      }),
    })

    return response.ok
  } catch (error) {
    console.error('[PedidosYa] Reject order error:', error)
    return false
  }
}

/**
 * Mark order as dispatched
 */
export async function dispatchOrder(
  accessToken: string,
  orderId: string
): Promise<boolean> {
  try {
    const response = await fetch(`${PEYA_API_URL}/v3/orders/${orderId}/dispatch`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })

    return response.ok
  } catch (error) {
    console.error('[PedidosYa] Dispatch order error:', error)
    return false
  }
}

/**
 * Get menu/products
 */
export async function getMenu(
  accessToken: string,
  restaurantId: string
): Promise<PeyaProduct[]> {
  try {
    const response = await fetch(`${PEYA_API_URL}/v3/restaurants/${restaurantId}/menu`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      return []
    }

    const data = await response.json()
    return data.products || []
  } catch (error) {
    console.error('[PedidosYa] Get menu error:', error)
    return []
  }
}

/**
 * Update product availability
 */
export async function updateProductAvailability(
  accessToken: string,
  restaurantId: string,
  productId: string,
  enabled: boolean
): Promise<boolean> {
  try {
    const response = await fetch(
      `${PEYA_API_URL}/v3/restaurants/${restaurantId}/products/${productId}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enabled,
        }),
      }
    )

    return response.ok
  } catch (error) {
    console.error('[PedidosYa] Update product error:', error)
    return false
  }
}

/**
 * Update product price
 */
export async function updateProductPrice(
  accessToken: string,
  restaurantId: string,
  productId: string,
  price: number
): Promise<boolean> {
  try {
    const response = await fetch(
      `${PEYA_API_URL}/v3/restaurants/${restaurantId}/products/${productId}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          price,
        }),
      }
    )

    return response.ok
  } catch (error) {
    console.error('[PedidosYa] Update price error:', error)
    return false
  }
}

/**
 * Close restaurant temporarily
 */
export async function setRestaurantStatus(
  accessToken: string,
  restaurantId: string,
  open: boolean,
  reason?: string
): Promise<boolean> {
  try {
    const response = await fetch(
      `${PEYA_API_URL}/v3/restaurants/${restaurantId}/status`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          open,
          reason: reason || (open ? undefined : 'Temporarily closed'),
        }),
      }
    )

    return response.ok
  } catch (error) {
    console.error('[PedidosYa] Set status error:', error)
    return false
  }
}

/**
 * Sync products from local database to PedidosYa
 */
export async function syncProducts(
  accessToken: string,
  restaurantId: string,
  localProducts: { id: string; name: string; price: number; stock: number }[]
): Promise<{ synced: number; errors: number }> {
  let synced = 0
  let errors = 0

  const peyaProducts = await getMenu(accessToken, restaurantId)
  const peyaMap = new Map(peyaProducts.map(p => [p.integrationCode, p]))

  for (const local of localProducts) {
    const peya = peyaMap.get(local.id)
    if (!peya) continue

    // Update availability based on stock
    const shouldBeEnabled = local.stock > 0
    if (peya.enabled !== shouldBeEnabled) {
      const success = await updateProductAvailability(accessToken, restaurantId, peya.id, shouldBeEnabled)
      if (success) synced++
      else errors++
    }

    // Update price if changed
    if (peya.price !== local.price) {
      const success = await updateProductPrice(accessToken, restaurantId, peya.id, local.price)
      if (success) synced++
      else errors++
    }
  }

  return { synced, errors }
}
