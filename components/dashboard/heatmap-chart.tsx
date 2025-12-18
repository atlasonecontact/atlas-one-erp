const hours = ["13", "14", "15", "16", "17"]
const data = [
  [2, 3, 4, 5, 4],
  [3, 4, 5, 4, 3],
  [4, 5, 4, 3, 4],
  [3, 4, 3, 4, 5],
]

export function HeatmapChart() {
  const getColor = (value: number) => {
    const opacity = value / 5
    return `rgba(34, 211, 238, ${opacity})`
  }

  return (
    <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-5">
      <h3 className="text-sm font-medium text-white mb-4">Mapa de calor horario</h3>

      <div className="space-y-2">
        {data.map((row, rowIndex) => (
          <div key={rowIndex} className="flex gap-2">
            {row.map((value, colIndex) => (
              <div
                key={colIndex}
                className="flex-1 aspect-square rounded-md flex items-center justify-center text-xs font-medium transition-all hover:scale-105"
                style={{ backgroundColor: getColor(value) }}
              >
                <span className={value >= 4 ? "text-white" : "text-cyan-400"}>{value}</span>
              </div>
            ))}
          </div>
        ))}
        <div className="flex gap-2 mt-2">
          {hours.map((hour) => (
            <div key={hour} className="flex-1 text-center text-xs text-gray-500">
              {hour}h
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
