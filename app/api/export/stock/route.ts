import { type NextRequest, NextResponse } from "next/server"
import * as XLSX from "xlsx"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { searchParams } = new URL(request.url)
    
    const kioskoId = searchParams.get("kiosko_id")
    const lowStockOnly = searchParams.get("low_stock") === "true"
    const category = searchParams.get("category")
    const format = searchParams.get("format") || "xlsx"

    // Check auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Build query
    let query = supabase
      .from("products")
      .select(`
        id,
        name,
        barcode,
        category,
        stock_quantity,
        min_stock_level,
        cost_price,
        sale_price,
        is_active,
        kiosko_id,
        kioscos(name),
        updated_at
      `)
      .order("name")

    if (kioskoId) {
      query = query.eq("kiosko_id", kioskoId)
    }

    if (category) {
      query = query.eq("category", category)
    }

    const { data: products, error } = await query

    if (error) {
      console.error("[Export Stock] Error:", error)
      return NextResponse.json({ error: "Error al obtener productos" }, { status: 500 })
    }

    // Filter low stock if requested
    let filteredProducts = products || []
    if (lowStockOnly) {
      filteredProducts = filteredProducts.filter((p: any) => 
        p.stock_quantity <= (p.min_stock_level || 10)
      )
    }

    // Format data for Excel
    const rows = filteredProducts.map((p: any) => {
      const stockStatus = p.stock_quantity <= 0 
        ? "SIN STOCK" 
        : p.stock_quantity <= (p.min_stock_level || 10)
          ? "BAJO"
          : "OK"
      
      const margin = p.sale_price && p.cost_price 
        ? ((p.sale_price - p.cost_price) / p.sale_price * 100).toFixed(1)
        : "-"

      return {
        "Producto": p.name,
        "Código": p.barcode || "-",
        "Categoría": p.category || "-",
        "Kiosco": p.kioscos?.name || "-",
        "Stock Actual": p.stock_quantity ?? 0,
        "Stock Mínimo": p.min_stock_level || 10,
        "Precio Costo": p.cost_price ? Number(p.cost_price) : 0,
        "Precio Venta": p.sale_price ? Number(p.sale_price) : 0,
        "Margen %": margin,
        "Estado": stockStatus,
        "Activo": p.is_active ? "Sí" : "No",
        "Última Actualización": p.updated_at 
          ? new Date(p.updated_at).toLocaleDateString("es-AR") 
          : "-",
      }
    })

    // Calculate statistics
    const stats = {
      totalProducts: rows.length,
      lowStock: rows.filter(r => r.Estado === "BAJO").length,
      noStock: rows.filter(r => r.Estado === "SIN STOCK").length,
      totalValue: rows.reduce((sum, r) => sum + (r["Stock Actual"] * r["Precio Costo"]), 0),
      totalRetailValue: rows.reduce((sum, r) => sum + (r["Stock Actual"] * r["Precio Venta"]), 0),
    }

    // Create workbook
    const wb = XLSX.utils.book_new()

    // Stock sheet
    const wsStock = XLSX.utils.json_to_sheet(rows)
    
    // Set column widths
    wsStock["!cols"] = [
      { wch: 35 }, // Producto
      { wch: 15 }, // Código
      { wch: 15 }, // Categoría
      { wch: 20 }, // Kiosco
      { wch: 12 }, // Stock Actual
      { wch: 12 }, // Stock Mínimo
      { wch: 12 }, // Precio Costo
      { wch: 12 }, // Precio Venta
      { wch: 10 }, // Margen
      { wch: 12 }, // Estado
      { wch: 8 },  // Activo
      { wch: 15 }, // Última Actualización
    ]
    
    XLSX.utils.book_append_sheet(wb, wsStock, "Inventario")

    // Statistics sheet
    const statsData = [
      ["Resumen de Inventario", ""],
      ["Fecha de Exportación", new Date().toLocaleDateString("es-AR")],
      ["", ""],
      ["Total de Productos", stats.totalProducts],
      ["Productos con Stock Bajo", stats.lowStock],
      ["Productos Sin Stock", stats.noStock],
      ["", ""],
      ["Valor Total (Costo)", `$${stats.totalValue.toLocaleString("es-AR")}`],
      ["Valor Total (Venta)", `$${stats.totalRetailValue.toLocaleString("es-AR")}`],
      ["Ganancia Potencial", `$${(stats.totalRetailValue - stats.totalValue).toLocaleString("es-AR")}`],
    ]
    
    const wsStats = XLSX.utils.aoa_to_sheet(statsData)
    wsStats["!cols"] = [{ wch: 25 }, { wch: 20 }]
    XLSX.utils.book_append_sheet(wb, wsStats, "Resumen")

    // Low stock sheet (if there are items)
    const lowStockItems = rows.filter(r => r.Estado === "BAJO" || r.Estado === "SIN STOCK")
    if (lowStockItems.length > 0) {
      const wsLowStock = XLSX.utils.json_to_sheet(lowStockItems)
      wsLowStock["!cols"] = wsStock["!cols"]
      XLSX.utils.book_append_sheet(wb, wsLowStock, "Stock Bajo")
    }

    // Generate file
    const dateStr = new Date().toISOString().split("T")[0]
    const filename = `inventario_${dateStr}${lowStockOnly ? "_bajo" : ""}`

    if (format === "csv") {
      const csv = XLSX.utils.sheet_to_csv(wsStock)
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}.csv"`,
        },
      })
    }

    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}.xlsx"`,
      },
    })
  } catch (error) {
    console.error("[Export Stock] Error:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
