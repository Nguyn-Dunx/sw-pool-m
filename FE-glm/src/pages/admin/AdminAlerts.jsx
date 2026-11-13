import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getAlerts, triggerAutoExpire } from '../../lib/apiAdmin'
import { Button, ConfirmDialog, PageHeader } from '../../components/ui'
import AlertsBoard from '../../components/ui/AlertsBoard'
import { PageTransition } from '../../components/motion/Motion'
import { useAsyncData } from '../../lib/useAsyncData'
import { toast } from '../../components/ui/Toast'
import { errMsg } from '../../lib/api'

export default function AdminAlerts() {
  const { data: alerts, loading, error, reload } = useAsyncData(getAlerts, [])
  const [running, setRunning] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const navigate = useNavigate()

  const handleExpire = async () => {
    setRunning(true)
    try {
      await triggerAutoExpire()
      toast.success('Đã chạy cronjob tự động hết hạn')
      setShowConfirm(false)
      reload()
    } catch (e) {
      toast.error(errMsg(e))
    } finally {
      setRunning(false)
    }
  }

  return (
    <PageTransition className="space-y-4">
      <PageHeader
        title="Cảnh báo"
        description="Học viên sắp hết hạn và vắng học"
        actions={
          <Button variant="secondary" onClick={() => setShowConfirm(true)} loading={running}>
            {!running && <RefreshCw className="w-4 h-4" aria-hidden="true" />}
            {running ? 'Đang chạy...' : 'Chạy cronjob hết hạn'}
          </Button>
        }
      />

      <AlertsBoard
        alerts={alerts || []}
        loading={loading}
        error={error}
        onRetry={reload}
        onView={() => navigate('/admin/enrollments')}
      />

      <ConfirmDialog
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleExpire}
        loading={running}
        title="Chạy cronjob tự động hết hạn"
        confirmLabel="Chạy cronjob"
        message="Các khóa học đã hết hạn sẽ bị đóng tự động. Bạn có chắc chắn muốn chạy?"
      />
    </PageTransition>
  )
}
