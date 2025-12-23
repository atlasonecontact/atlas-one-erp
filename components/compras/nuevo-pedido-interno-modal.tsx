"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2, Warehouse, Building2, Search } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface Props {
  open: boolean
  onClose: () => void
  kioskoId: string
  onSuccess: () => void
}

interface ProductoItem {
  producto_id: string
  producto_nombre: string
  cantidad: number
  observaciones: string
}

interface Kiosco {
  id: string
  name: string
}

interface Producto {
  id: string
  name: string
  category: string
}

export function NuevoPedidoInternoModal({ open, onClose, kioskoId, onSuccess }: Props) {
  const [tipoDestino, setTipoDestino] = useState<"stock_central" | "sucursal">("stock_central")
  const [destinoKioscoId, setDestinoKioscoId] = useState<string>("")
  const [observaciones, setObservaciones] = useState("")
  const [items, setItems] = useState<ProductoItem[]>([])
  const [kioscos, setKioscos] = useState<Kiosco[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [searchProducto, setSearchProducto] = useState("")
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    if (open) {
      loadKioscos()
      loadProductos()
    }
  }, [open])

  const loadKioscos = async () => {
    const { data, error } = await supabase.from("kioscos").select("id, name").neq("id", kioskoId).order("name")

    if (!error && data) {
      setKioscos(data)
    }
  }

  const loadProductos = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("id, name, category")
      .eq("kiosko_id", kioskoId)
      .order("name")

    if (!error && data) {
      setProductos(data)
    }
  }

  const handleAddItem = () => {
    setItems([...items, { producto_id: "", producto_nombre: "", cantidad: 1, observaciones: "" }])
  }

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const handleItemChange = (index: number, field: keyof ProductoItem, value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const handleProductoSelect = (index: number, productoId: string) => {
    const producto = productos.find((p) => p.id === productoId)
    if (producto) {
      handleItemChange(index, "producto_id", productoId)
      handleItemChange(index, "producto_nombre", producto.name)
    }
  }

  const handleSubmit = async () => {
    if (items.length === 0) {
      alert("Debe agregar al menos un producto")
      return
    }

    if (tipoDestino === "sucursal" && !destinoKioscoId) {
      alert("Debe seleccionar una sucursal de destino")
      return
    }

    const invalidItems = items.filter((item) => !item.producto_id || item.cantidad <= 0)
    if (invalidItems.length > 0) {
      alert("Todos los items deben tener un producto y cantidad válida")
      return
    }

    setLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const { data: pedido, error: pedidoError } = await supabase
        .from("pedidos_internos")
        .insert({
          kiosco_id: kioskoId,
          tipo_destino: tipoDestino,
          destino_kiosco_id: tipoDestino === "sucursal" ? destinoKioscoId : null,
          estado: "pendiente",
          observaciones: observaciones || null,
          solicitado_por: user?.id,
        })
        .select()
        .single()

      if (pedidoError) throw pedidoError

      const itemsToInsert = items.map((item) => ({
        pedido_id: pedido.id,
        producto_id: item.producto_id,
        cantidad: item.cantidad,
        observaciones: item.observaciones || null,
      }))

      const { error: itemsError } = await supabase.from("pedidos_internos_items").insert(itemsToInsert)

      if (itemsError) throw itemsError

      onSuccess()
      handleClose()
    } catch (error) {
      console.error("Error creando pedido interno:", error)
      alert("Error al crear el pedido interno")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setTipoDestino("stock_central")
    setDestinoKioscoId("")
    setObservaciones("")
    setItems([])
    setSearchProducto("")
    onClose()
  }

  const filteredProductos = productos.filter(
    (p) =>
      p.name.toLowerCase().includes(searchProducto.toLowerCase()) ||
      (p.category || "").toLowerCase().includes(searchProducto.toLowerCase()),
  )

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-[#0a0f1a] border-cyan-500/20 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Nuevo Pedido Interno</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Destino */}
          <div className="space-y-3">
            <Label className="text-sm text-gray-400">Destino del Pedido</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTipoDestino("stock_central")}
                className={`p-4 rounded-lg border-2 transition-all ${
                  tipoDestino === "stock_central"
                    ? "border-cyan-500 bg-cyan-500/10"
                    : "border-gray-700 bg-gray-800/50 hover:border-gray-600"
                }`}
              >
                <Warehouse className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
                <p className="text-sm font-medium">Stock Central</p>
                <p className="text-xs text-gray-500 mt-1">Depósito principal</p>
              </button>
              <button
                type="button"
                onClick={() => setTipoDestino("sucursal")}
                className={`p-4 rounded-lg border-2 transition-all ${
                  tipoDestino === "sucursal"
                    ? "border-purple-500 bg-purple-500/10"
                    : "border-gray-700 bg-gray-800/50 hover:border-gray-600"
                }`}
              >
                <Building2 className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                <p className="text-sm font-medium">Sucursal</p>
                <p className="text-xs text-gray-500 mt-1">Otra sucursal</p>
              </button>
            </div>
          </div>

          {/* Seleccionar Sucursal */}
          {tipoDestino === "sucursal" && (
            <div className="space-y-2">
              <Label className="text-sm text-gray-400">Sucursal de Destino</Label>
              <Select value={destinoKioscoId} onValueChange={setDestinoKioscoId}>
                <SelectTrigger className="bg-[#0d1424] border-cyan-500/20 text-white">
                  <SelectValue placeholder="Seleccionar sucursal" />
                </SelectTrigger>
                <SelectContent className="bg-[#0d1424] border-cyan-500/20">
                  {kioscos.map((kiosco) => (
                    <SelectItem key={kiosco.id} value={kiosco.id}>
                      {kiosco.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm text-gray-400">Productos</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddItem}
                className="border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/10 bg-transparent"
              >
                <Plus className="w-4 h-4 mr-1" />
                Agregar Item
              </Button>
            </div>

            {items.length === 0 ? (
              <div className="p-6 rounded-lg border border-dashed border-gray-700 text-center text-gray-500">
                No hay items agregados. Haz clic en "Agregar Item" para comenzar.
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={index} className="p-4 rounded-lg bg-gray-800/50 border border-gray-700 space-y-3">
                    <div className="grid grid-cols-12 gap-3">
                      <div className="col-span-5">
                        <Label className="text-xs text-gray-500 mb-1">Producto</Label>
                        <Select value={item.producto_id} onValueChange={(value) => handleProductoSelect(index, value)}>
                          <SelectTrigger className="bg-[#0d1424] border-cyan-500/20 text-white h-9">
                            <SelectValue placeholder="Seleccionar" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#0d1424] border-cyan-500/20">
                            <div className="px-2 py-2">
                              <div className="relative">
                                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
                                <Input
                                  type="text"
                                  placeholder="Buscar..."
                                  value={searchProducto}
                                  onChange={(e) => setSearchProducto(e.target.value)}
                                  className="pl-7 h-8 bg-gray-800 border-gray-700 text-white text-xs"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                            </div>
                            {filteredProductos.map((producto) => (
                              <SelectItem key={producto.id} value={producto.id}>
                                {producto.name} {producto.category && `(${producto.category})`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs text-gray-500 mb-1">Cantidad</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.cantidad}
                          onChange={(e) => handleItemChange(index, "cantidad", Number.parseInt(e.target.value) || 0)}
                          className="bg-[#0d1424] border-cyan-500/20 text-white h-9"
                        />
                      </div>
                      <div className="col-span-4">
                        <Label className="text-xs text-gray-500 mb-1">Notas</Label>
                        <Input
                          type="text"
                          placeholder="Opcional"
                          value={item.observaciones}
                          onChange={(e) => handleItemChange(index, "observaciones", e.target.value)}
                          className="bg-[#0d1424] border-cyan-500/20 text-white h-9"
                        />
                      </div>
                      <div className="col-span-1 flex items-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveItem(index)}
                          className="text-red-400 hover:text-red-300 h-9 w-9"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Observaciones */}
          <div className="space-y-2">
            <Label className="text-sm text-gray-400">Observaciones Generales (Opcional)</Label>
            <Textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Agregar notas adicionales sobre el pedido..."
              className="bg-[#0d1424] border-cyan-500/20 text-white min-h-[80px]"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="border-gray-700 text-gray-400 hover:bg-gray-800 bg-transparent"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={loading || items.length === 0}
              className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold"
            >
              {loading ? "Creando..." : "Crear Pedido"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
