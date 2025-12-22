"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  FileText,
  CreditCard,
  Bike,
  ShoppingBag,
  CheckCircle,
  AlertCircle,
  Upload,
  ExternalLink,
  Key,
  Building2,
  RefreshCw,
  Settings,
  Link2,
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface IntegrationConfig {
  id: string
  kiosko_id: string
  // ARCA (AFIP)
  arca_enabled: boolean
  arca_cuit: string | null
  arca_certificate: string | null
  arca_private_key: string | null
  arca_environment: 'testing' | 'production'
  arca_punto_venta: number | null
  arca_verified: boolean
  // Mercado Pago
  mercadopago_enabled: boolean
  mercadopago_access_token: string | null
  mercadopago_public_key: string | null
  mercadopago_verified: boolean
  // Pedidos Ya
  pedidosya_enabled: boolean
  pedidosya_client_id: string | null
  pedidosya_client_secret: string | null
  pedidosya_restaurant_id: string | null
  pedidosya_verified: boolean
  // Rappi
  rappi_enabled: boolean
  rappi_store_id: string | null
  rappi_api_key: string | null
  rappi_verified: boolean
}

const defaultConfig: IntegrationConfig = {
  id: '',
  kiosko_id: '',
  arca_enabled: false,
  arca_cuit: null,
  arca_certificate: null,
  arca_private_key: null,
  arca_environment: 'testing',
  arca_punto_venta: null,
  arca_verified: false,
  mercadopago_enabled: false,
  mercadopago_access_token: null,
  mercadopago_public_key: null,
  mercadopago_verified: false,
  pedidosya_enabled: false,
  pedidosya_client_id: null,
  pedidosya_client_secret: null,
  pedidosya_restaurant_id: null,
  pedidosya_verified: false,
  rappi_enabled: false,
  rappi_store_id: null,
  rappi_api_key: null,
  rappi_verified: false,
}

