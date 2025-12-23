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

interface MobileMenuDrawerProps {
  isOpen: boolean
  onClose: () => void
  user: UserProfile | null
  onLogout: () => void
}

const menuSections = [
  {
    title: "Dashboard",
    items: [
      { href: "/dashboard", label: "General", icon: LayoutDashboard },
      { href: "/dashboard/estadisticas", label: "Estadísticas", icon: BarChart3 },
      { href: "/dashboard/estadisticas/ventas", label: "Ventas Stats", icon: ShoppingCart },
      { href: "/dashboard/estadisticas/finanzas", label: "Finanzas", icon: Wallet },
    ],
  },
  {
    title: "Operaciones",
    items: [
      { href: "/dashboard/ventas", label: "Punto de Venta", icon: ShoppingCart },
      { href: "/dashboard/productos", label: "Productos", icon: Package },
      { href: "/dashboard/stock", label: "Stock", icon: Warehouse },
      { href: "/dashboard/compras", label: "Compras", icon: ShoppingBag },
      { href: "/dashboard/pedidos", label: "Pedidos", icon: Bike },
      { href: "/dashboard/caja", label: "Caja", icon: Wallet },
    ],
  },
  {
    title: "Gestión",
    items: [
      { href: "/dashboard/kioscos", label: "Kioscos", icon: Building2 },
      { href: "/dashboard/empleados", label: "Empleados", icon: Users },
      { href: "/dashboard/integraciones", label: "Integraciones", icon: Plug },
      { href: "/dashboard/configuracion", label: "Configuración", icon: Settings },
    ],
  },
]

export function MobileMenuDrawer({ isOpen, onClose, user, onLogout }: MobileMenuDrawerProps) {
  const pathname = usePathname()
  const { config } = useTheme()

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
                    {user.role === "owner" ? "Dueño" : user.role}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto momentum-scroll p-4 space-y-6">
            {menuSections.map((section) => (
              <div key={section.title}>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">
                  {section.title}
                </h3>
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const isActive = pathname === item.href
                    return (
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
