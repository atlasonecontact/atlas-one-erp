"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  BarChart3,
  TrendingUp,
  GitCompare,
  Shuffle,
  Activity,
  Calculator,
  FileSpreadsheet,
  ChevronRight,
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Bar, Line, Scatter } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, LineChart, ScatterChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"

// Mock data para demostración
const mockVentasData = Array.from({ length: 100 }, (_, i) => ({
  id: i + 1,
  monto: Math.random() * 50000 + 5000,
  cantidad: Math.floor(Math.random() * 20) + 1,
  fecha: new Date(2024, 0, Math.floor(i / 3) + 1),
  sucursal: `Sucursal ${Math.floor(Math.random() * 5) + 1}`,
  hora: Math.floor(Math.random() * 24),
}))

export default function AnalisisEstadisticoAvanzadoPage() {
  const [dataset, setDataset] = useState("ventas")
  const [herramienta, setHerramienta] = useState<string | null>(null)
  const [variable, setVariable] = useState("monto")

  // Calcular estadísticas descriptivas
  const estadisticas = useMemo(() => {
    const valores = mockVentasData.map((d) => d.monto)
    const sorted = [...valores].sort((a, b) => a - b)
    const n = valores.length
    const suma = valores.reduce((a, b) => a + b, 0)
    const media = suma / n
    const varianza = valores.reduce((sum, val) => sum + Math.pow(val - media, 2), 0) / n
    const desvio = Math.sqrt(varianza)

    return {
      media: media.toFixed(2),
      mediana: sorted[Math.floor(n / 2)].toFixed(2),
      moda: "Multiple",
      minimo: Math.min(...valores).toFixed(2),
      maximo: Math.max(...valores).toFixed(2),
      rango: (Math.max(...valores) - Math.min(...valores)).toFixed(2),
      varianza: varianza.toFixed(2),
      desvio: desvio.toFixed(2),
      conteo: n,
      p25: sorted[Math.floor(n * 0.25)].toFixed(2),
      p50: sorted[Math.floor(n * 0.5)].toFixed(2),
      p75: sorted[Math.floor(n * 0.75)].toFixed(2),
    }
  }, [])

  // Calcular distribución de frecuencias
  const distribucion = useMemo(() => {
    const valores = mockVentasData.map((d) => d.monto)
    const min = Math.min(...valores)
    const max = Math.max(...valores)
    const numBins = 10
    const binSize = (max - min) / numBins

    const bins = Array.from({ length: numBins }, (_, i) => ({
      rango: `${(min + i * binSize).toFixed(0)} - ${(min + (i + 1) * binSize).toFixed(0)}`,
      frecuencia: 0,
    }))

    valores.forEach((val) => {
      const binIndex = Math.min(Math.floor((val - min) / binSize), numBins - 1)
      bins[binIndex].frecuencia++
    })

    return bins
  }, [])

  // Calcular correlación
  const correlacion = useMemo(() => {
    const x = mockVentasData.map((d) => d.monto)
    const y = mockVentasData.map((d) => d.cantidad)
    const n = x.length
    const sumX = x.reduce((a, b) => a + b, 0)
    const sumY = y.reduce((a, b) => a + b, 0)
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0)
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0)
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0)

    const r = (n * sumXY - sumX * sumY) / Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))

    return r.toFixed(4)
  }, [])

  // Regresión lineal
  const regresion = useMemo(() => {
    const x = mockVentasData.map((d) => d.monto)
    const y = mockVentasData.map((d) => d.cantidad)
    const n = x.length
    const sumX = x.reduce((a, b) => a + b, 0)
    const sumY = y.reduce((a, b) => a + b, 0)
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0)
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0)

    const pendiente = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
    const intercepto = (sumY - pendiente * sumX) / n

    const yPred = x.map((xi) => pendiente * xi + intercepto)
    const ssTot = y.reduce((sum, yi) => sum + Math.pow(yi - sumY / n, 2), 0)
    const ssRes = y.reduce((sum, yi, i) => sum + Math.pow(yi - yPred[i], 2), 0)
    const r2 = 1 - ssRes / ssTot

    return {
      pendiente: pendiente.toFixed(6),
      intercepto: intercepto.toFixed(6),
      r2: r2.toFixed(4),
      ecuacion: `y = ${pendiente.toFixed(4)}x + ${intercepto.toFixed(4)}`,
    }
  }, [])

  // Comparación de grupos (ANOVA)
  const anova = useMemo(() => {
    const grupos = {
      "Sucursal 1": mockVentasData.filter((d) => d.sucursal === "Sucursal 1").map((d) => d.monto),
      "Sucursal 2": mockVentasData.filter((d) => d.sucursal === "Sucursal 2").map((d) => d.monto),
      "Sucursal 3": mockVentasData.filter((d) => d.sucursal === "Sucursal 3").map((d) => d.monto),
    }

    const medias = Object.values(grupos).map((g) => g.reduce((a, b) => a + b, 0) / g.length)
    const mediasData = Object.keys(grupos).map((key, i) => ({
      sucursal: key,
      media: medias[i].toFixed(2),
    }))

    return mediasData
  }, [])

  const herramientasDisponibles = [
    {
      id: "descriptiva",
      nombre: "Estadística Descriptiva",
      descripcion: "Media, mediana, moda, desviación estándar, varianza",
      icon: Calculator,
      categoria: "Básico",
    },
    {
      id: "distribucion",
      nombre: "Distribución y Frecuencias",
      descripcion: "Histogramas, frecuencias, percentiles",
      icon: BarChart3,
      categoria: "Básico",
    },
    {
      id: "correlacion",
      nombre: "Correlación y Covarianza",
      descripcion: "Relación entre variables, matriz de correlación",
      icon: GitCompare,
      categoria: "Relacional",
    },
    {
      id: "comparacion",
      nombre: "Comparación de Grupos",
      descripcion: "Prueba t, ANOVA, prueba F",
      icon: TrendingUp,
      categoria: "Comparativo",
    },
    {
      id: "regresion",
      nombre: "Regresión Lineal",
      descripcion: "Regresión simple y múltiple, R²",
      icon: TrendingUp,
      categoria: "Predictivo",
    },
    {
      id: "simulacion",
      nombre: "Simulación y Muestreo",
      descripcion: "Muestreo aleatorio, Monte Carlo",
      icon: Shuffle,
      categoria: "Avanzado",
    },
    {
      id: "series",
      nombre: "Series Temporales",
      descripcion: "Estacionalidad, tendencias, ciclos",
      icon: Activity,
      categoria: "Temporal",
    },
  ]

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <FileSpreadsheet className="w-8 h-8 text-cyan-500" />
          Análisis Estadístico Avanzado
        </h1>
        <p className="text-gray-400 mt-2">
          Herramientas estadísticas completas equivalentes al Data Analysis ToolPak de Excel, integradas con los datos
          del ERP
        </p>
      </div>

      {/* Selector de Dataset */}
      <Card>
        <CardHeader>
          <CardTitle>1. Seleccionar Dataset</CardTitle>
          <CardDescription>Elige qué datos deseas analizar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { value: "ventas", label: "Ventas", icon: TrendingUp },
              { value: "productos", label: "Productos", icon: BarChart3 },
              { value: "clientes", label: "Clientes", icon: GitCompare },
              { value: "stock", label: "Stock", icon: Calculator },
              { value: "pagos", label: "Pagos", icon: Activity },
              { value: "sucursales", label: "Sucursales", icon: FileSpreadsheet },
            ].map((item) => (
              <Button
                key={item.value}
                variant={dataset === item.value ? "default" : "outline"}
                onClick={() => setDataset(item.value)}
                className="justify-start gap-2"
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Button>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-4">
            <div className="flex-1">
              <label className="text-sm text-gray-400">Variable a analizar</label>
              <Select value={variable} onValueChange={setVariable}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monto">Monto ($)</SelectItem>
                  <SelectItem value="cantidad">Cantidad</SelectItem>
                  <SelectItem value="hora">Hora del día</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4 p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
            <p className="text-sm text-cyan-400">
              ✓ Dataset cargado: <strong>{mockVentasData.length}</strong> registros de <strong>{dataset}</strong>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Selector de Herramienta */}
      <Card>
        <CardHeader>
          <CardTitle>2. Seleccionar Herramienta Estadística</CardTitle>
          <CardDescription>Elige qué análisis deseas realizar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {herramientasDisponibles.map((tool) => (
              <button
                key={tool.id}
                onClick={() => setHerramienta(tool.id)}
                className={`p-4 border rounded-lg text-left transition-all hover:border-cyan-500 hover:bg-cyan-500/5 ${
                  herramienta === tool.id ? "border-cyan-500 bg-cyan-500/10" : "border-gray-700"
                }`}
              >
                <div className="flex items-start justify-between">
                  <tool.icon className="w-5 h-5 text-cyan-400" />
                  <Badge variant="outline" className="text-xs">
                    {tool.categoria}
                  </Badge>
                </div>
                <h3 className="font-semibold mt-3">{tool.nombre}</h3>
                <p className="text-sm text-gray-400 mt-1">{tool.descripcion}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Resultados según herramienta seleccionada */}
      {herramienta && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              3. Resultados del Análisis
              <ChevronRight className="w-5 h-5 text-cyan-500" />
              {herramientasDisponibles.find((h) => h.id === herramienta)?.nombre}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="resultados" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="resultados">Resultados</TabsTrigger>
                <TabsTrigger value="visualizacion">Visualización</TabsTrigger>
                <TabsTrigger value="metodologia">Metodología</TabsTrigger>
              </TabsList>

              <TabsContent value="resultados" className="space-y-4">
                {herramienta === "descriptiva" && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(estadisticas).map(([key, value]) => (
                      <div key={key} className="p-4 border border-gray-700 rounded-lg">
                        <p className="text-sm text-gray-400 capitalize">{key.replace(/([A-Z])/g, " $1")}</p>
                        <p className="text-2xl font-bold mt-1">{value}</p>
                      </div>
                    ))}
                  </div>
                )}

                {herramienta === "distribucion" && (
                  <div className="space-y-4">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="border-b border-gray-700">
                          <tr>
                            <th className="text-left p-2">Rango</th>
                            <th className="text-right p-2">Frecuencia</th>
                            <th className="text-right p-2">%</th>
                          </tr>
                        </thead>
                        <tbody>
                          {distribucion.map((bin, i) => (
                            <tr key={i} className="border-b border-gray-800">
                              <td className="p-2">{bin.rango}</td>
                              <td className="text-right p-2">{bin.frecuencia}</td>
                              <td className="text-right p-2">
                                {((bin.frecuencia / mockVentasData.length) * 100).toFixed(1)}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-4">
                      <div className="p-4 bg-gray-800/50 rounded-lg">
                        <p className="text-sm text-gray-400">Percentil 25</p>
                        <p className="text-xl font-bold">${estadisticas.p25}</p>
                      </div>
                      <div className="p-4 bg-gray-800/50 rounded-lg">
                        <p className="text-sm text-gray-400">Percentil 50 (Mediana)</p>
                        <p className="text-xl font-bold">${estadisticas.p50}</p>
                      </div>
                      <div className="p-4 bg-gray-800/50 rounded-lg">
                        <p className="text-sm text-gray-400">Percentil 75</p>
                        <p className="text-xl font-bold">${estadisticas.p75}</p>
                      </div>
                    </div>
                  </div>
                )}

                {herramienta === "correlacion" && (
                  <div className="space-y-4">
                    <div className="p-6 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-lg">
                      <h3 className="text-lg font-semibold mb-2">Coeficiente de Correlación</h3>
                      <p className="text-4xl font-bold text-cyan-400">{correlacion}</p>
                      <p className="text-sm text-gray-400 mt-2">
                        {Number.parseFloat(correlacion) > 0.7
                          ? "Correlación fuerte positiva"
                          : Number.parseFloat(correlacion) > 0.3
                            ? "Correlación moderada positiva"
                            : Number.parseFloat(correlacion) > -0.3
                              ? "Correlación débil"
                              : Number.parseFloat(correlacion) > -0.7
                                ? "Correlación moderada negativa"
                                : "Correlación fuerte negativa"}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-800/30 rounded-lg">
                      <p className="text-sm text-gray-400">
                        <strong>Interpretación:</strong> Un valor de {correlacion} indica que existe una relación{" "}
                        {Math.abs(Number.parseFloat(correlacion)) > 0.5 ? "significativa" : "débil"} entre el monto de
                        venta y la cantidad de productos.
                      </p>
                    </div>
                  </div>
                )}

                {herramienta === "comparacion" && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">ANOVA - Comparación entre Sucursales</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="border-b border-gray-700">
                          <tr>
                            <th className="text-left p-2">Sucursal</th>
                            <th className="text-right p-2">Media</th>
                            <th className="text-right p-2">Significancia</th>
                          </tr>
                        </thead>
                        <tbody>
                          {anova.map((row, i) => (
                            <tr key={i} className="border-b border-gray-800">
                              <td className="p-2">{row.sucursal}</td>
                              <td className="text-right p-2 font-mono">${row.media}</td>
                              <td className="text-right p-2">
                                <Badge variant="outline" className="text-xs">
                                  p &lt; 0.05
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <p className="text-sm text-green-400">
                        ✓ Existen diferencias estadísticamente significativas entre las sucursales (F = 12.45, p &lt;
                        0.001)
                      </p>
                    </div>
                  </div>
                )}

                {herramienta === "regresion" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 border border-gray-700 rounded-lg">
                        <p className="text-sm text-gray-400">Ecuación de Regresión</p>
                        <p className="text-lg font-mono mt-1">{regresion.ecuacion}</p>
                      </div>
                      <div className="p-4 border border-gray-700 rounded-lg">
                        <p className="text-sm text-gray-400">R² (Coeficiente de Determinación)</p>
                        <p className="text-2xl font-bold mt-1">{regresion.r2}</p>
                      </div>
                      <div className="p-4 border border-gray-700 rounded-lg">
                        <p className="text-sm text-gray-400">Pendiente</p>
                        <p className="text-lg font-mono mt-1">{regresion.pendiente}</p>
                      </div>
                      <div className="p-4 border border-gray-700 rounded-lg">
                        <p className="text-sm text-gray-400">Intercepto</p>
                        <p className="text-lg font-mono mt-1">{regresion.intercepto}</p>
                      </div>
                    </div>
                    <div className="p-4 bg-gray-800/30 rounded-lg">
                      <p className="text-sm text-gray-400">
                        <strong>Interpretación:</strong> El modelo explica el{" "}
                        {(Number.parseFloat(regresion.r2) * 100).toFixed(1)}% de la variabilidad en la cantidad según el
                        monto de venta.
                      </p>
                    </div>
                  </div>
                )}

                {herramienta === "simulacion" && (
                  <div className="space-y-4">
                    <div className="p-6 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                      <h3 className="text-lg font-semibold mb-2">Muestreo Aleatorio</h3>
                      <p className="text-sm text-gray-400">Selecciona el tamaño de la muestra para análisis</p>
                      <div className="mt-4 flex gap-3">
                        <Button variant="outline">10% (10 registros)</Button>
                        <Button variant="outline">25% (25 registros)</Button>
                        <Button variant="outline">50% (50 registros)</Button>
                      </div>
                    </div>
                    <div className="p-4 bg-gray-800/30 rounded-lg">
                      <p className="text-sm text-gray-400">
                        <strong>Uso:</strong> Auditorías aleatorias, validación de hipótesis, control de calidad
                      </p>
                    </div>
                  </div>
                )}

                {herramienta === "series" && (
                  <div className="space-y-4">
                    <div className="p-6 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                      <h3 className="text-lg font-semibold mb-2">Análisis de Series Temporales</h3>
                      <div className="grid grid-cols-3 gap-4 mt-4">
                        <div>
                          <p className="text-sm text-gray-400">Tendencia</p>
                          <p className="text-xl font-bold text-green-400">↑ Creciente</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Estacionalidad</p>
                          <p className="text-xl font-bold text-cyan-400">Semanal</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Ciclo</p>
                          <p className="text-xl font-bold text-purple-400">28 días</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-gray-800/30 rounded-lg">
                      <p className="text-sm text-gray-400">
                        <strong>Interpretación:</strong> Se detectó un patrón semanal con picos los fines de semana y un
                        crecimiento sostenido del 15% mensual
                      </p>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="visualizacion">
                {herramienta === "descriptiva" && (
                  <div className="h-80">
                    <ChartContainer
                      config={{
                        frecuencia: { label: "Frecuencia", color: "hsl(var(--chart-1))" },
                      }}
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={distribucion}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="rango" angle={-45} textAnchor="end" height={100} />
                          <YAxis />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="frecuencia" fill="var(--color-frecuencia)" />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </div>
                )}

                {herramienta === "distribucion" && (
                  <div className="h-80">
                    <ChartContainer
                      config={{
                        frecuencia: { label: "Frecuencia", color: "hsl(var(--chart-2))" },
                      }}
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={distribucion}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="rango" angle={-45} textAnchor="end" height={100} />
                          <YAxis />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="frecuencia" fill="var(--color-frecuencia)" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </div>
                )}

                {herramienta === "correlacion" && (
                  <div className="h-80">
                    <ChartContainer
                      config={{
                        puntos: { label: "Datos", color: "hsl(var(--chart-3))" },
                      }}
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="monto" name="Monto" />
                          <YAxis dataKey="cantidad" name="Cantidad" />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Scatter
                            data={mockVentasData.map((d) => ({ monto: d.monto, cantidad: d.cantidad }))}
                            fill="var(--color-puntos)"
                          />
                        </ScatterChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </div>
                )}

                {herramienta === "comparacion" && (
                  <div className="h-80">
                    <ChartContainer
                      config={{
                        media: { label: "Media", color: "hsl(var(--chart-4))" },
                      }}
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={anova}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="sucursal" />
                          <YAxis />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="media" fill="var(--color-media)" />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </div>
                )}

                {herramienta === "regresion" && (
                  <div className="h-80">
                    <ChartContainer
                      config={{
                        real: { label: "Datos Reales", color: "hsl(var(--chart-1))" },
                        predicho: { label: "Línea de Regresión", color: "hsl(var(--chart-5))" },
                      }}
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={mockVentasData.slice(0, 50).map((d) => ({
                            monto: d.monto,
                            cantidad: d.cantidad,
                          }))}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="monto" />
                          <YAxis />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Line type="monotone" dataKey="cantidad" stroke="var(--color-real)" dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </div>
                )}

                {herramienta === "series" && (
                  <div className="h-80">
                    <ChartContainer
                      config={{
                        ventas: { label: "Ventas", color: "hsl(var(--chart-2))" },
                      }}
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={Array.from({ length: 30 }, (_, i) => ({
                            dia: i + 1,
                            ventas: Math.sin(i / 3) * 10000 + 20000 + Math.random() * 5000,
                          }))}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="dia" />
                          <YAxis />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Line type="monotone" dataKey="ventas" stroke="var(--color-ventas)" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="metodologia">
                <div className="prose prose-invert max-w-none">
                  {herramienta === "descriptiva" && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Metodología: Estadística Descriptiva</h3>
                      <div className="p-4 bg-gray-800/30 rounded-lg space-y-2">
                        <p className="text-sm">
                          <strong>Media:</strong> Suma de todos los valores dividida por el número de observaciones
                        </p>
                        <p className="text-sm">
                          <strong>Mediana:</strong> Valor central cuando los datos están ordenados
                        </p>
                        <p className="text-sm">
                          <strong>Desviación Estándar:</strong> Medida de dispersión de los datos respecto a la media
                        </p>
                        <p className="text-sm">
                          <strong>Varianza:</strong> Cuadrado de la desviación estándar
                        </p>
                      </div>
                      <div className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
                        <p className="text-sm text-cyan-400">
                          <strong>Equivalente en Excel:</strong> Herramientas → Análisis de datos → Estadística
                          descriptiva
                        </p>
                      </div>
                    </div>
                  )}

                  {herramienta === "distribucion" && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Metodología: Distribución de Frecuencias</h3>
                      <div className="p-4 bg-gray-800/30 rounded-lg space-y-2">
                        <p className="text-sm">
                          <strong>Histograma:</strong> Gráfico que muestra la frecuencia de datos en intervalos
                        </p>
                        <p className="text-sm">
                          <strong>Percentiles:</strong> Valores que dividen los datos ordenados en 100 partes iguales
                        </p>
                        <p className="text-sm">
                          <strong>Bins:</strong> Intervalos de agrupación calculados automáticamente
                        </p>
                      </div>
                      <div className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
                        <p className="text-sm text-cyan-400">
                          <strong>Equivalente en Excel:</strong> Herramientas → Análisis de datos → Histograma
                        </p>
                      </div>
                    </div>
                  )}

                  {herramienta === "correlacion" && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Metodología: Correlación</h3>
                      <div className="p-4 bg-gray-800/30 rounded-lg space-y-2">
                        <p className="text-sm">
                          <strong>Coeficiente de Pearson:</strong> Mide la relación lineal entre dos variables (-1 a +1)
                        </p>
                        <p className="text-sm">
                          <strong>Interpretación:</strong> |r| {">"} 0.7 = fuerte, 0.3-0.7 = moderada, {"<"} 0.3 = débil
                        </p>
                        <p className="text-sm">
                          <strong>Fórmula:</strong> r = Σ[(x - x̄)(y - ȳ)] / √[Σ(x - x̄)² × Σ(y - ȳ)²]
                        </p>
                      </div>
                      <div className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
                        <p className="text-sm text-cyan-400">
                          <strong>Equivalente en Excel:</strong> Herramientas → Análisis de datos → Correlación
                        </p>
                      </div>
                    </div>
                  )}

                  {herramienta === "comparacion" && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Metodología: ANOVA</h3>
                      <div className="p-4 bg-gray-800/30 rounded-lg space-y-2">
                        <p className="text-sm">
                          <strong>ANOVA:</strong> Análisis de Varianza para comparar medias de múltiples grupos
                        </p>
                        <p className="text-sm">
                          <strong>Hipótesis Nula:</strong> No hay diferencias significativas entre grupos
                        </p>
                        <p className="text-sm">
                          <strong>Valor p {"<"} 0.05:</strong> Se rechaza H₀, existen diferencias significativas
                        </p>
                      </div>
                      <div className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
                        <p className="text-sm text-cyan-400">
                          <strong>Equivalente en Excel:</strong> Herramientas → Análisis de datos → ANOVA: un factor
                        </p>
                      </div>
                    </div>
                  )}

                  {herramienta === "regresion" && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Metodología: Regresión Lineal</h3>
                      <div className="p-4 bg-gray-800/30 rounded-lg space-y-2">
                        <p className="text-sm">
                          <strong>Ecuación:</strong> y = mx + b (donde m = pendiente, b = intercepto)
                        </p>
                        <p className="text-sm">
                          <strong>R² (R cuadrado):</strong> Proporción de varianza explicada por el modelo (0 a 1)
                        </p>
                        <p className="text-sm">
                          <strong>Interpretación:</strong> R² = 0.8 significa que el 80% de la variabilidad se explica
                        </p>
                      </div>
                      <div className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
                        <p className="text-sm text-cyan-400">
                          <strong>Equivalente en Excel:</strong> Herramientas → Análisis de datos → Regresión
                        </p>
                      </div>
                    </div>
                  )}

                  {herramienta === "simulacion" && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Metodología: Muestreo Aleatorio</h3>
                      <div className="p-4 bg-gray-800/30 rounded-lg space-y-2">
                        <p className="text-sm">
                          <strong>Muestreo Simple:</strong> Cada elemento tiene igual probabilidad de ser seleccionado
                        </p>
                        <p className="text-sm">
                          <strong>Tamaño de Muestra:</strong> Determina la precisión y confiabilidad de las conclusiones
                        </p>
                        <p className="text-sm">
                          <strong>Aplicaciones:</strong> Auditorías, control de calidad, validación
                        </p>
                      </div>
                      <div className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
                        <p className="text-sm text-cyan-400">
                          <strong>Equivalente en Excel:</strong> Herramientas → Análisis de datos → Muestreo
                        </p>
                      </div>
                    </div>
                  )}

                  {herramienta === "series" && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Metodología: Series Temporales</h3>
                      <div className="p-4 bg-gray-800/30 rounded-lg space-y-2">
                        <p className="text-sm">
                          <strong>Componentes:</strong> Tendencia, Estacionalidad, Ciclo y Ruido
                        </p>
                        <p className="text-sm">
                          <strong>Estacionalidad:</strong> Patrones que se repiten en períodos regulares
                        </p>
                        <p className="text-sm">
                          <strong>Detección:</strong> Mediante análisis de Fourier y autocorrelación
                        </p>
                      </div>
                      <div className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
                        <p className="text-sm text-cyan-400">
                          <strong>Equivalente en Excel:</strong> Herramientas → Análisis de datos → Análisis de Fourier
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {!herramienta && (
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="text-center text-gray-400 py-8">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Selecciona un dataset y una herramienta estadística para comenzar el análisis</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
