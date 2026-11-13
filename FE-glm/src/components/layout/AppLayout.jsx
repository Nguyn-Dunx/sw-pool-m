import { useState, useEffect, useRef } from 'react'
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom'
import { Menu, LogOut, ChevronDown, ChevronRight, Bell, Sun, Moon } from 'lucide-react'
import Sidebar from './Sidebar'
import { useAuth } from '../../store/auth'
import { useRequestNotification } from '../../store/notifications'
import { useTheme } from '../../lib/theme'
import { toast } from '../ui/Toast'
import { getBreadcrumb } from './nav'

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'
  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
      aria-pressed={isDark}
      title={isDark ? 'Giao diện sáng' : 'Giao diện tối'}
      className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-content-muted hover:bg-surface-muted hover:text-content transition-colors"
    >
      {isDark ? <Sun className="w-5 h-5" aria-hidden="true" /> : <Moon className="w-5 h-5" aria-hidden="true" />}
    </button>
  )
}

export default function AppLayout({ role }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const { checkNotifications, adminPendingCount, teacherNewResponseCount } = useRequestNotification()
  const menuRef = useRef(null)
  const menuButtonRef = useRef(null)

  // Polling thông báo định kỳ mỗi 15 giây (giữ nguyên nghiệp vụ)
  useEffect(() => {
    if (!role) return
    checkNotifications(role, user?.id)
    const interval = setInterval(() => {
      checkNotifications(role, user?.id)
    }, 15000)
    return () => clearInterval(interval)
  }, [role, user?.id])

  // Đóng user menu khi chuyển trang
  useEffect(() => { setShowUserMenu(false) }, [location.pathname])

  useEffect(() => {
    if (!showUserMenu) return
    const handleMouseDown = (e) => {
      if (menuRef.current?.contains(e.target)) return
      setShowUserMenu(false)
    }
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowUserMenu(false)
        menuButtonRef.current?.focus({ preventScroll: true })
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('keydown', handleKeyDown)
    menuRef.current?.querySelector('[role="menuitem"]')?.focus({ preventScroll: true })
    return () => {
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [showUserMenu])

  const handleLogout = async () => {
    await logout()
    toast.info('Đã đăng xuất')
    navigate('/login')
  }

  const displayName = user?.fullName || (role === 'ADMIN' ? 'Ban Quản trị' : (user?.phoneNumber || 'Giáo viên'))

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
  const notificationLabel = role === 'ADMIN'
    ? (adminPendingCount > 0 ? `Có ${adminPendingCount} yêu cầu mới chờ duyệt` : 'Không có yêu cầu chờ duyệt')
    : (teacherNewResponseCount > 0 ? `Có ${teacherNewResponseCount} phản hồi yêu cầu mới` : 'Không có phản hồi mới')

  const breadcrumb = getBreadcrumb(role, location.pathname)

  const handleMenuKeyDown = (e) => {
    if (!['ArrowDown', 'ArrowUp'].includes(e.key)) return
    const items = Array.from(menuRef.current.querySelectorAll('[role="menuitem"]'))
    if (items.length === 0) return
    e.preventDefault()
    const idx = items.indexOf(document.activeElement)
    const next = e.key === 'ArrowDown' ? (idx + 1) % items.length : (idx - 1 + items.length) % items.length
    items[next].focus()
  }

  return (
    <div className="flex min-h-[100dvh] bg-canvas">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[110] focus:rounded-xl focus:bg-primary-strong focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-white focus:shadow-pop"
      >
        Bỏ qua tới nội dung chính
      </a>

      <Sidebar role={role} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-20 glass border-b border-line h-16 flex items-center justify-between gap-3 px-4 lg:px-6">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Mở menu điều hướng"
              aria-expanded={sidebarOpen}
              aria-controls="app-sidebar"
              className="lg:hidden inline-flex h-11 w-11 items-center justify-center rounded-xl text-content-muted hover:bg-surface-muted hover:text-content transition-colors"
            >
              <Menu className="w-5 h-5" aria-hidden="true" />
            </button>

            <nav aria-label="Breadcrumb" className="min-w-0">
              <ol className="flex items-center gap-1 text-sm">
                {breadcrumb.map((crumb, idx) => (
                  <li key={crumb.to + idx} className="flex items-center gap-1 min-w-0">
                    {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-content-subtle shrink-0" aria-hidden="true" />}
                    {crumb.current ? (
                      <span aria-current="page" className="font-semibold text-content truncate font-display">
                        {crumb.label}
                      </span>
                    ) : (
                      <Link to={crumb.to} className="text-content-muted hover:text-primary-soft-text transition-colors truncate">
                        {crumb.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <ThemeToggle />

            <Link
              to={notificationLink}
              aria-label={notificationLabel}
              title={notificationLabel}
              className="relative inline-flex h-11 w-11 items-center justify-center rounded-xl text-content-muted hover:bg-surface-muted hover:text-content transition-colors"
            >
              <Bell className="w-5 h-5" aria-hidden="true" />
              {notificationCount > 0 && (
                <span className="absolute top-1 right-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white ring-2 ring-surface">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </Link>

            {/* User menu */}
            <div className="relative" ref={menuRef}>
              <button
                ref={menuButtonRef}
                onClick={() => setShowUserMenu(!showUserMenu)}
                aria-haspopup="menu"
                aria-expanded={showUserMenu}
                aria-label={`Tài khoản ${displayName}`}
                className="flex items-center gap-2.5 min-h-11 py-1 px-2 rounded-xl hover:bg-surface-muted transition-colors"
              >
                <span className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-sm shadow-sm">
                  {initials}
                </span>
                <span className="hidden sm:block text-left">
                  <span className="block text-sm font-semibold text-content leading-tight line-clamp-1 max-w-[160px]">{displayName}</span>
                  <span className="block text-[11px] text-content-subtle leading-tight">{role === 'ADMIN' ? 'Quản trị viên' : (user?.phoneNumber || 'Giáo viên')}</span>
                </span>
                <ChevronDown className={`w-4 h-4 text-content-subtle transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} aria-hidden="true" />
              </button>

              {showUserMenu && (
                <div
                  role="menu"
                  aria-label="Tùy chọn tài khoản"
                  onKeyDown={handleMenuKeyDown}
                  className="absolute right-0 top-full mt-2 w-60 bg-surface rounded-xl shadow-pop border border-line py-2 z-50 animate-scale-in origin-top-right"
                >
                  <div className="px-4 py-2.5 border-b border-line">
                    <p className="text-sm font-bold text-content line-clamp-1">{displayName}</p>
                    <p className="text-xs text-content-subtle mt-0.5 font-mono">{user?.phoneNumber}</p>
                    <span className="inline-block mt-2 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-md bg-primary-soft text-primary-soft-text">
                      {role === 'ADMIN' ? 'Quản trị viên' : 'Giáo viên'}
                    </span>
                  </div>
                  <button
                    role="menuitem"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-danger-text hover:bg-danger-soft transition-colors mt-1 font-medium"
                  >
                    <LogOut className="w-4 h-4" aria-hidden="true" />
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main id="main-content" tabIndex={-1} className="flex-1 p-4 lg:p-6 max-w-[1400px] w-full mx-auto focus:outline-none">
          <Outlet />
        </main>
      </div>
    </div>
  )
}