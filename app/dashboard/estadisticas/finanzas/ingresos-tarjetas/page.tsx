"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TrendingUp, TrendingDown, CreditCard, ArrowUpRight, ArrowDownRight, DollarSign } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

// Card data
const cardsData = [
  {
    id: "visa",
    name: "VISA",
    cardNumber: "4916 •••• •••• 8432",
    holderName: "ATLAS ONE S.A.",
    expiry: "12/28",
    totalRevenue: 68120.0,
    creditRevenue: 45678.5,
    debitRevenue: 22441.5,
    lastMonthChange: 4.2,
    transactions: 295,
    avgTransaction: 230.92,
    gradient: "from-[#1a1f71] via-[#1e3a8a] to-[#1e40af]",
    textColor: "text-white",
    accentColor: "#fbbf24",
  },
  {
    id: "mastercard",
    name: "Mastercard",
    cardNumber: "5412 •••• •••• 7621",
    holderName: "ATLAS ONE S.A.",
    expiry: "09/27",
    totalRevenue: 54875.5,
    creditRevenue: 38912.75,
    debitRevenue: 15962.75,
    lastMonthChange: 9.5,
    transactions: 214,
    avgTransaction: 256.42,
    gradient: "from-[#eb001b] via-[#f79e1b] to-[#ff5f00]",
    textColor: "text-white",
    accentColor: "#ffffff",
  },
  {
    id: "amex",
    name: "American Express",
    cardNumber: "3782 •••• •••• 0005",
    holderName: "ATLAS ONE S.A.",
    expiry: "03/26",
    totalRevenue: 42800.25,
    creditRevenue: 42800.25,
    debitRevenue: 0,
    lastMonthChange: 7.2,
    transactions: 167,
    avgTransaction: 256.29,
    gradient: "from-[#006fcf] to-[#00175a]",
    textColor: "text-white",
    accentColor: "#ffffff",
  },
]

// Monthly revenue data for chart
const monthlyData = [
  { month: "Ene", visa: 45000, mastercard: 38000, amex: 28000 },
  { month: "Feb", visa: 52000, mastercard: 42000, amex: 31000 },
  { month: "Mar", visa: 48000, mastercard: 45000, amex: 29000 },
  { month: "Abr", visa: 61000, mastercard: 48000, amex: 35000 },
  { month: "May", visa: 55000, mastercard: 51000, amex: 38000 },
  { month: "Jun", visa: 67000, mastercard: 54000, amex: 42000 },
  { month: "Jul", visa: 72000, mastercard: 58000, amex: 45000 },
  { month: "Ago", visa: 68000, mastercard: 55000, amex: 43000 },
  { month: "Sep", visa: 75000, mastercard: 62000, amex: 48000 },
]

// Network logo components
function VisaLogo({ className }: { className?: string }) {
  return <div className={`font-bold text-2xl italic tracking-tight ${className}`}>VISA</div>
}

function MastercardLogo({ className }: { className?: string }) {
  return (
    <div className={`flex items-center ${className}`}>
      <div className="w-8 h-8 rounded-full bg-[#eb001b]" />
      <div className="w-8 h-8 rounded-full bg-[#f79e1b] -ml-4 mix-blend-multiply" />
    </div>
  )
}

function AmexLogo({ className }: { className?: string }) {
  return (
    <div className={`font-bold text-sm tracking-wider ${className}`}>
      <div>AMERICAN</div>
      <div>EXPRESS</div>
    </div>
  )
}

// Chip component
function CardChip() {
  return (
    <div className="w-12 h-9 rounded-md bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-600 flex items-center justify-center overflow-hidden shadow-lg">
      <div className="w-full h-full grid grid-cols-3 gap-0.5 p-1.5">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-yellow-500/60 rounded-sm" />
        ))}
      </div>
    </div>
  )
}

// Contactless icon
function ContactlessIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"
        opacity="0.3"
      />
      <path d="M7.5 12c0-2.48 2.02-4.5 4.5-4.5v-2c-3.59 0-6.5 2.91-6.5 6.5s2.91 6.5 6.5 6.5v-2c-2.48 0-4.5-2.02-4.5-4.5z" />
      <path d="M12 8.5c1.93 0 3.5 1.57 3.5 3.5s-1.57 3.5-3.5 3.5v2c3.04 0 5.5-2.46 5.5-5.5s-2.46-5.5-5.5-5.5v2z" />
      <circle cx="12" cy="12" r="1.5" />
    </svg>
  )
}

