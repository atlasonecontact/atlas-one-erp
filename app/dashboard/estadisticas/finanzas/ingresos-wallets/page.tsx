"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight } from "lucide-react"

// Wallet data with realistic card styling
const walletsData = [
  {
    id: "mercadopago",
    name: "Mercado Pago",
    cardNumber: "5547 3050 7100 9870",
    sales: 84523,
    qrPercentage: 51,
    avgSale: 2,
    avgSaleChange: 16.3,
    balance: 38876.0,
    network: "mastercard",
    gradient: "from-[#00b1ea] to-[#009ee3]",
    textColor: "text-white",
    logo: "mercadopago",
    transactions: 3042,
    transferOther: 5143,
    bankAmount: 200660.94,
    bankChange: 5.9,
  },
  {
    id: "uala",
    name: "Ualá",
    cardNumber: "5258 5500 0000 3264",
    sales: 67406,
    qrPercentage: 44,
    avgSale: 188,
    avgSaleChange: -10.5,
    balance: 20557.5,
    network: "mastercard",
    gradient: "from-[#ff6b6b] to-[#ee5253]",
    textColor: "text-white",
    logo: "uala",
    transactions: 1889,
    transferOther: 4289,
    bankAmount: 157321.45,
    bankChange: 4.6,
  },
  {
    id: "naranjax",
    name: "Naranja X",
    cardNumber: "4517 8900 1234 5678",
    sales: 45378,
    qrPercentage: 34,
    avgSale: 135,
    avgSaleChange: -10.7,
    balance: 10073.0,
    network: "visa",
    gradient: "from-[#ff8c00] to-[#ff6600]",
    textColor: "text-white",
    logo: "naranjax",
    transactions: 7415,
    transferOther: 928,
    bankAmount: 54370.83,
    bankChange: -7.7,
  },
  {
    id: "modo",
    name: "MODO",
    cardNumber: "5412 7500 0000 4321",
    sales: 38523,
    qrPercentage: 54,
    avgSale: 145,
    avgSaleChange: -11.7,
    balance: 26876.0,
    network: "mastercard",
    gradient: "from-[#1a1a2e] to-[#16213e]",
    textColor: "text-white",
    logo: "modo",
    transactions: 2156,
    transferOther: 3421,
    bankAmount: 89234.5,
    bankChange: 3.2,
  },
  {
    id: "prex",
    name: "Prex",
    cardNumber: "5489 1200 3456 7890",
    sales: 24758,
    qrPercentage: 51,
    avgSale: 2,
    avgSaleChange: 0,
    balance: 16022.0,
    network: "mastercard",
    gradient: "from-[#2d3436] to-[#636e72]",
    textColor: "text-white",
    logo: "prex",
    transactions: 6548,
    transferOther: 5379,
    bankAmount: 157260.22,
    bankChange: 2.8,
  },
  {
    id: "brubank",
    name: "Brubank",
    cardNumber: "4532 8700 9012 3456",
    sales: 16423,
    qrPercentage: 5.9,
    avgSale: 95,
    avgSaleChange: 8.2,
    balance: 20886.0,
    network: "visa",
    gradient: "from-[#6c5ce7] to-[#a29bfe]",
    textColor: "text-white",
    logo: "brubank",
    transactions: 1234,
    transferOther: 876,
    bankAmount: 45678.9,
    bankChange: 5.4,
  },
  {
    id: "lemon",
    name: "Lemon",
    cardNumber: "5521 4400 7890 1234",
    sales: 17645,
    qrPercentage: 59,
    avgSale: 148,
    avgSaleChange: 12.3,
    balance: 10826.0,
    network: "mastercard",
    gradient: "from-[#00b894] to-[#55efc4]",
    textColor: "text-gray-900",
    logo: "lemon",
    transactions: 1290,
    transferOther: 245,
    bankAmount: 25118.99,
    bankChange: 8.7,
  },
  {
    id: "belo",
    name: "Belo",
    cardNumber: "4916 3300 5678 9012",
    sales: 12890,
    qrPercentage: 42,
    avgSale: 112,
    avgSaleChange: 5.6,
    balance: 8456.0,
    network: "visa",
    gradient: "from-[#0984e3] to-[#74b9ff]",
    textColor: "text-white",
    logo: "belo",
    transactions: 987,
    transferOther: 543,
    bankAmount: 32145.67,
    bankChange: 4.1,
  },
  {
    id: "personalpay",
    name: "Personal Pay",
    cardNumber: "5432 1100 2345 6789",
    sales: 9876,
    qrPercentage: 38,
    avgSale: 87,
    avgSaleChange: -3.2,
    balance: 5432.0,
    network: "mastercard",
    gradient: "from-[#e17055] to-[#fdcb6e]",
    textColor: "text-white",
    logo: "personalpay",
    transactions: 654,
    transferOther: 321,
    bankAmount: 18765.43,
    bankChange: 2.1,
  },
  {
    id: "bna",
    name: "BNA+",
    cardNumber: "4024 0071 2345 6789",
    sales: 21345,
    qrPercentage: 28,
    avgSale: 156,
    avgSaleChange: 7.8,
    balance: 15678.0,
    network: "visa",
    gradient: "from-[#0c3b6c] to-[#1e5799]",
    textColor: "text-white",
    logo: "bna",
    transactions: 1456,
    transferOther: 789,
    bankAmount: 67890.12,
    bankChange: 6.3,
  },
]

