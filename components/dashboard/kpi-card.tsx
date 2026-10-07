"use client"

import type React from "react"
import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown } from "lucide-react"
import { AreaChart, Area, ResponsiveContainer } from "recharts"
import { PALETTE } from "@/components/charts/chart-theme"

interface KPICardProps {
  title: string
  value: string
  change?: number
  changeLabel?: string
  subtitle?: string
  icon?: React.ComponentType<{ className?: string }>
  isHighlight?: boolean
  sparklineData?: Array<{ value: number }>
  onClick?: () => void
}

export function KPICard({
  title,
  value,
  change,
  changeLabel,
  subtitle,
  icon: Icon,
  isHighlight,
  sparklineData,
  onClick,
}: KPICardProps) {
  const isPositive = change && change > 0
  const sparkColor = change !== undefined && change < 0 ? PALETTE.rose : PALETTE.emerald
  const sparkId = `spark-${title.replace(/[^a-z0-9]/gi, "")}`

  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-xl border p-5 transition-all duration-300 hover:border-cyan-500/30 hover:shadow-2xl hover:shadow-cyan-500/10",
        isHighlight ? "border-cyan-500/30 bg-cyan-500/5" : "border-cyan-500/10 bg-card",
        onClick && "cursor-pointer hover:scale-[1.02] active:scale-[0.98]",
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-sm text-muted-foreground font-medium">{title}</span>
        {Icon && (
          <div
            className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center transition-transform duration-300",
              isHighlight ? "bg-cyan-500/20 text-cyan-400" : "bg-muted text-muted-foreground",
              onClick && "group-hover:scale-110",
            )}
          >
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <p className={cn("text-3xl font-bold tracking-tight", isHighlight ? "text-cyan-400" : "text-foreground")}>{value}</p>

        {change !== undefined && (
          <div className="flex items-center gap-1.5">
            {isPositive ? (
              <TrendingUp className="w-4 h-4 text-green-400" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-400" />
            )}
            <span className={cn("text-sm font-semibold", isPositive ? "text-green-400" : "text-red-400")}>
              {isPositive ? "+" : ""}
              {change}%
            </span>
            {changeLabel && <span className="text-xs text-muted-foreground">{changeLabel}</span>}
          </div>
        )}

        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}

        {sparklineData && sparklineData.length > 0 && (
          <div className="mt-3 h-12 -mx-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={sparkId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={sparkColor} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={sparkColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={sparkColor}
                  strokeWidth={2}
                  fill={`url(#${sparkId})`}
                  dot={false}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}
