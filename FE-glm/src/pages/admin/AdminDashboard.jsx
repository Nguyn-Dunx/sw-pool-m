import { Users, UserCircle, TrendingUp, FileText, Bell, Wallet } from 'lucide-react'
import { getAdminDashboard } from '../../lib/apiAdmin'
import { useAsyncData } from '../../lib/useAsyncData'
import { useAuth } from '../../store/auth'
import { PageTransition } from '../../components/motion/Motion'
import { DashboardSkeleton, ErrorState, StatCard, QuickAction } from '../../components/ui'
import { ChartCard, TrendChart } from '../../components/ui/Chart'
import WelcomeBanner from '../../components/ui/WelcomeBanner'

export default function AdminDashboard() {
  const { data, loading, error, reload } = useAsyncData(getAdminDashboard)
  const { user } = useAuth()

  if (loading) return <DashboardSkeleton />
  if (error || !data) return <ErrorState onRetry={reload} />

  const chartData = (data.enrollmentChartData || []).map((d) => ({ label: d.month, value: d.value }))
  const displayName = user?.fullName || 'Ban Quản trị'

  return (
    <PageTransition className="space-y-5">
      <WelcomeBanner name={displayName} subtitle="Số liệu hệ thống quản lý bể bơi" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          icon={Users}
          label="Học viên đang học"
          value={data.totalActiveStudents}
          tone="primary"
          to="/admin/enrollments?status=ACTIVE"
          sub="Xem danh sách khóa học"
        />
        <StatCard
          icon={UserCircle}
          label="Giáo viên hoạt động"
          value={data.totalActiveTeachers}
          tone="accent"
          to="/admin/teachers"
          sub="Quản lý đội ngũ giáo viên"
        />
        <StatCard
          icon={TrendingUp}
          label="Đăng ký tháng này"
          value={data.newEnrollmentsThisMonth}
          tone="warning"
          to="/admin/enrollments"
          sub="Tất cả các khóa đăng ký"
        />
      </div>

      <ChartCard title="Đăng ký khóa học theo tháng" badge="6 tháng gần nhất" badgeColor="blue">
        <TrendChart data={chartData} color="primary" name="Số đăng ký" />
      </ChartCard>

      <div data-stagger>
        <h2 className="text-sm font-semibold text-content-muted uppercase tracking-wide mb-3">Truy cập nhanh</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <QuickAction to="/admin/enrollment-requests" icon={FileText} label="Yêu cầu đăng ký" description="Duyệt yêu cầu mới" tone="primary" />
          <QuickAction to="/admin/enrollments?paymentStatus=UNPAID" icon={Wallet} label="Học phí chưa đóng" description="Theo dõi công nợ" tone="warning" />
          <QuickAction to="/admin/alerts" icon={Bell} label="Cảnh báo" description="Hết hạn & vắng học" tone="danger" />
        </div>
      </div>
    </PageTransition>
  )
}