export default function IntegracionesPage() {
  const [selectedKiosko, setSelectedKiosko] = useState<string>("")
  const [kioscos, setKioscos] = useState<any[]>([])
  const [config, setConfig] = useState<IntegrationConfig>(defaultConfig)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showArcaModal, setShowArcaModal] = useState(false)
  const [showMPModal, setShowMPModal] = useState(false)
  
  const supabase = createClient()

  useEffect(() => {
    loadKioscos()
  }, [])

  useEffect(() => {
    if (selectedKiosko) {
      loadConfig()
    }
  }, [selectedKiosko])

  const loadKioscos = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: kioscosData } = await supabase
      .from("kioscos")
      .select("id, name")
      .eq("owner_id", user.id)

    if (kioscosData && kioscosData.length > 0) {
      setKioscos(kioscosData)
      setSelectedKiosko(kioscosData[0].id)
    }
    setIsLoading(false)
  }

  const loadConfig = async () => {
    setIsLoading(true)
    
    // Try to load existing config
    const { data: existing } = await supabase
      .from("integration_configs")
      .select("*")
      .eq("kiosko_id", selectedKiosko)
      .maybeSingle()

    if (existing) {
      setConfig(existing)
    } else {
      // Create default config
      const { data: created } = await supabase
        .from("integration_configs")
        .insert({ kiosko_id: selectedKiosko })
        .select("*")
        .single()
      
      if (created) {
        setConfig(created)
      } else {
        setConfig({ ...defaultConfig, kiosko_id: selectedKiosko })
      }
    }
    
    setIsLoading(false)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const { error } = await supabase
        .from("integration_configs")
        .upsert({
          ...config,
          kiosko_id: selectedKiosko,
          updated_at: new Date().toISOString(),
        })

      if (error) throw error
      alert("Configuración guardada correctamente")
    } catch (error) {
      console.error("Error saving config:", error)
      alert("Error al guardar la configuración")
    } finally {
      setIsSaving(false)
    }
  }

  const handleTestConnection = async (service: 'arca' | 'mercadopago' | 'pedidosya' | 'rappi') => {
    alert(`Probando conexión con ${service}... (Funcionalidad en desarrollo)`)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
      </div>
    )
  }

  if (kioscos.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-white">Integraciones</h1>
        <div className="border border-cyan-500/20 rounded-xl bg-[#0a0f1a]/50 p-12 text-center">
          <p className="text-gray-400">Primero debes crear un kiosco para configurar integraciones.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Integraciones</h1>
        <p className="text-gray-400 text-sm">Conecta tu negocio con servicios externos</p>
      </div>

      {kioscos.length > 1 && (
        <div className="space-y-2">
          <Label className="text-gray-300">Seleccionar Kiosco</Label>
          <Select value={selectedKiosko} onValueChange={setSelectedKiosko}>
            <SelectTrigger className="bg-[#0a0f1a] border-cyan-500/20 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#0a0f1a] border-cyan-500/20">
              {kioscos.map((kiosko) => (
                <SelectItem key={kiosko.id} value={kiosko.id} className="text-white">
                  {kiosko.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <Tabs defaultValue="arca" className="w-full">
        <TabsList className="bg-[#0a0f1a] border border-cyan-500/10 grid grid-cols-4 w-full">
          <TabsTrigger value="arca" className="data-[state=active]:bg-cyan-500/20 gap-2">
            <FileText className="w-4 h-4" />
            ARCA
          </TabsTrigger>
          <TabsTrigger value="mercadopago" className="data-[state=active]:bg-cyan-500/20 gap-2">
            <CreditCard className="w-4 h-4" />
            Mercado Pago
          </TabsTrigger>
          <TabsTrigger value="pedidosya" className="data-[state=active]:bg-cyan-500/20 gap-2">
            <Bike className="w-4 h-4" />
            Pedidos Ya
          </TabsTrigger>
          <TabsTrigger value="rappi" className="data-[state=active]:bg-cyan-500/20 gap-2">
            <ShoppingBag className="w-4 h-4" />
            Rappi
          </TabsTrigger>
        </TabsList>

        {/* ARCA (AFIP) Tab */}
        <TabsContent value="arca" className="space-y-6 mt-6">
          <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-lg bg-blue-600/20 flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  ARCA (AFIP) - Facturación Electrónica
                  {config.arca_verified && (
                    <span className="flex items-center gap-1 text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                      <CheckCircle className="w-3 h-3" />
                      Conectado
                    </span>
                  )}
                </h3>
                <p className="text-sm text-gray-500">Emite facturas electrónicas autorizadas por AFIP</p>
              </div>
              <Switch
                checked={config.arca_enabled}
                onCheckedChange={(checked) => setConfig({ ...config, arca_enabled: checked })}
                className="data-[state=checked]:bg-blue-500"
              />
            </div>

            {config.arca_enabled && (
              <div className="space-y-6 pt-4 border-t border-cyan-500/10">
                {/* Info Box */}
                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <p className="text-sm text-blue-200 mb-3">
                    <strong>¿Cómo obtener el certificado?</strong>
                  </p>
                  <ol className="text-sm text-blue-200/80 space-y-2 list-decimal list-inside">
                    <li>Ingresa a <a href="https://www.afip.gob.ar/ws/" target="_blank" rel="noopener" className="underline hover:text-blue-300">AFIP WebServices</a> con clave fiscal</li>
                    <li>Genera un certificado digital (CSR) desde tu computadora</li>
                    <li>Sube el CSR a AFIP y descarga el certificado firmado</li>
                    <li>Autoriza el servicio WSFE (Factura Electrónica)</li>
                  </ol>
                  <a 
                    href="https://www.afip.gob.ar/ws/documentacion/" 
                    target="_blank" 
                    rel="noopener"
                    className="inline-flex items-center gap-1 mt-3 text-sm text-blue-400 hover:text-blue-300"
                  >
                    Ver documentación oficial <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* CUIT */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-300">CUIT</Label>
                    <Input
                      placeholder="20-12345678-9"
                      value={config.arca_cuit || ""}
                      onChange={(e) => setConfig({ ...config, arca_cuit: e.target.value })}
                      className="bg-[#0d1424] border-cyan-500/20 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-300">Punto de Venta</Label>
                    <Input
                      type="number"
                      placeholder="1"
                      value={config.arca_punto_venta || ""}
                      onChange={(e) => setConfig({ ...config, arca_punto_venta: parseInt(e.target.value) || null })}
                      className="bg-[#0d1424] border-cyan-500/20 text-white"
                    />
                  </div>
                </div>

                {/* Environment */}
                <div className="space-y-2">
                  <Label className="text-gray-300">Ambiente</Label>
                  <Select 
                    value={config.arca_environment} 
                    onValueChange={(v) => setConfig({ ...config, arca_environment: v as 'testing' | 'production' })}
                  >
                    <SelectTrigger className="bg-[#0a0f1a] border-cyan-500/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0a0f1a] border-cyan-500/20">
                      <SelectItem value="testing" className="text-white">
                        🧪 Testing (Homologación)
                      </SelectItem>
                      <SelectItem value="production" className="text-white">
                        🚀 Producción
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    Usa Testing para pruebas. Cambia a Producción solo cuando estés listo.
                  </p>
                </div>

                {/* Certificate Upload */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-300">Certificado (.crt)</Label>
                    <div className="relative">
                      <Input
                        type="file"
                        accept=".crt,.pem,.cer"
                        className="bg-[#0d1424] border-cyan-500/20 text-white file:bg-cyan-500/20 file:text-cyan-400 file:border-0 file:mr-3"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            const reader = new FileReader()
                            reader.onload = (ev) => {
                              setConfig({ ...config, arca_certificate: ev.target?.result as string })
                            }
                            reader.readAsText(file)
                          }
                        }}
                      />
                      {config.arca_certificate && (
                        <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-400" />
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-300">Clave Privada (.key)</Label>
                    <div className="relative">
                      <Input
                        type="file"
                        accept=".key,.pem"
                        className="bg-[#0d1424] border-cyan-500/20 text-white file:bg-cyan-500/20 file:text-cyan-400 file:border-0 file:mr-3"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            const reader = new FileReader()
                            reader.onload = (ev) => {
                              setConfig({ ...config, arca_private_key: ev.target?.result as string })
                            }
                            reader.readAsText(file)
                          }
                        }}
                      />
                      {config.arca_private_key && (
                        <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Test Connection */}
                <div className="flex gap-3">
                  <Button
                    onClick={() => handleTestConnection('arca')}
                    disabled={!config.arca_cuit || !config.arca_certificate || !config.arca_private_key}
                    className="bg-blue-500 hover:bg-blue-400 text-white"
                  >
                    <Link2 className="w-4 h-4 mr-2" />
                    Probar Conexión
                  </Button>
                </div>

                {!config.arca_verified && config.arca_enabled && (
                  <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 flex gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-200">
                      <p className="font-semibold mb-1">Configuración incompleta</p>
                      <p className="text-amber-300/80">
                        Completa los datos y prueba la conexión para habilitar la facturación electrónica.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Mercado Pago Tab */}
        <TabsContent value="mercadopago" className="space-y-6 mt-6">
          <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-lg bg-sky-500/20 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-sky-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  Mercado Pago
                  {config.mercadopago_verified && (
                    <span className="flex items-center gap-1 text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                      <CheckCircle className="w-3 h-3" />
                      Conectado
                    </span>
                  )}
                </h3>
                <p className="text-sm text-gray-500">Acepta pagos con QR, tarjetas y Point</p>
              </div>
              <Switch
                checked={config.mercadopago_enabled}
                onCheckedChange={(checked) => setConfig({ ...config, mercadopago_enabled: checked })}
                className="data-[state=checked]:bg-sky-500"
              />
            </div>

            {config.mercadopago_enabled && (
              <div className="space-y-6 pt-4 border-t border-cyan-500/10">
                {/* Info Box */}
                <div className="p-4 rounded-lg bg-sky-500/10 border border-sky-500/20">
                  <p className="text-sm text-sky-200 mb-3">
                    <strong>¿Cómo obtener las credenciales?</strong>
                  </p>
                  <ol className="text-sm text-sky-200/80 space-y-2 list-decimal list-inside">
                    <li>Ingresa a <a href="https://www.mercadopago.com.ar/developers/panel" target="_blank" rel="noopener" className="underline hover:text-sky-300">Panel de Desarrolladores</a></li>
                    <li>Crea una aplicación o usa una existente</li>
                    <li>Ve a "Credenciales" y copia el Access Token y Public Key</li>
                    <li>Usa credenciales de TEST para pruebas</li>
                  </ol>
                </div>

                {/* Credentials */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-gray-300">Access Token</Label>
                    <Input
                      type="password"
                      placeholder="APP_USR-..."
                      value={config.mercadopago_access_token || ""}
                      onChange={(e) => setConfig({ ...config, mercadopago_access_token: e.target.value })}
                      className="bg-[#0d1424] border-cyan-500/20 text-white font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-300">Public Key</Label>
                    <Input
                      placeholder="APP_USR-..."
                      value={config.mercadopago_public_key || ""}
                      onChange={(e) => setConfig({ ...config, mercadopago_public_key: e.target.value })}
                      className="bg-[#0d1424] border-cyan-500/20 text-white font-mono"
                    />
                  </div>
                </div>

                {/* Features */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-4 rounded-lg bg-white/5 text-center">
                    <div className="w-10 h-10 rounded-full bg-sky-500/20 flex items-center justify-center mx-auto mb-2">
                      <CreditCard className="w-5 h-5 text-sky-400" />
                    </div>
                    <p className="text-white text-sm font-medium">Checkout Pro</p>
                    <p className="text-xs text-gray-500">Botón de pago</p>
                  </div>
                  <div className="p-4 rounded-lg bg-white/5 text-center">
                    <div className="w-10 h-10 rounded-full bg-sky-500/20 flex items-center justify-center mx-auto mb-2">
                      <span className="text-sky-400 text-lg">◰</span>
                    </div>
                    <p className="text-white text-sm font-medium">QR Dinámico</p>
                    <p className="text-xs text-gray-500">Código por venta</p>
                  </div>
                  <div className="p-4 rounded-lg bg-white/5 text-center">
                    <div className="w-10 h-10 rounded-full bg-sky-500/20 flex items-center justify-center mx-auto mb-2">
                      <Settings className="w-5 h-5 text-sky-400" />
                    </div>
                    <p className="text-white text-sm font-medium">Point</p>
                    <p className="text-xs text-gray-500">Lector de tarjetas</p>
                  </div>
                </div>

                {/* Test Connection */}
                <Button
                  onClick={() => handleTestConnection('mercadopago')}
                  disabled={!config.mercadopago_access_token}
                  className="bg-sky-500 hover:bg-sky-400 text-white"
                >
                  <Link2 className="w-4 h-4 mr-2" />
                  Verificar Credenciales
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Pedidos Ya Tab */}
        <TabsContent value="pedidosya" className="space-y-6 mt-6">
          <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-lg bg-red-500/20 flex items-center justify-center">
                <Bike className="w-6 h-6 text-red-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  Pedidos Ya
                  {config.pedidosya_verified && (
                    <span className="flex items-center gap-1 text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                      <CheckCircle className="w-3 h-3" />
                      Conectado
                    </span>
                  )}
                </h3>
                <p className="text-sm text-gray-500">Sincroniza pedidos y productos con Pedidos Ya</p>
              </div>
              <Switch
                checked={config.pedidosya_enabled}
                onCheckedChange={(checked) => setConfig({ ...config, pedidosya_enabled: checked })}
                className="data-[state=checked]:bg-red-500"
              />
            </div>

            {config.pedidosya_enabled && (
              <div className="space-y-6 pt-4 border-t border-cyan-500/10">
                {/* Info Box */}
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-sm text-red-200 mb-3">
                    <strong>Integración con Pedidos Ya</strong>
                  </p>
                  <p className="text-sm text-red-200/80">
                    Contacta con tu Account Manager de Pedidos Ya para obtener las credenciales de API.
                    La integración permite sincronizar menú, recibir pedidos y actualizar estados automáticamente.
                  </p>
                </div>

                {/* Credentials */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-300">Client ID</Label>
                    <Input
                      placeholder="Tu Client ID"
                      value={config.pedidosya_client_id || ""}
                      onChange={(e) => setConfig({ ...config, pedidosya_client_id: e.target.value })}
                      className="bg-[#0d1424] border-cyan-500/20 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-300">Client Secret</Label>
                    <Input
                      type="password"
                      placeholder="Tu Client Secret"
                      value={config.pedidosya_client_secret || ""}
                      onChange={(e) => setConfig({ ...config, pedidosya_client_secret: e.target.value })}
                      className="bg-[#0d1424] border-cyan-500/20 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300">Restaurant ID</Label>
                  <Input
                    placeholder="ID de tu local en Pedidos Ya"
                    value={config.pedidosya_restaurant_id || ""}
                    onChange={(e) => setConfig({ ...config, pedidosya_restaurant_id: e.target.value })}
                    className="bg-[#0d1424] border-cyan-500/20 text-white"
                  />
                </div>

                {/* Features */}
                <div className="space-y-3">
                  <p className="text-sm text-gray-400 font-medium">Funcionalidades:</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-white/5">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-sm text-white">Sincronizar menú</span>
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-white/5">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-sm text-white">Recibir pedidos</span>
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-white/5">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-sm text-white">Actualizar estados</span>
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-white/5">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-sm text-white">Control de stock</span>
                    </div>
                  </div>
                </div>

                {/* Test Connection */}
                <Button
                  onClick={() => handleTestConnection('pedidosya')}
                  disabled={!config.pedidosya_client_id || !config.pedidosya_client_secret}
                  className="bg-red-500 hover:bg-red-400 text-white"
                >
                  <Link2 className="w-4 h-4 mr-2" />
                  Probar Conexión
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Rappi Tab */}
        <TabsContent value="rappi" className="space-y-6 mt-6">
          <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-orange-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  Rappi
                  {config.rappi_verified && (
                    <span className="flex items-center gap-1 text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                      <CheckCircle className="w-3 h-3" />
                      Conectado
                    </span>
                  )}
                </h3>
                <p className="text-sm text-gray-500">Integra tu catálogo y recibe pedidos de Rappi</p>
              </div>
              <Switch
                checked={config.rappi_enabled}
                onCheckedChange={(checked) => setConfig({ ...config, rappi_enabled: checked })}
                className="data-[state=checked]:bg-orange-500"
              />
            </div>

            {config.rappi_enabled && (
              <div className="space-y-6 pt-4 border-t border-cyan-500/10">
                {/* Info Box */}
                <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
                  <p className="text-sm text-orange-200 mb-3">
                    <strong>Integración con Rappi</strong>
                  </p>
                  <p className="text-sm text-orange-200/80">
                    Solicita acceso al programa de Partners de Rappi para obtener tus credenciales de API.
                    La integración permite gestionar tu catálogo y recibir pedidos en tiempo real.
                  </p>
                </div>

                {/* Credentials */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-gray-300">Store ID</Label>
                    <Input
                      placeholder="ID de tu tienda en Rappi"
                      value={config.rappi_store_id || ""}
                      onChange={(e) => setConfig({ ...config, rappi_store_id: e.target.value })}
                      className="bg-[#0d1424] border-cyan-500/20 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-300">API Key</Label>
                    <Input
                      type="password"
                      placeholder="Tu API Key de Rappi"
                      value={config.rappi_api_key || ""}
                      onChange={(e) => setConfig({ ...config, rappi_api_key: e.target.value })}
                      className="bg-[#0d1424] border-cyan-500/20 text-white"
                    />
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-3">
                  <p className="text-sm text-gray-400 font-medium">Funcionalidades:</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-white/5">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-sm text-white">Catálogo sincronizado</span>
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-white/5">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-sm text-white">Pedidos en tiempo real</span>
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-white/5">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-sm text-white">Disponibilidad de productos</span>
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-white/5">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-sm text-white">Horarios automáticos</span>
                    </div>
                  </div>
                </div>

                {/* Test Connection */}
                <Button
                  onClick={() => handleTestConnection('rappi')}
                  disabled={!config.rappi_store_id || !config.rappi_api_key}
                  className="bg-orange-500 hover:bg-orange-400 text-white"
                >
                  <Link2 className="w-4 h-4 mr-2" />
                  Probar Conexión
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <Button
        onClick={handleSave}
        disabled={isSaving}
        className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold"
      >
        {isSaving ? "Guardando..." : "Guardar Configuración"}
      </Button>
    </div>
  )
}
