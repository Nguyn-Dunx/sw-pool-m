import { useEffect, useState } from 'react'
import { Users, Calendar, AlertTriangle, UserX, Activity } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts'
import { getTeacherDashboard } from '../../lib/apiTeacher'
import { Spinner, Badge } from '../../components/ui'

function StatCard({ icon: Icon, label, value, color, delay = 0 }) {
  return (
    <div
      className="bg-white rounded-2xl border border-ink-100/60 p-5 flex items-center gap-4 card-hover animate-fade-in-up"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-sm text-ink-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-ink-900 tracking-tight">{value ?? '—'}</p>
      </div>
    </div>
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Học viên đang học" value={data.totalActiveStudents} color="bg-pool-100 text-pool-700" delay={0.05} />
        <StatCard icon={Calendar} label="Buổi dạy tháng này" value={data.totalSessionsTaughtThisMonth} color="bg-emerald-100 text-emerald-700" delay={0.1} />
        <StatCard icon={AlertTriangle} label="Sắp hết hạn" value={data.expiringSoonCount} color="bg-amber-100 text-amber-700" delay={0.15} />
        <StatCard icon={UserX} label="Vắng học" value={data.absentCount} color="bg-rose-100 text-rose-700" delay={0.2} />
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
