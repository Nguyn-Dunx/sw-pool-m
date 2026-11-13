import { Bell, AlertTriangle, UserX, Eye } from 'lucide-react'
import { Badge, EmptyState, ErrorState, Skeleton, IconButton } from './index'

function AlertColumn({ title, icon: Icon, tone, count, items, emptyText, onView }) {
  const tones = {
    warning: {
      head: 'from-warning-soft to-warning-soft/40',
      chip: 'bg-warning-soft text-warning-text',
      icon: 'text-warning-text',
      hover: 'hover:bg-warning-soft/40',
      badge: 'amber'
    },
    danger: {
      head: 'from-danger-soft to-danger-soft/40',
      chip: 'bg-danger-soft text-danger-text',
      icon: 'text-danger-text',
      hover: 'hover:bg-danger-soft/40',
      badge: 'red'
    }
  }
  const t = tones[tone]
  return (
    <div className="bg-surface rounded-2xl border border-line shadow-card overflow-hidden" data-stagger>
      <div className={`flex items-center gap-2.5 px-5 py-4 border-b border-line bg-gradient-to-r ${t.head}`}>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${t.chip}`}>
          <Icon className={`w-4 h-4 ${t.icon}`} aria-hidden="true" />
        </div>
        <h2 className="font-semibold text-content">{title}</h2>
        <Badge color={t.badge}>{count}</Badge>
      </div>
      <div className="divide-y divide-line/70 max-h-[60vh] overflow-y-auto">
        {items.length === 0 ? (
          <p className="text-sm text-content-subtle py-8 text-center">{emptyText}</p>
        ) : items.map((a) => (
          <div key={a.enrollmentId} className={`flex items-start justify-between gap-2 px-5 py-3 transition-colors ${t.hover}`}>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-content">{a.studentName}</p>
              <p className="text-sm text-content-muted mt-0.5">{a.message}</p>
            </div>
            {onView && (
              <IconButton label={`Xem khóa học của ${a.studentName}`} tone={tone === 'warning' ? 'neutral' : 'danger'} onClick={() => onView(a)}>
                <Eye className="w-4 h-4" aria-hidden="true" />
              </IconButton>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

/** Bảng cảnh báo dùng chung cho Admin & Teacher: sắp hết hạn + vắng học. */
export default function AlertsBoard({ alerts = [], loading, error, onRetry, onView }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" aria-busy="true" aria-label="Đang tải cảnh báo">
        {[0, 1].map((i) => (
          <div key={i} className="bg-surface rounded-2xl border border-line shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-line flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="divide-y divide-line/70">
              {[0, 1, 2].map((r) => (
                <div key={r} className="px-5 py-3 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-56 max-w-full" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return <div className="bg-surface rounded-2xl border border-line shadow-card"><ErrorState onRetry={onRetry} /></div>
  }

  if (alerts.length === 0) {
    return (
      <div className="bg-surface rounded-2xl border border-line shadow-card" data-stagger>
        <EmptyState icon={Bell} title="Không có cảnh báo" description="Tất cả học viên đều đang học bình thường." />
      </div>
    )
  }

  const expiring = alerts.filter(a => a.alertType === 'EXPIRING_SOON')
  const absent = alerts.filter(a => a.alertType === 'ABSENT')

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <AlertColumn
        title="Sắp hết hạn"
        icon={AlertTriangle}
        tone="warning"
        count={expiring.length}
        items={expiring}
        emptyText="Không có khóa học sắp hết hạn"
        onView={onView}
      />
      <AlertColumn
        title="Vắng học"
        icon={UserX}
        tone="danger"
        count={absent.length}
        items={absent}
        emptyText="Không có học viên vắng học"
        onView={onView}
      />
    </div>
  )
}
