import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const upc = request.nextUrl.searchParams.get("upc")
  if (!upc) {
    return NextResponse.json({ error: "Falta el parámetro upc" }, { status: 400 })
  }

  try {
    const res = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${encodeURIComponent(upc)}`, {
      headers: { Accept: "application/json" },
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ error: "No se pudo consultar UPCItemDB" }, { status: 502 })
  }
}
