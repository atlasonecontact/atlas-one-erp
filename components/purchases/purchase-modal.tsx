"use client"

import type React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface PurchaseModalProps {
  open: boolean
  onClose: () => void
  onSave: (purchase: { id: number; supplier: string; date: string; total: number; status: string }) => void
}

const suppliers = ["Coca-Cola", "Pepsico", "Mondelez", "Philip Morris", "Red Bull", "La Serenísima"]

export function PurchaseModal({ open, onClose, onSave }: PurchaseModalProps) {
  const [formData, setFormData] = useState({
    supplier: "",
    total: 0,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      id: 0,
      supplier: formData.supplier,
      date: new Date().toISOString().split("T")[0],
      total: formData.total,
      status: "pending",
    })
    setFormData({ supplier: "", total: 0 })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#0a0f1a] border-cyan-500/20 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Nueva Orden de Compra</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-gray-300">Proveedor</Label>
            <Select value={formData.supplier} onValueChange={(value) => setFormData({ ...formData, supplier: value })}>
              <SelectTrigger className="bg-[#0d1424] border-cyan-500/20 text-white">
                <SelectValue placeholder="Seleccionar proveedor" />
              </SelectTrigger>
              <SelectContent className="bg-[#0d1424] border-cyan-500/20">
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier} value={supplier} className="text-white hover:bg-white/10">
                    {supplier}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300">Total de la compra</Label>
            <Input
              type="number"
              value={formData.total}
              onChange={(e) => setFormData({ ...formData, total: Number(e.target.value) })}
              placeholder="$0"
              className="bg-[#0d1424] border-cyan-500/20 text-white"
            />
          </div>

          <div className="flex gap-3 pt-4">
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
              disabled={!formData.supplier || !formData.total}
              className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold"
            >
              Crear Orden
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
