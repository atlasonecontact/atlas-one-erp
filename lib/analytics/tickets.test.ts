import { describe, it, expect } from "vitest"
import { shiftOf, shiftFromLabel, applyFilters, pct, moneyTick, OWNER_LABEL, type Ticket } from "./tickets"

// Fábrica mínima de un ticket de prueba: sólo pisa los campos que cada test necesita,
// así cada caso queda corto y se ve qué es lo que realmente se está probando.
function makeTicket(overrides: Partial<Ticket> = {}): Ticket {
  return {
    id: "t1",
    number: "0001",
    branchId: "b1",
    branch: "Sucursal 1",
    sellerId: null,
    seller: OWNER_LABEL,
    payment: "cash",
    createdAt: "2026-01-01T12:00:00Z",
    day: "2026-01-01",
    hour: 12,
    weekday: 4,
    shift: "afternoon",
    shiftFromRegister: false,
    invoice: null,
    total: 1000,
    units: 1,
    cost: 500,
    items: [{ productId: "p1", name: "Agua", category: "Bebidas", quantity: 1, unitPrice: 1000, subtotal: 1000, cost: 500, costKnown: true }],
    ...overrides,
  }
}

describe("shiftOf", () => {
  it("clasifica la mañana (6 a 13)", () => {
    expect(shiftOf(6)).toBe("morning")
    expect(shiftOf(13)).toBe("morning")
  })
  it("clasifica la tarde (14 a 21)", () => {
    expect(shiftOf(14)).toBe("afternoon")
    expect(shiftOf(21)).toBe("afternoon")
  })
  it("clasifica la noche (22 a 5), cruzando medianoche", () => {
    expect(shiftOf(22)).toBe("night")
    expect(shiftOf(0)).toBe("night")
    expect(shiftOf(5)).toBe("night")
  })
})

describe("shiftFromLabel", () => {
  it("reconoce las etiquetas en español con y sin tilde", () => {
    expect(shiftFromLabel("Mañana")).toBe("morning")
    expect(shiftFromLabel("manana")).toBe("morning")
    expect(shiftFromLabel("Tarde")).toBe("afternoon")
    expect(shiftFromLabel("Noche")).toBe("night")
  })
  it("devuelve null para una etiqueta desconocida o vacía", () => {
    expect(shiftFromLabel("")).toBeNull()
    expect(shiftFromLabel(null)).toBeNull()
    expect(shiftFromLabel(undefined)).toBeNull()
    expect(shiftFromLabel("Madrugada")).toBeNull()
  })
})

describe("applyFilters", () => {
  const tickets = [
    makeTicket({ id: "t1", branchId: "b1", sellerId: "e1", seller: "Juana", payment: "cash", hour: 10, shift: "morning" }),
    makeTicket({ id: "t2", branchId: "b2", sellerId: null, seller: OWNER_LABEL, payment: "card", hour: 20, shift: "afternoon" }),
  ]

  it("sin filtros devuelve todo", () => {
    expect(applyFilters(tickets, {})).toHaveLength(2)
  })

  it("filtra por sucursal", () => {
    const out = applyFilters(tickets, { branch: "b1" })
    expect(out.map((t) => t.id)).toEqual(["t1"])
  })

  it('filtra por vendedor "none" = ventas del dueño (sellerId null)', () => {
    const out = applyFilters(tickets, { seller: "none" })
    expect(out.map((t) => t.id)).toEqual(["t2"])
  })

  it("filtra por vendedor empleado específico", () => {
    const out = applyFilters(tickets, { seller: "e1" })
    expect(out.map((t) => t.id)).toEqual(["t1"])
  })

  it("filtra por método de pago", () => {
    const out = applyFilters(tickets, { paymentMethod: "card" })
    expect(out.map((t) => t.id)).toEqual(["t2"])
  })

  it("filtra por turno", () => {
    const out = applyFilters(tickets, { shift: "morning" })
    expect(out.map((t) => t.id)).toEqual(["t1"])
  })

  it("franja horaria normal (no cruza medianoche)", () => {
    const out = applyFilters(tickets, { hourRange: { from: 9, to: 11 } })
    expect(out.map((t) => t.id)).toEqual(["t1"])
  })

  it("franja horaria que cruza medianoche (ej: 22 a 6)", () => {
    const nightTicket = makeTicket({ id: "t3", hour: 2 })
    const out = applyFilters([...tickets, nightTicket], { hourRange: { from: 22, to: 6 } })
    expect(out.map((t) => t.id)).toEqual(["t3"])
  })

  it("categoría: recorta el ticket a sólo esa categoría y recalcula el total", () => {
    const mixed = makeTicket({
      id: "t4",
      total: 1500,
      units: 2,
      cost: 700,
      items: [
        { productId: "p1", name: "Agua", category: "Bebidas", quantity: 1, unitPrice: 1000, subtotal: 1000, cost: 500, costKnown: true },
        { productId: "p2", name: "Alfajor", category: "Golosinas", quantity: 1, unitPrice: 500, subtotal: 500, cost: 200, costKnown: true },
      ],
    })
    const out = applyFilters([mixed], { category: "Bebidas" })
    expect(out).toHaveLength(1)
    expect(out[0].total).toBe(1000)
    expect(out[0].units).toBe(1)
    expect(out[0].items).toHaveLength(1)
  })

  it("categoría: descarta el ticket entero si no tiene nada de esa categoría", () => {
    const out = applyFilters(tickets, { category: "Golosinas" })
    expect(out).toHaveLength(0)
  })
})

describe("pct", () => {
  it("calcula el cambio porcentual normal", () => {
    expect(pct(120, 100)).toBe(20)
    expect(pct(80, 100)).toBe(-20)
  })
  it("devuelve undefined si la base es 0 (no hay con qué comparar)", () => {
    expect(pct(100, 0)).toBeUndefined()
  })
})

describe("moneyTick", () => {
  it("abrevia miles con k", () => {
    expect(moneyTick(2500)).toBe("$2.5k")
    expect(moneyTick(3000)).toBe("$3k")
  })
  it("no abrevia por debajo de mil", () => {
    expect(moneyTick(850)).toBe("$850")
  })
})
