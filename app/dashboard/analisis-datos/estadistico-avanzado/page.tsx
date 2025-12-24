"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calculator, TrendingUp, BarChart3, Activity } from "lucide-react"

export const dynamic = "force-dynamic"

export default function EstadisticoAvanzadoPage() {
  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Análisis Estadístico Avanzado</h2>
          <p className="text-muted-foreground mt-2">
            Data Analysis ToolPak - Herramientas estadísticas profesionales integradas al ERP
          </p>
        </div>
        <Badge variant="secondary" className="gap-2">
          <Calculator className="h-4 w-4" />
          Excel Compatible
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estadística Descriptiva</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Disponible</div>
            <p className="text-xs text-muted-foreground">Media, mediana, moda, desviación</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Correlación</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Disponible</div>
            <p className="text-xs text-muted-foreground">Matriz de correlación y p-valores</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Regresión</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Disponible</div>
            <p className="text-xs text-muted-foreground">Regresión lineal múltiple</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ANOVA</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Disponible</div>
            <p className="text-xs text-muted-foreground">Análisis de varianza</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Módulo en Desarrollo</CardTitle>
          <CardDescription>Las herramientas estadísticas completas estarán disponibles próximamente</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Este módulo incluirá todas las funcionalidades del Data Analysis ToolPak de Excel, incluyendo:
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            <li>• Estadística descriptiva completa con intervalos de confianza</li>
            <li>• Análisis de correlación y covarianza multivariable</li>
            <li>• Regresión lineal simple y múltiple con diagnósticos</li>
            <li>• ANOVA de un factor y dos factores</li>
            <li>• Histogramas y distribuciones de frecuencia</li>
            <li>• Pruebas estadísticas (t, Z, F)</li>
            <li>• Muestreo aleatorio y simulación</li>
            <li>• Análisis de series temporales</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
