import { Users, Calendar, AlertTriangle, UserX, ListChecks, Wallet } from 'lucide-react'
import { getTeacherDashboard } from '../../lib/apiTeacher'
import { useAsyncData } from '../../lib/useAsyncData'
import { useAuth } from '../../store/auth'
import { PageTransition } from '../../components/motion/Motion'
import { DashboardSkeleton, ErrorState, StatCard, QuickAction } from '../../components/ui'
import { ChartCard, TrendChart } from '../../components/ui/Chart'
import WelcomeBanner from '../../components/ui/WelcomeBanner'

export default function TeacherDashboard() {
  const { data, loading, error, reload } = useAsyncData(getTeacherDashboard)
  const { user } = useAuth()

  if (loading) return <DashboardSkeleton />
  if (error || !data) return <ErrorState onRetry={reload} />

  const monthlyData = (data.attendanceChartData || []).map((d) => ({ label: d.month, value: d.value }))
  const weeklyData = (data.weeklyAttendanceChartData || []).map((d) => ({ label: d.week, value: d.value }))
  const displayName = user?.fullName || user?.phoneNumber || 'Giáo viên'

  return (
    <PageTransition className="space-y-5">
      <WelcomeBanner name={displayName} subtitle="Số liệu giảng dạy của bạn" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Học viên đang học"
          value={data.totalActiveStudents}
          tone="primary"
          to="/teacher/students?status=ACTIVE"
          sub="Lớp đang phụ trách"
        />
        <StatCard
          icon={Calendar}
          label="Buổi dạy tháng này"
          value={data.totalSessionsTaughtThisMonth}
          tone="accent"
          to="/teacher/students"
          sub="Điểm danh học viên"
        />
        <StatCard
          icon={AlertTriangle}
          label="Sắp hết hạn"
          value={data.expiringSoonCount}
          tone="warning"
          to="/teacher/alerts"
          sub="Khóa học sắp hết hạn"
        />
        <StatCard
          icon={UserX}
          label="Vắng học"
          value={data.absentCount}
          tone="danger"
          to="/teacher/alerts"
          sub="Nghỉ học quá 7 ngày"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Buổi dạy theo tháng" badge="6 tháng" badgeColor="blue">
          <TrendChart data={monthlyData} color="primary" height={250} name="Buổi dạy" />
        </ChartCard>
        <ChartCard title="Buổi dạy theo tuần" badge="4 tuần" badgeColor="green">
          <TrendChart data={weeklyData} color="success" height={250} name="Buổi dạy" />
        </ChartCard>
      </div>

      <div data-stagger>
        <h2 className="text-sm font-semibold text-content-muted uppercase tracking-wide mb-3">Truy cập nhanh</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <QuickAction to="/teacher/students" icon={Users} label="Điểm danh học viên" description="Check-in buổi học" tone="primary" />
          <QuickAction to="/teacher/students?paymentStatus=UNPAID" icon={Wallet} label="Học phí chưa đóng" description="Theo dõi học viên" tone="warning" />
          <QuickAction to="/teacher/requests" icon={ListChecks} label="Yêu cầu đăng ký" description="Tạo & theo dõi yêu cầu" tone="accent" />
        </div>
      </div>
    </PageTransition>
  )
}