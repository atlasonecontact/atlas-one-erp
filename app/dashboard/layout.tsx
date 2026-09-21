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
  Clock,
  Plug,
  Menu,
  X,
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

function DashboardSidebar({
  mobileOpen,
  onMobileClose,
}: {
  mobileOpen: boolean
  onMobileClose: () => void
}) {
  const pathname = usePathname()
  const { config } = useTheme()

  const [openMenu, setOpenMenu] = useState<string | null>("DASHBOARD")
  const [openSubMenu, setOpenSubMenu] = useState<string | null>("Ventas")

  const toggleMenu = (menuLabel: string) => {
    setOpenMenu(openMenu === menuLabel ? null : menuLabel)
  }

  const toggleSubMenu = (subMenuLabel: string) => {
    setOpenSubMenu(openSubMenu === subMenuLabel ? null : subMenuLabel)
  }

  const menuItems = [
    {
      label: "DASHBOARD",
      icon: LayoutDashboard,
      isExpandable: true,
      subModules: [
        {
          label: "Ventas",
          icon: ShoppingCart,
          isExpandable: true,
          items: [
            { href: "/dashboard/estadisticas/executive-overview", label: "Resumen Ejecutivo", icon: TrendingUp },
            { href: "/dashboard/estadisticas/ventas/overview", label: "Análisis de Ventas", icon: BarChart3 },
            { href: "/dashboard/estadisticas/ventas/productividad-horaria", label: "Productividad", icon: Clock },
            {
              href: "/dashboard/estadisticas/ventas/comportamiento-compra",
              label: "Comportamiento y Patrones de Compra",
              icon: ShoppingBag,
            },
            {
              href: "/dashboard/estadisticas/ventas/desempeno-vendedor",
              label: "Desempeño por Vendedor",
              icon: Users,
            },
            { href: "/dashboard/estadisticas/ventas/tickets", label: "Tickets y Facturación", icon: FileText },
          ],
        },
        {
          label: "Finanzas",
          icon: Wallet,
          items: [{ href: "/dashboard/estadisticas/finanzas", label: "Dashboard Finanzas", icon: TrendingDown }],
        },
        {
          label: "Stock",
          icon: Package,
          items: [{ href: "/dashboard/estadisticas", label: "Dashboard Inventario", icon: Package }],
        },
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
        { href: "/dashboard/stock/recepcion-mercaderia", label: "Recepción de Mercadería", icon: Package },
      ],
    },
    {
      label: "COMPRAS",
      icon: ShoppingBag,
      isExpandable: true,
      items: [
        { href: "/dashboard/compras/pedidos-internos", label: "Nota de Pedido Interna", icon: ClipboardList },
        { href: "/dashboard/compras/pedido-proveedor", label: "Pedido a Proveedor OC", icon: ShoppingBasket },
        { href: "/dashboard/compras/pago-proveedores", label: "Pago a Proveedores", icon: DollarSign },
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
    {
      label: "SUCURSALES",
      icon: Building2,
      href: "/dashboard/kioscos",
    },
    {
      label: "EMPLEADOS",
      icon: Users,
      href: "/dashboard/empleados",
    },
    {
      label: "INTEGRACIONES",
      icon: Plug,
      href: "/dashboard/integraciones",
    },
    {
      label: "CONFIGURACIÓN",
      icon: Settings,
      href: "/dashboard/configuracion",
    },
  ]

  return (
    <>
      {/* Backdrop - solo en mobile/tablet cuando el drawer está abierto */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={onMobileClose} />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col w-64 h-screen bg-gradient-to-br from-[#0a0f1a] to-[#0d1420] border-r shadow-2xl transition-transform duration-300 ease-in-out",
          "lg:sticky lg:top-0 lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
      {/* Logo */}
      <div className="p-6 border-b border-white/10 backdrop-blur-sm flex items-center justify-between">
        <AtlasLogo variant="horizontal" className="h-8" />
        <button
          onClick={onMobileClose}
          className="lg:hidden text-gray-400 hover:text-white transition-colors"
          aria-label="Cerrar menú"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin scrollbar-thumb-white/10">
        {menuItems.map((item) => {
          if (item.isExpandable && item.subModules) {
            const hasActiveChild = item.subModules.some((subModule) =>
              subModule.items?.some((subItem) => pathname === subItem.href),
            )
            const isOpen = openMenu === item.label

            return (
              <div key={item.label} className="mb-3">
                {/* Nivel 1: DASHBOARD */}
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

                {/* Nivel 2: Ventas, Finanzas, Stock */}
                <div
                  className={cn(
                    "overflow-hidden transition-all duration-300 ease-in-out",
                    isOpen ? "max-h-[600px] opacity-100 mt-2" : "max-h-0 opacity-0",
                  )}
                >
                  <div className="ml-4 pl-4 border-l-2 border-white/10 space-y-2 py-2">
                    {item.subModules.map((subModule) => {
                      const hasActiveSubChild = subModule.items?.some((subItem) => pathname === subItem.href)
                      const isSubOpen = openSubMenu === subModule.label

                      if (subModule.isExpandable && subModule.items) {
                        return (
                          <div key={subModule.label}>
                            <button
                              onClick={() => toggleSubMenu(subModule.label)}
                              className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 w-full group relative overflow-hidden",
                                hasActiveSubChild || isSubOpen
                                  ? "bg-gradient-to-r text-white shadow-md"
                                  : "text-gray-400 hover:bg-white/5 hover:text-white",
                              )}
                              style={
                                hasActiveSubChild
                                  ? {
                                    background: `linear-gradient(90deg, ${config.primary}15, transparent)`,
                                  }
                                  : {}
                              }
                            >
                              <subModule.icon
                                className="w-4 h-4 shrink-0 transition-all duration-200 group-hover:scale-110"
                                style={hasActiveSubChild ? { color: config.primary } : {}}
                              />
                              <span className="flex-1 text-sm font-medium text-left">{subModule.label}</span>
                              <ChevronDown
                                className={cn(
                                  "w-3 h-3 transition-transform duration-200",
                                  isSubOpen ? "rotate-180" : "rotate-0",
                                )}
                              />
                            </button>

                            {/* Nivel 3: Dashboards específicos */}
                            <div
                              className={cn(
                                "overflow-hidden transition-all duration-200 ease-in-out",
                                isSubOpen ? "max-h-96 opacity-100 mt-1" : "max-h-0 opacity-0",
                              )}
                            >
                              <div className="ml-4 pl-3 border-l border-white/5 space-y-1 py-1">
                                {subModule.items.map((subItem) => {
                                  const isActive = pathname === subItem.href
                                  return (
                                    <Link
                                      key={subItem.href}
                                      href={subItem.href}
                                      className={cn(
                                        "flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 group relative overflow-hidden text-sm",
                                        isActive
                                          ? "bg-gradient-to-r text-white shadow-sm"
                                          : "text-gray-400 hover:bg-white/5 hover:text-white hover:translate-x-1",
                                      )}
                                      style={
                                        isActive
                                          ? {
                                            background: `linear-gradient(90deg, ${config.primary}25, transparent)`,
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
                                        className="w-3.5 h-3.5 shrink-0 transition-all duration-200 group-hover:scale-110"
                                        style={isActive ? { color: config.primary } : {}}
                                      />
                                      <span className="text-xs font-medium">{subItem.label}</span>
                                    </Link>
                                  )
                                })}
                              </div>
                            </div>
                          </div>
                        )
                      }

                      // Submódulo sin items anidados
                      return subModule.items?.map((subItem) => {
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
                      })
                    })}
                  </div>
                </div>
              </div>
            )
          }

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
      </nav>

      <div className="mt-auto pt-6 border-t border-slate-800/50">
        <div className="px-3 mb-3">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gestión</h3>
        </div>
        <nav className="space-y-1 px-2">
          {gestionItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                  isActive
                    ? "bg-gradient-to-r from-cyan-500/20 to-teal-500/20 text-cyan-400 border border-cyan-500/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50",
                )}
              >
                <Icon className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>
      </aside>
    </>
  )
}

function DashboardHeader({ onMenuClick }: { onMenuClick: () => void }) {
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

      const checkUser = async () => {
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
          // Check profile status
          const { data: profile } = await supabase
            .from('profiles')
            .select('access_status')
            .eq('id', user.id)
            .single()

          // Admin bypass
          const isAdmin = user.email === 'atlasonecontact@gmail.com';

          if (profile?.access_status === 'pending' && !isAdmin) {
            window.location.href = '/pending-approval';
            return;
          }

          if (profile?.access_status === 'rejected' && !isAdmin) {
            await supabase.auth.signOut();
            window.location.href = '/login?error=account_rejected';
            return;
          }
        }

        setUser(user)
        setLoading(false)
      }

      checkUser()
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
        <button
          onClick={onMenuClick}
          className="lg:hidden text-gray-400 hover:text-white transition-colors p-1 -ml-1"
          aria-label="Abrir menú"
        >
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-semibold text-white/90 hidden sm:block">Dashboard</h1>
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
                className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-500"
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
              <Avatar className="w-10 h-10 ring-2 ring-[var(--primary)] transition-all duration-200">
                <AvatarFallback
                  className="font-semibold text-sm"
                  style={{
                    background: `linear-gradient(135deg, ${config.primary}, ${config.primaryHover})`,
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
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const pathname = usePathname()

  // Cierra el drawer automáticamente al navegar, sin tener que engancharlo
  // a cada Link del menú.
  useEffect(() => {
    setMobileNavOpen(false)
  }, [pathname])

  return (
    <ThemeProvider>
      <div className="flex h-screen overflow-hidden">
        <DashboardSidebar mobileOpen={mobileNavOpen} onMobileClose={() => setMobileNavOpen(false)} />
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <DashboardHeader onMenuClick={() => setMobileNavOpen(true)} />
          <main className="flex-1 overflow-y-auto p-8 bg-gradient-to-br from-[#0a0f1a] to-[#0d1420]">{children}</main>
        </div>
      </div>
    </ThemeProvider>
  )
}
