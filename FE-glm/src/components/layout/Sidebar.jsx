import { useEffect, useRef } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Waves, LogOut, X } from 'lucide-react'
import { useAuth } from '../../store/auth'
import { useRequestNotification } from '../../store/notifications'
import { toast } from '../ui/Toast'
import { getNavItems } from './nav'
import { lockScroll, unlockScroll } from '../../lib/scrollLock'

export default function Sidebar({ role, open, onClose }) {
  const items = getNavItems(role)
  const { logout } = useAuth()
  const { adminPendingCount, teacherNewResponseCount } = useRequestNotification()
  const navigate = useNavigate()
  const asideRef = useRef(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  // Mobile drawer: khóa scroll, Escape, focus trap, trả focus khi đóng
  useEffect(() => {
    if (!open) return
    const previouslyFocused = document.activeElement
    lockScroll()
    const aside = asideRef.current
    const getFocusable = () => Array.from(
      aside.querySelectorAll('a[href], button:not([disabled])')
    ).filter((el) => el.getClientRects().length > 0)
    getFocusable()[0]?.focus({ preventScroll: true })

    const isMobile = () => window.innerWidth < 1024
    const handleKeyDown = (e) => {
      if (!isMobile()) return
      if (e.key === 'Escape') {
        e.preventDefault()
        onCloseRef.current()
        return
      }
      if (e.key === 'Tab') {
        const focusable = getFocusable()
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    const handleResize = () => { if (!isMobile()) onCloseRef.current() }
    document.addEventListener('keydown', handleKeyDown)
    window.addEventListener('resize', handleResize)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('resize', handleResize)
      unlockScroll()
      if (previouslyFocused && previouslyFocused.focus) previouslyFocused.focus({ preventScroll: true })
    }
  }, [open])

  const handleLogout = async () => {
    await logout()
    toast.info('Đã đăng xuất')
    navigate('/login')
  }

  const getBadgeCount = (item) => {
    if (!item.hasNotification) return 0
    return role === 'ADMIN' ? adminPendingCount : teacherNewResponseCount
  }

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Đóng menu điều hướng"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-scrim backdrop-blur-sm lg:hidden animate-fade-in cursor-default"
        />
      )}

      <aside
        ref={asideRef}
        id="app-sidebar"
        aria-label="Điều hướng chính"
        className={`fixed lg:sticky top-0 left-0 z-40 h-[100dvh] w-[272px] shrink-0 bg-surface border-r border-line flex flex-col transition-transform duration-300 ease-out ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-line shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-sm">
              <Waves className="w-5 h-5 text-white" aria-hidden="true" />
            </div>
            <div>
              <p className="font-bold text-content leading-tight tracking-tight font-display">Pool Manager</p>
              <p className="text-[11px] text-content-subtle leading-tight font-medium">
                {role === 'ADMIN' ? 'Quản trị viên' : 'Giáo viên'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Đóng menu"
            className="lg:hidden inline-flex h-11 w-11 items-center justify-center rounded-xl text-content-subtle hover:bg-surface-muted hover:text-content transition-colors"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Nav */}
        <nav aria-label="Menu chính" className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <p className="text-[10px] font-semibold text-content-subtle uppercase tracking-wider px-3 mb-2">Menu chính</p>
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
                      ? 'bg-primary-soft text-primary-soft-text'
                      : 'text-content-muted hover:bg-surface-muted hover:text-content'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-primary" aria-hidden="true" />}
                    <div className="relative">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                        isActive ? 'bg-primary text-white shadow-sm' : 'bg-surface-muted text-content-subtle group-hover:bg-line group-hover:text-content-muted'
                      }`}>
                        <item.icon className="w-4 h-4" aria-hidden="true" />
                      </div>
                      {badgeCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-danger ring-2 ring-surface" aria-hidden="true" />
                      )}
                    </div>
                    <span className="flex-1">{item.label}</span>
                    {badgeCount > 0 ? (
                      <span
                        className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold bg-danger text-white"
                        aria-label={`${badgeCount} thông báo mới`}
                      >
                        {badgeCount > 99 ? '99+' : badgeCount}
                      </span>
                    ) : isActive ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" aria-hidden="true" />
                    ) : null}
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 py-3 border-t border-line shrink-0">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-danger-text hover:bg-danger-soft transition-colors"
          >
            <span className="w-8 h-8 rounded-lg bg-danger-soft flex items-center justify-center">
              <LogOut className="w-4 h-4" aria-hidden="true" />
            </span>
            Đăng xuất
          </button>
        </div>
      </aside>
    </>
  )
}