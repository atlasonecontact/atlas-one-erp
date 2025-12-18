"use client"

import { useTheme } from "@/lib/theme-context"
import { Wifi, WifiOff } from "lucide-react"
import { cn } from "@/lib/utils"

export function OnlineStatus() {
  const { isOnline, config } = useTheme()

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-full border transition-colors",
        isOnline ? "bg-green-500/10 border-green-500/20" : "bg-red-500/10 border-red-500/20",
      )}
    >
      {isOnline ? (
        <>
          <Wifi className="w-3.5 h-3.5 text-green-400" />
          <span className="text-xs text-green-400 font-medium">En línea</span>
        </>
      ) : (
        <>
          <WifiOff className="w-3.5 h-3.5 text-red-400" />
          <span className="text-xs text-red-400 font-medium">Sin conexión</span>
        </>
      )}
    </div>
  )
}
