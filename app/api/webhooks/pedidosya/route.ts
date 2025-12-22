import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Pedidos Ya Webhook Handler
 * 
 * Receives order notifications from Pedidos Ya
 * Configure webhook URL in PeYa dashboard
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('[PeYa Webhook] Received:', JSON.stringify(body))
    
    const supabase = await createClient()
    
    // PeYa sends order events
    const { event, order } = body
    
    if (!order?.id) {
      return NextResponse.json({ received: true })
    }
    
    // Find the kiosko by restaurant_id
    const { data: config } = await supabase
      .from('integration_configs')
      .select('kiosko_id')
      .eq('pedidosya_restaurant_id', order.restaurant?.id)
      .eq('pedidosya_enabled', true)
      .single()
    
    if (!config) {
      console.log('[PeYa Webhook] No config found for restaurant:', order.restaurant?.id)
      return NextResponse.json({ received: true })
    }
    
    const kioskoId = config.kiosko_id
    
    switch (event) {
      case 'ORDER_CREATED':
        // Create a new pending external order
        await supabase.from('external_orders').insert({
          kiosko_id: kioskoId,
          source: 'pedidosya',
          external_id: order.id,
          external_code: order.code,
          status: 'pending',
          customer_name: order.user?.name,
          customer_phone: order.user?.phone,
          customer_address: order.user?.address?.street,
          total_amount: order.payment?.paymentAmount,
          items: order.details,
          notes: order.notes,
          raw_data: order,
        })
        
        console.log('[PeYa Webhook] Order created:', order.id)
        break
        
      case 'ORDER_CONFIRMED':
        await supabase
          .from('external_orders')
          .update({ status: 'confirmed' })
          .eq('external_id', order.id)
          .eq('source', 'pedidosya')
        break
        
      case 'ORDER_DISPATCHED':
        await supabase
          .from('external_orders')
          .update({ status: 'dispatched' })
          .eq('external_id', order.id)
          .eq('source', 'pedidosya')
        break
        
      case 'ORDER_DELIVERED':
        await supabase
          .from('external_orders')
          .update({ status: 'delivered' })
          .eq('external_id', order.id)
          .eq('source', 'pedidosya')
        break
        
      case 'ORDER_CANCELLED':
        await supabase
          .from('external_orders')
          .update({ status: 'cancelled' })
          .eq('external_id', order.id)
          .eq('source', 'pedidosya')
        break
    }
    
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[PeYa Webhook] Error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ok' })
}
