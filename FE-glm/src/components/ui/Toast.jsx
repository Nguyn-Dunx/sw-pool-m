import { create } from 'zustand'
import { CheckCircle, XCircle, Info } from 'lucide-react'

const useToast = create((set) => ({
  toasts: [],
  push: (type, message) => {
    const id = Date.now() + Math.random()
    set((s) => ({ toasts: [...s.toasts, { id, type, message }] }))
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
    }, 4000)
  },
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
}))

export const toast = {
  success: (m) => useToast.getState().push('success', m),
  error: (m) => useToast.getState().push('error', m),
  info: (m) => useToast.getState().push('info', m)
}

const icons = {
  success: CheckCircle,
  error: XCircle,
  info: Info
}

export function ToastContainer() {
  const { toasts, remove } = useToast()
  const colors = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    error: 'bg-rose-50 border-rose-200 text-rose-800',
    info: 'bg-pool-50 border-pool-200 text-pool-800'
  }
  const iconColors = {
    success: 'text-emerald-500',
    error: 'text-rose-500',
    info: 'text-pool-500'
  }
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2.5 max-w-sm">
      {toasts.map((t) => {
        const Icon = icons[t.type]
        return (
          <div
            key={t.id}
            className={`flex items-start gap-3 rounded-xl border px-4 py-3.5 shadow-lg animate-slide-in-down ${colors[t.type]}`}
          >
            <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${iconColors[t.type]}`} />
            <span className="text-sm flex-1 font-medium leading-snug">{t.message}</span>
            <button
              onClick={() => remove(t.id)}
              className="text-current opacity-40 hover:opacity-100 text-lg leading-none mt-0.5 shrink-0 transition-opacity"
            >
              ×
            </button>
          </div>
        )
      })}
    </div>
  )
}
