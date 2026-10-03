import { describe, it, expect } from "vitest"
import { isSurchargeActiveNow, type SurchargeConfig } from "./surcharge-modal"

const at = (hh: number, mm: number) => new Date(2026, 0, 1, hh, mm, 0)

const base: SurchargeConfig = { enabled: true, percentage: 10, start_time: "22:00", end_time: "04:00" }

describe("isSurchargeActiveNow", () => {
  it("inactivo si enabled es false, sin importar la hora", () => {
    expect(isSurchargeActiveNow({ ...base, enabled: false }, at(23, 0))).toBe(false)
  })

  it("inactivo si no hay config (null)", () => {
    expect(isSurchargeActiveNow(null, at(23, 0))).toBe(false)
  })

  it("franja normal (no cruza medianoche): activo adentro, inactivo afuera", () => {
    const config: SurchargeConfig = { enabled: true, percentage: 15, start_time: "09:00", end_time: "18:00" }
    expect(isSurchargeActiveNow(config, at(12, 0))).toBe(true)
    expect(isSurchargeActiveNow(config, at(8, 59))).toBe(false)
    expect(isSurchargeActiveNow(config, at(18, 0))).toBe(false) // el fin es exclusivo
    expect(isSurchargeActiveNow(config, at(9, 0))).toBe(true) // el inicio es inclusivo
  })

  it("franja que cruza medianoche (22:00 a 04:00): activo de noche y la madrugada siguiente", () => {
    expect(isSurchargeActiveNow(base, at(23, 30))).toBe(true)
    expect(isSurchargeActiveNow(base, at(0, 0))).toBe(true)
    expect(isSurchargeActiveNow(base, at(3, 59))).toBe(true)
    expect(isSurchargeActiveNow(base, at(22, 0))).toBe(true) // el inicio es inclusivo
  })

  it("franja que cruza medianoche: inactivo durante el día", () => {
    expect(isSurchargeActiveNow(base, at(4, 0))).toBe(false) // el fin es exclusivo
    expect(isSurchargeActiveNow(base, at(12, 0))).toBe(false)
    expect(isSurchargeActiveNow(base, at(21, 59))).toBe(false)
  })

  it("si desde y hasta son iguales, nunca está activo (franja de largo cero)", () => {
    const config: SurchargeConfig = { enabled: true, percentage: 10, start_time: "10:00", end_time: "10:00" }
    expect(isSurchargeActiveNow(config, at(10, 0))).toBe(false)
    expect(isSurchargeActiveNow(config, at(15, 0))).toBe(false)
  })
})
