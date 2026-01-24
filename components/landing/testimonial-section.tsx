"use client"

import { Star } from "lucide-react"

interface TestimonialCardProps {
  quote: string
  author: string
  role: string
  rating: number
}

function TestimonialCard({ quote, author, role, rating }: TestimonialCardProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 hover:border-cyan-500/30 transition-all duration-300 group">
      <div className="flex gap-1 mb-4">
        {Array.from({ length: rating }).map((_, i) => (
          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
        ))}
      </div>
      <p className="text-gray-300 mb-6 leading-relaxed text-balance">{quote}</p>
      <div>
        <div className="font-semibold text-white group-hover:text-cyan-400 transition-colors">{author}</div>
        <div className="text-sm text-gray-500">{role}</div>
      </div>
    </div>
  )
}

export default function TestimonialSection() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-balance">
            Diseñado para <span className="text-cyan-400">dueños como vos</span>
          </h2>
          <p className="text-lg text-gray-400 text-pretty">
            Funcionalidades pensadas para el día a día del comercio minorista
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <TestimonialCard
            quote="Gestión centralizada de múltiples sucursales sin tener que estar físicamente en cada una. Todo sincronizado en tiempo real."
            author="Control Total"
            role="Multi-sucursal"
            rating={5}
          />
          <TestimonialCard
            quote="Las notificaciones de WhatsApp permiten saber exactamente qué vende cada empleado sin estar físicamente en la sucursal."
            author="Visibilidad 24/7"
            role="Notificaciones"
            rating={5}
          />
          <TestimonialCard
            quote="El bot de Telegram permite consultar ventas del día con un simple comando desde el celular. Super práctico y rápido."
            author="Acceso Móvil"
            role="Bot Telegram"
            rating={5}
          />
        </div>
      </div>
    </section>
  )
}
