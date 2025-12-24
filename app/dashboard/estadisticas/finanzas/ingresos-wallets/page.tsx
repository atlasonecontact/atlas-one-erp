"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, Clock, Search, Filter, Download } from "lucide-react"

const walletsData = [
  {
    id: "mercadopago",
    name: "Mercado Pago",
    totalIngresos: 84523,
    operaciones: 1248,
    percentageOfTotal: 51,
    ticketPromedio: 67.7,
    acreditacion: "Inmediato",
    network: "Mastercard",
    gradient: "from-[#00b1ea] to-[#009ee3]",
    textColor: "text-white",
    variacion: 16.3,
  },
  {
    id: "uala",
    name: "Ualá",
    totalIngresos: 67406,
    operaciones: 1042,
    percentageOfTotal: 44,
    ticketPromedio: 64.7,
    acreditacion: "24-48hs",
    network: "Mastercard",
    gradient: "from-[#ff6b6b] to-[#ee5253]",
    textColor: "text-white",
    variacion: -10.5,
  },
  {
    id: "naranjax",
    name: "Naranja X",
    totalIngresos: 45378,
    operaciones: 687,
    percentageOfTotal: 34,
    ticketPromedio: 66.1,
    acreditacion: "24-48hs",
    network: "Visa",
    gradient: "from-[#ff8c00] to-[#ff6600]",
    textColor: "text-white",
    variacion: -10.7,
  },
  {
    id: "modo",
    name: "MODO",
    totalIngresos: 38523,
    operaciones: 856,
    percentageOfTotal: 23,
    ticketPromedio: 45.0,
    acreditacion: "Inmediato",
    network: "QR Code",
    gradient: "from-[#6c5ce7] via-[#a29bfe] to-[#6c5ce7]",
    textColor: "text-white",
    variacion: 8.4,
  },
  {
    id: "prex",
    name: "Prex",
    totalIngresos: 24758,
    operaciones: 423,
    percentageOfTotal: 15,
    ticketPromedio: 58.5,
    acreditacion: "48hs",
    network: "Mastercard",
    gradient: "from-[#2d3436] to-[#636e72]",
    textColor: "text-white",
    variacion: 3.2,
  },
  {
    id: "brubank",
    name: "Brubank",
    totalIngresos: 16423,
    operaciones: 298,
    percentageOfTotal: 10,
    ticketPromedio: 55.1,
    acreditacion: "24hs",
    network: "Visa",
    gradient: "from-[#6c5ce7] to-[#a29bfe]",
    textColor: "text-white",
    variacion: 8.2,
  },
  {
    id: "lemon",
    name: "Lemon",
    totalIngresos: 17645,
    operaciones: 342,
    percentageOfTotal: 11,
    ticketPromedio: 51.6,
    acreditacion: "Inmediato",
    network: "Mastercard",
    gradient: "from-[#00b894] to-[#55efc4]",
    textColor: "text-gray-900",
    variacion: 12.3,
  },
  {
    id: "belo",
    name: "Belo",
    totalIngresos: 12890,
    operaciones: 234,
    percentageOfTotal: 8,
    ticketPromedio: 55.1,
    acreditacion: "24-48hs",
    network: "Visa",
    gradient: "from-[#0984e3] to-[#74b9ff]",
    textColor: "text-white",
    variacion: 5.6,
  },
  {
    id: "personalpay",
    name: "Personal Pay",
    totalIngresos: 9876,
    operaciones: 187,
    percentageOfTotal: 6,
    ticketPromedio: 52.8,
    acreditacion: "Inmediato",
    network: "QR Code",
    gradient: "from-[#e17055] to-[#fdcb6e]",
    textColor: "text-white",
    variacion: -3.2,
  },
  {
    id: "bna",
    name: "BNA+",
    totalIngresos: 21345,
    operaciones: 412,
    percentageOfTotal: 13,
    ticketPromedio: 51.8,
    acreditacion: "48hs",
    network: "Visa",
    gradient: "from-[#0c3b6c] to-[#1e5799]",
    textColor: "text-white",
    variacion: 7.8,
  },
]

