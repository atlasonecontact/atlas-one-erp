"use client"

import type React from "react"
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
  ChevronRight,
} from "lucide-react"
import { ThemeProvider } from "@/lib/theme-context"
import { useTheme } from "@/lib/theme-context"
import { cn } from "@/lib/utils"
import { AtlasLogo } from "@/components/atlas-logo"

function DashboardSidebar() {
  const pathname = usePathname()
  const { config } = useTheme()
  const [stockOpen, setStockOpen] = useState(true)
  const [analisisOpen, setAnalisisOpen] = useState(true)

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
        {
          label: "Stock",
          icon: Warehouse,
          isExpandable: true,
          isOpen: stockOpen,
          onToggle: () => setStockOpen(!stockOpen),
          items: [
            { href: "/dashboard/stock/central", label: "Stock Central", icon: Warehouse },
            { href: "/dashboard/stock/por-sucursal", label: "Stock por Sucursal", icon: Building2 },
          ],
        },
        { href: "/dashboard/compras", label: "Compras", icon: ShoppingBag },
        { href: "/dashboard/pedidos", label: "Pedidos", icon: Bike },
        { href: "/dashboard/caja", label: "Caja", icon: Wallet },
      ],
    },
    {
      title: "Análisis de Datos",
      items: [
        {
          label: "Análisis de Datos",
          icon: BarChart3,
          isExpandable: true,
          isOpen: analisisOpen,
          onToggle: () => setAnalisisOpen(!analisisOpen),
          items: [
            {
              href: "/dashboard/analisis-datos/estadistico-avanzado",
              label: "Análisis Estadístico Avanzado",
              icon: BarChart3,
            },
            {
              href: "/dashboard/analisis-datos/predictivo",
              label: "Análisis Predictivo",
              icon: TrendingUp,
            },
          ],
        },
      ],
    },
    {
      title: "Gestión",
      items: [
        { href: "/dashboard/kioscos", label: "SUCURSALES", icon: Building2 },
        { href: "/dashboard/empleados", label: "Empleados", icon: Users },
        { href: "/dashboard/integraciones", label: "Integraciones", icon: Plug },
        { href: "/dashboard/configuracion", label: "Configuración", icon: Settings },
      ],
    },
  ]

  return (
    <aside
      className="hidden lg:flex flex-col w-64 h-screen bg-[#0a0f1a] border-r sticky top-0"
      style={{ borderColor: config.border }}
    >
      {/* Logo */}
      <div className="p-4 border-b" style={{ borderColor: config.border }}>
        <AtlasLogo variant="horizontal" className="h-8" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-6">
        {menuSections.map((section) => (
          <div key={section.title}>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">{section.title}</h3>
            <div className="space-y-1">
              {section.items.map((item) => {
                if (item.isExpandable && item.items) {
                  return (
                    <div key={item.label}>
                      <button
                        onClick={item.onToggle}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all w-full text-gray-400 hover:bg-white/5"
                      >
                        <item.icon className="w-5 h-5 shrink-0" />
                        <span className="flex-1 text-sm font-medium text-left">{item.label}</span>
                        {item.isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                      {item.isOpen && (
                        <div className="ml-4 mt-1 space-y-1">
                          {item.items.map((subItem) => {
                            const isActive = pathname === subItem.href
                            return (
                              <Link
                                key={subItem.href}
                                href={subItem.href}
                                className={cn(
                                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-all",
                                  isActive ? "bg-gradient-to-r text-white" : "text-gray-400 hover:bg-white/5",
                                )}
                                style={
                                  isActive
                                    ? {
                                        background: `linear-gradient(90deg, ${config.primary}20, transparent)`,
                                      }
                                    : {}
                                }
                              >
                                <subItem.icon
                                  className="w-5 h-5 shrink-0"
                                  style={isActive ? { color: config.primary } : {}}
                                />
                                <span className="text-sm font-medium">{subItem.label}</span>
                              </Link>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                }

                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg transition-all",
                      isActive ? "bg-gradient-to-r text-white" : "text-gray-400 hover:bg-white/5",
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
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <div className="flex h-screen overflow-hidden">
        <DashboardSidebar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </ThemeProvider>
  )
}
