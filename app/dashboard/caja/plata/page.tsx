"use client"

import type React from "react"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Landmark, PiggyBank, RefreshCw, Wallet } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useEmployeePermissions } from "@/lib/hooks/use-employee-permissions"
import { useToast } from "@/components/ui/toast-provider"
import { AccessDenied } from "@/components/ui/access-denied"
import { formatCurrency } from "@/lib/utils/currency"

type Account = "safe" | "bank"
type Mode = "in" | "out" | "transfer"

interface TreasuryMovement {
  id: string
  account: Account
  direction: "in" | "out"
  amount: number
  concept: string
  note: string | null
  created_at: string
}

const ACCOUNT_LABEL: Record<Account, string> = { safe: "Caja fuerte", bank: "Banco" }

const CONCEPT_LABEL: Record<string, string> = {
  cash_close: "Cierre de caja",
  manual: "Movimiento manual",
  transfer: "Transferencia entre cuentas",
}

export default function PlataPage() {
  const { isOwner, loading: permsLoading } = useEmployeePermissions()
  const [kioskoId, setKioskoId] = useState<string | null>(null)
  const [movements, setMovements] = useState<TreasuryMovement[]>([])
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<Mode | null>(null)
  const [openRegisterCash, setOpenRegisterCash] = useState<number | null>(null)

  const supabase = createClient()
  const toast = useToast()

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
    const kid = kioscos?.[0]?.id ?? null
    setKioskoId(kid)

    if (kid) {
      const { data } = await supabase
        .from("treasury_movements")
        .select("id, account, direction, amount, concept, note, created_at")
        .eq("kiosko_id", kid)
        .order("created_at", { ascending: false })
        .limit(200)
      if (data) setMovements(data as TreasuryMovement[])

      // Efectivo esperado hoy en la caja abierta (para el total): apertura + ventas en efectivo + ingresos - egresos.
      const { data: reg } = await supabase
        .from("cash_registers")
        .select("id, opening_balance, opened_at")
        .eq("kiosko_id", kid)
        .eq("status", "open")
        .order("opened_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (reg) {
        const [{ data: sales }, { data: tx }] = await Promise.all([
          supabase
            .from("sales")
            .select("total_amount, payment_method")
            .eq("kiosko_id", kid)
            .gte("created_at", reg.opened_at)
            .or("status.is.null,status.eq.completed"),
          supabase.from("cash_register_transactions").select("amount, direction").eq("cash_register_id", reg.id),
        ])
        const cashSales = (sales || [])
          .filter((s: any) => ["cash", "efectivo"].includes(String(s.payment_method || "").toLowerCase()))
          .reduce((acc: number, s: any) => acc + Number(s.total_amount), 0)
        const inTx = (tx || []).filter((t: any) => t.direction === "in").reduce((a: number, t: any) => a + Number(t.amount), 0)
        const outTx = (tx || []).filter((t: any) => t.direction !== "in").reduce((a: number, t: any) => a + Number(t.amount), 0)
        setOpenRegisterCash(Number(reg.opening_balance) + cashSales + inTx - outTx)
      } else {
        setOpenRegisterCash(null)
      }
    }
    setLoading(false)
  }

  const balance = (account: Account) =>
    movements.filter((m) => m.account === account).reduce((acc, m) => acc + (m.direction === "in" ? 1 : -1) * Number(m.amount), 0)

  const safe = balance("safe")
  const bank = balance("bank")
  const total = safe + bank + (openRegisterCash ?? 0)

  const handleSave = async (params: { mode: Mode; account: Account; to: Account; amount: number; note: string }) => {
    if (!kioskoId) return false
    const { mode: m, account, to, amount, note } = params

    if ((m === "out" || m === "transfer") && amount > balance(account)) {
      toast.error("No alcanza la plata", `En ${ACCOUNT_LABEL[account]} hay ${formatCurrency(balance(account))}`)
      return false
    }

    const rows: Record<string, unknown>[] =
      m === "transfer"
        ? [
            { kiosko_id: kioskoId, account, direction: "out", amount, concept: "transfer", note: note || `Pasa a ${ACCOUNT_LABEL[to]}` },
            { kiosko_id: kioskoId, account: to, direction: "in", amount, concept: "transfer", note: note || `Viene de ${ACCOUNT_LABEL[account]}` },
          ]
        : [{ kiosko_id: kioskoId, account, direction: m, amount, concept: "manual", note: note || null }]

    const { error } = await supabase.from("treasury_movements").insert(rows)
    if (error) {
      console.error("[Plata] Error al registrar el movimiento:", error)
      toast.error("No se pudo registrar el movimiento", error.message)
      return false
    }

    toast.success("Movimiento registrado", formatCurrency(amount))
    setMode(null)
    await load()
    return true
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
          title="Solo el dueño puede ver la plata guardada"
          message="Esta pantalla muestra los saldos de la caja fuerte y del banco. Pedile al dueño del kiosco que la consulte."
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Plata</h1>
          <p className="text-gray-400 text-sm">
            Cuánta plata hay y dónde está. Los cierres de caja que depositan en la caja fuerte o el banco suman solos.{" "}
            <Link href="/dashboard/caja" className="text-cyan-400 hover:text-cyan-300">
              Volver a Caja
            </Link>
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button onClick={() => setMode("in")} className="bg-cyan-500 hover:bg-cyan-400 text-black gap-2">
            <ArrowDownLeft className="w-4 h-4" />
            Ingresar plata
          </Button>
          <Button
            onClick={() => setMode("out")}
            variant="outline"
            className="border-cyan-500/20 text-gray-300 bg-transparent gap-2"
          >
            <ArrowUpRight className="w-4 h-4" />
            Sacar plata
          </Button>
          <Button
            onClick={() => setMode("transfer")}
            variant="outline"
            className="border-cyan-500/20 text-gray-300 bg-transparent gap-2"
          >
            <ArrowLeftRight className="w-4 h-4" />
            Pasar entre cuentas
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-400">Caja fuerte</span>
            <PiggyBank className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(safe)}</p>
        </div>
        <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-400">Banco</span>
            <Landmark className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(bank)}</p>
        </div>
        <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-400">Efectivo en la caja abierta</span>
            <Wallet className="w-5 h-5 text-cyan-400" />
          </div>
          <p className="text-2xl font-bold text-white">{openRegisterCash == null ? "Caja cerrada" : formatCurrency(openRegisterCash)}</p>
        </div>
        <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-300">Total</span>
            <Wallet className="w-5 h-5 text-green-400" />
          </div>
          <p className="text-2xl font-bold text-green-400">{formatCurrency(total)}</p>
        </div>
      </div>

      <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-5">
        <h3 className="text-lg font-semibold text-white mb-4">Movimientos</h3>
        {movements.length === 0 ? (
          <p className="text-sm text-gray-500 py-8 text-center">
            Todavía no hay movimientos. Cuando cierres una caja y retires efectivo a la caja fuerte o al banco, van a
            aparecer acá.
          </p>
        ) : (
          <div className="space-y-2 max-h-[32rem] overflow-y-auto">
            {movements.map((m) => (
              <div key={m.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 gap-3">
                <div className="min-w-0">
                  <p className="text-white font-medium truncate">{m.note || CONCEPT_LABEL[m.concept] || "Movimiento"}</p>
                  <p className="text-xs text-gray-500">
                    {ACCOUNT_LABEL[m.account]} · {CONCEPT_LABEL[m.concept] || m.concept} ·{" "}
                    {new Date(m.created_at).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" })}
                  </p>
                </div>
                <p className={`font-bold shrink-0 ${m.direction === "in" ? "text-green-400" : "text-red-400"}`}>
                  {m.direction === "in" ? "+" : "-"}
                  {formatCurrency(m.amount)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <MovementDialog mode={mode} onClose={() => setMode(null)} onSave={handleSave} />
    </div>
  )
}

function MovementDialog({
  mode,
  onClose,
  onSave,
}: {
  mode: Mode | null
  onClose: () => void
  onSave: (p: { mode: Mode; account: Account; to: Account; amount: number; note: string }) => Promise<boolean>
}) {
  const [account, setAccount] = useState<Account>("safe")
  const [amount, setAmount] = useState("")
  const [note, setNote] = useState("")
  const [saving, setSaving] = useState(false)

  const to: Account = account === "safe" ? "bank" : "safe"
  const title = mode === "in" ? "Ingresar plata" : mode === "out" ? "Sacar plata" : "Pasar plata entre cuentas"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!mode || saving) return
    setSaving(true)
    const ok = await onSave({ mode, account, to, amount: Number(amount), note: note.trim() })
    setSaving(false)
    if (ok) {
      setAmount("")
      setNote("")
    }
  }

  return (
    <Dialog open={mode !== null} onOpenChange={onClose}>
      <DialogContent className="bg-[#0a0f1a] border-cyan-500/20 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-gray-300">{mode === "transfer" ? "Desde" : "Cuenta"}</Label>
            <div className="grid grid-cols-2 gap-2">
              {(["safe", "bank"] as const).map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAccount(a)}
                  className={`py-2 rounded-lg border text-sm transition-colors ${
                    account === a
                      ? "border-cyan-500 bg-cyan-500/10 text-cyan-400"
                      : "border-cyan-500/10 text-gray-400 hover:border-cyan-500/30"
                  }`}
                >
                  {ACCOUNT_LABEL[a]}
                </button>
              ))}
            </div>
            {mode === "transfer" && <p className="text-xs text-gray-500">Pasa a: {ACCOUNT_LABEL[to]}</p>}
          </div>
          <div className="space-y-2">
            <Label className="text-gray-300">Monto</Label>
            <Input
              type="number"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="$0"
              autoFocus
              className="bg-[#0d1424] border-cyan-500/20 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-gray-300">Nota (opcional)</Label>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ej: depósito de la semana"
              className="bg-[#0d1424] border-cyan-500/20 text-white"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-cyan-500/20 text-gray-400 hover:text-white bg-transparent"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saving || !(Number(amount) > 0)}
              className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold"
            >
              {saving ? "Guardando..." : "Registrar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
