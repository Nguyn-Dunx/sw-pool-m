import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, Calendar, AlertTriangle, UserX, Activity, ArrowUpRight } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts'
import { getTeacherDashboard } from '../../lib/apiTeacher'
import { Spinner, Badge } from '../../components/ui'

function StatCard({ icon: Icon, label, value, color, to, description, delay = 0 }) {
  return (
    <Link
      to={to}
      className="group bg-white rounded-2xl border border-ink-100/70 p-4 sm:p-5 flex items-center justify-between gap-3 card-hover hover:border-pool-300/80 hover:shadow-lg hover:shadow-pool-100/40 transition-all duration-200 animate-fade-in-up"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shadow-sm ${color} group-hover:scale-105 transition-transform duration-200 shrink-0`}>
          <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        <div className="min-w-0">
          <p className="text-xs sm:text-sm text-ink-500 font-medium truncate">{label}</p>
          <p className="text-xl sm:text-2xl font-bold text-ink-900 tracking-tight">{value ?? '—'}</p>
          {description && (
            <p className="hidden sm:block text-[11px] text-ink-400 mt-0.5 group-hover:text-pool-600 transition-colors truncate">{description}</p>
          )}
        </div>
      </div>
      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-ink-50 flex items-center justify-center text-ink-400 group-hover:bg-pool-50 group-hover:text-pool-600 transition-all duration-200 shrink-0">
        <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
      </div>
    </Link>
  )
}

export default function TeacherDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getTeacherDashboard().then(setData).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner className="py-20" size={32} />
  if (!data) return <p className="text-ink-500 text-center py-16">Không tải được dữ liệu.</p>

  const monthlyData = (data.attendanceChartData || []).map(d => ({ month: d.month, value: d.value }))
  const weeklyData = (data.weeklyAttendanceChartData || []).map(d => ({ week: d.week, value: d.value }))

  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-ink-900 tracking-tight">Tổng quan</h1>
        <p className="text-sm text-ink-500 mt-1">Số liệu giảng dạy của bạn</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Học viên đang học"
          value={data.totalActiveStudents}
          color="bg-pool-100 text-pool-700"
          to="/teacher/students?status=ACTIVE"
          description="Lớp đang phụ trách"
          delay={0.05}
        />
        <StatCard
          icon={Calendar}
          label="Buổi dạy tháng này"
          value={data.totalSessionsTaughtThisMonth}
          color="bg-emerald-100 text-emerald-700"
          to="/teacher/students"
          description="Điểm danh học viên"
          delay={0.1}
        />
        <StatCard
          icon={AlertTriangle}
          label="Sắp hết hạn"
          value={data.expiringSoonCount}
          color="bg-amber-100 text-amber-700"
          to="/teacher/alerts"
          description="Khóa học sắp hết hạn"
          delay={0.15}
        />
        <StatCard
          icon={UserX}
          label="Vắng học"
          value={data.absentCount}
          color="bg-rose-100 text-rose-700"
          to="/teacher/alerts"
          description="Nghỉ học quá 7 ngày"
          delay={0.2}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-ink-100/60 p-5 animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-pool-500" />
              <h2 className="font-semibold text-ink-900">Buổi dạy theo tháng</h2>
            </div>
            <Badge color="blue">6 tháng</Badge>
          </div>
          {monthlyData.length === 0 ? (
            <p className="text-sm text-ink-400 py-12 text-center">Chưa có dữ liệu</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} cursor={{ fill: '#f0f9ff', radius: 8 }} />
                <Bar dataKey="value" fill="url(#monthGradient)" radius={[8, 8, 0, 0]} name="Buổi dạy" />
                <defs>
                  <linearGradient id="monthGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38bdf8" />
                    <stop offset="100%" stopColor="#0284c7" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-ink-100/60 p-5 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-500" />
              <h2 className="font-semibold text-ink-900">Buổi dạy theo tuần</h2>
            </div>
            <Badge color="green">4 tuần</Badge>
          </div>
          {weeklyData.length === 0 ? (
            <p className="text-sm text-ink-400 py-12 text-center">Chưa có dữ liệu</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} cursor={{ fill: '#f0f9ff', radius: 8 }} />
                <Bar dataKey="value" fill="url(#weekGradient)" radius={[8, 8, 0, 0]} name="Buổi dạy" />
                <defs>
                  <linearGradient id="weekGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}
