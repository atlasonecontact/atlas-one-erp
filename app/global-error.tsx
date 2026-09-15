"use client"

import { useEffect } from "react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[v0] Global error:", error)
  }, [error])

  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          background: "#030712",
          color: "#fff",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div style={{ textAlign: "center", padding: 32, maxWidth: 420 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Algo salió mal</h2>
          <p style={{ color: "#9ca3af", marginBottom: 24, fontSize: 14 }}>
            Ocurrió un error inesperado. Reintentá o volvé al inicio.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={() => reset()}
              style={{
                background: "#06b6d4",
                color: "#000",
                fontWeight: 600,
                padding: "10px 24px",
                borderRadius: 6,
                border: "none",
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              Reintentar
            </button>
            <a
              href="/login"
              style={{
                color: "#22d3ee",
                border: "1px solid rgba(6,182,212,0.3)",
                fontWeight: 600,
                padding: "10px 24px",
                borderRadius: 6,
                fontSize: 14,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              Ir al login
            </a>
          </div>
        </div>
      </body>
    </html>
  )
}
