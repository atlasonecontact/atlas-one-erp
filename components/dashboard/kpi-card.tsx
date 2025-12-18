import type React from "react"
import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown } from "lucide-react"

interface KPICardProps {
  title: string
  value: string
  change?: number
  changeLabel?: string
  subtitle?: string
  icon: React.ReactNode
  isHighlight?: boolean
}

export function KPICard({ title, value, change, changeLabel, subtitle, icon, isHighlight }: KPICardProps) {
  const isPositive = change && change > 0

  return (
    <div
      className={cn(
        "rounded-xl border p-5 transition-all duration-300 hover:border-cyan-500/30",
        isHighlight ? "border-cyan-500/30 bg-cyan-500/5" : "border-cyan-500/10 bg-[#0a0f1a]",
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-sm text-gray-400">{title}</span>
        <div
          className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center",
            isHighlight ? "bg-cyan-500/20 text-cyan-400" : "bg-white/5 text-gray-400",
          )}
        >
          {icon}
        </div>
      </div>

      <div className="space-y-1">
        <p className={cn("text-2xl font-bold", isHighlight ? "text-cyan-400" : "text-white")}>{value}</p>

        {change !== undefined && (
          <div className="flex items-center gap-1.5">
            {isPositive ? (
              <TrendingUp className="w-4 h-4 text-green-400" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-400" />
            )}
            <span className={cn("text-sm font-medium", isPositive ? "text-green-400" : "text-red-400")}>
              {isPositive ? "+" : ""}
              {change}%
            </span>
            {changeLabel && <span className="text-xs text-gray-500">{changeLabel}</span>}
          </div>
        )}

        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      </div>
    </div>
  )
}
