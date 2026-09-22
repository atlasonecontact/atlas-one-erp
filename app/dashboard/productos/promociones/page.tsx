"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { PromotionModal, type Promotion, type PromotionItemInput } from "@/components/products/promotion-modal"
import { Gift, Plus, Pencil } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/toast-provider"
import { useEmployeePermissions } from "@/lib/hooks/use-employee-permissions"
import { AccessDenied } from "@/components/ui/access-denied"

interface ProductOption {
  id: string
  name: string
  price: number
  stock: number
}

export default function PromocionesPage() {
  const [kioskoId, setKioskoId] = useState<string | null>(null)
  const [products, setProducts] = useState<ProductOption[]>([])
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null)

  const supabase = createClient()
  const toast = useToast()
  const { permissions, loading: permsLoading } = useEmployeePermissions()

  const loadProducts = async (kiosko_id: string) => {
    let allProducts: any[] = []
    let from = 0
    const pageSize = 1000
    let hasMore = true

    while (hasMore) {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, price, stock_quantity")
        .eq("kiosko_id", kiosko_id)
        .order("name")
        .range(from, from + pageSize - 1)

      if (error) {
        console.error("Error fetching products:", error)
        break
      }
      if (data && data.length > 0) {
        allProducts = [...allProducts, ...data]
        from += pageSize
        hasMore = data.length === pageSize
      } else {
        hasMore = false
      }
    }

    setProducts(allProducts.map((p) => ({ id: p.id, name: p.name, price: p.price || 0, stock: p.stock_quantity || 0 })))
  }

  const loadPromotions = async (kiosko_id: string) => {
    const { data, error } = await supabase
      .from("promotions")
      .select("id, name, price, promotion_items(product_id, quantity, products(name))")
      .eq("kiosko_id", kiosko_id)
      .order("name")

    if (error) {
      console.error("Error fetching promotions:", error)
      return
    }

    setPromotions(
      (data || []).map((promo: any) => ({
        id: promo.id,
        name: promo.name,
        price: promo.price,
        items: (promo.promotion_items || []).map((it: any) => ({
          product_id: it.product_id,
          quantity: it.quantity,
          product_name: it.products?.name,
        })),
      })),
    )
  }

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const { data: employeeData } = await supabase
        .from("employees")
        .select("kiosko_id")
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle()

      const targetKioskoId = employeeData
        ? employeeData.kiosko_id
        : (await supabase.from("kioscos").select("id").eq("owner_id", user.id).limit(1)).data?.[0]?.id

      if (!targetKioskoId) {
        setLoading(false)
        return
      }

      setKioskoId(targetKioskoId)
      await Promise.all([loadProducts(targetKioskoId), loadPromotions(targetKioskoId)])
      setLoading(false)
    }
    load()
  }, [])

  const handleSavePromotion = async (
    promo: { id?: string; name: string; price: number },
    items: PromotionItemInput[],
  ) => {
    if (!kioskoId) return

    let promotionId = promo.id

    if (promotionId) {
      const { error } = await supabase
        .from("promotions")
        .update({ name: promo.name, price: promo.price, updated_at: new Date().toISOString() })
        .eq("id", promotionId)
      if (error) {
        toast.error("Error al guardar la promoción", error.message)
        return
      }
      await supabase.from("promotion_items").delete().eq("promotion_id", promotionId)
    } else {
      const { data, error } = await supabase
        .from("promotions")
        .insert({ kiosko_id: kioskoId, name: promo.name, price: promo.price })
        .select("id")
        .single()
      if (error || !data) {
        toast.error("Error al crear la promoción", error?.message)
        return
      }
      promotionId = data.id
    }

    const { error: itemsError } = await supabase
      .from("promotion_items")
      .insert(items.map((i) => ({ promotion_id: promotionId, product_id: i.product_id, quantity: i.quantity })))

    if (itemsError) {
      toast.error("Error al guardar los productos de la promoción", itemsError.message)
      return
    }

    toast.success(promo.id ? "Promoción actualizada" : "Promoción creada", promo.name)
    setShowModal(false)
    setEditingPromotion(null)
    loadPromotions(kioskoId)
  }

  const handleDeletePromotion = async (id: string) => {
    const { error } = await supabase.from("promotions").delete().eq("id", id)
    if (error) {
      toast.error("Error al eliminar la promoción", error.message)
      return
    }
    setPromotions((prev) => prev.filter((p) => p.id !== id))
    setShowModal(false)
    setEditingPromotion(null)
    toast.success("Promoción eliminada")
  }

  if (!permsLoading && !permissions.can_manage_inventory) {
    return (
      <div className="space-y-6">
        <AccessDenied
          title="No tenés permiso para gestionar promociones"
          message="Pedile a tu dueño de kiosco que te habilite 'Gestionar inventario' desde Empleados."
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Promociones</h1>
          <p className="text-muted-foreground text-sm">
            Combos de productos con precio propio: se venden desde Punto de Venta y descuentan el stock real de
            cada producto que los compone.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingPromotion(null)
            setShowModal(true)
          }}
          disabled={products.length === 0}
          className="bg-primary hover:bg-primary/80 text-primary-foreground font-semibold gap-2"
        >
          <Plus className="w-4 h-4" />
          Agregar Promoción
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">Cargando...</div>
      ) : promotions.length === 0 ? (
        <div className="rounded-xl border border-primary/10 bg-card p-12 flex flex-col items-center text-center gap-2">
          <Gift className="w-10 h-10 text-muted-foreground opacity-50" />
          <p className="text-foreground font-medium">Todavía no armaste ninguna promoción</p>
          <p className="text-sm text-muted-foreground">
            Ej: "2 Cocas + 1 Fernet" a un precio especial. Elegís los productos y la cantidad de cada uno.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {promotions.map((promo) => {
            const normalTotal = promo.items.reduce((sum, i) => {
              const p = products.find((pr) => pr.id === i.product_id)
              return sum + (p?.price || 0) * i.quantity
            }, 0)
            const discount = normalTotal - promo.price
            return (
              <button
                key={promo.id}
                onClick={() => {
                  setEditingPromotion(promo)
                  setShowModal(true)
                }}
                className="text-left p-4 rounded-xl border border-primary/10 bg-card hover:bg-muted/50 transition-colors space-y-2"
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-foreground">{promo.name}</p>
                  <Pencil className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                </div>
                <p className="text-sm text-muted-foreground">
                  {promo.items.map((i) => `${i.quantity}x ${i.product_name || "?"}`).join(" + ")}
                </p>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-lg font-bold text-primary">${promo.price.toLocaleString("es-AR")}</span>
                  {discount > 0 && (
                    <span className="text-xs text-emerald-400">
                      Ahorro ${discount.toLocaleString("es-AR")}
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}

      <PromotionModal
        open={showModal}
        onClose={() => {
          setShowModal(false)
          setEditingPromotion(null)
        }}
        promotion={editingPromotion}
        products={products}
        onSave={handleSavePromotion}
        onDelete={handleDeletePromotion}
      />
    </div>
  )
}
