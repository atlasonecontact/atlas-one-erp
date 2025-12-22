/**
 * Rappi Integration
 * 
 * Features:
 * - Receive orders
 * - Update order status
 * - Sync catalog
 * - Manage availability
 * 
 * Note: Requires partnership with Rappi for API access
 */

const RAPPI_API_URL = 'https://api.rappi.com'

export interface RappiOrder {
  id: string
  order_number: string
  status: 'created' | 'accepted' | 'in_preparation' | 'ready_for_pickup' | 'picked_up' | 'delivered' | 'cancelled'
  created_at: string
  estimated_delivery: string
  customer: {
    name: string
    phone: string
    address: {
      street: string
      city: string
      latitude: number
      longitude: number
    }
  }
  payment: {
    total: number
    subtotal: number
    delivery_fee: number
    tip: number
    payment_method: 'cash' | 'card' | 'rappi_credits'
  }
  items: {
    id: string
    name: string
    quantity: number
    unit_price: number
    total_price: number
    notes: string
    modifiers: {
      name: string
      price: number
    }[]
  }[]
  notes: string
}

export interface RappiProduct {
  id: string
  sku: string
  name: string
  description: string
  price: number
  available: boolean
  category_id: string
  image_url?: string
}

/**
 * Get order details
 */
export async function getOrder(
  apiKey: string,
  storeId: string,
  orderId: string
): Promise<RappiOrder | null> {
  try {
    const response = await fetch(
      `${RAPPI_API_URL}/v1/stores/${storeId}/orders/${orderId}`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      return null
    }

    return await response.json()
  } catch (error) {
    console.error('[Rappi] Get order error:', error)
    return null
  }
}

/**
 * Get pending orders
 */
export async function getPendingOrders(
  apiKey: string,
  storeId: string
): Promise<RappiOrder[]> {
  try {
    const response = await fetch(
      `${RAPPI_API_URL}/v1/stores/${storeId}/orders?status=created`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      }
    )

    if (!response.ok) {
      return []
    }

    const data = await response.json()
    return data.orders || []
  } catch (error) {
    console.error('[Rappi] Get orders error:', error)
    return []
  }
}

/**
 * Accept an order
 */
export async function acceptOrder(
  apiKey: string,
  storeId: string,
  orderId: string,
  preparationTime: number = 30 // minutes
): Promise<boolean> {
  try {
    const response = await fetch(
      `${RAPPI_API_URL}/v1/stores/${storeId}/orders/${orderId}/accept`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          preparation_time: preparationTime,
        }),
      }
    )

    return response.ok
  } catch (error) {
    console.error('[Rappi] Accept order error:', error)
    return false
  }
}

/**
 * Reject an order
 */
export async function rejectOrder(
  apiKey: string,
  storeId: string,
  orderId: string,
  reason: string
): Promise<boolean> {
  try {
    const response = await fetch(
      `${RAPPI_API_URL}/v1/stores/${storeId}/orders/${orderId}/reject`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason,
        }),
      }
    )

    return response.ok
  } catch (error) {
    console.error('[Rappi] Reject order error:', error)
    return false
  }
}

/**
 * Mark order as ready for pickup
 */
export async function markOrderReady(
  apiKey: string,
  storeId: string,
  orderId: string
): Promise<boolean> {
  try {
    const response = await fetch(
      `${RAPPI_API_URL}/v1/stores/${storeId}/orders/${orderId}/ready`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      }
    )

    return response.ok
  } catch (error) {
    console.error('[Rappi] Ready order error:', error)
    return false
  }
}

/**
 * Get store catalog
 */
export async function getCatalog(
  apiKey: string,
  storeId: string
): Promise<RappiProduct[]> {
  try {
    const response = await fetch(
      `${RAPPI_API_URL}/v1/stores/${storeId}/catalog`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      }
    )

    if (!response.ok) {
      return []
    }

    const data = await response.json()
    return data.products || []
  } catch (error) {
    console.error('[Rappi] Get catalog error:', error)
    return []
  }
}

/**
 * Update product availability
 */
export async function updateProductAvailability(
  apiKey: string,
  storeId: string,
  productId: string,
  available: boolean
): Promise<boolean> {
  try {
    const response = await fetch(
      `${RAPPI_API_URL}/v1/stores/${storeId}/products/${productId}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          available,
        }),
      }
    )

    return response.ok
  } catch (error) {
    console.error('[Rappi] Update availability error:', error)
    return false
  }
}

/**
 * Update product price
 */
export async function updateProductPrice(
  apiKey: string,
  storeId: string,
  productId: string,
  price: number
): Promise<boolean> {
  try {
    const response = await fetch(
      `${RAPPI_API_URL}/v1/stores/${storeId}/products/${productId}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          price,
        }),
      }
    )

    return response.ok
  } catch (error) {
    console.error('[Rappi] Update price error:', error)
    return false
  }
}

/**
 * Set store open/closed
 */
export async function setStoreStatus(
  apiKey: string,
  storeId: string,
  open: boolean
): Promise<boolean> {
  try {
    const response = await fetch(
      `${RAPPI_API_URL}/v1/stores/${storeId}/status`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: open ? 'open' : 'closed',
        }),
      }
    )

    return response.ok
  } catch (error) {
    console.error('[Rappi] Set status error:', error)
    return false
  }
}

/**
 * Bulk update products availability based on stock
 */
export async function syncStockAvailability(
  apiKey: string,
  storeId: string,
  stockData: { sku: string; stock: number }[]
): Promise<{ updated: number; errors: number }> {
  const catalog = await getCatalog(apiKey, storeId)
  const catalogMap = new Map(catalog.map(p => [p.sku, p]))

  let updated = 0
  let errors = 0

  for (const item of stockData) {
    const product = catalogMap.get(item.sku)
    if (!product) continue

    const shouldBeAvailable = item.stock > 0
    if (product.available !== shouldBeAvailable) {
      const success = await updateProductAvailability(apiKey, storeId, product.id, shouldBeAvailable)
      if (success) updated++
      else errors++
    }
  }

  return { updated, errors }
}

/**
 * Convert Rappi order to local sale format
 */
export function convertToLocalSale(order: RappiOrder): {
  external_id: string
  source: string
  total_amount: number
  items: { product_name: string; quantity: number; unit_price: number; subtotal: number }[]
  customer_name: string
  customer_phone: string
  notes: string
} {
  return {
    external_id: order.id,
    source: 'rappi',
    total_amount: order.payment.total,
    items: order.items.map(item => ({
      product_name: item.name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      subtotal: item.total_price,
    })),
    customer_name: order.customer.name,
    customer_phone: order.customer.phone,
    notes: order.notes,
  }
}
