"use client"

import type React from "react"
import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { 
  Upload, X, FileText, CheckCircle, AlertCircle, Download, 
  Loader2, FileSpreadsheet, AlertTriangle 
} from "lucide-react"

// Extended product structure matching Excel format
export interface CSVProduct {
  sku: string
  name: string
  brand?: string
  variant?: string
  presentation?: string
  category: string
  subcategory?: string
  net_content?: number
  unit?: string
  barcode?: string
  cost_ex_vat?: number
  cost_inc_vat?: number
  sale_price: number
  stock?: number
}

interface CSVImportModalProps {
  open: boolean
  onClose: () => void
  onImport: (products: CSVProduct[]) => Promise<void>
}

// Column mapping configuration - supports both Spanish and English
const COLUMN_MAPPINGS: Record<string, keyof CSVProduct> = {
  'sku': 'sku',
  'codigo': 'sku',
  'código': 'sku',
  'id': 'sku',
  'nombre': 'name',
  'producto nombre': 'name',
  'producto': 'name',
  'name': 'name',
  'marca': 'brand',
  'brand': 'brand',
  'linea': 'variant',
  'línea': 'variant',
  'variante': 'variant',
  'linea / variante': 'variant',
  'línea / variante': 'variant',
  'variant': 'variant',
  'presentacion': 'presentation',
  'presentación': 'presentation',
  'presentacion / formato': 'presentation',
  'presentación / formato': 'presentation',
  'formato': 'presentation',
  'presentation': 'presentation',
  'categoria': 'category',
  'categoría': 'category',
  'category': 'category',
  'subcategoria': 'subcategory',
  'subcategoría': 'subcategory',
  'subcategory': 'subcategory',
  'contenido neto': 'net_content',
  'contenido': 'net_content',
  'net_content': 'net_content',
  'unidad': 'unit',
  'unit': 'unit',
  'ean': 'barcode',
  'ean / código de barras': 'barcode',
  'codigo de barras': 'barcode',
  'código de barras': 'barcode',
  'barcode': 'barcode',
  'costo sin iva': 'cost_ex_vat',
  'costo_sin_iva': 'cost_ex_vat',
  'cost_ex_vat': 'cost_ex_vat',
  'costo': 'cost_ex_vat',
  'cost': 'cost_ex_vat',
  'costo con iva': 'cost_inc_vat',
  'costo_con_iva': 'cost_inc_vat',
  'cost_inc_vat': 'cost_inc_vat',
  'precio de venta': 'sale_price',
  'precio': 'sale_price',
  'precio_venta': 'sale_price',
  'sale_price': 'sale_price',
  'price': 'sale_price',
  'stock': 'stock',
  'stock_quantity': 'stock',
  'cantidad': 'stock',
}

