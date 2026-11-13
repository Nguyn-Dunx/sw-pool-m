import { Children, cloneElement, isValidElement, useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { X, Loader2, ChevronLeft, ChevronRight, AlertTriangle, RefreshCw, CloudAlert, HelpCircle, ArrowRight } from 'lucide-react'
import { lockScroll, unlockScroll } from '../../lib/scrollLock'

// ===== Button =====
export function Button({ variant = 'primary', size = 'md', loading = false, className = '', children, disabled, ...props }) {
  const variants = {
    primary: 'bg-primary-strong text-white hover:bg-primary-strong/90 shadow-sm shadow-pool-900/10',
    secondary: 'bg-surface text-primary-soft-text border border-line hover:border-primary/50 hover:bg-primary-soft/60 shadow-sm',
    ghost: 'text-content-muted hover:bg-surface-muted hover:text-content',
    danger: 'bg-danger-action text-white hover:bg-danger-action/90 shadow-sm shadow-rose-900/10',
    outline: 'border border-line text-content-muted hover:bg-surface-muted hover:text-content hover:border-line-strong'
  }
  const sizes = {
    sm: 'min-h-11 px-3.5 text-xs rounded-lg gap-1.5',
    md: 'min-h-11 px-4 text-sm rounded-xl gap-1.5',
    lg: 'min-h-12 px-6 text-base rounded-xl gap-2'
  }
  return (
    <button
      className={`inline-flex items-center justify-center font-semibold transition-all duration-200 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  )
}

// ===== IconButton (thao tác nhanh trong bảng, đủ vùng chạm 44px) =====
export function IconButton({ label, tone = 'neutral', className = '', children, ...props }) {
  const tones = {
    neutral: 'text-content-muted hover:bg-surface-muted hover:text-content',
    primary: 'text-primary-soft-text hover:bg-primary-soft',
    danger: 'text-danger-text hover:bg-danger-soft',
    success: 'text-success-text hover:bg-success-soft'
  }
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`inline-flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-150 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${tones[tone]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

// ===== Badge =====
export { Badge } from './Badge'

// ===== Spinner (ăn theo màu chữ của phần tử cha) =====
export function Spinner({ size = 24, className = '', label = 'Đang tải' }) {
  return (
    <div className={`flex items-center justify-center text-primary ${className}`} role="status" aria-label={label}>
      <div
        className="animate-spin rounded-full border-current"
        style={{ width: size, height: size, borderWidth: Math.max(2, Math.round(size / 8)), borderStyle: 'solid', borderTopColor: 'transparent' }}
      />
    </div>
  )
}

// ===== Skeleton =====
export function Skeleton({ className = '' }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />
}

export function TableSkeleton({ rows = 5, cols = 5, className = '' }) {
  return (
    <div className={`bg-surface rounded-2xl border border-line shadow-card overflow-hidden ${className}`} aria-busy="true" aria-label="Đang tải danh sách">
      <div className="px-5 py-4 border-b border-line flex items-center gap-4">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-9 w-28 ml-auto rounded-xl" />
      </div>
      <div className="divide-y divide-line">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="px-5 py-4 flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-full shrink-0" />
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton key={c} className={`h-4 ${c === 0 ? 'w-40' : 'w-20'} ${c > 1 ? 'hidden md:block' : ''}`} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Đang tải bảng điều khiển">
      <div className="space-y-2">
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-surface rounded-2xl border border-line shadow-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-10 rounded-xl" />
            </div>
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>
      <div className="bg-surface rounded-2xl border border-line shadow-card p-5 space-y-4">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    </div>
  )
}

// ===== EmptyState =====
export function EmptyState({ icon: Icon, title, description, action, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in ${className}`}>
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-primary-soft flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-primary-soft-text" aria-hidden="true" />
        </div>
      )}
      <h3 className="text-base font-semibold text-content mb-1">{title}</h3>
      {description && <p className="text-sm text-content-muted max-w-sm mb-4">{description}</p>}
      {action}
    </div>
  )
}

// ===== ErrorState =====
export function ErrorState({ title = 'Không tải được dữ liệu', description = 'Đã có lỗi xảy ra khi kết nối máy chủ. Vui lòng thử lại.', onRetry, className = '' }) {
  return (
    <div role="alert" className={`flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in ${className}`}>
      <div className="w-16 h-16 rounded-2xl bg-danger-soft flex items-center justify-center mb-4">
        <CloudAlert className="w-8 h-8 text-danger-text" aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold text-content mb-1">{title}</h3>
      <p className="text-sm text-content-muted max-w-sm mb-4">{description}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          <RefreshCw className="w-4 h-4" aria-hidden="true" /> Thử lại
        </Button>
      )}
    </div>
  )
}

// ===== Modal (dialog chuẩn a11y: focus trap, Escape, restore focus, hỗ trợ lồng nhau) =====
const modalStack = []

export function Modal({ open, onClose, title, children, size = 'md' }) {
  const dialogRef = useRef(null)
  const titleId = useId()
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!open) return
    const token = Symbol('modal')
    modalStack.push(token)
    const previouslyFocused = document.activeElement
    lockScroll()

    const dialog = dialogRef.current
    const getFocusable = () => Array.from(
      dialog.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')
    ).filter((el) => el.getClientRects().length > 0)

    const initial = getFocusable()[0] || dialog
    initial.focus({ preventScroll: true })

    const handleKeyDown = (e) => {
      if (modalStack[modalStack.length - 1] !== token) return
      if (e.key === 'Escape') {
        e.preventDefault()
        onCloseRef.current?.()
        return
      }
      if (e.key === 'Tab') {
        const items = getFocusable()
        if (items.length === 0) {
          e.preventDefault()
          dialog.focus()
          return
        }
        const first = items[0]
        const last = items[items.length - 1]
        if (e.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      const idx = modalStack.indexOf(token)
      if (idx >= 0) modalStack.splice(idx, 1)
      document.removeEventListener('keydown', handleKeyDown)
      unlockScroll()
      if (previouslyFocused && previouslyFocused.focus) previouslyFocused.focus({ preventScroll: true })
    }
  }, [open])

  if (!open) return null
  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-scrim backdrop-blur-sm animate-fade-in" onClick={() => onCloseRef.current?.()} aria-hidden="true" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`relative bg-surface rounded-2xl shadow-pop w-full ${sizes[size]} max-h-[90dvh] flex flex-col animate-scale-in border border-line`}
      >
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-line">
          <h2 id={titleId} className="text-lg font-bold text-content font-display">{title}</h2>
          <IconButton label="Đóng hộp thoại" onClick={() => onCloseRef.current?.()} className="-mr-2 h-10 w-10">
            <X className="w-5 h-5" aria-hidden="true" />
          </IconButton>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>,
    document.body
  )
}

// ===== ConfirmDialog (thay window.confirm) =====
export function ConfirmDialog({
  open, onClose, onConfirm, title, message,
  confirmLabel = 'Xác nhận', cancelLabel = 'Hủy',
  danger = false, loading = false
}) {
  return (
    <Modal open={open} onClose={loading ? undefined : onClose} title={title} size="sm">
      <div className="flex items-start gap-3.5">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${danger ? 'bg-danger-soft' : 'bg-primary-soft'}`}>
          {danger
            ? <AlertTriangle className="w-5 h-5 text-danger-text" aria-hidden="true" />
            : <HelpCircle className="w-5 h-5 text-primary-soft-text" aria-hidden="true" />}
        </div>
        <p className="text-sm text-content-muted leading-relaxed pt-2">{message}</p>
      </div>
      <div className="flex justify-end gap-2 mt-6">
        <Button variant="outline" onClick={onClose} disabled={loading}>{cancelLabel}</Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
      </div>
    </Modal>
  )
}

// ===== Pagination =====
export function Pagination({ page, totalPages, onChange, className = '' }) {
  if (totalPages <= 1) return null
  let start = Math.max(1, page - 2)
  const end = Math.min(totalPages, start + 4)
  start = Math.max(1, end - 4)
  const pages = []
  for (let i = start; i <= end; i++) pages.push(i)

  const btnCls = 'inline-flex h-11 min-w-11 items-center justify-center gap-1 px-3 text-sm rounded-xl border border-line text-content-muted hover:bg-surface-muted hover:text-content disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium'

  return (
    <nav aria-label="Phân trang danh sách" className={`flex items-center justify-center gap-1.5 mt-6 ${className}`}>
      <button disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Trang trước" className={btnCls}>
        <ChevronLeft className="w-4 h-4" aria-hidden="true" />
        <span className="hidden sm:inline">Trước</span>
      </button>
      {start > 1 && (
        <>
          <button onClick={() => onChange(1)} aria-label="Trang 1" className={btnCls}>1</button>
          {start > 2 && <span className="px-1 text-content-subtle" aria-hidden="true">…</span>}
        </>
      )}
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          aria-current={p === page ? 'page' : undefined}
          aria-label={`Trang ${p}`}
          className={`inline-flex h-11 min-w-11 items-center justify-center px-2 text-sm rounded-xl font-semibold transition-all duration-200 ${
            p === page
              ? 'bg-primary-strong text-white shadow-sm'
              : 'border border-line text-content-muted hover:bg-surface-muted hover:text-content'
          }`}
        >
          {p}
        </button>
      ))}
      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="px-1 text-content-subtle" aria-hidden="true">…</span>}
          <button onClick={() => onChange(totalPages)} aria-label={`Trang ${totalPages}`} className={btnCls}>{totalPages}</button>
        </>
      )}
      <button disabled={page >= totalPages} onClick={() => onChange(page + 1)} aria-label="Trang sau" className={btnCls}>
        <span className="hidden sm:inline">Sau</span>
        <ChevronRight className="w-4 h-4" aria-hidden="true" />
      </button>
    </nav>
  )
}

