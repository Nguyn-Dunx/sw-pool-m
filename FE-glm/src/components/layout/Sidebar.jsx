import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, GraduationCap, FileText, Bell, UserCircle, Waves, ListChecks, LogOut, X, Settings } from 'lucide-react'
import { useAuth } from '../../store/auth'
import { useRequestNotification } from '../../store/notifications'
import { toast } from '../ui/Toast'

const adminNav = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/enrollments', icon: GraduationCap, label: 'Khóa học' },
  { to: '/admin/enrollment-requests', icon: FileText, label: 'Yêu cầu đăng ký', hasNotification: true },
  { to: '/admin/students', icon: Users, label: 'Học viên' },
  { to: '/admin/teachers', icon: UserCircle, label: 'Giáo viên' },
  { to: '/admin/alerts', icon: Bell, label: 'Cảnh báo' },
  { to: '/admin/settings', icon: Settings, label: 'Cấu hình' }
]

const teacherNav = [
  { to: '/teacher', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/teacher/students', icon: Users, label: 'Học viên của tôi' },
  { to: '/teacher/requests', icon: ListChecks, label: 'Yêu cầu đăng ký', hasNotification: true },
  { to: '/teacher/alerts', icon: Bell, label: 'Cảnh báo' }
]

export default function Sidebar({ role, open, onClose }) {
  const items = role === 'ADMIN' ? adminNav : teacherNav
  const { logout } = useAuth()
  const { adminPendingCount, teacherNewResponseCount } = useRequestNotification()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    toast.info('Đã đăng xuất')
    navigate('/login')
  }

  const getBadgeCount = (item) => {
    if (!item.hasNotification) return 0
    if (role === 'ADMIN') return adminPendingCount
    if (role === 'TEACHER') return teacherNewResponseCount
    return 0
  }

  return (
    <>
      {/* Overlay mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-ink-900/50 backdrop-blur-sm z-30 lg:hidden animate-fade-in"
          onClick={onClose}
        />
      )}

      <aside className={`fixed lg:sticky top-0 left-0 z-40 h-[100dvh] w-[270px] bg-white/95 backdrop-blur-md border-r border-ink-100/80 flex flex-col transition-transform duration-300 ease-out ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* Logo */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-ink-100/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pool-400 to-pool-600 flex items-center justify-center shadow-md shadow-pool-200">
              <Waves className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-ink-900 leading-tight tracking-tight">Pool Manager</p>
              <p className="text-[11px] text-ink-400 leading-tight font-medium">
                {role === 'ADMIN' ? 'Quản trị viên' : 'Giáo viên'}
              </p>
            </div>
          </div>
          {/* Close button mobile */}
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-ink-400 hover:bg-ink-100 hover:text-ink-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <p className="text-[10px] font-semibold text-ink-400 uppercase tracking-wider px-3 mb-2">Menu chính</p>
          {items.map((item) => {
            const badgeCount = getBadgeCount(item)

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onClose}
                className={({ isActive }) =>
                  `group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-pool-50 to-pool-100/80 text-pool-700 shadow-sm shadow-pool-100'
                      : 'text-ink-600 hover:bg-ink-50 hover:text-ink-800'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="relative">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                        isActive ? 'bg-pool-500 text-white shadow-sm' : 'bg-ink-100/60 text-ink-500 group-hover:bg-ink-200/80'
                      }`}>
                        <item.icon className="w-4 h-4" />
                      </div>
                      {/* Chấm đỏ nổi bật trên icon nếu có thông báo */}
                      {badgeCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500 border-2 border-white"></span>
                        </span>
                      )}
                    </div>
                    <span className="flex-1">{item.label}</span>

                    {/* Badge số lượng thông báo hoặc chỉ báo active */}
                    {badgeCount > 0 ? (
                      <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-xs shadow-rose-200">
                        {badgeCount > 99 ? '99+' : badgeCount}
                      </span>
                    ) : isActive ? (
                      <div className="w-1.5 h-1.5 rounded-full bg-pool-500" />
                    ) : null}
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* Footer — Logout */}
        <div className="px-3 py-3 border-t border-ink-100/60">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 active:bg-rose-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center">
              <LogOut className="w-4 h-4" />
            </div>
            Đăng xuất
          </button>
        </div>
      </aside>
    </>
  )
}
