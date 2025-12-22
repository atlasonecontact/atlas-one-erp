"use client"

import { Package, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

interface Product {
  id: string
  name: string
  category: string
  price: number
  stock: number
  status: string
}

interface ProductGridProps {
  products: Product[]
  onAddToCart: (product: Product) => void
}

export function ProductGrid({ products, onAddToCart }: ProductGridProps) {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map((product) => (
          <button
            key={product.id}
            onClick={() => onAddToCart(product)}
            disabled={product.stock === 0}
            className={cn(
              "group p-4 rounded-xl border text-left transition-all duration-200",
              product.stock === 0
                ? "border-red-500/20 bg-red-500/5 cursor-not-allowed opacity-60"
                : product.stock <= 10
                  ? "border-yellow-500/20 bg-[#0a0f1a] hover:border-yellow-500/40"
                  : "border-cyan-500/10 bg-[#0a0f1a] hover:border-cyan-500/30 hover:bg-cyan-500/5",
            )}
          >
            {/* Product icon/image placeholder */}
            <div className="w-full aspect-square rounded-lg bg-white/5 flex items-center justify-center mb-3 group-hover:bg-white/10 transition-colors">
              <Package className="w-10 h-10 text-gray-600" />
            </div>

            {/* Product info */}
            <h4 className="text-sm font-medium text-white truncate mb-1">{product.name}</h4>
            <p className="text-xs text-gray-500 mb-2">{product.category}</p>

            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-cyan-400">${product.price.toLocaleString()}</span>
              <div
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-full text-xs",
                  product.stock === 0
                    ? "bg-red-500/20 text-red-400"
                    : product.stock <= 10
                      ? "bg-yellow-500/20 text-yellow-400"
                      : "bg-green-500/20 text-green-400",
                )}
              >
                {product.stock <= 10 && <AlertTriangle className="w-3 h-3" />}
                {product.stock} un.
              </div>
            </div>
          </button>
        ))}
      </div>

      {products.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <Package className="w-12 h-12 mb-4 opacity-50" />
          <p>No se encontraron productos</p>
        </div>
      )}
    </div>
  )
}
