"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Trash2, CheckCircle, HelpCircle, Info, XCircle } from "lucide-react"

type ConfirmDialogVariant = "danger" | "warning" | "info" | "success"

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: ConfirmDialogVariant
  isLoading?: boolean
  icon?: React.ReactNode
}

const variantStyles: Record<ConfirmDialogVariant, {
  iconBg: string
  iconColor: string
  buttonBg: string
  buttonHover: string
  Icon: typeof AlertTriangle
}> = {
  danger: {
    iconBg: "bg-red-500/10",
    iconColor: "text-red-400",
    buttonBg: "bg-red-500",
    buttonHover: "hover:bg-red-600",
    Icon: Trash2,
  },
  warning: {
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-400",
    buttonBg: "bg-amber-500",
    buttonHover: "hover:bg-amber-600",
    Icon: AlertTriangle,
  },
  info: {
    iconBg: "bg-cyan-500/10",
    iconColor: "text-cyan-400",
    buttonBg: "bg-cyan-500",
    buttonHover: "hover:bg-cyan-400",
    Icon: Info,
  },
  success: {
    iconBg: "bg-green-500/10",
    iconColor: "text-green-400",
    buttonBg: "bg-green-500",
    buttonHover: "hover:bg-green-600",
    Icon: CheckCircle,
  },
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "danger",
  isLoading = false,
  icon,
}: ConfirmDialogProps) {
  const styles = variantStyles[variant]
  const IconComponent = styles.Icon

  const handleConfirm = async () => {
    await onConfirm()
    if (!isLoading) {
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px] bg-[#0a0f1a] border-cyan-500/20 p-0 overflow-hidden">
        <div className="p-6">
          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className={`w-16 h-16 rounded-full ${styles.iconBg} flex items-center justify-center`}>
              {icon || <IconComponent className={`w-8 h-8 ${styles.iconColor}`} />}
            </div>
          </div>

          {/* Content */}
          <div className="text-center mb-6">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-white mb-2">
                {title}
              </DialogTitle>
            </DialogHeader>
            <p className="text-gray-400 text-sm leading-relaxed">
              {description}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800 bg-transparent"
            >
              {cancelText}
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={isLoading}
              className={`flex-1 ${styles.buttonBg} ${styles.buttonHover} text-white font-medium`}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Procesando...
                </span>
              ) : (
                confirmText
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
