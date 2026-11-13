export function Badge({ color = 'gray', children, className = '' }) {
  const colors = {
    gray: 'bg-surface-muted text-content-muted ring-1 ring-line',
    blue: 'bg-primary-soft text-primary-soft-text ring-1 ring-primary/20',
    green: 'bg-success-soft text-success-text ring-1 ring-success/20',
    amber: 'bg-warning-soft text-warning-text ring-1 ring-warning/25',
    red: 'bg-danger-soft text-danger-text ring-1 ring-danger/20',
    purple: 'bg-purple-soft text-purple-text ring-1 ring-purple-text/20'
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${colors[color]} ${className}`}>
      {children}
    </span>
  )
}