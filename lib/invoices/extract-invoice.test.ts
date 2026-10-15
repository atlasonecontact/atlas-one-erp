import { describe, expect, it } from "vitest"
import { parseExtractionResponse } from "./extract-invoice"

describe("parseExtractionResponse", () => {
  it("parsea un JSON limpio con todos los campos", () => {
    const result = parseExtractionResponse(
      JSON.stringify({
        supplier_name: "Distribuidora Pérez",
        receipt_number: "A-0001-00001234",
        items: [{ name: "Coca Cola 2L", quantity: 6, unit_cost: 850.5 }],
      }),
    )
    expect(result.supplier_name).toBe("Distribuidora Pérez")
    expect(result.receipt_number).toBe("A-0001-00001234")
    expect(result.items).toEqual([{ name: "Coca Cola 2L", quantity: 6, unit_cost: 850.5 }])
  })

  it("sacar los fences de markdown si el modelo los agrega igual", () => {
    const result = parseExtractionResponse('```json\n{"supplier_name":null,"receipt_number":null,"items":[]}\n```')
    expect(result.items).toEqual([])
  })

  it("usa 1 como default cuando falta o es invalida la cantidad", () => {
    const result = parseExtractionResponse(JSON.stringify({ items: [{ name: "Alfajor", quantity: 0 }] }))
    expect(result.items[0].quantity).toBe(1)
  })

  it("usa null cuando no se puede leer el costo unitario", () => {
    const result = parseExtractionResponse(JSON.stringify({ items: [{ name: "Alfajor", quantity: 2, unit_cost: "ilegible" }] }))
    expect(result.items[0].unit_cost).toBeNull()
  })

  it("descarta items sin nombre", () => {
    const result = parseExtractionResponse(JSON.stringify({ items: [{ name: "", quantity: 1 }, { name: "Fideos", quantity: 1 }] }))
    expect(result.items).toHaveLength(1)
    expect(result.items[0].name).toBe("Fideos")
  })

  it("tira un error legible si no es JSON", () => {
    expect(() => parseExtractionResponse("esto no es json")).toThrow("JSON válido")
  })

  it("tira un error legible si falta items", () => {
    expect(() => parseExtractionResponse(JSON.stringify({ supplier_name: "X" }))).toThrow("forma inesperada")
  })
})
