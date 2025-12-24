"use client"

import { useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  X,
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
  LogOut,
  Plug,
  Bike,
  TrendingUp,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useTheme } from "@/lib/theme-context"
import { AtlasLogo } from "@/components/atlas-logo"
import { ThemeSelector } from "@/components/theme-selector"
import { Button } from "@/components/ui/button"

interface UserProfile {
  id: string
  full_name: string
  email: string
  role: string
  business_name: string
}

interface EmployeePermissions {
  can_sell: boolean
  can_view_reports: boolean
  can_manage_inventory: boolean
  can_manage_employees: boolean
}

interface MobileMenuDrawerProps {
  isOpen: boolean
  onClose: () => void
  user: UserProfile | null
  onLogout: () => void
  employeePermissions?: EmployeePermissions | null
}

// Menu items with permission requirements
const menuSections = [
  {
    title: "Dashboard",
    items: [
      { href: "/dashboard", label: "General", icon: LayoutDashboard },
      { href: "/dashboard/estadisticas", label: "Estadísticas", icon: BarChart3, permission: "can_view_reports" },
      {
        href: "/dashboard/estadisticas/ventas",
        label: "Ventas Stats",
        icon: ShoppingCart,
        permission: "can_view_reports",
      },
      { href: "/dashboard/estadisticas/finanzas", label: "Finanzas", icon: Wallet, permission: "can_view_reports" },
    ],
  },
  {
    title: "Operaciones",
    items: [
      { href: "/dashboard/ventas", label: "Punto de Venta", icon: ShoppingCart, permission: "can_sell" },
      { href: "/dashboard/productos", label: "Productos", icon: Package, permission: "can_manage_inventory" },
      {
        title: "Stock",
        items: [
          {
            href: "/dashboard/stock/inventario",
            label: "Inventario",
            icon: Warehouse,
            permission: "can_manage_inventory",
          },
          {
            href: "/dashboard/stock/movimientos",
            label: "Movimientos",
            icon: Plug,
            permission: "can_manage_inventory",
          },
        ],
      },
      { href: "/dashboard/compras", label: "Compras", icon: ShoppingBag, permission: "can_manage_inventory" },
      { href: "/dashboard/pedidos", label: "Pedidos", icon: Bike, permission: "can_sell" },
      { href: "/dashboard/caja", label: "Caja", icon: Wallet, permission: "can_sell" },
    ],
  },
  {
    title: "Análisis de Datos",
    items: [
      {
        href: "/dashboard/analisis-datos/estadistico-avanzado",
        label: "Análisis Estadístico Avanzado",
        icon: BarChart3,
        permission: "can_view_reports",
      },
      {
        href: "/dashboard/analisis-datos/predictivo",
        label: "Análisis Predictivo",
        icon: TrendingUp,
        permission: "can_view_reports",
      },
    ],
  },
  {
    title: "Gestión",
    ownerOnly: true,
    items: [
      { href: "/dashboard/kioscos", label: "SUCURSALES", icon: Building2, ownerOnly: true },
      { href: "/dashboard/empleados", label: "Empleados", icon: Users, permission: "can_manage_employees" },
      { href: "/dashboard/integraciones", label: "Integraciones", icon: Plug, ownerOnly: true },
      { href: "/dashboard/configuracion", label: "Configuración", icon: Settings, ownerOnly: true },
    ],
  },
]

