"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { createClient } from "@/lib/supabase/client"
import { 
  Copy, Check, User, Clock, Shield, Eye, EyeOff, 
  RefreshCw, Calendar, Phone, MapPin, FileText, AlertCircle
} from "lucide-react"

// Types
type Shift = {
  id?: string
  day_of_week: number
  start_time: string
  end_time: string
  break_start?: string
  break_end?: string
  is_active: boolean
}

type Employee = {
  id: string
  name: string
  username: string
  pin?: string
  email?: string
  phone?: string
  document_id?: string
  address?: string
  birth_date?: string
  emergency_contact?: string
  emergency_phone?: string
  position?: string
  custom_role: string | null
  salary?: number
  hourly_rate?: number
  hire_date?: string
  notes?: string
  permissions: {
    can_sell: boolean
    can_view_reports: boolean
    can_manage_inventory: boolean
    can_manage_employees: boolean
  }
  status: string
}

type EmployeeModalProps = {
  open: boolean
  onClose: () => void
  employee: Employee | null
  onSuccess: () => void
  kioskoId: string
}

const DAYS = [
  { value: 1, label: "Lunes", short: "Lun" },
  { value: 2, label: "Martes", short: "Mar" },
  { value: 3, label: "Miércoles", short: "Mié" },
  { value: 4, label: "Jueves", short: "Jue" },
  { value: 5, label: "Viernes", short: "Vie" },
  { value: 6, label: "Sábado", short: "Sáb" },
  { value: 0, label: "Domingo", short: "Dom" },
]

