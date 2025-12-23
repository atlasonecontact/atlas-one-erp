"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/toast-provider"

export type ExportType = "sales" | "stock" | "purchases"
export type ExportFormat = "xlsx" | "csv"

interface ExportButtonProps {
  type: ExportType
  kioskoId?: string
  dateFrom?: string
  dateTo?: string
  className?: string
  variant?: "default" | "outline" | "ghost" | "secondary"
  size?: "default" | "sm" | "lg" | "icon"
  showLabel?: boolean
}

const TYPE_LABELS: Record<ExportType, string> = {
  sales: "Ventas",
  stock: "Inventario",
  purchases: "Compras",
}

export function ExportButton({
  type,
  kioskoId,
  dateFrom,
  dateTo,
  className,
  variant = "outline",
  size = "default",
  showLabel = true,
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)
  const toast = useToast()

  const handleExport = async (format: ExportFormat) => {
    setIsExporting(true)

    try {
      const params = new URLSearchParams()
      if (kioskoId) params.set("kiosko_id", kioskoId)
      if (dateFrom) params.set("from", dateFrom)
      if (dateTo) params.set("to", dateTo)
      params.set("format", format)

      const url = `/api/export/${type}?${params.toString()}`
      
      // Create invisible link and trigger download
      const response = await fetch(url)
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Error desconocido" }))
        throw new Error(error.error || "Error al exportar")
      }

      const blob = await response.blob()
      const filename = response.headers.get("Content-Disposition")?.match(/filename="(.+)"/)?.[1] 
        || `${type}_export.${format}`

      const link = document.createElement("a")
      link.href = URL.createObjectURL(blob)
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(link.href)

      toast.success("Exportación completada", `${TYPE_LABELS[type]} exportado como ${format.toUpperCase()}`)
    } catch (error: any) {
      toast.error("Error al exportar", error.message || "Intenta de nuevo")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={className} disabled={isExporting}>
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {showLabel && <span className="ml-2">Exportar</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport("xlsx")}>
          <FileSpreadsheet className="h-4 w-4 mr-2 text-green-600" />
          Exportar como Excel (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleExport("csv")}>
          <FileText className="h-4 w-4 mr-2 text-blue-600" />
          Exportar como CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Quick export buttons for common scenarios
export function ExportSalesButton({ kioskoId, dateFrom, dateTo, ...props }: Omit<ExportButtonProps, "type">) {
  return <ExportButton type="sales" kioskoId={kioskoId} dateFrom={dateFrom} dateTo={dateTo} {...props} />
}

export function ExportStockButton({ kioskoId, ...props }: Omit<ExportButtonProps, "type">) {
  return <ExportButton type="stock" kioskoId={kioskoId} {...props} />
}

export function ExportPurchasesButton({ kioskoId, dateFrom, dateTo, ...props }: Omit<ExportButtonProps, "type">) {
  return <ExportButton type="purchases" kioskoId={kioskoId} dateFrom={dateFrom} dateTo={dateTo} {...props} />
}
