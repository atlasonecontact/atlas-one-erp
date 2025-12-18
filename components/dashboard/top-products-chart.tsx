const products = [
  { name: "Gaseosa Cola", percentage: 100 },
  { name: "Snacks", percentage: 80 },
  { name: "Galletitas", percentage: 61 },
  { name: "Cigarrillos", percentage: 53 },
]

export function TopProductsChart() {
  return (
    <div className="rounded-xl border border-cyan-500/10 bg-[#0a0f1a] p-5">
      <h3 className="text-sm font-medium text-white mb-4">Ranking de productos</h3>

      <div className="space-y-4">
        {products.map((product, i) => (
          <div key={i} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">{product.name}</span>
              <span className="text-cyan-400 font-medium">{product.percentage}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-cyan-400 transition-all duration-500"
                style={{ width: `${product.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
