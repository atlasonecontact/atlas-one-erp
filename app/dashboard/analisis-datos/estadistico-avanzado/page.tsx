"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { TrendingUp, ShoppingCart, DollarSign, Activity } from "lucide-react"

export default function AnalisisEstadisticoAvanzadoPage() {
  // Datos de ejemplo para los gráficos
  const correlacionData = [
    { ventas: 1200, inventario: 450, mes: "Ene" },
    { ventas: 1900, inventario: 380, mes: "Feb" },
    { ventas: 1500, inventario: 420, mes: "Mar" },
    { ventas: 2100, inventario: 340, mes: "Abr" },
    { ventas: 2400, inventario: 310, mes: "May" },
    { ventas: 2800, inventario: 290, mes: "Jun" },
  ]

  const distribucionData = [
    { rango: "$0-$500", frecuencia: 45 },
    { rango: "$500-$1000", frecuencia: 120 },
    { rango: "$1000-$1500", frecuencia: 250 },
    { rango: "$1500-$2000", frecuencia: 180 },
    { rango: "$2000+", frecuencia: 85 },
  ]

  const regresionData = [
    { x: 10, y: 1200, prediccion: 1150 },
    { x: 15, y: 1500, prediccion: 1550 },
    { x: 20, y: 1900, prediccion: 1950 },
    { x: 25, y: 2200, prediccion: 2350 },
    { x: 30, y: 2600, prediccion: 2750 },
    { x: 35, y: 3100, prediccion: 3150 },
  ]

  const metricas = [
    {
      titulo: "Coeficiente de Correlación",
      valor: "0.87",
      descripcion: "Ventas vs Inventario",
      icono: TrendingUp,
      color: "text-emerald-500",
    },
    {
      titulo: "Desviación Estándar",
      valor: "$342",
      descripcion: "Transacciones mensuales",
      icono: Activity,
      color: "text-blue-500",
    },
    {
      titulo: "Índice de Variación",
      valor: "14.2%",
      descripcion: "Coeficiente de variación",
      icono: ShoppingCart,
      color: "text-purple-500",
    },
    {
      titulo: "R² (Bondad de Ajuste)",
      valor: "0.92",
      descripcion: "Modelo de regresión",
      icono: DollarSign,
      color: "text-orange-500",
    },
  ]

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Análisis Estadístico Avanzado</h1>
        <p className="text-muted-foreground mt-2">
          Análisis profundo de correlaciones, distribuciones y modelos de regresión
        </p>
      </div>

      {/* Métricas estadísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metricas.map((metrica, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metrica.titulo}</CardTitle>
              <metrica.icono className={`h-4 w-4 ${metrica.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrica.valor}</div>
              <p className="text-xs text-muted-foreground mt-1">{metrica.descripcion}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Análisis de Correlación */}
      <Card>
        <CardHeader>
          <CardTitle>Análisis de Correlación</CardTitle>
          <CardDescription>Relación entre ventas e inventario a lo largo del tiempo</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={correlacionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="ventas"
                stroke="#10b981"
                strokeWidth={2}
                name="Ventas ($)"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="inventario"
                stroke="#6366f1"
                strokeWidth={2}
                name="Inventario (unidades)"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Distribución de Frecuencias */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución de Transacciones</CardTitle>
            <CardDescription>Frecuencia por rango de montos</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={distribucionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="rango" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="frecuencia" fill="#8b5cf6" name="Cantidad de transacciones" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Análisis de Regresión */}
        <Card>
          <CardHeader>
            <CardTitle>Modelo de Regresión Lineal</CardTitle>
            <CardDescription>Datos observados vs predicción del modelo</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" dataKey="x" name="Variable X" />
                <YAxis type="number" dataKey="y" name="Ventas" />
                <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                <Legend />
                <Scatter name="Datos Observados" data={regresionData} fill="#f59e0b" />
                <Line
                  type="monotone"
                  dataKey="prediccion"
                  stroke="#ef4444"
                  strokeWidth={2}
                  data={regresionData}
                  name="Línea de Regresión"
                />
              </ScatterChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Interpretación */}
      <Card>
        <CardHeader>
          <CardTitle>Interpretación de Resultados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Correlación Ventas-Inventario (r = 0.87)</h4>
            <p className="text-sm text-muted-foreground">
              Existe una fuerte correlación negativa entre el inventario y las ventas, lo que indica que a mayor volumen
              de ventas, menor es el inventario disponible. Este patrón es esperado y sugiere una gestión eficiente del
              stock.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Modelo de Regresión (R² = 0.92)</h4>
            <p className="text-sm text-muted-foreground">
              El modelo de regresión lineal explica el 92% de la varianza en los datos, indicando un ajuste excelente.
              Esto permite realizar predicciones confiables de las ventas futuras.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Distribución de Transacciones</h4>
            <p className="text-sm text-muted-foreground">
              La mayoría de las transacciones se concentran en el rango de $1000-$1500, con una distribución
              aproximadamente normal. Esto sugiere un ticket promedio estable en el negocio.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
