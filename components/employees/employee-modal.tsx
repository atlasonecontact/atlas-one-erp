"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { createClient } from "@/lib/supabase/client"
import { Copy, Check, AlertCircle } from "lucide-react"

type Employee = {
  id: string
  first_name: string
  last_name: string
  username: string
  auto_generated_email: string
  custom_role: string | null
  permissions: {
    can_sell: boolean
    can_view_reports: boolean
    can_manage_inventory: boolean
    can_manage_employees: boolean
  }
  is_active: boolean
}

type EmployeeModalProps = {
  open: boolean
  onClose: () => void
  employee: Employee | null
  onSuccess: () => void
  kioskoId: string
}

export function EmployeeModal({ open, onClose, employee, onSuccess, kioskoId }: EmployeeModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showCredentials, setShowCredentials] = useState(false)
  const [generatedCredentials, setGeneratedCredentials] = useState<{
    username: string
  } | null>(null)
  const [copied, setCopied] = useState(false)
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    custom_role: "",
    permissions: {
      can_sell: true,
      can_view_reports: false,
      can_manage_inventory: false,
      can_manage_employees: false,
    },
    is_active: true,
  })

  const supabase = createClient()

  useEffect(() => {
    if (employee) {
      setFormData({
        first_name: employee.first_name,
        last_name: employee.last_name,
        email: employee.auto_generated_email,
        custom_role: employee.custom_role || "",
        permissions: employee.permissions,
        is_active: employee.is_active,
      })
      setGeneratedCredentials(null)
      setShowCredentials(false)
    } else {
      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        custom_role: "",
        permissions: {
          can_sell: true,
          can_view_reports: false,
          can_manage_inventory: false,
          can_manage_employees: false,
        },
        is_active: true,
      })
      setGeneratedCredentials(null)
      setShowCredentials(false)
    }
  }, [employee, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (employee) {
        const { error } = await supabase
          .from("employees")
          .update({
            first_name: formData.first_name,
            last_name: formData.last_name,
            custom_role: formData.custom_role || null,
            permissions: formData.permissions,
            is_active: formData.is_active,
          })
          .eq("id", employee.id)

        if (error) throw error

        onSuccess()
        onClose()
      } else {
        const username = formData.email
          .split("@")[0]
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "")

        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: Math.random().toString(36).slice(-16) + Math.random().toString(36).slice(-16),
          options: {
            data: {
              full_name: `${formData.first_name} ${formData.last_name}`,
              role: "employee",
            },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        })

        if (authError) throw authError

        const { error: insertError } = await supabase.from("employees").insert({
          kiosko_id: kioskoId,
          user_id: authData.user?.id,
          first_name: formData.first_name,
          last_name: formData.last_name,
          username: username,
          auto_generated_email: formData.email,
          custom_role: formData.custom_role || null,
          permissions: formData.permissions,
          is_active: formData.is_active,
        })

        if (insertError) throw insertError

        setGeneratedCredentials({ username })
        setShowCredentials(true)
        onSuccess()
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const copyCredentials = async () => {
    if (!generatedCredentials) return
    const text = `Usuario: ${generatedCredentials.username}\nEmail: ${formData.email}`
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (showCredentials && generatedCredentials) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px] bg-[#0a0f1a] border-cyan-500/20">
          <DialogHeader>
            <DialogTitle className="text-white">Empleado Creado Exitosamente</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-cyan-200">
                  <p className="font-semibold mb-1">Email de verificación enviado</p>
                  <p className="text-cyan-300/80">
                    Se envió un correo a <span className="font-medium">{formData.email}</span> para que el empleado
                    verifique su cuenta y establezca su contraseña.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-gray-300">Usuario</Label>
                <div className="relative">
                  <Input
                    value={generatedCredentials.username}
                    readOnly
                    className="bg-[#0d1424] border-cyan-500/20 text-white pr-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">Email</Label>
                <div className="relative">
                  <Input value={formData.email} readOnly className="bg-[#0d1424] border-cyan-500/20 text-white pr-10" />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={copyCredentials}
                className="flex-1 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 bg-transparent"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar Info
                  </>
                )}
              </Button>
              <Button onClick={onClose} className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-black">
                Cerrar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-[#0a0f1a] border-cyan-500/20 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">{employee ? "Editar Empleado" : "Agregar Nuevo Empleado"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name" className="text-gray-300">
                Nombre
              </Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                placeholder="Juan"
                className="bg-[#0d1424] border-cyan-500/20 text-white"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_name" className="text-gray-300">
                Apellido
              </Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                placeholder="Pérez"
                className="bg-[#0d1424] border-cyan-500/20 text-white"
                required
              />
            </div>
          </div>

          {!employee && (
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="empleado@ejemplo.com"
                className="bg-[#0d1424] border-cyan-500/20 text-white"
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="custom_role" className="text-gray-300">
              Rol Personalizado
            </Label>
            <Input
              id="custom_role"
              value={formData.custom_role}
              onChange={(e) => setFormData({ ...formData, custom_role: e.target.value })}
              placeholder="Ej: Cajero, Supervisor, Vendedor..."
              className="bg-[#0d1424] border-cyan-500/20 text-white"
            />
          </div>

          <div className="space-y-3">
            <Label className="text-gray-300">Permisos</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="can_sell"
                  checked={formData.permissions.can_sell}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      permissions: { ...formData.permissions, can_sell: checked as boolean },
                    })
                  }
                  className="border-cyan-500/30 data-[state=checked]:bg-cyan-500"
                />
                <label htmlFor="can_sell" className="text-sm text-gray-300 cursor-pointer">
                  Puede realizar ventas
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="can_view_reports"
                  checked={formData.permissions.can_view_reports}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      permissions: { ...formData.permissions, can_view_reports: checked as boolean },
                    })
                  }
                  className="border-cyan-500/30 data-[state=checked]:bg-cyan-500"
                />
                <label htmlFor="can_view_reports" className="text-sm text-gray-300 cursor-pointer">
                  Puede ver reportes
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="can_manage_inventory"
                  checked={formData.permissions.can_manage_inventory}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      permissions: { ...formData.permissions, can_manage_inventory: checked as boolean },
                    })
                  }
                  className="border-cyan-500/30 data-[state=checked]:bg-cyan-500"
                />
                <label htmlFor="can_manage_inventory" className="text-sm text-gray-300 cursor-pointer">
                  Puede gestionar inventario
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="can_manage_employees"
                  checked={formData.permissions.can_manage_employees}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      permissions: { ...formData.permissions, can_manage_employees: checked as boolean },
                    })
                  }
                  className="border-cyan-500/30 data-[state=checked]:bg-cyan-500"
                />
                <label htmlFor="can_manage_employees" className="text-sm text-gray-300 cursor-pointer">
                  Puede gestionar empleados
                </label>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked as boolean })}
              className="border-cyan-500/30 data-[state=checked]:bg-cyan-500"
            />
            <label htmlFor="is_active" className="text-sm text-gray-300 cursor-pointer">
              Empleado activo
            </label>
          </div>

          {!employee && (
            <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-3 text-sm text-cyan-200">
              <p className="font-semibold mb-1">Verificación por email</p>
              <p className="text-cyan-300/80">
                Se enviará un correo de verificación al empleado para que establezca su propia contraseña y active su
                cuenta.
              </p>
            </div>
          )}

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
              {isLoading ? "Procesando..." : employee ? "Actualizar" : "Crear Empleado"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
