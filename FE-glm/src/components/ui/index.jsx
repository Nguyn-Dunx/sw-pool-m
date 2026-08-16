import { useEffect } from 'react'
import { X } from 'lucide-react'

// ===== Button =====
export function Button({ variant = 'primary', size = 'md', className = '', children, ...props }) {
  const variants = {
    primary: 'bg-gradient-to-r from-pool-500 to-pool-600 text-white hover:from-pool-600 hover:to-pool-700 active:from-pool-700 active:to-pool-800 shadow-md shadow-pool-200/50 hover:shadow-lg hover:shadow-pool-200/60',
    secondary: 'bg-white text-pool-700 border border-pool-200 hover:bg-pool-50 active:bg-pool-100 shadow-sm',
    ghost: 'text-ink-600 hover:bg-ink-100 active:bg-ink-200',
    danger: 'bg-gradient-to-r from-rose-500 to-rose-600 text-white hover:from-rose-600 hover:to-rose-700 active:from-rose-700 active:to-rose-800 shadow-md shadow-rose-200/50',
    outline: 'border border-ink-200 text-ink-700 hover:bg-ink-50 active:bg-ink-100 hover:border-ink-300'
  }
  const sizes = {
    sm: 'px-3 py-1.5 text-xs rounded-lg gap-1',
    md: 'px-4 py-2 text-sm rounded-xl gap-1.5',
    lg: 'px-6 py-2.5 text-base rounded-xl gap-2'
  }
  return (
    <button
      className={`inline-flex items-center justify-center font-semibold transition-all duration-200 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

// ===== Badge =====
export function Badge({ color = 'gray', children, className = '' }) {
  const colors = {
    gray: 'bg-ink-100 text-ink-700 ring-1 ring-ink-200/50',
    blue: 'bg-pool-50 text-pool-700 ring-1 ring-pool-200/50',
    green: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/50',
    amber: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/50',
    red: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200/50',
    purple: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200/50'
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${colors[color]} ${className}`}>
      {children}
    </span>
  )
}

// ===== Spinner =====
export function Spinner({ size = 24, className = '' }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className="rounded-full animate-spin"
        style={{
          width: size,
          height: size,
          borderWidth: 3,
          borderStyle: 'solid',
          borderColor: 'var(--color-pool-200)',
          borderTopColor: 'var(--color-pool-600)'
        }}
      />
    </div>
  )
}

// ===== EmptyState =====
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in">
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pool-50 to-pool-100 flex items-center justify-center mb-4 shadow-sm">
          <Icon className="w-8 h-8 text-pool-400" />
        </div>
      )}
      <h3 className="text-base font-semibold text-ink-800 mb-1">{title}</h3>
      {description && <p className="text-sm text-ink-500 max-w-sm mb-4">{description}</p>}
      {action}
    </div>
  )
}

export function Modal({ open, onClose, title, children, size = 'md' }) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') onClose?.()
      }
      window.addEventListener('keydown', handleKeyDown)
      return () => {
        document.body.style.overflow = ''
        window.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [open, onClose])

  if (!open) return null
  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink-900/50 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${sizes[size]} max-h-[90dvh] flex flex-col animate-scale-in`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-ink-100/60">
          <h2 className="text-lg font-bold text-ink-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-ink-400 hover:bg-ink-100 hover:text-ink-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

// ===== Pagination =====
export function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null
  const pages = []
  const start = Math.max(1, page - 2)
  const end = Math.min(totalPages, start + 4)
  for (let i = start; i <= end; i++) pages.push(i)

  return (
    <div className="flex items-center justify-center gap-1 mt-6">
      <button
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        className="px-3 py-1.5 text-sm rounded-lg border border-ink-200 text-ink-600 hover:bg-ink-50 disabled:opacity-40 transition-colors font-medium"
      >
        ← Trước
      </button>
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`min-w-[36px] px-2 py-1.5 text-sm rounded-lg font-semibold transition-all duration-200 ${
            p === page
              ? 'bg-gradient-to-r from-pool-500 to-pool-600 text-white shadow-sm shadow-pool-200'
              : 'border border-ink-200 text-ink-600 hover:bg-ink-50'
          }`}
        >
          {p}
        </button>
      ))}
      <button
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        className="px-3 py-1.5 text-sm rounded-lg border border-ink-200 text-ink-600 hover:bg-ink-50 disabled:opacity-40 transition-colors font-medium"
      >
        Sau →
      </button>
    </div>
  )
}

// ===== FormField =====
export function Field({ label, required, error, children, hint }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-semibold text-ink-700">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      {children}
      {hint && !error && <p className="text-xs text-ink-400">{hint}</p>}
      {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
    </div>
  )
}

export const inputCls = 'w-full px-3.5 py-2.5 rounded-xl border border-ink-200 bg-white text-ink-800 placeholder-ink-400 focus:outline-none focus:ring-2 focus:ring-pool-400/30 focus:border-pool-400 transition-all duration-200 text-sm'

// ===== ColumnHeaderFilter & ActiveFilterChips =====
export { ColumnHeaderFilter, ActiveFilterChips } from './ColumnFilter'

// ===== Export Excel Button =====
export { default as ExportButton } from './ExportButton'
