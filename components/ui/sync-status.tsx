"use client"

import { useState } from "react"
import { Cloud, CloudOff, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { type SyncStatus } from "@/lib/offline/indexed-db"

interface SyncStatusIndicatorProps {
  syncStatus: SyncStatus | null
  onSync?: () => Promise<void>
  isOnline?: boolean
  showDetails?: boolean
  className?: string
}

export function SyncStatusIndicator({
  syncStatus,
  onSync,
  isOnline = true,
  showDetails = true,
  className,
}: SyncStatusIndicatorProps) {
  const [isSyncing, setIsSyncing] = useState(false)

  const pendingCount = syncStatus
    ? syncStatus.pendingSales + syncStatus.pendingStockMovements + syncStatus.pendingPurchases
    : 0

  const handleSync = async () => {
    if (!onSync || isSyncing) return
    setIsSyncing(true)
    try {
      await onSync()
    } finally {
      setIsSyncing(false)
    }
  }

  const getStatusColor = () => {
    if (!isOnline) return "text-orange-500"
    if (pendingCount > 0) return "text-yellow-500"
    return "text-green-500"
  }

  const getStatusIcon = () => {
    if (!isOnline) return <CloudOff className="h-4 w-4" />
    if (isSyncing) return <RefreshCw className="h-4 w-4 animate-spin" />
    if (pendingCount > 0) return <AlertCircle className="h-4 w-4" />
    return <Cloud className="h-4 w-4" />
  }

  const getStatusText = () => {
    if (!isOnline) return "Sin conexión"
    if (isSyncing) return "Sincronizando..."
    if (pendingCount > 0) return `${pendingCount} pendiente${pendingCount > 1 ? "s" : ""}`
    return "Sincronizado"
  }

  const formatLastSync = (timestamp: number | null) => {
    if (!timestamp) return "Nunca"
    const diff = Date.now() - timestamp
    if (diff < 60000) return "Hace un momento"
    if (diff < 3600000) return `Hace ${Math.floor(diff / 60000)} min`
    if (diff < 86400000) return `Hace ${Math.floor(diff / 3600000)} horas`
    return new Date(timestamp).toLocaleDateString("es-AR")
  }

  if (!showDetails) {
    return (
      <div 
        className={cn("flex items-center gap-1 cursor-default", getStatusColor(), className)}
        title={getStatusText()}
      >
        {getStatusIcon()}
        {pendingCount > 0 && (
          <Badge variant="secondary" className="h-5 px-1.5 text-xs">
            {pendingCount}
          </Badge>
        )}
      </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn("gap-2", getStatusColor(), className)}
        >
          {getStatusIcon()}
          <span className="hidden sm:inline">{getStatusText()}</span>
          {pendingCount > 0 && (
            <Badge variant="secondary" className="h-5 px-1.5 text-xs">
              {pendingCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-72 p-3" align="end">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Estado de Sincronización</h4>
            {isOnline ? (
              <Badge variant="outline" className="text-green-600 border-green-200">
                <Cloud className="h-3 w-3 mr-1" />
                Online
              </Badge>
            ) : (
              <Badge variant="outline" className="text-orange-600 border-orange-200">
                <CloudOff className="h-3 w-3 mr-1" />
                Offline
              </Badge>
            )}
          </div>

          {syncStatus && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Última sincronización:</span>
                <span>{formatLastSync(syncStatus.lastSync)}</span>
              </div>

              {syncStatus.pendingSales > 0 && (
                <div className="flex justify-between">
                  <span>Ventas pendientes:</span>
                  <Badge variant="secondary">{syncStatus.pendingSales}</Badge>
                </div>
              )}

              {syncStatus.pendingStockMovements > 0 && (
                <div className="flex justify-between">
                  <span>Mov. stock pendientes:</span>
                  <Badge variant="secondary">{syncStatus.pendingStockMovements}</Badge>
                </div>
              )}

              {syncStatus.pendingPurchases > 0 && (
                <div className="flex justify-between">
                  <span>Compras pendientes:</span>
                  <Badge variant="secondary">{syncStatus.pendingPurchases}</Badge>
                </div>
              )}

              {pendingCount === 0 && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Todo sincronizado</span>
                </div>
              )}
            </div>
          )}

          {onSync && isOnline && (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleSync}
              disabled={isSyncing || pendingCount === 0}
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Sincronizando...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sincronizar ahora
                </>
              )}
            </Button>
          )}

          {!isOnline && (
            <p className="text-xs text-muted-foreground text-center">
              Los datos se sincronizarán automáticamente cuando vuelva la conexión
            </p>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Compact version for mobile/header
export function SyncStatusBadge({ syncStatus, isOnline }: Pick<SyncStatusIndicatorProps, "syncStatus" | "isOnline">) {
  const pendingCount = syncStatus
    ? syncStatus.pendingSales + syncStatus.pendingStockMovements + syncStatus.pendingPurchases
    : 0

  if (!isOnline) {
    return (
      <Badge variant="outline" className="text-orange-600 border-orange-200 gap-1">
        <CloudOff className="h-3 w-3" />
        Offline
      </Badge>
    )
  }

  if (pendingCount > 0) {
    return (
      <Badge variant="outline" className="text-yellow-600 border-yellow-200 gap-1">
        <AlertCircle className="h-3 w-3" />
        {pendingCount} pendiente{pendingCount > 1 ? "s" : ""}
      </Badge>
    )
  }

  return (
    <Badge variant="outline" className="text-green-600 border-green-200 gap-1">
      <Cloud className="h-3 w-3" />
      Sync
    </Badge>
  )
}
