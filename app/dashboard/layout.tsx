"use client"

import { useEffect } from "react"
import type { ReactNode } from "react"
import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
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
  Wifi,
  WifiOff,
  Clock,
  History,
  Plug,
  X,
  Gift,
  PiggyBank,
  ShieldAlert,
  ImageIcon,
} from "lucide-react"
import { ThemeProvider } from "@/lib/theme-context"
import { useTheme } from "@/lib/theme-context"
import { TermsGate } from "@/components/dashboard/terms-gate"
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
import { NotificationsDropdown } from "@/components/notifications-dropdown"
import { MobileHeader } from "@/components/mobile/mobile-header"
import { BottomNavigation } from "@/components/mobile/bottom-navigation"
import { ThemeModeToggle } from "@/components/theme-mode-toggle"

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
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    )
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email === "atlasonecontact@gmail.com") setIsAdmin(true)
    })
  }, [])

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
            { href: "/dashboard/estadisticas/ventas/historial", label: "Historial", icon: History },
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
      isExpandable: true,
      items: [
        { href: "/dashboard/productos", label: "Catálogo", icon: Package },
        { href: "/dashboard/productos/visual", label: "Catálogo Visual", icon: ImageIcon },
        { href: "/dashboard/productos/promociones", label: "Promociones", icon: Gift },
      ],
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
      isExpandable: true,
      items: [
        { href: "/dashboard/caja", label: "Caja diaria", icon: Wallet },
        { href: "/dashboard/caja/plata", label: "Caja fuerte", icon: PiggyBank },
      ],
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
    ...(isAdmin
      ? [
          {
            label: "CUENTAS",
            icon: ShieldAlert,
            href: "/dashboard/admin/cuentas",
          },
        ]
      : []),
  ]

  return (
    <>
      {/* Backdrop - solo en mobile/tablet cuando el drawer está abierto */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={onMobileClose} />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col w-64 h-screen bg-sidebar border-r shadow-2xl transition-transform duration-300 ease-in-out",
          "lg:sticky lg:top-0 lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border backdrop-blur-sm flex items-center justify-between">
        <AtlasLogo variant="horizontal" className="h-8" />
        <button
          onClick={onMobileClose}
          className="lg:hidden text-muted-foreground hover:text-foreground transition-colors"
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
                      ? "bg-gradient-to-r from-accent to-transparent text-foreground shadow-lg"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
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
                  <div className="ml-4 pl-4 border-l-2 border-sidebar-border space-y-2 py-2">
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
                                  ? "bg-gradient-to-r text-foreground shadow-md"
                                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
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
                              <div className="ml-4 pl-3 border-l border-sidebar-border space-y-1 py-1">
                                {subModule.items.map((subItem) => {
                                  const isActive = pathname === subItem.href
                                  return (
                                    <Link
                                      key={subItem.href}
                                      href={subItem.href}
                                      className={cn(
                                        "flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 group relative overflow-hidden text-sm",
                                        isActive
                                          ? "bg-gradient-to-r text-foreground shadow-sm"
                                          : "text-muted-foreground hover:bg-accent hover:text-foreground hover:translate-x-1",
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
                                ? "bg-gradient-to-r text-foreground shadow-md"
                                : "text-muted-foreground hover:bg-accent hover:text-foreground hover:translate-x-1",
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
                      ? "bg-gradient-to-r from-accent to-transparent text-foreground shadow-lg"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
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
                  <div className="ml-4 pl-4 border-l-2 border-sidebar-border space-y-1 py-2">
                    {item.items.map((subItem) => {
                      const isActive = pathname === subItem.href
                      return (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative overflow-hidden",
                            isActive
                              ? "bg-gradient-to-r text-foreground shadow-md"
                              : "text-muted-foreground hover:bg-accent hover:text-foreground hover:translate-x-1",
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
                  ? "bg-gradient-to-r text-foreground shadow-lg"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground hover:translate-x-1",
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

      <div className="mt-auto pt-6 border-t border-sidebar-border">
        <div className="px-3 mb-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Gestión</h3>
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
                    : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent",
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

function DashboardHeader() {
  const { config } = useTheme()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isOnline, setIsOnline] = useState(true)

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

          if (profile?.access_status === 'suspended' && !isAdmin) {
            await supabase.auth.signOut();
            window.location.href = '/login?error=account_suspended';
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
      <header className="hidden lg:flex h-16 border-b bg-card border-border items-center justify-end px-6">
        <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
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
      className="hidden lg:flex h-16 border-b bg-card border-border items-center justify-between px-6 shadow-lg"
      style={{ borderColor: config.border }}
    >
      {/* Left side - Breadcrumb or title could go here */}
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold text-foreground">Dashboard</h1>
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
        <ThemeModeToggle />
        <NotificationsDropdown />

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-3 hover:bg-accent px-3 py-2 h-auto transition-all duration-200"
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-foreground">{userName}</p>
                <p className="text-xs text-muted-foreground">{userEmail}</p>
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
          <DropdownMenuContent align="end" className="w-56 bg-popover border-border">
            <DropdownMenuLabel className="text-foreground">Mi Cuenta</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem asChild className="text-foreground hover:bg-accent hover:text-foreground cursor-pointer">
              <Link href="/dashboard/configuracion" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Perfil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="text-foreground hover:bg-accent hover:text-foreground cursor-pointer">
              <Link href="/dashboard/configuracion" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Configuración
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border" />
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
  const router = useRouter()

  // Cierra el drawer automáticamente al navegar, sin tener que engancharlo
  // a cada Link del menú.
  useEffect(() => {
    setMobileNavOpen(false)
  }, [pathname])

  return (
    <ThemeProvider>
      <TermsGate />
      <div className="flex h-screen overflow-hidden">
        <DashboardSidebar mobileOpen={mobileNavOpen} onMobileClose={() => setMobileNavOpen(false)} />
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <DashboardHeader />
          <MobileHeader onMenuClick={() => setMobileNavOpen(true)} />
          <main className="flex-1 overflow-y-auto p-4 pb-24 lg:p-8 lg:pb-8 bg-background">
            {children}
          </main>
          <BottomNavigation
            onMenuClick={() => setMobileNavOpen(true)}
            onScanClick={() => router.push("/dashboard/ventas?scanner=1")}
          />
        </div>
      </div>
    </ThemeProvider>
  )
}
