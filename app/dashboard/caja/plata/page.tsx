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
  saved: number
}

const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]

function monthLabel(key: string) {
  const [year, month] = key.split("-")
  return `${MONTHS[Number(month) - 1] ?? key} ${year}`
}

function currentMonthKey() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
  })
    .format(new Date())
    .slice(0, 7)
}

export default function CajaFuertePage() {
  const { isOwner, loading: permsLoading } = useEmployeePermissions()
  const [today, setToday] = useState(0)
  const [month, setMonth] = useState(0)
  const [safe, setSafe] = useState(0)
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

    const { data, error } = await supabase.rpc("earnings_summary", { p_kiosko: kioskoId, p_months: 12 })
    if (error) {
      setNeedsSetup(true)
    } else if (data) {
      setToday(Number(data.today))
      setMonth(Number(data.month))
      setSafe(Number(data.safe ?? 0))
      setMonths(
        (data.months || []).map((m: any) => ({
          month: m.month,
          sales: Number(m.sales),
          sales_count: Number(m.sales_count),
          saved: Number(m.saved ?? 0),
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
          title="Solo el dueño puede ver la Caja fuerte"
          message="Acá se muestra lo que se ganó en el mes y mes por mes. Pedile al dueño del kiosco que la consulte."
        />
      </div>
    )
  }

  const thisMonth = currentMonthKey()
  const currentLabel = monthLabel(thisMonth)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Caja fuerte</h1>
        <Link href="/dashboard/caja" className="text-sm text-cyan-400 hover:text-cyan-300">
          ← Volver a Caja
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
            <PiggyBank className="w-7 h-7 text-amber-400" />
          </div>
          <div>
            <p className="text-sm text-gray-300">Total en la caja fuerte</p>
            <p className="text-4xl font-bold text-amber-400">{formatCurrency(safe)}</p>
            <p className="text-xs text-gray-400 mt-1">Lo que se guardó al cerrar cada caja</p>
          </div>
        </div>

        <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-green-500/20 flex items-center justify-center shrink-0">
            <TrendingUp className="w-7 h-7 text-green-400" />
          </div>
          <div>
            <p className="text-sm text-gray-300">Ganado en {currentLabel} (hasta hoy)</p>
            <p className="text-4xl font-bold text-green-400">{formatCurrency(month)}</p>
            <p className="text-sm text-gray-300 mt-1">
              Hoy: <span className="font-semibold text-white">{formatCurrency(today)}</span>
            </p>
          </div>
        </div>
      </div>

      {needsSetup && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
          Falta un paso en la base de datos para ver esta pantalla (script 214). Avisale a quien administra el sistema.
        </div>
      )}

      <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-5">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-cyan-400" />
          Mes por mes
        </h3>

        {months.length === 0 ? (
          <p className="text-sm text-gray-500 py-8 text-center">Todavía no hay ventas registradas.</p>
        ) : (
          <div className="space-y-3">
            {months.map((m) => (
              <div
                key={m.month}
                className={`p-4 rounded-lg border flex items-center justify-between gap-3 flex-wrap ${
                  m.month === thisMonth ? "border-cyan-500/30 bg-cyan-500/5" : "border-white/5 bg-white/5"
                }`}
              >
                <div>
                  <p className="text-white font-semibold">
                    {monthLabel(m.month)}
                    {m.month === thisMonth && <span className="ml-2 text-xs text-cyan-400">(en curso)</span>}
                  </p>
                  <p className="text-xs text-gray-500">{m.sales_count} ventas</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-400">{formatCurrency(m.sales)}</p>
                  {m.saved !== 0 && (
                    <p className="text-xs text-amber-400">Guardado en la caja fuerte: {formatCurrency(m.saved)}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
