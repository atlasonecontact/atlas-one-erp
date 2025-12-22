"use client"

import type React from "react"
import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  X, TrendingUp, TrendingDown, Percent, Package, 
  Layers, CheckSquare, AlertTriangle, Loader2 
} from "lucide-react"

interface Product {
  id: string
  name: string
  category: string
  cost: number
  price: number
  stock: number
}

interface PriceAdjustmentModalProps {
  open: boolean
  onClose: () => void
  products: Product[]
  selectedProducts: string[]
  categories: string[]
  onApply: (productIds: string[], newPrices: Record<string, number>) => Promise<void>
}

type AdjustmentType = 'percentage' | 'fixed' | 'margin'
type AdjustmentScope = 'selected' | 'category' | 'all'

export function PriceAdjustmentModal({ 
  open, 
  onClose, 
  products, 
  selectedProducts, 
  categories,
  onApply 
}: PriceAdjustmentModalProps) {
  const [adjustmentType, setAdjustmentType] = useState<AdjustmentType>('percentage')
  const [adjustmentScope, setAdjustmentScope] = useState<AdjustmentScope>(
    selectedProducts.length > 0 ? 'selected' : 'all'
  )
  const [percentage, setPercentage] = useState<number>(10)
  const [fixedAmount, setFixedAmount] = useState<number>(100)
  const [marginPercentage, setMarginPercentage] = useState<number>(30)
  const [selectedCategory, setSelectedCategory] = useState<string>(categories[0] || '')
  const [isIncrease, setIsIncrease] = useState(true)
  const [applying, setApplying] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)

  // Get affected products based on scope
  const affectedProducts = useMemo(() => {
    switch (adjustmentScope) {
      case 'selected':
        return products.filter(p => selectedProducts.includes(p.id))
      case 'category':
        return products.filter(p => p.category === selectedCategory)
      case 'all':
        return products
    }
  }, [adjustmentScope, products, selectedProducts, selectedCategory])

  // Calculate new prices
  const priceChanges = useMemo(() => {
    const changes: Record<string, { oldPrice: number; newPrice: number; diff: number }> = {}
    
    affectedProducts.forEach(product => {
      let newPrice = product.price
      
      switch (adjustmentType) {
        case 'percentage':
          const multiplier = isIncrease ? (1 + percentage / 100) : (1 - percentage / 100)
          newPrice = Math.round(product.price * multiplier * 100) / 100
          break
        case 'fixed':
          newPrice = isIncrease 
            ? product.price + fixedAmount 
            : Math.max(0, product.price - fixedAmount)
          break
        case 'margin':
          // Calculate price based on cost and desired margin
          newPrice = Math.round(product.cost * (1 + marginPercentage / 100) * 100) / 100
          break
      }
      
      changes[product.id] = {
        oldPrice: product.price,
        newPrice: Math.max(0, newPrice),
        diff: newPrice - product.price
      }
    })
    
    return changes
  }, [affectedProducts, adjustmentType, percentage, fixedAmount, marginPercentage, isIncrease])

  // Summary calculations
  const summary = useMemo(() => {
    const values = Object.values(priceChanges)
    const totalOld = values.reduce((sum, c) => sum + c.oldPrice, 0)
    const totalNew = values.reduce((sum, c) => sum + c.newPrice, 0)
    const avgDiff = values.length > 0 
      ? values.reduce((sum, c) => sum + c.diff, 0) / values.length 
      : 0
    const percentChange = totalOld > 0 ? ((totalNew - totalOld) / totalOld) * 100 : 0
    
    return {
      count: values.length,
      totalOld,
      totalNew,
      avgDiff,
      percentChange
    }
  }, [priceChanges])

  const handleApply = async () => {
    setApplying(true)
    try {
      const newPrices: Record<string, number> = {}
      Object.entries(priceChanges).forEach(([id, change]) => {
        newPrices[id] = change.newPrice
      })
      await onApply(Object.keys(priceChanges), newPrices)
      onClose()
    } catch (error) {
      console.error('Error applying price changes:', error)
    } finally {
      setApplying(false)
      setShowConfirmation(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0a0f1a] border border-cyan-500/20 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-cyan-500/10 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Percent className="w-5 h-5 text-cyan-400" />
              Ajuste de Precios
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Modifica precios de múltiples productos
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {showConfirmation ? (
          /* Confirmation Screen */
          <div className="p-6 space-y-6">
            <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <div className="flex items-center gap-2 text-yellow-400 mb-2">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-medium">Confirmar cambios</span>
              </div>
              <p className="text-sm text-gray-300">
                Estás a punto de modificar el precio de <strong className="text-white">{summary.count} productos</strong>.
              </p>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-white/5 border border-cyan-500/10">
                <div className="text-sm text-gray-400 mb-1">Cambio promedio</div>
                <div className={`text-2xl font-bold ${summary.avgDiff >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {summary.avgDiff >= 0 ? '+' : ''}{summary.percentChange.toFixed(1)}%
                </div>
              </div>
              <div className="p-4 rounded-lg bg-white/5 border border-cyan-500/10">
                <div className="text-sm text-gray-400 mb-1">Diferencia total</div>
                <div className={`text-2xl font-bold ${summary.avgDiff >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {summary.avgDiff >= 0 ? '+' : ''}${(summary.totalNew - summary.totalOld).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Preview of changes */}
            <div className="rounded-lg border border-cyan-500/10 overflow-hidden">
              <div className="bg-white/5 p-3 text-sm font-medium text-gray-400">
                Vista previa de cambios
              </div>
              <div className="max-h-48 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-white/5 sticky top-0">
                    <tr>
                      <th className="text-left p-3 text-gray-400">Producto</th>
                      <th className="text-right p-3 text-gray-400">Anterior</th>
                      <th className="text-right p-3 text-gray-400">Nuevo</th>
                      <th className="text-right p-3 text-gray-400">Cambio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {affectedProducts.slice(0, 10).map(product => {
                      const change = priceChanges[product.id]
                      return (
                        <tr key={product.id} className="border-t border-cyan-500/5">
                          <td className="p-3 text-white">{product.name.substring(0, 25)}</td>
                          <td className="p-3 text-gray-400 text-right">${change.oldPrice.toLocaleString()}</td>
                          <td className="p-3 text-cyan-400 text-right font-medium">${change.newPrice.toLocaleString()}</td>
                          <td className={`p-3 text-right ${change.diff >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {change.diff >= 0 ? '+' : ''}{((change.diff / change.oldPrice) * 100).toFixed(1)}%
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                {affectedProducts.length > 10 && (
                  <div className="p-3 text-center text-gray-500 text-sm bg-white/5">
                    ... y {affectedProducts.length - 10} más
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Configuration Screen */
          <div className="p-6 space-y-6 overflow-y-auto flex-1">
            {/* Scope Selection */}
            <div>
              <Label className="text-gray-300 mb-3 block">Aplicar a</Label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setAdjustmentScope('selected')}
                  disabled={selectedProducts.length === 0}
                  className={`p-4 rounded-lg border transition-all ${
                    adjustmentScope === 'selected'
                      ? 'border-cyan-500 bg-cyan-500/10'
                      : 'border-cyan-500/20 hover:border-cyan-500/40 disabled:opacity-40 disabled:cursor-not-allowed'
                  }`}
                >
                  <CheckSquare className={`w-5 h-5 mb-2 mx-auto ${
                    adjustmentScope === 'selected' ? 'text-cyan-400' : 'text-gray-500'
                  }`} />
                  <div className="text-sm text-white">Seleccionados</div>
                  <div className="text-xs text-gray-500">{selectedProducts.length} productos</div>
                </button>
                
                <button
                  onClick={() => setAdjustmentScope('category')}
                  className={`p-4 rounded-lg border transition-all ${
                    adjustmentScope === 'category'
                      ? 'border-cyan-500 bg-cyan-500/10'
                      : 'border-cyan-500/20 hover:border-cyan-500/40'
                  }`}
                >
                  <Layers className={`w-5 h-5 mb-2 mx-auto ${
                    adjustmentScope === 'category' ? 'text-cyan-400' : 'text-gray-500'
                  }`} />
                  <div className="text-sm text-white">Por Categoría</div>
                  <div className="text-xs text-gray-500">{categories.length} categorías</div>
                </button>
                
                <button
                  onClick={() => setAdjustmentScope('all')}
                  className={`p-4 rounded-lg border transition-all ${
                    adjustmentScope === 'all'
                      ? 'border-cyan-500 bg-cyan-500/10'
                      : 'border-cyan-500/20 hover:border-cyan-500/40'
                  }`}
                >
                  <Package className={`w-5 h-5 mb-2 mx-auto ${
                    adjustmentScope === 'all' ? 'text-cyan-400' : 'text-gray-500'
                  }`} />
                  <div className="text-sm text-white">Todos</div>
                  <div className="text-xs text-gray-500">{products.length} productos</div>
                </button>
              </div>
            </div>

            {/* Category selector (if scope is category) */}
            {adjustmentScope === 'category' && (
              <div>
                <Label className="text-gray-300 mb-2 block">Categoría</Label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full p-3 rounded-lg bg-white/5 border border-cyan-500/20 text-white focus:border-cyan-500/50 outline-none"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat} className="bg-[#0a0f1a]">{cat}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Adjustment Type */}
            <div>
              <Label className="text-gray-300 mb-3 block">Tipo de ajuste</Label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setAdjustmentType('percentage')}
                  className={`p-3 rounded-lg border transition-all ${
                    adjustmentType === 'percentage'
                      ? 'border-cyan-500 bg-cyan-500/10'
                      : 'border-cyan-500/20 hover:border-cyan-500/40'
                  }`}
                >
                  <Percent className={`w-4 h-4 mb-1 mx-auto ${
                    adjustmentType === 'percentage' ? 'text-cyan-400' : 'text-gray-500'
                  }`} />
                  <div className="text-sm text-white">Porcentaje</div>
                </button>
                
                <button
                  onClick={() => setAdjustmentType('fixed')}
                  className={`p-3 rounded-lg border transition-all ${
                    adjustmentType === 'fixed'
                      ? 'border-cyan-500 bg-cyan-500/10'
                      : 'border-cyan-500/20 hover:border-cyan-500/40'
                  }`}
                >
                  <span className={`text-lg mb-1 block ${
                    adjustmentType === 'fixed' ? 'text-cyan-400' : 'text-gray-500'
                  }`}>$</span>
                  <div className="text-sm text-white">Monto Fijo</div>
                </button>
                
                <button
                  onClick={() => setAdjustmentType('margin')}
                  className={`p-3 rounded-lg border transition-all ${
                    adjustmentType === 'margin'
                      ? 'border-cyan-500 bg-cyan-500/10'
                      : 'border-cyan-500/20 hover:border-cyan-500/40'
                  }`}
                >
                  <TrendingUp className={`w-4 h-4 mb-1 mx-auto ${
                    adjustmentType === 'margin' ? 'text-cyan-400' : 'text-gray-500'
                  }`} />
                  <div className="text-sm text-white">Margen s/Costo</div>
                </button>
              </div>
            </div>

            {/* Adjustment Value */}
            <div>
              {adjustmentType === 'percentage' && (
                <>
                  <div className="flex items-center gap-4 mb-3">
                    <button
                      onClick={() => setIsIncrease(true)}
                      className={`flex-1 p-3 rounded-lg border flex items-center justify-center gap-2 transition-all ${
                        isIncrease
                          ? 'border-green-500 bg-green-500/10 text-green-400'
                          : 'border-cyan-500/20 text-gray-400 hover:border-cyan-500/40'
                      }`}
                    >
                      <TrendingUp className="w-4 h-4" />
                      Aumentar
                    </button>
                    <button
                      onClick={() => setIsIncrease(false)}
                      className={`flex-1 p-3 rounded-lg border flex items-center justify-center gap-2 transition-all ${
                        !isIncrease
                          ? 'border-red-500 bg-red-500/10 text-red-400'
                          : 'border-cyan-500/20 text-gray-400 hover:border-cyan-500/40'
                      }`}
                    >
                      <TrendingDown className="w-4 h-4" />
                      Reducir
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={percentage}
                      onChange={(e) => setPercentage(Math.max(0, Math.min(100, Number(e.target.value))))}
                      className="text-center text-2xl font-bold bg-white/5 border-cyan-500/20"
                      min={0}
                      max={100}
                    />
                    <span className="text-2xl text-gray-400">%</span>
                  </div>
                  {/* Quick buttons */}
                  <div className="flex gap-2 mt-3">
                    {[5, 10, 15, 20, 25].map(val => (
                      <button
                        key={val}
                        onClick={() => setPercentage(val)}
                        className={`flex-1 py-2 rounded text-sm transition-colors ${
                          percentage === val 
                            ? 'bg-cyan-500 text-black font-semibold' 
                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                        }`}
                      >
                        {val}%
                      </button>
                    ))}
                  </div>
                </>
              )}

              {adjustmentType === 'fixed' && (
                <>
                  <div className="flex items-center gap-4 mb-3">
                    <button
                      onClick={() => setIsIncrease(true)}
                      className={`flex-1 p-3 rounded-lg border flex items-center justify-center gap-2 transition-all ${
                        isIncrease
                          ? 'border-green-500 bg-green-500/10 text-green-400'
                          : 'border-cyan-500/20 text-gray-400 hover:border-cyan-500/40'
                      }`}
                    >
                      <TrendingUp className="w-4 h-4" />
                      Aumentar
                    </button>
                    <button
                      onClick={() => setIsIncrease(false)}
                      className={`flex-1 p-3 rounded-lg border flex items-center justify-center gap-2 transition-all ${
                        !isIncrease
                          ? 'border-red-500 bg-red-500/10 text-red-400'
                          : 'border-cyan-500/20 text-gray-400 hover:border-cyan-500/40'
                      }`}
                    >
                      <TrendingDown className="w-4 h-4" />
                      Reducir
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl text-gray-400">$</span>
                    <Input
                      type="number"
                      value={fixedAmount}
                      onChange={(e) => setFixedAmount(Math.max(0, Number(e.target.value)))}
                      className="text-center text-2xl font-bold bg-white/5 border-cyan-500/20"
                      min={0}
                    />
                  </div>
                </>
              )}

              {adjustmentType === 'margin' && (
                <>
                  <Label className="text-gray-400 text-sm mb-2 block">
                    Precio = Costo × (1 + margen)
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={marginPercentage}
                      onChange={(e) => setMarginPercentage(Math.max(0, Number(e.target.value)))}
                      className="text-center text-2xl font-bold bg-white/5 border-cyan-500/20"
                      min={0}
                    />
                    <span className="text-2xl text-gray-400">%</span>
                  </div>
                  {/* Quick buttons */}
                  <div className="flex gap-2 mt-3">
                    {[20, 30, 40, 50, 60].map(val => (
                      <button
                        key={val}
                        onClick={() => setMarginPercentage(val)}
                        className={`flex-1 py-2 rounded text-sm transition-colors ${
                          marginPercentage === val 
                            ? 'bg-cyan-500 text-black font-semibold' 
                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                        }`}
                      >
                        {val}%
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Summary Box */}
            <div className="p-4 rounded-lg bg-white/5 border border-cyan-500/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400">Productos afectados:</span>
                <span className="text-white font-medium">{affectedProducts.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Cambio estimado:</span>
                <span className={`font-medium ${summary.percentChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {summary.percentChange >= 0 ? '+' : ''}{summary.percentChange.toFixed(1)}% promedio
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-cyan-500/10 shrink-0">
          <div className="text-sm text-gray-500">
            {affectedProducts.length > 0 && !showConfirmation && (
              <>Cambio total: {summary.percentChange >= 0 ? '+' : ''}{summary.percentChange.toFixed(1)}%</>
            )}
          </div>
          <div className="flex gap-3">
            {showConfirmation ? (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => setShowConfirmation(false)}
                  className="border-cyan-500/30 text-gray-300 bg-transparent"
                >
                  Volver
                </Button>
                <Button
                  onClick={handleApply}
                  disabled={applying}
                  className="bg-green-500 hover:bg-green-400 text-black font-semibold min-w-[160px]"
                >
                  {applying ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Aplicando...
                    </>
                  ) : (
                    'Confirmar Cambios'
                  )}
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  onClick={onClose}
                  className="border-cyan-500/30 text-gray-300 bg-transparent"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => setShowConfirmation(true)}
                  disabled={affectedProducts.length === 0}
                  className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold min-w-[160px]"
                >
                  Ver cambios ({affectedProducts.length})
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
