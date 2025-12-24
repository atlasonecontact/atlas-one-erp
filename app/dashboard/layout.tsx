"use client"

import Link from "next/link"

import React, { useState, useEffect } from "react"
import { BarChart3, TrendingUp, ChevronRight } from "path-to-icons" // Replace with actual import paths
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "path-to-collapsible" // Replace with actual import paths
import { SidebarMenuButton } from "path-to-sidebar-menu-button" // Replace with actual import paths
import { cn } from "path-to-cn" // Replace with actual import paths
import { usePathname } from "next/navigation" // Import for pathname

const DashboardLayout = () => {
  const pathname = usePathname()
  const analisisDatosItems = [
    { href: "/dashboard/analisis-datos/estadistico-avanzado", label: "Análisis Estadístico Avanzado", icon: BarChart3 },
    { href: "/dashboard/analisis-datos/predictivo", label: "Análisis Predictivo", icon: TrendingUp },
  ]

  const [analisisDatosOpen, setAnalisisDatosOpen] = useState(false)

  const isAnalisisDatosActive = pathname.startsWith("/dashboard/analisis-datos")

  useEffect(() => {
    if (isAnalisisDatosActive) setAnalisisDatosOpen(true)
  }, [pathname])

  return (
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
            <span>Análisis de Datos</span>
          </div>
          <ChevronRight className={cn("h-4 w-4 transition-transform", analisisDatosOpen && "rotate-90")} />
        </SidebarMenuButton>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-1 pl-6">
        {analisisDatosItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <SidebarMenuButton
              className={cn(
                "w-full justify-start",
                pathname === item.href && "bg-sidebar-accent text-sidebar-accent-foreground",
              )}
            >
              {React.createElement(item.icon, { className: "mr-2 h-4 w-4" })}
              <span className="text-sm">{item.label}</span>
            </SidebarMenuButton>
          </Link>
        ))}
      </CollapsibleContent>
    </Collapsible>
  )
}

export default DashboardLayout
