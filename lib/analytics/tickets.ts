"use client"

import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { GlobalFilters } from "@/components/dashboard/global-filters"

// Capa de datos reales para los paneles de Dashboard > Ventas. Cada "ticket" es una venta
// (sales) con sus productos (sale_items); las ventas anuladas no se incluyen.

export const TZ = "America/Argentina/Buenos_Aires"
const PAGE = 1000
const MAX_PAGES = 30

const dayFmt = new Intl.DateTimeFormat("en-CA", { timeZone: TZ })
const hourFmt = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", hour12: false })

export const WEEKDAYS_SHORT = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
export const WEEKDAYS_LONG = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]
// Orden de la semana para los gráficos (lunes primero).
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0]

export type ShiftKey = "morning" | "afternoon" | "night"
export const SHIFT_LABEL: Record<ShiftKey, string> = { morning: "Mañana", afternoon: "Tarde", night: "Noche" }
export const SHIFT_HOURS: Record<ShiftKey, { from: number; to: number }> = {
  morning: { from: 6, to: 14 },
  afternoon: { from: 14, to: 22 },
  night: { from: 22, to: 6 },
}

export const shiftOf = (hour: number): ShiftKey =>
  hour >= 6 && hour < 14 ? "morning" : hour >= 14 && hour < 22 ? "afternoon" : "night"

export const PAYMENT_LABEL: Record<string, string> = {
  cash: "Efectivo",
  card: "Tarjeta",
  qr: "QR",
  transfer: "Transferencia",
}
export const paymentLabel = (m: string | null) => (m ? PAYMENT_LABEL[m.toLowerCase()] || m : "-")

export interface TicketItem {
  productId: string | null
  name: string
  category: string
  quantity: number
  unitPrice: number
  subtotal: number
  cost: number
}

export interface Ticket {
  id: string
  number: string
  branchId: string
  branch: string
  sellerId: string | null
  seller: string
  payment: string | null
  createdAt: string
  day: string
  hour: number
  weekday: number
  shift: ShiftKey
  total: number
  units: number
  cost: number
  items: TicketItem[]
}

export interface Option {
  id: string
  name: string
}

export const ymdToday = () => dayFmt.format(new Date())
export const shiftYmd = (ymd: string, days: number) => {
  const d = new Date(`${ymd}T12:00:00-03:00`)
  d.setDate(d.getDate() + days)
  return dayFmt.format(d)
}
export const ymdOf = (d: Date) => dayFmt.format(d)
export const weekdayOfYmd = (ymd: string) => new Date(`${ymd}T12:00:00Z`).getUTCDay()

export const moneyTick = (v: number) => (Math.abs(v) >= 1000 ? `$${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k` : `$${Math.round(v)}`)

interface Loaded {
  tickets: Ticket[]
  branches: Option[]
  sellers: Option[]
}

