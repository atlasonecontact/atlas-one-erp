"use client"

import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface KPICardV2Props {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  subtitle?: string
  icon?: React.ReactNode
  variant?: "default" | "primary" | "success" | "warning" | "danger"
  size?: "sm" | "md" | "lg"
  isLoading?: boolean
  prefix?: string
  suffix?: string
}

export function KPICardV2({
  title,
  value,
  change,
  changeLabel = "vs mes anterior",
  subtitle,
  icon,
  variant = "default",
  size = "md",
  isLoading = false,
  prefix = "",
  suffix = "",
}: KPICardV2Props) {
  const isPositive = change !== undefined && change > 0
  const isNegative = change !== undefined && change < 0
  const isNeutral = change === 0

  const variantStyles = {
    default: {
      border: "border-cyan-500/10",
      bg: "bg-[#0a0f1a]",
      iconBg: "bg-white/5",
      iconColor: "text-gray-400",
      valueColor: "text-white",
    },
    primary: {
      border: "border-cyan-500/30",
      bg: "bg-gradient-to-br from-cyan-500/10 to-cyan-500/5",
      iconBg: "bg-cyan-500/20",
      iconColor: "text-cyan-400",
      valueColor: "text-cyan-400",
    },
    success: {
      border: "border-green-500/30",
      bg: "bg-gradient-to-br from-green-500/10 to-green-500/5",
      iconBg: "bg-green-500/20",
      iconColor: "text-green-400",
      valueColor: "text-green-400",
    },
    warning: {
      border: "border-yellow-500/30",
      bg: "bg-gradient-to-br from-yellow-500/10 to-yellow-500/5",
      iconBg: "bg-yellow-500/20",
      iconColor: "text-yellow-400",
      valueColor: "text-yellow-400",
    },
    danger: {
      border: "border-red-500/30",
      bg: "bg-gradient-to-br from-red-500/10 to-red-500/5",
      iconBg: "bg-red-500/20",
      iconColor: "text-red-400",
      valueColor: "text-red-400",
    },
  }

  const sizeStyles = {
    sm: { padding: "p-4", valueSize: "text-xl", titleSize: "text-xs" },
    md: { padding: "p-5", valueSize: "text-2xl", titleSize: "text-sm" },
    lg: { padding: "p-6", valueSize: "text-3xl", titleSize: "text-sm" },
  }

  const styles = variantStyles[variant]
  const sizes = sizeStyles[size]

  if (isLoading) {
    return (
      <div className={cn("rounded-xl border", styles.border, styles.bg, sizes.padding)}>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-white/10 rounded w-24" />
          <div className="h-8 bg-white/10 rounded w-32" />
          <div className="h-3 bg-white/10 rounded w-20" />
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "rounded-xl border transition-all duration-300 hover:border-opacity-50 group",
        styles.border,
        styles.bg,
        sizes.padding
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <span className={cn("text-gray-400 font-medium", sizes.titleSize)}>{title}</span>
        {icon && (
          <div
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
              styles.iconBg,
              styles.iconColor
            )}
          >
            {icon}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <p className={cn("font-bold tracking-tight", sizes.valueSize, styles.valueColor)}>
          {prefix}{typeof value === 'number' ? value.toLocaleString('es-AR') : value}{suffix}
        </p>

        {change !== undefined && (
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                isPositive && "bg-green-500/20 text-green-400",
                isNegative && "bg-red-500/20 text-red-400",
                isNeutral && "bg-gray-500/20 text-gray-400"
              )}
            >
              {isPositive ? (
                <TrendingUp className="w-3 h-3" />
              ) : isNegative ? (
                <TrendingDown className="w-3 h-3" />
              ) : (
                <Minus className="w-3 h-3" />
              )}
              <span>{isPositive ? "+" : ""}{change.toFixed(1)}%</span>
            </div>
            <span className="text-xs text-gray-500">{changeLabel}</span>
          </div>
        )}

        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      </div>
    </div>
  )
}
