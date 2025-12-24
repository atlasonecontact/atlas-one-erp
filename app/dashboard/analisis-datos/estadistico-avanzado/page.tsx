"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calculator, TrendingUp, BarChart3, Activity } from "lucide-react"

export const dynamic = "force-dynamic"

export default function EstadisticoAvanzadoPage() {
  const [selectedDataset, setSelectedDataset] = useState("ventas")

  // Mock data simplificada
  const datasets = {
    ventas: { name: "Ventas Mensuales", samples: 12 },
    productos: { name: "Productos", samples: 150 },
    clientes: { name: "Clientes", samples: 87 },
  }

  const estadisticasBasicas = {
    media: 125340.5,
    mediana: 118900.0,
    desviacion: 23450.75,
    varianza: 549940050.56,
    minimo: 85600.0,
    maximo: 178900.0,
    rango: 93300.0,
    coeficienteVariacion: 0.187,
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Análisis Estadístico Avanzado</h2>
          <p className="text-muted-foreground mt-2">
            Herramientas de análisis estadístico profesional para tus datos de negocio
          </p>
        </div>
        <Badge variant="secondary" className="gap-2">
          <Calculator className="h-4 w-4" />
          Data Analysis ToolPak
        </Badge>
      </div>

      {/* Selector de Dataset */}
      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Dataset</CardTitle>
          <CardDescription>Elige el conjunto de datos que deseas analizar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(datasets).map(([key, dataset]) => (
              <Button
                key={key}
                variant={selectedDataset === key ? "default" : "outline"}
                className="h-20 flex-col"
                onClick={() => setSelectedDataset(key)}
              >
                <span className="font-semibold">{dataset.name}</span>
                <span className="text-sm text-muted-foreground">{dataset.samples} muestras</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="descriptiva" className="space-y-4">
        <TabsList>
          <TabsTrigger value="descriptiva">Estadística Descriptiva</TabsTrigger>
          <TabsTrigger value="correlacion">Correlación</TabsTrigger>
          <TabsTrigger value="regresion">Regresión</TabsTrigger>
          <TabsTrigger value="anova">ANOVA</TabsTrigger>
        </TabsList>

        <TabsContent value="descriptiva" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Media</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${estadisticasBasicas.media.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Promedio del dataset</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Mediana</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${estadisticasBasicas.mediana.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Valor central</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Desv. Estándar</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${estadisticasBasicas.desviacion.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Dispersión de datos</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rango</CardTitle>
                <Calculator className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${estadisticasBasicas.rango.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Máx - Mín</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Estadísticas Detalladas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium">Varianza</span>
                  <span>{estadisticasBasicas.varianza.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium">Valor Mínimo</span>
                  <span>${estadisticasBasicas.minimo.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium">Valor Máximo</span>
                  <span>${estadisticasBasicas.maximo.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Coeficiente de Variación</span>
                  <span>{(estadisticasBasicas.coeficienteVariacion * 100).toFixed(2)}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="correlacion">
          <Card>
            <CardHeader>
              <CardTitle>Análisis de Correlación</CardTitle>
              <CardDescription>Identifica relaciones entre variables del dataset</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                El análisis de correlación estará disponible próximamente con datos reales del ERP.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="regresion">
          <Card>
            <CardHeader>
              <CardTitle>Regresión Lineal</CardTitle>
              <CardDescription>Modela relaciones lineales entre variables</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                El análisis de regresión estará disponible próximamente con datos reales del ERP.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="anova">
          <Card>
            <CardHeader>
              <CardTitle>Análisis de Varianza (ANOVA)</CardTitle>
              <CardDescription>Compara medias entre múltiples grupos</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                El análisis ANOVA estará disponible próximamente con datos reales del ERP.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
