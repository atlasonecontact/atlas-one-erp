"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Brain, TrendingUp, AlertTriangle, Lightbulb, Target } from "lucide-react"

export const dynamic = "force-dynamic"

export default function PredictivoPage() {
  const [modeloActivo, setModeloActivo] = useState("arima")

  const predicciones = {
    proximoMes: 145600,
    confianzaBaja: 138200,
    confianzaAlta: 153000,
    precision: 94.5,
  }

  const alertas = [
    {
      tipo: "warning",
      mensaje: "Se detecta tendencia a la baja en Categoría Bebidas (-8.3%)",
      prioridad: "alta",
    },
    {
      tipo: "success",
      mensaje: "Oportunidad de crecimiento en Categoría Snacks (+12.7%)",
      prioridad: "media",
    },
    {
      tipo: "info",
      mensaje: "Patrón estacional detectado: pico en fin de semana",
      prioridad: "baja",
    },
  ]

  const recomendaciones = [
    "Incrementar stock de productos de alta rotación en un 15%",
    "Ajustar precios en categorías con baja demanda predicha",
    "Programar campañas promocionales para productos con tendencia negativa",
  ]

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Análisis Predictivo</h2>
          <p className="text-muted-foreground mt-2">
            Predicciones inteligentes basadas en IA para optimizar tu negocio
          </p>
        </div>
        <Badge variant="secondary" className="gap-2">
          <Brain className="h-4 w-4" />
          IA Predictiva
        </Badge>
      </div>

      {/* Selector de Modelo */}
      <Card>
        <CardHeader>
          <CardTitle>Modelo Predictivo Activo</CardTitle>
          <CardDescription>Selecciona el algoritmo de predicción</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              variant={modeloActivo === "arima" ? "default" : "outline"}
              className="h-16 flex-col"
              onClick={() => setModeloActivo("arima")}
            >
              <span className="font-semibold">ARIMA</span>
              <span className="text-xs text-muted-foreground">Series temporales</span>
            </Button>
            <Button
              variant={modeloActivo === "prophet" ? "default" : "outline"}
              className="h-16 flex-col"
              onClick={() => setModeloActivo("prophet")}
            >
              <span className="font-semibold">Prophet</span>
              <span className="text-xs text-muted-foreground">Meta AI</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Predicciones */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Predicción Próximo Mes</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${predicciones.proximoMes.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Ventas estimadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Intervalo Bajo</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${predicciones.confianzaBaja.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">95% confianza</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Intervalo Alto</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${predicciones.confianzaAlta.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">95% confianza</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Precisión Modelo</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{predicciones.precision}%</div>
            <p className="text-xs text-muted-foreground">Exactitud histórica</p>
          </CardContent>
        </Card>
      </div>

      {/* Alertas Inteligentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Alertas Inteligentes
          </CardTitle>
          <CardDescription>Insights automáticos detectados por el modelo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {alertas.map((alerta, index) => (
              <div key={index} className="flex items-start gap-3 p-3 rounded-lg border">
                <Badge
                  variant={
                    alerta.tipo === "warning" ? "destructive" : alerta.tipo === "success" ? "default" : "secondary"
                  }
                >
                  {alerta.prioridad}
                </Badge>
                <p className="text-sm flex-1">{alerta.mensaje}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recomendaciones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Recomendaciones Accionables
          </CardTitle>
          <CardDescription>Acciones sugeridas basadas en las predicciones</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {recomendaciones.map((recomendacion, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="text-primary">•</span>
                <span className="text-sm">{recomendacion}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
