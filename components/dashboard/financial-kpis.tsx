"use client"

import { TrendingUp, Target, Clock, DollarSign, Users, Package, AlertTriangle, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"

interface FinancialKPIsProps {
  data?: {
    grossMargin: number
    breakEvenPoint: number
    cashConversionCycle: number
  }
  isLoading?: boolean
}

interface InventoryKPIsProps {
  data?: {
    inventoryTurnover: number
    daysOfInventory: number
    shrinkageRate: number
  }
  isLoading?: boolean
}

interface PerformanceKPIsProps {
  data?: {
    salesPerEmployee: number
    laborCost: number
    itemsPerTicket: number
  }
  isLoading?: boolean
}

interface ControlKPIsProps {
  data?: {
    cashDifference: number
    returnRate: number
    chargebackRate: number
  }
  isLoading?: boolean
}

function KPIRow({ icon, label, value, suffix = "", trend, variant = "default" }: {
  icon: React.ReactNode
  label: string
  value: string | number
  suffix?: string
  trend?: "up" | "down" | "neutral"
  variant?: "default" | "success" | "warning" | "danger"
}) {
  const variantColors = {
    default: "text-white",
    success: "text-green-400",
    warning: "text-yellow-400",
    danger: "text-red-400",
  }

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
          {icon}
        </div>
        <span className="text-sm text-gray-400">{label}</span>
      </div>
      <span className={cn("text-lg font-bold", variantColors[variant])}>
        {typeof value === 'number' ? value.toLocaleString('es-AR') : value}{suffix}
      </span>
    </div>
  )
}

export function FinancialKPIs({ data, isLoading = false }: FinancialKPIsProps) {
  const defaultData = {
    grossMargin: 58.2,
    breakEvenPoint: 120000,
    cashConversionCycle: 45,
  }
  const d = data || defaultData

  if (isLoading) {
    return (
      <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-5">
        <div className="h-4 bg-white/10 rounded w-32 mb-4 animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-10 bg-white/5 rounded animate-pulse" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-5">
      <h3 className="text-sm font-medium text-white mb-4">KPIs Financieros</h3>
      <div className="space-y-1 divide-y divide-cyan-500/10">
        <KPIRow 
          icon={<TrendingUp className="w-4 h-4" />} 
          label="Margen Bruto" 
          value={d.grossMargin} 
          suffix="%" 
          variant="success"
        />
        <KPIRow 
          icon={<Target className="w-4 h-4" />} 
          label="Punto de Equilibrio" 
          value={`$${(d.breakEvenPoint / 1000).toFixed(0)}k`}
        />
        <KPIRow 
          icon={<Clock className="w-4 h-4" />} 
          label="Ciclo de Conversión" 
          value={d.cashConversionCycle} 
          suffix=" días"
        />
      </div>
    </div>
  )
}

export function InventoryKPIs({ data, isLoading = false }: InventoryKPIsProps) {
  const defaultData = {
    inventoryTurnover: 6.2,
    daysOfInventory: 24,
    shrinkageRate: 3.1,
  }
  const d = data || defaultData

  if (isLoading) {
    return (
      <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-5">
        <div className="h-4 bg-white/10 rounded w-32 mb-4 animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-10 bg-white/5 rounded animate-pulse" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-5">
      <h3 className="text-sm font-medium text-white mb-4">Inventario y Stock</h3>
      <div className="space-y-1 divide-y divide-cyan-500/10">
        <KPIRow 
          icon={<Package className="w-4 h-4" />} 
          label="Rotación de Inventario" 
          value={d.inventoryTurnover} 
          suffix="x"
          variant="success"
        />
        <KPIRow 
          icon={<Clock className="w-4 h-4" />} 
          label="Días de Inventario" 
          value={d.daysOfInventory} 
          suffix=" días"
        />
        <KPIRow 
          icon={<AlertTriangle className="w-4 h-4" />} 
          label="Tasa de Merma" 
          value={d.shrinkageRate} 
          suffix="%"
          variant={d.shrinkageRate > 5 ? "danger" : d.shrinkageRate > 3 ? "warning" : "success"}
        />
      </div>
    </div>
  )
}

export function PerformanceKPIs({ data, isLoading = false }: PerformanceKPIsProps) {
  const defaultData = {
    salesPerEmployee: 8520,
    laborCost: 12.8,
    itemsPerTicket: 3.5,
  }
  const d = data || defaultData

  if (isLoading) {
    return (
      <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-5">
        <div className="h-4 bg-white/10 rounded w-40 mb-4 animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-10 bg-white/5 rounded animate-pulse" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-5">
      <h3 className="text-sm font-medium text-white mb-4">Desempeño del Personal</h3>
      <div className="space-y-1 divide-y divide-cyan-500/10">
        <KPIRow 
          icon={<Users className="w-4 h-4" />} 
          label="Ventas por Empleado" 
          value={`$${d.salesPerEmployee.toLocaleString()}`}
        />
        <KPIRow 
          icon={<DollarSign className="w-4 h-4" />} 
          label="Costo Laboral" 
          value={d.laborCost} 
          suffix="%"
        />
        <KPIRow 
          icon={<Package className="w-4 h-4" />} 
          label="Artículos por Ticket" 
          value={d.itemsPerTicket} 
          suffix=" prod."
        />
      </div>
    </div>
  )
}

export function ControlKPIs({ data, isLoading = false }: ControlKPIsProps) {
  const defaultData = {
    cashDifference: -55,
    returnRate: 4.6,
    chargebackRate: 4.6,
  }
  const d = data || defaultData

  if (isLoading) {
    return (
      <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-5">
        <div className="h-4 bg-white/10 rounded w-36 mb-4 animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-10 bg-white/5 rounded animate-pulse" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-5">
      <h3 className="text-sm font-medium text-white mb-4">Control y Seguridad</h3>
      <div className="space-y-1 divide-y divide-cyan-500/10">
        <KPIRow 
          icon={<DollarSign className="w-4 h-4" />} 
          label="Diferencia de Caja" 
          value={`$${d.cashDifference}`}
          variant={d.cashDifference < 0 ? "danger" : "success"}
        />
        <KPIRow 
          icon={<Package className="w-4 h-4" />} 
          label="Tasa de Devoluciones" 
          value={d.returnRate} 
          suffix="%"
          variant={d.returnRate > 5 ? "warning" : "default"}
        />
        <KPIRow 
          icon={<ShieldCheck className="w-4 h-4" />} 
          label="Tasa de Contracargos" 
          value={d.chargebackRate} 
          suffix="%"
          variant={d.chargebackRate > 3 ? "danger" : "default"}
        />
      </div>
    </div>
  )
}
