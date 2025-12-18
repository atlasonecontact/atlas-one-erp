import { ShoppingCart, Package, AlertTriangle, UserPlus } from "lucide-react"

const activities = [
  {
    icon: <ShoppingCart className="w-4 h-4" />,
    title: "Nueva venta registrada",
    description: "Venta #1234 - $2,500",
    time: "Hace 5 min",
    color: "cyan",
  },
  {
    icon: <Package className="w-4 h-4" />,
    title: "Stock actualizado",
    description: "Gaseosa Cola 500ml (+50 unidades)",
    time: "Hace 15 min",
    color: "green",
  },
  {
    icon: <AlertTriangle className="w-4 h-4" />,
    title: "Alerta de stock bajo",
    description: "Cigarrillos Marlboro (8 unidades)",
    time: "Hace 1 hora",
    color: "yellow",
  },
  {
    icon: <UserPlus className="w-4 h-4" />,
    title: "Empleado conectado",
    description: "María García inició sesión",
    time: "Hace 2 horas",
    color: "cyan",
  },
]

export function RecentActivity() {
  return (
    <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-5">
      <h3 className="text-lg font-semibold text-white mb-4">Actividad reciente</h3>

      <div className="space-y-4">
        {activities.map((activity, i) => (
          <div key={i} className="flex items-start gap-4 p-3 rounded-lg hover:bg-white/5 transition-colors">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                activity.color === "cyan"
                  ? "bg-cyan-500/20 text-cyan-400"
                  : activity.color === "green"
                    ? "bg-green-500/20 text-green-400"
                    : "bg-yellow-500/20 text-yellow-400"
              }`}
            >
              {activity.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white">{activity.title}</p>
              <p className="text-sm text-gray-500 truncate">{activity.description}</p>
            </div>
            <span className="text-xs text-gray-600 whitespace-nowrap">{activity.time}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
