import { describe, it, expect } from "vitest"
import { findDuplicateByBarcode } from "./duplicates"

describe("findDuplicateByBarcode", () => {
  const products = [
    { id: "p1", barcode: "7790000000001" },
    { id: "p2", barcode: "7790000000002" },
    { id: "p3", barcode: null },
    { id: "p4", barcode: "" },
  ]

  it("regresión: detecta el duplicado real (bug de las dos Coca-Colas)", () => {
    const dup = findDuplicateByBarcode(products, "7790000000001")
    expect(dup?.id).toBe("p1")
  })

  it("no encuentra nada si el código no existe todavía", () => {
    expect(findDuplicateByBarcode(products, "9999999999999")).toBeUndefined()
  })

  it("código vacío o sin cargar nunca cuenta como duplicado", () => {
    expect(findDuplicateByBarcode(products, "")).toBeUndefined()
    expect(findDuplicateByBarcode(products, null)).toBeUndefined()
    expect(findDuplicateByBarcode(products, undefined)).toBeUndefined()
  })

  it("dos productos con barcode vacío entre sí no son 'duplicados'", () => {
    // p3 tiene barcode null y p4 tiene barcode "" — ninguno debe matchear al otro.
    expect(findDuplicateByBarcode(products, products[2].barcode)).toBeUndefined()
  })

  it("al editar, no se detecta a sí mismo como duplicado (currentId)", () => {
    expect(findDuplicateByBarcode(products, "7790000000001", "p1")).toBeUndefined()
  })

  it("al editar, sí detecta si OTRO producto ya tiene ese código", () => {
    const dup = findDuplicateByBarcode(products, "7790000000001", "p2")
    expect(dup?.id).toBe("p1")
  })

  it("ignora espacios en blanco alrededor del código", () => {
    const dup = findDuplicateByBarcode(products, "  7790000000001  ")
    expect(dup?.id).toBe("p1")
  })
})
