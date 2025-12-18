import { Lightbulb, AlertTriangle, Clock, TrendingUp, Package } from "lucide-react"

const insights = [
  {
    icon: <Package className="w-4 h-4" />,
    title: "Productos clave del día",
    value: "8 productos",
    color: "cyan",
  },
  {
    icon: <AlertTriangle className="w-4 h-4" />,
    title: "Anomalías detectadas",
    value: "Ventas inusuales",
    color: "yellow",
  },
  {
    icon: <Clock className="w-4 h-4" />,
    title: "Horarios fuertes",
    value: "12:00 - 19:00",
    color: "cyan",
  },
  {
    icon: <TrendingUp className="w-4 h-4" />,
    title: "Tendencia semanal",
    value: "+6.2% vs anterior",
    color: "green",
  },
]

export function SmartInsights() {
  return (
    <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-5 h-full">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
          <Lightbulb className="w-4 h-4 text-cyan-400" />
        </div>
        <h3 className="text-lg font-semibold text-white">Smart Insights</h3>
      </div>

      <div className="space-y-4">
        {insights.map((insight, i) => (
          <div
            key={i}
            className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-cyan-500/10 hover:border-cyan-500/20 transition-colors"
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                insight.color === "cyan"
                  ? "bg-cyan-500/20 text-cyan-400"
                  : insight.color === "yellow"
                    ? "bg-yellow-500/20 text-yellow-400"
                    : "bg-green-500/20 text-green-400"
              }`}
            >
              {insight.icon}
            </div>
            <div>
              <p className="text-sm text-gray-400">{insight.title}</p>
              <p
                className={`text-sm font-medium ${
                  insight.color === "cyan"
                    ? "text-cyan-400"
                    : insight.color === "yellow"
                      ? "text-yellow-400"
                      : "text-green-400"
                }`}
              >
                {insight.value}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
