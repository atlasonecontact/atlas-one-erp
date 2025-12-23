import { type NextRequest, NextResponse } from "next/server"
import * as XLSX from "xlsx"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { searchParams } = new URL(request.url)
    
    const kioskoId = searchParams.get("kiosko_id")
    const from = searchParams.get("from")
    const to = searchParams.get("to")
    const status = searchParams.get("status") // pendiente, completado, cancelado
    const format = searchParams.get("format") || "xlsx"

    // Check auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Build query for purchases
    let query = supabase
      .from("purchases")
      .select(`
        id,
        created_at,
        supplier_name,
        invoice_number,
        total_amount,
        status,
        notes,
        kiosko_id,
        kioscos(name),
        purchase_items(
          quantity,
          unit_cost,
          subtotal,
          product_id,
          products(name, barcode)
        )
      `)
      .order("created_at", { ascending: false })

    if (kioskoId) {
      query = query.eq("kiosko_id", kioskoId)
    }
    
    if (from) {
      query = query.gte("created_at", `${from}T00:00:00`)
    }
    
    if (to) {
      query = query.lte("created_at", `${to}T23:59:59`)
    }

    if (status) {
      query = query.eq("status", status)
    }

    const { data: purchases, error } = await query

    if (error) {
      console.error("[Export Purchases] Error:", error)
      return NextResponse.json({ error: "Error al obtener compras" }, { status: 500 })
    }

    // Format data for Excel - Summary sheet
    const summaryRows = purchases?.map((purchase: any) => ({
      "Nº Factura": purchase.invoice_number || "-",
      "Fecha": new Date(purchase.created_at).toLocaleDateString("es-AR"),
      "Proveedor": purchase.supplier_name || "-",
      "Kiosco": purchase.kioscos?.name || "-",
      "Cant. Items": purchase.purchase_items?.length || 0,
      "Total": Number(purchase.total_amount || 0),
      "Estado": formatStatus(purchase.status),
      "Notas": purchase.notes || "-",
    })) || []

    // Detailed items sheet
    const detailRows: any[] = []
    purchases?.forEach((purchase: any) => {
      purchase.purchase_items?.forEach((item: any) => {
        detailRows.push({
          "Nº Factura": purchase.invoice_number || "-",
          "Fecha": new Date(purchase.created_at).toLocaleDateString("es-AR"),
          "Proveedor": purchase.supplier_name || "-",
          "Kiosco": purchase.kioscos?.name || "-",
          "Producto": item.products?.name || "-",
          "Código": item.products?.barcode || "-",
          "Cantidad": item.quantity,
          "Costo Unit.": Number(item.unit_cost || 0),
          "Subtotal": Number(item.subtotal || 0),
        })
      })
    })

    // Calculate totals
    const totalCompras = summaryRows.reduce((sum, r) => sum + r.Total, 0)

    // Create workbook
    const wb = XLSX.utils.book_new()

    // Summary sheet
    const wsSummary = XLSX.utils.json_to_sheet(summaryRows)
    
    // Add totals row
    XLSX.utils.sheet_add_aoa(wsSummary, [
      ["", "", "", "TOTAL:", summaryRows.length, totalCompras, "", ""]
    ], { origin: -1 })
    
    // Set column widths
    wsSummary["!cols"] = [
      { wch: 15 }, // Nº Factura
      { wch: 12 }, // Fecha
      { wch: 25 }, // Proveedor
      { wch: 20 }, // Kiosco
      { wch: 12 }, // Cant. Items
      { wch: 15 }, // Total
      { wch: 12 }, // Estado
      { wch: 30 }, // Notas
    ]
    
    XLSX.utils.book_append_sheet(wb, wsSummary, "Resumen Compras")

    // Details sheet
    if (detailRows.length > 0) {
      const wsDetails = XLSX.utils.json_to_sheet(detailRows)
      wsDetails["!cols"] = [
        { wch: 15 }, // Nº Factura
        { wch: 12 }, // Fecha
        { wch: 25 }, // Proveedor
        { wch: 20 }, // Kiosco
        { wch: 30 }, // Producto
        { wch: 15 }, // Código
        { wch: 10 }, // Cantidad
        { wch: 12 }, // Costo Unit.
        { wch: 12 }, // Subtotal
      ]
      XLSX.utils.book_append_sheet(wb, wsDetails, "Detalle Items")
    }

    // Generate file
    const dateStr = from || new Date().toISOString().split("T")[0]
    const filename = `compras_${dateStr}${to ? `_a_${to}` : ""}`

    if (format === "csv") {
      const csv = XLSX.utils.sheet_to_csv(wsSummary)
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
    console.error("[Export Purchases] Error:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

function formatStatus(status: string | null): string {
  const statuses: Record<string, string> = {
    pendiente: "Pendiente",
    pending: "Pendiente",
    completado: "Completado",
    completed: "Completado",
    cancelado: "Cancelado",
    cancelled: "Cancelado",
    recibido: "Recibido",
    received: "Recibido",
  }
  return statuses[status?.toLowerCase() || ""] || status || "-"
}
