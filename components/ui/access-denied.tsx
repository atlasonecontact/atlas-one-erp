"use client"

import { ShieldAlert } from "lucide-react"

export function AccessDenied({
  title = "No tenés permiso para ver esto",
  message = "Pedile a tu dueño de kiosco que te habilite este permiso desde Empleados.",
}: {
  title?: string
  message?: string
}) {
  return (
    <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-8 text-center">
      <div className="w-16 h-16 rounded-xl flex items-center justify-center bg-red-500/20 text-red-400 mx-auto mb-4">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-400">{message}</p>
    </div>
  )
}
