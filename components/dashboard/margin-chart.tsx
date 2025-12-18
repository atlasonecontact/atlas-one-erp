"use client"

interface MarginChartProps {
  value: number
}

export function MarginChart({ value }: MarginChartProps) {
  const circumference = 2 * Math.PI * 70
  const strokeDashoffset = circumference - (value / 100) * circumference

  return (
    <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-5">
      <h3 className="text-sm font-medium text-white mb-4">Margen bruto del mes</h3>

      <div className="flex items-center justify-center">
        <div className="relative w-40 h-40">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
            {/* Background circle */}
            <circle cx="80" cy="80" r="70" fill="none" stroke="rgba(34, 211, 238, 0.1)" strokeWidth="12" />
            {/* Progress circle */}
            <circle
              cx="80"
              cy="80"
              r="70"
              fill="none"
              stroke="url(#marginGradient)"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-out"
            />
            <defs>
              <linearGradient id="marginGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#22d3ee" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-cyan-400">{value}%</span>
            <span className="text-xs text-gray-500">del objetivo</span>
          </div>
        </div>
      </div>
    </div>
  )
}
