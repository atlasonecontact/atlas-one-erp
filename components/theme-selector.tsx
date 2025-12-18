"use client"

import { useTheme, themeConfigs, type ThemeColor } from "@/lib/theme-context"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Palette, Check } from "lucide-react"

export function ThemeSelector() {
  const { theme, setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-white/5">
          <Palette className="w-5 h-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 bg-[#0a0f1a] border-[var(--theme-border)] text-white">
        <div className="px-3 py-2 border-b border-white/10">
          <p className="text-sm font-medium">Tema de color</p>
        </div>
        {(Object.keys(themeConfigs) as ThemeColor[]).map((key) => (
          <DropdownMenuItem
            key={key}
            onClick={() => setTheme(key)}
            className="gap-3 text-gray-400 hover:text-white focus:text-white focus:bg-white/5 cursor-pointer"
          >
            <div
              className="w-5 h-5 rounded-full border-2"
              style={{ backgroundColor: themeConfigs[key].primary, borderColor: themeConfigs[key].primary }}
            />
            <span className="flex-1">{themeConfigs[key].name}</span>
            {theme === key && <Check className="w-4 h-4" style={{ color: themeConfigs[key].primary }} />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
