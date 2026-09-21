export function formatCurrency(amount: number): string {
  const value = Number.isFinite(amount) ? amount : 0
  return `$${value.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
