import { describe, expect, it } from "vitest"
import { filterLowStock } from "./low-stock"

describe("filterLowStock", () => {
  it("incluye un producto en 0 aunque no esté primero en la lista", () => {
    const products = [
      { id: "a", stock_quantity: 50, min_stock_level: 10 },
      { id: "b", stock_quantity: 0, min_stock_level: 10 },
    ]
    const result = filterLowStock(products, 5)
    expect(result.map((p) => p.id)).toContain("b")
  })

  it("usa el min_stock_level propio de cada producto, no un umbral fijo", () => {
    const products = [
      { id: "low-threshold", stock_quantity: 8, min_stock_level: 5 }, // 8 > 5: no es bajo
      { id: "high-threshold", stock_quantity: 8, min_stock_level: 20 }, // 8 <= 20: sí es bajo
    ]
    const result = filterLowStock(products, 5).map((p) => p.id)
    expect(result).not.toContain("low-threshold")
    expect(result).toContain("high-threshold")
  })

  it("usa 10 como default cuando min_stock_level es null o no está definido", () => {
    const products = [
      { id: "null-threshold", stock_quantity: 10, min_stock_level: null },
      { id: "undefined-threshold", stock_quantity: 11, min_stock_level: undefined },
    ]
    const result = filterLowStock(products, 5).map((p) => p.id)
    expect(result).toContain("null-threshold")
    expect(result).not.toContain("undefined-threshold")
  })

  it("excluye productos con stock por encima de su umbral", () => {
    const products = [{ id: "ok", stock_quantity: 100, min_stock_level: 10 }]
    expect(filterLowStock(products, 5)).toHaveLength(0)
  })

  it("respeta el límite", () => {
    const products = Array.from({ length: 10 }, (_, i) => ({
      id: `p${i}`,
      stock_quantity: 0,
      min_stock_level: 10,
    }))
    expect(filterLowStock(products, 3)).toHaveLength(3)
  })
})
