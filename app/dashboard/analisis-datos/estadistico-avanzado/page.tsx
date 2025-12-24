"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Calculator,
  TrendingUp,
  BarChart3,
  Activity,
  PieChart,
  Scale,
  Sigma,
  GripVertical,
  Target,
  Database,
} from "lucide-react"

export const dynamic = "force-dynamic"

export default function EstadisticoAvanzadoPage() {
  const [selectedDataset, setSelectedDataset] = useState("ventas")
  const [selectedTool, setSelectedTool] = useState("descriptiva")

  // Datasets disponibles
  const datasets = {
    ventas: { name: "Ventas", samples: 365, icon: TrendingUp },
    productos: { name: "Productos", samples: 150, icon: Database },
    clientes: { name: "Clientes", samples: 287, icon: Target },
    stock: { name: "Stock", samples: 150, icon: GripVertical },
    pagos: { name: "Pagos", samples: 1250, icon: Calculator },
    sucursales: { name: "Sucursales", samples: 8, icon: Target },
  }

  // Herramientas estadísticas (Data Analysis ToolPak de Excel)
  const herramientas = {
    descriptiva: {
      name: "Estadística Descriptiva",
      description: "Media, mediana, moda, desv. estándar, varianza",
      icon: Calculator,
    },
    histograma: {
      name: "Histograma y Frecuencias",
      description: "Distribución, percentiles, intervalos",
      icon: BarChart3,
    },
    correlacion: {
      name: "Correlación y Covarianza",
      description: "Matriz de correlación, relaciones entre variables",
      icon: Activity,
    },
    regresion: {
      name: "Regresión Lineal",
      description: "Regresión simple y múltiple, R², coeficientes",
      icon: TrendingUp,
    },
    anova: {
      name: "ANOVA (Análisis de Varianza)",
      description: "Comparación de medias, un factor y dos factores",
      icon: Scale,
    },
    pruebas: {
      name: "Pruebas Estadísticas",
      description: "Prueba t, Z, F para muestras",
      icon: Target,
    },
    muestreo: {
      name: "Muestreo y Simulación",
      description: "Muestreo aleatorio, stress testing",
      icon: PieChart,
    },
    series: {
      name: "Series Temporales",
      description: "Estacionalidad, ciclos, tendencias",
      icon: Sigma,
    },
  }

  // Mock data para estadísticas descriptivas
  const estadisticasDescriptivas = {
    media: 125340.5,
    mediana: 118900.0,
    moda: 115000.0,
    desviacion: 23450.75,
    varianza: 549940050.56,
    minimo: 85600.0,
    maximo: 178900.0,
    rango: 93300.0,
    coeficienteVariacion: 18.7,
    asimetria: 0.42,
    curtosis: -0.18,
    q1: 105200.0,
    q3: 145800.0,
    iqr: 40600.0,
    errorEstandar: 3875.12,
    intervaloConfianza95Min: 117430.26,
    intervaloConfianza95Max: 133250.74,
  }

  // Mock data para correlación
  const matrizCorrelacion = [
    { var1: "Precio", var2: "Cantidad", r: -0.72, p: 0.001 },
    { var1: "Precio", var2: "Ventas", r: 0.15, p: 0.125 },
    { var1: "Cantidad", var2: "Ventas", r: 0.89, p: 0.0 },
  ]

  // Mock data para regresión
  const regresion = {
    r2: 0.847,
    r2Ajustado: 0.835,
    errorEstandar: 5234.56,
    n: 365,
    coeficientes: [
      { nombre: "Intersección", valor: 45678.9, error: 2345.67, t: 19.48, p: 0.0 },
      { nombre: "Precio", valor: -1234.56, error: 234.89, t: -5.26, p: 0.0 },
      { nombre: "Cantidad", valor: 89.45, error: 12.34, t: 7.25, p: 0.0 },
    ],
  }

  // Mock data para ANOVA
  const anova = {
    gruposFactorA: 4,
    gruposFactorB: 3,
    fStatistic: 12.45,
    pValue: 0.0003,
    significancia: true,
    sumariosGrupos: [
      { grupo: "Sucursal A", n: 90, media: 134500, desv: 18900 },
      { grupo: "Sucursal B", n: 92, media: 118700, desv: 21200 },
      { grupo: "Sucursal C", n: 88, media: 142300, desv: 19500 },
      { grupo: "Sucursal D", n: 95, media: 125600, desv: 20100 },
    ],
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
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

      {/* Selectores de Dataset y Herramienta */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">1. Seleccionar Dataset</CardTitle>
            <CardDescription>Elige los datos a analizar</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedDataset} onValueChange={setSelectedDataset}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(datasets).map(([key, dataset]) => {
                  const Icon = dataset.icon
                  return (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span>{dataset.name}</span>
                        <span className="text-xs text-muted-foreground">({dataset.samples} registros)</span>
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">2. Seleccionar Herramienta</CardTitle>
            <CardDescription>Tipo de análisis estadístico</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedTool} onValueChange={setSelectedTool}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(herramientas).map(([key, tool]) => {
                  const Icon = tool.icon
                  return (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span>{tool.name}</span>
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      {/* Contenido según herramienta seleccionada */}
      <Tabs value={selectedTool} onValueChange={setSelectedTool} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
          {Object.entries(herramientas).map(([key, tool]) => (
            <TabsTrigger key={key} value={key} className="text-xs">
              {tool.name.split(" ")[0]}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* A. ESTADÍSTICA DESCRIPTIVA */}
        <TabsContent value="descriptiva" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Estadística Descriptiva Completa</CardTitle>
              <CardDescription>Medidas de tendencia central, dispersión y forma</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
                {/* Tendencia Central */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm text-muted-foreground">Tendencia Central</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Media:</span>
                      <span className="font-mono">${estadisticasDescriptivas.media.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Mediana:</span>
                      <span className="font-mono">${estadisticasDescriptivas.mediana.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Moda:</span>
                      <span className="font-mono">${estadisticasDescriptivas.moda.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Dispersión */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm text-muted-foreground">Dispersión</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Desv. Estándar:</span>
                      <span className="font-mono">{estadisticasDescriptivas.desviacion.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Varianza:</span>
                      <span className="font-mono">{estadisticasDescriptivas.varianza.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Coef. Variación:</span>
                      <span className="font-mono">{estadisticasDescriptivas.coeficienteVariacion}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Error Estándar:</span>
                      <span className="font-mono">{estadisticasDescriptivas.errorEstandar.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Rango */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm text-muted-foreground">Rango y Cuartiles</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Mínimo:</span>
                      <span className="font-mono">${estadisticasDescriptivas.minimo.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Q1 (25%):</span>
                      <span className="font-mono">${estadisticasDescriptivas.q1.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Q3 (75%):</span>
                      <span className="font-mono">${estadisticasDescriptivas.q3.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Máximo:</span>
                      <span className="font-mono">${estadisticasDescriptivas.maximo.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Rango:</span>
                      <span className="font-mono">${estadisticasDescriptivas.rango.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>IQR:</span>
                      <span className="font-mono">${estadisticasDescriptivas.iqr.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Forma */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm text-muted-foreground">Forma de la Distribución</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Asimetría:</span>
                      <span className="font-mono">{estadisticasDescriptivas.asimetria}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Curtosis:</span>
                      <span className="font-mono">{estadisticasDescriptivas.curtosis}</span>
                    </div>
                    <div className="flex justify-between flex-col items-start gap-1 mt-2">
                      <span>IC 95%:</span>
                      <span className="font-mono text-xs">
                        [{estadisticasDescriptivas.intervaloConfianza95Min.toLocaleString()},{" "}
                        {estadisticasDescriptivas.intervaloConfianza95Max.toLocaleString()}]
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Metodología</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>
                <strong>Media:</strong> Promedio aritmético de todos los valores
              </p>
              <p>
                <strong>Mediana:</strong> Valor central que divide la distribución en dos partes iguales
              </p>
              <p>
                <strong>Desviación Estándar:</strong> Mide la dispersión promedio de los datos respecto a la media
              </p>
              <p>
                <strong>Coeficiente de Variación:</strong> Desviación estándar relativa (σ/μ × 100)
              </p>
              <p>
                <strong>Asimetría:</strong> Mide la simetría de la distribución (0 = simétrica, {">"}0 = sesgada
                derecha, {"<"}0 = sesgada izquierda)
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* B. HISTOGRAMA Y FRECUENCIAS */}
        <TabsContent value="histograma">
          <Card>
            <CardHeader>
              <CardTitle>Distribución de Frecuencias</CardTitle>
              <CardDescription>Análisis de la distribución de datos por intervalos</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Histograma interactivo con bins personalizables - En desarrollo</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* C. CORRELACIÓN */}
        <TabsContent value="correlacion" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Matriz de Correlación</CardTitle>
              <CardDescription>Análisis de relaciones lineales entre variables (r de Pearson)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {matrizCorrelacion.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <span className="font-medium">{item.var1}</span>
                      <span className="mx-2">↔</span>
                      <span className="font-medium">{item.var2}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Correlación</div>
                        <div className="font-mono font-bold">{item.r.toFixed(3)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">p-valor</div>
                        <div className="font-mono">{item.p.toFixed(3)}</div>
                      </div>
                      <Badge variant={Math.abs(item.r) > 0.7 ? "default" : "secondary"}>
                        {Math.abs(item.r) > 0.7 ? "Fuerte" : Math.abs(item.r) > 0.4 ? "Moderada" : "Débil"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Interpretación</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>
                <strong>r = 1:</strong> Correlación positiva perfecta
              </p>
              <p>
                <strong>r = -1:</strong> Correlación negativa perfecta
              </p>
              <p>
                <strong>r = 0:</strong> Sin correlación lineal
              </p>
              <p>
                <strong>p-valor {"<"} 0.05:</strong> Correlación estadísticamente significativa
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* D. REGRESIÓN */}
        <TabsContent value="regresion" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Regresión Lineal Múltiple</CardTitle>
              <CardDescription>Modelado de relaciones lineales entre variables</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">R²</div>
                    <div className="text-2xl font-bold">{(regresion.r2 * 100).toFixed(1)}%</div>
                    <div className="text-xs text-muted-foreground">Varianza explicada</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">R² Ajustado</div>
                    <div className="text-2xl font-bold">{(regresion.r2Ajustado * 100).toFixed(1)}%</div>
                    <div className="text-xs text-muted-foreground">Ajustado por predictores</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Error Estándar</div>
                    <div className="text-2xl font-bold">{regresion.errorEstandar.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">De la estimación</div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Coeficientes de Regresión</h3>
                  <div className="space-y-2">
                    {regresion.coeficientes.map((coef, idx) => (
                      <div key={idx} className="grid grid-cols-5 gap-4 p-2 rounded border text-sm">
                        <div className="font-medium">{coef.nombre}</div>
                        <div className="font-mono text-right">{coef.valor.toFixed(2)}</div>
                        <div className="font-mono text-right text-muted-foreground">±{coef.error.toFixed(2)}</div>
                        <div className="font-mono text-right">t={coef.t.toFixed(2)}</div>
                        <div className="text-right">
                          <Badge variant={coef.p < 0.05 ? "default" : "secondary"}>p={coef.p.toFixed(3)}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ecuación del Modelo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-muted rounded-lg font-mono text-sm">
                y = {regresion.coeficientes[0].valor.toFixed(2)} + ({regresion.coeficientes[1].valor.toFixed(2)}) ×
                Precio + ({regresion.coeficientes[2].valor.toFixed(2)}) × Cantidad
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* E. ANOVA */}
        <TabsContent value="anova" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Análisis de Varianza (ANOVA)</CardTitle>
              <CardDescription>Comparación de medias entre grupos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Estadístico F</div>
                    <div className="text-2xl font-bold">{anova.fStatistic.toFixed(2)}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">p-valor</div>
                    <div className="text-2xl font-bold">{anova.pValue.toFixed(4)}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Resultado</div>
                    <Badge variant={anova.significancia ? "default" : "secondary"} className="text-sm">
                      {anova.significancia ? "Significativo" : "No Significativo"}
                    </Badge>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Estadísticas por Grupo</h3>
                  <div className="space-y-2">
                    {anova.sumariosGrupos.map((grupo, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                        <span className="font-medium">{grupo.grupo}</span>
                        <div className="flex gap-6 text-sm">
                          <div>
                            <span className="text-muted-foreground">n:</span> {grupo.n}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Media:</span> ${grupo.media.toLocaleString()}
                          </div>
                          <div>
                            <span className="text-muted-foreground">σ:</span> {grupo.desv.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Interpretación</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>
                <strong>H₀:</strong> Las medias de todos los grupos son iguales
              </p>
              <p>
                <strong>H₁:</strong> Al menos una media es diferente
              </p>
              <p>
                <strong>Conclusión:</strong>{" "}
                {anova.pValue < 0.05
                  ? "Rechazamos H₀. Existen diferencias significativas entre los grupos."
                  : "No rechazamos H₀. No hay evidencia de diferencias significativas."}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* F. PRUEBAS ESTADÍSTICAS */}
        <TabsContent value="pruebas">
          <Card>
            <CardHeader>
              <CardTitle>Pruebas de Hipótesis</CardTitle>
              <CardDescription>Prueba t, Z, F para comparación de muestras</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Pruebas t de Student, Z, F - En desarrollo</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* G. MUESTREO */}
        <TabsContent value="muestreo">
          <Card>
            <CardHeader>
              <CardTitle>Muestreo y Simulación</CardTitle>
              <CardDescription>Muestreo aleatorio, bootstrap, simulación Monte Carlo</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Herramientas de muestreo y simulación - En desarrollo</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* H. SERIES TEMPORALES */}
        <TabsContent value="series">
          <Card>
            <CardHeader>
              <CardTitle>Análisis de Series Temporales</CardTitle>
              <CardDescription>Estacionalidad, tendencias, ciclos, análisis de Fourier</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Análisis temporal clásico - En desarrollo</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
