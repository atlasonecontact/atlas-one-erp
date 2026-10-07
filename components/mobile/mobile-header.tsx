"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AtlasLogo } from "@/components/atlas-logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Menu, Search, User, X } from "lucide-react"
import { useTheme } from "@/lib/theme-context"
import { KioskoSelector } from "@/components/kiosko-selector"
import { NotificationsDropdown } from "@/components/notifications-dropdown"
import { ThemeModeToggle } from "@/components/theme-mode-toggle"

interface MobileHeaderProps {
  userName?: string
  showSearch?: boolean
  onMenuClick?: () => void
}

export function MobileHeader({ userName, showSearch = true, onMenuClick }: MobileHeaderProps) {
  const { config } = useTheme()
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()

  return (
    <header
      className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b safe-area-top lg:hidden"
      style={{ borderColor: config.border }}
    >
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left - Logo or Search */}
        {isSearchOpen ? (
          <div className="flex-1 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar productos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 h-10 bg-card text-foreground placeholder:text-muted-foreground text-base"
                style={{ borderColor: config.border }}
                autoFocus
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setIsSearchOpen(false)
                setSearchQuery("")
              }}
              className="shrink-0"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        ) : (
          <>
            {/* Menú */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onMenuClick}
              className="shrink-0 text-muted-foreground hover:text-foreground touch-target"
              aria-label="Abrir menú"
            >
              <Menu className="w-5 h-5" />
            </Button>

            {/* Logo */}
            <AtlasLogo variant="icon" className="w-8 h-8 ml-1" />

            {/* Center - Kiosko selector */}
            <div className="flex-1 mx-3">
              <KioskoSelector />
            </div>

            {/* Right - Actions */}
            <div className="flex items-center gap-1">
              {showSearch && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSearchOpen(true)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Search className="w-5 h-5" />
                </Button>
              )}
              <ThemeModeToggle />
              <NotificationsDropdown />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/dashboard/configuracion")}
                className="text-muted-foreground hover:text-foreground touch-target"
                aria-label="Perfil"
              >
                <User className="w-5 h-5" />
              </Button>
            </div>
          </>
        )}
      </div>
    </header>
  )
}
