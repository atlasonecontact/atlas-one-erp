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
    const format = searchParams.get("format") || "xlsx" // xlsx or csv

    // Check auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Build query
    let query = supabase
      .from("sales")
      .select(`
        id,
        sale_number,
        created_at,
        total_amount,
        payment_method,
        employee_id,
        kiosko_id,
        kioscos(name),
        employees(full_name),
        sale_items(
          quantity,
          unit_price,
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

    const { data: sales, error } = await query

    if (error) {
      console.error("[Export Sales] Error:", error)
      return NextResponse.json({ error: "Error al obtener ventas" }, { status: 500 })
    }

    // Format data for Excel - create two sheets: Summary and Details
    const summaryRows = sales?.map((sale: any) => ({
      "Nº Venta": sale.sale_number || sale.id.slice(0, 8),
      "Fecha": new Date(sale.created_at).toLocaleDateString("es-AR"),
      "Hora": new Date(sale.created_at).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }),
      "Kiosco": sale.kioscos?.name || "-",
      "Empleado": sale.employees?.full_name || "-",
      "Medio de Pago": formatPaymentMethod(sale.payment_method),
      "Cant. Items": sale.sale_items?.length || 0,
      "Total": Number(sale.total_amount),
    })) || []

    // Detailed items sheet
    const detailRows: any[] = []
    sales?.forEach((sale: any) => {
      sale.sale_items?.forEach((item: any) => {
        detailRows.push({
          "Nº Venta": sale.sale_number || sale.id.slice(0, 8),
          "Fecha": new Date(sale.created_at).toLocaleDateString("es-AR"),
          "Kiosco": sale.kioscos?.name || "-",
          "Producto": item.products?.name || "-",
          "Código": item.products?.barcode || "-",
          "Cantidad": item.quantity,
          "Precio Unit.": Number(item.unit_price),
          "Subtotal": Number(item.subtotal),
        })
      })
    })

    // Calculate totals
    const totalVentas = summaryRows.reduce((sum, r) => sum + r.Total, 0)
    const totalItems = detailRows.reduce((sum, r) => sum + r.Cantidad, 0)

    // Create workbook
    const wb = XLSX.utils.book_new()

    // Summary sheet
    const wsSummary = XLSX.utils.json_to_sheet(summaryRows)
    
    // Add totals row
    XLSX.utils.sheet_add_aoa(wsSummary, [
      ["", "", "", "", "", "TOTAL:", summaryRows.length, totalVentas]
    ], { origin: -1 })
    
    // Set column widths
    wsSummary["!cols"] = [
      { wch: 12 }, // Nº Venta
      { wch: 12 }, // Fecha
      { wch: 8 },  // Hora
      { wch: 20 }, // Kiosco
      { wch: 20 }, // Empleado
      { wch: 15 }, // Medio de Pago
      { wch: 12 }, // Cant. Items
      { wch: 15 }, // Total
    ]
    
    XLSX.utils.book_append_sheet(wb, wsSummary, "Resumen Ventas")

    // Details sheet
    if (detailRows.length > 0) {
      const wsDetails = XLSX.utils.json_to_sheet(detailRows)
      wsDetails["!cols"] = [
        { wch: 12 }, // Nº Venta
        { wch: 12 }, // Fecha
        { wch: 20 }, // Kiosco
        { wch: 30 }, // Producto
        { wch: 15 }, // Código
        { wch: 10 }, // Cantidad
        { wch: 12 }, // Precio Unit.
        { wch: 12 }, // Subtotal
      ]
      XLSX.utils.book_append_sheet(wb, wsDetails, "Detalle Items")
    }

    // Generate file
    const dateStr = from || new Date().toISOString().split("T")[0]
    const filename = `ventas_${dateStr}${to ? `_a_${to}` : ""}`

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
    console.error("[Export Sales] Error:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

function formatPaymentMethod(method: string | null): string {
  const methods: Record<string, string> = {
    efectivo: "Efectivo",
    cash: "Efectivo",
    tarjeta: "Tarjeta",
    card: "Tarjeta",
    debito: "Débito",
    debit: "Débito",
    credito: "Crédito",
    credit: "Crédito",
    mercadopago: "MercadoPago",
    mp: "MercadoPago",
    transferencia: "Transferencia",
    transfer: "Transferencia",
    qr: "QR",
    mixto: "Mixto",
    mixed: "Mixto",
  }
  return methods[method?.toLowerCase() || ""] || method || "-"
}