// Network logo component
function NetworkLogo({ network, className }: { network: string; className?: string }) {
  if (network === "mastercard") {
    return (
      <div className={`flex items-center ${className}`}>
        <div className="w-6 h-6 rounded-full bg-red-500 opacity-80" />
        <div className="w-6 h-6 rounded-full bg-yellow-500 opacity-80 -ml-3" />
      </div>
    )
  }
  return <div className={`font-bold text-lg italic tracking-tight ${className}`}>VISA</div>
}

// Chip component
function CardChip() {
  return (
    <div className="w-10 h-7 rounded-md bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-600 flex items-center justify-center overflow-hidden">
      <div className="w-full h-full grid grid-cols-3 gap-px p-1">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-yellow-500/50 rounded-sm" />
        ))}
      </div>
    </div>
  )
}

// Wallet Card component
function WalletCard({
  wallet,
  isHovered,
  onHover,
}: {
  wallet: (typeof walletsData)[0]
  isHovered: boolean
  onHover: (id: string | null) => void
}) {
  return (
    <div
      className="relative cursor-pointer transition-all duration-300"
      style={{
        perspective: "1000px",
        transform: isHovered ? "scale(1.02)" : "scale(1)",
      }}
      onMouseEnter={() => onHover(wallet.id)}
      onMouseLeave={() => onHover(null)}
    >
      {/* Card */}
      <div
        className={`relative w-full aspect-[1.586/1] rounded-2xl bg-gradient-to-br ${wallet.gradient} p-5 shadow-xl overflow-hidden transition-all duration-300`}
        style={{
          transform: isHovered ? "rotateY(-5deg) rotateX(5deg)" : "rotateY(0) rotateX(0)",
          boxShadow: isHovered
            ? "0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(255, 255, 255, 0.1)"
            : "0 10px 40px -10px rgba(0, 0, 0, 0.3)",
        }}
      >
        {/* Decorative patterns */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        </div>

        {/* Shine effect */}
        <div
          className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 transition-opacity duration-300"
          style={{ opacity: isHovered ? 0.3 : 0 }}
        />

        {/* Card content */}
        <div className="relative h-full flex flex-col justify-between">
          {/* Top row */}
          <div className="flex justify-between items-start">
            <div className={`text-lg font-bold ${wallet.textColor}`}>{wallet.name}</div>
            <NetworkLogo network={wallet.network} className={wallet.textColor} />
          </div>

          {/* Middle - Chip and number */}
          <div className="space-y-3">
            <CardChip />
            <div className={`font-mono text-lg tracking-widest ${wallet.textColor}`}>{wallet.cardNumber}</div>
          </div>

          {/* Bottom row - Sales info */}
          <div className="flex justify-between items-end">
            <div>
              <div className={`text-xs opacity-70 ${wallet.textColor}`}>VENTAS TOTALES</div>
              <div className={`text-xl font-bold ${wallet.textColor}`}>${wallet.sales.toLocaleString()}</div>
            </div>
            <div className="text-right">
              <div className={`text-xs opacity-70 ${wallet.textColor}`}>QR CODE</div>
              <div className={`text-sm font-semibold ${wallet.textColor}`}>{wallet.qrPercentage}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Hover info panel */}
      <div
        className={`absolute -bottom-2 left-0 right-0 bg-[#0a0f1a] border border-gray-800 rounded-lg p-3 transition-all duration-300 ${
          isHovered ? "opacity-100 translate-y-full" : "opacity-0 translate-y-[calc(100%-10px)] pointer-events-none"
        }`}
      >
        <div className="flex justify-between items-center text-sm">
          <div>
            <span className="text-gray-400">Saldo disponible:</span>
            <span className="text-white font-semibold ml-2">${wallet.balance.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-gray-400">Promedio:</span>
            <span className="text-white font-semibold">${wallet.avgSale}</span>
            {wallet.avgSaleChange >= 0 ? (
              <span className="text-emerald-400 text-xs flex items-center">
                <ArrowUpRight className="w-3 h-3" />
                {wallet.avgSaleChange}%
              </span>
            ) : (
              <span className="text-red-400 text-xs flex items-center">
                <ArrowDownRight className="w-3 h-3" />
                {Math.abs(wallet.avgSaleChange)}%
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function IngresosWalletsPage() {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)

  const totalSales = walletsData.reduce((acc, w) => acc + w.sales, 0)
  const totalBalance = walletsData.reduce((acc, w) => acc + w.balance, 0)
  const totalTransactions = walletsData.reduce((acc, w) => acc + w.transactions, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Ingresos por Wallets</h1>
          <p className="text-gray-400">Resumen de cobros y ventas por billeteras digitales</p>
        </div>
        <div className="flex items-center gap-4">
          <Card className="bg-[#0a0f1a] border-gray-800">
            <CardContent className="p-4 flex items-center gap-3">
              <Wallet className="w-5 h-5 text-emerald-400" />
              <div>
                <p className="text-xs text-gray-400">Total Ventas</p>
                <p className="text-lg font-bold text-white">${totalSales.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#0a0f1a] border-gray-800">
            <CardContent className="p-4 flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-xs text-gray-400">Saldo Total</p>
                <p className="text-lg font-bold text-white">${totalBalance.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
        {walletsData.map((wallet) => (
          <WalletCard key={wallet.id} wallet={wallet} isHovered={hoveredCard === wallet.id} onHover={setHoveredCard} />
        ))}
      </div>

      {/* Transfer Table */}
      <Card className="bg-[#0a0f1a] border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <span>Transferencias a Bancos</span>
            <Badge variant="outline" className="ml-2">
              {walletsData.length} wallets
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-gray-800 hover:bg-transparent">
                <TableHead className="text-gray-400">Wallet</TableHead>
                <TableHead className="text-gray-400">Transacciones</TableHead>
                <TableHead className="text-gray-400">Transferencias</TableHead>
                <TableHead className="text-gray-400 text-right">Monto Banco</TableHead>
                <TableHead className="text-gray-400 text-right">Cambio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {walletsData.map((wallet) => (
                <TableRow key={wallet.id} className="border-gray-800 hover:bg-white/5">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-5 rounded bg-gradient-to-br ${wallet.gradient}`} />
                      <span className="text-white font-medium">{wallet.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-300">{wallet.transactions.toLocaleString()}</TableCell>
                  <TableCell className="text-gray-300">{wallet.transferOther.toLocaleString()}</TableCell>
                  <TableCell className="text-right text-white font-medium">
                    ${wallet.bankAmount.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={`flex items-center justify-end gap-1 ${
                        wallet.bankChange >= 0 ? "text-emerald-400" : "text-red-400"
                      }`}
                    >
                      {wallet.bankChange >= 0 ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                      {wallet.bankChange >= 0 ? "+" : ""}
                      {wallet.bankChange}%
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
