"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { Brain, TrendingUp, AlertTriangle, Target, Zap } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function AnalisisPredictivoPage() {
  // Datos históricos y predicciones
  const prediccionVentas = [
    { mes: "Jul", historico: 2800, prediccion: null, limite_superior: null, limite_inferior: null },
    { mes: "Ago", historico: 3100, prediccion: null, limite_superior: null, limite_inferior: null },
    { mes: "Sep", historico: 2900, prediccion: null, limite_superior: null, limite_inferior: null },
    { mes: "Oct", historico: 3400, prediccion: null, limite_superior: null, limite_inferior: null },
    { mes: "Nov", historico: 3200, prediccion: null, limite_superior: null, limite_inferior: null },
    { mes: "Dic", historico: 3600, prediccion: 3600, limite_superior: 3900, limite_inferior: 3300 },
    { mes: "Ene 2026", historico: null, prediccion: 3750, limite_superior: 4100, limite_inferior: 3400 },
    { mes: "Feb 2026", historico: null, prediccion: 3900, limite_superior: 4300, limite_inferior: 3500 },
    { mes: "Mar 2026", historico: null, prediccion: 4100, limite_superior: 4550, limite_inferior: 3650 },
    { mes: "Abr 2026", historico: null, prediccion: 4300, limite_superior: 4800, limite_inferior: 3800 },
  ]

  const demandaProductos = [
    { semana: "S1", producto_a: 120, producto_b: 85, producto_c: 95 },
    { semana: "S2", producto_a: 135, producto_b: 90, producto_c: 100 },
    { semana: "S3", producto_a: 145, producto_b: 88, producto_c: 110 },
    { semana: "S4", producto_a: 155, producto_b: 92, producto_c: 115 },
    { semana: "S5 (Pred)", producto_a: 165, producto_b: 95, producto_c: 120 },
    { semana: "S6 (Pred)", producto_a: 175, producto_b: 98, producto_c: 125 },
  ]

  const alertas = [
    {
      tipo: "Demanda Alta",
      producto: "Bebida Energética XL",
      probabilidad: "87%",
      accion: "Aumentar stock en 40%",
      prioridad: "alta",
    },
    {
      tipo: "Tendencia Bajista",
      producto: "Snack Salado Mix",
      probabilidad: "72%",
      accion: "Reducir pedidos próxima semana",
      prioridad: "media",
    },
    {
      tipo: "Pico Estacional",
      producto: "Helados Premium",
      probabilidad: "94%",
      accion: "Preparar inventario para verano",
      prioridad: "alta",
    },
    {
      tipo: "Optimización",
      producto: "Café Express",
      probabilidad: "65%",
      accion: "Ajustar precio promocional",
      prioridad: "baja",
    },
  ]

  const metricas = [
    {
      titulo: "Precisión del Modelo",
      valor: "94.2%",
      descripcion: "Últimas 100 predicciones",
      icono: Target,
      color: "text-emerald-500",
    },
    {
      titulo: "Tendencia Proyectada",
      valor: "+18.5%",
      descripcion: "Crecimiento próximos 3 meses",
      icono: TrendingUp,
      color: "text-blue-500",
    },
    {
      titulo: "Alertas Activas",
      valor: "12",
      descripcion: "Requieren acción inmediata",
      icono: AlertTriangle,
      color: "text-orange-500",
    },
    {
      titulo: "Confianza IA",
      valor: "91%",
      descripcion: "Nivel de certeza promedio",
      icono: Brain,
      color: "text-purple-500",
    },
  ]

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Análisis Predictivo</h1>
        <p className="text-muted-foreground mt-2">
          Predicciones basadas en IA y machine learning para optimizar tu negocio
        </p>
      </div>

      {/* Métricas predictivas */}
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

      {/* Predicción de Ventas */}
      <Card>
        <CardHeader>
          <CardTitle>Predicción de Ventas con Intervalos de Confianza</CardTitle>
          <CardDescription>Proyección basada en datos históricos y tendencias estacionales</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={prediccionVentas}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="limite_superior"
                stroke="transparent"
                fill="#6366f1"
                fillOpacity={0.1}
                name="Límite Superior"
              />
              <Area
                type="monotone"
                dataKey="limite_inferior"
                stroke="transparent"
                fill="#6366f1"
                fillOpacity={0.1}
                name="Límite Inferior"
              />
              <Line
                type="monotone"
                dataKey="historico"
                stroke="#10b981"
                strokeWidth={3}
                name="Ventas Históricas"
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="prediccion"
                stroke="#6366f1"
                strokeWidth={3}
                strokeDasharray="5 5"
                name="Predicción"
                dot={{ r: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Predicción de Demanda por Producto */}
      <Card>
        <CardHeader>
          <CardTitle>Predicción de Demanda por Producto</CardTitle>
          <CardDescription>Tendencias y proyecciones para los próximos 15 días</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={demandaProductos}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="semana" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="producto_a" stroke="#f59e0b" strokeWidth={2} name="Producto A" />
              <Line type="monotone" dataKey="producto_b" stroke="#8b5cf6" strokeWidth={2} name="Producto B" />
              <Line type="monotone" dataKey="producto_c" stroke="#ec4899" strokeWidth={2} name="Producto C" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Alertas y Recomendaciones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Alertas y Recomendaciones IA
          </CardTitle>
          <CardDescription>Acciones sugeridas basadas en análisis predictivo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {alertas.map((alerta, index) => (
              <div
                key={index}
                className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge
                      variant={
                        alerta.prioridad === "alta"
                          ? "destructive"
                          : alerta.prioridad === "media"
                            ? "default"
                            : "secondary"
                      }
                    >
                      {alerta.prioridad === "alta" ? "Alta" : alerta.prioridad === "media" ? "Media" : "Baja"}
                    </Badge>
                    <h4 className="font-semibold">{alerta.tipo}</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{alerta.producto}</p>
                  <p className="text-sm font-medium text-primary">{alerta.accion}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{alerta.probabilidad}</div>
                  <p className="text-xs text-muted-foreground">Confianza</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Explicación del Modelo */}
      <Card>
        <CardHeader>
          <CardTitle>Acerca del Modelo Predictivo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Algoritmos Utilizados</h4>
            <p className="text-sm text-muted-foreground">
              El sistema utiliza una combinación de modelos ARIMA para series temporales, redes neuronales LSTM para
              capturar patrones complejos, y Random Forest para clasificación de alertas. Los modelos se entrenan
              continuamente con nuevos datos para mejorar su precisión.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Factores Considerados</h4>
            <p className="text-sm text-muted-foreground">
              Las predicciones incorporan: estacionalidad, tendencias históricas, eventos especiales, condiciones
              climáticas, días festivos, promociones anteriores, y patrones de comportamiento del consumidor.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Actualización del Modelo</h4>
            <p className="text-sm text-muted-foreground">
              El modelo se actualiza automáticamente cada 24 horas con los nuevos datos de ventas, permitiendo ajustar
              las predicciones y mantener una alta precisión a lo largo del tiempo.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
