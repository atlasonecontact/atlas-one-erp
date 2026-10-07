"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Search, X, GlassWater } from "lucide-react"
import { formatCurrency } from "@/lib/utils/currency"

export interface ChoiceOption {
  id: string
  name: string
  price: number
  stock: number
  category?: string
}

interface ChoiceModalProps {
  open: boolean
  promoName: string
  quantity: number
  options: ChoiceOption[]
  onSelect: (option: ChoiceOption) => void
  onClose: () => void
}

// Elegir a mano la bebida de una promocion "bebida a elección" antes de agregarla al carrito.
export function ChoiceModal({ open, promoName, quantity, options, onSelect, onClose }: ChoiceModalProps) {
  const [query, setQuery] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setQuery("")
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? options.filter((o) => o.name.toLowerCase().includes(q) || (o.category || "").toLowerCase().includes(q)) : options
  }, [options, query])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-cyan-500/20 bg-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-cyan-500/10 p-5">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
              <GlassWater className="h-5 w-5 text-cyan-400" />
              Elegí la bebida
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {promoName}: {quantity === 1 ? "1 bebida" : `${quantity} bebidas iguales`} a elección. Se descuenta del stock la que
              elijas.
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground transition-colors hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-cyan-500/10 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar bebida..."
              className="h-10 w-full rounded-md border border-cyan-500/20 bg-[#0d1424] pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">
              {options.length === 0 ? "No hay bebidas con stock para esta promoción." : "No se encontró esa bebida."}
            </p>
          ) : (
            <ul className="divide-y divide-cyan-500/5">
              {filtered.map((o) => (
                <li key={o.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(o)}
                    className="flex w-full items-center justify-between gap-3 px-5 py-3 text-left transition-colors hover:bg-cyan-500/5"
                  >
                    <div className="min-w-0">
                      <p className="break-words text-sm font-medium text-foreground">{o.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {o.category ? `${o.category} · ` : ""}
                        {o.stock} un. en stock
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-cyan-400">{formatCurrency(o.price)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
