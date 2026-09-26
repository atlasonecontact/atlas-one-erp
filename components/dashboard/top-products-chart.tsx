import { ChartCard, colorAt } from "@/components/charts/chart-theme"

const products = [
  { name: "Gaseosa Cola", percentage: 100 },
  { name: "Snacks", percentage: 80 },
  { name: "Galletitas", percentage: 61 },
  { name: "Cigarrillos", percentage: 53 },
]

export function TopProductsChart() {
  return (
    <ChartCard title="Ranking de productos" subtitle="Ventas relativas al más vendido">
      <div className="space-y-5">
        {products.map((product, i) => (
          <div key={i} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-slate-300">
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-white/5 text-[11px] text-slate-400">
                  {i + 1}
                </span>
                {product.name}
              </span>
              <span className="font-semibold text-white">{product.percentage}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${product.percentage}%`,
                  background: `linear-gradient(90deg, ${colorAt(i)}66, ${colorAt(i)})`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </ChartCard>
  )
}
