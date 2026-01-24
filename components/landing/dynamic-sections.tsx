"use client"

import dynamic from "next/dynamic"

// Lazy load componentes pesados para mejorar el tiempo de carga inicial
const AnalyticsChart = dynamic(
  () => import("@/components/dashboard/analytics-chart").then((mod) => ({ default: mod.AnalyticsChart })),
  {
    loading: () => <div className="h-[300px] rounded-xl border border-cyan-500/10 bg-[#0a0f1a] animate-pulse" />,
    ssr: false,
  }
)

const CategoryMixChart = dynamic(
  () => import("@/components/dashboard/category-mix-chart").then((mod) => ({ default: mod.CategoryMixChart })),
  {
    loading: () => <div className="h-[300px] rounded-xl border border-cyan-500/10 bg-[#0a0f1a] animate-pulse" />,
    ssr: false,
  }
)

export const TestimonialSection = dynamic(() => import("@/components/landing/testimonial-section"), {
  ssr: false,
  loading: () => <div className="h-[400px]" />,
})

export const PricingSection = dynamic(() => import("@/components/landing/pricing-section"), {
  ssr: false,
  loading: () => <div className="h-[600px]" />,
})

// Export placeholder for analytics/category if needed elsewhere
export { AnalyticsChart, CategoryMixChart }
