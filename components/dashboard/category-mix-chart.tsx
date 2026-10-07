"use client"

import { ChartCard, DonutChart } from "@/components/charts/chart-theme"

interface CategoryMixProps {
  data?: { name: string; value: number; color?: string }[]
  title?: string
  isLoading?: boolean
}

export function CategoryMixChart({ data = [], title = "Mix de Ventas por Categoría", isLoading = false }: CategoryMixProps) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-white/[0.07] bg-card p-6 h-full">
        <div className="mb-4 h-4 w-40 animate-pulse rounded bg-muted" />
        <div className="flex h-[200px] items-center justify-center">
          <div className="h-32 w-32 animate-pulse rounded-full bg-muted" />
        </div>
      </div>
    )
  }

  return (
    <ChartCard title={title} className="h-full">
      {data.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Todavía no hay ventas en este período.</p>
      ) : (
        <DonutChart
          data={data.map((d) => ({ name: d.name, value: d.value }))}
          valueFormatter={(v) => `${v}%`}
          centerLabel="Categorías"
          centerValue={String(data.length)}
          height={210}
        />
      )}
    </ChartCard>
  )
}
