"use client"

import { useState, useEffect } from "react"
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
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function ConfiguracionPage() {
  const [businessInfo, setBusinessInfo] = useState({
    name: "Minimarket Express",
    address: "Av. Corrientes 1234, CABA",
    phone: "+54 11 1234-5678",
    email: "contacto@minimarket.com",
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
  const [isVerifying, setIsVerifying] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState("")

  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    loadKioscos()
  }, [])

  useEffect(() => {
    if (selectedKiosko) {
      loadKioskoConfig()
    }
  }, [selectedKiosko])

  const loadKioscos = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { data: kioscosData } = await supabase
      .from("kioscos")
      .select("id, name, whatsapp_phone, telegram_chat_id, phone_verified")
      .eq("owner_id", user.id)

    if (kioscosData && kioscosData.length > 0) {
      setKioscos(kioscosData)
      setSelectedKiosko(kioscosData[0].id)
    }
  }

  const loadKioskoConfig = async () => {
    const kiosko = kioscos.find((k) => k.id === selectedKiosko)
    if (kiosko) {
      setWhatsappConfig({
        enabled: !!kiosko.whatsapp_phone,
        phoneNumber: kiosko.whatsapp_phone || "",
        notifyOnSale: true,
        verified: kiosko.phone_verified,
      })
      setTelegramConfig({
        enabled: !!kiosko.telegram_chat_id,
        chatId: kiosko.telegram_chat_id || "",
        notifyOnSale: true,
        verified: kiosko.phone_verified,
      })
    }
  }

  const handleSave = async () => {
    setIsSaving(true)

    try {
      await supabase
        .from("kioscos")
        .update({
          whatsapp_phone: whatsappConfig.phoneNumber || null,
          telegram_chat_id: telegramConfig.chatId || null,
        })
        .eq("id", selectedKiosko)

      alert("Configuración guardada correctamente")
    } catch (error) {
      console.error("[v0] Error saving config:", error)
      alert("Error al guardar la configuración")
    } finally {
      setIsSaving(false)
    }
  }

  const handleVerifyPhone = async () => {
    if (!whatsappConfig.phoneNumber) {
      alert("Por favor ingresa un número de teléfono")
      return
    }

    setIsVerifying(true)

    try {
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()

      await supabase.from("phone_verifications").insert({
        kiosko_id: selectedKiosko,
        phone_number: whatsappConfig.phoneNumber,
        verification_code: verificationCode,
      })

      alert(
        `Código de verificación generado. En un entorno de producción, este código se enviaría por WhatsApp: ${verificationCode}`,
      )

      await supabase.from("kioscos").update({ phone_verified: true }).eq("id", selectedKiosko)

      setWhatsappConfig({ ...whatsappConfig, verified: true })
      setTelegramConfig({ ...telegramConfig, verified: true })
      loadKioscos()
    } catch (error) {
      console.error("[v0] Error verifying phone:", error)
      alert("Error al verificar el teléfono")
    } finally {
      setIsVerifying(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== "ELIMINAR") {
      alert("Por favor escribe ELIMINAR para confirmar")
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
      alert("Error al eliminar la cuenta: " + error.message)
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

      <Tabs defaultValue="integrations" className="w-full">
        <TabsList className="bg-[#0a0f1a] border border-cyan-500/10">
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
                <div className="space-y-2">
                  <Label className="text-gray-300">Número de WhatsApp (con código de país)</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="+54 9 11 1234-5678"
                      value={whatsappConfig.phoneNumber}
                      onChange={(e) => setWhatsappConfig({ ...whatsappConfig, phoneNumber: e.target.value })}
                      className="flex-1 bg-[#0d1424] border-cyan-500/20 text-white"
                    />
                    <Button
                      onClick={handleVerifyPhone}
                      disabled={isVerifying || whatsappConfig.verified}
                      className="bg-cyan-500 hover:bg-cyan-400 text-black"
                    >
                      {isVerifying ? "Verificando..." : whatsappConfig.verified ? "Verificado" : "Verificar"}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">Ejemplo: +5491112345678 (sin espacios ni guiones)</p>
                </div>

                {!whatsappConfig.verified && (
                  <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 flex gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-200">
                      <p className="font-semibold mb-1">Verificación requerida</p>
                      <p className="text-amber-300/80">
                        Debes verificar tu número de teléfono antes de recibir notificaciones. Esto previene el uso no
                        autorizado.
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
                  <div>
                    <p className="text-white font-medium">Notificar cada venta</p>
                    <p className="text-sm text-gray-500">Recibe un mensaje por cada transacción</p>
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
                <div className="space-y-2">
                  <Label className="text-gray-300">Chat ID</Label>
                  <Input
                    placeholder="123456789"
                    value={telegramConfig.chatId}
                    onChange={(e) => setTelegramConfig({ ...telegramConfig, chatId: e.target.value })}
                    className="bg-[#0d1424] border-cyan-500/20 text-white"
                  />
                  <p className="text-xs text-gray-500">
                    Inicia una conversación con tu bot y usa @userinfobot para obtener tu Chat ID
                  </p>
                </div>

                {!telegramConfig.verified && (
                  <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 flex gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-200">
                      <p className="font-semibold mb-1">Verificación pendiente</p>
                      <p className="text-amber-300/80">
                        Debes verificar tu teléfono en la configuración de WhatsApp primero. Ambos servicios comparten
                        la verificación.
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
                  <div>
                    <p className="text-white font-medium">Notificar cada venta</p>
                    <p className="text-sm text-gray-500">Recibe un mensaje por cada transacción</p>
                  </div>
                  <Switch
                    checked={telegramConfig.notifyOnSale}
                    onCheckedChange={(checked) => setTelegramConfig({ ...telegramConfig, notifyOnSale: checked })}
                    className="data-[state=checked]:bg-cyan-500"
                  />
                </div>

                <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <p className="text-sm text-amber-200 mb-3">
                    <strong>Comandos disponibles:</strong>
                  </p>
                  <ul className="text-sm text-amber-200/80 space-y-1 list-disc list-inside">
                    <li>/ventas - Ver ventas de hoy de este kiosco</li>
                    <li>/mes - Estadísticas del mes de este kiosco</li>
                    <li>/stock - Productos con bajo stock de este kiosco</li>
                    <li>/ayuda - Ver todos los comandos</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="general" className="space-y-6 mt-6">
          {/* Business Info */}
          <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Información del Negocio</h3>
                <p className="text-sm text-gray-500">Datos generales de tu empresa</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Nombre del negocio</Label>
                <Input
                  value={businessInfo.name}
                  onChange={(e) => setBusinessInfo({ ...businessInfo, name: e.target.value })}
                  className="bg-[#0d1424] border-cyan-500/20 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Teléfono</Label>
                <Input
                  value={businessInfo.phone}
                  onChange={(e) => setBusinessInfo({ ...businessInfo, phone: e.target.value })}
                  className="bg-[#0d1424] border-cyan-500/20 text-white"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="text-gray-300">Dirección</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    value={businessInfo.address}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, address: e.target.value })}
                    className="pl-10 bg-[#0d1424] border-cyan-500/20 text-white"
                  />
                </div>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="text-gray-300">Email</Label>
                <Input
                  value={businessInfo.email}
                  onChange={(e) => setBusinessInfo({ ...businessInfo, email: e.target.value })}
                  className="bg-[#0d1424] border-cyan-500/20 text-white"
                />
              </div>
            </div>
          </div>

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
                  <p className="text-white font-medium">{user.name}</p>
                </div>
                <div>
                  <Label className="text-gray-500 text-xs">Email</Label>
                  <p className="text-white font-medium">{user.email}</p>
                </div>
                <div>
                  <Label className="text-gray-500 text-xs">Rol</Label>
                  <p className="text-cyan-400 font-medium">{user.role}</p>
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
    </div>
  )
}
