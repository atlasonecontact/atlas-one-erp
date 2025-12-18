"use client"

const categories = ["Bebidas frías", "Bebidas alcoh.", "Golosinas", "Snacks", "Cigarrillos", "Lácteos"]
const days = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

// Simulated heatmap data (7 days x 6 categories)
const heatmapData = [
  [3, 4, 2, 5, 4, 3, 2], // Bebidas frías
  [2, 3, 3, 4, 5, 4, 3], // Bebidas alcoh.
  [4, 3, 2, 2, 3, 4, 5], // Golosinas
  [5, 4, 3, 4, 5, 5, 4], // Snacks
  [2, 2, 3, 3, 4, 3, 2], // Cigarrillos
  [4, 5, 4, 3, 2, 3, 4], // Lácteos
]

export function StockHeatmap() {
  const getColor = (value: number) => {
    const colors = ["bg-cyan-900/50", "bg-cyan-700/50", "bg-cyan-500/50", "bg-cyan-400/60", "bg-cyan-300/70"]
    return colors[value - 1] || colors[0]
  }

  return (
    <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-5">
      <h3 className="text-lg font-semibold text-white mb-4">Stock Crítico (7 días)</h3>

      <div className="space-y-2">
        {/* Header */}
        <div className="flex">
          <div className="w-24" />
          {days.map((day) => (
            <div key={day} className="flex-1 text-center text-xs text-gray-500">
              {day}
            </div>
          ))}
        </div>

        {/* Rows */}
        {heatmapData.map((row, rowIndex) => (
          <div key={rowIndex} className="flex items-center">
            <div className="w-24 text-xs text-gray-400 truncate pr-2">{categories[rowIndex]}</div>
            {row.map((value, colIndex) => (
              <div key={colIndex} className="flex-1 p-0.5">
                <div className={`aspect-square rounded ${getColor(value)}`} title={`Nivel: ${value}`} />
              </div>
            ))}
          </div>
        ))}

        {/* Legend */}
        <div className="flex items-center justify-end gap-2 mt-4">
          <span className="text-xs text-gray-500">Bajo</span>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((v) => (
              <div key={v} className={`w-4 h-4 rounded ${getColor(v)}`} />
            ))}
          </div>
          <span className="text-xs text-gray-500">Alto</span>
        </div>
      </div>
    </div>
  )
}
