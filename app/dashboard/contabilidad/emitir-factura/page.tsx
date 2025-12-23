"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Receipt, CreditCard, MinusCircle, PlusCircle, ArrowRight, Building2 } from "lucide-react"

const invoiceTypes = [
  {
    id: "factura-a",
    name: "Factura A",
    description: "Para responsables inscriptos en IVA",
    icon: FileText,
    color: "from-blue-500 to-blue-600",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
  },
  {
    id: "factura-b",
    name: "Factura B",
    description: "Para consumidores finales y monotributistas",
    icon: FileText,
    color: "from-emerald-500 to-emerald-600",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30",
  },
  {
    id: "factura-c",
    name: "Factura C",
    description: "Para monotributistas hacia cualquier receptor",
    icon: FileText,
    color: "from-purple-500 to-purple-600",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/30",
  },
  {
    id: "factura-e",
    name: "Factura E",
    description: "Para exportaciones de bienes y servicios",
    icon: Building2,
    color: "from-amber-500 to-amber-600",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
  },
  {
    id: "nota-credito",
    name: "Nota de Crédito",
    description: "Para anular o modificar facturas emitidas",
    icon: MinusCircle,
    color: "from-red-500 to-red-600",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/30",
  },
  {
    id: "nota-debito",
    name: "Nota de Débito",
    description: "Para agregar cargos adicionales",
    icon: PlusCircle,
    color: "from-orange-500 to-orange-600",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/30",
  },
  {
    id: "recibo",
    name: "Recibo",
    description: "Comprobante de pago recibido",
    icon: Receipt,
    color: "from-cyan-500 to-cyan-600",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/30",
  },
  {
    id: "ticket",
    name: "Ticket / Factura Simplificada",
    description: "Para ventas menores a consumidor final",
    icon: CreditCard,
    color: "from-pink-500 to-pink-600",
    bgColor: "bg-pink-500/10",
    borderColor: "border-pink-500/30",
  },
]

export default function EmitirFacturaPage() {
  const [selectedType, setSelectedType] = useState<string | null>(null)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Emitir Factura</h1>
        <p className="text-gray-400">Selecciona el tipo de comprobante que deseas emitir</p>
      </div>

      {/* Invoice Types Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {invoiceTypes.map((type) => {
          const Icon = type.icon
          const isSelected = selectedType === type.id

          return (
            <Card
              key={type.id}
              className={`cursor-pointer transition-all duration-300 hover:scale-[1.02] ${
                isSelected
                  ? `${type.bgColor} ${type.borderColor} border-2`
                  : "bg-[#0a0f1a] border-gray-800 hover:border-gray-700"
              }`}
              onClick={() => setSelectedType(type.id)}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${type.color}`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold">{type.name}</h3>
                    <p className="text-gray-400 text-sm mt-1">{type.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Action Button */}
      {selectedType && (
        <div className="flex justify-end">
          <Button
            size="lg"
            className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
          >
            Continuar con {invoiceTypes.find((t) => t.id === selectedType)?.name}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}

      {/* Recent Activity */}
      <Card className="bg-[#0a0f1a] border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Últimas Facturas Emitidas</CardTitle>
          <CardDescription>Acceso rápido a tus comprobantes recientes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-400">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No hay facturas emitidas recientemente</p>
            <p className="text-sm">Selecciona un tipo de comprobante para comenzar</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
