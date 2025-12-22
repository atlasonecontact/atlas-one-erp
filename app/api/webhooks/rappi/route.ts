import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Rappi Webhook Handler
 * 
 * Receives order notifications from Rappi
 * Configure webhook URL in Rappi partner dashboard
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('[Rappi Webhook] Received:', JSON.stringify(body))
    
    const supabase = await createClient()
    
    // Rappi sends order events
    const { event_type, order } = body
    
    if (!order?.id) {
      return NextResponse.json({ received: true })
    }
    
    // Find the kiosko by store_id
    const { data: config } = await supabase
      .from('integration_configs')
      .select('kiosko_id')
      .eq('rappi_store_id', order.store_id)
      .eq('rappi_enabled', true)
      .single()
    
    if (!config) {
      console.log('[Rappi Webhook] No config found for store:', order.store_id)
      return NextResponse.json({ received: true })
    }
    
    const kioskoId = config.kiosko_id
    
    switch (event_type) {
      case 'ORDER_CREATED':
      case 'order.created':
        // Create a new pending external order
        await supabase.from('external_orders').insert({
          kiosko_id: kioskoId,
          source: 'rappi',
          external_id: order.id,
          external_code: order.order_number,
          status: 'pending',
          customer_name: order.customer?.name,
          customer_phone: order.customer?.phone,
          customer_address: order.customer?.address?.street,
          total_amount: order.payment?.total,
          items: order.items,
          notes: order.notes,
          raw_data: order,
        })
        
        console.log('[Rappi Webhook] Order created:', order.id)
        break
        
      case 'ORDER_ACCEPTED':
      case 'order.accepted':
        await supabase
          .from('external_orders')
          .update({ status: 'confirmed' })
          .eq('external_id', order.id)
          .eq('source', 'rappi')
        break
        
      case 'ORDER_READY':
      case 'order.ready_for_pickup':
        await supabase
          .from('external_orders')
          .update({ status: 'ready' })
          .eq('external_id', order.id)
          .eq('source', 'rappi')
        break
        
      case 'ORDER_PICKED_UP':
      case 'order.picked_up':
        await supabase
          .from('external_orders')
          .update({ status: 'dispatched' })
          .eq('external_id', order.id)
          .eq('source', 'rappi')
        break
        
      case 'ORDER_DELIVERED':
      case 'order.delivered':
        await supabase
          .from('external_orders')
          .update({ status: 'delivered' })
          .eq('external_id', order.id)
          .eq('source', 'rappi')
        break
        
      case 'ORDER_CANCELLED':
      case 'order.cancelled':
        await supabase
          .from('external_orders')
          .update({ 
            status: 'cancelled',
            cancellation_reason: order.cancellation_reason 
          })
          .eq('external_id', order.id)
          .eq('source', 'rappi')
        break
    }
    
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[Rappi Webhook] Error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ok' })
}
