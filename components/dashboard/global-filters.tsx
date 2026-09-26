"use client"

import { useState } from "react"
import { Calendar, Building2, Clock, User, CreditCard, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format, subDays } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"

export interface GlobalFilters {
  dateRange: { from: Date; to: Date }
  branch?: string
  shift?: string
  seller?: string
  paymentMethod?: string
  category?: string
  /** Franja horaria del dia: desde (0-23) hasta (1-24, exclusivo). Si desde > hasta cruza la medianoche. */
  hourRange?: { from: number; to: number }
}

interface GlobalFiltersProps {
  filters: GlobalFilters
  onChange: (filters: GlobalFilters) => void
  branches?: Array<{ id: string; name: string }>
  sellers?: Array<{ id: string; name: string }>
  categories?: Array<{ id: string; name: string }>
  showHourFilter?: boolean
}

export function GlobalFiltersComponent({
  filters,
  onChange,
  branches = [],
  sellers = [],
  categories = [],
  showHourFilter = false,
}: GlobalFiltersProps) {
  const [isDateOpen, setIsDateOpen] = useState(false)

  const quickDatePresets = [
    { label: "Hoy", days: 0 },
    { label: "Ayer", days: 1 },
    { label: "Últimos 7 días", days: 7 },
    { label: "Últimos 30 días", days: 30 },
    { label: "Últimos 90 días", days: 90 },
  ]

  const handleQuickDate = (days: number) => {
    onChange({
      ...filters,
      dateRange: {
        from: subDays(new Date(), days),
        // "Ayer" es solo ese dia; el resto llega hasta hoy.
        to: days === 1 ? subDays(new Date(), 1) : new Date(),
      },
    })
    setIsDateOpen(false)
  }

  const hourFrom = filters.hourRange?.from
  const hourTo = filters.hourRange?.to
  const setHour = (part: "from" | "to", value: string) => {
    const current = filters.hourRange ?? { from: 0, to: 24 }
    const next = { ...current, [part]: value === "all" ? (part === "from" ? 0 : 24) : Number(value) }
    const isWholeDay = next.from === 0 && next.to === 24
    onChange({ ...filters, hourRange: isWholeDay ? undefined : next })
  }
  const hourLabel = (h: number) => `${String(h).padStart(2, "0")}:00`

  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-cyan-500/20 rounded-xl p-6 shadow-2xl">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-8 w-1 bg-gradient-to-b from-cyan-400 to-cyan-600 rounded-full" />
        <h2 className="text-lg font-bold text-white">Filtros Globales</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Date Range Picker */}
        <Popover open={isDateOpen} onOpenChange={setIsDateOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal bg-gray-800/50 border-gray-700 hover:bg-gray-800 hover:border-cyan-500/50",
                !filters.dateRange && "text-gray-400",
              )}
            >
              <Calendar className="mr-2 h-4 w-4 text-cyan-400" />
              {filters.dateRange?.from ? (
                filters.dateRange.to ? (
                  <>
                    {format(filters.dateRange.from, "dd MMM", { locale: es })} -{" "}
                    {format(filters.dateRange.to, "dd MMM yyyy", { locale: es })}
                  </>
                ) : (
                  format(filters.dateRange.from, "dd MMM yyyy", { locale: es })
                )
              ) : (
                <span>Rango de fechas</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-gray-900 border-gray-700" align="start">
            <div className="p-4 space-y-2 border-b border-gray-700">
              {quickDatePresets.map((preset) => (
                <Button
                  key={preset.days}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start hover:bg-gray-800"
                  onClick={() => handleQuickDate(preset.days)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
            <CalendarComponent
              mode="range"
              selected={{
                from: filters.dateRange?.from,
                to: filters.dateRange?.to,
              }}
              onSelect={(range) => {
                if (range?.from) {
                  onChange({
                    ...filters,
                    dateRange: {
                      from: range.from,
                      to: range.to || range.from,
                    },
                  })
                }
              }}
              initialFocus
              className="bg-gray-900"
            />
          </PopoverContent>
        </Popover>

        {/* Branch Filter */}
        <Select
          value={filters.branch}
          onValueChange={(value) => onChange({ ...filters, branch: value === "all" ? undefined : value })}
        >
          <SelectTrigger className="bg-gray-800/50 border-gray-700 hover:bg-gray-800 hover:border-cyan-500/50">
            <Building2 className="mr-2 h-4 w-4 text-cyan-400" />
            <SelectValue placeholder="Todas las sucursales" />
          </SelectTrigger>
          <SelectContent className="bg-gray-900 border-gray-700">
            <SelectItem value="all">Todas las sucursales</SelectItem>
            {branches.map((branch) => (
              <SelectItem key={branch.id} value={branch.id}>
                {branch.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Shift Filter */}
        <Select
          value={filters.shift}
          onValueChange={(value) => onChange({ ...filters, shift: value === "all" ? undefined : value })}
        >
          <SelectTrigger className="bg-gray-800/50 border-gray-700 hover:bg-gray-800 hover:border-cyan-500/50">
            <Clock className="mr-2 h-4 w-4 text-cyan-400" />
            <SelectValue placeholder="Todos los turnos" />
          </SelectTrigger>
          <SelectContent className="bg-gray-900 border-gray-700">
            <SelectItem value="all">Todos los turnos</SelectItem>
            <SelectItem value="morning">Mañana (6-14h)</SelectItem>
            <SelectItem value="afternoon">Tarde (14-22h)</SelectItem>
            <SelectItem value="night">Noche (22-6h)</SelectItem>
          </SelectContent>
        </Select>

        {/* Seller Filter */}
        <Select
          value={filters.seller}
          onValueChange={(value) => onChange({ ...filters, seller: value === "all" ? undefined : value })}
        >
          <SelectTrigger className="bg-gray-800/50 border-gray-700 hover:bg-gray-800 hover:border-cyan-500/50">
            <User className="mr-2 h-4 w-4 text-cyan-400" />
            <SelectValue placeholder="Todos los vendedores" />
          </SelectTrigger>
          <SelectContent className="bg-gray-900 border-gray-700">
            <SelectItem value="all">Todos los vendedores</SelectItem>
            {sellers.map((seller) => (
              <SelectItem key={seller.id} value={seller.id}>
                {seller.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Payment Method Filter */}
        <Select
          value={filters.paymentMethod}
          onValueChange={(value) => onChange({ ...filters, paymentMethod: value === "all" ? undefined : value })}
        >
          <SelectTrigger className="bg-gray-800/50 border-gray-700 hover:bg-gray-800 hover:border-cyan-500/50">
            <CreditCard className="mr-2 h-4 w-4 text-cyan-400" />
            <SelectValue placeholder="Métodos de pago" />
          </SelectTrigger>
          <SelectContent className="bg-gray-900 border-gray-700">
            <SelectItem value="all">Todos los métodos</SelectItem>
            <SelectItem value="cash">Efectivo</SelectItem>
            <SelectItem value="card">Tarjeta</SelectItem>
            <SelectItem value="qr">QR/Wallet</SelectItem>
            <SelectItem value="transfer">Transferencia</SelectItem>
          </SelectContent>
        </Select>

        {/* Category Filter */}
        <Select
          value={filters.category}
          onValueChange={(value) => onChange({ ...filters, category: value === "all" ? undefined : value })}
        >
          <SelectTrigger className="bg-gray-800/50 border-gray-700 hover:bg-gray-800 hover:border-cyan-500/50">
            <Package className="mr-2 h-4 w-4 text-cyan-400" />
            <SelectValue placeholder="Categorías" />
          </SelectTrigger>
          <SelectContent className="bg-gray-900 border-gray-700">
            <SelectItem value="all">Todas las categorías</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {showHourFilter && (
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-gray-700/60 pt-4">
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <Clock className="h-4 w-4 text-cyan-400" />
            Franja horaria
          </div>
          <Select value={!hourFrom ? "all" : String(hourFrom)} onValueChange={(v) => setHour("from", v)}>
            <SelectTrigger className="w-40 bg-gray-800/50 border-gray-700 hover:bg-gray-800 hover:border-cyan-500/50">
              <SelectValue placeholder="Desde" />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-gray-700 max-h-64">
              <SelectItem value="all">Desde: 00:00</SelectItem>
              {Array.from({ length: 23 }, (_, i) => i + 1).map((h) => (
                <SelectItem key={h} value={String(h)}>
                  Desde: {hourLabel(h)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={hourTo === undefined || hourTo === 24 ? "all" : String(hourTo)} onValueChange={(v) => setHour("to", v)}>
            <SelectTrigger className="w-40 bg-gray-800/50 border-gray-700 hover:bg-gray-800 hover:border-cyan-500/50">
              <SelectValue placeholder="Hasta" />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-gray-700 max-h-64">
              <SelectItem value="all">Hasta: 24:00</SelectItem>
              {Array.from({ length: 23 }, (_, i) => i + 1).map((h) => (
                <SelectItem key={h} value={String(h)}>
                  Hasta: {hourLabel(h)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {filters.hourRange && (
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white"
              onClick={() => onChange({ ...filters, hourRange: undefined })}
            >
              Todo el día
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