export function EmployeeModal({ open, onClose, employee, onSuccess, kioskoId }: EmployeeModalProps) {
  const [activeTab, setActiveTab] = useState<"info" | "shifts" | "permissions">("info")
  const [isLoading, setIsLoading] = useState(false)
  const [showCredentials, setShowCredentials] = useState(false)
  const [showPin, setShowPin] = useState(false)
  const [copied, setCopied] = useState(false)
  const [shifts, setShifts] = useState<Shift[]>([])
  const [generatedCredentials, setGeneratedCredentials] = useState<{
    username: string
    email: string
    password: string
    pin: string
  } | null>(null)

  // Generate random password
  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
    let password = ''
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
  }

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    pin: "",
    phone: "",
    document_id: "",
    address: "",
    birth_date: "",
    emergency_contact: "",
    emergency_phone: "",
    position: "",
    custom_role: "",
    salary: "",
    hourly_rate: "",
    hire_date: "",
    notes: "",
    permissions: {
      can_sell: true,
      can_view_reports: false,
      can_manage_inventory: false,
      can_manage_employees: false,
    },
    status: "active",
  })

  const supabase = createClient()

  // Generate random 4-digit PIN
  const generatePin = () => {
    const pin = Math.floor(1000 + Math.random() * 9000).toString()
    setFormData({ ...formData, pin })
  }

  // Load employee data and shifts
  useEffect(() => {
    if (employee) {
      setFormData({
        name: employee.name || "",
        email: employee.email || "",
        pin: employee.pin || "",
        phone: employee.phone || "",
        document_id: employee.document_id || "",
        address: employee.address || "",
        birth_date: employee.birth_date || "",
        emergency_contact: employee.emergency_contact || "",
        emergency_phone: employee.emergency_phone || "",
        position: employee.position || "",
        custom_role: employee.custom_role || "",
        salary: employee.salary?.toString() || "",
        hourly_rate: employee.hourly_rate?.toString() || "",
        hire_date: employee.hire_date || "",
        notes: employee.notes || "",
        permissions: employee.permissions || {
          can_sell: true,
          can_view_reports: false,
          can_manage_inventory: false,
          can_manage_employees: false,
        },
        status: employee.status || "active",
      })
      loadShifts(employee.id)
    } else {
      resetForm()
    }
    setGeneratedCredentials(null)
    setShowCredentials(false)
    setActiveTab("info")
  }, [employee, open])

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      pin: "",
      phone: "",
      document_id: "",
      address: "",
      birth_date: "",
      emergency_contact: "",
      emergency_phone: "",
      position: "",
      custom_role: "",
      salary: "",
      hourly_rate: "",
      hire_date: "",
      notes: "",
      permissions: {
        can_sell: true,
        can_view_reports: false,
        can_manage_inventory: false,
        can_manage_employees: false,
      },
      status: "active",
    })
    setShifts([])
  }

  const loadShifts = async (employeeId: string) => {
    const { data } = await supabase
      .from("employee_shifts")
      .select("*")
      .eq("employee_id", employeeId)
      .order("day_of_week")
    
    if (data) {
      setShifts(data.map(s => ({
        id: s.id,
        day_of_week: s.day_of_week,
        start_time: s.start_time,
        end_time: s.end_time,
        break_start: s.break_start,
        break_end: s.break_end,
        is_active: s.is_active
      })))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (employee) {
        // Update existing employee
        const { error } = await supabase
          .from("employees")
          .update({
            name: formData.name,
            pin: formData.pin || null,
            phone: formData.phone || null,
            document_id: formData.document_id || null,
            address: formData.address || null,
            birth_date: formData.birth_date || null,
            emergency_contact: formData.emergency_contact || null,
            emergency_phone: formData.emergency_phone || null,
            position: formData.position || null,
            custom_role: formData.custom_role || null,
            salary: formData.salary ? parseFloat(formData.salary) : null,
            hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null,
            notes: formData.notes || null,
            permissions: formData.permissions,
            status: formData.status,
            updated_at: new Date().toISOString(),
          })
          .eq("id", employee.id)

        if (error) throw error

        // Save shifts
        await saveShifts(employee.id)

        onSuccess()
        onClose()
      } else {
        // Create new employee
        const username = formData.name
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]/g, "")
          .substring(0, 20)
        
        const uniqueUsername = `${username}_${Date.now().toString(36)}`
        const pin = formData.pin || Math.floor(1000 + Math.random() * 9000).toString()
        const password = generatePassword()
        
        // Generate email for the employee (use provided or generate one)
        const employeeEmail = formData.email || `${uniqueUsername}@empleado.atlasone.app`

        // Try to create auth user for the employee using signUp
        // Note: This may not work if email confirmation is required
        let authUserId: string | null = null
        
        try {
          // First, try using signUp (works from client)
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: employeeEmail,
            password: password,
            options: {
              data: {
                full_name: formData.name,
                role: 'employee'
              }
            }
          })

          if (!signUpError && signUpData?.user) {
            authUserId = signUpData.user.id
          } else {
            console.log('SignUp info:', signUpError?.message || 'User may need email confirmation')
          }
        } catch (authError) {
          console.log('Auth creation skipped:', authError)
          // Continue without auth user - employee will use PIN and saved credentials
        }

        // Save credentials to database for owner reference
        // This allows the owner to see the employee's login credentials
        await supabase.rpc('register_employee_user', {
          p_employee_id: null, // Will be set after insert
          p_email: employeeEmail,
          p_password: password
        }).catch(() => {}) // Ignore if RPC doesn't exist yet

        const { data: newEmployee, error: insertError } = await supabase
          .from("employees")
          .insert({
            kiosko_id: kioskoId,
            user_id: authUserId,
            name: formData.name,
            username: uniqueUsername,
            email: employeeEmail,
            temp_password: password, // Store temp password for owner reference
            pin: pin,
            phone: formData.phone || null,
            document_id: formData.document_id || null,
            address: formData.address || null,
            birth_date: formData.birth_date || null,
            emergency_contact: formData.emergency_contact || null,
            emergency_phone: formData.emergency_phone || null,
            position: formData.position || null,
            custom_role: formData.custom_role || null,
            salary: formData.salary ? parseFloat(formData.salary) : null,
            hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null,
            hire_date: formData.hire_date || new Date().toISOString().split('T')[0],
            notes: formData.notes || null,
            permissions: formData.permissions,
            status: formData.status,
          })
          .select()
          .single()

        if (insertError) throw insertError

        // Save shifts for new employee
        if (newEmployee && shifts.length > 0) {
          await saveShifts(newEmployee.id)
        }

        setGeneratedCredentials({ 
          username: uniqueUsername, 
          email: employeeEmail,
          password: password,
          pin 
        })
        setShowCredentials(true)
        onSuccess()
      }
    } catch (error: any) {
      console.error("Error:", error)
      alert(`Error: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const saveShifts = async (employeeId: string) => {
    // Delete existing shifts
    await supabase
      .from("employee_shifts")
      .delete()
      .eq("employee_id", employeeId)

    // Insert new shifts
    const shiftsToInsert = shifts
      .filter(s => s.start_time && s.end_time)
      .map(s => ({
        employee_id: employeeId,
        kiosko_id: kioskoId,
        day_of_week: s.day_of_week,
        start_time: s.start_time,
        end_time: s.end_time,
        break_start: s.break_start || null,
        break_end: s.break_end || null,
        is_active: s.is_active,
      }))

    if (shiftsToInsert.length > 0) {
      await supabase.from("employee_shifts").insert(shiftsToInsert)
    }
  }

  const toggleShiftDay = (dayValue: number) => {
    const existingShift = shifts.find(s => s.day_of_week === dayValue)
    if (existingShift) {
      setShifts(shifts.filter(s => s.day_of_week !== dayValue))
    } else {
      setShifts([...shifts, {
        day_of_week: dayValue,
        start_time: "08:00",
        end_time: "16:00",
        is_active: true
      }])
    }
  }

  const updateShift = (dayValue: number, field: keyof Shift, value: string | boolean) => {
    setShifts(shifts.map(s => 
      s.day_of_week === dayValue ? { ...s, [field]: value } : s
    ))
  }

  const copyCredentials = async () => {
    if (!generatedCredentials) return
    const text = `Empleado: ${formData.name}\nEmail: ${generatedCredentials.email}\nContraseña: ${generatedCredentials.password}\nUsuario: ${generatedCredentials.username}\nPIN: ${generatedCredentials.pin}`
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Credentials screen after creation
  if (showCredentials && generatedCredentials) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[550px] bg-[#0a0f1a] border-cyan-500/20">
          <DialogHeader>
            <DialogTitle className="text-white">Empleado Creado Exitosamente</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <div className="flex gap-3">
                <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-green-200">
                  <p className="font-semibold mb-1">Empleado registrado</p>
                  <p className="text-green-300/80">
                    <span className="font-medium">{formData.name}</span> fue agregado correctamente.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-gray-300">Nombre</Label>
                <Input
                  value={formData.name}
                  readOnly
                  className="bg-[#0d1424] border-cyan-500/20 text-white"
                />
              </div>

              {/* Login credentials */}
              <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-lg p-4 space-y-3">
                <p className="text-sm font-medium text-cyan-400">Credenciales de Acceso al Sistema</p>
                
                <div className="space-y-2">
                  <Label className="text-gray-300">Email</Label>
                  <Input 
                    value={generatedCredentials.email} 
                    readOnly 
                    className="bg-[#0d1424] border-cyan-500/20 text-white font-mono text-sm" 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-gray-300">Contraseña</Label>
                  <Input 
                    value={generatedCredentials.password} 
                    readOnly 
                    className="bg-[#0d1424] border-cyan-500/20 text-white font-mono text-lg tracking-wider" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-gray-300">Usuario</Label>
                  <Input 
                    value={generatedCredentials.username} 
                    readOnly 
                    className="bg-[#0d1424] border-cyan-500/20 text-white font-mono text-sm" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">PIN de Caja</Label>
                  <div className="relative">
                    <Input 
                      value={generatedCredentials.pin} 
                      readOnly 
                      className="bg-[#0d1424] border-cyan-500/20 text-white font-mono text-2xl text-center tracking-widest" 
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
              <div className="flex gap-2 text-yellow-400 text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">¡IMPORTANTE! Guarda estas credenciales.</p>
                  <p className="text-yellow-300/80 mt-1">El empleado usará el email y contraseña para iniciar sesión, y el PIN para operaciones de caja.</p>
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
                    Copiar Todo
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

  // Main form
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-[#0a0f1a] border-cyan-500/20 max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-white">
            {employee ? "Editar Empleado" : "Agregar Nuevo Empleado"}
          </DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-cyan-500/10 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab("info")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
              activeTab === "info"
                ? "bg-cyan-500/20 text-cyan-400"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <User className="w-4 h-4" />
            Información
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("shifts")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
              activeTab === "shifts"
                ? "bg-cyan-500/20 text-cyan-400"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Clock className="w-4 h-4" />
            Turnos
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("permissions")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
              activeTab === "permissions"
                ? "bg-cyan-500/20 text-cyan-400"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Shield className="w-4 h-4" />
            Permisos
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          {/* Tab: Info */}
          {activeTab === "info" && (
            <div className="space-y-4 py-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="name" className="text-gray-300">
                    Nombre Completo <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Juan Pérez"
                    className="bg-[#0d1424] border-cyan-500/20 text-white"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="position" className="text-gray-300">Puesto</Label>
                  <Input
                    id="position"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    placeholder="Cajero"
                    className="bg-[#0d1424] border-cyan-500/20 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pin" className="text-gray-300">PIN de Acceso</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="pin"
                        type={showPin ? "text" : "password"}
                        value={formData.pin}
                        onChange={(e) => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                        placeholder="1234"
                        className="bg-[#0d1424] border-cyan-500/20 text-white font-mono text-center text-xl tracking-widest pr-10"
                        maxLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPin(!showPin)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                      >
                        {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={generatePin}
                      className="border-cyan-500/30 text-cyan-400 bg-transparent px-3"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">4-6 dígitos para fichar entrada/salida</p>
                </div>
              </div>

              {/* Contact Info */}
              <div className="pt-2">
                <h4 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Contacto
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-300">
                      Email <span className="text-gray-500 text-xs">(opcional)</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="empleado@email.com"
                      className="bg-[#0d1424] border-cyan-500/20 text-white"
                    />
                    <p className="text-xs text-gray-500">Se usará para inicio de sesión. Si no se ingresa, se genera automáticamente.</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-gray-300">Teléfono</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+54 11 1234-5678"
                      className="bg-[#0d1424] border-cyan-500/20 text-white"
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="space-y-2">
                    <Label htmlFor="document_id" className="text-gray-300">DNI / Documento</Label>
                    <Input
                      id="document_id"
                      value={formData.document_id}
                      onChange={(e) => setFormData({ ...formData, document_id: e.target.value })}
                      placeholder="12.345.678"
                      className="bg-[#0d1424] border-cyan-500/20 text-white w-1/2"
                    />
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="space-y-2">
                <Label htmlFor="address" className="text-gray-300 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Dirección
                </Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Av. Corrientes 1234, CABA"
                  className="bg-[#0d1424] border-cyan-500/20 text-white"
                />
              </div>

              {/* Emergency Contact */}
              <div className="pt-2">
                <h4 className="text-sm font-medium text-gray-400 mb-3">Contacto de Emergencia</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="emergency_contact" className="text-gray-300">Nombre</Label>
                    <Input
                      id="emergency_contact"
                      value={formData.emergency_contact}
                      onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
                      placeholder="María García"
                      className="bg-[#0d1424] border-cyan-500/20 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emergency_phone" className="text-gray-300">Teléfono</Label>
                    <Input
                      id="emergency_phone"
                      value={formData.emergency_phone}
                      onChange={(e) => setFormData({ ...formData, emergency_phone: e.target.value })}
                      placeholder="+54 11 9876-5432"
                      className="bg-[#0d1424] border-cyan-500/20 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Dates & Salary */}
              <div className="pt-2">
                <h4 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Fechas y Salario
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="birth_date" className="text-gray-300">Fecha Nac.</Label>
                    <Input
                      id="birth_date"
                      type="date"
                      value={formData.birth_date}
                      onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                      className="bg-[#0d1424] border-cyan-500/20 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hire_date" className="text-gray-300">Ingreso</Label>
                    <Input
                      id="hire_date"
                      type="date"
                      value={formData.hire_date}
                      onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                      className="bg-[#0d1424] border-cyan-500/20 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="salary" className="text-gray-300">Salario $</Label>
                    <Input
                      id="salary"
                      type="number"
                      value={formData.salary}
                      onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                      placeholder="50000"
                      className="bg-[#0d1424] border-cyan-500/20 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-gray-300 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Notas
                </Label>
                <textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Observaciones sobre el empleado..."
                  rows={3}
                  className="w-full bg-[#0d1424] border border-cyan-500/20 text-white rounded-md p-3 text-sm resize-none focus:border-cyan-500/50 outline-none"
                />
              </div>
            </div>
          )}

          {/* Tab: Shifts */}
          {activeTab === "shifts" && (
            <div className="space-y-4 py-4">
              <p className="text-sm text-gray-400 mb-4">
                Selecciona los días que trabaja el empleado y configura sus horarios.
              </p>

              {/* Day selector */}
              <div className="flex gap-2 flex-wrap">
                {DAYS.map(day => {
                  const hasShift = shifts.some(s => s.day_of_week === day.value)
                  return (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleShiftDay(day.value)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        hasShift
                          ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                          : "bg-white/5 text-gray-400 border border-transparent hover:bg-white/10"
                      }`}
                    >
                      {day.short}
                    </button>
                  )
                })}
              </div>

              {/* Shift details */}
              <div className="space-y-3 mt-4">
                {DAYS.filter(day => shifts.some(s => s.day_of_week === day.value)).map(day => {
                  const shift = shifts.find(s => s.day_of_week === day.value)!
                  return (
                    <div key={day.value} className="p-4 rounded-lg bg-white/5 border border-cyan-500/10">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium text-white">{day.label}</span>
                        <button
                          type="button"
                          onClick={() => toggleShiftDay(day.value)}
                          className="text-red-400 text-xs hover:text-red-300"
                        >
                          Quitar
                        </button>
                      </div>
                      <div className="grid grid-cols-4 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs text-gray-400">Entrada</Label>
                          <Input
                            type="time"
                            value={shift.start_time}
                            onChange={(e) => updateShift(day.value, "start_time", e.target.value)}
                            className="bg-[#0d1424] border-cyan-500/20 text-white text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-gray-400">Salida</Label>
                          <Input
                            type="time"
                            value={shift.end_time}
                            onChange={(e) => updateShift(day.value, "end_time", e.target.value)}
                            className="bg-[#0d1424] border-cyan-500/20 text-white text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-gray-400">Break inicio</Label>
                          <Input
                            type="time"
                            value={shift.break_start || ""}
                            onChange={(e) => updateShift(day.value, "break_start", e.target.value)}
                            className="bg-[#0d1424] border-cyan-500/20 text-white text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-gray-400">Break fin</Label>
                          <Input
                            type="time"
                            value={shift.break_end || ""}
                            onChange={(e) => updateShift(day.value, "break_end", e.target.value)}
                            className="bg-[#0d1424] border-cyan-500/20 text-white text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}

                {shifts.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No hay turnos configurados</p>
                    <p className="text-sm">Selecciona los días de trabajo arriba</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab: Permissions */}
          {activeTab === "permissions" && (
            <div className="space-y-4 py-4">
              <div className="space-y-3">
                <Label className="text-gray-300">Permisos del empleado</Label>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
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
                    <div>
                      <label htmlFor="can_sell" className="text-sm text-white cursor-pointer block">
                        Puede realizar ventas
                      </label>
                      <p className="text-xs text-gray-500">Acceso al punto de venta</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
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
                    <div>
                      <label htmlFor="can_view_reports" className="text-sm text-white cursor-pointer block">
                        Puede ver reportes
                      </label>
                      <p className="text-xs text-gray-500">Acceso a estadísticas y ventas</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
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
                    <div>
                      <label htmlFor="can_manage_inventory" className="text-sm text-white cursor-pointer block">
                        Puede gestionar inventario
                      </label>
                      <p className="text-xs text-gray-500">Agregar/editar productos y stock</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
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
                    <div>
                      <label htmlFor="can_manage_employees" className="text-sm text-white cursor-pointer block">
                        Puede gestionar empleados
                      </label>
                      <p className="text-xs text-gray-500">Ver y editar otros empleados</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-white/5">
                  <Checkbox
                    id="status"
                    checked={formData.status === "active"}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, status: checked ? "active" : "inactive" })
                    }
                    className="border-cyan-500/30 data-[state=checked]:bg-green-500"
                  />
                  <div>
                    <label htmlFor="status" className="text-sm text-white cursor-pointer block">
                      Empleado activo
                    </label>
                    <p className="text-xs text-gray-500">Desactiva para bloquear acceso sin eliminar</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex gap-3 pt-4 border-t border-cyan-500/10 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-cyan-500/30 text-cyan-400 bg-transparent"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || !formData.name} 
              className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-black"
            >
              {isLoading ? "Guardando..." : employee ? "Guardar Cambios" : "Crear Empleado"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
