"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Upload, X, FileText, CheckCircle, AlertCircle, Download } from "lucide-react"

interface CSVProduct {
  name: string
  category: string
  cost: number
  price: number
  stock: number
  barcode?: string
}

interface CSVImportModalProps {
  open: boolean
  onClose: () => void
  onImport: (products: CSVProduct[]) => void
}

export function CSVImportModal({ open, onClose, onImport }: CSVImportModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<CSVProduct[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const parseCSV = (text: string): { products: CSVProduct[]; errors: string[] } => {
    const lines = text.split("\n").filter((line) => line.trim())
    const errors: string[] = []
    const products: CSVProduct[] = []

    if (lines.length < 2) {
      return { products: [], errors: ["El archivo CSV debe tener al menos una fila de encabezado y una fila de datos"] }
    }

    const headers = lines[0]
      .toLowerCase()
      .split(",")
      .map((h) => h.trim())
    const requiredHeaders = ["nombre", "categoria", "costo", "precio", "stock"]
    const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h))

    if (missingHeaders.length > 0) {
      return { products: [], errors: [`Faltan columnas requeridas: ${missingHeaders.join(", ")}`] }
    }

    const nameIdx = headers.indexOf("nombre")
    const categoryIdx = headers.indexOf("categoria")
    const costIdx = headers.indexOf("costo")
    const priceIdx = headers.indexOf("precio")
    const stockIdx = headers.indexOf("stock")
    const barcodeIdx = headers.indexOf("codigo")

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim())

      if (values.length < 5) {
        errors.push(`Fila ${i + 1}: Faltan valores`)
        continue
      }

      const name = values[nameIdx]
      const category = values[categoryIdx]
      const cost = Number.parseFloat(values[costIdx])
      const price = Number.parseFloat(values[priceIdx])
      const stock = Number.parseInt(values[stockIdx])
      const barcode = barcodeIdx !== -1 ? values[barcodeIdx] : undefined

      if (!name) {
        errors.push(`Fila ${i + 1}: Nombre vacío`)
        continue
      }
      if (!category) {
        errors.push(`Fila ${i + 1}: Categoría vacía`)
        continue
      }
      if (isNaN(cost) || cost < 0) {
        errors.push(`Fila ${i + 1}: Costo inválido`)
        continue
      }
      if (isNaN(price) || price < 0) {
        errors.push(`Fila ${i + 1}: Precio inválido`)
        continue
      }
      if (isNaN(stock) || stock < 0) {
        errors.push(`Fila ${i + 1}: Stock inválido`)
        continue
      }

      products.push({ name, category, cost, price, stock, barcode })
    }

    return { products, errors }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    if (!selectedFile.name.endsWith(".csv")) {
      setErrors(["Por favor selecciona un archivo CSV"])
      return
    }

    setFile(selectedFile)
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      const { products, errors } = parseCSV(text)
      setPreview(products)
      setErrors(errors)
    }
    reader.readAsText(selectedFile)
  }

  const handleImport = async () => {
    if (preview.length === 0) return
    setImporting(true)

    // Simulate async import
    await new Promise((resolve) => setTimeout(resolve, 1000))

    onImport(preview)
    setImporting(false)
    handleClose()
  }

  const handleClose = () => {
    setFile(null)
    setPreview([])
    setErrors([])
    onClose()
  }

  const downloadTemplate = () => {
    const template =
      "nombre,categoria,costo,precio,stock,codigo\nCoca Cola 500ml,Bebidas frías,800,1200,50,7790895000118\nPapas Lays 150g,Snacks,600,950,30,7790310000123"
    const blob = new Blob([template], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "plantilla_productos.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0a0f1a] border border-cyan-500/20 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-cyan-500/10">
          <div>
            <h2 className="text-xl font-bold text-white">Importar Productos desde CSV</h2>
            <p className="text-sm text-gray-400 mt-1">Carga masiva de productos</p>
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
          {/* Template download */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-cyan-400" />
              <span className="text-sm text-gray-300">Descarga la plantilla de ejemplo</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadTemplate}
              className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 bg-transparent"
            >
              <Download className="w-4 h-4 mr-2" />
              Descargar
            </Button>
          </div>

          {/* File upload */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-cyan-500/20 rounded-xl p-8 text-center cursor-pointer hover:border-cyan-500/40 transition-colors"
          >
            <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
            <Upload className="w-12 h-12 text-cyan-500/50 mx-auto mb-4" />
            {file ? (
              <div className="flex items-center justify-center gap-2 text-cyan-400">
                <FileText className="w-5 h-5" />
                <span>{file.name}</span>
              </div>
            ) : (
              <>
                <p className="text-white font-medium mb-1">Arrastra un archivo CSV aquí</p>
                <p className="text-gray-500 text-sm">o haz clic para seleccionar</p>
              </>
            )}
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <div className="flex items-center gap-2 text-red-400 mb-2">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">Errores encontrados</span>
              </div>
              <ul className="text-sm text-red-300 space-y-1 max-h-32 overflow-y-auto">
                {errors.map((error, i) => (
                  <li key={i}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Preview */}
          {preview.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-green-400 mb-3">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">{preview.length} productos listos para importar</span>
              </div>
              <div className="rounded-lg border border-cyan-500/10 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-white/5">
                      <th className="text-left p-3 text-gray-400 font-medium">Nombre</th>
                      <th className="text-left p-3 text-gray-400 font-medium">Categoría</th>
                      <th className="text-right p-3 text-gray-400 font-medium">Precio</th>
                      <th className="text-right p-3 text-gray-400 font-medium">Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.slice(0, 5).map((product, i) => (
                      <tr key={i} className="border-t border-cyan-500/5">
                        <td className="p-3 text-white">{product.name}</td>
                        <td className="p-3 text-gray-400">{product.category}</td>
                        <td className="p-3 text-cyan-400 text-right">${product.price.toLocaleString()}</td>
                        <td className="p-3 text-white text-right">{product.stock}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {preview.length > 5 && (
                  <div className="p-3 text-center text-gray-500 text-sm bg-white/5">
                    ... y {preview.length - 5} productos más
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-cyan-500/10">
          <Button variant="outline" onClick={handleClose} className="border-cyan-500/30 text-gray-300 bg-transparent">
            Cancelar
          </Button>
          <Button
            onClick={handleImport}
            disabled={preview.length === 0 || importing}
            className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold disabled:opacity-50"
          >
            {importing ? "Importando..." : `Importar ${preview.length} productos`}
          </Button>
        </div>
      </div>
    </div>
  )
}