export function CSVImportModal({ open, onClose, onImport }: CSVImportModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<CSVProduct[]>([])
  const [allProducts, setAllProducts] = useState<CSVProduct[]>([])
  const [totalRows, setTotalRows] = useState(0)
  const [errors, setErrors] = useState<string[]>([])
  const [warnings, setWarnings] = useState<string[]>([])
  const [importing, setImporting] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [separator, setSeparator] = useState<',' | ';'>(',')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Parse a single CSV line respecting quoted fields
  const parseCSVLine = useCallback((line: string, sep: ',' | ';'): string[] => {
    const result: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === sep && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    result.push(current.trim())
    return result
  }, [])

  // Detect separator from first line
  const detectSeparator = useCallback((text: string): ',' | ';' => {
    const firstLine = text.split('\n')[0]
    const commas = (firstLine.match(/,/g) || []).length
    const semicolons = (firstLine.match(/;/g) || []).length
    return semicolons > commas ? ';' : ','
  }, [])

  // Parse number handling both . and , as decimal separator
  const parseNumber = useCallback((value: string): number => {
    if (!value || value.trim() === '') return 0
    const cleaned = value.trim()
      .replace(/\s/g, '')
      .replace(/,(?=\d{3})/g, '')
      .replace(/\.(?=\d{3})/g, '')
      .replace(',', '.')
    const num = parseFloat(cleaned)
    return isNaN(num) ? 0 : num
  }, [])

  // Main CSV parser - handles large files efficiently
  const parseCSV = useCallback(async (text: string): Promise<{ products: CSVProduct[]; errors: string[]; warnings: string[] }> => {
    const detectedSep = detectSeparator(text)
    setSeparator(detectedSep)

    const lines = text.split(/\r?\n/).filter(line => line.trim())
    const errors: string[] = []
    const warnings: string[] = []
    const products: CSVProduct[] = []
    const seenSkus = new Set<string>()

    if (lines.length < 2) {
      return { products: [], errors: ['El archivo debe tener al menos una fila de encabezado y una de datos'], warnings: [] }
    }

    // Parse headers
    const headers = parseCSVLine(lines[0], detectedSep).map(h => h.toLowerCase().trim())
    
    // Map headers to our fields
    const columnMap: Record<number, keyof CSVProduct> = {}
    headers.forEach((header, idx) => {
      const mapped = COLUMN_MAPPINGS[header]
      if (mapped) {
        columnMap[idx] = mapped
      }
    })

    // Check for required columns
    const mappedFields = new Set(Object.values(columnMap))
    if (!mappedFields.has('name') && !mappedFields.has('sku')) {
      return { 
        products: [], 
        errors: ['El archivo debe tener al menos una columna "nombre" o "sku"'], 
        warnings: [] 
      }
    }

    // Process rows
    const BATCH_SIZE = 1000
    const totalLines = lines.length - 1

    for (let i = 1; i < lines.length; i++) {
      if (i % BATCH_SIZE === 0) {
        setProgress(Math.round((i / totalLines) * 100))
        await new Promise(resolve => setTimeout(resolve, 0))
      }

      const line = lines[i]
      if (!line.trim()) continue

      const values = parseCSVLine(line, detectedSep)
      const product: Partial<CSVProduct> = {}
      
      for (const [idxStr, field] of Object.entries(columnMap)) {
        const idx = parseInt(idxStr)
        const value = values[idx] || ''
        
        switch (field) {
          case 'sku':
          case 'name':
          case 'brand':
          case 'variant':
          case 'presentation':
          case 'category':
          case 'subcategory':
          case 'unit':
          case 'barcode':
            product[field] = value
            break
          case 'net_content':
          case 'cost_ex_vat':
          case 'cost_inc_vat':
          case 'sale_price':
          case 'stock':
            product[field] = parseNumber(value)
            break
        }
      }

      const rowNum = i + 1
      
      if (!product.sku && !product.name) {
        errors.push(`Fila ${rowNum}: Falta SKU o nombre`)
        continue
      }

      if (!product.sku && product.name) {
        product.sku = product.name
          .substring(0, 50)
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, '-')
          .replace(/-+/g, '-')
      }

      if (seenSkus.has(product.sku!)) {
        warnings.push(`Fila ${rowNum}: SKU duplicado "${product.sku}"`)
      } else {
        seenSkus.add(product.sku!)
      }

      if (!product.sale_price || product.sale_price <= 0) {
        if (product.cost_inc_vat && product.cost_inc_vat > 0) {
          product.sale_price = Math.round(product.cost_inc_vat * 1.3 * 100) / 100
          warnings.push(`Fila ${rowNum}: Sin precio, calculado desde costo`)
        } else {
          errors.push(`Fila ${rowNum}: Precio de venta inválido`)
          continue
        }
      }

      if (product.cost_ex_vat && !product.cost_inc_vat) {
        product.cost_inc_vat = Math.round(product.cost_ex_vat * 1.21 * 100) / 100
      }
      if (product.cost_inc_vat && !product.cost_ex_vat) {
        product.cost_ex_vat = Math.round(product.cost_inc_vat / 1.21 * 100) / 100
      }

      if (!product.category) {
        product.category = 'Sin categoría'
      }

      if (product.stock === undefined) {
        product.stock = 0
      }

      products.push(product as CSVProduct)
    }

    setProgress(100)
    return { products, errors, warnings }
  }, [parseCSVLine, detectSeparator, parseNumber])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    const isCSV = selectedFile.name.endsWith('.csv')
    const isExcel = selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls')

    if (!isCSV && !isExcel) {
      setErrors(['Por favor selecciona un archivo CSV'])
      return
    }

    if (isExcel) {
      setErrors(['Para archivos Excel, primero exporta a CSV UTF-8 desde Excel'])
      setWarnings(['En Excel: Archivo → Guardar como → CSV UTF-8'])
      return
    }

    setFile(selectedFile)
    setParsing(true)
    setErrors([])
    setWarnings([])
    setProgress(0)

    const reader = new FileReader()
    reader.onload = async (event) => {
      const text = event.target?.result as string
      const { products, errors, warnings } = await parseCSV(text)
      setAllProducts(products)
      setPreview(products.slice(0, 100))
      setTotalRows(products.length)
      setErrors(errors.slice(0, 50))
      setWarnings(warnings.slice(0, 20))
      setParsing(false)
    }
    reader.readAsText(selectedFile, 'UTF-8')
  }

  const handleImport = async () => {
    if (allProducts.length === 0) return
    setImporting(true)

    try {
      await onImport(allProducts)
      setImporting(false)
      handleClose()
    } catch (error) {
      console.error('Import error:', error)
      setErrors(['Error al importar productos'])
      setImporting(false)
    }
  }

  const handleClose = () => {
    setFile(null)
    setPreview([])
    setAllProducts([])
    setTotalRows(0)
    setErrors([])
    setWarnings([])
    setProgress(0)
    setParsing(false)
    onClose()
  }

  const downloadTemplate = () => {
    const template = `sku,name,brand,variant,presentation,category,subcategory,net_content,unit,barcode,cost_ex_vat,cost_inc_vat,sale_price,stock
BEB-COC-REG-354MLX,"Coca-Cola Regular 354 ml",Coca-Cola,Regular,"354 ml Lata",Bebidas,Gaseosas,354,ml,7790895000118,1142.89,1382.90,1983.17,50
BEB-COC-REG-354MLX-P6,"Coca-Cola Regular Pack x6",Coca-Cola,Regular,"Pack x6",Bebidas,Gaseosas,354,ml,,6591.91,7976.21,11464.77,20
SNK-LAY-CLA-150G,"Lays Clásicas 150g",Lays,Clásicas,"150g Bolsa",Snacks,Papas,150,g,7790310000123,600.00,726.00,1050.00,25`

    const blob = new Blob(['\ufeff' + template], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'plantilla_productos_atlas.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0a0f1a] border border-cyan-500/20 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-cyan-500/10 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white">Importar Productos desde CSV</h2>
            <p className="text-sm text-gray-400 mt-1">
              Soporta hasta 30,000 productos • Formato Excel compatible
            </p>
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Template download */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="w-5 h-5 text-cyan-400" />
              <div>
                <span className="text-sm text-gray-300 block">Descarga la plantilla de ejemplo</span>
                <span className="text-xs text-gray-500">
                  Columnas: sku, nombre, marca, categoría, precio, costo, stock...
                </span>
              </div>
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

          {/* Column info */}
          <div className="text-xs text-gray-500 px-2">
            <strong>Columnas soportadas:</strong> SKU, Nombre, Marca, Línea/Variante, Presentación, 
            Categoría, Subcategoría, Contenido Neto, Unidad, EAN, Costo sin IVA, Costo con IVA, Precio, Stock
          </div>

          {/* File upload */}
          <div
            onClick={() => !parsing && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              parsing ? 'border-cyan-500/40 cursor-wait' : 'border-cyan-500/20 cursor-pointer hover:border-cyan-500/40'
            }`}
          >
            <input 
              ref={fileInputRef} 
              type="file" 
              accept=".csv" 
              onChange={handleFileChange} 
              className="hidden" 
              disabled={parsing}
            />
            
            {parsing ? (
              <div className="space-y-3">
                <Loader2 className="w-12 h-12 text-cyan-500 mx-auto animate-spin" />
                <p className="text-white font-medium">Procesando archivo...</p>
                <div className="w-64 mx-auto bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-cyan-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-gray-500 text-sm">{progress}% completado</p>
              </div>
            ) : file ? (
              <div className="flex items-center justify-center gap-2 text-cyan-400">
                <FileText className="w-5 h-5" />
                <span>{file.name}</span>
                <span className="text-gray-500">({(file.size / 1024).toFixed(1)} KB)</span>
              </div>
            ) : (
              <>
                <Upload className="w-12 h-12 text-cyan-500/50 mx-auto mb-4" />
                <p className="text-white font-medium mb-1">Arrastra un archivo CSV aquí</p>
                <p className="text-gray-500 text-sm">o haz clic para seleccionar</p>
                <p className="text-gray-600 text-xs mt-2">
                  Para Excel: guardar como &quot;CSV UTF-8&quot;
                </p>
              </>
            )}
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <div className="flex items-center gap-2 text-red-400 mb-2">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">{errors.length} errores</span>
              </div>
              <ul className="text-sm text-red-300 space-y-1 max-h-24 overflow-y-auto">
                {errors.map((error, i) => (
                  <li key={i}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <div className="flex items-center gap-2 text-yellow-400 mb-2">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-medium">{warnings.length} advertencias</span>
              </div>
              <ul className="text-sm text-yellow-300 space-y-1 max-h-20 overflow-y-auto">
                {warnings.map((warning, i) => (
                  <li key={i}>• {warning}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Preview */}
          {preview.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">
                    {totalRows.toLocaleString()} productos listos
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  Mostrando {Math.min(preview.length, 10)}
                </span>
              </div>
              <div className="rounded-lg border border-cyan-500/10 overflow-x-auto">
                <table className="w-full text-sm min-w-[700px]">
                  <thead>
                    <tr className="bg-white/5">
                      <th className="text-left p-3 text-gray-400 font-medium">SKU</th>
                      <th className="text-left p-3 text-gray-400 font-medium">Nombre</th>
                      <th className="text-left p-3 text-gray-400 font-medium">Categoría</th>
                      <th className="text-right p-3 text-gray-400 font-medium">Costo</th>
                      <th className="text-right p-3 text-gray-400 font-medium">Precio</th>
                      <th className="text-right p-3 text-gray-400 font-medium">Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.slice(0, 10).map((product, i) => (
                      <tr key={i} className="border-t border-cyan-500/5">
                        <td className="p-3 text-gray-500 font-mono text-xs">{product.sku?.substring(0, 15)}</td>
                        <td className="p-3 text-white">{product.name?.substring(0, 25)}</td>
                        <td className="p-3 text-gray-400">{product.category}</td>
                        <td className="p-3 text-gray-400 text-right">
                          ${product.cost_inc_vat?.toLocaleString() || '-'}
                        </td>
                        <td className="p-3 text-cyan-400 text-right font-medium">
                          ${product.sale_price?.toLocaleString()}
                        </td>
                        <td className="p-3 text-white text-right">{product.stock || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {totalRows > 10 && (
                  <div className="p-3 text-center text-gray-500 text-sm bg-white/5">
                    ... y {(totalRows - 10).toLocaleString()} más
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-cyan-500/10 shrink-0">
          <div className="text-sm text-gray-500">
            {file && `Separador: ${separator === ',' ? 'coma' : 'punto y coma'}`}
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={handleClose} 
              className="border-cyan-500/30 text-gray-300 bg-transparent"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleImport}
              disabled={totalRows === 0 || importing || parsing}
              className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold disabled:opacity-50 min-w-[180px]"
            >
              {importing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importando...
                </>
              ) : (
                `Importar ${totalRows.toLocaleString()} productos`
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
