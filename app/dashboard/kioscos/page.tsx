"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Plus, MapPin, Phone, Trash2, Edit } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { KioskoModal } from "@/components/kioscos/kiosko-modal"

type Kiosko = {
  id: string
  name: string
  location: string
  status: string
  whatsapp_phone: string | null
  background_color: string
  accent_color: string
  subscription_plan_id: string | null
  plan?: {
    display_name: string
    price: number
  }
}

export default function KioscosPage() {
  const [kioscos, setKioscos] = useState<Kiosko[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedKiosko, setSelectedKiosko] = useState<Kiosko | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadKioscos()
  }, [])

  const loadKioscos = async () => {
    setIsLoading(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setIsLoading(false)
      return
    }

    const { data: kioscosData, error: kioscosError } = await supabase
      .from("kioscos")
      .select(
        `
        *,
        subscription_plans (
          display_name,
          price
        )
      `,
      )
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false })

    if (kioscosError) {
      console.error("[v0] Error loading kioscos:", kioscosError)
    }

    if (kioscosData) {
      console.log("[v0] Loaded kioscos:", kioscosData.length)
      setKioscos(
        kioscosData.map((k: any) => ({
          ...k,
          plan: k.subscription_plans,
        })),
      )
    }
    setIsLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este kiosco? Esta acción no se puede deshacer.")) return

    const { error } = await supabase.from("kioscos").delete().eq("id", id)

    if (error) {
      alert("Error al eliminar el kiosco")
      return
    }

    loadKioscos()
  }

  const handleEdit = (kiosko: Kiosko) => {
    setSelectedKiosko(kiosko)
    setIsModalOpen(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "inactive":
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
      case "suspended":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-700 rounded w-1/4" />
          <div className="h-32 bg-gray-700 rounded" />
          <div className="h-32 bg-gray-700 rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Mis Kioscos</h1>
          <p className="text-gray-400 mt-1">Gestiona todos tus puntos de venta</p>
        </div>
        <Button
          onClick={() => {
            setSelectedKiosko(null)
            setIsModalOpen(true)
          }}
          className="bg-cyan-500 hover:bg-cyan-400 text-black"
        >
          <Plus className="w-4 h-4 mr-2" />
          Agregar Kiosco
        </Button>
      </div>

      {kioscos.length === 0 ? (
        <div className="border border-cyan-500/20 rounded-xl bg-[#0a0f1a]/50 p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-cyan-500/10 flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-cyan-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No tienes kioscos registrados</h3>
          <p className="text-gray-400 mb-6">Agrega tu primer kiosco para empezar a vender</p>
          <Button
            onClick={() => {
              setSelectedKiosko(null)
              setIsModalOpen(true)
            }}
            className="bg-cyan-500 hover:bg-cyan-400 text-black"
          >
            <Plus className="w-4 h-4 mr-2" />
            Crear mi primer kiosco
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {kioscos.map((kiosko) => (
            <div
              key={kiosko.id}
              className="border border-cyan-500/20 rounded-xl bg-[#0a0f1a]/50 p-6 hover:border-cyan-500/40 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">{kiosko.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                    <MapPin className="w-4 h-4" />
                    {kiosko.location || "Sin ubicación"}
                  </div>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs border ${getStatusColor(kiosko.status)}`}
                  style={{
                    textTransform: "capitalize",
                  }}
                >
                  {kiosko.status}
                </span>
              </div>

              <div className="space-y-3 mb-4">
                {kiosko.plan && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Plan:</span>
                    <span className="text-cyan-400 font-medium">
                      {kiosko.plan.display_name} (${kiosko.plan.price}/mes)
                    </span>
                  </div>
                )}

                {kiosko.whatsapp_phone && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">WhatsApp:</span>
                    <span className="text-white flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {kiosko.whatsapp_phone}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-400">Colores:</span>
                  <div className="flex gap-2">
                    <div
                      className="w-6 h-6 rounded border border-gray-600"
                      style={{ backgroundColor: kiosko.background_color }}
                      title="Fondo"
                    />
                    <div
                      className="w-6 h-6 rounded border border-gray-600"
                      style={{ backgroundColor: kiosko.accent_color }}
                      title="Acento"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(kiosko)}
                  className="flex-1 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(kiosko.id)}
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <KioskoModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedKiosko(null)
        }}
        onSuccess={loadKioscos}
        kiosko={selectedKiosko}
      />
    </div>
  )
}