// ===== Field (label gắn với control, mô tả lỗi cho screen reader) =====
export function Field({ label, required, error, children, hint, htmlFor, className = '' }) {
  const autoId = useId()
  const hintId = `${autoId}-hint`
  const errorId = `${autoId}-error`

  const singleChild = !htmlFor && Children.count(children) === 1 && isValidElement(children) ? children : null
  const controlId = htmlFor || singleChild?.props?.id || autoId
  const describedBy = [hint && !error ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined

  const control = singleChild
    ? cloneElement(singleChild, {
        id: controlId,
        'aria-invalid': error ? true : singleChild.props['aria-invalid'],
        'aria-describedby': describedBy || singleChild.props['aria-describedby']
      })
    : children

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={controlId} className="text-sm font-semibold text-content">
          {label} {required && <span className="text-danger" aria-hidden="true">*</span>}
        </label>
      )}
      {control}
      {hint && !error && <p id={hintId} className="text-xs text-content-subtle">{hint}</p>}
      {error && <p id={errorId} role="alert" className="text-xs text-danger-text font-medium">{error}</p>}
    </div>
  )
}

export const inputCls = 'w-full min-h-11 px-3.5 py-2.5 rounded-xl border border-line bg-surface text-content placeholder-content-subtle transition-all duration-200 text-sm disabled:opacity-60 disabled:cursor-not-allowed'

