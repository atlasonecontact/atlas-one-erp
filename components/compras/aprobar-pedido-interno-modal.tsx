"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Warehouse } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/toast-provider"

interface PedidoAAprobar {
  id: string
  numero_pedido: string
  kiosco_id: string
  solicitante_nombre?: string
}

interface Props {
  open: boolean
  onClose: () => void
  pedido: PedidoAAprobar
  onSuccess: () => void
}

interface Kiosco {
  id: string
  name: string
}

export function AprobarPedidoInternoModal({ open, onClose, pedido, onSuccess }: Props) {
  const [kioscos, setKioscos] = useState<Kiosco[]>([])
  const [origenKioscoId, setOrigenKioscoId] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()
  const toast = useToast()

  useEffect(() => {
    if (open) loadKioscos()
  }, [open])

  const loadKioscos = async () => {
    setLoading(true)
    // De cuál local sale la mercadería: cualquier otro local del mismo
    // dueño que el que está pidiendo, nunca el que pide.
    const { data: destKiosco } = await supabase.from("kioscos").select("owner_id").eq("id", pedido.kiosco_id).single()

    if (destKiosco) {
      const { data } = await supabase
        .from("kioscos")
        .select("id, name")
        .eq("owner_id", destKiosco.owner_id)
        .neq("id", pedido.kiosco_id)
        .order("name")
      setKioscos(data || [])
    }
    setLoading(false)
  }

  const handleAprobar = async () => {
    if (!origenKioscoId) return
    setSaving(true)
    const { error } = await supabase.rpc("approve_pedido_interno", {
      p_pedido_id: pedido.id,
      p_origen_kiosko_id: origenKioscoId,
    })
    setSaving(false)

    if (error) {
      toast.error("No se pudo aprobar", error.message)
    } else {
      toast.success("Pedido aprobado", "El stock ya se movió entre los dos locales")
      onSuccess()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-cyan-500/20 text-foreground max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Warehouse className="w-5 h-5 text-cyan-400" />
            Aprobar pedido {pedido.numero_pedido}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <p className="text-sm text-muted-foreground">
            {pedido.solicitante_nombre ? (
              <>
                Pedido de <span className="text-foreground font-medium">{pedido.solicitante_nombre}</span>. Elegí de qué
                local sale esta mercadería — se le va a restar el stock a ese local y se le va a sumar a quien pidió.
              </>
            ) : (
              "Elegí de qué local sale esta mercadería."
            )}
          </p>

          <div className="space-y-2">
            <Label className="text-muted-foreground">Local de origen</Label>
            <Select value={origenKioscoId} onValueChange={setOrigenKioscoId}>
              <SelectTrigger className="bg-popover border-cyan-500/20 text-foreground">
                <SelectValue placeholder={loading ? "Cargando..." : "Seleccionar local"} />
              </SelectTrigger>
              <SelectContent className="bg-popover border-cyan-500/20">
                {kioscos.map((k) => (
                  <SelectItem key={k.id} value={k.id} className="text-foreground hover:bg-accent">
                    {k.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!loading && kioscos.length === 0 && (
              <p className="text-xs text-red-400">No tenés otro local para elegir como origen.</p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-cyan-500/20 text-muted-foreground hover:text-foreground bg-transparent"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleAprobar}
              disabled={!origenKioscoId || saving}
              className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold"
            >
              {saving ? "Aprobando..." : "Aprobar y mover stock"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
