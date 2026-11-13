import { useEffect, useRef } from 'react'
import { create } from 'zustand'
import { CheckCircle, XCircle, Info, X } from 'lucide-react'

const TOAST_DURATION = 4500
const timers = new Map()

const useToast = create((set) => ({
  toasts: [],
  push: (type, message) => {
    const id = Date.now() + Math.random()
    set((s) => ({ toasts: [...s.toasts, { id, type, message }] }))
    timers.set(id, setTimeout(() => {
      timers.delete(id)
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
    }, TOAST_DURATION))
  },
  remove: (id) => {
    const timer = timers.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.delete(id)
    }
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
  }
}))

export const toast = {
  success: (m) => useToast.getState().push('success', m),
  error: (m) => useToast.getState().push('error', m),
  info: (m) => useToast.getState().push('info', m)
}

const icons = { success: CheckCircle, error: XCircle, info: Info }

const styles = {
  success: { box: 'bg-success-soft border-success/25 text-success-text', icon: 'text-success' },
  error: { box: 'bg-danger-soft border-danger/25 text-danger-text', icon: 'text-danger' },
  info: { box: 'bg-info-soft border-info/25 text-info-text', icon: 'text-info' }
}

export function ToastContainer() {
  const { toasts, remove } = useToast()
  const containerRef = useRef(null)

  useEffect(() => () => {
    timers.forEach((t) => clearTimeout(t))
    timers.clear()
  }, [])

  return (
    <div
      ref={containerRef}
      aria-live="polite"
      aria-atomic="false"
      className="fixed top-4 right-4 z-[100] flex flex-col gap-2.5 max-w-sm w-[calc(100vw-2rem)] sm:w-auto pointer-events-none"
    >
      {toasts.map((t) => {
        const Icon = icons[t.type]
        const s = styles[t.type]
        return (
          <div
            key={t.id}
            role={t.type === 'error' ? 'alert' : 'status'}
            className={`pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3.5 shadow-pop animate-slide-in-down ${s.box}`}
          >
            <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${s.icon}`} aria-hidden="true" />
            <span className="text-sm flex-1 font-medium leading-snug">{t.message}</span>
            <button
              onClick={() => remove(t.id)}
              aria-label="Đóng thông báo"
              className="shrink-0 rounded-lg p-1 opacity-60 hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        )
      })}
    </div>
  )
}