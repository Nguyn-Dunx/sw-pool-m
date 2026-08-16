import { useState, useEffect } from 'react'
import { Outlet, useNavigate, Link } from 'react-router-dom'
import { Menu, LogOut, ChevronDown, Bell } from 'lucide-react'
import Sidebar from './Sidebar'
import { useAuth } from '../../store/auth'
import { useRequestNotification } from '../../store/notifications'
import { toast } from '../ui/Toast'

export default function AppLayout({ role }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { checkNotifications, adminPendingCount, teacherNewResponseCount } = useRequestNotification()

  // Polling notifications định kỳ mỗi 15 giây
  useEffect(() => {
    if (!role) return
    checkNotifications(role, user?.id)

    const interval = setInterval(() => {
      checkNotifications(role, user?.id)
    }, 15000)

    return () => clearInterval(interval)
  }, [role, user?.id])

  const handleLogout = async () => {
    await logout()
    toast.info('Đã đăng xuất')
    navigate('/login')
  }

  const displayName = user?.fullName || (role === 'ADMIN' ? 'Ban Quản trị' : (user?.phoneNumber || 'Giáo viên'))

  // Lấy chữ cái viết tắt từ họ tên (VD: "Nguyễn Văn Dũng" -> "VD") hoặc 2 số cuối SĐT
  const getInitials = (name, phone) => {
    if (name) {
      const parts = name.trim().split(/\s+/)
      if (parts.length >= 2) {
        return (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase()
      }
      return parts[0].slice(0, 2).toUpperCase()
    }
    return (phone || '??').slice(-2)
  }

  const initials = getInitials(user?.fullName, user?.phoneNumber)
  const notificationCount = role === 'ADMIN' ? adminPendingCount : teacherNewResponseCount
  const notificationLink = role === 'ADMIN' ? '/admin/enrollment-requests' : '/teacher/requests'
  const notificationTooltip = role === 'ADMIN'
    ? (adminPendingCount > 0 ? `Có ${adminPendingCount} yêu cầu mới chờ duyệt` : 'Không có yêu cầu chờ duyệt')
    : (teacherNewResponseCount > 0 ? `Có ${teacherNewResponseCount} phản hồi yêu cầu mới` : 'Không có phản hồi mới')

  return (
    <div className="flex min-h-[100dvh] bg-gradient-to-br from-pool-50/50 via-white to-pool-50/30">
      <Sidebar role={role} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-20 bg-white/85 backdrop-blur-lg border-b border-ink-100/70 h-16 flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-ink-600 hover:bg-ink-100 active:bg-ink-200 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Greeting section - To, rõ ràng và nổi bật */}
            <div className="flex items-center gap-2">
              <div className="flex flex-col justify-center">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs sm:text-sm font-medium text-ink-400">Xin chào,</span>
                  <span className="text-sm">👋</span>
                </div>
                <h2 className="text-base sm:text-lg lg:text-xl font-bold text-pool-900 tracking-tight leading-tight line-clamp-1">
                  {displayName}
                </h2>
              </div>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Notification Bell with Red Dot / Counter */}
            <Link
              to={notificationLink}
              title={notificationTooltip}
              className="relative p-2 rounded-xl text-ink-600 hover:bg-ink-50 hover:text-ink-900 active:bg-ink-100 transition-colors"
            >
              <Bell className="w-5 h-5" />
              {notificationCount > 0 && (
                <>
                  <span className="absolute top-1.5 right-1.5 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500 border-2 border-white"></span>
                  </span>
                </>
              )}
            </Link>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2.5 py-1 px-2 rounded-xl hover:bg-ink-50 transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pool-500 to-pool-700 flex items-center justify-center text-white font-bold text-sm shadow-sm shadow-pool-200">
                  {initials}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-semibold text-ink-800 leading-tight line-clamp-1 max-w-[160px]">{displayName}</p>
                  <p className="text-[11px] text-ink-400 leading-tight">{role === 'ADMIN' ? 'Quản trị viên' : (user?.phoneNumber || 'Giáo viên')}</p>
                </div>
                <ChevronDown className={`w-4 h-4 text-ink-400 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
              </button>

            {/* Dropdown */}
            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-ink-100 py-2 z-50 animate-scale-in origin-top-right">
                  <div className="px-4 py-2.5 border-b border-ink-100">
                    <p className="text-sm font-bold text-ink-900 line-clamp-1">{displayName}</p>
                    <p className="text-xs text-ink-400 mt-0.5 font-mono">{user?.phoneNumber}</p>
                    <span className="inline-block mt-2 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-md bg-pool-50 text-pool-700 border border-pool-200/60">
                      {role === 'ADMIN' ? 'Quản trị viên' : 'Giáo viên'}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition-colors mt-1 font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    Đăng xuất
                  </button>
                </div>
              </>
            )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 lg:p-6 max-w-[1400px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
