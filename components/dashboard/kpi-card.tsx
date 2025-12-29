"use client"

import type React from "react"
import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown } from "lucide-react"
import { LineChart, Line, ResponsiveContainer } from "recharts"

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

  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-xl border p-5 transition-all duration-300 hover:border-cyan-500/30 hover:shadow-2xl hover:shadow-cyan-500/10",
        isHighlight ? "border-cyan-500/30 bg-cyan-500/5" : "border-cyan-500/10 bg-[#0a0f1a]",
        onClick && "cursor-pointer hover:scale-[1.02] active:scale-[0.98]",
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-sm text-gray-400 font-medium">{title}</span>
        {Icon && (
          <div
            className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center transition-transform duration-300",
              isHighlight ? "bg-cyan-500/20 text-cyan-400" : "bg-white/5 text-gray-400",
              onClick && "group-hover:scale-110",
            )}
          >
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <p className={cn("text-3xl font-bold tracking-tight", isHighlight ? "text-cyan-400" : "text-white")}>{value}</p>

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
            {changeLabel && <span className="text-xs text-gray-500">{changeLabel}</span>}
          </div>
        )}

        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}

        {sparklineData && sparklineData.length > 0 && (
          <div className="mt-3 h-12 -mx-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparklineData}>
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={isPositive ? "#10b981" : "#ef4444"}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}