const transactionsData = [
  {
    id: "TXN-2024-001234",
    fechaHora: "2024-12-24 15:32:10",
    wallet: "Mercado Pago",
    red: "Mastercard",
    monto: 1250.0,
    comision: 37.5,
    netoAcreditado: 1212.5,
    estado: "Acreditado",
    bancoDestino: "Banco Galicia",
    usuario: "Caja 1",
    sucursal: "Centro",
  },
  {
    id: "TXN-2024-001235",
    fechaHora: "2024-12-24 15:28:45",
    wallet: "Ualá",
    red: "Mastercard",
    monto: 850.0,
    comision: 25.5,
    netoAcreditado: 824.5,
    estado: "Pendiente",
    bancoDestino: "Banco Nación",
    usuario: "Caja 2",
    sucursal: "Palermo",
  },
  {
    id: "TXN-2024-001236",
    fechaHora: "2024-12-24 15:15:22",
    wallet: "MODO",
    red: "QR Code",
    monto: 450.0,
    comision: 4.5,
    netoAcreditado: 445.5,
    estado: "Acreditado",
    bancoDestino: "Banco Macro",
    usuario: "Caja 1",
    sucursal: "Centro",
  },
  {
    id: "TXN-2024-001237",
    fechaHora: "2024-12-24 14:52:33",
    wallet: "Naranja X",
    red: "Visa",
    monto: 2100.0,
    comision: 84.0,
    netoAcreditado: 2016.0,
    estado: "Acreditado",
    bancoDestino: "Banco Santander",
    usuario: "Caja 3",
    sucursal: "Belgrano",
  },
  {
    id: "TXN-2024-001238",
    fechaHora: "2024-12-24 14:40:18",
    wallet: "Lemon",
    red: "Mastercard",
    monto: 675.5,
    comision: 20.26,
    netoAcreditado: 655.24,
    estado: "Rechazado",
    bancoDestino: "-",
    usuario: "Caja 2",
    sucursal: "Palermo",
  },
]

function CardChip() {
  return (
    <div className="w-10 h-7 rounded-md bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-600 flex items-center justify-center overflow-hidden shadow-lg">
      <div className="w-full h-full grid grid-cols-3 gap-0.5 p-1">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-yellow-500/60 rounded-sm" />
        ))}
      </div>
    </div>
  )
}

function NetworkBadge({ network }: { network: string }) {
  if (network === "Mastercard") {
    return (
      <div className="flex items-center gap-0.5">
        <div className="w-4 h-4 rounded-full bg-red-500" />
        <div className="w-4 h-4 rounded-full bg-[#f79e1b] -ml-2" />
      </div>
    )
  }
  if (network === "Visa") {
    return <div className="text-xs font-bold italic text-white/90">VISA</div>
  }
  return <div className="text-[10px] font-semibold text-white/80">{network}</div>
}

