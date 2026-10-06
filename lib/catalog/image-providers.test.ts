import { describe, it, expect } from "vitest"
import { nameSimilarity, decideConfidence, type ImageCandidate } from "./image-providers"

describe("nameSimilarity", () => {
  it("nombres idénticos dan 1", () => {
    expect(nameSimilarity("Coca-Cola Original 500 ml", "Coca-Cola Original 500 ml")).toBe(1)
  })

  it("ignora mayúsculas, acentos y signos de puntuación", () => {
    expect(nameSimilarity("Coca Cola Original", "COCA-COLA, ORIGINAL")).toBe(1)
  })

  it("nombres sin ninguna palabra en común dan 0", () => {
    expect(nameSimilarity("Sprite Lima Limón", "Café La Virginia")).toBe(0)
  })

  it("coincidencia parcial da un valor intermedio", () => {
    const sim = nameSimilarity("Coca-Cola Original 500 ml", "Coca-Cola Zero 500 ml")
    expect(sim).toBeGreaterThan(0)
    expect(sim).toBeLessThan(1)
  })

  it("devuelve 0 si alguno de los nombres está vacío", () => {
    expect(nameSimilarity("", "Coca-Cola")).toBe(0)
    expect(nameSimilarity("Coca-Cola", "")).toBe(0)
  })
})

describe("decideConfidence", () => {
  const offCandidate: ImageCandidate = {
    imageUrl: "https://example.com/coca.jpg",
    source: "openfoodfacts",
    offName: "Coca-Cola Original 500 ml",
  }

  it("Open Food Facts + nombre similar: aprueba automático con confianza alta", () => {
    const result = decideConfidence(offCandidate, "Coca Cola Original 500ml")
    expect(result.autoApprove).toBe(true)
    expect(result.confidence).toBeGreaterThanOrEqual(90)
  })

  it("Open Food Facts + nombre distinto: no aprueba, va a revisión", () => {
    const result = decideConfidence(offCandidate, "Alfajor Jorgito Triple")
    expect(result.autoApprove).toBe(false)
    expect(result.confidence).toBeLessThan(90)
  })

  it("UPCItemDB + nombre similar: aprueba, pero con menos confianza que Open Food Facts", () => {
    const upcCandidate: ImageCandidate = {
      imageUrl: "https://example.com/pepsi.jpg",
      source: "upcitemdb",
      offName: "Pepsi Black 354ml",
    }
    const result = decideConfidence(upcCandidate, "Pepsi Black 354 ml")
    expect(result.autoApprove).toBe(true)
    expect(result.confidence).toBeLessThan(90)
  })

  it("sin nombre de la fuente (offName ausente): nunca aprueba automático", () => {
    const candidate: ImageCandidate = { imageUrl: "https://example.com/x.jpg", source: "openfoodfacts" }
    const result = decideConfidence(candidate, "Coca-Cola Original 500 ml")
    expect(result.autoApprove).toBe(false)
  })
})
