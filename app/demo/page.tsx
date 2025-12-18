"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function DemoPage() {
  const router = useRouter()

  useEffect(() => {
    // Set demo user and redirect to dashboard
    localStorage.setItem(
      "atlasone_user",
      JSON.stringify({
        email: "demo@atlasone.com",
        name: "Usuario Demo",
        role: "Admin",
        business: "Minimarket Demo",
      }),
    )
    router.push("/dashboard")
  }, [router])

  return (
    <div className="min-h-screen bg-[#030712] flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400">Cargando demo...</p>
      </div>
    </div>
  )
}
