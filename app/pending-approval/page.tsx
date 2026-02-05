"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Clock, LogOut } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function PendingApprovalPage() {
    const router = useRouter()

    const handleLogout = async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push("/login")
    }

    return (
        <div className="min-h-screen bg-[#030712] flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-[#0a0f1a] border border-cyan-500/20 rounded-2xl p-8 text-center space-y-6">
                <div className="w-20 h-20 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto">
                    <Clock className="w-10 h-10 text-cyan-400" />
                </div>

                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-white">Cuenta Pendiente de Aprobación</h1>
                    <p className="text-gray-400">
                        Tu registro ha sido completado exitosamente. Un administrador revisará tu solicitud en breve.
                    </p>
                </div>

                <div className="bg-cyan-900/20 border border-cyan-500/10 rounded-lg p-4 text-sm text-cyan-200">
                    <p>Te notificaremos por email cuando tu cuenta sea activada.</p>
                </div>

                <div className="flex flex-col gap-3 pt-4">
                    <a href="mailto:atlasonecontact@gmail.com">
                        <Button variant="outline" className="w-full border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white">
                            Contactar Soporte
                        </Button>
                    </a>
                    <Button
                        variant="ghost"
                        onClick={handleLogout}
                        className="w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        Cerrar Sesión
                    </Button>
                </div>
            </div>
        </div>
    )
}
