"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { MapPin, Phone, Building2, AlertCircle } from "lucide-react"
import { useFormValidation, validateCuit, FieldError } from "@/lib/hooks/use-form-validation"
import { useToast } from "@/components/ui/toast-provider"

type Kiosko = {
  id: string
  name: string
  location: string
  cuit: string
  phone: string
  whatsapp_phone: string | null
  background_color: string
  accent_color: string
}

type KioskoModalProps = {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  kiosko?: Kiosko | null
}

type FormDataType = {
  name: string
  location: string
  cuit: string
  phone: string
  whatsapp_phone: string
  background_color: string
  accent_color: string
}

export function KioskoModal({ isOpen, onClose, onSuccess, kiosko }: KioskoModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<FormDataType>({
    name: "",
    location: "",
    cuit: "",
    phone: "",
    whatsapp_phone: "",
    background_color: "#030712",
    accent_color: "#00d9ff",
  })

  const supabase = createClient()
  const toast = useToast()

  // Form validation
  const { errors, validateForm, validateField, setFieldTouched, getFieldError, clearErrors } = 
    useFormValidation<FormDataType>({
      name: { 
        required: "El nombre del kiosco es obligatorio",
        minLength: { value: 2, message: "Mínimo 2 caracteres" },
        maxLength: { value: 100, message: "Máximo 100 caracteres" },
      },
      location: { 
        required: "La ubicación es obligatoria",
        minLength: { value: 5, message: "Ingresa una dirección más completa" },
      },
      cuit: { 
        required: "El CUIT/CUIL es obligatorio",
        cuit: "CUIT/CUIL inválido. Formato: XX-XXXXXXXX-X",
      },
      phone: { 
        required: "El teléfono es obligatorio",
        phone: "Teléfono inválido. Ejemplo: +54 9 11 1234-5678",
      },
    })

  useEffect(() => {
    if (isOpen) {
      clearErrors()
      if (kiosko) {
        setFormData({
          name: kiosko.name,
          location: kiosko.location,
          cuit: kiosko.cuit || "",
          phone: kiosko.phone || "",
          whatsapp_phone: kiosko.whatsapp_phone || "",
          background_color: kiosko.background_color,
          accent_color: kiosko.accent_color,
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
        })
      }
    }
  }, [isOpen, kiosko])

  const handleFieldChange = (field: keyof FormDataType, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Validate on change after first touch
    validateField(field, value, formData)
  }

  const handleFieldBlur = (field: keyof FormDataType) => {
    setFieldTouched(field)
    validateField(field, formData[field], formData)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate all fields
    if (!validateForm(formData)) {
      toast.warning("Revisa los campos", "Hay errores en el formulario")
      return
    }

    setIsLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        toast.error("Error", "No se encontró el usuario")
        setIsLoading(false)
        return
      }

      const kioskoPayload = {
        name: formData.name.trim(),
        location: formData.location.trim(),
        cuit: formData.cuit.trim(),
        phone: formData.phone.trim(),
        whatsapp_phone: formData.whatsapp_phone.trim() || formData.phone.trim(),
        background_color: formData.background_color,
        accent_color: formData.accent_color,
      }

      if (kiosko) {
        const { error } = await supabase.from("kioscos").update(kioskoPayload).eq("id", kiosko.id)

        if (error) throw error
        toast.success("Kiosco actualizado", `"${formData.name}" fue actualizado correctamente`)
      } else {
        const { error } = await supabase.from("kioscos").insert({
          ...kioskoPayload,
          owner_id: user.id,
          status: "active",
        })

        if (error) throw error
        toast.success("Kiosco creado", `"${formData.name}" fue creado correctamente`)
      }

      onSuccess()
      onClose()
    } catch (error: any) {
      console.error("[v0] Error creating/updating kiosko:", error)
      toast.error("Error al guardar", error.message || "No se pudo guardar el kiosco")
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
              Nombre del Kiosco <span className="text-red-400">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleFieldChange("name", e.target.value)}
              onBlur={() => handleFieldBlur("name")}
              placeholder="Ej: Kiosco La Esquina"
              className={`bg-[#0d1424] border-cyan-500/20 text-white ${getFieldError("name") ? "border-red-500/50" : ""}`}
            />
            <FieldError error={getFieldError("name")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location" className="text-gray-300">
              Ubicación <span className="text-red-400">*</span>
            </Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleFieldChange("location", e.target.value)}
                onBlur={() => handleFieldBlur("location")}
                placeholder="Dirección completa"
                className={`pl-10 bg-[#0d1424] border-cyan-500/20 text-white ${getFieldError("location") ? "border-red-500/50" : ""}`}
              />
            </div>
            <FieldError error={getFieldError("location")} />
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
                onChange={(e) => handleFieldChange("cuit", e.target.value)}
                onBlur={() => handleFieldBlur("cuit")}
                placeholder="XX-XXXXXXXX-X"
                className={`pl-10 bg-[#0d1424] border-cyan-500/20 text-white ${getFieldError("cuit") ? "border-red-500/50" : ""}`}
              />
            </div>
            <FieldError error={getFieldError("cuit")} />
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
                onChange={(e) => {
                  handleFieldChange("phone", e.target.value)
                  if (!formData.whatsapp_phone) {
                    setFormData(prev => ({ ...prev, whatsapp_phone: e.target.value }))
                  }
                }}
                onBlur={() => handleFieldBlur("phone")}
                placeholder="+54 9 11 1234-5678"
                className={`pl-10 bg-[#0d1424] border-cyan-500/20 text-white ${getFieldError("phone") ? "border-red-500/50" : ""}`}
              />
            </div>
            <FieldError error={getFieldError("phone")} />
            <p className="text-xs text-gray-500">
              Este número se usará para WhatsApp y Telegram. Formato: +5491112345678
            </p>
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
