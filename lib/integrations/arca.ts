/**
 * ARCA (AFIP) Integration - Electronic Invoicing for Argentina
 * 
 * Web Services:
 * - WSAA: Authentication (get ticket)
 * - WSFE: Electronic Invoice (Factura Electrónica)
 * 
 * Documentation: https://www.afip.gob.ar/ws/documentacion/
 */

import { createClient } from '@/lib/supabase/server'

// AFIP Endpoints
const AFIP_ENDPOINTS = {
  testing: {
    wsaa: 'https://wsaahomo.afip.gov.ar/ws/services/LoginCms',
    wsfe: 'https://wswhomo.afip.gov.ar/wsfev1/service.asmx',
  },
  production: {
    wsaa: 'https://wsaa.afip.gov.ar/ws/services/LoginCms',
    wsfe: 'https://servicios1.afip.gov.ar/wsfev1/service.asmx',
  },
}

// Invoice Types
export const INVOICE_TYPES = {
  FACTURA_A: 1,
  NOTA_DEBITO_A: 2,
  NOTA_CREDITO_A: 3,
  FACTURA_B: 6,
  NOTA_DEBITO_B: 7,
  NOTA_CREDITO_B: 8,
  FACTURA_C: 11,
  NOTA_DEBITO_C: 12,
  NOTA_CREDITO_C: 13,
}

// Document Types
export const DOC_TYPES = {
  CUIT: 80,
  CUIL: 86,
  CDI: 87,
  DNI: 96,
  PASAPORTE: 94,
  CONSUMIDOR_FINAL: 99, // Sin identificar
}

// IVA Conditions
export const IVA_CONDITIONS = {
  RESPONSABLE_INSCRIPTO: 1,
  MONOTRIBUTO: 6,
  EXENTO: 4,
  CONSUMIDOR_FINAL: 5,
}

export interface InvoiceData {
  invoiceType: number
  salePoint: number
  concept: 1 | 2 | 3 // 1=Products, 2=Services, 3=Both
  docType: number
  docNumber: string
  total: number
  netAmount: number
  ivaAmount: number
  items: InvoiceItem[]
}

export interface InvoiceItem {
  description: string
  quantity: number
  unitPrice: number
  ivaRate: number // 21, 10.5, 27, 0
  subtotal: number
}

export interface CAEResponse {
  success: boolean
  cae?: string
  caeExpiration?: string
  invoiceNumber?: number
  error?: string
}

/**
 * Get authentication ticket from WSAA
 */
export async function getAuthTicket(
  cuit: string,
  certificate: string,
  privateKey: string,
  environment: 'testing' | 'production'
): Promise<{ token: string; sign: string } | null> {
  try {
    const endpoint = AFIP_ENDPOINTS[environment].wsaa
    
    // Create TRA (Ticket de Requerimiento de Acceso)
    const now = new Date()
    const expiration = new Date(now.getTime() + 12 * 60 * 60 * 1000) // 12 hours
    
    const tra = `<?xml version="1.0" encoding="UTF-8"?>
<loginTicketRequest version="1.0">
  <header>
    <uniqueId>${Math.floor(Date.now() / 1000)}</uniqueId>
    <generationTime>${now.toISOString()}</generationTime>
    <expirationTime>${expiration.toISOString()}</expirationTime>
  </header>
  <service>wsfe</service>
</loginTicketRequest>`

    // In production, you would:
    // 1. Sign the TRA with the private key using PKCS#7
    // 2. Send the signed CMS to WSAA
    // 3. Parse the response to get token and sign
    
    // This is a placeholder - actual implementation requires crypto libraries
    console.log('[ARCA] Auth request to:', endpoint)
    console.log('[ARCA] TRA:', tra)
    
    // For now, return mock data in testing mode
    if (environment === 'testing') {
      return {
        token: 'MOCK_TOKEN_' + Date.now(),
        sign: 'MOCK_SIGN_' + Date.now(),
      }
    }
    
    return null
  } catch (error) {
    console.error('[ARCA] Auth error:', error)
    return null
  }
}

/**
 * Get last authorized invoice number
 */
