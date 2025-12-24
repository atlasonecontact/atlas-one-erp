"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { AtlasLogo } from "@/components/atlas-logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Warehouse,
  ShoppingBag,
  Wallet,
  Users,
  BarChart3,
  Settings,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Building2,
  LogOut,
  Plug,
  Bike,
  Calculator,
  FileText,
  CreditCard,
  Receipt,
  PackageSearch,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Suspense } from "react"
import { createClient } from "@/lib/supabase/client"
import { useTheme } from "@/lib/theme-context"
import { ThemeSelector } from "@/components/theme-selector"
import { OnlineStatus } from "@/components/online-status"
import { KioskoSelector } from "@/components/kiosko-selector"
import { NotificationsDropdown } from "@/components/notifications-dropdown"
import { ToastProvider } from "@/components/ui/toast-provider"
import { BottomNavigation } from "@/components/mobile/bottom-navigation"
import { MobileHeader } from "@/components/mobile/mobile-header"
import { MobileMenuDrawer } from "@/components/mobile/mobile-menu-drawer"
import { CameraScanner } from "@/components/mobile/camera-scanner"
import { DarkModeToggle } from "@/components/dark-mode-toggle"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { ThemeProvider } from "@/lib/theme-context"

interface UserProfile {
  id: string
  full_name: string
  email: string
  role: string
  business_name: string
  theme: string
}

interface EmployeeInfo {
  id: string
  kiosko_id: string
  name: string
  permissions: {
    can_sell: boolean
    can_view_reports: boolean
    can_manage_inventory: boolean
    can_manage_employees: boolean
  }
}

// Full navigation items for owners
const dashboardNavItems = [
  { href: "/dashboard", label: "General", icon: LayoutDashboard },
  { href: "/dashboard/estadisticas", label: "Estadísticas", icon: BarChart3 },
  { href: "/dashboard/estadisticas/ventas", label: "Ventas", icon: ShoppingCart },
  { href: "/dashboard/estadisticas/finanzas", label: "Finanzas", icon: Wallet },
]

const finanzasSubItems = [
  { href: "/dashboard/estadisticas/finanzas", label: "Resumen", icon: BarChart3 },
  { href: "/dashboard/estadisticas/finanzas/ingresos-wallets", label: "Ingresos Wallets", icon: Wallet },
  { href: "/dashboard/estadisticas/finanzas/ingresos-tarjetas", label: "Ingresos Tarjetas", icon: CreditCard },
]

const contabilidadItems = [
  { href: "/dashboard/contabilidad/emitir-factura", label: "Emitir Factura", icon: FileText },
  { href: "/dashboard/contabilidad/facturas-emitidas", label: "Facturas Emitidas", icon: Receipt },
  { href: "/dashboard/contabilidad/cuentas", label: "Cuentas", icon: Calculator },
  { href: "/dashboard/contabilidad/asientos", label: "Asientos Contables", icon: FileText },
  { href: "/dashboard/contabilidad/libro-mayor", label: "Libro Mayor", icon: FileText },
  { href: "/dashboard/contabilidad/balance", label: "Balance", icon: BarChart3 },
]

// Sección de análisis de datos
/*
const analisisDatosItems = [
  { href: "/dashboard/analisis-datos/estadistico-avanzado", label: "Análisis Estadístico Avanzado", icon: BarChart3 },
  { href: "/dashboard/analisis-datos/predictivo", label: "Análisis Predictivo", icon: TrendingUp },
]
*/

// All nav items with permission requirements
const allNavItems = [
  { href: "/dashboard/ventas", label: "Ventas", icon: ShoppingCart, permission: "can_sell" },
  { href: "/dashboard/productos", label: "Productos", icon: Package, permission: "can_manage_inventory" },
  { href: "/dashboard/stock", label: "Stock", icon: Warehouse, permission: "can_manage_inventory" },
  { href: "/dashboard/compras", label: "Compras", icon: ShoppingBag, permission: "can_manage_inventory" },
  { href: "/dashboard/pedidos", label: "Pedidos", icon: Bike, permission: "can_sell" },
  { href: "/dashboard/caja", label: "Caja", icon: Wallet, permission: "can_sell" },
  { href: "/dashboard/kioscos", label: "SUCURSALES", icon: Building2, ownerOnly: true },
  { href: "/dashboard/empleados", label: "Empleados", icon: Users, permission: "can_manage_employees" },
  { href: "/dashboard/integraciones", label: "Integraciones", icon: Plug, ownerOnly: true },
  { href: "/dashboard/configuracion", label: "Configuración", icon: Settings, ownerOnly: true },
]

