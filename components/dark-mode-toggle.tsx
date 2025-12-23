"use client"

import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

export function DarkModeToggle() {
  const [isDark, setIsDark] = useState(true)

  useEffect(() => {
    // Check localStorage and system preference on mount
    const stored = localStorage.getItem("atlasone_darkmode")
    if (stored !== null) {
      const darkMode = stored === "true"
      setIsDark(darkMode)
      if (!darkMode) {
        document.documentElement.classList.remove("dark")
      }
    } else {
      // Default to dark mode
      document.documentElement.classList.add("dark")
    }
  }, [])

  const toggleDarkMode = () => {
    const newIsDark = !isDark
    setIsDark(newIsDark)
    localStorage.setItem("atlasone_darkmode", String(newIsDark))

    if (newIsDark) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleDarkMode}
      className="w-9 h-9 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
      title={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
    >
      {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </Button>
  )
}