// Credit Card Component
function CreditCardComponent({
  card,
  isHovered,
  onHover,
}: {
  card: (typeof cardsData)[0]
  isHovered: boolean
  onHover: (id: string | null) => void
}) {
  return (
    <div
      className="relative cursor-pointer transition-all duration-500"
      style={{
        perspective: "1500px",
        transform: isHovered ? "scale(1.03)" : "scale(1)",
      }}
      onMouseEnter={() => onHover(card.id)}
      onMouseLeave={() => onHover(null)}
    >
      {/* Main Card */}
      <div
        className={`relative w-full aspect-[1.586/1] rounded-2xl bg-gradient-to-br ${card.gradient} p-6 shadow-2xl overflow-hidden transition-all duration-500`}
        style={{
          transform: isHovered
            ? "rotateY(-8deg) rotateX(5deg) translateZ(20px)"
            : "rotateY(0) rotateX(0) translateZ(0)",
          boxShadow: isHovered
            ? "0 35px 60px -15px rgba(0, 0, 0, 0.6), 0 0 50px rgba(255, 255, 255, 0.15), inset 0 1px 0 rgba(255,255,255,0.2)"
            : "0 15px 50px -12px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.1)",
        }}
      >
        {/* Background patterns */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-60 h-60 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />
          {/* Card pattern lines */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 50px, rgba(255,255,255,0.03) 50px, rgba(255,255,255,0.03) 51px)`,
            }}
          />
        </div>

        {/* Holographic shine effect */}
        <div
          className="absolute inset-0 transition-opacity duration-500"
          style={{
            background: `linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.3) 45%, rgba(255,255,255,0.1) 50%, transparent 55%)`,
            opacity: isHovered ? 1 : 0,
            transform: isHovered ? "translateX(100%)" : "translateX(-100%)",
            transition: "transform 0.8s ease, opacity 0.3s ease",
          }}
        />

        {/* Card content */}
        <div className="relative h-full flex flex-col justify-between">
          {/* Top row - Logo and contactless */}
          <div className="flex justify-between items-start">
            <div className={card.textColor}>
              {card.id === "visa" && <VisaLogo />}
              {card.id === "mastercard" && <MastercardLogo />}
              {card.id === "amex" && <AmexLogo />}
            </div>
            <ContactlessIcon className={`w-8 h-8 ${card.textColor} opacity-80`} />
          </div>

          {/* Middle - Chip and card number */}
          <div className="space-y-4">
            <CardChip />
            <div className={`font-mono text-xl tracking-[0.2em] ${card.textColor}`}>{card.cardNumber}</div>
          </div>

          {/* Bottom row */}
          <div className="flex justify-between items-end">
            <div>
              <div className={`text-[10px] uppercase tracking-wider opacity-60 ${card.textColor}`}>Titular</div>
              <div className={`text-sm font-medium tracking-wider ${card.textColor}`}>{card.holderName}</div>
            </div>
            <div className="text-right">
              <div className={`text-[10px] uppercase tracking-wider opacity-60 ${card.textColor}`}>Válida hasta</div>
              <div className={`text-sm font-mono ${card.textColor}`}>{card.expiry}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Panel below card */}
      <div
        className={`mt-4 bg-[#0a0f1a] border border-gray-800 rounded-xl p-4 transition-all duration-300 ${
          isHovered ? "opacity-100 translate-y-0" : "opacity-80"
        }`}
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-400">Ingresos Totales</p>
            <p className="text-xl font-bold text-white">${card.totalRevenue.toLocaleString()}</p>
            <div
              className={`flex items-center gap-1 text-xs ${card.lastMonthChange >= 0 ? "text-emerald-400" : "text-red-400"}`}
            >
              {card.lastMonthChange >= 0 ? (
                <ArrowUpRight className="w-3 h-3" />
              ) : (
                <ArrowDownRight className="w-3 h-3" />
              )}
              {card.lastMonthChange >= 0 ? "+" : ""}
              {card.lastMonthChange}% vs mes anterior
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-xs text-gray-400">Crédito</span>
              <span className="text-sm text-white">${card.creditRevenue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-gray-400">Débito</span>
              <span className="text-sm text-white">${card.debitRevenue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-t border-gray-800 pt-2">
              <span className="text-xs text-gray-400">Transacciones</span>
              <span className="text-sm text-white">{card.transactions}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function IngresosTarjetasPage() {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)

  const totalRevenue = cardsData.reduce((acc, c) => acc + c.totalRevenue, 0)
  const totalTransactions = cardsData.reduce((acc, c) => acc + c.transactions, 0)
  const totalCredit = cardsData.reduce((acc, c) => acc + c.creditRevenue, 0)
  const totalDebit = cardsData.reduce((acc, c) => acc + c.debitRevenue, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Ingresos por Tarjetas</h1>
          <p className="text-gray-400">Resumen de cobros por tarjetas de crédito y débito</p>
        </div>
        <div className="flex items-center gap-4">
          <Card className="bg-[#0a0f1a] border-gray-800">
            <CardContent className="p-4 flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              <div>
                <p className="text-xs text-gray-400">Ingresos Totales</p>
                <p className="text-lg font-bold text-white">${totalRevenue.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#0a0f1a] border-gray-800">
            <CardContent className="p-4 flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-xs text-gray-400">Transacciones</p>
                <p className="text-lg font-bold text-white">{totalTransactions.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {cardsData.map((card) => (
          <CreditCardComponent key={card.id} card={card} isHovered={hoveredCard === card.id} onHover={setHoveredCard} />
        ))}
      </div>

      {/* Summary and Chart Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Summary Card */}
        <Card className="bg-[#0a0f1a] border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Resumen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Ingresos Totales</span>
              <span className="text-xl font-bold text-white">${totalRevenue.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1 text-emerald-400 text-sm">
              <TrendingUp className="w-4 h-4" />
              +10.1% vs mes anterior
            </div>
            <div className="space-y-3 pt-4 border-t border-gray-800">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Ingresos Crédito</span>
                  <span className="text-white">${totalCredit.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${(totalCredit / totalRevenue) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">{((totalCredit / totalRevenue) * 100).toFixed(1)}%</p>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Ingresos Débito</span>
                  <span className="text-white">${totalDebit.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2">
                  <div
                    className="bg-emerald-500 h-2 rounded-full"
                    style={{ width: `${(totalDebit / totalRevenue) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">{((totalDebit / totalRevenue) * 100).toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chart */}
        <Card className="bg-[#0a0f1a] border-gray-800 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-white">Ingresos Mensuales por Marca</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "1px solid #374151",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "#ffffff" }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, ""]}
                  />
                  <Legend />
                  <Bar dataKey="visa" name="VISA" fill="#1e40af" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="mastercard" name="Mastercard" fill="#f79e1b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="amex" name="AMEX" fill="#006fcf" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Table */}
      <Card className="bg-[#0a0f1a] border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            Detalle por Tipo de Tarjeta
            <Badge variant="outline" className="ml-2">
              {cardsData.length} marcas
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-gray-800 hover:bg-transparent">
                <TableHead className="text-gray-400">Marca</TableHead>
                <TableHead className="text-gray-400">Total</TableHead>
                <TableHead className="text-gray-400">Ventas</TableHead>
                <TableHead className="text-gray-400">Prom. Venta</TableHead>
                <TableHead className="text-gray-400 text-right">Cambio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cardsData.map((card) => (
                <TableRow key={card.id} className="border-gray-800 hover:bg-white/5">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-6 rounded bg-gradient-to-br ${card.gradient} flex items-center justify-center`}
                      >
                        {card.id === "visa" && <span className="text-white text-[8px] font-bold italic">VISA</span>}
                        {card.id === "mastercard" && (
                          <div className="flex">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500 -ml-1" />
                          </div>
                        )}
                        {card.id === "amex" && <span className="text-white text-[6px] font-bold">AMEX</span>}
                      </div>
                      <span className="text-white font-medium">{card.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-white font-medium">${card.totalRevenue.toLocaleString()}</TableCell>
                  <TableCell className="text-gray-300">{card.transactions}</TableCell>
                  <TableCell className="text-gray-300">${card.avgTransaction.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <span
                      className={`flex items-center justify-end gap-1 ${
                        card.lastMonthChange >= 0 ? "text-emerald-400" : "text-red-400"
                      }`}
                    >
                      {card.lastMonthChange >= 0 ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                      {card.lastMonthChange >= 0 ? "+" : ""}
                      {card.lastMonthChange}%
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