function WalletKPICard({
  wallet,
  isHovered,
  onHover,
  onClick,
}: {
  wallet: (typeof walletsData)[0]
  isHovered: boolean
  onHover: (id: string | null) => void
  onClick: (id: string) => void
}) {
  return (
    <div
      className="relative cursor-pointer transition-all duration-300"
      style={{
        perspective: "1200px",
        transform: isHovered ? "scale(1.03)" : "scale(1)",
      }}
      onMouseEnter={() => onHover(wallet.id)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onClick(wallet.id)}
    >
      <div
        className={`relative w-full aspect-[1.586/1] rounded-[20px] bg-gradient-to-br ${wallet.gradient} p-5 shadow-2xl overflow-hidden transition-all duration-300`}
        style={{
          transform: isHovered ? "rotateY(-5deg) rotateX(3deg)" : "rotateY(0) rotateX(0)",
          boxShadow: isHovered
            ? "0 30px 60px -12px rgba(0, 0, 0, 0.5), 0 0 50px rgba(255, 255, 255, 0.1)"
            : "0 15px 40px -10px rgba(0, 0, 0, 0.35)",
        }}
      >
        {/* Background decorative elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-xl" />
        </div>

        {/* Shine effect on hover */}
        <div
          className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent opacity-0 transition-opacity duration-300"
          style={{ opacity: isHovered ? 0.4 : 0 }}
        />

        {/* Card content */}
        <div className="relative h-full flex flex-col justify-between">
          {/* Top: Wallet name and network */}
          <div className="flex justify-between items-start">
            <div className={`text-base font-bold ${wallet.textColor}`}>{wallet.name}</div>
            <NetworkBadge network={wallet.network} />
          </div>

          {/* Middle: Chip and main KPI */}
          <div className="space-y-3">
            <CardChip />
            <div>
              <div className={`text-3xl font-bold ${wallet.textColor}`}>${wallet.totalIngresos.toLocaleString()}</div>
              <div className={`text-xs opacity-80 ${wallet.textColor}`}>Ingresos Totales</div>
            </div>
          </div>

          {/* Bottom: Secondary KPIs */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <div className={`text-sm font-semibold ${wallet.textColor}`}>{wallet.operaciones}</div>
              <div className={`text-[10px] opacity-70 ${wallet.textColor}`}>operaciones</div>
            </div>
            <div>
              <div className={`text-sm font-semibold ${wallet.textColor}`}>{wallet.percentageOfTotal}%</div>
              <div className={`text-[10px] opacity-70 ${wallet.textColor}`}>del total</div>
            </div>
            <div>
              <div className={`text-sm font-semibold ${wallet.textColor}`}>${wallet.ticketPromedio}</div>
              <div className={`text-[10px] opacity-70 ${wallet.textColor}`}>ticket prom</div>
            </div>
          </div>
        </div>
      </div>

      {/* Info panel on hover */}
      <div
        className={`absolute -bottom-2 left-0 right-0 bg-[#0f1419] border border-gray-800/50 rounded-xl p-3 transition-all duration-300 shadow-xl ${
          isHovered ? "opacity-100 translate-y-full" : "opacity-0 translate-y-[calc(100%-8px)] pointer-events-none"
        }`}
      >
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-400">Estado de Acreditación</span>
            <Badge variant="outline" className="text-[10px] px-2 py-0">
              <Clock className="w-3 h-3 mr-1" />
              {wallet.acreditacion}
            </Badge>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-400">Variación vs período anterior</span>
            <span
              className={`flex items-center gap-1 font-semibold ${
                wallet.variacion >= 0 ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {wallet.variacion >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {wallet.variacion >= 0 ? "+" : ""}
              {wallet.variacion}%
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function IngresosWalletsPage() {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")

  const totalVentas = walletsData.reduce((acc, w) => acc + w.totalIngresos, 0)
  const totalTransacciones = walletsData.reduce((acc, w) => acc + w.operaciones, 0)
  const saldoTotal = walletsData.reduce((acc, w) => acc + w.totalIngresos * 0.97, 0) // 3% commission estimate
  const porcentajeAcreditado = 87.3

  // Filter transactions
  const filteredTransactions = transactionsData.filter((t) => {
    const matchesSearch =
      t.id.toLowerCase().includes(searchTerm.toLowerCase()) || t.wallet.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === "all" || t.estado.toLowerCase() === filterStatus.toLowerCase()
    const matchesWallet = !selectedWallet || t.wallet === walletsData.find((w) => w.id === selectedWallet)?.name
    return matchesSearch && matchesStatus && matchesWallet
  })

  return (
    <div className="min-h-screen bg-[#0a0e14] p-6 space-y-6">
      {/* Header with summary KPIs */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Ingresos por Wallets y Tarjetas Prepaga</h1>
          <p className="text-gray-400">Panel de control financiero de medios de pago digitales</p>
        </div>

        {/* Top KPI Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-[#0f1419] border-gray-800/50 shadow-xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="w-4 h-4 text-emerald-400" />
                <p className="text-xs text-gray-400 uppercase tracking-wide">Total Ventas</p>
              </div>
              <p className="text-2xl font-bold text-white">${totalVentas.toLocaleString()}</p>
              <div className="flex items-center gap-1 text-emerald-400 text-xs mt-1">
                <TrendingUp className="w-3 h-3" />
                <span>+12.4% vs mes anterior</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#0f1419] border-gray-800/50 shadow-xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                <p className="text-xs text-gray-400 uppercase tracking-wide">Saldo Total</p>
              </div>
              <p className="text-2xl font-bold text-white">${saldoTotal.toLocaleString()}</p>
              <div className="text-xs text-gray-400 mt-1">Neto después de comisiones</div>
            </CardContent>
          </Card>

          <Card className="bg-[#0f1419] border-gray-800/50 shadow-xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <ArrowUpRight className="w-4 h-4 text-purple-400" />
                <p className="text-xs text-gray-400 uppercase tracking-wide">Transacciones</p>
              </div>
              <p className="text-2xl font-bold text-white">{totalTransacciones.toLocaleString()}</p>
              <div className="text-xs text-gray-400 mt-1">Total de operaciones</div>
            </CardContent>
          </Card>

          <Card className="bg-[#0f1419] border-gray-800/50 shadow-xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <p className="text-xs text-gray-400 uppercase tracking-wide">Acreditados</p>
              </div>
              <p className="text-2xl font-bold text-white">{porcentajeAcreditado}%</p>
              <div className="text-xs text-gray-400 mt-1">Ingresos acreditados</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Wallet Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
        {walletsData.map((wallet) => (
          <WalletKPICard
            key={wallet.id}
            wallet={wallet}
            isHovered={hoveredCard === wallet.id}
            onHover={setHoveredCard}
            onClick={setSelectedWallet}
          />
        ))}
      </div>

      {/* Transaction Database Table */}
      <Card className="bg-[#0f1419] border-gray-800/50 shadow-xl">
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <CardTitle className="text-white text-xl flex items-center gap-2">
                Base de Datos Transaccional
                <Badge variant="outline" className="ml-2">
                  {filteredTransactions.length} registros
                </Badge>
              </CardTitle>
              <p className="text-sm text-gray-400 mt-1">
                Control financiero y auditoría de transacciones en tiempo real
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Buscar por ID o wallet..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-[#0a0e14] border-gray-800 text-white w-64"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40 bg-[#0a0e14] border-gray-800 text-white">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="acreditado">Acreditado</SelectItem>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="rechazado">Rechazado</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" className="border-gray-800 bg-transparent">
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-800 hover:bg-transparent">
                  <TableHead className="text-gray-400 font-semibold">Fecha & Hora</TableHead>
                  <TableHead className="text-gray-400 font-semibold">Wallet / Medio</TableHead>
                  <TableHead className="text-gray-400 font-semibold">Red</TableHead>
                  <TableHead className="text-gray-400 font-semibold">ID Transacción</TableHead>
                  <TableHead className="text-gray-400 font-semibold text-right">Monto</TableHead>
                  <TableHead className="text-gray-400 font-semibold text-right">Comisión</TableHead>
                  <TableHead className="text-gray-400 font-semibold text-right">Neto Acreditado</TableHead>
                  <TableHead className="text-gray-400 font-semibold">Estado</TableHead>
                  <TableHead className="text-gray-400 font-semibold">Banco Destino</TableHead>
                  <TableHead className="text-gray-400 font-semibold">Usuario / Caja</TableHead>
                  <TableHead className="text-gray-400 font-semibold">Sucursal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => {
                  const wallet = walletsData.find((w) => w.name === transaction.wallet)
                  return (
                    <TableRow key={transaction.id} className="border-gray-800 hover:bg-white/[0.02]">
                      <TableCell className="text-gray-300 font-mono text-xs">{transaction.fechaHora}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {wallet && <div className={`w-6 h-4 rounded bg-gradient-to-br ${wallet.gradient}`} />}
                          <span className="text-white font-medium text-sm">{transaction.wallet}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {transaction.red}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-400 font-mono text-xs">{transaction.id}</TableCell>
                      <TableCell className="text-right text-white font-semibold">
                        ${transaction.monto.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-gray-400">${transaction.comision.toFixed(2)}</TableCell>
                      <TableCell className="text-right text-emerald-400 font-semibold">
                        ${transaction.netoAcreditado.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`text-xs ${
                            transaction.estado === "Acreditado"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : transaction.estado === "Pendiente"
                                ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                : "bg-red-500/10 text-red-400 border-red-500/20"
                          }`}
                        >
                          {transaction.estado}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-300 text-sm">{transaction.bancoDestino}</TableCell>
                      <TableCell className="text-gray-300 text-sm">{transaction.usuario}</TableCell>
                      <TableCell className="text-gray-300 text-sm">{transaction.sucursal}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
