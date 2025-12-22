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
  Bell,
  ChevronLeft,
  ChevronRight,
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
import { getSingleOrNull } from "@/lib/supabase/utils"

interface UserProfile {
  id: string
  full_name: string
  email: string
  role: string
  business_name: string
  theme: string
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/ventas", label: "Ventas", icon: ShoppingCart },
  { href: "/dashboard/productos", label: "Productos", icon: Package },
  { href: "/dashboard/stock", label: "Stock", icon: Warehouse },
  { href: "/dashboard/compras", label: "Compras", icon: ShoppingBag },
  { href: "/dashboard/pedidos", label: "Pedidos", icon: Bike },
  { href: "/dashboard/caja", label: "Caja", icon: Wallet },
  { href: "/dashboard/kioscos", label: "Kioscos", icon: Building2 },
  { href: "/dashboard/empleados", label: "Empleados", icon: Users },
  { href: "/dashboard/reportes", label: "Reportes", icon: BarChart3 },
  { href: "/dashboard/integraciones", label: "Integraciones", icon: Plug },
  { href: "/dashboard/configuracion", label: "Configuración", icon: Settings },
]

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { config } = useTheme()
  const [collapsed, setCollapsed] = useState(false)
  const [user, setUser] = useState<UserProfile | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadUser = async () => {
      const supabase = createClient()
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()

      if (!authUser) {
        router.push("/login")
        return
      }

      const profile = await getSingleOrNull(supabase.from("profiles").select("*").eq("id", authUser.id).single())

      if (profile) {
        setUser({
          id: authUser.id,
          email: authUser.email || "",
          full_name: profile.full_name || authUser.email || "Usuario",
          role: profile.role || "admin",
          business_name: profile.business_name || "Mi Negocio",
          theme: profile.theme || "cyan",
        })
      } else {
        // Fallback if no profile yet
        setUser({
          id: authUser.id,
          email: authUser.email || "",
          full_name: authUser.email || "Usuario",
          role: "admin",
          business_name: "Mi Negocio",
          theme: "cyan",
        })
      }
      setIsLoading(false)
    }

    loadUser()
  }, [router])

  const handleLogout = async () => {
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error("[v0] Logout error:", error)
    }

    // Force navigation and clear cache
    window.location.href = "/login"
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

  return (
    <div className="min-h-screen bg-[#030712] flex">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-full bg-[#0a0f1a] border-r flex flex-col transition-all duration-300 z-50",
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
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
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

      {/* Main content */}
      <div className={cn("flex-1 transition-all duration-300", collapsed ? "ml-20" : "ml-64")}>
        {/* Top bar */}
        <header
          className="sticky top-0 z-40 bg-[#030712]/80 backdrop-blur-xl border-b"
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

              {/* Notifications */}
              <Button variant="ghost" size="icon" className="relative text-gray-400 hover:text-white hover:bg-white/5">
                <Bell className="w-5 h-5" />
                <span
                  className="absolute top-1 right-1 w-2 h-2 rounded-full"
                  style={{ backgroundColor: config.primary }}
                />
              </Button>

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

        {/* Page content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </ThemeProvider>
  )
}
