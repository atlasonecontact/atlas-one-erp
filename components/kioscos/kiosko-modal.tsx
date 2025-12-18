"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { MapPin, Phone, Building2 } from "lucide-react"

type Plan = {
  id: string
  plan_name: string
  display_name: string
  price: number
  max_employees: number | null
  max_products: number | null
}

type Kiosko = {
  id: string
  name: string
  location: string
  cuit: string
  phone: string
  whatsapp_phone: string | null
  background_color: string
  accent_color: string
  subscription_plan_id: string | null
}

type KioskoModalProps = {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  kiosko?: Kiosko | null
}

export function KioskoModal({ isOpen, onClose, onSuccess, kiosko }: KioskoModalProps) {
  const [plans, setPlans] = useState<Plan[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    cuit: "",
    phone: "",
    whatsapp_phone: "",
    background_color: "#030712",
    accent_color: "#00d9ff",
    subscription_plan_id: "",
  })

  const supabase = createClient()

  useEffect(() => {
    if (isOpen) {
      loadPlans()
      if (kiosko) {
        setFormData({
          name: kiosko.name,
          location: kiosko.location,
          cuit: kiosko.cuit || "",
          phone: kiosko.phone || "",
          whatsapp_phone: kiosko.whatsapp_phone || "",
          background_color: kiosko.background_color,
          accent_color: kiosko.accent_color,
          subscription_plan_id: kiosko.subscription_plan_id || "",
        })
      } else {
        setFormData({
          name: "",
          location: "",
          cuit: "",
          phone: "",
          whatsapp_phone: "",
          background_color: "#030712",
          accent_color: "#00d9ff",
          subscription_plan_id: "",
        })
      }
    }
  }, [isOpen, kiosko])

  const loadPlans = async () => {
    const { data, error } = await supabase
      .from("subscription_plans")
      .select("id, plan_name, display_name, price, max_employees, max_products")
      .order("price")

    if (error) {
      console.error("[v0] Error loading subscription plans:", error)
      return
    }

    setPlans(data || [])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        alert("Error: No se encontró el usuario")
        setIsLoading(false)
        return
      }

      const kioskoPayload = {
        name: formData.name,
        location: formData.location,
        cuit: formData.cuit,
        phone: formData.phone,
        whatsapp_phone: formData.whatsapp_phone ? formData.whatsapp_phone : null,
        background_color: formData.background_color,
        accent_color: formData.accent_color,
        subscription_plan_id: formData.subscription_plan_id ? formData.subscription_plan_id : null,
      }

      if (kiosko) {
        const { error } = await supabase.from("kioscos").update(kioskoPayload).eq("id", kiosko.id)

        if (error) throw error
      } else {
        const { error } = await supabase.from("kioscos").insert({
          ...kioskoPayload,
          owner_id: user.id, // Use owner_id instead of chain_id
          status: "active",
        })

        if (error) throw error
      }

      onSuccess()
      onClose()
    } catch (error: any) {
      console.error("[v0] Error creating/updating kiosko:", error)
      alert(error.message || "Error al guardar el kiosco")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-[#0a0f1a] border-cyan-500/20 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">{kiosko ? "Editar Kiosco" : "Agregar Nuevo Kiosco"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-gray-300">
              Nombre del Kiosco
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej: Kiosco La Esquina"
              className="bg-[#0d1424] border-cyan-500/20 text-white"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location" className="text-gray-300">
              Ubicación
            </Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Dirección completa"
                className="pl-10 bg-[#0d1424] border-cyan-500/20 text-white"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cuit" className="text-gray-300">
              CUIT/CUIL <span className="text-red-400">*</span>
            </Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                id="cuit"
                value={formData.cuit}
                onChange={(e) => setFormData({ ...formData, cuit: e.target.value })}
                placeholder="XX-XXXXXXXX-X"
                className="pl-10 bg-[#0d1424] border-cyan-500/20 text-white"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-gray-300">
              Teléfono para Notificaciones <span className="text-red-400">*</span>
            </Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value, whatsapp_phone: e.target.value })}
                placeholder="+54 9 11 1234-5678"
                className="pl-10 bg-[#0d1424] border-cyan-500/20 text-white"
                required
              />
            </div>
            <p className="text-xs text-gray-500">
              Este número se usará para WhatsApp y Telegram. Formato: +5491112345678
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="plan" className="text-gray-300">
              Plan de Suscripción
            </Label>
            <Select
              value={formData.subscription_plan_id}
              onValueChange={(v) => setFormData({ ...formData, subscription_plan_id: v })}
            >
              <SelectTrigger className="bg-[#0d1424] border-cyan-500/20 text-white">
                <SelectValue placeholder="Seleccionar plan" />
              </SelectTrigger>
              <SelectContent className="bg-[#0d1424] border-cyan-500/20">
                {plans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id} className="text-white">
                    {plan.display_name || plan.plan_name} - ${plan.price}/mes ({plan.max_employees ?? "-"} empleados, {plan.max_products ?? "-"} productos)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300">Personalización de Colores</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bgColor" className="text-gray-400 text-xs">
                  Fondo de la App
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="bgColor"
                    type="color"
                    value={formData.background_color}
                    onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                    className="w-12 h-10 p-1 bg-[#0d1424] border-cyan-500/20"
                  />
                  <Input
                    type="text"
                    value={formData.background_color}
                    onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                    className="flex-1 bg-[#0d1424] border-cyan-500/20 text-white text-xs"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="accentColor" className="text-gray-400 text-xs">
                  Color Principal
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="accentColor"
                    type="color"
                    value={formData.accent_color}
                    onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })}
                    className="w-12 h-10 p-1 bg-[#0d1424] border-cyan-500/20"
                  />
                  <Input
                    type="text"
                    value={formData.accent_color}
                    onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })}
                    className="flex-1 bg-[#0d1424] border-cyan-500/20 text-white text-xs"
                  />
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-500">Los colores se aplicarán a la interfaz del dashboard del kiosco</p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-cyan-500/30 text-cyan-400 bg-transparent"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-black">
              {isLoading ? "Guardando..." : kiosko ? "Actualizar" : "Crear Kiosco"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
