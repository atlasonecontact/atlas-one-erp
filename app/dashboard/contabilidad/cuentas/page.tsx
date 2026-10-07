"use client"

import { Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function CuentasPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Plan de Cuentas</h1>
        <p className="text-muted-foreground">Mapea las cuentas contables del negocio</p>
      </div>

      <Card className="bg-card border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Clock className="w-5 h-5 text-amber-400" />
            Próximamente
          </CardTitle>
          <CardDescription>Estamos terminando esta sección. Déjanos tu necesidad y te avisamos.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">
            Subiremos el plan de cuentas, mapeo automático y exportes a AFIP/contadores.
          </p>
          <Button variant="outline" className="border-amber-500/40 text-amber-200 hover:bg-amber-500/10" asChild>
            <a href="mailto:hola@atlas.one?subject=Plan%20de%20cuentas%20-%20demo">Avisame cuando esté listo</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
