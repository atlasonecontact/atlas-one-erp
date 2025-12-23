import type React from "react"
import { Button } from "@/components/ui/button"
import { Check, Star } from "lucide-react"

export function StatCard({ number, label }: { number: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 mb-1">
        {number}
      </div>
      <div className="text-sm text-gray-400">{label}</div>
    </div>
  )
}

export function FeatureCard({
  icon,
  title,
  description,
  gradient,
}: {
  icon: React.ReactNode
  title: string
  description: string
  gradient: string
}) {
  return (
    <div
      className={`group relative rounded-2xl border border-white/5 bg-gradient-to-br ${gradient} p-6 hover:border-white/10 transition-all duration-300`}
    >
      <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-4 text-cyan-400 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-400 leading-relaxed">{description}</p>
    </div>
  )
}

export function StepCard({
  number,
  title,
  description,
  icon,
}: {
  number: string
  title: string
  description: string
  icon: React.ReactNode
}) {
  return (
    <div className="relative">
      <div className="text-7xl font-bold text-white/5 absolute -top-4 -left-2">{number}</div>
      <div className="relative pt-8">
        <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-4 text-cyan-400">
          {icon}
        </div>
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-gray-400 leading-relaxed">{description}</p>
      </div>
    </div>
  )
}

export function PricingCard({
  name,
  price,
  period,
  description,
  features,
  popular,
}: {
  name: string
  price: string
  period: string
  description: string
  features: string[]
  popular?: boolean
}) {
  return (
    <div
      className={`relative rounded-2xl border ${popular ? "border-cyan-500/50 bg-gradient-to-b from-cyan-500/10 to-transparent" : "border-white/10 bg-white/[0.02]"} p-8`}
    >
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-cyan-500 text-black text-xs font-medium">
          Más Popular
        </div>
      )}
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-1">{name}</h3>
        <p className="text-sm text-gray-400">{description}</p>
      </div>
      <div className="mb-6">
        <span className="text-4xl font-bold">{price}</span>
        <span className="text-gray-400">/{period}</span>
      </div>
      <ul className="space-y-3 mb-8">
        {features.map((feature, i) => (
          <li key={i} className="flex items-center gap-3">
            <Check className="w-5 h-5 text-cyan-400 shrink-0" />
            <span className="text-gray-300">{feature}</span>
          </li>
        ))}
      </ul>
      <Button disabled className="w-full bg-gray-600 hover:bg-gray-600 text-gray-300 cursor-not-allowed">
        Próximamente
      </Button>
    </div>
  )
}

export function TestimonialCard({
  quote,
  author,
  role,
  rating,
}: {
  quote: string
  author: string
  role: string
  rating: number
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
      <div className="flex items-center gap-1 mb-4">
        {Array.from({ length: rating }).map((_, i) => (
          <Star key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
        ))}
      </div>
      <p className="text-gray-300 mb-6 leading-relaxed">{`"${quote}"`}</p>
      <div>
        <p className="font-semibold">{author}</p>
        <p className="text-sm text-gray-400">{role}</p>
      </div>
    </div>
  )
}
