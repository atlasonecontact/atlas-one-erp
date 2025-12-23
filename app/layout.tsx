import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "ATLAS ONE - ERP Inteligente para Kioscos",
  description:
    "Sistema de gestión integral para kioscos y minimarkets. Controla ventas, inventario, empleados y múltiples sucursales desde una única plataforma con notificaciones inteligentes.",
  keywords: ["ERP", "kioscos", "punto de venta", "inventario", "gestión de sucursales", "atlas one"],
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className={`font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
