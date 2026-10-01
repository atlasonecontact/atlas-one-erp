"use client"

import { useEffect, useState } from "react"
import { Moon, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/toast-provider"

export interface SurchargeConfig {
  enabled: boolean
  percentage: number
  start_time: string // "HH:MM"
  end_time: string // "HH:MM"
}

export const DEFAULT_SURCHARGE: SurchargeConfig = {
  enabled: false,
  percentage: 10,
  start_time: "22:00",
  end_time: "04:00",
}

// ¿La hora actual (en minutos desde 00:00) cae dentro de la franja? Soporta que
// la franja cruce la medianoche (ej: 22:00 a 04:00).
export function isSurchargeActiveNow(config: SurchargeConfig | null, now: Date = new Date()): boolean {
  if (!config?.enabled) return false
  const toMinutes = (hhmm: string) => {
    const [h, m] = hhmm.split(":").map(Number)
    return (h || 0) * 60 + (m || 0)
  }
  const start = toMinutes(config.start_time)
  const end = toMinutes(config.end_time)
  const current = now.getHours() * 60 + now.getMinutes()
  if (start === end) return false
  if (start < end) return current >= start && current < end
  // Cruza la medianoche.
  return current >= start || current < end
}

interface SurchargeModalProps {
  open: boolean
  onClose: () => void
  kioskoId: string
  config: SurchargeConfig | null
  onSaved: (config: SurchargeConfig) => void
}

export function SurchargeModal({ open, onClose, kioskoId, config, onSaved }: SurchargeModalProps) {
  const [enabled, setEnabled] = useState(false)
  const [percentage, setPercentage] = useState(10)
  const [startTime, setStartTime] = useState("22:00")
  const [endTime, setEndTime] = useState("04:00")
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const supabase = createClient()
  const toast = useToast()

  useEffect(() => {
    if (!open) return
    setSaveError(null)
    const c = config || DEFAULT_SURCHARGE
    setEnabled(c.enabled)
    setPercentage(c.percentage)
    setStartTime(c.start_time)
    setEndTime(c.end_time)
  }, [open, config])

  const handleSave = async () => {
    setSaveError(null)
    if (!kioskoId) {
      setSaveError("No se encontró tu sucursal todavía (kioskoId vacío). Esperá un segundo y probá de nuevo.")
      return
    }
    setSaving(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const payload = {
        kiosko_id: kioskoId,
        enabled,
        percentage,
        start_time: startTime,
        end_time: endTime,
        updated_at: new Date().toISOString(),
      }
      const { error } = await supabase.from("price_surcharges").upsert(payload, { onConflict: "kiosko_id" })
      if (error) {
        throw new Error(`${error.message} (code: ${error.code || "?"}, user: ${user?.id?.slice(0, 8) || "sin sesión"}, kiosko: ${kioskoId.slice(0, 8)})`)
      }

      onSaved({ enabled, percentage, start_time: startTime, end_time: endTime })
      toast.success(
        enabled ? "Recargo configurado" : "Recargo desactivado",
        enabled ? `+${percentage}% de ${startTime} a ${endTime}` : undefined,
      )
      onClose()
    } catch (error: any) {
      console.error("[SurchargeModal] Error al guardar:", error)
      setSaveError(error?.message || "Error desconocido")
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border border-cyan-500/20 bg-[#0a0f1a] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/15">
              <Moon className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Recargo por horario</h2>
              <p className="text-xs text-gray-400">Sube el precio de todos los productos en una franja del día</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 transition-colors hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <label className="mb-5 flex cursor-pointer items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3">
          <span className="text-sm font-medium text-white">Activar recargo</span>
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="h-5 w-5 accent-cyan-500"
          />
        </label>

        <div className="mb-4 space-y-2">
          <label className="text-sm text-gray-300">Porcentaje de aumento</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              max={500}
              step={1}
              value={percentage}
              onChange={(e) => setPercentage(Math.max(0, Number(e.target.value)))}
              className="h-11 w-28 rounded-md border border-cyan-500/20 bg-[#0d1424] px-3 text-center text-lg font-mono text-white"
            />
            <span className="text-gray-400">%</span>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="text-sm text-gray-300">Desde</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="h-11 w-full rounded-md border border-cyan-500/20 bg-[#0d1424] px-3 text-white"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-gray-300">Hasta</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="h-11 w-full rounded-md border border-cyan-500/20 bg-[#0d1424] px-3 text-white"
            />
          </div>
        </div>

        {startTime > endTime && (
          <p className="mb-4 text-xs text-gray-500">
            Cruza la medianoche: se aplica desde las {startTime} hasta las {endTime} del día siguiente.
          </p>
        )}

        {saveError && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300 break-words select-all">
            {saveError}
          </div>
        )}

        <button
          type="button"
          disabled={saving}
          onClick={handleSave}
          className="h-11 w-full rounded-lg bg-cyan-500 font-semibold text-black transition-colors hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </div>
  )
}
