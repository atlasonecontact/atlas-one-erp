"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Brain, AlertTriangle, Lightbulb } from "lucide-react"
import { Line } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { LineChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine } from "recharts"

// Mock data de predicciones
const prediccionesData = Array.from({ length: 30 }, (_, i) => ({
  dia: i + 1,
  real: i < 20 ? 15000 + Math.random() * 5000 + i * 500 : null,
  predicho: 15000 + Math.random() * 3000 + i * 500,
  limiteInferior: 13000 + Math.random() * 2000 + i * 400,
  limiteSuperior: 17000 + Math.random() * 4000 + i * 600,
}))

export default function AnalisisPredictivoPage() {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Brain className="w-8 h-8 text-purple-500" />
          Análisis Predictivo
        </h1>
        <p className="text-gray-400 mt-2">
          Predicciones basadas en IA y machine learning sobre el comportamiento futuro del negocio
        </p>
      </div>

      {/* KPIs Predictivos */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Predicción 7 días</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$425,680</div>
            <div className="text-sm text-green-400 flex items-center gap-1 mt-1">
              <TrendingUp className="w-4 h-4" />
              +12.5% vs período anterior
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Confianza del Modelo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94.2%</div>
            <Badge variant="outline" className="mt-1">
              Alto
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Error Promedio (MAPE)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.8%</div>
            <p className="text-xs text-gray-400 mt-1">Dentro del rango aceptable</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Alertas Activas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">3</div>
            <p className="text-xs text-gray-400 mt-1">Requieren atención</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Predicciones */}
      <Card>
        <CardHeader>
          <CardTitle>Predicción de Ventas - Próximos 30 Días</CardTitle>
          <CardDescription>Datos históricos vs predicción con intervalos de confianza del 95%</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ChartContainer
              config={{
                real: { label: "Ventas Reales", color: "hsl(var(--chart-1))" },
                predicho: { label: "Predicción", color: "hsl(var(--chart-5))" },
                limiteInferior: { label: "Límite Inferior", color: "hsl(var(--chart-3))" },
                limiteSuperior: { label: "Límite Superior", color: "hsl(var(--chart-3))" },
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={prediccionesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="dia" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ReferenceLine x={20} stroke="red" strokeDasharray="3 3" />
                  <Line
                    type="monotone"
                    dataKey="real"
                    stroke="var(--color-real)"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    connectNulls={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="predicho"
                    stroke="var(--color-predicho)"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                  />
                  <Line
                    type="monotone"
                    dataKey="limiteInferior"
                    stroke="var(--color-limiteInferior)"
                    strokeWidth={1}
                    strokeOpacity={0.3}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="limiteSuperior"
                    stroke="var(--color-limiteSuperior)"
                    strokeWidth={1}
                    strokeOpacity={0.3}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="p-3 bg-gray-800/30 rounded-lg">
              <p className="text-sm text-gray-400">Modelo Utilizado</p>
              <p className="font-semibold">ARIMA + Prophet</p>
            </div>
            <div className="p-3 bg-gray-800/30 rounded-lg">
              <p className="text-sm text-gray-400">Datos de Entrenamiento</p>
              <p className="font-semibold">180 días</p>
            </div>
            <div className="p-3 bg-gray-800/30 rounded-lg">
              <p className="text-sm text-gray-400">Última Actualización</p>
              <p className="font-semibold">Hace 2 horas</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alertas Inteligentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            Alertas Inteligentes
          </CardTitle>
          <CardDescription>Patrones detectados que requieren atención</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-4 border border-yellow-500/30 bg-yellow-500/10 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold">Caída Proyectada en Ventas</h4>
                  <p className="text-sm text-gray-400 mt-1">
                    Se detecta una posible caída del 15% en las ventas de la Sucursal 2 durante la próxima semana.
                    Considera reforzar el stock de productos más vendidos.
                  </p>
                  <Badge variant="outline" className="mt-2">
                    Probabilidad: 78%
                  </Badge>
                </div>
              </div>
            </div>

            <div className="p-4 border border-blue-500/30 bg-blue-500/10 rounded-lg">
              <div className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-blue-400 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold">Pico de Demanda Esperado</h4>
                  <p className="text-sm text-gray-400 mt-1">
                    El modelo predice un incremento del 25% en ventas este fin de semana. Asegura niveles de stock
                    adecuados.
                  </p>
                  <Badge variant="outline" className="mt-2">
                    Probabilidad: 92%
                  </Badge>
                </div>
              </div>
            </div>

            <div className="p-4 border border-red-500/30 bg-red-500/10 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold">Stock Crítico Proyectado</h4>
                  <p className="text-sm text-gray-400 mt-1">
                    3 productos alcanzarán nivel crítico de stock en los próximos 5 días según el patrón de consumo
                    actual.
                  </p>
                  <Badge variant="outline" className="mt-2">
                    Probabilidad: 85%
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recomendaciones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-cyan-400" />
            Recomendaciones Automáticas
          </CardTitle>
          <CardDescription>Acciones sugeridas basadas en el análisis predictivo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-gray-800/30 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-cyan-400">1</span>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">Optimizar Inventario</h4>
                <p className="text-sm text-gray-400 mt-1">
                  Aumenta el stock de bebidas en +30% para este fin de semana según patrones históricos
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-gray-800/30 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-cyan-400">2</span>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">Ajustar Personal</h4>
                <p className="text-sm text-gray-400 mt-1">
                  Programa +2 empleados para el turno tarde del sábado por aumento esperado de demanda
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-gray-800/30 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-cyan-400">3</span>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">Promoción Estratégica</h4>
                <p className="text-sm text-gray-400 mt-1">
                  Lanza promoción 2x1 en snacks los martes por baja demanda detectada en ese día
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métricas del Modelo */}
      <Card>
        <CardHeader>
          <CardTitle>Métricas de Precisión del Modelo</CardTitle>
          <CardDescription>Indicadores de calidad y confiabilidad de las predicciones</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 border border-gray-700 rounded-lg">
              <p className="text-sm text-gray-400">MAPE (Error %)</p>
              <p className="text-2xl font-bold text-green-400">4.8%</p>
              <p className="text-xs text-gray-500 mt-1">Excelente</p>
            </div>
            <div className="p-4 border border-gray-700 rounded-lg">
              <p className="text-sm text-gray-400">R² Score</p>
              <p className="text-2xl font-bold">0.942</p>
              <p className="text-xs text-gray-500 mt-1">Muy bueno</p>
            </div>
            <div className="p-4 border border-gray-700 rounded-lg">
              <p className="text-sm text-gray-400">MAE (Error Abs.)</p>
              <p className="text-2xl font-bold">$1,245</p>
              <p className="text-xs text-gray-500 mt-1">Bajo</p>
            </div>
            <div className="p-4 border border-gray-700 rounded-lg">
              <p className="text-sm text-gray-400">RMSE</p>
              <p className="text-2xl font-bold">$1,890</p>
              <p className="text-xs text-gray-500 mt-1">Aceptable</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
