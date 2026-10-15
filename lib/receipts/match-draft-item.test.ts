import { describe, expect, it } from "vitest"
import { findUnmatchedDraftLineIndex } from "./match-draft-item"

describe("findUnmatchedDraftLineIndex", () => {
  it("matchea un nombre de producto contenido en el nombre de la factura", () => {
    const items = [{ product_id: null, product_name: "Coca Cola 2L Retornable x6" }]
    expect(findUnmatchedDraftLineIndex(items, "Coca Cola 2L")).toBe(0)
  })

  it("matchea ignorando acentos y mayúsculas", () => {
    const items = [{ product_id: null, product_name: "ALFAJOR TRIPLE" }]
    expect(findUnmatchedDraftLineIndex(items, "alfajor triple")).toBe(0)
  })

  it("nunca matchea una línea que ya tiene product_id", () => {
    const items = [{ product_id: "abc", product_name: "Coca Cola 2L" }]
    expect(findUnmatchedDraftLineIndex(items, "Coca Cola 2L")).toBe(-1)
  })

  it("no matchea nombres sin relación", () => {
    const items = [{ product_id: null, product_name: "Fideos Matarazzo 500g" }]
    expect(findUnmatchedDraftLineIndex(items, "Coca Cola 2L")).toBe(-1)
  })

  it("no matchea nombres demasiado cortos (evita falsos positivos)", () => {
    const items = [{ product_id: null, product_name: "A" }]
    expect(findUnmatchedDraftLineIndex(items, "Agua")).toBe(-1)
  })

  it("devuelve -1 con lista vacía", () => {
    expect(findUnmatchedDraftLineIndex([], "Coca Cola")).toBe(-1)
  })
})
