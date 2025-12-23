"use client"

import { Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function LibroMayorPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Libro Mayor</h1>
        <p className="text-gray-400">Consolida los movimientos por cuenta</p>
      </div>

      <Card className="bg-[#0a0f1a] border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Clock className="w-5 h-5 text-amber-400" />
            Próximamente
          </CardTitle>
          <CardDescription>Exportes, filtros y conciliación automática en camino.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-300 text-sm">Avísanos si necesitas un formato específico.</p>
          <Button variant="outline" className="border-amber-500/40 text-amber-200 hover:bg-amber-500/10" asChild>
            <a href="mailto:hola@atlas.one?subject=Libro%20mayor%20-%20demo">Avisame cuando esté</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
