import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPayment } from '@/lib/integrations/mercadopago'

/**
 * Mercado Pago Webhook Handler
 * 
 * Receives payment notifications from Mercado Pago
 * Configure webhook URL in MP dashboard: https://yourdomain.com/api/webhooks/mercadopago
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('[MP Webhook] Received:', JSON.stringify(body))
    
    // Get notification data
    const { type, data } = body
    
    if (type !== 'payment') {
      return NextResponse.json({ received: true })
    }
    
    const paymentId = data?.id
    if (!paymentId) {
      return NextResponse.json({ error: 'No payment ID' }, { status: 400 })
    }
    
    const supabase = await createClient()
    
    // Get external_reference from payment to find the kiosko
    // First we need to find which kiosko this payment belongs to
    // We do this by checking the external_reference format: kiosko_id:sale_id
    
    // Get all kioscos with MP enabled to find the right access token
    const { data: configs } = await supabase
      .from('integration_configs')
      .select('kiosko_id, mercadopago_access_token')
      .eq('mercadopago_enabled', true)
      .not('mercadopago_access_token', 'is', null)
    
    if (!configs || configs.length === 0) {
      console.log('[MP Webhook] No MP configs found')
      return NextResponse.json({ received: true })
    }
    
    // Try each config until we find the payment
    for (const config of configs) {
      const payment = await getPayment(config.mercadopago_access_token!, paymentId)
      
      if (payment) {
        console.log('[MP Webhook] Payment found:', payment.status, payment.external_reference)
        
        // Parse external_reference (format: kiosko_id:sale_id)
        const [kioskoId, saleId] = (payment.external_reference || '').split(':')
        
        if (saleId) {
          // Update sale payment status
          const paymentStatus = payment.status === 'approved' ? 'paid' 
            : payment.status === 'pending' ? 'pending' 
            : 'failed'
          
          await supabase
            .from('sales')
            .update({
              mp_payment_id: paymentId,
              mp_payment_status: paymentStatus,
              updated_at: new Date().toISOString(),
            })
            .eq('id', saleId)
          
          // If approved, also update payment_method to show it was MP
          if (payment.status === 'approved') {
            await supabase
              .from('sales')
              .update({ payment_method: 'qr' })
              .eq('id', saleId)
          }
          
          console.log('[MP Webhook] Sale updated:', saleId, paymentStatus)
        }
        
        break
      }
    }
    
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[MP Webhook] Error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

// Mercado Pago also sends GET requests to verify the endpoint
export async function GET() {
  return NextResponse.json({ status: 'ok' })
}
