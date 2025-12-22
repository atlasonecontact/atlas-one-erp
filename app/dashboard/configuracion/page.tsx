"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Building2,
  MapPin,
  User,
  CreditCard,
  Bell,
  Shield,
  Save,
  MessageCircle,
  Send,
  CheckCircle,
  AlertCircle,
  Trash2,
  Phone,
  Store,
  Loader2,
  Settings,
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/toast-provider"
import { PhoneVerificationModal } from "@/components/ui/phone-verification-modal"

interface KioskoData {
  id: string
  name: string
  location: string
  city: string
  phone: string
  cuit: string
}

export default function ConfiguracionPage() {
  const [kioskoData, setKioskoData] = useState<KioskoData>({
    id: "",
    name: "",
    location: "",
    city: "",
    phone: "",
    cuit: "",
  })

  const [paymentMethods, setPaymentMethods] = useState({
    cash: true,
    card: true,
    qr: true,
    transfer: false,
  })

  const [notifications, setNotifications] = useState({
    lowStock: true,
    dailySummary: true,
    newSales: false,
  })

  const [whatsappConfig, setWhatsappConfig] = useState({
    enabled: false,
    phoneNumber: "",
    notifyOnSale: true,
    verified: false,
  })

  const [telegramConfig, setTelegramConfig] = useState({
    enabled: false,
    chatId: "",
    notifyOnSale: true,
    verified: false,
  })

  const [user, setUser] = useState({ name: "", email: "", role: "" })
  const [isSaving, setIsSaving] = useState(false)
  const [selectedKiosko, setSelectedKiosko] = useState<string>("")
  const [kioscos, setKioscos] = useState<any[]>([])
  const [notificationConfig, setNotificationConfig] = useState<any | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isTestingTelegram, setIsTestingTelegram] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState("")
  const [showPhoneVerification, setShowPhoneVerification] = useState(false)
  const [pendingPhone, setPendingPhone] = useState("")
  const originalPhoneRef = useRef("")
  const [telegramStatus, setTelegramStatus] = useState<any>(null)
  const [isCheckingTelegram, setIsCheckingTelegram] = useState(false)

  const supabase = createClient()
  const router = useRouter()
  const toast = useToast()

  useEffect(() => {
    loadKioscos()
    loadUserProfile()
  }, [])

  useEffect(() => {
    if (selectedKiosko) {
      loadKioskoConfig()
      loadKioskoData()
    }
  }, [selectedKiosko])

  const loadUserProfile = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, role")
      .eq("id", authUser.id)
      .single()

    setUser({
      name: profile?.full_name || authUser.email?.split("@")[0] || "",
      email: authUser.email || "",
      role: profile?.role || "owner",
    })
  }

  const loadKioskoData = async () => {
    const { data, error } = await supabase
      .from("kioscos")
      .select("id, name, location, city, phone, cuit")
      .eq("id", selectedKiosko)
      .single()

    if (!error && data) {
      setKioskoData({
        id: data.id,
        name: data.name || "",
        location: data.location || "",
        city: data.city || "",
        phone: data.phone || "",
        cuit: data.cuit || "",
      })
      // Guardar el teléfono original para detectar cambios
      originalPhoneRef.current = data.phone || ""
    }
  }

  const loadKioscos = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { data: kioscosData, error } = await supabase.from("kioscos").select("id, name").eq("owner_id", user.id)

    if (error) {
      console.error("[v0] Error loading kioscos:", error)
      return
    }

    if (kioscosData && kioscosData.length > 0) {
      setKioscos(kioscosData)
      setSelectedKiosko(kioscosData[0].id)
    }
  }

  const ensureNotificationConfig = async (kioskoId: string) => {
    const { data: existing, error: selectError } = await supabase
      .from("notification_configs")
      .select("*")
      .eq("kiosko_id", kioskoId)
      .maybeSingle()

    if (selectError) {
      console.error("[v0] Error loading notification config:", selectError)
      return null
    }

    if (existing) return existing

    const { data: created, error: insertError } = await supabase
      .from("notification_configs")
      .insert({
        kiosko_id: kioskoId,
        whatsapp_enabled: false,
        whatsapp_verified: false,
        telegram_enabled: false,
        telegram_verified: false,
      })
      .select("*")
      .single()

    if (insertError) {
      console.error("[v0] Error creating notification config:", insertError)
      return null
    }

    return created
  }

  const loadKioskoConfig = async () => {
    const config = await ensureNotificationConfig(selectedKiosko)
    setNotificationConfig(config)

    if (!config) return

    setWhatsappConfig({
      enabled: !!config.whatsapp_enabled,
      phoneNumber: config.whatsapp_phone || "",
      notifyOnSale: true,
      verified: !!config.whatsapp_verified,
    })

    setTelegramConfig({
      enabled: !!config.telegram_enabled,
      chatId: config.telegram_chat_id || "",
      notifyOnSale: true,
      verified: !!config.telegram_verified,
    })
  }

  const handleSave = async () => {
    setIsSaving(true)

    try {
      // 1. Save kiosko data
      const { error: kioskoError } = await supabase
        .from("kioscos")
        .update({
          name: kioskoData.name,
          location: kioskoData.location,
          city: kioskoData.city,
          phone: kioskoData.phone,
          cuit: kioskoData.cuit,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedKiosko)

      if (kioskoError) throw kioskoError

      // 2. Save notification config
      const config = notificationConfig || (await ensureNotificationConfig(selectedKiosko))
      if (!config) throw new Error("No se pudo cargar la configuración de notificaciones")

      const whatsappPhoneChanged = (config.whatsapp_phone || "") !== (whatsappConfig.phoneNumber || "")
      const telegramChatChanged = (config.telegram_chat_id || "") !== (telegramConfig.chatId || "")

      const { error } = await supabase
        .from("notification_configs")
        .update({
          whatsapp_enabled: whatsappConfig.enabled,
          whatsapp_phone: whatsappConfig.phoneNumber || null,
          whatsapp_verified: whatsappPhoneChanged ? false : !!config.whatsapp_verified,
          telegram_enabled: telegramConfig.enabled,
          telegram_chat_id: telegramConfig.chatId || null,
          telegram_verified: telegramChatChanged ? false : !!config.telegram_verified,
          updated_at: new Date().toISOString(),
        })
        .eq("kiosko_id", selectedKiosko)

      if (error) throw error

      await loadKioskoConfig()
      await loadKioskoData()

      // Update kioscos list with new name
      setKioscos(prev => prev.map(k => 
        k.id === selectedKiosko ? { ...k, name: kioskoData.name } : k
      ))

      toast.success("Configuración guardada", "Los cambios se aplicaron correctamente")
    } catch (error) {
      console.error("[v0] Error saving config:", error)
      toast.error("Error al guardar", "No se pudo guardar la configuración")
    } finally {
      setIsSaving(false)
    }
  }

  const handleVerifyPhone = async () => {
    if (!whatsappConfig.phoneNumber) {
      toast.warning("Falta información", "Ingresá un número de teléfono")
      return
    }

    setIsVerifying(true)

    try {
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()

      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

      await supabase.from("phone_verifications").insert({
        kiosko_id: selectedKiosko,
        phone_number: whatsappConfig.phoneNumber,
        verification_code: verificationCode,
        expires_at: expiresAt,
      })

      toast.success("Verificación iniciada", `Código: ${verificationCode} (en producción se enviaría por WhatsApp)`)

      await supabase
        .from("notification_configs")
        .update({
          whatsapp_verified: true,
          telegram_verified: true,
          updated_at: new Date().toISOString(),
        })
        .eq("kiosko_id", selectedKiosko)

      setWhatsappConfig({ ...whatsappConfig, verified: true })
      setTelegramConfig({ ...telegramConfig, verified: true })
      await loadKioskoConfig()
    } catch (error) {
      console.error("[v0] Error verifying phone:", error)
      toast.error("Error de verificación", "No se pudo verificar el teléfono")
    } finally {
      setIsVerifying(false)
    }
  }

  const handleTestTelegram = async () => {
    if (!telegramConfig.chatId) {
      toast.warning("Falta información", "Ingresá tu Chat ID de Telegram")
      return
    }

    setIsTestingTelegram(true)

    try {
      const response = await fetch("/api/notifications/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId: telegramConfig.chatId,
          message: `✅ <b>¡Test exitoso!</b>\n\n🎉 Tu configuración de Telegram está funcionando correctamente.\n\n📱 Chat ID: <code>${telegramConfig.chatId}</code>\n🏪 Kiosco: ${kioskoData.name || "Mi Kiosco"}\n\nAhora vas a recibir notificaciones de ventas automáticamente.`,
        }),
      })

      if (response.ok) {
        // Mark as verified on success
        await supabase
          .from("notification_configs")
          .update({
            telegram_verified: true,
            updated_at: new Date().toISOString(),
          })
          .eq("kiosko_id", selectedKiosko)

        setTelegramConfig({ ...telegramConfig, verified: true })
        await loadKioskoConfig()
        toast.success("¡Mensaje enviado!", "Revisá tu Telegram para confirmarlo")
      } else {
        const error = await response.json()
        console.error("[v0] Telegram test error:", error)
        toast.error("Error al enviar", "Verificá que el Chat ID sea correcto")
      }
    } catch (error) {
      console.error("[v0] Error testing telegram:", error)
      toast.error("Error de conexión", "No se pudo enviar el mensaje de prueba")
    } finally {
      setIsTestingTelegram(false)
    }
  }

  // Función para verificar el estado del webhook de Telegram
  const checkTelegramStatus = async () => {
    setIsCheckingTelegram(true)
    try {
      const response = await fetch("/api/telegram/setup")
      const data = await response.json()
      setTelegramStatus(data)
      
      if (!data.configured) {
        toast.warning("Telegram no configurado", data.error || "Falta el token del bot")
      } else if (data.webhook?.lastErrorMessage) {
        toast.error("Error en webhook", data.webhook.lastErrorMessage)
      } else {
        toast.success("Telegram OK", `Bot: @${data.bot?.username || 'desconocido'}`)
      }
    } catch (error) {
      console.error("[v0] Error checking telegram:", error)
      toast.error("Error", "No se pudo verificar el estado de Telegram")
    } finally {
      setIsCheckingTelegram(false)
    }
  }

  // Función para configurar el webhook de Telegram
  const setupTelegramWebhook = async () => {
    setIsCheckingTelegram(true)
    try {
      const response = await fetch("/api/telegram/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      const data = await response.json()
      
      if (data.success) {
        toast.success("Webhook configurado", "El bot de Telegram está listo")
        await checkTelegramStatus()
      } else {
        toast.error("Error", data.error || "No se pudo configurar el webhook")
      }
    } catch (error) {
      console.error("[v0] Error setting up telegram:", error)
      toast.error("Error", "No se pudo configurar el webhook")
    } finally {
      setIsCheckingTelegram(false)
    }
  }

  // Manejar el cambio de teléfono - requiere verificación
  const handlePhoneChange = (newPhone: string) => {
    setKioskoData({ ...kioskoData, phone: newPhone })
  }

  // Al hacer blur del campo teléfono, verificar si cambió
  const handlePhoneBlur = () => {
    const cleanedOriginal = originalPhoneRef.current.replace(/\D/g, '')
    const cleanedNew = kioskoData.phone.replace(/\D/g, '')
    
    // Si el teléfono cambió y no está vacío
    if (cleanedNew && cleanedOriginal !== cleanedNew) {
      setPendingPhone(kioskoData.phone)
      setShowPhoneVerification(true)
      // Restaurar el teléfono original hasta que se verifique
      setKioskoData({ ...kioskoData, phone: originalPhoneRef.current })
    }
  }

  // Cuando se verifica el teléfono exitosamente
  const handlePhoneVerified = async (verifiedPhone: string) => {
    setShowPhoneVerification(false)
    setKioskoData({ ...kioskoData, phone: verifiedPhone })
    originalPhoneRef.current = verifiedPhone
    
    // Guardar el teléfono verificado en la base de datos
    try {
      await supabase
        .from("kioscos")
        .update({ 
          phone: verifiedPhone,
          updated_at: new Date().toISOString()
        })
        .eq("id", selectedKiosko)

      // Marcar WhatsApp como no verificado ya que el teléfono cambió
      await supabase
        .from("notification_configs")
        .update({
          whatsapp_verified: false,
          updated_at: new Date().toISOString(),
        })
        .eq("kiosko_id", selectedKiosko)

      setWhatsappConfig({ ...whatsappConfig, verified: false })
      
      toast.success("Teléfono actualizado", "El nuevo número fue verificado y guardado")
      await loadKioskoConfig()
    } catch (error) {
      console.error("[v0] Error saving verified phone:", error)
      toast.error("Error", "No se pudo guardar el teléfono")
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== "ELIMINAR") {
      toast.warning("Confirmación requerida", "Escribí ELIMINAR para confirmar")
      return
    }

    if (!confirm("Esta acción es irreversible. ¿Estás completamente seguro?")) {
      return
    }

    setIsDeleting(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // Call the delete function
      const { error: rpcError } = await supabase.rpc("delete_user_account", { user_id: user.id })

      if (rpcError) throw rpcError

      // Sign out
      await supabase.auth.signOut()
      router.push("/")
    } catch (error: any) {
      console.error("[v0] Error deleting account:", error)
      toast.error("Error al eliminar", error.message || "No se pudo eliminar la cuenta")
    } finally {
      setIsDeleting(false)
    }
  }

  if (kioscos.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-white">Configuración</h1>
        <div className="border border-cyan-500/20 rounded-xl bg-[#0a0f1a]/50 p-12 text-center">
          <p className="text-gray-400">Primero debes crear un kiosco para configurar notificaciones.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Configuración</h1>
        <p className="text-gray-400 text-sm">Administra la configuración de tu negocio</p>
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

      <Tabs defaultValue="kiosko" className="w-full">
        <TabsList className="bg-[#0a0f1a] border border-cyan-500/10">
          <TabsTrigger value="kiosko" className="data-[state=active]:bg-cyan-500/20">
            Mi Kiosco
          </TabsTrigger>
          <TabsTrigger value="integrations" className="data-[state=active]:bg-cyan-500/20">
            Integraciones
          </TabsTrigger>
          <TabsTrigger value="general" className="data-[state=active]:bg-cyan-500/20">
            General
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-cyan-500/20">
            Notificaciones
          </TabsTrigger>
          <TabsTrigger value="danger" className="data-[state=active]:bg-red-500/20">
            Zona Peligrosa
          </TabsTrigger>
        </TabsList>

        {/* Mi Kiosco Tab */}
        <TabsContent value="kiosko" className="space-y-6 mt-6">
          <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <Store className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Datos del Kiosco</h3>
                <p className="text-sm text-gray-500">Información de tu local que aparece en tickets y reportes</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Nombre del Kiosco</Label>
                <Input
                  value={kioskoData.name}
                  onChange={(e) => setKioskoData({ ...kioskoData, name: e.target.value })}
                  placeholder="Mi Kiosco Express"
                  className="bg-[#0d1424] border-cyan-500/20 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">CUIT</Label>
                <Input
                  value={kioskoData.cuit}
                  onChange={(e) => setKioskoData({ ...kioskoData, cuit: e.target.value })}
                  placeholder="20-12345678-9"
                  className="bg-[#0d1424] border-cyan-500/20 text-white"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="text-gray-300">Dirección</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    value={kioskoData.location}
                    onChange={(e) => setKioskoData({ ...kioskoData, location: e.target.value })}
                    placeholder="Av. Corrientes 1234"
                    className="pl-10 bg-[#0d1424] border-cyan-500/20 text-white"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Ciudad</Label>
                <Input
                  value={kioskoData.city}
                  onChange={(e) => setKioskoData({ ...kioskoData, city: e.target.value })}
                  placeholder="Buenos Aires"
                  className="bg-[#0d1424] border-cyan-500/20 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Teléfono del local</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    value={kioskoData.phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    onBlur={handlePhoneBlur}
                    placeholder="+54 11 1234-5678"
                    className="pl-10 bg-[#0d1424] border-cyan-500/20 text-white"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  📱 Este teléfono se usa para WhatsApp/Telegram. Cambios requieren verificación.
                </p>
              </div>
            </div>

            <div className="mt-6 p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
              <p className="text-sm text-cyan-200">
                💡 <strong>Tip:</strong> Estos datos aparecen en los tickets de venta y reportes. Mantenerlos actualizados ayuda a identificar tu negocio.
              </p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6 mt-6">
          <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-green-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  WhatsApp Business
                  {whatsappConfig.verified && (
                    <span className="flex items-center gap-1 text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                      <CheckCircle className="w-3 h-3" />
                      Verificado
                    </span>
                  )}
                </h3>
                <p className="text-sm text-gray-500">Recibe notificaciones y consulta estadísticas por WhatsApp</p>
              </div>
              <Switch
                checked={whatsappConfig.enabled}
                onCheckedChange={(checked) => setWhatsappConfig({ ...whatsappConfig, enabled: checked })}
                className="data-[state=checked]:bg-green-500"
              />
            </div>

            {whatsappConfig.enabled && (
              <div className="space-y-4 pt-4 border-t border-cyan-500/10">
                {/* Step by step guide */}
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <p className="text-sm font-medium text-green-400 mb-3">📱 Cómo configurar WhatsApp (2 pasos):</p>
                  <ol className="text-sm text-green-200/90 space-y-2 list-decimal list-inside">
                    <li>
                      <span className="font-medium">Ingresá tu número de WhatsApp</span> con el código de país (+54 para Argentina)
                    </li>
                    <li>
                      <span className="font-medium">Tocá "Verificar"</span> y te llegará un código para confirmar
                    </li>
                  </ol>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300">Tu número de WhatsApp</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ej: +5491112345678"
                      value={whatsappConfig.phoneNumber}
                      onChange={(e) => setWhatsappConfig({ ...whatsappConfig, phoneNumber: e.target.value })}
                      className="flex-1 bg-[#0d1424] border-cyan-500/20 text-white text-lg font-mono"
                    />
                    <Button
                      onClick={handleVerifyPhone}
                      disabled={isVerifying || whatsappConfig.verified}
                      className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold px-6"
                    >
                      {isVerifying ? "Verificando..." : whatsappConfig.verified ? "✓ Verificado" : "Verificar"}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    💡 Formato correcto: <span className="font-mono">+5491112345678</span> (sin espacios ni guiones)
                  </p>
                </div>

                {!whatsappConfig.verified && (
                  <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 flex gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-200">
                      <p className="font-semibold mb-1">⚠️ Verificación requerida</p>
                      <p className="text-amber-300/80">
                        Necesitás verificar tu número para empezar a recibir notificaciones. Es un paso de seguridad.
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
                  <div>
                    <p className="text-white font-medium">🔔 Notificar cada venta</p>
                    <p className="text-sm text-gray-500">Recibís un mensaje cada vez que se hace una venta</p>
                  </div>
                  <Switch
                    checked={whatsappConfig.notifyOnSale}
                    onCheckedChange={(checked) => setWhatsappConfig({ ...whatsappConfig, notifyOnSale: checked })}
                    className="data-[state=checked]:bg-cyan-500"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Send className="w-5 h-5 text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  Telegram Bot
                  {telegramConfig.verified && (
                    <span className="flex items-center gap-1 text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                      <CheckCircle className="w-3 h-3" />
                      Verificado
                    </span>
                  )}
                </h3>
                <p className="text-sm text-gray-500">Consulta estadísticas y recibe alertas desde Telegram</p>
              </div>
              <Switch
                checked={telegramConfig.enabled}
                onCheckedChange={(checked) => setTelegramConfig({ ...telegramConfig, enabled: checked })}
                className="data-[state=checked]:bg-blue-500"
              />
            </div>

            {telegramConfig.enabled && (
              <div className="space-y-4 pt-4 border-t border-cyan-500/10">
                {/* Admin: Telegram webhook status */}
                <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-purple-400 flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      Estado del Bot (Admin)
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={checkTelegramStatus}
                        disabled={isCheckingTelegram}
                        className="border-purple-500/30 text-purple-300 text-xs"
                      >
                        {isCheckingTelegram ? <Loader2 className="w-3 h-3 animate-spin" /> : "Verificar"}
                      </Button>
                      <Button
                        size="sm"
                        onClick={setupTelegramWebhook}
                        disabled={isCheckingTelegram}
                        className="bg-purple-500 hover:bg-purple-400 text-white text-xs"
                      >
                        Activar Webhook
                      </Button>
                    </div>
                  </div>
                  {telegramStatus && (
                    <div className="text-xs space-y-1 text-purple-200/80">
                      <p>Bot: {telegramStatus.bot?.username ? `@${telegramStatus.bot.username}` : 'No configurado'}</p>
                      <p>Webhook: {telegramStatus.webhook?.url || 'No configurado'}</p>
                      {telegramStatus.webhook?.lastErrorMessage && (
                        <p className="text-red-400">Error: {telegramStatus.webhook.lastErrorMessage}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Step by step guide */}
                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <p className="text-sm font-medium text-blue-400 mb-3">📱 Cómo configurar Telegram (3 pasos simples):</p>
                  <ol className="text-sm text-blue-200/90 space-y-3 list-decimal list-inside">
                    <li>
                      <span className="font-medium">Abrí Telegram</span> y buscá nuestro bot: <span className="font-mono bg-blue-500/20 px-2 py-0.5 rounded">@AtlasOneBot</span>
                    </li>
                    <li>
                      <span className="font-medium">Mandá el mensaje</span> <span className="font-mono bg-blue-500/20 px-2 py-0.5 rounded">/start</span> al bot
                    </li>
                    <li>
                      <span className="font-medium">El bot te va a responder con tu Chat ID</span> - Copialo y pegalo abajo
                    </li>
                  </ol>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300">Tu Chat ID de Telegram</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ej: 123456789"
                      value={telegramConfig.chatId}
                      onChange={(e) => setTelegramConfig({ ...telegramConfig, chatId: e.target.value })}
                      className="flex-1 bg-[#0d1424] border-cyan-500/20 text-white text-lg font-mono"
                    />
                    <Button
                      onClick={handleTestTelegram}
                      disabled={isTestingTelegram || !telegramConfig.chatId}
                      className="bg-blue-500 hover:bg-blue-400 text-white font-semibold px-6"
                    >
                      {isTestingTelegram ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Enviando...
                        </>
                      ) : telegramConfig.verified ? (
                        "✓ Probar de nuevo"
                      ) : (
                        "🧪 Probar"
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Pegá el Chat ID que te dio el bot y tocá "Probar" para verificar que funcione.
                  </p>
                </div>

                {telegramConfig.verified ? (
                  <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 flex gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-green-200">
                      <p className="font-semibold mb-1">✅ Telegram configurado correctamente</p>
                      <p className="text-green-300/80">
                        Vas a recibir notificaciones de ventas automáticamente en este chat.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 flex gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-200">
                      <p className="font-semibold mb-1">⚠️ Verificación pendiente</p>
                      <p className="text-amber-300/80">
                        Ingresá tu Chat ID y tocá "Probar" para verificar que todo funcione.
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
                  <div>
                    <p className="text-white font-medium">🔔 Notificar cada venta</p>
                    <p className="text-sm text-gray-500">Recibís un mensaje cada vez que se hace una venta</p>
                  </div>
                  <Switch
                    checked={telegramConfig.notifyOnSale}
                    onCheckedChange={(checked) => setTelegramConfig({ ...telegramConfig, notifyOnSale: checked })}
                    className="data-[state=checked]:bg-cyan-500"
                  />
                </div>

                <div className="p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                  <p className="text-sm font-medium text-cyan-400 mb-3">
                    🤖 ¿Qué podés hacer desde Telegram?
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="p-2 rounded bg-cyan-500/10">
                      <span className="font-mono text-cyan-300">/ventas</span>
                      <p className="text-gray-400 text-xs mt-1">Ver ventas de hoy</p>
                    </div>
                    <div className="p-2 rounded bg-cyan-500/10">
                      <span className="font-mono text-cyan-300">/mes</span>
                      <p className="text-gray-400 text-xs mt-1">Resumen del mes</p>
                    </div>
                    <div className="p-2 rounded bg-cyan-500/10">
                      <span className="font-mono text-cyan-300">/stock</span>
                      <p className="text-gray-400 text-xs mt-1">Productos con poco stock</p>
                    </div>
                    <div className="p-2 rounded bg-cyan-500/10">
                      <span className="font-mono text-cyan-300">/ayuda</span>
                      <p className="text-gray-400 text-xs mt-1">Ver todos los comandos</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="general" className="space-y-6 mt-6">
          {/* User Profile */}
          <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <User className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Mi Perfil</h3>
                <p className="text-sm text-gray-500">Tu información de cuenta</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold text-2xl">
                {user.name?.charAt(0) || "U"}
              </div>
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500 text-xs">Nombre</Label>
                  <p className="text-white font-medium">{user.name || "Sin nombre"}</p>
                </div>
                <div>
                  <Label className="text-gray-500 text-xs">Email</Label>
                  <p className="text-white font-medium">{user.email}</p>
                </div>
                <div>
                  <Label className="text-gray-500 text-xs">Rol</Label>
                  <p className="text-cyan-400 font-medium capitalize">{user.role === "owner" ? "Dueño" : user.role}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Métodos de Pago</h3>
                <p className="text-sm text-gray-500">Habilita o deshabilita métodos de pago</p>
              </div>
            </div>

            <div className="space-y-4">
              {[
                { key: "cash", label: "Efectivo", desc: "Pagos en efectivo" },
                { key: "card", label: "Tarjeta", desc: "Débito y crédito" },
                { key: "qr", label: "QR", desc: "Mercado Pago, otros" },
                { key: "transfer", label: "Transferencia", desc: "Transferencia bancaria" },
              ].map((method) => (
                <div key={method.key} className="flex items-center justify-between p-4 rounded-lg bg-white/5">
                  <div>
                    <p className="text-white font-medium">{method.label}</p>
                    <p className="text-sm text-gray-500">{method.desc}</p>
                  </div>
                  <Switch
                    checked={paymentMethods[method.key as keyof typeof paymentMethods]}
                    onCheckedChange={(checked) => setPaymentMethods({ ...paymentMethods, [method.key]: checked })}
                    className="data-[state=checked]:bg-cyan-500"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Security */}
          <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Seguridad</h3>
                <p className="text-sm text-gray-500">Opciones de seguridad de tu cuenta</p>
              </div>
            </div>

            <div className="space-y-4">
              <Button variant="outline" className="border-cyan-500/20 text-gray-400 hover:text-white bg-transparent">
                Cambiar contraseña
              </Button>
              <Button
                variant="outline"
                className="border-cyan-500/20 text-gray-400 hover:text-white bg-transparent ml-3"
              >
                Activar 2FA
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6 mt-6">
          {/* Notifications */}
          <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <Bell className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Notificaciones</h3>
                <p className="text-sm text-gray-500">Configura tus alertas</p>
              </div>
            </div>

            <div className="space-y-4">
              {[
                { key: "lowStock", label: "Stock bajo", desc: "Alerta cuando un producto tenga poco stock" },
                { key: "dailySummary", label: "Resumen diario", desc: "Recibe un resumen al final del día" },
                { key: "newSales", label: "Nuevas ventas", desc: "Notificación por cada venta" },
              ].map((notif) => (
                <div key={notif.key} className="flex items-center justify-between p-4 rounded-lg bg-white/5">
                  <div>
                    <p className="text-white font-medium">{notif.label}</p>
                    <p className="text-sm text-gray-500">{notif.desc}</p>
                  </div>
                  <Switch
                    checked={notifications[notif.key as keyof typeof notifications]}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, [notif.key]: checked })}
                    className="data-[state=checked]:bg-cyan-500"
                  />
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="danger" className="space-y-6 mt-6">
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6">
            <div className="flex items-start gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2">Eliminar Cuenta</h3>
                <p className="text-sm text-gray-400 mb-4">
                  Esta acción eliminará permanentemente tu cuenta, todos tus kioscos, empleados, productos, ventas y
                  configuraciones. Esta acción no se puede deshacer.
                </p>

                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                    <p className="text-sm text-red-200 font-semibold mb-2">¿Qué se eliminará?</p>
                    <ul className="text-sm text-red-300/80 space-y-1 list-disc list-inside">
                      <li>Tu cuenta de usuario y perfil</li>
                      <li>Todos los kioscos de tu cadena</li>
                      <li>Todos los empleados y sus accesos</li>
                      <li>Todo el historial de ventas y productos</li>
                      <li>Todas las configuraciones y datos</li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-300">
                      Para confirmar, escribe <span className="font-bold text-red-400">ELIMINAR</span>
                    </Label>
                    <Input
                      value={deleteConfirmation}
                      onChange={(e) => setDeleteConfirmation(e.target.value)}
                      placeholder="ELIMINAR"
                      className="bg-[#0d1424] border-red-500/30 text-white"
                    />
                  </div>

                  <Button
                    onClick={handleDeleteAccount}
                    disabled={isDeleting || deleteConfirmation !== "ELIMINAR"}
                    className="w-full bg-red-500 hover:bg-red-600 text-white"
                  >
                    {isDeleting ? "Eliminando cuenta..." : "Eliminar mi cuenta permanentemente"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Save button */}
      <Button
        onClick={handleSave}
        disabled={isSaving}
        className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold gap-2"
      >
        <Save className="w-4 h-4" />
        {isSaving ? "Guardando..." : "Guardar Cambios"}
      </Button>

      {/* Phone Verification Modal */}
      <PhoneVerificationModal
        open={showPhoneVerification}
        onClose={() => {
          setShowPhoneVerification(false)
          setPendingPhone("")
        }}
        onVerified={handlePhoneVerified}
        currentPhone={originalPhoneRef.current}
        newPhone={pendingPhone}
        kioskoName={kioskoData.name}
      />
    </div>
  )
}
