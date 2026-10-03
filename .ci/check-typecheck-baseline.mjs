#!/usr/bin/env node
// Corre tsc --noEmit y compara la cantidad de errores contra un "piso" guardado en
// .ci/typecheck-baseline.txt. Falla sólo si aparecen errores NUEVOS por encima de ese
// piso — así el CI no se rompe por la deuda de tipos que ya existía (hoy el build de
// Vercel la ignora con ignoreBuildErrors), pero sí corta en seco si alguien suma un
// error de tipos nuevo en cualquier parte del proyecto.
//
// Si de verdad arreglaste parte del backlog y el número bajó, actualizá
// .ci/typecheck-baseline.txt al nuevo total (nunca lo subas a mano para "pasar" el check).
import { execSync } from "node:child_process"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import path from "node:path"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const baselinePath = path.join(__dirname, "typecheck-baseline.txt")
const baseline = Number.parseInt(readFileSync(baselinePath, "utf8").trim(), 10)

let output = ""
try {
  output = execSync("npx tsc --noEmit -p tsconfig.json", { cwd: path.join(__dirname, ".."), encoding: "utf8" })
} catch (err) {
  output = (err.stdout || "") + (err.stderr || "")
}

const errorLines = output.split("\n").filter((line) => /error TS\d+:/.test(line))
const current = errorLines.length

console.log(`Errores de tipos encontrados: ${current} (piso permitido: ${baseline})`)

if (current > baseline) {
  console.error(`\n❌ Hay ${current - baseline} error(es) de tipos NUEVO(S) respecto al piso guardado.`)
  console.error("Líneas de error:\n" + errorLines.join("\n"))
  process.exit(1)
}

if (current < baseline) {
  console.log(
    `✅ Bajaron los errores de tipos (${baseline} → ${current}). Actualizá .ci/typecheck-baseline.txt a ${current} para no perder esa mejora.`,
  )
}

console.log("✅ Sin errores de tipos nuevos.")
