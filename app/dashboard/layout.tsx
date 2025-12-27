"use client"

import { useEffect } from "react"
import type { ReactNode } from "react"
import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
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
  Building2,
  Plug,
  Bike,
  TrendingUp,
  ChevronDown,
  Calculator,
  TrendingDown,
  CreditCard,
  QrCode,
  FileText,
  ShoppingBasket,
  ClipboardList,
  DollarSign,
  FileCheck,
  User,
  LogOut,
  Bell,
  Wifi,
  WifiOff,
} from "lucide-react"
import { ThemeProvider } from "@/lib/theme-context"
import { useTheme } from "@/lib/theme-context"
import { cn } from "@/lib/utils"
import { AtlasLogo } from "@/components/atlas-logo"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { createBrowserClient } from "@supabase/ssr"
import { Badge } from "@/components/ui/badge"

function DashboardSidebar() {
  const pathname = usePathname()
  const { config } = useTheme()

  const [openMenu, setOpenMenu] = useState<string | null>("DASHBOARD")

  const toggleMenu = (menuLabel: string) => {
    setOpenMenu(openMenu === menuLabel ? null : menuLabel)
  }

  const menuItems = [
    {
      label: "DASHBOARD",
      icon: LayoutDashboard,
      isExpandable: true,
      items: [
        { href: "/dashboard/estadisticas/ventas", label: "Ventas", icon: ShoppingCart },
        { href: "/dashboard/estadisticas/finanzas", label: "Finanzas", icon: Wallet },
        { href: "/dashboard/estadisticas", label: "Inventario", icon: Package },
        { href: "/dashboard/empleados", label: "Recursos Humanos", icon: Users },
      ],
    },
    {
      label: "FINANZAS",
      icon: Wallet,
      isExpandable: true,
      items: [
        { href: "/dashboard/estadisticas/finanzas", label: "Cash Flow", icon: TrendingDown },
        {
          href: "/dashboard/estadisticas/finanzas/ingresos-tarjetas",
          label: "Ingresos por Tarjeta",
          icon: CreditCard,
        },
        { href: "/dashboard/estadisticas/finanzas/ingresos-wallets", label: "Ingresos por Wallets y QR", icon: QrCode },
      ],
    },
    {
      label: "CONTABILIDAD",
      icon: Calculator,
      isExpandable: true,
      items: [
        { href: "/dashboard/contabilidad/emitir-factura", label: "Emitir Factura", icon: FileText },
        { href: "/dashboard/contabilidad/facturas-emitidas", label: "Facturas Emitidas", icon: FileCheck },
        { href: "/dashboard/contabilidad/cuentas", label: "Cuentas", icon: DollarSign },
        { href: "/dashboard/contabilidad/asientos", label: "Asientos Contables", icon: ClipboardList },
        { href: "/dashboard/contabilidad/libro-mayor", label: "Libro Mayor", icon: FileText },
        { href: "/dashboard/contabilidad/balance", label: "Balance", icon: BarChart3 },
      ],
    },
    {
      label: "PUNTO DE VENTA",
      icon: ShoppingCart,
      href: "/dashboard/ventas",
    },
    {
      label: "PRODUCTOS",
      icon: Package,
      href: "/dashboard/productos",
    },
    {
      label: "STOCK",
      icon: Warehouse,
      isExpandable: true,
      items: [
        { href: "/dashboard/stock/central", label: "Stock Central", icon: Warehouse },
        { href: "/dashboard/stock/por-sucursal", label: "Stock por Sucursal", icon: Building2 },
      ],
    },
    {
      label: "COMPRAS",
      icon: ShoppingBag,
      isExpandable: true,
      items: [
        { href: "/dashboard/compras/pedidos-internos", label: "Nota de Pedido Interna", icon: ClipboardList },
        { href: "/dashboard/compras", label: "Pedido a Proveedor", icon: ShoppingBasket },
      ],
    },
    {
      label: "PEDIDOS",
      icon: Bike,
      href: "/dashboard/pedidos",
    },
    {
      label: "CAJA",
      icon: Wallet,
      href: "/dashboard/caja",
    },
    {
      label: "ANÁLISIS DE DATOS",
      icon: BarChart3,
      isExpandable: true,
      items: [
        {
          href: "/dashboard/analisis-datos/estadistico-avanzado",
          label: "Análisis Estadístico Avanzado",
          icon: BarChart3,
        },
        { href: "/dashboard/analisis-datos/predictivo", label: "Análisis Predictivo", icon: TrendingUp },
      ],
    },
  ]

  const gestionItems = [
    { href: "/dashboard/kioscos", label: "SUCURSALES", icon: Building2 },
    { href: "/dashboard/empleados", label: "EMPLEADOS", icon: Users },
    { href: "/dashboard/integraciones", label: "INTEGRACIONES", icon: Plug },
    { href: "/dashboard/configuracion", label: "CONFIGURACIÓN", icon: Settings },
  ]

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen bg-gradient-to-br from-[#0a0f1a] to-[#0d1420] border-r sticky top-0 shadow-2xl">
      {/* Logo */}
      <div className="p-6 border-b border-white/10 backdrop-blur-sm">
        <AtlasLogo variant="horizontal" className="h-8" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin scrollbar-thumb-white/10">
        {menuItems.map((item) => {
          if (item.isExpandable && item.items) {
            const hasActiveChild = item.items.some((subItem) => pathname === subItem.href)
            const isOpen = openMenu === item.label

            return (
              <div key={item.label} className="mb-3">
                <button
                  onClick={() => toggleMenu(item.label)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 w-full group relative overflow-hidden",
                    hasActiveChild || isOpen
                      ? "bg-gradient-to-r from-white/10 to-transparent text-white shadow-lg"
                      : "text-gray-400 hover:bg-white/5 hover:text-white",
                  )}
                  style={
                    hasActiveChild
                      ? {
                          background: `linear-gradient(90deg, ${config.primary}15, transparent)`,
                          borderLeft: `3px solid ${config.primary}`,
                        }
                      : {}
                  }
                >
                  <div
                    className={cn(
                      "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                      "bg-gradient-to-r from-white/5 to-transparent",
                    )}
                  />
                  <item.icon
                    className="w-5 h-5 shrink-0 z-10 transition-transform duration-300 group-hover:scale-110"
                    style={hasActiveChild ? { color: config.primary } : {}}
                  />
                  <span className="flex-1 text-sm font-semibold text-left z-10 tracking-wide">{item.label}</span>
                  <ChevronDown
                    className={cn("w-4 h-4 z-10 transition-transform duration-300", isOpen ? "rotate-180" : "rotate-0")}
                  />
                </button>

                <div
                  className={cn(
                    "overflow-hidden transition-all duration-300 ease-in-out",
                    isOpen ? "max-h-96 opacity-100 mt-2" : "max-h-0 opacity-0",
                  )}
                >
                  <div className="ml-4 pl-4 border-l-2 border-white/10 space-y-1 py-2">
                    {item.items.map((subItem) => {
                      const isActive = pathname === subItem.href
                      return (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative overflow-hidden",
                            isActive
                              ? "bg-gradient-to-r text-white shadow-md"
                              : "text-gray-400 hover:bg-white/5 hover:text-white hover:translate-x-1",
                          )}
                          style={
                            isActive
                              ? {
                                  background: `linear-gradient(90deg, ${config.primary}20, transparent)`,
                                }
                              : {}
                          }
                        >
                          {isActive && (
                            <div
                              className="absolute left-0 top-0 bottom-0 w-1 rounded-r"
                              style={{ backgroundColor: config.primary }}
                            />
                          )}
                          <subItem.icon
                            className="w-4 h-4 shrink-0 transition-all duration-200 group-hover:scale-110"
                            style={isActive ? { color: config.primary } : {}}
                          />
                          <span className="text-sm font-medium">{subItem.label}</span>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          }

          const isActive = pathname === item.href
          return (
            <Link
              key={item.label}
              href={item.href!}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group relative overflow-hidden mb-2",
                isActive
                  ? "bg-gradient-to-r text-white shadow-lg"
                  : "text-gray-400 hover:bg-white/5 hover:text-white hover:translate-x-1",
              )}
              style={
                isActive
                  ? {
                      background: `linear-gradient(90deg, ${config.primary}20, transparent)`,
                      borderLeft: `3px solid ${config.primary}`,
                    }
                  : {}
              }
            >
              <div
                className={cn(
                  "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200",
                  "bg-gradient-to-r from-white/5 to-transparent",
                )}
              />
              <item.icon
                className="w-5 h-5 shrink-0 z-10 transition-transform duration-200 group-hover:scale-110"
                style={isActive ? { color: config.primary } : {}}
              />
              <span className="text-sm font-semibold z-10 tracking-wide">{item.label}</span>
            </Link>
          )
        })}

        <div className="pt-8 mt-6 border-t border-white/10">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 px-4">Gestión</h3>
          <div className="space-y-2">
            {gestionItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group relative overflow-hidden",
                    isActive
                      ? "bg-gradient-to-r text-white shadow-lg"
                      : "text-gray-400 hover:bg-white/5 hover:text-white hover:translate-x-1",
                  )}
                  style={
                    isActive
                      ? {
                          background: `linear-gradient(90deg, ${config.primary}20, transparent)`,
                          borderLeft: `3px solid ${config.primary}`,
                        }
                      : {}
                  }
                >
                  <div
                    className={cn(
                      "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200",
                      "bg-gradient-to-r from-white/5 to-transparent",
                    )}
                  />
                  <item.icon
                    className="w-5 h-5 shrink-0 z-10 transition-transform duration-200 group-hover:scale-110"
                    style={isActive ? { color: config.primary } : {}}
                  />
                  <span className="text-sm font-semibold z-10 tracking-wide">{item.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </nav>
    </aside>
  )
}