export async function getLastInvoiceNumber(
  cuit: string,
  salePoint: number,
  invoiceType: number,
  token: string,
  sign: string,
  environment: 'testing' | 'production'
): Promise<number> {
  try {
    const endpoint = AFIP_ENDPOINTS[environment].wsfe
    
    const soapRequest = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ar="http://ar.gov.afip.dif.FEV1/">
  <soap:Body>
    <ar:FECompUltimoAutorizado>
      <ar:Auth>
        <ar:Token>${token}</ar:Token>
        <ar:Sign>${sign}</ar:Sign>
        <ar:Cuit>${cuit.replace(/-/g, '')}</ar:Cuit>
      </ar:Auth>
      <ar:PtoVta>${salePoint}</ar:PtoVta>
      <ar:CbteTipo>${invoiceType}</ar:CbteTipo>
    </ar:FECompUltimoAutorizado>
  </soap:Body>
</soap:Envelope>`

    console.log('[ARCA] Getting last invoice number from:', endpoint)
    
    // In testing mode, return mock
    if (environment === 'testing') {
      return Math.floor(Math.random() * 10000)
    }
    
    // Production: make actual SOAP call
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': 'http://ar.gov.afip.dif.FEV1/FECompUltimoAutorizado',
      },
      body: soapRequest,
    })
    
    const xml = await response.text()
    // Parse XML response to get CbteNro
    const match = xml.match(/<CbteNro>(\d+)<\/CbteNro>/)
    return match ? parseInt(match[1]) : 0
  } catch (error) {
    console.error('[ARCA] Error getting last invoice:', error)
    return 0
  }
}

/**
 * Request CAE for an invoice
 */
export async function requestCAE(
  cuit: string,
  invoiceData: InvoiceData,
  token: string,
  sign: string,
  environment: 'testing' | 'production'
): Promise<CAEResponse> {
  try {
    const endpoint = AFIP_ENDPOINTS[environment].wsfe
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    
    // Get last invoice number
    const lastNumber = await getLastInvoiceNumber(
      cuit,
      invoiceData.salePoint,
      invoiceData.invoiceType,
      token,
      sign,
      environment
    )
    const newNumber = lastNumber + 1
    
    const soapRequest = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ar="http://ar.gov.afip.dif.FEV1/">
  <soap:Body>
    <ar:FECAESolicitar>
      <ar:Auth>
        <ar:Token>${token}</ar:Token>
        <ar:Sign>${sign}</ar:Sign>
        <ar:Cuit>${cuit.replace(/-/g, '')}</ar:Cuit>
      </ar:Auth>
      <ar:FeCAEReq>
        <ar:FeCabReq>
          <ar:CantReg>1</ar:CantReg>
          <ar:PtoVta>${invoiceData.salePoint}</ar:PtoVta>
          <ar:CbteTipo>${invoiceData.invoiceType}</ar:CbteTipo>
        </ar:FeCabReq>
        <ar:FeDetReq>
          <ar:FECAEDetRequest>
            <ar:Concepto>${invoiceData.concept}</ar:Concepto>
            <ar:DocTipo>${invoiceData.docType}</ar:DocTipo>
            <ar:DocNro>${invoiceData.docNumber.replace(/-/g, '')}</ar:DocNro>
            <ar:CbteDesde>${newNumber}</ar:CbteDesde>
            <ar:CbteHasta>${newNumber}</ar:CbteHasta>
            <ar:CbteFch>${today}</ar:CbteFch>
            <ar:ImpTotal>${invoiceData.total.toFixed(2)}</ar:ImpTotal>
            <ar:ImpTotConc>0</ar:ImpTotConc>
            <ar:ImpNeto>${invoiceData.netAmount.toFixed(2)}</ar:ImpNeto>
            <ar:ImpOpEx>0</ar:ImpOpEx>
            <ar:ImpTrib>0</ar:ImpTrib>
            <ar:ImpIVA>${invoiceData.ivaAmount.toFixed(2)}</ar:ImpIVA>
            <ar:MonId>PES</ar:MonId>
            <ar:MonCotiz>1</ar:MonCotiz>
            <ar:Iva>
              <ar:AlicIva>
                <ar:Id>5</ar:Id>
                <ar:BaseImp>${invoiceData.netAmount.toFixed(2)}</ar:BaseImp>
                <ar:Importe>${invoiceData.ivaAmount.toFixed(2)}</ar:Importe>
              </ar:AlicIva>
            </ar:Iva>
          </ar:FECAEDetRequest>
        </ar:FeDetReq>
      </ar:FeCAEReq>
    </ar:FECAESolicitar>
  </soap:Body>
</soap:Envelope>`

    console.log('[ARCA] Requesting CAE from:', endpoint)
    
    // In testing mode, return mock CAE
    if (environment === 'testing') {
      const mockCAE = '71' + Date.now().toString().slice(-12)
      const expDate = new Date()
      expDate.setDate(expDate.getDate() + 10)
      
      return {
        success: true,
        cae: mockCAE,
        caeExpiration: expDate.toISOString().slice(0, 10),
        invoiceNumber: newNumber,
      }
    }
    
    // Production: make actual SOAP call
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': 'http://ar.gov.afip.dif.FEV1/FECAESolicitar',
      },
      body: soapRequest,
    })
    
    const xml = await response.text()
    
    // Parse response
    const caeMatch = xml.match(/<CAE>(\d+)<\/CAE>/)
    const expMatch = xml.match(/<CAEFchVto>(\d+)<\/CAEFchVto>/)
    const errorMatch = xml.match(/<Err>.*?<Msg>(.*?)<\/Msg>.*?<\/Err>/s)
    
    if (caeMatch && expMatch) {
      return {
        success: true,
        cae: caeMatch[1],
        caeExpiration: expMatch[1],
        invoiceNumber: newNumber,
      }
    } else {
      return {
        success: false,
        error: errorMatch ? errorMatch[1] : 'Error desconocido al solicitar CAE',
      }
    }
  } catch (error) {
    console.error('[ARCA] CAE request error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error de conexión con AFIP',
    }
  }
}

