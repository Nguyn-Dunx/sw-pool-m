import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, UserCircle, TrendingUp, Activity, ArrowUpRight } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts'
import { getAdminDashboard } from '../../lib/apiAdmin'
import { Spinner, Badge } from '../../components/ui'

function StatCard({ icon: Icon, label, value, color, to, description, delay = 0 }) {
  return (
    <Link
      to={to}
      className="group bg-white rounded-2xl border border-ink-100/70 p-5 flex items-center justify-between gap-4 card-hover hover:border-pool-300/80 hover:shadow-lg hover:shadow-pool-100/40 transition-all duration-200 animate-fade-in-up"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="flex items-center gap-4 min-w-0">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${color} group-hover:scale-105 transition-transform duration-200 shrink-0`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-ink-500 font-medium truncate">{label}</p>
          <p className="text-2xl font-bold text-ink-900 tracking-tight">{value ?? '—'}</p>
          {description && (
            <p className="text-xs text-ink-400 mt-0.5 group-hover:text-pool-600 transition-colors">{description}</p>
          )}
        </div>
      </div>
      <div className="w-8 h-8 rounded-lg bg-ink-50 flex items-center justify-center text-ink-400 group-hover:bg-pool-50 group-hover:text-pool-600 transition-all duration-200 shrink-0">
        <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
      </div>
    </Link>
  )
}

export default function AdminDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAdminDashboard().then(setData).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner className="py-20" size={32} />
  if (!data) return <p className="text-ink-500 text-center py-16">Không tải được dữ liệu.</p>

  const chartData = (data.enrollmentChartData || []).map((d) => ({ month: d.month, value: d.value }))

  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-ink-900 tracking-tight">Tổng quan</h1>
        <p className="text-sm text-ink-500 mt-1">Số liệu hệ thống quản lý bể bơi</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          icon={Users}
          label="Học viên đang học"
          value={data.totalActiveStudents}
          color="bg-pool-100 text-pool-700"
          to="/admin/enrollments?status=ACTIVE"
          description="Xem danh sách khóa học"
          delay={0.05}
        />
        <StatCard
          icon={UserCircle}
          label="Giáo viên hoạt động"
          value={data.totalActiveTeachers}
          color="bg-emerald-100 text-emerald-700"
          to="/admin/teachers"
          description="Quản lý đội ngũ giáo viên"
          delay={0.1}
        />
        <StatCard
          icon={TrendingUp}
          label="Đăng ký tháng này"
          value={data.newEnrollmentsThisMonth}
          color="bg-amber-100 text-amber-700"
          to="/admin/enrollments"
          description="Tất cả các khóa đăng ký"
          delay={0.15}
        />
      </div>

      <div className="bg-white rounded-2xl border border-ink-100/60 p-5 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-pool-500" />
            <h2 className="font-semibold text-ink-900">Đăng ký khóa học theo tháng</h2>
          </div>
          <Badge color="blue">6 tháng gần nhất</Badge>
        </div>
        {chartData.length === 0 ? (
          <p className="text-sm text-ink-400 py-12 text-center">Chưa có dữ liệu</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                cursor={{ fill: '#f0f9ff', radius: 8 }}
              />
              <Bar dataKey="value" fill="url(#barGradient)" radius={[8, 8, 0, 0]} name="Số đăng ký" />
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#0284c7" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
