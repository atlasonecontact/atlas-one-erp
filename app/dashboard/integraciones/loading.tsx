import { RefreshCw } from "lucide-react"

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <RefreshCw className="w-8 h-8 animate-spin text-cyan-400" />
    </div>
  )
}
