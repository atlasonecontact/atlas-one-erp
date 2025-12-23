import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: {
    default: "Atlas One - ERP para Cadenas de Kioscos",
    template: "%s | Atlas One",
  },
  description:
    "Sistema de gestión integral para cadenas de kioscos y minimarkets. Controla ventas, inventario, empleados y múltiples sucursales con notificaciones en WhatsApp y Telegram.",
  keywords: [
    "ERP kioscos",
    "sistema punto de venta",
    "gestión de sucursales",
    "inventario kioscos",
    "software minimarket",
    "control de ventas",
    "gestión de empleados",
    "notificaciones WhatsApp",
    "bot Telegram ventas",
    "atlas one",
    "POS Argentina",
  ],
  authors: [{ name: "Atlas One", url: "https://atlasone.com.ar" }],
  creator: "Atlas One",
  publisher: "Atlas One",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: "https://atlasone.com.ar",
    siteName: "Atlas One",
    title: "Atlas One - ERP para Cadenas de Kioscos",
    description:
      "Gestiona todas tus sucursales desde una sola plataforma. Ventas, inventario, empleados y notificaciones inteligentes.",
    images: [
      {
        url: "/images/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Atlas One - Sistema de gestión para kioscos",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Atlas One - ERP para Cadenas de Kioscos",
    description:
      "Gestiona todas tus sucursales desde una sola plataforma. Ventas, inventario, empleados y notificaciones inteligentes.",
    images: ["/images/og-image.jpg"],
    creator: "@atlasone_ar",
  },
  icons: {
    icon: [
      { url: "/images/logo-atlas.png", type: "image/png" },
      { url: "/icon-dark-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/images/logo-atlas.png", sizes: "180x180", type: "image/png" }],
    shortcut: "/images/logo-atlas.png",
  },
  manifest: "/manifest.json",
  alternates: {
    canonical: "https://atlasone.com.ar",
  },
  category: "business",
    generator: 'v0.app'
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0f1e" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" href="/images/logo-atlas.png" type="image/png" />
        <link rel="shortcut icon" href="/images/logo-atlas.png" type="image/png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="canonical" href="https://atlasone.com.ar" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Atlas One" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#0a0f1e" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
      </head>
      <body className={`font-sans antialiased`}>
        {children}
        <Analytics />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
      </body>
    </html>
  )
}
