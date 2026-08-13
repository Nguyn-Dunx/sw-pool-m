import { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { Menu, LogOut, ChevronDown } from 'lucide-react'
import Sidebar from './Sidebar'
import { useAuth } from '../../store/auth'
import { toast } from '../ui/Toast'

export default function AppLayout({ role }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    toast.info('Đã đăng xuất')
    navigate('/login')
  }

  const initials = (user?.phoneNumber || '??').slice(-2)

  return (
    <div className="flex min-h-[100dvh] bg-gradient-to-br from-pool-50/50 via-white to-pool-50/30">
      <Sidebar role={role} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-lg border-b border-ink-100/60 h-16 flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-ink-600 hover:bg-ink-100 active:bg-ink-200 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="hidden lg:block">
              <p className="text-xs text-ink-400 font-medium">Xin chào,</p>
              <p className="text-sm font-semibold text-ink-800">{user?.phoneNumber || 'User'}</p>
            </div>
          </div>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2.5 py-1.5 px-2 rounded-xl hover:bg-ink-50 transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pool-400 to-pool-600 flex items-center justify-center text-white font-semibold text-sm shadow-sm shadow-pool-200">
                {initials}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-ink-800 leading-tight">{user?.phoneNumber || 'User'}</p>
                <p className="text-[11px] text-ink-400 leading-tight">{role === 'ADMIN' ? 'Quản trị viên' : 'Giáo viên'}</p>
              </div>
              <ChevronDown className={`w-4 h-4 text-ink-400 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown */}
            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-xl border border-ink-100 py-1.5 z-50 animate-scale-in origin-top-right">
                  <div className="px-4 py-2.5 border-b border-ink-100">
                    <p className="text-sm font-semibold text-ink-800">{user?.phoneNumber}</p>
                    <p className="text-xs text-ink-400 mt-0.5">{role === 'ADMIN' ? 'Quản trị viên' : 'Giáo viên'}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Đăng xuất
                  </button>
                </div>
              </>
            )}
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
