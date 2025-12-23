"use client"

import { Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function BalancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Balance / EECC</h1>
        <p className="text-gray-400">Estados financieros listos para tu contador</p>
      </div>

      <Card className="bg-[#0a0f1a] border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Clock className="w-5 h-5 text-amber-400" />
            Próximamente
          </CardTitle>
          <CardDescription>Mostraremos balance general, resultados y movimientos clave.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-300 text-sm">¿Tenés un formato de AFIP/IGJ/contable? Enviánoslo.</p>
          <Button variant="outline" className="border-amber-500/40 text-amber-200 hover:bg-amber-500/10" asChild>
            <a href="mailto:hola@atlas.one?subject=Balance%20-%20demo">Quiero enterarme</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
