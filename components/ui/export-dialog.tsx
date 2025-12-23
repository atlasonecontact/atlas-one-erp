"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Download, FileSpreadsheet, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/toast-provider"

type ExportType = "sales" | "stock" | "purchases"
type DateRange = "today" | "week" | "month" | "custom"

interface ExportDialogProps {
  type: ExportType
  kioskoId?: string
  kioskoName?: string
  trigger?: React.ReactNode
}

const TYPE_CONFIG: Record<ExportType, { title: string; description: string; hasDateRange: boolean }> = {
  sales: {
    title: "Exportar Ventas",
    description: "Descarga un Excel con todas las ventas y detalles de items.",
    hasDateRange: true,
  },
  stock: {
    title: "Exportar Inventario",
    description: "Descarga un Excel con el stock actual de todos los productos.",
    hasDateRange: false,
  },
  purchases: {
    title: "Exportar Compras",
    description: "Descarga un Excel con todas las compras a proveedores.",
    hasDateRange: true,
  },
}

export function ExportDialog({ type, kioskoId, kioskoName, trigger }: ExportDialogProps) {
  const [open, setOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange>("month")
  const [customFrom, setCustomFrom] = useState("")
  const [customTo, setCustomTo] = useState("")
  const [lowStockOnly, setLowStockOnly] = useState(false)
  const toast = useToast()

  const config = TYPE_CONFIG[type]

  const getDateRange = (): { from: string; to: string } => {
    const today = new Date()
    const toDate = today.toISOString().split("T")[0]

    switch (dateRange) {
      case "today":
        return { from: toDate, to: toDate }
      case "week": {
        const weekAgo = new Date(today)
        weekAgo.setDate(weekAgo.getDate() - 7)
        return { from: weekAgo.toISOString().split("T")[0], to: toDate }
      }
      case "month": {
        const monthAgo = new Date(today)
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        return { from: monthAgo.toISOString().split("T")[0], to: toDate }
      }
      case "custom":
        return { from: customFrom, to: customTo || toDate }
      default:
        return { from: "", to: "" }
    }
  }

  const handleExport = async () => {
    setIsExporting(true)

    try {
      const params = new URLSearchParams()
      if (kioskoId) params.set("kiosko_id", kioskoId)
      
      if (config.hasDateRange) {
        const { from, to } = getDateRange()
        if (from) params.set("from", from)
        if (to) params.set("to", to)
      }

      if (type === "stock" && lowStockOnly) {
        params.set("low_stock", "true")
      }

      params.set("format", "xlsx")

      const url = `/api/export/${type}?${params.toString()}`
      
      const response = await fetch(url)
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Error desconocido" }))
        throw new Error(error.error || "Error al exportar")
      }

      const blob = await response.blob()
      const filename = response.headers.get("Content-Disposition")?.match(/filename="(.+)"/)?.[1] 
        || `${type}_export.xlsx`

      const link = document.createElement("a")
      link.href = URL.createObjectURL(blob)
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(link.href)

      toast.success("Exportación completada", `Archivo descargado: ${filename}`)
      
      setOpen(false)
    } catch (error: any) {
      toast.error("Error al exportar", error.message || "Intenta de nuevo")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-green-600" />
            {config.title}
          </DialogTitle>
          <DialogDescription>
            {config.description}
            {kioskoName && <span className="block mt-1 font-medium">Kiosco: {kioskoName}</span>}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {config.hasDateRange && (
            <div className="space-y-3">
              <Label>Rango de fechas</Label>
              <div className="space-y-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="dateRange"
                    value="today"
                    checked={dateRange === "today"}
                    onChange={(e) => setDateRange(e.target.value as DateRange)}
                    className="h-4 w-4"
                  />
                  <span className="text-sm">Hoy</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="dateRange"
                    value="week"
                    checked={dateRange === "week"}
                    onChange={(e) => setDateRange(e.target.value as DateRange)}
                    className="h-4 w-4"
                  />
                  <span className="text-sm">Última semana</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="dateRange"
                    value="month"
                    checked={dateRange === "month"}
                    onChange={(e) => setDateRange(e.target.value as DateRange)}
                    className="h-4 w-4"
                  />
                  <span className="text-sm">Último mes</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="dateRange"
                    value="custom"
                    checked={dateRange === "custom"}
                    onChange={(e) => setDateRange(e.target.value as DateRange)}
                    className="h-4 w-4"
                  />
                  <span className="text-sm">Personalizado</span>
                </label>
              </div>

              {dateRange === "custom" && (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="space-y-1">
                    <Label htmlFor="from" className="text-xs">Desde</Label>
                    <Input
                      id="from"
                      type="date"
                      value={customFrom}
                      onChange={(e) => setCustomFrom(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="to" className="text-xs">Hasta</Label>
                    <Input
                      id="to"
                      type="date"
                      value={customTo}
                      onChange={(e) => setCustomTo(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {type === "stock" && (
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="lowStockOnly"
                checked={lowStockOnly}
                onChange={(e) => setLowStockOnly(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="lowStockOnly" className="font-normal">
                Solo productos con stock bajo
              </Label>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exportando...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Descargar Excel
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Convenience components
export function ExportSalesDialog(props: Omit<ExportDialogProps, "type">) {
  return <ExportDialog type="sales" {...props} />
}

export function ExportStockDialog(props: Omit<ExportDialogProps, "type">) {
  return <ExportDialog type="stock" {...props} />
}

export function ExportPurchasesDialog(props: Omit<ExportDialogProps, "type">) {
  return <ExportDialog type="purchases" {...props} />
}
