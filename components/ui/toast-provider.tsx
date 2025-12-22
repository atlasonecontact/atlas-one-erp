"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import { CheckCircle, XCircle, AlertCircle, Info, X } from "lucide-react"

type ToastType = "success" | "error" | "warning" | "info"

interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
}

interface ToastContextType {
  showToast: (type: ToastType, title: string, message?: string, duration?: number) => void
  success: (title: string, message?: string) => void
  error: (title: string, message?: string) => void
  warning: (title: string, message?: string) => void
  info: (title: string, message?: string) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    // Return a fallback that uses alert() if provider not found
    return {
      showToast: (_type: ToastType, title: string, message?: string) => {
        alert(`${title}${message ? `\n${message}` : ""}`)
      },
      success: (title: string, message?: string) => alert(`✅ ${title}${message ? `\n${message}` : ""}`),
      error: (title: string, message?: string) => alert(`❌ ${title}${message ? `\n${message}` : ""}`),
      warning: (title: string, message?: string) => alert(`⚠️ ${title}${message ? `\n${message}` : ""}`),
      info: (title: string, message?: string) => alert(`ℹ️ ${title}${message ? `\n${message}` : ""}`),
    }
  }
  return context
}

const toastStyles: Record<ToastType, { bg: string; border: string; icon: typeof CheckCircle; iconColor: string }> = {
  success: {
    bg: "bg-green-500/10",
    border: "border-green-500/30",
    icon: CheckCircle,
    iconColor: "text-green-400",
  },
  error: {
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    icon: XCircle,
    iconColor: "text-red-400",
  },
  warning: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    icon: AlertCircle,
    iconColor: "text-amber-400",
  },
  info: {
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/30",
    icon: Info,
    iconColor: "text-cyan-400",
  },
}

function ToastComponent({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const style = toastStyles[toast.type]
  const Icon = style.icon

  return (
    <div
      className={`${style.bg} ${style.border} border rounded-xl p-4 shadow-lg backdrop-blur-sm animate-in slide-in-from-top-2 fade-in duration-300 flex items-start gap-3 min-w-[320px] max-w-[420px]`}
    >
      <Icon className={`w-5 h-5 ${style.iconColor} flex-shrink-0 mt-0.5`} />
      <div className="flex-1 min-w-0">
        <p className="text-white font-medium text-sm">{toast.title}</p>
        {toast.message && <p className="text-gray-400 text-sm mt-0.5">{toast.message}</p>}
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="text-gray-500 hover:text-white transition-colors flex-shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback(
    (type: ToastType, title: string, message?: string, duration = 4000) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const toast: Toast = { id, type, title, message, duration }

      setToasts((prev) => [...prev, toast])

      if (duration > 0) {
        setTimeout(() => removeToast(id), duration)
      }
    },
    [removeToast]
  )

  const contextValue: ToastContextType = {
    showToast,
    success: (title, message) => showToast("success", title, message),
    error: (title, message) => showToast("error", title, message),
    warning: (title, message) => showToast("warning", title, message),
    info: (title, message) => showToast("info", title, message),
  }

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {/* Toast container */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
        {toasts.map((toast) => (
          <ToastComponent key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}
