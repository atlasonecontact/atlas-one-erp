"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

export function DarkModeToggle({ collapsed = false }: { collapsed?: boolean }) {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  const isDark = theme === "dark"

  return (
    <Button
      variant="ghost"
      size={collapsed ? "icon" : "default"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={`w-full ${collapsed ? "justify-center" : "justify-start"} text-gray-400 hover:text-white hover:bg-white/5`}
    >
      {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      {!collapsed && <span className="ml-3">{isDark ? "Modo Claro" : "Modo Nocturno"}</span>}
    </Button>
  )
}
