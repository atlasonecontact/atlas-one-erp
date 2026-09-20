"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

export type EmployeePermissions = {
  can_sell: boolean
  can_open_register: boolean
  can_close_register: boolean
  can_collect_payments: boolean
  can_process_returns: boolean
  can_view_reports: boolean
  can_view_stock: boolean
  can_manage_inventory: boolean
  can_receive_merchandise: boolean
  can_stock_entry: boolean
  can_create_internal_order: boolean
  can_view_internal_orders: boolean
  can_view_products: boolean
  can_manage_employees: boolean
}

export const DEFAULT_EMPLOYEE_PERMISSIONS: EmployeePermissions = {
  can_sell: true,
  can_open_register: false,
  can_close_register: false,
  can_collect_payments: true,
  can_process_returns: false,
  can_view_reports: false,
  can_view_stock: true,
  can_manage_inventory: false,
  can_receive_merchandise: false,
  can_stock_entry: false,
  can_create_internal_order: false,
  can_view_internal_orders: false,
  can_view_products: true,
  can_manage_employees: false,
}

const OWNER_PERMISSIONS: EmployeePermissions = Object.fromEntries(
  Object.keys(DEFAULT_EMPLOYEE_PERMISSIONS).map((key) => [key, true]),
) as EmployeePermissions

export function useEmployeePermissions() {
  const [loading, setLoading] = useState(true)
  const [isOwner, setIsOwner] = useState(false)
  const [kioskoId, setKioskoId] = useState<string | null>(null)
  const [permissions, setPermissions] = useState<EmployeePermissions>(OWNER_PERMISSIONS)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        if (!cancelled) setLoading(false)
        return
      }

      const { data: employeeData } = await supabase
        .from("employees")
        .select("kiosko_id, permissions")
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle()

      if (cancelled) return

      if (employeeData) {
        setIsOwner(false)
        setKioskoId(employeeData.kiosko_id)
        setPermissions({ ...DEFAULT_EMPLOYEE_PERMISSIONS, ...(employeeData.permissions || {}) })
      } else {
        const { data: kioscos } = await supabase.from("kioscos").select("id").eq("owner_id", user.id).limit(1)
        if (cancelled) return
        setIsOwner(true)
        setKioskoId(kioscos && kioscos.length > 0 ? kioscos[0].id : null)
        setPermissions(OWNER_PERMISSIONS)
      }
      setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  return { loading, isOwner, kioskoId, permissions }
}
