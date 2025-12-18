"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"

export type ThemeColor = "cyan" | "emerald" | "violet" | "rose" | "amber" | "blue"

interface ThemeConfig {
  name: string
  primary: string
  primaryHover: string
  primaryMuted: string
  border: string
  glow: string
}

export const themeConfigs: Record<ThemeColor, ThemeConfig> = {
  cyan: {
    name: "Cyan",
    primary: "#00d4ff",
    primaryHover: "#00b8e6",
    primaryMuted: "rgba(0, 212, 255, 0.1)",
    border: "rgba(0, 212, 255, 0.2)",
    glow: "rgba(0, 212, 255, 0.3)",
  },
  emerald: {
    name: "Esmeralda",
    primary: "#10b981",
    primaryHover: "#059669",
    primaryMuted: "rgba(16, 185, 129, 0.1)",
    border: "rgba(16, 185, 129, 0.2)",
    glow: "rgba(16, 185, 129, 0.3)",
  },
  violet: {
    name: "Violeta",
    primary: "#8b5cf6",
    primaryHover: "#7c3aed",
    primaryMuted: "rgba(139, 92, 246, 0.1)",
    border: "rgba(139, 92, 246, 0.2)",
    glow: "rgba(139, 92, 246, 0.3)",
  },
  rose: {
    name: "Rosa",
    primary: "#f43f5e",
    primaryHover: "#e11d48",
    primaryMuted: "rgba(244, 63, 94, 0.1)",
    border: "rgba(244, 63, 94, 0.2)",
    glow: "rgba(244, 63, 94, 0.3)",
  },
  amber: {
    name: "Ámbar",
    primary: "#f59e0b",
    primaryHover: "#d97706",
    primaryMuted: "rgba(245, 158, 11, 0.1)",
    border: "rgba(245, 158, 11, 0.2)",
    glow: "rgba(245, 158, 11, 0.3)",
  },
  blue: {
    name: "Azul",
    primary: "#3b82f6",
    primaryHover: "#2563eb",
    primaryMuted: "rgba(59, 130, 246, 0.1)",
    border: "rgba(59, 130, 246, 0.2)",
    glow: "rgba(59, 130, 246, 0.3)",
  },
}

interface ThemeContextType {
  theme: ThemeColor
  config: ThemeConfig
  setTheme: (theme: ThemeColor) => void
  isOnline: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeColor>("cyan")
  const [isOnline, setIsOnline] = useState(true)

  // Load theme from localStorage/database on mount
  useEffect(() => {
    const saved = localStorage.getItem("atlasone_theme") as ThemeColor
    if (saved && themeConfigs[saved]) {
      setThemeState(saved)
    }
  }, [])

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    setIsOnline(navigator.onLine)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  // Apply theme CSS variables
  useEffect(() => {
    const config = themeConfigs[theme]
    document.documentElement.style.setProperty("--theme-primary", config.primary)
    document.documentElement.style.setProperty("--theme-primary-hover", config.primaryHover)
    document.documentElement.style.setProperty("--theme-primary-muted", config.primaryMuted)
    document.documentElement.style.setProperty("--theme-border", config.border)
    document.documentElement.style.setProperty("--theme-glow", config.glow)
  }, [theme])

  const setTheme = useCallback(async (newTheme: ThemeColor) => {
    setThemeState(newTheme)
    localStorage.setItem("atlasone_theme", newTheme)

    // Try to save to database if online
    if (navigator.onLine) {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        await supabase.from("profiles").update({ theme: newTheme }).eq("id", user.id)
      }
    }
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, config: themeConfigs[theme], setTheme, isOnline }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
