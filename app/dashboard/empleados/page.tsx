"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { EmployeeModal } from "@/components/employees/employee-modal"
import { Search, Plus, Edit2, UserCog, Circle, Copy, Check } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

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
  created_at: string
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

  const supabase = createClient()

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
    } else {
      console.log("[v0] No kioscos found for user")
    }
    setIsLoading(false)
  }

  const loadEmployees = async () => {
    if (!selectedKiosko) return

    setIsLoading(true)
    const { data: employeesData } = await supabase
      .from("employees")
      .select(
        `
        *,
        kioscos (
          name
        )
      `,
      )
      .eq("kiosko_id", selectedKiosko)
      .order("created_at", { ascending: false })

    if (employeesData) {
      setEmployees(
        employeesData.map((e: any) => ({
          ...e,
          kiosko: e.kioscos,
        })),
      )
    }
    setIsLoading(false)
  }

  const filteredEmployees = employees.filter(
    (e) =>
      `${e.first_name} ${e.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.auto_generated_email.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee)
    setShowModal(true)
  }

  const copyCredentials = async (employee: Employee) => {
    const text = `Usuario: ${employee.username}`
    await navigator.clipboard.writeText(text)
    setCopiedId(employee.id)
    setTimeout(() => setCopiedId(null), 2000)
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
        <h1 className="text-2xl font-bold text-white">Empleados</h1>
        <div className="border border-cyan-500/20 rounded-xl bg-[#0a0f1a]/50 p-12 text-center">
          <p className="text-gray-400">Primero debes crear un kiosco para agregar empleados.</p>
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
          <h1 className="text-2xl font-bold text-white">Empleados</h1>
          <p className="text-gray-400 text-sm">Gestiona tu equipo de trabajo</p>
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
        <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-5">
          <p className="text-sm text-gray-400 mb-1">Total empleados</p>
          <p className="text-2xl font-bold text-white">{employees.length}</p>
        </div>
        <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-5">
          <p className="text-sm text-gray-400 mb-1">Activos</p>
          <p className="text-2xl font-bold text-green-400">{employees.filter((e) => e.is_active).length}</p>
        </div>
        <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-5">
          <p className="text-sm text-gray-400 mb-1">Inactivos</p>
          <p className="text-2xl font-bold text-gray-400">{employees.filter((e) => !e.is_active).length}</p>
        </div>
        <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-5">
          <p className="text-sm text-gray-400 mb-1">Con permisos full</p>
          <p className="text-2xl font-bold text-cyan-400">
            {employees.filter((e) => getPermissionCount(e.permissions) === 4).length}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <Input
          type="text"
          placeholder="Buscar empleados..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-[#0a0f1a] border-cyan-500/10 text-white placeholder:text-gray-500"
        />
      </div>

      {/* Employees grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-5 animate-pulse">
              <div className="h-20 bg-gray-700 rounded" />
            </div>
          ))}
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className="border border-cyan-500/20 rounded-xl bg-[#0a0f1a]/50 p-12 text-center">
          <p className="text-gray-400">No hay empleados registrados en este kiosco.</p>
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
              className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-5 hover:border-cyan-500/30 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold text-lg">
                    {employee.first_name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-white font-medium">
                      {employee.first_name} {employee.last_name}
                    </p>
                    <p className="text-xs text-gray-500 truncate max-w-[150px]">@{employee.username}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(employee)}
                  className="text-gray-400 hover:text-white"
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
                    employee.is_active ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"
                  }`}
                >
                  <Circle className={`w-2 h-2 ${employee.is_active ? "fill-green-400" : "fill-gray-400"}`} />
                  {employee.is_active ? "Activo" : "Inactivo"}
                </span>
              </div>

              <div className="space-y-2 mb-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Permisos:</span>
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
                >
                  <UserCog className="w-4 h-4" />
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
