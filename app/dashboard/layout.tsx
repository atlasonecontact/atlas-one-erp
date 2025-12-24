"use client"

import { useEffect } from "react"

import { useState } from "react"

import Link from "next/link"
import { BarChart3, TrendingUp, ChevronRight } from "lucide-react"
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible"
import { SidebarMenuButton } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { usePathname } from "next/navigation"

const DashboardLayout = () => {
  const pathname = usePathname()
  const analisisDatosItems = [
    { href: "/dashboard/analisis-datos/estadistico-avanzado", label: "Análisis Estadístico Avanzado", icon: BarChart3 },
    { href: "/dashboard/analisis-datos/predictivo", label: "Análisis Predictivo", icon: TrendingUp },
  ]

  const [analisisDatosOpen, setAnalisisDatosOpen] = useState(false)

  const isAnalisisDatosActive = pathname?.startsWith("/dashboard/analisis-datos")

  useEffect(() => {
    if (isAnalisisDatosActive) setAnalisisDatosOpen(true)
  }, [pathname, isAnalisisDatosActive])

  return (
    <div>
      {/* Contabilidad section would go here */}
      <Collapsible open={analisisDatosOpen} onOpenChange={setAnalisisDatosOpen}>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            className={cn(
              "w-full justify-between",
              isAnalisisDatosActive && "bg-sidebar-accent text-sidebar-accent-foreground",
            )}
          >
            <div className="flex items-center">
              <BarChart3 className="mr-2 h-4 w-4" />
              <span>ANÁLISIS DE DATOS</span>
            </div>
            <ChevronRight className={cn("h-4 w-4 transition-transform", analisisDatosOpen && "rotate-90")} />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-1 pl-6">
          {analisisDatosItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <SidebarMenuButton
                className={cn(
                  "w-full justify-start text-sm",
                  pathname === item.href && "bg-sidebar-accent text-sidebar-accent-foreground",
                )}
              >
                {item.icon && <item.icon className="mr-2 h-4 w-4" />}
                <span>{item.label}</span>
              </SidebarMenuButton>
            </Link>
          ))}
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

export default DashboardLayout
