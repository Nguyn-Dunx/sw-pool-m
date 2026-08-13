import { useEffect, useState } from 'react'
import { Bell, AlertTriangle, UserX } from 'lucide-react'
import { getTeacherAlerts } from '../../lib/apiTeacher'
import { Badge, Spinner, EmptyState } from '../../components/ui'

export default function TeacherAlerts() {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getTeacherAlerts().then(setAlerts).catch(() => setAlerts([])).finally(() => setLoading(false))
  }, [])

  const expiring = alerts.filter(a => a.alertType === 'EXPIRING_SOON')
  const absent = alerts.filter(a => a.alertType === 'ABSENT')

  return (
    <div className="space-y-4">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-ink-900 tracking-tight">Cảnh báo</h1>
        <p className="text-sm text-ink-500 mt-1">Học viên sắp hết hạn và vắng học trong phạm vi lớp của bạn</p>
      </div>

      {loading ? <Spinner className="py-20" size={32} /> : alerts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-ink-100/60 animate-fade-in-up">
          <EmptyState icon={Bell} title="Không có cảnh báo" description="Tất cả học viên đều đang học bình thường." />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Expiring soon */}
          <div className="bg-white rounded-2xl border border-ink-100/60 overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
            <div className="flex items-center gap-2.5 px-5 py-4 border-b border-ink-100/60 bg-gradient-to-r from-amber-50 to-amber-50/50">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              </div>
              <h2 className="font-semibold text-ink-900">Sắp hết hạn</h2>
              <Badge color="amber">{expiring.length}</Badge>
            </div>
            <div className="divide-y divide-ink-100/60 max-h-[60vh] overflow-y-auto">
              {expiring.length === 0 ? (
                <p className="text-sm text-ink-400 py-8 text-center">Không có khóa học sắp hết hạn</p>
              ) : expiring.map((a) => (
                <div key={a.enrollmentId} className="px-5 py-3 hover:bg-amber-50/50 transition-colors">
                  <p className="font-medium text-ink-800">{a.studentName}</p>
                  <p className="text-sm text-ink-500 mt-0.5">{a.message}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Absent */}
          <div className="bg-white rounded-2xl border border-ink-100/60 overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center gap-2.5 px-5 py-4 border-b border-ink-100/60 bg-gradient-to-r from-rose-50 to-rose-50/50">
              <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center">
                <UserX className="w-4 h-4 text-rose-600" />
              </div>
              <h2 className="font-semibold text-ink-900">Vắng học</h2>
              <Badge color="red">{absent.length}</Badge>
            </div>
            <div className="divide-y divide-ink-100/60 max-h-[60vh] overflow-y-auto">
              {absent.length === 0 ? (
                <p className="text-sm text-ink-400 py-8 text-center">Không có học viên vắng học</p>
              ) : absent.map((a) => (
                <div key={a.enrollmentId} className="px-5 py-3 hover:bg-rose-50/50 transition-colors">
                  <p className="font-medium text-ink-800">{a.studentName}</p>
                  <p className="text-sm text-ink-500 mt-0.5">{a.message}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
