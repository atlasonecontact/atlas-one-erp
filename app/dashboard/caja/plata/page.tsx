"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { PiggyBank, RefreshCw, TrendingUp } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useEmployeePermissions } from "@/lib/hooks/use-employee-permissions"
import { AccessDenied } from "@/components/ui/access-denied"
import { formatCurrency } from "@/lib/utils/currency"

interface MonthRow {
  month: string
  sales: number
  sales_count: number
  to_safe: number
  to_owner: number
}

const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]

function monthLabel(key: string) {
  const [year, month] = key.split("-")
  return `${MONTHS[Number(month) - 1] ?? key} ${year}`
}

function currentMonthKey() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Buenos_Aires", year: "numeric", month: "2-digit" }).format(new Date())
  return parts.slice(0, 7)
}

export default function PlataPage() {
  const { isOwner, loading: permsLoading } = useEmployeePermissions()
  const [safe, setSafe] = useState<number | null>(null)
  const [months, setMonths] = useState<MonthRow[]>([])
  const [needsSetup, setNeedsSetup] = useState(false)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    setLoading(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    const { data: kioscos } = await supabase.from("kioscos").select("id").eq("owner_id", user.id).limit(1)
    const kioskoId = kioscos?.[0]?.id
    if (!kioskoId) {
      setLoading(false)
      return
    }

    const [summary, monthly] = await Promise.all([
      supabase.rpc("treasury_summary", { p_kiosko: kioskoId }),
      supabase.rpc("monthly_summary", { p_kiosko: kioskoId, p_months: 12 }),
    ])

    if (summary.error || monthly.error) {
      // Falta correr scripts/212 o scripts/213 en Supabase.
      setNeedsSetup(true)
    }
    if (summary.data) setSafe(Number(summary.data.safe))
    if (Array.isArray(monthly.data)) {
      setMonths(
        monthly.data.map((m: any) => ({
          month: m.month,
          sales: Number(m.sales),
          sales_count: Number(m.sales_count),
          to_safe: Number(m.to_safe),
          to_owner: Number(m.to_owner),
        })),
      )
    }
    setLoading(false)
  }

  if (permsLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-cyan-500 animate-spin" />
      </div>
    )
  }

  if (!isOwner) {
    return (
      <div className="space-y-6">
        <AccessDenied
          title="Solo el dueño puede ver esta pantalla"
          message="Acá se muestra cuánta plata se acumuló y cuánto se ganó por mes. Pedile al dueño del kiosco que la consulte."
        />
      </div>
    )
  }

  const thisMonth = currentMonthKey()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Plata</h1>
        <Link href="/dashboard/caja" className="text-sm text-cyan-400 hover:text-cyan-300">
          ← Volver a Caja
        </Link>
      </div>

      <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-6 flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl bg-green-500/20 flex items-center justify-center">
          <PiggyBank className="w-7 h-7 text-green-400" />
        </div>
        <div>
          <p className="text-sm text-gray-300">Total acumulado en la caja fuerte</p>
          <p className="text-4xl font-bold text-green-400">{formatCurrency(safe ?? 0)}</p>
        </div>
      </div>

      {needsSetup && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
          Falta un paso en la base de datos para ver esta pantalla completa (scripts 212 y 213). Avisale a quien
          administra el sistema.
        </div>
      )}

      <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-5">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-cyan-400" />
          Lo que se ganó por mes
        </h3>

        {months.length === 0 ? (
          <p className="text-sm text-gray-500 py-8 text-center">Todavía no hay ventas registradas.</p>
        ) : (
          <div className="space-y-3">
            {months.map((m) => (
              <div
                key={m.month}
                className={`p-4 rounded-lg border ${
                  m.month === thisMonth ? "border-cyan-500/30 bg-cyan-500/5" : "border-white/5 bg-white/5"
                }`}
              >
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <p className="text-white font-semibold">
                      {monthLabel(m.month)}
                      {m.month === thisMonth && <span className="ml-2 text-xs text-cyan-400">(este mes)</span>}
                    </p>
                    <p className="text-xs text-gray-500">{m.sales_count} ventas</p>
                  </div>
                  <p className="text-2xl font-bold text-green-400">{formatCurrency(m.sales)}</p>
                </div>
                {(m.to_safe > 0 || m.to_owner > 0) && (
                  <div className="mt-2 flex gap-4 text-xs text-gray-400 flex-wrap">
                    {m.to_safe > 0 && <span>Guardado en la caja fuerte: {formatCurrency(m.to_safe)}</span>}
                    {m.to_owner > 0 && <span>Retirado por el dueño: {formatCurrency(m.to_owner)}</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