export function MobileMenuDrawer({ isOpen, onClose, user, onLogout, employeePermissions }: MobileMenuDrawerProps) {
  const pathname = usePathname()
  const { config } = useTheme()

  const isOwner = user?.role !== "employee"

  // Filter menu sections based on permissions
  const filteredSections = menuSections
    .map((section) => {
      // Skip owner-only sections for employees
      if (section.ownerOnly && !isOwner) {
        // But check if any items in the section are accessible
        const accessibleItems = section.items.filter((item) => {
          if (item.ownerOnly) return false
          if (!item.permission) return true
          return employeePermissions?.[item.permission as keyof EmployeePermissions]
        })
        if (accessibleItems.length === 0) return null
        return { ...section, items: accessibleItems }
      }

      // Filter items within the section
      const filteredItems = section.items.filter((item) => {
        if (isOwner) return true
        if (item.ownerOnly) return false
        if (!item.permission) return true
        return employeePermissions?.[item.permission as keyof EmployeePermissions]
      })

      if (filteredItems.length === 0) return null
      return { ...section, items: filteredItems }
    })
    .filter(Boolean) as typeof menuSections

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity lg:hidden",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-[85%] max-w-sm bg-[#0a0f1a] shadow-2xl transition-transform duration-300 ease-out lg:hidden",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: config.border }}>
            <AtlasLogo variant="horizontal" className="h-8" />
            <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white">
              <X className="w-6 h-6" />
            </Button>
          </div>

          {/* User Profile */}
          {user && (
            <div className="p-4 border-b" style={{ borderColor: config.border }}>
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center font-semibold text-lg"
                  style={{ backgroundColor: config.primaryMuted, color: config.primary }}
                >
                  {user.full_name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{user.full_name}</p>
                  <p className="text-sm text-gray-500 truncate">{user.email}</p>
                  <p className="text-xs capitalize mt-0.5" style={{ color: config.primary }}>
                    {user.role === "owner" ? "Dueño" : user.role === "employee" ? "Empleado" : user.role}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto momentum-scroll p-4 space-y-6">
            {filteredSections.map((section) => (
              <div key={section.title}>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">
                  {section.title}
                </h3>
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <div key={item.href}>
                        {Array.isArray(item.items) ? (
                          <div className="space-y-1">
                            {item.items.map((subItem) => {
                              const subIsActive = pathname === subItem.href
                              return (
                                <Link
                                  key={subItem.href}
                                  href={subItem.href}
                                  onClick={onClose}
                                  className={cn(
                                    "flex items-center gap-3 px-3 py-3 rounded-xl transition-all touch-target haptic-tap",
                                    subIsActive ? "bg-gradient-to-r text-white" : "text-gray-400 active:bg-white/5",
                                  )}
                                  style={
                                    subIsActive
                                      ? {
                                          background: `linear-gradient(90deg, ${config.primary}20, transparent)`,
                                        }
                                      : {}
                                  }
                                >
                                  <subItem.icon
                                    className="w-5 h-5 shrink-0"
                                    style={subIsActive ? { color: config.primary } : {}}
                                  />
                                  <span className="flex-1 text-sm font-medium">{subItem.label}</span>
                                  {subIsActive && (
                                    <div
                                      className="w-1.5 h-1.5 rounded-full"
                                      style={{ backgroundColor: config.primary }}
                                    />
                                  )}
                                </Link>
                              )
                            })}
                          </div>
                        ) : (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={onClose}
                            className={cn(
                              "flex items-center gap-3 px-3 py-3 rounded-xl transition-all touch-target haptic-tap",
                              isActive ? "bg-gradient-to-r text-white" : "text-gray-400 active:bg-white/5",
                            )}
                            style={
                              isActive
                                ? {
                                    background: `linear-gradient(90deg, ${config.primary}20, transparent)`,
                                  }
                                : {}
                            }
                          >
                            <item.icon className="w-5 h-5 shrink-0" style={isActive ? { color: config.primary } : {}} />
                            <span className="flex-1 text-sm font-medium">{item.label}</span>
                            {isActive && (
                              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: config.primary }} />
                            )}
                          </Link>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Theme & Logout */}
          <div className="p-4 border-t space-y-3 safe-area-bottom" style={{ borderColor: config.border }}>
            <div className="flex items-center justify-between px-2">
              <span className="text-sm text-gray-400">Tema de color</span>
              <ThemeSelector />
            </div>

            <Button
              onClick={() => {
                onClose()
                onLogout()
              }}
              variant="ghost"
              className="w-full justify-start gap-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 h-12"
            >
              <LogOut className="w-5 h-5" />
              <span>Cerrar Sesión</span>
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
