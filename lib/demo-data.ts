// Demo data for the Atlas One ERP

export const demoProducts = [
  { id: 1, name: "Gaseosa Cola 500ml", category: "Bebidas", cost: 150, price: 250, stock: 85, status: "active" },
  { id: 2, name: "Gaseosa Sprite 500ml", category: "Bebidas", cost: 150, price: 250, stock: 62, status: "active" },
  { id: 3, name: "Agua Mineral 500ml", category: "Bebidas", cost: 80, price: 150, stock: 120, status: "active" },
  {
    id: 4,
    name: "Cerveza Quilmes 1L",
    category: "Bebidas Alcohólicas",
    cost: 450,
    price: 750,
    stock: 45,
    status: "active",
  },
  { id: 5, name: "Papas Fritas Lays", category: "Snacks", cost: 200, price: 350, stock: 38, status: "active" },
  { id: 6, name: "Chocolate Milka", category: "Golosinas", cost: 250, price: 420, stock: 25, status: "active" },
  { id: 7, name: "Cigarrillos Marlboro", category: "Cigarrillos", cost: 800, price: 1200, stock: 8, status: "low" },
  { id: 8, name: "Energizante Red Bull", category: "Energizantes", cost: 400, price: 650, stock: 15, status: "active" },
  { id: 9, name: "Galletitas Oreo", category: "Golosinas", cost: 180, price: 300, stock: 42, status: "active" },
  { id: 10, name: "Pan Lactal Bimbo", category: "Panadería", cost: 350, price: 550, stock: 12, status: "active" },
  { id: 11, name: "Leche La Serenísima 1L", category: "Lácteos", cost: 280, price: 450, stock: 5, status: "low" },
  { id: 12, name: "Yogur Activia", category: "Lácteos", cost: 200, price: 350, stock: 18, status: "active" },
]

export const demoSales = [
  { id: 1, date: "2025-01-18 09:15", items: 3, total: 1250, method: "Efectivo", status: "completed" },
  { id: 2, date: "2025-01-18 09:32", items: 5, total: 2100, method: "Tarjeta", status: "completed" },
  { id: 3, date: "2025-01-18 10:05", items: 2, total: 850, method: "Efectivo", status: "completed" },
  { id: 4, date: "2025-01-18 10:45", items: 8, total: 4500, method: "QR", status: "completed" },
  { id: 5, date: "2025-01-18 11:20", items: 1, total: 750, method: "Efectivo", status: "completed" },
  { id: 6, date: "2025-01-18 12:00", items: 4, total: 1800, method: "Tarjeta", status: "completed" },
  { id: 7, date: "2025-01-18 12:30", items: 6, total: 3200, method: "Efectivo", status: "completed" },
  { id: 8, date: "2025-01-18 13:15", items: 2, total: 950, method: "QR", status: "completed" },
]

export const demoEmployees = [
  { id: 1, name: "Germán López", role: "Admin", sales: 245, status: "active", email: "german@atlasone.com" },
  { id: 2, name: "María García", role: "Cajero", sales: 189, status: "active", email: "maria@atlasone.com" },
  { id: 3, name: "Carlos Rodríguez", role: "Cajero", sales: 156, status: "active", email: "carlos@atlasone.com" },
  { id: 4, name: "Ana Martínez", role: "Supervisor", sales: 98, status: "inactive", email: "ana@atlasone.com" },
]

export const demoInventoryMovements = [
  { id: 1, date: "2025-01-18", product: "Gaseosa Cola 500ml", type: "IN", quantity: 50, reason: "Compra proveedor" },
  { id: 2, date: "2025-01-18", product: "Papas Fritas Lays", type: "OUT", quantity: 12, reason: "Venta" },
  { id: 3, date: "2025-01-17", product: "Cigarrillos Marlboro", type: "OUT", quantity: 20, reason: "Venta" },
  { id: 4, date: "2025-01-17", product: "Agua Mineral 500ml", type: "IN", quantity: 100, reason: "Compra proveedor" },
  { id: 5, date: "2025-01-16", product: "Chocolate Milka", type: "OUT", quantity: 8, reason: "Venta" },
]

export const demoPurchases = [
  { id: 1, supplier: "Coca-Cola", date: "2025-01-18", total: 15000, status: "completed" },
  { id: 2, supplier: "Pepsico", date: "2025-01-17", total: 8500, status: "completed" },
  { id: 3, supplier: "Mondelez", date: "2025-01-15", total: 12000, status: "pending" },
  { id: 4, supplier: "Philip Morris", date: "2025-01-14", total: 25000, status: "completed" },
]

export const salesByDay = [
  { day: "Lun", sales: 12500 },
  { day: "Mar", sales: 14200 },
  { day: "Mié", sales: 11800 },
  { day: "Jue", sales: 15600 },
  { day: "Vie", sales: 18900 },
  { day: "Sáb", sales: 22100 },
  { day: "Dom", sales: 16800 },
]

export const salesEvolution = [
  { date: "1 Mar", value: 8500 },
  { date: "5 Mar", value: 9200 },
  { date: "10 Mar", value: 8800 },
  { date: "15 Mar", value: 11500 },
  { date: "20 Mar", value: 10200 },
  { date: "25 Mar", value: 13800 },
  { date: "30 Mar", value: 15200 },
]

export const topProducts = [
  { name: "Gaseosa Cola", sales: 85, percentage: 100 },
  { name: "Snacks", sales: 68, percentage: 80 },
  { name: "Galletitas", sales: 52, percentage: 61 },
  { name: "Cigarrillos", sales: 45, percentage: 53 },
  { name: "Energizantes", sales: 32, percentage: 38 },
]

export const stockCategories = [
  { category: "Bebidas frías", stock: 267, rotation: "Rápido" },
  { category: "Bebidas alcohólicas", stock: 145, rotation: "Normal" },
  { category: "Golosinas", stock: 189, rotation: "Lento" },
  { category: "Snacks", stock: 98, rotation: "Rápido" },
  { category: "Cigarrillos", stock: 45, rotation: "Normal" },
  { category: "Energizantes", stock: 78, rotation: "Normal" },
  { category: "Lácteos", stock: 56, rotation: "Rápido" },
]

export const hourlyHeatmap = [
  [1, 2, 3, 4, 5],
  [2, 4, 5, 3, 2],
  [3, 5, 4, 4, 3],
  [4, 3, 2, 5, 4],
]

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(value)
}