// ===== Card =====
export function Card({ className = '', children, ...props }) {
  return (
    <div className={`bg-surface rounded-2xl border border-line shadow-card ${className}`} {...props}>
      {children}
    </div>
  )
}

// ===== PageHeader =====
export function PageHeader({ title, description, actions, className = '' }) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5 ${className}`} data-stagger>
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl font-bold text-content tracking-tight font-display">{title}</h1>
        {description && <p className="text-sm text-content-muted mt-1">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap shrink-0">{actions}</div>}
    </div>
  )
}

// ===== StatCard =====
export function StatCard({ icon: Icon, label, value, sub, tone = 'primary', to, className = '' }) {
  const tones = {
    primary: 'bg-primary-soft text-primary-soft-text',
    accent: 'bg-accent-soft text-accent-soft-text',
    success: 'bg-success-soft text-success-text',
    warning: 'bg-warning-soft text-warning-text',
    danger: 'bg-danger-soft text-danger-text',
    info: 'bg-info-soft text-info-text'
  }
  const body = (
    <>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-content-muted">{label}</p>
        {Icon && (
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${tones[tone]}`}>
            <Icon className="w-5 h-5" aria-hidden="true" />
          </div>
        )}
      </div>
      <p className="mt-2 text-3xl font-bold text-content tabular-nums font-display">{value ?? '—'}</p>
      <div className="mt-1 flex items-center justify-between gap-2">
        {sub && <p className="text-xs text-content-subtle">{sub}</p>}
        {to && <ArrowRight className="w-4 h-4 text-content-subtle shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />}
      </div>
    </>
  )
  const cls = `group block bg-surface rounded-2xl border border-line shadow-card p-5 card-hover ${to ? 'hover:border-primary/40' : ''} ${className}`
  if (to) {
    return <Link to={to} className={cls} data-stagger>{body}</Link>
  }
  return <div className={cls} data-stagger>{body}</div>
}

// ===== QuickAction =====
export function QuickAction({ to, onClick, icon: Icon, label, description, tone = 'primary' }) {
  const tones = {
    primary: 'bg-primary-soft text-primary-soft-text',
    accent: 'bg-accent-soft text-accent-soft-text',
    warning: 'bg-warning-soft text-warning-text',
    danger: 'bg-danger-soft text-danger-text'
  }
  const inner = (
    <>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${tones[tone]}`}>
        <Icon className="w-5 h-5" aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0 text-left">
        <p className="text-sm font-semibold text-content">{label}</p>
        {description && <p className="text-xs text-content-subtle mt-0.5">{description}</p>}
      </div>
      <ArrowRight className="w-4 h-4 text-content-subtle shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
    </>
  )
  const cls = 'group flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 shadow-card card-hover w-full'
  if (to) return <Link to={to} className={cls}>{inner}</Link>
  return <button type="button" onClick={onClick} className={cls}>{inner}</button>
}

// ===== ProgressBar =====
export function ProgressBar({ value, max = 100, tone = 'primary', label, className = '' }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  const tones = { primary: 'bg-primary', accent: 'bg-accent', success: 'bg-success', warning: 'bg-warning', danger: 'bg-danger' }
  return (
    <div
      className={`h-2 w-full rounded-full bg-surface-muted overflow-hidden ${className}`}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label || `Tiến độ ${pct}%`}
    >
      <div className={`h-full rounded-full transition-all duration-500 ${tones[tone]}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

// ===== InfoTile (ô thông tin trong modal chi tiết) =====
export function InfoTile({ label, children, className = '' }) {
  return (
    <div className={`rounded-xl bg-surface-muted/60 border border-line px-3.5 py-2.5 ${className}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-content-subtle">{label}</p>
      <div className="text-sm font-medium text-content mt-0.5">{children}</div>
    </div>
  )
}

// ===== ColumnHeaderFilter & ActiveFilterChips =====
export { ColumnHeaderFilter, ActiveFilterChips } from './ColumnFilter'

// ===== Export Excel Button =====
export { default as ExportButton } from './ExportButton'