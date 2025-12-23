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
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Suspense } from "react"
import { createClient } from "@/lib/supabase/client"
import { ThemeProvider, useTheme } from "@/lib/theme-context"
import { ThemeSelector } from "@/components/theme-selector"
import { OnlineStatus } from "@/components/online-status"
import { KioskoSelector } from "@/components/kiosko-selector"
import { NotificationsDropdown } from "@/components/notifications-dropdown"
import { ToastProvider } from "@/components/ui/toast-provider"
import { BottomNavigation } from "@/components/mobile/bottom-navigation"
import { MobileHeader } from "@/components/mobile/mobile-header"
import { MobileMenuDrawer } from "@/components/mobile/mobile-menu-drawer"
import { CameraScanner } from "@/components/mobile/camera-scanner"

interface UserProfile {
  id: string
  full_name: string
  email: string
  role: string
  business_name: string
  theme: string
}

const dashboardNavItems = [
  { href: "/dashboard", label: "General", icon: LayoutDashboard },
  { href: "/dashboard/estadisticas", label: "Estadísticas", icon: BarChart3 },
  { href: "/dashboard/estadisticas/ventas", label: "Ventas", icon: ShoppingCart },
  { href: "/dashboard/estadisticas/finanzas", label: "Finanzas", icon: Wallet },
]

const navItems = [
  { href: "/dashboard/ventas", label: "Ventas", icon: ShoppingCart },
  { href: "/dashboard/productos", label: "Productos", icon: Package },
  { href: "/dashboard/stock", label: "Stock", icon: Warehouse },
  { href: "/dashboard/compras", label: "Compras", icon: ShoppingBag },
  { href: "/dashboard/pedidos", label: "Pedidos", icon: Bike },
  { href: "/dashboard/caja", label: "Caja", icon: Wallet },
  { href: "/dashboard/kioscos", label: "Kioscos", icon: Building2 },
  { href: "/dashboard/empleados", label: "Empleados", icon: Users },
  { href: "/dashboard/integraciones", label: "Integraciones", icon: Plug },
  { href: "/dashboard/configuracion", label: "Configuración", icon: Settings },
]

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { config } = useTheme()
  const [collapsed, setCollapsed] = useState(false)
  const [dashboardOpen, setDashboardOpen] = useState(true)
  const [user, setUser] = useState<UserProfile | null>(null)
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
        supabase
          .from("profiles")
          .select("*")
          .eq("id", authUser.id)
          .single()
          .then(({ data: profile }) => {
            if (profile) {
              setUser({
                id: authUser.id,
                full_name: profile.full_name || authUser.email?.split("@")[0] || "Usuario",
                email: authUser.email || "",
                role: profile.role || "owner",
                business_name: profile.business_name || "Mi Negocio",
                theme: profile.theme || "cyan",
              })
            }
          })
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
  const effectiveDashboardOpen = collapsed ? false : dashboardOpen

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
          ) : (
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
                  {dashboardNavItems.map((item) => {
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
          )}

          {/* Rest of navigation */}
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href)
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
                <p className="text-xs text-gray-500 truncate capitalize">{user.role}</p>
              </div>
            </div>
          )}
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
      />

      <CameraScanner isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} onScan={handleBarcodeScan} />
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <DashboardLayoutContent>{children}</DashboardLayoutContent>
      </ToastProvider>
    </ThemeProvider>
  )
}
