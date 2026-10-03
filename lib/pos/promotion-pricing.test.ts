import { describe, it, expect } from "vitest"
import { prorateComponents } from "./promotion-pricing"

const sum = (parts: { quantity: number; unitPrice: number }[]) => parts.reduce((a, p) => a + p.unitPrice * p.quantity, 0)

describe("prorateComponents", () => {
  it("el total prorrateado coincide con el precio de la promo (combo de 2 productos)", () => {
    // "2 Cocas + 1 Fernet" a $1000, cuando sueltos costarían 2*500 + 1*1000 = $2000.
    const parts = prorateComponents(
      [
        { productId: "coca", productName: "Coca", quantity: 2, price: 500 },
        { productId: "fernet", productName: "Fernet", quantity: 1, price: 1000 },
      ],
      1000,
    )
    expect(sum(parts)).toBeCloseTo(1000, 6)
  })

  it("reparte proporcional al peso de cada componente en el precio normal", () => {
    // Fernet pesa el doble que una Coca en el precio normal (1000 vs 500), así que
    // en la promo también se lleva el doble de la torta.
    const parts = prorateComponents(
      [
        { productId: "coca", productName: "Coca", quantity: 1, price: 500 },
        { productId: "fernet", productName: "Fernet", quantity: 1, price: 1000 },
      ],
      900,
    )
    const coca = parts.find((p) => p.productId === "coca")!
    const fernet = parts.find((p) => p.productId === "fernet")!
    expect(fernet.unitPrice).toBeCloseTo(coca.unitPrice * 2, 6)
    expect(sum(parts)).toBeCloseTo(900, 6)
  })

  it("regresión: bebida a elección (componente fijo + la bebida elegida) también cierra la cuenta", () => {
    // Mismo caso que handleChoiceSelected: un componente fijo (Yogur) + la bebida que
    // el cajero eligió en el momento (Coca), para una promo de $800.
    const parts = prorateComponents(
      [
        { productId: "yogur", productName: "Yogur", quantity: 1, price: 600 },
        { productId: "coca-elegida", productName: "Coca", quantity: 1, price: 500 },
      ],
      800,
    )
    expect(sum(parts)).toBeCloseTo(800, 6)
  })

  it("si el precio normal suma 0 (productos sin costo/precio cargado), reparte en partes iguales", () => {
    const parts = prorateComponents(
      [
        { productId: "a", productName: "A", quantity: 1, price: 0 },
        { productId: "b", productName: "B", quantity: 1, price: 0 },
      ],
      1000,
    )
    expect(parts[0].unitPrice).toBeCloseTo(500, 6)
    expect(parts[1].unitPrice).toBeCloseTo(500, 6)
    expect(sum(parts)).toBeCloseTo(1000, 6)
  })

  it("respeta la cantidad de cada componente (2 unidades no deberían duplicar el reparto)", () => {
    const parts = prorateComponents([{ productId: "coca", productName: "Coca", quantity: 2, price: 500 }], 1200)
    expect(sum(parts)).toBeCloseTo(1200, 6)
    expect(parts[0].unitPrice * 2).toBeCloseTo(1200, 6)
  })
})
