"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Building2, Check, ChevronDown, Plus } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface Kiosko {
  id: string
  name: string
  location: string
}

export function KioskoSelector() {
  const router = useRouter()
  const [kioscos, setKioscos] = useState<Kiosko[]>([])
  const [selectedKiosko, setSelectedKiosko] = useState<Kiosko | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadKioscos()
  }, [])

  const loadKioscos = async () => {
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setIsLoading(false)
        return
      }

      const { data, error: kioskoError } = await supabase
        .from("kioscos")
        .select("id, name, location")
        .eq("owner_id", user.id)
        .order("name")

      if (kioskoError) {
        setIsLoading(false)
        return
      }

      if (data && data.length > 0) {
        setKioscos(data)
        const savedKioskoId = localStorage.getItem("selectedKioskoId")
        const activeKiosko = data.find((k) => k.id === savedKioskoId) || data[0]
        setSelectedKiosko(activeKiosko)
      }

      setIsLoading(false)
    } catch (error) {
      setIsLoading(false)
    }
  }

  const handleSelectKiosko = (kiosko: Kiosko) => {
    setSelectedKiosko(kiosko)
    localStorage.setItem("selectedKioskoId", kiosko.id)
    window.dispatchEvent(new CustomEvent("kioskoChanged", { detail: kiosko.id }))
    router.refresh()
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5">
        <Building2 className="w-4 h-4 text-gray-400" />
        <span className="text-sm text-gray-400">Cargando...</span>
      </div>
    )
  }

  if (kioscos.length === 0) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push("/dashboard/kioscos")}
        className="text-gray-400 hover:text-white"
      >
        <Plus className="w-4 h-4 mr-2" />
        Crear kiosco
      </Button>
    )
  }

  if (kioscos.length === 1) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5">
        <Building2 className="w-4 h-4 text-cyan-400" />
        <div className="flex flex-col">
          <span className="text-sm text-white font-medium">{selectedKiosko?.name}</span>
          <span className="text-xs text-gray-500">{selectedKiosko?.location}</span>
        </div>
      </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2 hover:bg-white/5">
          <Building2 className="w-4 h-4 text-cyan-400" />
          <div className="flex flex-col items-start">
            <span className="text-sm text-white font-medium">{selectedKiosko?.name || "Seleccionar kiosco"}</span>
            {selectedKiosko && <span className="text-xs text-gray-500">{selectedKiosko.location}</span>}
          </div>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64 bg-[#0a0f1a] border-cyan-500/20">
        <DropdownMenuLabel className="text-gray-400 text-xs uppercase">Tus Kioscos</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-cyan-500/10" />
        {kioscos.map((kiosko) => (
          <DropdownMenuItem
            key={kiosko.id}
            onClick={() => handleSelectKiosko(kiosko)}
            className="flex items-center gap-3 cursor-pointer hover:bg-white/5 focus:bg-white/5"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm text-white font-medium">{kiosko.name}</p>
                {selectedKiosko?.id === kiosko.id && <Check className="w-4 h-4 text-cyan-400" />}
              </div>
              <p className="text-xs text-gray-500">{kiosko.location}</p>
            </div>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator className="bg-cyan-500/10" />
        <DropdownMenuItem
          onClick={() => router.push("/dashboard/kioscos")}
          className="flex items-center gap-2 text-cyan-400 hover:bg-cyan-500/10 focus:bg-cyan-500/10 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm">Gestionar kioscos</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