export async function loadTickets(
  supabase: ReturnType<typeof createClient>,
  fromYmd: string,
  toYmd: string,
  withItems = true,
): Promise<Loaded> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { tickets: [], branches: [], sellers: [] }

  let branches: Option[] = []
  const { data: owned } = await supabase.from("kioscos").select("id, name").eq("owner_id", user.id)
  if (owned && owned.length > 0) {
    branches = owned.map((k: any) => ({ id: k.id, name: k.name || "Sucursal" }))
  } else {
    const { data: emp } = await supabase
      .from("employees")
      .select("kiosko_id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle()
    if (emp?.kiosko_id) branches = [{ id: emp.kiosko_id, name: "Mi sucursal" }]
  }
  if (branches.length === 0) return { tickets: [], branches: [], sellers: [] }

  const ids = branches.map((b) => b.id)
  const branchName = new Map(branches.map((b) => [b.id, b.name]))

  const { data: staff } = await supabase.from("employees").select("id, name").in("kiosko_id", ids)
  const sellers: Option[] = (staff || []).map((e: any) => ({ id: e.id, name: e.name || "Empleado" }))
  const sellerName = new Map(sellers.map((s) => [s.id, s.name]))

  const start = new Date(`${fromYmd}T00:00:00-03:00`)
  const end = new Date(new Date(`${toYmd}T00:00:00-03:00`).getTime() + 24 * 60 * 60 * 1000)

  const sales: any[] = []
  for (let i = 0; i < MAX_PAGES; i++) {
    const { data, error } = await supabase
      .from("sales")
      .select("id, sale_number, kiosko_id, employee_id, total_amount, payment_method, status, created_at")
      .in("kiosko_id", ids)
      .neq("status", "cancelled")
      .gte("created_at", start.toISOString())
      .lt("created_at", end.toISOString())
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .range(i * PAGE, i * PAGE + PAGE - 1)
    if (error) throw error
    sales.push(...(data || []))
    if (!data || data.length < PAGE) break
  }

  const itemsBySale = new Map<string, TicketItem[]>()
  if (withItems && sales.length > 0) {
    for (let i = 0; i < MAX_PAGES; i++) {
      const { data, error } = await supabase
        .from("sale_items")
        .select(
          "id, sale_id, product_id, product_name, quantity, unit_price, cost_price, subtotal, products(name, category, cost), sales!inner(kiosko_id, created_at)",
        )
        .in("sales.kiosko_id", ids)
        .gte("sales.created_at", start.toISOString())
        .lt("sales.created_at", end.toISOString())
        .order("id", { ascending: true })
        .range(i * PAGE, i * PAGE + PAGE - 1)
      if (error) throw error
      ;(data || []).forEach((r: any) => {
        const qty = Number(r.quantity) || 0
        const unitCost = Number(r.cost_price ?? r.products?.cost ?? 0) || 0
        const list = itemsBySale.get(r.sale_id) || []
        list.push({
          productId: r.product_id ?? null,
          name: r.product_name || r.products?.name || "Producto",
          category: r.products?.category || "Sin categoría",
          quantity: qty,
          unitPrice: Number(r.unit_price) || 0,
          subtotal: Number(r.subtotal) || 0,
          cost: unitCost * qty,
        })
        itemsBySale.set(r.sale_id, list)
      })
      if (!data || data.length < PAGE) break
    }
  }

  const tickets: Ticket[] = sales.map((s) => {
    const day = dayFmt.format(new Date(s.created_at))
    const h = Number.parseInt(hourFmt.format(new Date(s.created_at)), 10)
    const hour = h === 24 ? 0 : h
    const items = itemsBySale.get(s.id) || []
    return {
      id: s.id,
      number: s.sale_number,
      branchId: s.kiosko_id,
      branch: branchName.get(s.kiosko_id) || "-",
      sellerId: s.employee_id,
      seller: s.employee_id ? sellerName.get(s.employee_id) || "Empleado" : "Sin asignar",
      payment: s.payment_method,
      createdAt: s.created_at,
      day,
      hour,
      weekday: weekdayOfYmd(day),
      shift: shiftOf(hour),
      total: Number(s.total_amount) || 0,
      units: items.reduce((a, i) => a + i.quantity, 0),
      cost: items.reduce((a, i) => a + i.cost, 0),
      items,
    }
  })

  return { tickets, branches, sellers }
}

// Aplica los filtros globales (sucursal, turno, vendedor, pago, categoria y franja horaria).
// Con categoria, cada ticket pasa a valer solo lo que tiene de esa categoria.
export function applyFilters(tickets: Ticket[], f: Omit<GlobalFilters, "dateRange">): Ticket[] {
  const hr = f.hourRange
  const shiftHours = f.shift ? SHIFT_HOURS[f.shift as ShiftKey] : undefined
  const within = (h: number, from: number, to: number) =>
    from === to ? true : from < to ? h >= from && h < to : h >= from || h < to

  const out: Ticket[] = []
  for (const t of tickets) {
    if (f.branch && t.branchId !== f.branch) continue
    if (f.seller && t.sellerId !== f.seller) continue
    if (f.paymentMethod && (t.payment || "").toLowerCase() !== f.paymentMethod) continue
    if (hr && !within(t.hour, hr.from, hr.to)) continue
    if (shiftHours && !within(t.hour, shiftHours.from, shiftHours.to)) continue
    if (f.category) {
      const mine = t.items.filter((i) => i.category === f.category)
      if (mine.length === 0) continue
      out.push({
        ...t,
        items: mine,
        total: mine.reduce((a, i) => a + i.subtotal, 0),
        units: mine.reduce((a, i) => a + i.quantity, 0),
        cost: mine.reduce((a, i) => a + i.cost, 0),
      })
    } else {
      out.push(t)
    }
  }
  return out
}

export function categoryOptions(tickets: Ticket[]): Option[] {
  const set = new Set<string>()
  tickets.forEach((t) => t.items.forEach((i) => set.add(i.category)))
  return [...set].sort().map((c) => ({ id: c, name: c }))
}

// Hook comun: carga los tickets del rango y devuelve estado de carga/error.
export function useTickets(fromYmd: string, toYmd: string, withItems = true) {
  const supabase = useMemo(() => createClient(), [])
  const [data, setData] = useState<Loaded>({ tickets: [], branches: [], sellers: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    loadTickets(supabase, fromYmd, toYmd, withItems)
      .then((r) => {
        if (!cancelled) setData(r)
      })
      .catch((e: any) => {
        if (!cancelled) setError(e?.message || "No se pudieron cargar las ventas")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [supabase, fromYmd, toYmd, withItems])

  return { ...data, loading, error }
}

export const pct = (now: number, before: number) => (before > 0 ? ((now - before) / before) * 100 : undefined)
