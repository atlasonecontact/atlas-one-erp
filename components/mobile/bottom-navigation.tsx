"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, ShoppingCart, Package, BarChart3, Menu, Scan } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTheme } from "@/lib/theme-context"

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
  { href: "/dashboard/ventas", label: "Ventas", icon: ShoppingCart },
  { href: "/dashboard/productos", label: "Productos", icon: Package },
  { href: "/dashboard/estadisticas", label: "Stats", icon: BarChart3 },
]

interface BottomNavigationProps {
  onMenuClick: () => void
  onScanClick?: () => void
}

export function BottomNavigation({ onMenuClick, onScanClick }: BottomNavigationProps) {
  const pathname = usePathname()
  const { config } = useTheme()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-[#0a0f1a]/95 bottom-nav border-t safe-area-bottom lg:hidden"
      style={{ borderColor: config.border }}
    >
      <div className="flex items-center justify-around px-2 py-1">
        {navItems.slice(0, 2).map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all touch-target haptic-tap",
                isActive ? "text-white" : "text-gray-500",
              )}
            >
              <div
                className={cn("p-2 rounded-xl transition-all", isActive && "bg-gradient-to-br shadow-lg")}
                style={
                  isActive
                    ? {
                        background: `linear-gradient(135deg, ${config.primary}20, ${config.primary}10)`,
                        boxShadow: `0 4px 12px ${config.primary}30`,
                      }
                    : {}
                }
              >
                <item.icon className="w-5 h-5" style={isActive ? { color: config.primary } : {}} />
              </div>
              <span
                className={cn("text-[10px] mt-1 font-medium", isActive && "font-semibold")}
                style={isActive ? { color: config.primary } : {}}
              >
                {item.label}
              </span>
            </Link>
          )
        })}

        {/* Central Scan FAB */}
        <button
          onClick={onScanClick}
          className="relative -mt-8 flex items-center justify-center w-16 h-16 rounded-full fab haptic-tap"
          style={{
            background: `linear-gradient(135deg, ${config.primary}, ${config.accent})`,
          }}
        >
          <Scan className="w-7 h-7 text-black" />
          <span className="absolute -bottom-5 text-[10px] font-semibold" style={{ color: config.primary }}>
            Escanear
          </span>
        </button>

        {navItems.slice(2).map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all touch-target haptic-tap",
                isActive ? "text-white" : "text-gray-500",
              )}
            >
              <div
                className={cn("p-2 rounded-xl transition-all", isActive && "bg-gradient-to-br shadow-lg")}
                style={
                  isActive
                    ? {
                        background: `linear-gradient(135deg, ${config.primary}20, ${config.primary}10)`,
                        boxShadow: `0 4px 12px ${config.primary}30`,
                      }
                    : {}
                }
              >
                <item.icon className="w-5 h-5" style={isActive ? { color: config.primary } : {}} />
              </div>
              <span
                className={cn("text-[10px] mt-1 font-medium", isActive && "font-semibold")}
                style={isActive ? { color: config.primary } : {}}
              >
                {item.label}
              </span>
            </Link>
          )
        })}

        {/* Menu button */}
        <button
          onClick={onMenuClick}
          className="flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all touch-target haptic-tap text-gray-500"
        >
          <div className="p-2 rounded-xl">
            <Menu className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-1 font-medium">Más</span>
        </button>
      </div>
    </nav>
  )
}
