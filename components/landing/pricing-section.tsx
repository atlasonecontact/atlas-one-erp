"use client"

import { Check, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface PricingCardProps {
  name: string
  price: string
  period: string
  description: string
  features: string[]
  popular?: boolean
}

function PricingCard({ name, price, period, description, features, popular }: PricingCardProps) {
  return (
    <div
      className={`rounded-2xl border p-8 relative transition-all duration-300 hover:scale-[1.02] ${
        popular
          ? "border-cyan-500 bg-gradient-to-b from-cyan-500/5 to-transparent"
          : "border-white/10 bg-white/[0.02] hover:border-cyan-500/30"
      }`}
    >
      {popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 text-black text-xs font-semibold flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          Más popular
        </div>
      )}

      <div className="mb-6">
        <div className="text-sm font-medium text-cyan-400 mb-2">{name}</div>
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-4xl font-bold text-white">{price}</span>
          <span className="text-gray-500">/ {period}</span>
        </div>
        <p className="text-sm text-gray-400">{description}</p>
      </div>

      <Link href="/register">
        <Button
          className={`w-full mb-6 ${
            popular
              ? "bg-cyan-500 hover:bg-cyan-400 text-black font-semibold"
              : "bg-white/5 hover:bg-white/10 text-white border border-white/10"
          }`}
        >
          Comenzar ahora
        </Button>
      </Link>

      <ul className="space-y-3">
        {features.map((feature, i) => (
          <li key={i} className="flex items-start gap-3 text-sm">
            <div className="mt-0.5 w-5 h-5 rounded-full bg-cyan-500/10 flex items-center justify-center shrink-0">
              <Check className="w-3 h-3 text-cyan-400" />
            </div>
            <span className="text-gray-300">{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function PricingSection() {
  return (
    <section
      id="pricing"
      className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-balance">
            Planes que <span className="text-cyan-400">crecen contigo</span>
          </h2>
          <p className="text-lg text-gray-400 text-pretty">Comienza gratis. Escala cuando lo necesites. Sin sorpresas.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <PricingCard
            name="Básico"
            price="Gratis"
            period="siempre"
            description="Perfecto para empezar"
            features={["1 kiosco", "2 empleados", "50 productos", "Reportes básicos", "Soporte por email"]}
          />
          <PricingCard
            name="Profesional"
            price="$29.99"
            period="mes"
            description="Para negocios en crecimiento"
            features={[
              "Hasta 5 kioscos",
              "10 empleados por kiosco",
              "500 productos",
              "Reportes avanzados",
              "WhatsApp + Telegram",
              "Bots de mensajería",
              "Soporte prioritario",
            ]}
            popular
          />
          <PricingCard
            name="Empresarial"
            price="$99.99"
            period="mes"
            description="Para cadenas grandes"
            features={[
              "Kioscos ilimitados",
              "50 empleados por kiosco",
              "5000 productos",
              "Reportes premium + IA",
              "Todas las integraciones",
              "API personalizada",
              "Soporte 24/7 dedicado",
              "Onboarding personalizado",
            ]}
          />
        </div>
      </div>
    </section>
  )
}