/**
 * Generate invoice for a sale
 */
export async function generateInvoice(
  kioskoId: string,
  saleId: string,
  customerDocType: number,
  customerDocNumber: string
): Promise<CAEResponse> {
  const supabase = await createClient()
  
  // Get integration config
  const { data: config } = await supabase
    .from('integration_configs')
    .select('*')
    .eq('kiosko_id', kioskoId)
    .single()
  
  if (!config || !config.arca_enabled) {
    return { success: false, error: 'ARCA no está habilitado para este kiosco' }
  }
  
  if (!config.arca_cuit || !config.arca_certificate || !config.arca_private_key) {
    return { success: false, error: 'Configuración de ARCA incompleta' }
  }
  
  // Get sale data
  const { data: sale } = await supabase
    .from('sales')
    .select('*, sale_items(*)')
    .eq('id', saleId)
    .single()
  
  if (!sale) {
    return { success: false, error: 'Venta no encontrada' }
  }
  
  // Get auth ticket
  const auth = await getAuthTicket(
    config.arca_cuit,
    config.arca_certificate,
    config.arca_private_key,
    config.arca_environment
  )
  
  if (!auth) {
    return { success: false, error: 'Error de autenticación con AFIP' }
  }
  
  // Determine invoice type based on customer doc type
  let invoiceType = INVOICE_TYPES.FACTURA_B
  if (customerDocType === DOC_TYPES.CUIT) {
    invoiceType = INVOICE_TYPES.FACTURA_A
  } else if (customerDocType === DOC_TYPES.CONSUMIDOR_FINAL) {
    invoiceType = INVOICE_TYPES.FACTURA_C
  }
  
  // Calculate amounts (assuming 21% IVA)
  const total = sale.total_amount
  const netAmount = total / 1.21
  const ivaAmount = total - netAmount
  
  const invoiceData: InvoiceData = {
    invoiceType,
    salePoint: config.arca_punto_venta || 1,
    concept: 1, // Products
    docType: customerDocType,
    docNumber: customerDocNumber,
    total,
    netAmount,
    ivaAmount,
    items: sale.sale_items.map((item: any) => ({
      description: item.product_name,
      quantity: item.quantity,
      unitPrice: item.unit_price,
      ivaRate: 21,
      subtotal: item.subtotal,
    })),
  }
  
  // Request CAE
  const result = await requestCAE(
    config.arca_cuit,
    invoiceData,
    auth.token,
    auth.sign,
    config.arca_environment
  )
  
  // Save invoice data if successful
  if (result.success) {
    await supabase
      .from('invoices')
      .insert({
        kiosko_id: kioskoId,
        sale_id: saleId,
        invoice_type: invoiceType,
        invoice_number: result.invoiceNumber,
        cae: result.cae,
        cae_expiration: result.caeExpiration,
        total_amount: total,
        customer_doc_type: customerDocType,
        customer_doc_number: customerDocNumber,
      })
    
    // Update last invoice number in config
    await supabase
      .from('integration_configs')
      .update({ arca_last_invoice_number: result.invoiceNumber })
      .eq('kiosko_id', kioskoId)
  }
  
  return result
}
