import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { 
  ARCAClient, 
  TIPOS_COMPROBANTE, 
  TIPOS_DOCUMENTO,
  generarCodigoBarras,
  type FacturaData 
} from '@/lib/integrations/arca-afip'

/**
 * POST /api/invoices
 * 
 * Emite una factura electrónica para una venta
 * 
 * Body:
 * - saleId: UUID de la venta
 * - tipoComprobante: 1 (FA), 6 (FB), 11 (FC)
 * - tipoDocumento: 80 (CUIT), 96 (DNI), 99 (CF)
 * - numeroDocumento: string
 * - razonSocial: string (opcional)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    
    // Verificar autenticación
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { saleId, tipoComprobante, tipoDocumento, numeroDocumento, razonSocial } = body

    if (!saleId) {
      return NextResponse.json({ error: 'saleId es requerido' }, { status: 400 })
    }

    // Obtener la venta con sus items
    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .select(`
        *,
        sale_items (
          id,
          product_id,
          product_name,
          quantity,
          unit_price,
          subtotal
        )
      `)
      .eq('id', saleId)
      .single()

    if (saleError || !sale) {
      return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 })
    }

    // Verificar que el usuario tiene acceso al kiosco
    const { data: kiosko } = await supabase
      .from('kioscos')
      .select('id, owner_id')
      .eq('id', sale.kiosko_id)
      .single()

    if (!kiosko || kiosko.owner_id !== user.id) {
      // Verificar si es empleado
      const { data: employee } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', user.id)
        .eq('kiosko_id', sale.kiosko_id)
        .single()

      if (!employee) {
        return NextResponse.json({ error: 'No autorizado para este kiosco' }, { status: 403 })
      }
    }

    // Verificar si ya tiene factura
    const { data: existingInvoice } = await supabase
      .from('invoices')
      .select('id, cae')
      .eq('sale_id', saleId)
      .single()

    if (existingInvoice) {
      return NextResponse.json({ 
        error: 'Esta venta ya tiene una factura emitida',
        invoice: existingInvoice
      }, { status: 409 })
    }

    // Obtener configuración de ARCA
    const { data: config } = await supabase
      .from('integration_configs')
      .select('*')
      .eq('kiosko_id', sale.kiosko_id)
      .single()

    if (!config?.arca_enabled) {
      return NextResponse.json({ error: 'Facturación electrónica no habilitada' }, { status: 400 })
    }

    if (!config.arca_cuit || !config.arca_certificate || !config.arca_private_key) {
      return NextResponse.json({ error: 'Configuración de ARCA incompleta' }, { status: 400 })
    }

    // Calcular importes
    const importeNeto = sale.total / 1.21 // Asumiendo IVA 21%
    const importeIVA = sale.total - importeNeto

    // Preparar datos de factura
    const facturaData: FacturaData = {
      tipoComprobante: tipoComprobante || TIPOS_COMPROBANTE.FACTURA_B,
      puntoVenta: config.arca_punto_venta || 1,
      concepto: 1, // Productos
      tipoDocumento: tipoDocumento || TIPOS_DOCUMENTO.CONSUMIDOR_FINAL,
      numeroDocumento: numeroDocumento || '0',
      importeTotal: sale.total,
      importeNeto: Math.round(importeNeto * 100) / 100,
      importeIVA: Math.round(importeIVA * 100) / 100,
      items: sale.sale_items.map((item: any) => ({
        descripcion: item.product_name,
        cantidad: item.quantity,
        unidad: 'unidades',
        precioUnitario: item.unit_price,
        subtotal: item.subtotal,
        alicuotaIVA: 21,
        importeIVA: item.subtotal - (item.subtotal / 1.21),
      })),
    }

    // Crear cliente ARCA y solicitar CAE
    const arcaClient = new ARCAClient({
      cuit: config.arca_cuit,
      certificate: config.arca_certificate,
      privateKey: config.arca_private_key,
      environment: config.arca_environment || 'testing',
      puntoVenta: config.arca_punto_venta || 1,
    })

    const resultado = await arcaClient.solicitarCAE(facturaData)

    if (!resultado.success) {
      return NextResponse.json({ 
        error: 'Error al solicitar CAE',
        details: resultado.error
      }, { status: 500 })
    }

    // Generar código de barras
    const codigoBarras = generarCodigoBarras(
      config.arca_cuit,
      facturaData.tipoComprobante,
      facturaData.puntoVenta,
      resultado.cae!,
      resultado.caeVencimiento!
    )

    // Guardar factura en la base de datos
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        kiosko_id: sale.kiosko_id,
        sale_id: saleId,
        tipo_comprobante: facturaData.tipoComprobante,
        punto_venta: facturaData.puntoVenta,
        numero_comprobante: resultado.numeroComprobante,
        cae: resultado.cae,
        cae_vencimiento: resultado.caeVencimiento,
        cuit_emisor: config.arca_cuit,
        tipo_documento_receptor: facturaData.tipoDocumento,
        numero_documento_receptor: facturaData.numeroDocumento,
        razon_social_receptor: razonSocial,
        importe_total: facturaData.importeTotal,
        importe_neto: facturaData.importeNeto,
        importe_iva: facturaData.importeIVA,
        codigo_barras: codigoBarras,
      })
      .select()
      .single()

    if (invoiceError) {
      console.error('[Invoice] Error guardando factura:', invoiceError)
      return NextResponse.json({ 
        error: 'Error guardando factura',
        details: invoiceError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      invoice: {
        id: invoice.id,
        tipoComprobante: invoice.tipo_comprobante,
        puntoVenta: invoice.punto_venta,
        numeroComprobante: invoice.numero_comprobante,
        cae: invoice.cae,
        caeVencimiento: invoice.cae_vencimiento,
        codigoBarras: invoice.codigo_barras,
        importeTotal: invoice.importe_total,
      }
    })

  } catch (error: any) {
    console.error('[Invoice] Error:', error)
    return NextResponse.json({ 
      error: 'Error interno',
      details: error.message
    }, { status: 500 })
  }
}

/**
 * GET /api/invoices?saleId=xxx
 * 
 * Obtiene la factura de una venta
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const saleId = request.nextUrl.searchParams.get('saleId')
    
    if (!saleId) {
      return NextResponse.json({ error: 'saleId es requerido' }, { status: 400 })
    }

    const { data: invoice, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('sale_id', saleId)
      .single()

    if (error || !invoice) {
      return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 })
    }

    return NextResponse.json({ invoice })

  } catch (error: any) {
    console.error('[Invoice GET] Error:', error)
    return NextResponse.json({ 
      error: 'Error interno',
      details: error.message
    }, { status: 500 })
  }
}
