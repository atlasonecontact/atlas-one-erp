"use client"

import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/lib/theme-context"
import { cn } from "@/lib/utils"

export function ThemeModeToggle({ className }: { className?: string }) {
  const { mode, toggleMode } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleMode}
      aria-label={mode === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      title={mode === "dark" ? "Modo claro" : "Modo oscuro"}
      className={cn("text-muted-foreground hover:text-foreground touch-target", className)}
    >
      {mode === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </Button>
  )
}
