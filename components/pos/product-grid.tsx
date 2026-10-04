"use client"

import { Package, AlertTriangle, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatCurrency } from "@/lib/utils/currency"

interface Product {
  id: string
  name: string
  category: string
  price: number
  stock: number
  status: string
  barcode?: string | null
  isPromotion?: boolean
}

interface ProductGridProps {
  products: Product[]
  onAddToCart: (product: Product) => void
}

// Productos del punto de venta en formato de tabla (dataset): una fila por producto,
// ajustada al ancho de la pantalla, sin scroll lateral. Tocar la fila lo agrega al carrito.
export function ProductGrid({ products, onAddToCart }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <Package className="mb-4 h-12 w-12 opacity-50" />
        <p>No se encontraron productos</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-cyan-500/10 bg-[#0a0f1a]">
      <table className="w-full table-fixed">
        <thead>
          <tr className="border-b border-cyan-500/10 bg-white/[0.03] text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
            <th className="px-3 py-3 sm:px-4">Producto</th>
            <th className="hidden w-[120px] px-3 py-3 text-right sm:table-cell">Precio</th>
            <th className="hidden w-[110px] px-3 py-3 text-center md:table-cell">Stock</th>
            <th className="w-[96px] px-3 py-3 text-right sm:w-[120px] sm:px-4">
              <span className="sm:hidden">Precio</span>
              <span className="hidden sm:inline">Agregar</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => {
            // "Sin stock" es sólo un aviso, no un bloqueo: el conteo de stock suele
            // atrasarse respecto a lo que hay en el local de verdad, y antes esto
            // directamente impedía cobrar el producto (bug real, 2026-10).
            const out = product.stock <= 0
            const low = !out && product.stock <= 10
            return (
              <tr
                key={product.id}
                onClick={() => onAddToCart(product)}
                className={cn(
                  "cursor-pointer border-b border-cyan-500/5 transition-colors hover:bg-cyan-500/5 active:bg-cyan-500/10",
                )}
              >
                <td className="px-3 py-3 sm:px-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "mt-0.5 hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg sm:flex",
                        product.isPromotion ? "bg-purple-500/15 text-purple-300" : "bg-white/5 text-gray-500",
                      )}
                    >
                      <Package className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="break-words text-sm font-medium leading-snug text-white">{product.name}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500">
                        <span>{product.category}</span>
                        {product.barcode && <span className="font-mono text-gray-600">· {product.barcode}</span>}
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 md:hidden",
                            out
                              ? "bg-red-500/15 text-red-400"
                              : low
                                ? "bg-yellow-500/15 text-yellow-400"
                                : "bg-green-500/15 text-green-400",
                          )}
                        >
                          {(out || low) && <AlertTriangle className="h-3 w-3" />}
                          {out ? "Sin stock" : `${product.stock} un.`}
                        </span>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="hidden px-3 py-3 text-right text-base font-bold text-cyan-400 sm:table-cell">
                  {formatCurrency(product.price)}
                </td>
                <td className="hidden px-3 py-3 text-center md:table-cell">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
                      out
                        ? "bg-red-500/15 text-red-400"
                        : low
                          ? "bg-yellow-500/15 text-yellow-400"
                          : "bg-green-500/15 text-green-400",
                    )}
                  >
                    {(out || low) && <AlertTriangle className="h-3 w-3" />}
                    {out ? "Sin stock" : `${product.stock} un.`}
                  </span>
                </td>
                <td className="px-3 py-3 text-right sm:px-4">
                  <span className="mb-1 block text-sm font-bold text-cyan-400 sm:hidden">{formatCurrency(product.price)}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onAddToCart(product)
                    }}
                    className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-cyan-500 px-3 text-sm font-semibold text-black transition-colors hover:bg-cyan-400 sm:w-auto"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Agregar</span>
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