function DashboardHeader() {
  const { config } = useTheme()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isOnline, setIsOnline] = useState(true)
  const [notificationsOpen, setNotificationsOpen] = useState(false)

  useEffect(() => {
    setIsOnline(navigator.onLine)

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      )

      supabase.auth.getUser().then(({ data: { user } }) => {
        setUser(user)
        setLoading(false)
      })
    } else {
      // Si no hay variables de entorno, usar usuario demo
      setUser({ email: "usuario@demo.com", user_metadata: { full_name: "Usuario Demo" } })
      setLoading(false)
    }

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  const handleLogout = async () => {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      )
      await supabase.auth.signOut()
    }
    window.location.href = "/"
  }

  if (loading) {
    return (
      <header className="h-16 border-b bg-[#0a0f1a] border-white/10 flex items-center justify-end px-6">
        <div className="w-10 h-10 rounded-full bg-white/10 animate-pulse" />
      </header>
    )
  }

  const userEmail = user?.email || "usuario@demo.com"
  const userName = user?.user_metadata?.full_name || userEmail.split("@")[0]
  const userInitials = userName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <header
      className="h-16 border-b bg-gradient-to-r from-[#0a0f1a] to-[#0d1420] border-white/10 flex items-center justify-between px-6 shadow-lg"
      style={{ borderColor: config.border }}
    >
      {/* Left side - Breadcrumb or title could go here */}
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold text-white/90">Dashboard</h1>
        <Badge
          variant={isOnline ? "default" : "secondary"}
          className={cn(
            "flex items-center gap-1.5 px-2 py-1",
            isOnline
              ? "bg-green-500/20 text-green-400 border-green-500/30"
              : "bg-red-500/20 text-red-400 border-red-500/30",
          )}
        >
          {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          <span className="text-xs font-medium">{isOnline ? "Online" : "Offline"}</span>
        </Badge>
      </div>

      {/* Right side - User menu and notifications */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <DropdownMenu open={notificationsOpen} onOpenChange={setNotificationsOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
            >
              <Bell className="w-5 h-5" />
              <span
                className="absolute top-1 right-1 w-2 h-2 rounded-full"
                style={{ backgroundColor: config.accent }}
              />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 bg-[#0d1420] border-white/10">
            <DropdownMenuLabel className="text-white font-semibold text-base">Notificaciones</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/10" />
            <div className="max-h-96 overflow-y-auto">
              <DropdownMenuItem className="text-gray-300 hover:bg-white/5 cursor-pointer flex-col items-start p-4 gap-1">
                <div className="flex items-start gap-3 w-full">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">Nueva venta registrada</p>
                    <p className="text-xs text-gray-400 mt-1">Se registró una venta de $15,000 en Sucursal Centro</p>
                    <p className="text-xs text-gray-500 mt-1">Hace 5 minutos</p>
                  </div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-gray-300 hover:bg-white/5 cursor-pointer flex-col items-start p-4 gap-1">
                <div className="flex items-start gap-3 w-full">
                  <div className="w-2 h-2 rounded-full bg-yellow-500 mt-1.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">Stock bajo detectado</p>
                    <p className="text-xs text-gray-400 mt-1">Producto "Coca Cola 2L" tiene stock crítico</p>
                    <p className="text-xs text-gray-500 mt-1">Hace 1 hora</p>
                  </div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-gray-300 hover:bg-white/5 cursor-pointer flex-col items-start p-4 gap-1">
                <div className="flex items-start gap-3 w-full">
                  <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">Pedido completado</p>
                    <p className="text-xs text-gray-400 mt-1">Pedido #1245 fue entregado exitosamente</p>
                    <p className="text-xs text-gray-500 mt-1">Hace 2 horas</p>
                  </div>
                </div>
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-3 hover:bg-white/5 px-3 py-2 h-auto transition-all duration-200"
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-white">{userName}</p>
                <p className="text-xs text-gray-400">{userEmail}</p>
              </div>
              <Avatar className="w-10 h-10 ring-2 transition-all duration-200" style={{ ringColor: config.primary }}>
                <AvatarFallback
                  className="font-semibold text-sm"
                  style={{
                    background: `linear-gradient(135deg, ${config.primary}, ${config.accent})`,
                    color: "white",
                  }}
                >
                  {userInitials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-[#0d1420] border-white/10">
            <DropdownMenuLabel className="text-white">Mi Cuenta</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem asChild className="text-gray-300 hover:bg-white/5 hover:text-white cursor-pointer">
              <Link href="/dashboard/configuracion" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Perfil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="text-gray-300 hover:bg-white/5 hover:text-white cursor-pointer">
              <Link href="/dashboard/configuracion" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Configuración
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-red-400 hover:bg-red-500/10 hover:text-red-300 cursor-pointer flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Cerrar Sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <div className="flex h-screen overflow-hidden">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <DashboardHeader />
          <main className="flex-1 overflow-y-auto p-8 bg-gradient-to-br from-[#0a0f1a] to-[#0d1420]">{children}</main>
        </div>
      </div>
    </ThemeProvider>
  )
}
