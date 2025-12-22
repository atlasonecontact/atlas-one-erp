/**
 * ARCA (AFIP) - Facturación Electrónica Argentina
 * 
 * Este módulo implementa la conexión con los web services de AFIP:
 * - WSAA: Web Service de Autenticación y Autorización
 * - WSFE: Web Service de Factura Electrónica
 * 
 * Documentación oficial: https://www.afip.gob.ar/ws/documentacion/
 */

import { createServerClient } from '@/lib/supabase/server'

// URLs de los servicios
const WSAA_URLS = {
  testing: 'https://wsaahomo.afip.gov.ar/ws/services/LoginCms',
  production: 'https://wsaa.afip.gov.ar/ws/services/LoginCms'
}

const WSFE_URLS = {
  testing: 'https://wswhomo.afip.gov.ar/wsfev1/service.asmx',
  production: 'https://servicios1.afip.gov.ar/wsfev1/service.asmx'
}

// Tipos de comprobante
export const TIPOS_COMPROBANTE = {
  FACTURA_A: 1,
  NOTA_DEBITO_A: 2,
  NOTA_CREDITO_A: 3,
  FACTURA_B: 6,
  NOTA_DEBITO_B: 7,
  NOTA_CREDITO_B: 8,
  FACTURA_C: 11,
  NOTA_DEBITO_C: 12,
  NOTA_CREDITO_C: 13,
  RECIBO_A: 4,
  RECIBO_B: 9,
  RECIBO_C: 15,
} as const

// Tipos de documento
export const TIPOS_DOCUMENTO = {
  CUIT: 80,
  CUIL: 86,
  CDI: 87,
  DNI: 96,
  CONSUMIDOR_FINAL: 99,
  PASAPORTE: 94,
} as const

// Condiciones de IVA
export const CONDICIONES_IVA = {
  RESPONSABLE_INSCRIPTO: 1,
  MONOTRIBUTISTA: 6,
  EXENTO: 4,
  CONSUMIDOR_FINAL: 5,
} as const

// Alícuotas de IVA
export const ALICUOTAS_IVA = {
  IVA_0: { id: 3, porcentaje: 0 },
  IVA_10_5: { id: 4, porcentaje: 10.5 },
  IVA_21: { id: 5, porcentaje: 21 },
  IVA_27: { id: 6, porcentaje: 27 },
  EXENTO: { id: 2, porcentaje: 0 },
  NO_GRAVADO: { id: 1, porcentaje: 0 },
} as const

export interface ARCAConfig {
  cuit: string
  certificate: string
  privateKey: string
  environment: 'testing' | 'production'
  puntoVenta: number
}

export interface FacturaData {
  tipoComprobante: number
  puntoVenta: number
  concepto: 1 | 2 | 3 // 1: Productos, 2: Servicios, 3: Ambos
  tipoDocumento: number
  numeroDocumento: string
  importeTotal: number
  importeNeto: number
  importeIVA: number
  importeExento?: number
  fechaServicioDesde?: string // YYYYMMDD
  fechaServicioHasta?: string
  fechaVencimientoPago?: string
  items: FacturaItem[]
}

export interface FacturaItem {
  descripcion: string
  cantidad: number
  unidad: string
  precioUnitario: number
  bonificacion?: number
  subtotal: number
  alicuotaIVA: number
  importeIVA: number
}

export interface FacturaResponse {
  success: boolean
  cae?: string
  caeVencimiento?: string
  numeroComprobante?: number
  error?: string
}

/**
 * Cliente para ARCA (AFIP)
 */
export class ARCAClient {
  private config: ARCAConfig
  private token: string | null = null
  private sign: string | null = null
  private tokenExpiration: Date | null = null

  constructor(config: ARCAConfig) {
    this.config = config
  }

  /**
   * Obtiene el token de autenticación del WSAA
   */
  private async authenticate(): Promise<boolean> {
    // Si ya tenemos un token válido, lo reutilizamos
    if (this.token && this.tokenExpiration && new Date() < this.tokenExpiration) {
      return true
    }

    try {
      // Crear el TRA (Ticket de Requerimiento de Acceso)
      const now = new Date()
      const expiration = new Date(now.getTime() + 12 * 60 * 60 * 1000) // 12 horas
      
      const tra = `<?xml version="1.0" encoding="UTF-8"?>
        <loginTicketRequest version="1.0">
          <header>
            <uniqueId>${Date.now()}</uniqueId>
            <generationTime>${now.toISOString()}</generationTime>
            <expirationTime>${expiration.toISOString()}</expirationTime>
          </header>
          <service>wsfe</service>
        </loginTicketRequest>`

      // En producción, aquí firmaríamos el TRA con el certificado
      // usando crypto o una librería como node-forge
      // Por ahora, simulamos la respuesta en testing
      
      if (this.config.environment === 'testing') {
        // En testing, AFIP permite tokens de prueba
        this.token = 'TOKEN_DE_PRUEBA'
        this.sign = 'SIGN_DE_PRUEBA'
        this.tokenExpiration = expiration
        return true
      }

      // TODO: Implementar firma CMS con certificado real
      // const signedTRA = await this.signCMS(tra)
      // const response = await this.callWSAA(signedTRA)
      // this.token = response.token
      // this.sign = response.sign
      // this.tokenExpiration = new Date(response.expirationTime)

      return true
    } catch (error) {
      console.error('[ARCA] Error en autenticación:', error)
      return false
    }
  }

