"use client"

import { ChartCard, PALETTE } from "@/components/charts/chart-theme"

interface MarginChartProps {
  value: number
}

export function MarginChart({ value }: MarginChartProps) {
  const radius = 68
  const circumference = 2 * Math.PI * radius
  const clamped = Math.max(0, Math.min(100, value))
  const strokeDashoffset = circumference - (clamped / 100) * circumference

  return (
    <ChartCard title="Margen bruto del mes" subtitle="Avance sobre el objetivo">
      <div className="flex items-center justify-center">
        <div className="relative h-44 w-44">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 160 160">
            <defs>
              <linearGradient id="marginGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={PALETTE.indigo} />
                <stop offset="100%" stopColor={PALETTE.cyan} />
              </linearGradient>
              <filter id="marginGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <circle cx="80" cy="80" r={radius} fill="none" stroke="rgba(148,163,184,0.12)" strokeWidth="12" />
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke="url(#marginGradient)"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              filter="url(#marginGlow)"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="bg-gradient-to-r from-indigo-300 to-cyan-300 bg-clip-text text-4xl font-bold text-transparent">
              {value}%
            </span>
            <span className="text-xs text-slate-500">del objetivo</span>
          </div>
        </div>
      </div>
    </ChartCard>
  )
}
