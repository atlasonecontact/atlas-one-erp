"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ShieldAlert, Ban, RotateCcw, CircleDollarSign } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/toast-provider"
import { cn } from "@/lib/utils"

// Panel fijo para una sola cuenta admin (la misma que ya se usa como bypass en
// dashboard/layout.tsx y lib/supabase/middleware.ts) — no es un rol nuevo.
// No toca el registro público: acá sólo se ve la lista de cuentas existentes
// y se puede suspender/reactivar una puntual si deja de pagar.
const ADMIN_EMAIL = "atlasonecontact@gmail.com"

interface Account {
  kiosko_id: string
  kiosko_name: string
  owner_id: string | null
  owner_email: string | null
  owner_name: string | null
  business_name: string | null
  access_status: string
  next_payment_due_at: string | null
  last_payment_at: string | null
  created_at: string
}

function isOverdue(dueDate: string | null) {
  if (!dueDate) return false
  return new Date(dueDate + "T00:00:00") < new Date(new Date().toDateString())
}

function formatDate(d: string | null) {
  if (!d) return "Sin fecha"
  return new Date(d + "T00:00:00").toLocaleDateString("es-AR")
}

export default function AdminCuentasPage() {
  const router = useRouter()
  const toast = useToast()
  const supabase = createClient()
  const [checking, setChecking] = useState(true)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    const check = async () => {
      const { data } = await supabase.auth.getUser()
      if (data.user?.email !== ADMIN_EMAIL) {
        router.push("/dashboard")
        return
      }
      setChecking(false)
      loadAccounts()
    }
    check()
  }, [])

  const loadAccounts = async () => {
    setIsLoading(true)
    const { data, error } = await supabase.rpc("admin_list_accounts")
    if (error) {
      toast.error("No se pudo cargar la lista", error.message)
    } else {
      setAccounts((data as Account[]) || [])
    }
    setIsLoading(false)
  }

  const setStatus = async (account: Account, status: "approved" | "suspended") => {
    if (!account.owner_id) return
    setUpdatingId(account.owner_id)
    const { error } = await supabase.rpc("admin_set_access_status", {
      p_profile_id: account.owner_id,
      p_status: status,
    })
    if (error) {
      toast.error("No se pudo actualizar", error.message)
    } else {
      setAccounts((prev) =>
        prev.map((a) => (a.owner_id === account.owner_id ? { ...a, access_status: status } : a)),
      )
      toast.success(
        status === "suspended" ? "Cuenta suspendida" : "Cuenta reactivada",
        account.kiosko_name,
      )
    }
    setUpdatingId(null)
  }

  const markPaid = async (account: Account) => {
    if (!account.owner_id) return
    setUpdatingId(account.owner_id)
    const { data, error } = await supabase.rpc("admin_mark_payment_received", {
      p_profile_id: account.owner_id,
      p_months: 1,
    })
    if (error) {
      toast.error("No se pudo registrar el pago", error.message)
    } else {
      const nextDue = (data as { next_payment_due_at: string })?.next_payment_due_at
      setAccounts((prev) =>
        prev.map((a) =>
          a.owner_id === account.owner_id
            ? { ...a, next_payment_due_at: nextDue, last_payment_at: new Date().toISOString() }
            : a,
        ),
      )
      toast.success("Pago registrado", `${account.kiosko_name} — próximo vencimiento ${formatDate(nextDue)}`)
    }
    setUpdatingId(null)
  }

  if (checking) return null

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <ShieldAlert className="h-6 w-6 text-cyan-400" />
        <div>
          <h1 className="text-xl font-bold text-foreground">Cuentas</h1>
          <p className="text-sm text-muted-foreground">Quién usa Atlas One y si tiene el acceso activo.</p>
        </div>
      </div>

      {/* Mobile: cards */}
      <div className="space-y-3 md:hidden">
        {isLoading ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">Cargando...</p>
        ) : accounts.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">No hay cuentas todavía.</p>
        ) : (
          accounts.map((a) => {
            const suspended = a.access_status === "suspended"
            return (
              <div key={a.kiosko_id} className="rounded-xl border border-cyan-500/10 bg-card p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{a.kiosko_name}</p>
                    <p className="truncate text-xs text-muted-foreground">{a.business_name || "—"}</p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
                      suspended ? "bg-red-500/15 text-red-400" : "bg-green-500/15 text-green-400",
                    )}
                  >
                    {suspended ? "Suspendida" : "Activa"}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  <p className="truncate">{a.owner_name || "—"}</p>
                  <p className="truncate text-muted-foreground">{a.owner_email || "—"}</p>
                </div>
                <p className={cn("text-xs font-medium", isOverdue(a.next_payment_due_at) ? "text-red-400" : "text-muted-foreground")}>
                  Vence: {formatDate(a.next_payment_due_at)}
                  {isOverdue(a.next_payment_due_at) && " (vencida)"}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={updatingId === a.owner_id || !a.owner_id}
                    onClick={() => markPaid(a)}
                    className="touch-target inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-lg bg-cyan-500/15 px-3 text-sm font-semibold text-cyan-400 transition-colors hover:bg-cyan-500/25 disabled:opacity-50"
                  >
                    <CircleDollarSign className="h-4 w-4" />
                    Marcar pago
                  </button>
                  <button
                    type="button"
                    disabled={updatingId === a.owner_id || !a.owner_id}
                    onClick={() => setStatus(a, suspended ? "approved" : "suspended")}
                    className={cn(
                      "touch-target inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-semibold transition-colors disabled:opacity-50",
                      suspended
                        ? "bg-green-500/15 text-green-400 hover:bg-green-500/25"
                        : "bg-red-500/15 text-red-400 hover:bg-red-500/25",
                    )}
                  >
                    {suspended ? <RotateCcw className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                    {suspended ? "Reactivar" : "Suspender"}
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Desktop: tabla */}
      <div className="hidden overflow-hidden rounded-xl border border-cyan-500/10 bg-card md:block">
        <table className="w-full table-fixed">
          <thead>
            <tr className="border-b border-cyan-500/10 bg-white/[0.03] text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3">Kiosko / Negocio</th>
              <th className="hidden px-4 py-3 sm:table-cell">Dueño</th>
              <th className="w-[120px] px-4 py-3 text-center">Estado</th>
              <th className="w-[130px] px-4 py-3 text-center">Vence</th>
              <th className="w-[220px] px-4 py-3 text-right">Acción</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  Cargando...
                </td>
              </tr>
            ) : accounts.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No hay cuentas todavía.
                </td>
              </tr>
            ) : (
              accounts.map((a) => {
                const suspended = a.access_status === "suspended"
                return (
                  <tr key={a.kiosko_id} className="border-b border-cyan-500/5">
                    <td className="px-4 py-3">
                      <p className="truncate text-sm font-medium text-foreground">{a.kiosko_name}</p>
                      <p className="truncate text-xs text-muted-foreground">{a.business_name || "—"}</p>
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      <p className="truncate text-sm text-muted-foreground">{a.owner_name || "—"}</p>
                      <p className="truncate text-xs text-muted-foreground">{a.owner_email || "—"}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
                          suspended ? "bg-red-500/15 text-red-400" : "bg-green-500/15 text-green-400",
                        )}
                      >
                        {suspended ? "Suspendida" : "Activa"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn("text-xs font-medium", isOverdue(a.next_payment_due_at) ? "text-red-400" : "text-muted-foreground")}>
                        {formatDate(a.next_payment_due_at)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          disabled={updatingId === a.owner_id || !a.owner_id}
                          onClick={() => markPaid(a)}
                          className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-cyan-500/15 px-3 text-xs font-semibold text-cyan-400 transition-colors hover:bg-cyan-500/25 disabled:opacity-50"
                        >
                          <CircleDollarSign className="h-3.5 w-3.5" />
                          Marcar pago
                        </button>
                        <button
                          type="button"
                          disabled={updatingId === a.owner_id || !a.owner_id}
                          onClick={() => setStatus(a, suspended ? "approved" : "suspended")}
                          className={cn(
                            "inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-colors disabled:opacity-50",
                            suspended
                              ? "bg-green-500/15 text-green-400 hover:bg-green-500/25"
                              : "bg-red-500/15 text-red-400 hover:bg-red-500/25",
                          )}
                        >
                          {suspended ? <RotateCcw className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />}
                          {suspended ? "Reactivar" : "Suspender"}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