  /**
   * Obtiene el último número de comprobante autorizado
   */
  async getUltimoComprobante(tipoComprobante: number): Promise<number> {
    await this.authenticate()

    // En testing, devolvemos un número simulado
    if (this.config.environment === 'testing') {
      return Math.floor(Math.random() * 1000) + 1
    }

    // TODO: Llamar a FECompUltimoAutorizado
    return 0
  }

  /**
   * Solicita un CAE para una factura
   */
  async solicitarCAE(factura: FacturaData): Promise<FacturaResponse> {
    const authenticated = await this.authenticate()
    if (!authenticated) {
      return { success: false, error: 'Error de autenticación con AFIP' }
    }

    try {
      // Obtener el próximo número de comprobante
      const ultimoNro = await this.getUltimoComprobante(factura.tipoComprobante)
      const nuevoNro = ultimoNro + 1

      // En testing, simulamos la respuesta
      if (this.config.environment === 'testing') {
        const cae = `${Date.now()}`.slice(-14).padStart(14, '0')
        const vencimiento = new Date()
        vencimiento.setDate(vencimiento.getDate() + 10)
        
        return {
          success: true,
          cae,
          caeVencimiento: vencimiento.toISOString().split('T')[0].replace(/-/g, ''),
          numeroComprobante: nuevoNro,
        }
      }

      // TODO: Implementar llamada real a FECAESolicitar
      // const soapEnvelope = this.buildFECAESolicitarRequest(factura, nuevoNro)
      // const response = await this.callWSFE(soapEnvelope)
      // return this.parseFECAEResponse(response)

      return { success: false, error: 'No implementado para producción aún' }
    } catch (error: any) {
      console.error('[ARCA] Error solicitando CAE:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Consulta los puntos de venta habilitados
   */
  async getPuntosVenta(): Promise<{ id: number; tipo: string; bloqueado: boolean }[]> {
    await this.authenticate()

    if (this.config.environment === 'testing') {
      return [
        { id: 1, tipo: 'CAE', bloqueado: false },
        { id: 2, tipo: 'CAE', bloqueado: false },
      ]
    }

    // TODO: Llamar a FEParamGetPtosVenta
    return []
  }

  /**
   * Consulta los tipos de comprobantes disponibles
   */
  async getTiposComprobante(): Promise<{ id: number; descripcion: string }[]> {
    await this.authenticate()

    if (this.config.environment === 'testing') {
      return Object.entries(TIPOS_COMPROBANTE).map(([desc, id]) => ({
        id,
        descripcion: desc.replace(/_/g, ' '),
      }))
    }

    // TODO: Llamar a FEParamGetTiposCbte
    return []
  }
}

/**
 * Crea una factura electrónica y la guarda en la base de datos
 */
export async function emitirFactura(
  kioskoId: string,
  saleId: string,
  facturaData: FacturaData
): Promise<FacturaResponse> {
  const supabase = await createServerClient()

  // Obtener la configuración de integración del kiosco
  const { data: config } = await supabase
    .from('integration_configs')
    .select('*')
    .eq('kiosko_id', kioskoId)
    .single()

  if (!config?.arca_enabled) {
    return { success: false, error: 'Facturación electrónica no habilitada' }
  }

  if (!config.arca_cuit || !config.arca_certificate || !config.arca_private_key) {
    return { success: false, error: 'Configuración de ARCA incompleta' }
  }

  // Crear cliente de ARCA
  const arcaClient = new ARCAClient({
    cuit: config.arca_cuit,
    certificate: config.arca_certificate,
    privateKey: config.arca_private_key,
    environment: config.arca_environment || 'testing',
    puntoVenta: config.arca_punto_venta || 1,
  })

  // Solicitar CAE
  const resultado = await arcaClient.solicitarCAE(facturaData)

  if (resultado.success) {
    // Guardar la factura en la base de datos
    await supabase.from('invoices').insert({
      kiosko_id: kioskoId,
      sale_id: saleId,
      tipo_comprobante: facturaData.tipoComprobante,
      punto_venta: facturaData.puntoVenta,
      numero_comprobante: resultado.numeroComprobante,
      cae: resultado.cae,
      cae_vencimiento: resultado.caeVencimiento,
      cuit_emisor: config.arca_cuit,
      tipo_documento_receptor: facturaData.tipoDocumento,
      numero_documento_receptor: facturaData.numeroDocumento,
      importe_total: facturaData.importeTotal,
      importe_neto: facturaData.importeNeto,
      importe_iva: facturaData.importeIVA,
      importe_exento: facturaData.importeExento || 0,
    })
  }

  return resultado
}

/**
 * Genera el código de barras para la factura (según RG 1702)
 */
export function generarCodigoBarras(
  cuit: string,
  tipoComprobante: number,
  puntoVenta: number,
  cae: string,
  fechaVencimiento: string // YYYYMMDD
): string {
  const data = [
    cuit.replace(/-/g, '').padStart(11, '0'),
    tipoComprobante.toString().padStart(3, '0'),
    puntoVenta.toString().padStart(5, '0'),
    cae.padStart(14, '0'),
    fechaVencimiento,
  ].join('')

  // Calcular dígito verificador (módulo 10)
  let suma = 0
  for (let i = 0; i < data.length; i++) {
    const digit = parseInt(data[data.length - 1 - i])
    suma += i % 2 === 0 ? digit * 3 : digit
  }
  const verificador = (10 - (suma % 10)) % 10

  return data + verificador
}
