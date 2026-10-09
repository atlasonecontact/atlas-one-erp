"use client"

import { useState } from "react"
import { Calendar, Building2, Clock, User, CreditCard, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format, isSameDay, subDays } from "date-fns"
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
  /** Agrega atajos de rango (7 dias, 30 dias, este mes) ademas de elegir un solo dia. */
  allowRange?: boolean
}

// Todos los controles ocupan su celda completa y recortan el texto largo: nada se superpone.
const triggerClass =
  "w-full min-w-0 justify-start bg-muted border-border text-foreground hover:bg-accent hover:border-cyan-500/50 [&>span]:truncate"
const iconClass = "mr-2 h-4 w-4 shrink-0 text-cyan-400"

export function GlobalFiltersComponent({
  filters,
  onChange,
  branches = [],
  sellers = [],
  categories = [],
  showHourFilter = false,
  allowRange = false,
}: GlobalFiltersProps) {
  const [isDateOpen, setIsDateOpen] = useState(false)

  const { from, to } = filters.dateRange
  const singleDay = isSameDay(from, to)
  const today = new Date()

  const pickDay = (day: Date) => {
    onChange({ ...filters, dateRange: { from: day, to: day } })
    setIsDateOpen(false)
  }

  const pickRange = (fromDate: Date, toDate: Date) => {
    onChange({ ...filters, dateRange: { from: fromDate, to: toDate } })
    setIsDateOpen(false)
  }

  const dateLabel = singleDay
    ? isSameDay(from, today)
      ? `Hoy, ${format(from, "d MMM yyyy", { locale: es })}`
      : isSameDay(from, subDays(today, 1))
        ? `Ayer, ${format(from, "d MMM yyyy", { locale: es })}`
        : format(from, "EEE d MMM yyyy", { locale: es })
    : `${format(from, "d MMM", { locale: es })} - ${format(to, "d MMM yyyy", { locale: es })}`

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
    <div className="rounded-xl border border-border bg-card p-4 shadow-2xl sm:p-6">
      <div className="mb-4 flex items-center gap-2">
        <div className="h-8 w-1 rounded-full bg-gradient-to-b from-cyan-400 to-cyan-600" />
        <h2 className="text-lg font-bold text-foreground">Filtros Globales</h2>
      </div>

      <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(300px,1fr))]">
        {/* Fecha: un solo dia */}
        <Popover open={isDateOpen} onOpenChange={setIsDateOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn(triggerClass, "font-normal capitalize")}>
              <Calendar className={iconClass} />
              <span>{dateLabel}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto border-border bg-popover p-0" align="start">
            <div className="flex gap-2 border-b border-border p-3">
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "flex-1 border-border bg-transparent",
                  singleDay && isSameDay(from, today) && "border-cyan-500/60 text-cyan-300",
                )}
                onClick={() => pickDay(new Date())}
              >
                Hoy
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "flex-1 border-border bg-transparent",
                  singleDay && isSameDay(from, subDays(today, 1)) && "border-cyan-500/60 text-cyan-300",
                )}
                onClick={() => pickDay(subDays(new Date(), 1))}
              >
                Ayer
              </Button>
            </div>
            {allowRange && (
              <div className="flex flex-wrap gap-2 border-b border-border p-3">
                <Button variant="outline" size="sm" className="flex-1 border-border bg-transparent" onClick={() => pickRange(subDays(new Date(), 6), new Date())}>
                  7 días
                </Button>
                <Button variant="outline" size="sm" className="flex-1 border-border bg-transparent" onClick={() => pickRange(subDays(new Date(), 29), new Date())}>
                  30 días
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 border-border bg-transparent"
                  onClick={() => pickRange(new Date(new Date().getFullYear(), new Date().getMonth(), 1), new Date())}
                >
                  Este mes
                </Button>
              </div>
            )}
            <CalendarComponent
              mode="single"
              locale={es}
              selected={singleDay ? from : undefined}
              defaultMonth={from}
              disabled={{ after: new Date() }}
              onSelect={(day) => {
                if (day) pickDay(day)
              }}
              initialFocus
              className="bg-popover"
            />
          </PopoverContent>
        </Popover>

        <Select
          value={filters.branch ?? "all"}
          onValueChange={(value) => onChange({ ...filters, branch: value === "all" ? undefined : value })}
        >
          <SelectTrigger className={triggerClass}>
            <Building2 className={iconClass} />
            <SelectValue placeholder="Todas las sucursales" />
          </SelectTrigger>
          <SelectContent className="border-border bg-popover">
            <SelectItem value="all">Todas las sucursales</SelectItem>
            {branches.map((branch) => (
              <SelectItem key={branch.id} value={branch.id}>
                {branch.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.shift ?? "all"}
          onValueChange={(value) => onChange({ ...filters, shift: value === "all" ? undefined : value })}
        >
          <SelectTrigger className={triggerClass}>
            <Clock className={iconClass} />
            <SelectValue placeholder="Todos los turnos" />
          </SelectTrigger>
          <SelectContent className="border-border bg-popover">
            <SelectItem value="all">Todos los turnos</SelectItem>
            <SelectItem value="morning">Mañana (6-14h)</SelectItem>
            <SelectItem value="afternoon">Tarde (14-22h)</SelectItem>
            <SelectItem value="night">Noche (22-6h)</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.seller ?? "all"}
          onValueChange={(value) => onChange({ ...filters, seller: value === "all" ? undefined : value })}
        >
          <SelectTrigger className={triggerClass}>
            <User className={iconClass} />
            <SelectValue placeholder="Todos los vendedores" />
          </SelectTrigger>
          <SelectContent className="border-border bg-popover">
            <SelectItem value="all">Todos los vendedores</SelectItem>
            {sellers.map((seller) => (
              <SelectItem key={seller.id} value={seller.id}>
                {seller.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.paymentMethod ?? "all"}
          onValueChange={(value) => onChange({ ...filters, paymentMethod: value === "all" ? undefined : value })}
        >
          <SelectTrigger className={triggerClass}>
            <CreditCard className={iconClass} />
            <SelectValue placeholder="Todos los métodos" />
          </SelectTrigger>
          <SelectContent className="border-border bg-popover">
            <SelectItem value="all">Todos los métodos</SelectItem>
            <SelectItem value="cash">Efectivo</SelectItem>
            <SelectItem value="card">Tarjeta</SelectItem>
            <SelectItem value="qr">QR/Wallet</SelectItem>
            <SelectItem value="transfer">Transferencia</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.category ?? "all"}
          onValueChange={(value) => onChange({ ...filters, category: value === "all" ? undefined : value })}
        >
          <SelectTrigger className={triggerClass}>
            <Package className={iconClass} />
            <SelectValue placeholder="Todas las categorías" />
          </SelectTrigger>
          <SelectContent className="border-border bg-popover">
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
        <div className="mt-4 border-t border-border/60 pt-4">
          <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4 shrink-0 text-cyan-400" />
            Franja horaria
            {filters.hourRange && (
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto h-7 px-2 text-muted-foreground hover:text-foreground"
                onClick={() => onChange({ ...filters, hourRange: undefined })}
              >
                Todo el día
              </Button>
            )}
          </div>
          <div className="grid max-w-md grid-cols-2 gap-3">
            <Select value={!hourFrom ? "all" : String(hourFrom)} onValueChange={(v) => setHour("from", v)}>
              <SelectTrigger className={triggerClass}>
                <SelectValue placeholder="Desde" />
              </SelectTrigger>
              <SelectContent className="max-h-64 border-border bg-popover">
                <SelectItem value="all">Desde 00:00</SelectItem>
                {Array.from({ length: 23 }, (_, i) => i + 1).map((h) => (
                  <SelectItem key={h} value={String(h)}>
                    Desde {hourLabel(h)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={hourTo === undefined || hourTo === 24 ? "all" : String(hourTo)}
              onValueChange={(v) => setHour("to", v)}
            >
              <SelectTrigger className={triggerClass}>
                <SelectValue placeholder="Hasta" />
              </SelectTrigger>
              <SelectContent className="max-h-64 border-border bg-popover">
                <SelectItem value="all">Hasta 24:00</SelectItem>
                {Array.from({ length: 23 }, (_, i) => i + 1).map((h) => (
                  <SelectItem key={h} value={String(h)}>
                    Hasta {hourLabel(h)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  )
}
