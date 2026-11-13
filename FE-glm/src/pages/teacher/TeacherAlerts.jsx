import { getTeacherAlerts } from '../../lib/apiTeacher'
import { PageHeader } from '../../components/ui'
import AlertsBoard from '../../components/ui/AlertsBoard'
import { PageTransition } from '../../components/motion/Motion'
import { useAsyncData } from '../../lib/useAsyncData'

export default function TeacherAlerts() {
  const { data: alerts, loading, error, reload } = useAsyncData(getTeacherAlerts, [])

  return (
    <PageTransition className="space-y-4">
      <PageHeader
        title="Cảnh báo"
        description="Học viên sắp hết hạn và vắng học trong phạm vi lớp của bạn"
      />
      <AlertsBoard alerts={alerts || []} loading={loading} error={error} onRetry={reload} />
    </PageTransition>
  )
}