const comprasSubItems = [
  { href: "/dashboard/compras/sub1", label: "Sub Item 1", icon: PackageSearch },
  { href: "/dashboard/compras/sub2", label: "Sub Item 2", icon: PackageSearch },
]

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { config } = useTheme()
  const [collapsed, setCollapsed] = useState(false)
  const [dashboardOpen, setDashboardOpen] = useState(false)
  const [finanzasOpen, setFinanzasOpen] = useState(false)
  const [contabilidadOpen, setContabilidadOpen] = useState(false)
  // const [analisisDatosOpen, setAnalisisDatosOpen] = useState(false)
  const [comprasOpen, setComprasOpen] = useState(false)
  const [user, setUser] = useState<UserProfile | null>(null)
  const [employeeInfo, setEmployeeInfo] = useState<EmployeeInfo | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isScannerOpen, setIsScannerOpen] = useState(false)

  useEffect(() => {
    const loadUser = async () => {
      try {
        const supabase = createClient()

        // Quick auth check first
        const { data, error: authError } = await supabase.auth.getUser()

        if (authError || !data?.user) {
          router.push("/login")
          return
        }

        const authUser = data.user

        // Set basic user data immediately for faster UI
        setUser({
          id: authUser.id,
          full_name: authUser.email?.split("@")[0] || "Usuario",
          email: authUser.email || "",
          role: "owner",
          business_name: "Mi Negocio",
          theme: "cyan",
        })
        setIsLoading(false)

        // Load profile data in background (non-blocking)
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", authUser.id).single()

        if (profile) {
          setUser({
            id: authUser.id,
            full_name: profile.full_name || authUser.email?.split("@")[0] || "Usuario",
            email: authUser.email || "",
            role: profile.role || "owner",
            business_name: profile.business_name || "Mi Negocio",
            theme: profile.theme || "cyan",
          })

          // If user is an employee, load their employee info
          if (profile.role === "employee") {
            console.log("[Dashboard] Loading employee info for user:", authUser.id)
            const { data: empData, error: empError } = await supabase
              .from("employees")
              .select("id, kiosko_id, name, permissions")
              .eq("user_id", authUser.id)
              .maybeSingle()

            console.log("[Dashboard] Employee query result:", { empData, empError })

            if (empError) {
              console.error("[Dashboard] Error loading employee:", empError)
            }

            if (empData) {
              const permissions = empData.permissions || {
                can_sell: true,
                can_view_reports: false,
                can_manage_inventory: false,
                can_manage_employees: false,
              }
              console.log("[Dashboard] Employee permissions:", permissions)

              setEmployeeInfo({
                id: empData.id,
                kiosko_id: empData.kiosko_id,
                name: empData.name,
                permissions,
              })
              // Set the employee's kiosko as selected
              localStorage.setItem("selectedKioskoId", empData.kiosko_id)
              window.dispatchEvent(new CustomEvent("kioskoChanged", { detail: empData.kiosko_id }))
            } else {
              console.warn("[Dashboard] No employee record found for user_id:", authUser.id)
            }
          }
        }
      } catch (error) {
        router.push("/login")
      }
    }

    loadUser()
  }, [router])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = "/login"
  }

  const handleBarcodeScan = (barcode: string) => {
    // Navigate to ventas with the scanned barcode
    router.push(`/dashboard/ventas?scan=${encodeURIComponent(barcode)}`)
    setIsScannerOpen(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <div
          className="w-8 h-8 border-2 border-[var(--theme-border)] rounded-full animate-spin"
          style={{ borderTopColor: config.primary }}
        />
      </div>
    )
  }

  if (!user) return null

  const isDashboardActive = pathname === "/dashboard" || pathname.startsWith("/dashboard/estadisticas")
  const isFinanzasActive = pathname.startsWith("/dashboard/estadisticas/finanzas")
  const isContabilidadActive = pathname.startsWith("/dashboard/contabilidad")
  // const isAnalisisDatosActive = pathname.startsWith("/dashboard/analisis-datos")
  const isComprasActive = pathname.startsWith("/dashboard/compras")
  const effectiveDashboardOpen = collapsed ? false : dashboardOpen
  const effectiveFinanzasOpen = collapsed ? false : finanzasOpen
  const effectiveContabilidadOpen = !collapsed && (contabilidadOpen || isContabilidadActive)
  // const effectiveAnalisisDatosOpen = !collapsed && (analisisDatosOpen || isAnalisisDatosActive)
  const effectiveComprasOpen = comprasOpen || isComprasActive

  // Filter navigation items based on user role and permissions
  const isOwner = user.role !== "employee"
  const navItems = allNavItems.filter((item) => {
    // Owners see everything
    if (isOwner) return true
    // Owner-only items are hidden from employees
    if (item.ownerOnly) return false
    // Check permission if required
    if (item.permission && employeeInfo?.permissions) {
      return employeeInfo.permissions[item.permission as keyof typeof employeeInfo.permissions]
    }
    // Default: show the item
    return true
  })

  // Employees don't see dashboard section at all - it's owner only
  // Only owners can view the main dashboard with KPIs and reports
  const filteredDashboardItems = isOwner ? dashboardNavItems : []

  return (
    <div className="min-h-screen bg-[#030712]">
      <MobileHeader userName={user.full_name} />

      <aside
        className={cn(
          "fixed left-0 top-0 h-full bg-[#0a0f1a] border-r flex-col transition-all duration-300 z-50 hidden lg:flex",
          collapsed ? "w-20" : "w-64",
        )}
        style={{ borderColor: config.border }}
      >
        {/* Logo */}
        <div
          className={cn("flex items-center gap-3 p-6 border-b", collapsed && "justify-center")}
          style={{ borderColor: config.border }}
        >
          {collapsed ? <AtlasLogo className="w-10 h-10 shrink-0" variant="icon" /> : <AtlasLogo variant="horizontal" />}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {/* Dashboard group */}
          {collapsed ? (
            <Link href="/dashboard">
              <div
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                  isDashboardActive ? "border" : "text-gray-400 hover:text-white hover:bg-white/5",
                  "justify-center px-3",
                )}
                style={
                  isDashboardActive
                    ? { backgroundColor: config.primaryMuted, color: config.primary, borderColor: config.border }
                    : {}
                }
              >
                <LayoutDashboard className="w-5 h-5 shrink-0" />
              </div>
            </Link>
          ) : filteredDashboardItems.length > 0 ? (
            <div>
              <button
                type="button"
                onClick={() => setDashboardOpen((v) => !v)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                  isDashboardActive ? "border" : "text-gray-400 hover:text-white hover:bg-white/5",
                )}
                style={
                  isDashboardActive
                    ? { backgroundColor: config.primaryMuted, color: config.primary, borderColor: config.border }
                    : {}
                }
              >
                <LayoutDashboard className="w-5 h-5 shrink-0" />
                <span className="text-sm font-medium flex-1 text-left">Dashboard</span>
                <ChevronDown
                  className={cn("w-4 h-4 transition-transform", effectiveDashboardOpen ? "rotate-0" : "-rotate-90")}
                />
              </button>

              {effectiveDashboardOpen && (
                <div className="mt-1 space-y-1">
                  {filteredDashboardItems.map((item) => {
                    const isActive = pathname === item.href
                    if (item.href === "/dashboard/estadisticas/finanzas") {
                      return (
                        <div key={item.href}>
                          <button
                            type="button"
                            onClick={() => setFinanzasOpen((v) => !v)}
                            className={cn(
                              "ml-4 w-[calc(100%-1rem)] flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200",
                              isFinanzasActive ? "border" : "text-gray-400 hover:text-white hover:bg-white/5",
                            )}
                            style={
                              isFinanzasActive
                                ? {
                                    backgroundColor: config.primaryMuted,
                                    color: config.primary,
                                    borderColor: config.border,
                                  }
                                : {}
                            }
                          >
                            <item.icon className="w-4 h-4 shrink-0" />
                            <span className="text-sm flex-1 text-left">{item.label}</span>
                            <ChevronDown
                              className={cn(
                                "w-3 h-3 transition-transform",
                                effectiveFinanzasOpen ? "rotate-0" : "-rotate-90",
                              )}
                            />
                          </button>
                          {effectiveFinanzasOpen && (
                            <div className="mt-1 space-y-1">
                              {finanzasSubItems.map((subItem) => {
                                const isSubActive = pathname === subItem.href
                                return (
                                  <Link key={subItem.href} href={subItem.href}>
                                    <div
                                      className={cn(
                                        "ml-8 flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200",
                                        isSubActive ? "border" : "text-gray-400 hover:text-white hover:bg-white/5",
                                      )}
                                      style={
                                        isSubActive
                                          ? {
                                              backgroundColor: config.primaryMuted,
                                              color: config.primary,
                                              borderColor: config.border,
                                            }
                                          : {}
                                      }
                                    >
                                      <subItem.icon className="w-3 h-3 shrink-0" />
                                      <span className="text-xs">{subItem.label}</span>
                                    </div>
                                  </Link>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    }
                    return (
                      <Link key={item.href} href={item.href}>
                        <div
                          className={cn(
                            "ml-4 flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200",
                            isActive ? "border" : "text-gray-400 hover:text-white hover:bg-white/5",
                          )}
                          style={
                            isActive
                              ? {
                                  backgroundColor: config.primaryMuted,
                                  color: config.primary,
                                  borderColor: config.border,
                                }
                              : {}
                          }
                        >
                          <item.icon className="w-4 h-4 shrink-0" />
                          <span className="text-sm">{item.label}</span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          ) : null}

          {isOwner &&
            (collapsed ? (
              <Link href="/dashboard/contabilidad/emitir-factura">
                <div
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                    isContabilidadActive ? "border" : "text-gray-400 hover:text-white hover:bg-white/5",
                    "justify-center px-3",
                  )}
                  style={
                    isContabilidadActive
                      ? { backgroundColor: config.primaryMuted, color: config.primary, borderColor: config.border }
                      : {}
                  }
                >
                  <Calculator className="w-5 h-5 shrink-0" />
                </div>
              </Link>
            ) : (
              <div>
                <button
                  type="button"
                  onClick={() => setContabilidadOpen((v) => !v)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                    isContabilidadActive ? "border" : "text-gray-400 hover:text-white hover:bg-white/5",
                  )}
                  style={
                    isContabilidadActive
                      ? { backgroundColor: config.primaryMuted, color: config.primary, borderColor: config.border }
                      : {}
                  }
                >
                  <Calculator className="w-5 h-5 shrink-0" />
                  <span className="text-sm font-medium flex-1 text-left">Contabilidad</span>
                  <ChevronDown
                    className={cn(
                      "w-4 h-4 transition-transform",
                      effectiveContabilidadOpen ? "rotate-0" : "-rotate-90",
                    )}
                  />
                </button>

                {effectiveContabilidadOpen && (
                  <div className="mt-1 space-y-1">
                    {contabilidadItems.map((item) => {
                      const isActive = pathname === item.href
                      return (
                        <Link key={item.href} href={item.href}>
                          <div
                            className={cn(
                              "ml-4 flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200",
                              isActive ? "border" : "text-gray-400 hover:text-white hover:bg-white/5",
                            )}
                            style={
                              isActive
                                ? {
                                    backgroundColor: config.primaryMuted,
                                    color: config.primary,
                                    borderColor: config.border,
                                  }
                                : {}
                            }
                          >
                            <item.icon className="w-4 h-4 shrink-0" />
                            <span className="text-sm">{item.label}</span>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}

          {/* Rest of navigation */}
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href)

            if (item.href === "/dashboard/compras" && !collapsed) {
              return (
                <div key={item.href}>
                  <button
                    type="button"
                    onClick={() => setComprasOpen((v) => !v)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                      isComprasActive ? "border" : "text-gray-400 hover:text-white hover:bg-white/5",
                    )}
                    style={
                      isComprasActive
                        ? { backgroundColor: config.primaryMuted, color: config.primary, borderColor: config.border }
                        : {}
                    }
                  >
                    <item.icon className="w-5 h-5 shrink-0" />
                    <span className="text-sm font-medium flex-1 text-left">{item.label}</span>
                    <ChevronDown
                      className={cn("w-4 h-4 transition-transform", effectiveComprasOpen ? "rotate-0" : "-rotate-90")}
                    />
                  </button>
                  {effectiveComprasOpen && (
                    <div className="mt-1 space-y-1">
                      {comprasSubItems.map((subItem) => {
                        const isSubActive = pathname === subItem.href
                        return (
                          <Link key={subItem.href} href={subItem.href}>
                            <div
                              className={cn(
                                "ml-4 flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200",
                                isSubActive ? "border" : "text-gray-400 hover:text-white hover:bg-white/5",
                              )}
                              style={
                                isSubActive
                                  ? {
                                      backgroundColor: config.primaryMuted,
                                      color: config.primary,
                                      borderColor: config.border,
                                    }
                                  : {}
                              }
                            >
                              <subItem.icon className="w-4 h-4 shrink-0" />
                              <span className="text-sm">{subItem.label}</span>
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            }

            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                    isActive ? "border" : "text-gray-400 hover:text-white hover:bg-white/5",
                    collapsed && "justify-center px-3",
                  )}
                  style={
                    isActive
                      ? { backgroundColor: config.primaryMuted, color: config.primary, borderColor: config.border }
                      : {}
                  }
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
                </div>
              </Link>
            )
          })}
        </nav>

        {/* User section */}
        <div className={cn("p-4 border-t", collapsed && "flex justify-center")} style={{ borderColor: config.border }}>
          {collapsed ? (
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center font-semibold"
              style={{ backgroundColor: config.primaryMuted, color: config.primary }}
            >
              {user.full_name.charAt(0)}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-semibold shrink-0"
                style={{ backgroundColor: config.primaryMuted, color: config.primary }}
              >
                {user.full_name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user.full_name}</p>
                <p className="text-xs text-gray-500 truncate capitalize">
                  {user.role === "owner" ? "Dueño" : user.role === "employee" ? "Empleado" : user.role}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Dark mode toggle */}
        <div
          className={cn("px-4 pb-2 border-t", collapsed && "flex justify-center")}
          style={{ borderColor: config.border }}
        >
          <DarkModeToggle collapsed={collapsed} />
        </div>

        {/* Logout button */}
        <div className={cn("p-4 border-t", collapsed && "flex justify-center")} style={{ borderColor: config.border }}>
          <Button
            onClick={handleLogout}
            variant="ghost"
            className={cn(
              "w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10",
              collapsed && "justify-center px-0",
            )}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!collapsed && <span className="ml-3">Cerrar Sesión</span>}
          </Button>
        </div>

        {/* Collapse button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-[#0a0f1a] flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          style={{ borderWidth: 1, borderColor: config.border }}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </aside>

      {/* Main content - responsive margins */}
      <div className={cn("flex-1 transition-all duration-300", "lg:ml-64", collapsed && "lg:ml-20")}>
        {/* Desktop Top bar - hidden on mobile */}
        <header
          className="sticky top-0 z-40 bg-[#030712]/80 backdrop-blur-xl border-b hidden lg:block"
          style={{ borderColor: config.border }}
        >
          <div className="flex items-center justify-between px-6 py-4">
            {/* Left section */}
            <div className="flex items-center gap-4">
              <KioskoSelector />
            </div>

            {/* Center - Search */}
            <div className="flex-1 max-w-xl mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  type="text"
                  placeholder="Buscar productos, ventas, clientes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 bg-[#0a0f1a] text-white placeholder:text-gray-500"
                  style={{ borderColor: config.border }}
                />
              </div>
            </div>

            {/* Right section */}
            <div className="flex items-center gap-3">
              <OnlineStatus />
              <ThemeSelector />
              <NotificationsDropdown />

              {/* User menu */}
              <Suspense fallback={<div>Loading...</div>}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-3 hover:bg-white/5">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm"
                        style={{ backgroundColor: config.primaryMuted, color: config.primary }}
                      >
                        {user.full_name.charAt(0)}
                      </div>
                      <span className="text-sm text-white hidden md:block">{user.full_name}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-56 bg-[#0a0f1a] text-white"
                    style={{ borderColor: config.border }}
                  >
                    <div className="px-3 py-2">
                      <p className="text-sm font-medium">{user.full_name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                    <DropdownMenuSeparator style={{ backgroundColor: config.border }} />
                    <DropdownMenuItem className="gap-2 text-gray-400 hover:text-white focus:text-white focus:bg-white/5">
                      <Building2 className="w-4 h-4" />
                      Mi Perfil
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => router.push("/dashboard/configuracion")}
                      className="gap-2 text-gray-400 hover:text-white focus:text-white focus:bg-white/5"
                    >
                      <Settings className="w-4 h-4" />
                      Configuración
                    </DropdownMenuItem>
                    <DropdownMenuSeparator style={{ backgroundColor: config.border }} />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="gap-2 text-red-400 hover:text-red-300 focus:text-red-300 focus:bg-red-500/10"
                    >
                      <LogOut className="w-4 h-4" />
                      Cerrar Sesión
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </Suspense>
            </div>
          </div>
        </header>

        {/* Page content - responsive padding */}
        <main className={cn("p-4 lg:p-6", "pb-24 lg:pb-6")}>{children}</main>
      </div>

      <BottomNavigation onMenuClick={() => setIsMobileMenuOpen(true)} onScanClick={() => setIsScannerOpen(true)} />

      <MobileMenuDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        user={user}
        onLogout={handleLogout}
        employeePermissions={employeeInfo?.permissions}
      />

      <CameraScanner isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} onScan={handleBarcodeScan} />
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <NextThemesProvider attribute="class" defaultTheme="dark" enableSystem>
        <ToastProvider>
          <DashboardLayoutContent>{children}</DashboardLayoutContent>
        </ToastProvider>
      </NextThemesProvider>
    </ThemeProvider>
  )
}
