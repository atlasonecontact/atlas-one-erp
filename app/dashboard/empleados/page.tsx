"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { EmployeeModal } from "@/components/employees/employee-modal"
import { Search, Plus, Edit2, UserCog, Circle, Copy, Check, KeyRound, Clock, Phone, Calendar, Trash2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/toast-provider"
import type { EmployeePermissions } from "@/lib/hooks/use-employee-permissions"

type Shift = {
  day_of_week: number
  start_time: string
  end_time: string
}

type Employee = {
  id: string
  name: string
  username: string
  pin_hash?: string | null
  phone?: string
  document_id?: string
  address?: string
  position?: string
  custom_role: string | null
  salary?: number
  hire_date?: string
  permissions: EmployeePermissions
  status: string
  created_at: string
  shifts?: Shift[]
  kiosko?: {
    name: string
  }
}

export default function EmpleadosPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedKiosko, setSelectedKiosko] = useState<string>("")
  const [kioscos, setKioscos] = useState<any[]>([])
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const supabase = createClient()
  const toast = useToast()

  const DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]

  useEffect(() => {
    loadKioscos()
  }, [])

  useEffect(() => {
    if (selectedKiosko) {
      loadEmployees()
    }
  }, [selectedKiosko])

  const loadKioscos = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    // Buscar kioscos directamente por owner_id
    const { data: kioscosData } = await supabase.from("kioscos").select("id, name").eq("owner_id", user.id)

    if (kioscosData && kioscosData.length > 0) {
      setKioscos(kioscosData)
      setSelectedKiosko(kioscosData[0].id)
    }
    setIsLoading(false)
  }

  const loadEmployees = async () => {
    if (!selectedKiosko) return

    setIsLoading(true)

    // Load employees
    const { data: employeesData } = await supabase
      .from("employees")
      .select(`
        *,
        kioscos (
          name
        )
      `)
      .eq("kiosko_id", selectedKiosko)
      .order("created_at", { ascending: false })

    if (employeesData) {
      // Load shifts for all employees
      const employeeIds = employeesData.map((e: any) => e.id)
      const { data: shiftsData } = await supabase.from("employee_shifts").select("*").in("employee_id", employeeIds)

      const shiftsMap: Record<string, Shift[]> = {}
      if (shiftsData) {
        shiftsData.forEach((shift: any) => {
          if (!shiftsMap[shift.employee_id]) {
            shiftsMap[shift.employee_id] = []
          }
          shiftsMap[shift.employee_id].push({
            day_of_week: shift.day_of_week,
            start_time: shift.start_time,
            end_time: shift.end_time,
          })
        })
      }

      setEmployees(
        employeesData.map((e: any) => ({
          ...e,
          kiosko: e.kioscos,
          shifts: shiftsMap[e.id] || [],
        })),
      )
    }
    setIsLoading(false)
  }

  const filteredEmployees = employees.filter(
    (e) =>
      e.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.username?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee)
    setShowModal(true)
  }

  const copyCredentials = async (employee: Employee) => {
    // El PIN está hasheado: ya no se puede recuperar el valor original para copiarlo.
    const text = `Empleado: ${employee.name}\nUsuario: ${employee.username}`
    await navigator.clipboard.writeText(text)
    setCopiedId(employee.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const formatShifts = (shifts: Shift[] = []) => {
    if (shifts.length === 0) return null
    const days = shifts.sort((a, b) => a.day_of_week - b.day_of_week).map((s) => DAY_NAMES[s.day_of_week])
    return days.join(", ")
  }

  const handleDelete = async (employee: Employee) => {
    const confirmed = window.confirm(`Eliminar a ${employee.name}? Esta acción no se puede deshacer.`)
    if (!confirmed) return

    try {
      setDeletingId(employee.id)
      const { error } = await supabase.from("employees").delete().eq("id", employee.id)
      if (error) throw error
      await loadEmployees()
    } catch (err) {
      console.error("Error deleting employee", err)
      toast.error("No se pudo eliminar el empleado", "Intentá de nuevo")
    } finally {
      setDeletingId(null)
    }
  }

  const getPermissionCount = (permissions: Employee["permissions"]) => {
    return Object.values(permissions).filter(Boolean).length
  }

  if (isLoading && kioscos.length === 0) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-700 rounded w-1/4" />
          <div className="h-32 bg-gray-700 rounded" />
        </div>
      </div>
    )
  }

  if (kioscos.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Empleados</h1>
        <div className="border border-cyan-500/20 rounded-xl bg-card/50 p-12 text-center">
          <p className="text-muted-foreground">Primero debes crear un kiosco para agregar empleados.</p>
          <Button className="mt-4 bg-cyan-500 hover:bg-cyan-400 text-black">Crear Kiosco</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Empleados</h1>
          <p className="text-muted-foreground text-sm">Gestiona tu equipo de trabajo</p>
        </div>
        <Button
          onClick={() => {
            setEditingEmployee(null)
            setShowModal(true)
          }}
          className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold gap-2"
        >
          <Plus className="w-4 h-4" />
          Agregar Empleado
        </Button>
      </div>

      {/* Kiosko selector */}
      {kioscos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {kioscos.map((kiosko) => (
            <Button
              key={kiosko.id}
              variant={selectedKiosko === kiosko.id ? "default" : "outline"}
              onClick={() => setSelectedKiosko(kiosko.id)}
              className={
                selectedKiosko === kiosko.id
                  ? "bg-cyan-500 text-black hover:bg-cyan-400"
                  : "border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
              }
            >
              {kiosko.name}
            </Button>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-cyan-500/10 bg-card p-5">
          <p className="text-sm text-muted-foreground mb-1">Total empleados</p>
          <p className="text-2xl font-bold text-foreground">{employees.length}</p>
        </div>
        <div className="rounded-xl border border-cyan-500/10 bg-card p-5">
          <p className="text-sm text-muted-foreground mb-1">Activos</p>
          <p className="text-2xl font-bold text-green-400">{employees.filter((e) => e.status === "active").length}</p>
        </div>
        <div className="rounded-xl border border-cyan-500/10 bg-card p-5">
          <p className="text-sm text-muted-foreground mb-1">Inactivos</p>
          <p className="text-2xl font-bold text-muted-foreground">{employees.filter((e) => e.status !== "active").length}</p>
        </div>
        <div className="rounded-xl border border-cyan-500/10 bg-card p-5">
          <p className="text-sm text-muted-foreground mb-1">Con permisos full</p>
          <p className="text-2xl font-bold text-cyan-400">
            {employees.filter((e) => getPermissionCount(e.permissions) === 4).length}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Buscar empleados..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-card border-cyan-500/10 text-foreground placeholder:text-muted-foreground"
        />
      </div>

      {/* Employees grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-cyan-500/10 bg-card p-5 animate-pulse">
              <div className="h-20 bg-gray-700 rounded" />
            </div>
          ))}
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className="border border-cyan-500/20 rounded-xl bg-card/50 p-12 text-center">
          <p className="text-muted-foreground">No hay empleados registrados en este kiosco.</p>
          <Button
            onClick={() => {
              setEditingEmployee(null)
              setShowModal(true)
            }}
            className="mt-4 bg-cyan-500 hover:bg-cyan-400 text-black"
          >
            <Plus className="w-4 h-4 mr-2" />
            Agregar Primer Empleado
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEmployees.map((employee) => (
            <div
              key={employee.id}
              className="rounded-xl border border-cyan-500/10 bg-card p-5 hover:border-cyan-500/30 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold text-lg">
                    {employee.name?.charAt(0) || "?"}
                  </div>
                  <div>
                    <p className="text-foreground font-medium">{employee.name}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-[150px]">@{employee.username}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(employee)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400">
                  {employee.custom_role || "Empleado"}
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                    employee.status === "active"
                      ? "bg-green-500/20 text-green-400"
                      : employee.status === "suspended"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-red-500/20 text-red-400"
                  }`}
                >
                  <Circle
                    className={`w-2 h-2 ${
                      employee.status === "active"
                        ? "fill-green-400"
                        : employee.status === "suspended"
                          ? "fill-yellow-400"
                          : "fill-red-400"
                    }`}
                  />
                  {employee.status === "active" ? "Activo" : employee.status === "suspended" ? "Suspendido" : "Desactivado"}
                </span>
              </div>

              <div className="space-y-2 mb-4 text-sm">
                {/* PIN: no se puede mostrar el valor (está hasheado), sólo si tiene uno configurado */}
                {employee.pin_hash && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <KeyRound className="w-3 h-3" />
                    <span className="text-muted-foreground">PIN configurado</span>
                  </div>
                )}

                {/* Phone */}
                {employee.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-3 h-3" />
                    <span className="text-muted-foreground">{employee.phone}</span>
                  </div>
                )}

                {/* Shifts */}
                {employee.shifts && employee.shifts.length > 0 && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span className="text-muted-foreground">{formatShifts(employee.shifts)}</span>
                  </div>
                )}

                {/* Hire date */}
                {employee.hire_date && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    <span className="text-muted-foreground">
                      Desde {new Date(employee.hire_date).toLocaleDateString("es-AR")}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <span className="text-muted-foreground">Permisos:</span>
                  <span className="text-cyan-400">{getPermissionCount(employee.permissions)}/4</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {employee.permissions.can_sell && (
                    <span className="px-2 py-0.5 rounded text-xs bg-green-500/10 text-green-400">Vender</span>
                  )}
                  {employee.permissions.can_view_reports && (
                    <span className="px-2 py-0.5 rounded text-xs bg-blue-500/10 text-blue-400">Reportes</span>
                  )}
                  {employee.permissions.can_manage_inventory && (
                    <span className="px-2 py-0.5 rounded text-xs bg-orange-500/10 text-orange-400">Inventario</span>
                  )}
                  {employee.permissions.can_manage_employees && (
                    <span className="px-2 py-0.5 rounded text-xs bg-purple-500/10 text-purple-400">Empleados</span>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyCredentials(employee)}
                  className="flex-1 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                >
                  {copiedId === employee.id ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copiar Usuario
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(employee)}
                  className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                  title="Editar empleado"
                >
                  <UserCog className="w-4 h-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(employee)}
                  disabled={deletingId === employee.id}
                  className="bg-red-500/20 text-red-200 hover:bg-red-500/30 border border-red-500/30"
                  title="Eliminar empleado"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <EmployeeModal
        open={showModal}
        onClose={() => {
          setShowModal(false)
          setEditingEmployee(null)
        }}
        employee={editingEmployee}
        onSuccess={loadEmployees}
        kioskoId={selectedKiosko}
      />
    </div>
  )
}
