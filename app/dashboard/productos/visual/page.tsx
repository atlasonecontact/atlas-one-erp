"use client"

import { useState, useEffect, useMemo } from "react"
import {
  Search,
  ImageIcon,
  Sparkles,
  Check,
  X,
  RefreshCw,
  Package,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/toast-provider"
import { useEmployeePermissions } from "@/lib/hooks/use-employee-permissions"
import { AccessDenied } from "@/components/ui/access-denied"
import { formatCurrency } from "@/lib/utils/currency"
import { cn } from "@/lib/utils"
import { lookupOpenFoodFactsImage, lookupUpcItemDbImage, decideConfidence } from "@/lib/catalog/image-providers"

interface VisualProduct {
  id: string
  name: string
  sku: string | null
  brand: string | null
  variant: string | null
  presentation: string | null
  net_content: number | null
  unit: string | null
  category: string
  subcategory: string | null
  barcode: string | null
  price: number
  stock_quantity: number
  is_active: boolean
  image_url: string | null
}

interface PendingImage {
  id: string
  product_id: string
  image_url: string
  source: string
  confidence_score: number | null
  match_method: string | null
  product?: { name: string; brand: string | null }
}

type StockFilter = "all" | "with_stock" | "low_stock" | "no_stock"
type EstadoFilter = "all" | "active" | "inactive"

const ALL = "__all__"

function formatoDe(p: VisualProduct): string | null {
  if (p.presentation) return p.presentation
  if (p.net_content && p.unit) return `${p.net_content} ${p.unit}`
  return null
}

export default function CatalogoVisualPage() {
  const supabase = createClient()
  const toast = useToast()
  const { permissions, kioskoId, loading: permsLoading } = useEmployeePermissions()

  const [tab, setTab] = useState<"catalogo" | "revision">("catalogo")
  const [products, setProducts] = useState<VisualProduct[]>([])
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState("")
  const [category, setCategory] = useState(ALL)
  const [subcategory, setSubcategory] = useState(ALL)
  const [brand, setBrand] = useState(ALL)
  const [variantFilter, setVariantFilter] = useState(ALL)
  const [formato, setFormato] = useState(ALL)
  const [stockFilter, setStockFilter] = useState<StockFilter>("all")
  const [estadoFilter, setEstadoFilter] = useState<EstadoFilter>("active")

  const [enriching, setEnriching] = useState(false)
  const [enrichProgress, setEnrichProgress] = useState({ processed: 0, total: 0, approved: 0, pending: 0, noMatch: 0 })

  useEffect(() => {
    if (kioskoId) loadAll(kioskoId)
  }, [kioskoId])

  const loadAll = async (kiosko_id: string) => {
    setLoading(true)
    const [productsRes, pendingRes] = await Promise.all([
      supabase
        .from("products")
        .select(
          "id, name, sku, brand, variant, presentation, net_content, unit, category, subcategory, barcode, price, stock_quantity, is_active, image_url",
        )
        .eq("kiosko_id", kiosko_id)
        .order("name"),
      supabase
        .from("product_images")
        .select("id, product_id, image_url, source, confidence_score, match_method, products(name, brand)")
        .eq("kiosko_id", kiosko_id)
        .eq("status", "pending")
        .order("created_at", { ascending: false }),
    ])

    if (productsRes.error) {
      toast.error("No se pudieron cargar los productos", productsRes.error.message)
    } else if (productsRes.data) {
      setProducts(productsRes.data as VisualProduct[])
    }
    if (pendingRes.error) {
      toast.error("No se pudo cargar la cola de revisión", pendingRes.error.message)
    } else if (pendingRes.data) {
      setPendingImages(
        (pendingRes.data as any[]).map((p) => ({ ...p, product: p.products })),
      )
    }
    setLoading(false)
  }

  // Opciones de filtro siempre derivadas de los datos reales — nunca
  // hardcodeadas (pedido explícito del prompt original).
  const options = useMemo(() => {
    const uniq = (vals: (string | null | undefined)[]) =>
      Array.from(new Set(vals.filter((v): v is string => !!v && v.trim() !== ""))).sort()
    return {
      categories: uniq(products.map((p) => p.category)),
      subcategories: uniq(products.filter((p) => category === ALL || p.category === category).map((p) => p.subcategory)),
      brands: uniq(products.map((p) => p.brand)),
      variants: uniq(products.map((p) => p.variant)),
      formatos: uniq(products.map(formatoDe)),
    }
  }, [products, category])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return products.filter((p) => {
      if (estadoFilter === "active" && !p.is_active) return false
      if (estadoFilter === "inactive" && p.is_active) return false
      if (category !== ALL && p.category !== category) return false
      if (subcategory !== ALL && p.subcategory !== subcategory) return false
      if (brand !== ALL && p.brand !== brand) return false
      if (variantFilter !== ALL && p.variant !== variantFilter) return false
      if (formato !== ALL && formatoDe(p) !== formato) return false
      if (stockFilter === "with_stock" && p.stock_quantity <= 0) return false
      if (stockFilter === "low_stock" && !(p.stock_quantity > 0 && p.stock_quantity <= 10)) return false
      if (stockFilter === "no_stock" && p.stock_quantity > 0) return false

      if (q) {
        const haystack = [p.name, p.sku, p.barcode, p.brand, p.category, p.variant, formatoDe(p)]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [products, search, category, subcategory, brand, variantFilter, formato, stockFilter, estadoFilter])

  const stats = useMemo(() => {
    const conImagen = products.filter((p) => p.image_url).length
    return { total: products.length, conImagen, sinImagen: products.length - conImagen, pendientes: pendingImages.length }
  }, [products, pendingImages])

  const handleEnrich = async () => {
    if (!kioskoId) return
    const candidates = products.filter((p) => !p.image_url && p.barcode)
    if (candidates.length === 0) {
      toast.info("Nada para enriquecer", "No hay productos con código de barras sin imagen")
      return
    }

    setEnriching(true)
    const progress = { processed: 0, total: candidates.length, approved: 0, pending: 0, noMatch: 0 }
    setEnrichProgress({ ...progress })
    let firstErrorMessage: string | null = null

    for (const product of candidates) {
      try {
        // 1) Catálogo compartido por código de barras (lo que ya encontró
        //    cualquier otro kiosko de Atlas One para ese mismo producto).
        const { data: cached } = await supabase
          .from("barcode_catalog")
          .select("image_url")
          .eq("barcode", product.barcode)
          .maybeSingle()

        if (cached?.image_url) {
          const { error } = await supabase.rpc("set_product_image_candidate", {
            p_kiosko: kioskoId,
            p_product: product.id,
            p_barcode: product.barcode,
            p_image_url: cached.image_url,
            p_source: "barcode_catalog",
            p_confidence: 95,
            p_match_method: "código de barras (catálogo compartido Atlas One)",
            p_auto_approve: true,
          })
          if (error) {
            firstErrorMessage ??= error.message
            progress.noMatch++
          } else {
            progress.approved++
          }
        } else {
          const candidate =
            (await lookupOpenFoodFactsImage(product.barcode!).catch(() => null)) ??
            (await lookupUpcItemDbImage(product.barcode!).catch(() => null))

          if (!candidate) {
            progress.noMatch++
          } else {
            const { confidence, autoApprove, matchMethod } = decideConfidence(candidate, product.name)
            const { error } = await supabase.rpc("set_product_image_candidate", {
              p_kiosko: kioskoId,
              p_product: product.id,
              p_barcode: product.barcode,
              p_image_url: candidate.imageUrl,
              p_source: candidate.source,
              p_source_url: candidate.sourceUrl ?? null,
              p_confidence: confidence,
              p_match_method: matchMethod,
              p_auto_approve: autoApprove,
            })
            if (error) {
              firstErrorMessage ??= error.message
              progress.noMatch++
            } else if (autoApprove) {
              progress.approved++
            } else {
              progress.pending++
            }
          }
        }
      } catch (e) {
        firstErrorMessage ??= e instanceof Error ? e.message : String(e)
        progress.noMatch++
      }

      progress.processed++
      setEnrichProgress({ ...progress })
      // Ser buen vecino con las APIs públicas que usamos.
      await new Promise((r) => setTimeout(r, 250))
    }

    setEnriching(false)
    if (firstErrorMessage) {
      toast.error("Enriquecimiento con errores", firstErrorMessage)
    } else {
      toast.success(
        "Enriquecimiento terminado",
        `${progress.approved} con imagen, ${progress.pending} a revisar, ${progress.noMatch} sin resultado`,
      )
    }
    loadAll(kioskoId)
  }

  const handleApprove = async (pendingImage: PendingImage) => {
    const { error } = await supabase.rpc("approve_product_image", { p_product_image_id: pendingImage.id })
    if (error) {
      toast.error("No se pudo aprobar", error.message)
    } else {
      toast.success("Imagen aprobada", pendingImage.product?.name || "")
      if (kioskoId) loadAll(kioskoId)
    }
  }

  const handleManualUpload = async (product: VisualProduct, file: File) => {
    if (!kioskoId) return
    const ext = file.name.split(".").pop() || "jpg"
    const path = `${kioskoId}/${product.id}-${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage.from("product-images").upload(path, file)
    if (uploadError) {
      toast.error("No se pudo subir la imagen", uploadError.message)
      return
    }

    const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path)

    // Una imagen manual siempre queda aprobada y nunca la pisa después un
    // match automático de menor prioridad (ver set_product_image_candidate).
    const { error } = await supabase.rpc("set_product_image_candidate", {
      p_kiosko: kioskoId,
      p_product: product.id,
      p_image_url: urlData.publicUrl,
      p_source: "manual",
      p_auto_approve: true,
    })

    if (error) {
      toast.error("No se pudo asociar la imagen", error.message)
    } else {
      toast.success("Imagen cargada", product.name)
      loadAll(kioskoId)
    }
  }

  const handleReject = async (pendingImage: PendingImage) => {
    const { error } = await supabase.rpc("reject_product_image", { p_product_image_id: pendingImage.id })
    if (error) {
      toast.error("No se pudo rechazar", error.message)
    } else {
      toast.success("Imagen rechazada", pendingImage.product?.name || "")
      if (kioskoId) loadAll(kioskoId)
    }
  }

  if (!permsLoading && !permissions.can_view_products) {
    return (
      <div className="space-y-6">
        <AccessDenied
          title="No tenés permiso para ver el catálogo"
          message="Pedile a tu dueño de kiosco que te habilite 'Ver productos' desde Empleados."
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Catálogo Visual</h1>
        <p className="text-muted-foreground text-sm">Explorá tus productos de forma visual</p>
      </div>

      {/* Stats + enriquecimiento */}
      <div className="rounded-xl border border-cyan-500/10 bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-6 text-sm">
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              <p className="text-muted-foreground">productos</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-400">{stats.conImagen}</p>
              <p className="text-muted-foreground">con imagen</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-muted-foreground">{stats.sinImagen}</p>
              <p className="text-muted-foreground">sin imagen</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-400">{stats.pendientes}</p>
              <p className="text-muted-foreground">a revisar</p>
            </div>
          </div>

          {permissions.can_manage_inventory && (
            <Button
              onClick={handleEnrich}
              disabled={enriching}
              className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold gap-2"
            >
              {enriching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {enriching ? "Enriqueciendo..." : "Enriquecer catálogo"}
            </Button>
          )}
        </div>

        {enriching && (
          <div className="mt-4 space-y-2">
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-cyan-500 transition-all"
                style={{ width: `${(enrichProgress.processed / Math.max(enrichProgress.total, 1)) * 100}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Procesando... {enrichProgress.processed}/{enrichProgress.total} — {enrichProgress.approved} con imagen,{" "}
              {enrichProgress.pending} a revisar, {enrichProgress.noMatch} sin resultado
            </p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-cyan-500/10">
        <button
          onClick={() => setTab("catalogo")}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
            tab === "catalogo" ? "border-cyan-500 text-cyan-400" : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          Catálogo
        </button>
        <button
          onClick={() => setTab("revision")}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2",
            tab === "revision" ? "border-cyan-500 text-cyan-400" : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          Revisión de imágenes
          {stats.pendientes > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 text-xs">
              {stats.pendientes}
            </span>
          )}
        </button>
      </div>

      {tab === "catalogo" ? (
        <>
          {/* Filtros */}
          <div className="space-y-3">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar producto, SKU, código de barras, marca..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-card border-cyan-500/10 text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <FilterSelect label="Categoría" value={category} onChange={setCategory} options={options.categories} />
              <FilterSelect
                label="Subcategoría"
                value={subcategory}
                onChange={setSubcategory}
                options={options.subcategories}
              />
              <FilterSelect label="Marca" value={brand} onChange={setBrand} options={options.brands} />
              <FilterSelect label="Variante" value={variantFilter} onChange={setVariantFilter} options={options.variants} />
              <FilterSelect label="Formato" value={formato} onChange={setFormato} options={options.formatos} />
              <Select value={stockFilter} onValueChange={(v) => setStockFilter(v as StockFilter)}>
                <SelectTrigger className="w-[150px] bg-card border-cyan-500/10 text-foreground">
                  <SelectValue placeholder="Stock" />
                </SelectTrigger>
                <SelectContent className="bg-[#0d1424] border-cyan-500/20">
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="with_stock">Con stock</SelectItem>
                  <SelectItem value="low_stock">Stock bajo</SelectItem>
                  <SelectItem value="no_stock">Sin stock</SelectItem>
                </SelectContent>
              </Select>
              <Select value={estadoFilter} onValueChange={(v) => setEstadoFilter(v as EstadoFilter)}>
                <SelectTrigger className="w-[140px] bg-card border-cyan-500/10 text-foreground">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent className="bg-[#0d1424] border-cyan-500/20">
                  <SelectItem value="active">Activos</SelectItem>
                  <SelectItem value="inactive">Inactivos</SelectItem>
                  <SelectItem value="all">Todos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">{filtered.length} productos</p>

          {/* Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="w-6 h-6 text-cyan-500 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Package className="mb-4 h-12 w-12 opacity-50" />
              <p>No se encontraron productos</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filtered.map((p) => (
                <div
                  key={p.id}
                  className="rounded-xl border border-cyan-500/10 bg-card overflow-hidden flex flex-col"
                >
                  <label
                    className={cn(
                      "group relative aspect-square bg-muted flex items-center justify-center overflow-hidden",
                      permissions.can_manage_inventory && "cursor-pointer",
                    )}
                  >
                    {p.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.image_url} alt={p.name} className="w-full h-full object-contain" />
                    ) : (
                      <ImageIcon className="w-10 h-10 text-muted-foreground" />
                    )}
                    {permissions.can_manage_inventory && (
                      <>
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-xs text-foreground">{p.image_url ? "Cambiar imagen" : "Subir imagen"}</span>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleManualUpload(p, file)
                            e.target.value = ""
                          }}
                        />
                      </>
                    )}
                  </label>
                  <div className="p-3 space-y-1 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                    {formatoDe(p) && <p className="text-xs text-muted-foreground">{formatoDe(p)}</p>}
                    {p.brand && <p className="text-xs text-muted-foreground truncate">{p.brand}</p>}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-sm font-bold text-cyan-400">{formatCurrency(p.price)}</span>
                      <span className={cn("text-xs", p.stock_quantity <= 0 ? "text-red-400" : "text-muted-foreground")}>
                        Stock {p.stock_quantity}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-3">
          {pendingImages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Check className="mb-4 h-12 w-12 opacity-50" />
              <p>No hay imágenes pendientes de revisión</p>
            </div>
          ) : (
            pendingImages.map((pi) => (
              <div
                key={pi.id}
                className="flex items-center gap-4 rounded-xl border border-cyan-500/10 bg-card p-4"
              >
                <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={pi.image_url} alt="" className="w-full h-full object-contain" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{pi.product?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {pi.match_method} — confianza {pi.confidence_score}%
                  </p>
                </div>
                {permissions.can_manage_inventory && (
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      onClick={() => handleApprove(pi)}
                      className="bg-green-500/15 text-green-400 hover:bg-green-500/25"
                    >
                      <Check className="w-4 h-4 mr-1" /> Aprobar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleReject(pi)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <X className="w-4 h-4 mr-1" /> Rechazar
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: string[]
}) {
  if (options.length === 0) return null
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[150px] bg-card border-cyan-500/10 text-foreground">
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent className="bg-[#0d1424] border-cyan-500/20">
        <SelectItem value={ALL}>{label}: todos</SelectItem>
        {options.map((o) => (
          <SelectItem key={o} value={o}>
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
