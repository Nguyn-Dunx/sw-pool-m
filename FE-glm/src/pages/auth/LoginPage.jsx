import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Waves, Phone, Lock, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAuth } from '../../store/auth'
import { fetchCsrfToken } from '../../lib/api'
import { Button, Field, inputCls } from '../../components/ui'
import { toast } from '../../components/ui/Toast'

export default function LoginPage() {
  const [form, setForm] = useState({ phoneNumber: '', password: '', rememberMe: false })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      // Fetch CSRF token trước (Spring set cookie XSRF-TOKEN)
      await fetchCsrfToken()
      const data = await login(form)
      toast.success('Đăng nhập thành công')
      navigate(data?.role === 'ADMIN' ? '/admin' : '/teacher', { replace: true })
    } catch (err) {
      toast.error(err.message || 'Đăng nhập thất bại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-4 bg-gradient-to-br from-pool-100 via-pool-50 to-white bg-gradient-animated relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-pool-200/30 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-pool-300/20 rounded-full blur-3xl" style={{ animationDelay: '1.5s', animation: 'float 4s ease-in-out infinite' }} />
        <div className="absolute top-1/4 left-1/4 w-40 h-40 bg-pool-100/40 rounded-full blur-2xl" style={{ animationDelay: '0.8s', animation: 'float 5s ease-in-out infinite' }} />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8 animate-fade-in-up">
          <div className="w-18 h-18 rounded-2xl bg-gradient-to-br from-pool-400 to-pool-600 shadow-xl shadow-pool-300/40 flex items-center justify-center mb-4" style={{ width: 72, height: 72 }}>
            <Waves className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-ink-900 tracking-tight">Pool Manager</h1>
          <p className="text-sm text-ink-500 mt-1 font-medium">Hệ thống quản lý bể bơi thông minh</p>
        </div>

        {/* Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-pool-200/30 border border-white/60 p-7 sm:p-9 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <h2 className="text-xl font-bold text-ink-900 mb-1">Đăng nhập</h2>
          <p className="text-sm text-ink-500 mb-7">Nhập số điện thoại và mật khẩu để tiếp tục</p>

          <form onSubmit={submit} className="space-y-5">
            <Field label="Số điện thoại" required>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                <input
                  type="tel"
                  value={form.phoneNumber}
                  onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                  className={inputCls + ' pl-10'}
                  placeholder="0xxx xxx xxx"
                  required
                  autoFocus
                  autoComplete="username"
                />
              </div>
            </Field>

            <Field label="Mật khẩu" required>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className={inputCls + ' pl-10 pr-10'}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600 transition-colors"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </Field>

            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.rememberMe}
                onChange={(e) => setForm({ ...form, rememberMe: e.target.checked })}
                className="w-4 h-4 rounded border-ink-300 text-pool-600 focus:ring-pool-400 focus:ring-offset-0"
              />
              <span className="text-sm text-ink-600 font-medium">Ghi nhớ đăng nhập (30 ngày)</span>
            </label>

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang đăng nhập...
                </>
              ) : (
                'Đăng nhập'
              )}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-ink-400 mt-8 font-medium animate-fade-in" style={{ animationDelay: '0.3s' }}>
          © 2026 Pool Manager. Phát triển bởi The Wiii Lab.
        </p>
      </div>
    </div>
  )
}
