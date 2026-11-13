import { useId, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Waves, Phone, Lock, Eye, EyeOff, Sun, Moon, ShieldCheck, CalendarCheck, BellRing, AlertCircle } from 'lucide-react'
import { useAuth } from '../../store/auth'
import { useTheme } from '../../lib/theme'
import { fetchCsrfToken } from '../../lib/api'
import { Button, inputCls } from '../../components/ui'
import { PageTransition } from '../../components/motion/Motion'
import { toast } from '../../components/ui/Toast'

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'
  return (
    <button
      type="button"
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

const FEATURES = [
  { icon: ShieldCheck, title: 'Phân quyền rõ ràng', desc: 'Admin và Giáo viên thao tác đúng phạm vi, dữ liệu được bảo vệ.' },
  { icon: CalendarCheck, title: 'Điểm danh & học phí', desc: 'Theo dõi buổi học, tiến độ và trạng thái đóng tiền từng khóa.' },
  { icon: BellRing, title: 'Cảnh báo tự động', desc: 'Nhắc khóa sắp hết hạn và học viên vắng học kịp thời.' }
]

function BrandPanel() {
  const uid = useId().replace(/:/g, '')
  const waveId = `login-wave-${uid}`
  return (
    <div className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-gradient-to-br from-primary-strong via-primary to-accent p-12 xl:p-14">
      <div className="absolute -top-24 -right-16 w-80 h-80 rounded-full bg-white/10 blur-3xl pointer-events-none" aria-hidden="true" />
      <div className="absolute top-1/3 -left-20 w-72 h-72 rounded-full bg-accent-soft/20 blur-3xl pointer-events-none" aria-hidden="true" />

      <div className="relative z-10 flex items-center gap-3 animate-fade-in-up">
        <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center shrink-0">
          <Waves className="w-6 h-6 text-white" aria-hidden="true" />
        </div>
        <div>
          <p className="text-lg font-bold text-white tracking-tight font-display">Pool Manager</p>
          <p className="text-xs text-white/75 font-medium">Hệ thống quản lý bể bơi</p>
        </div>
      </div>

      <div className="relative z-10 max-w-md">
        <h2 className="text-3xl xl:text-4xl font-extrabold text-white leading-tight tracking-tight font-display animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
          Vận hành bể bơi<br />gọn gàng, mỗi ngày.
        </h2>
        <p className="mt-3 text-white/80 text-sm leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          Quản lý học viên, khóa học, điểm danh và học phí trên một giao diện thống nhất, tin cậy.
        </p>

        <ul className="mt-8 space-y-4">
          {FEATURES.map((f, i) => (
            <li key={f.title} className="flex items-start gap-3.5 animate-fade-in-up" style={{ animationDelay: `${0.15 + i * 0.07}s` }}>
              <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center shrink-0">
                <f.icon className="w-5 h-5 text-white" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{f.title}</p>
                <p className="text-xs text-white/70 mt-0.5 leading-relaxed">{f.desc}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <p className="relative z-10 text-xs text-white/60 font-medium animate-fade-in" style={{ animationDelay: '0.4s' }}>
        © 2026 Pool Manager · Phát triển bởi The Wiii Lab.
      </p>

      <div className="water-waves" aria-hidden="true">
        <svg viewBox="0 0 2880 120" preserveAspectRatio="none">
          <defs>
            <path id={waveId} d="M0,60 C120,90 240,30 360,60 C480,90 600,30 720,60 C840,90 960,30 1080,60 C1200,90 1320,30 1440,60 L1440,120 L0,120 Z" />
          </defs>
          <use href={`#${waveId}`} fill="rgba(255,255,255,0.10)" />
          <use href={`#${waveId}`} x="1440" fill="rgba(255,255,255,0.10)" />
        </svg>
        <svg viewBox="0 0 2880 120" preserveAspectRatio="none" className="wave-slow">
          <use href={`#${waveId}`} fill="rgba(255,255,255,0.08)" />
          <use href={`#${waveId}`} x="1440" fill="rgba(255,255,255,0.08)" />
        </svg>
      </div>
    </div>
  )
}

export default function LoginPage() {
  const [form, setForm] = useState({ phoneNumber: '', password: '', rememberMe: false })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const uid = useId().replace(/:/g, '')
  const phoneId = `${uid}-phone`
  const phoneErrId = `${uid}-phone-err`
  const pwId = `${uid}-password`
  const pwErrId = `${uid}-password-err`

  const setField = (key, val) => {
    setForm((f) => ({ ...f, [key]: val }))
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }))
    if (formError) setFormError('')
  }

  const validate = () => {
    const next = {}
    if (!form.phoneNumber.trim()) next.phoneNumber = 'Vui lòng nhập số điện thoại'
    if (!form.password) next.password = 'Vui lòng nhập mật khẩu'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setFormError('')
    setLoading(true)
    try {
      // Fetch CSRF token trước (Spring set cookie XSRF-TOKEN)
      await fetchCsrfToken()
      const data = await login({ ...form, phoneNumber: form.phoneNumber.trim() })
      toast.success('Đăng nhập thành công')
      navigate(data?.role === 'ADMIN' ? '/admin' : '/teacher', { replace: true })
    } catch (err) {
      const msg = err.message || 'Đăng nhập thất bại'
      setFormError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[100dvh] w-full lg:grid lg:grid-cols-2 bg-canvas">
      <BrandPanel />

      <div className="relative flex min-h-[100dvh] flex-col items-center justify-center p-4 sm:p-8 overflow-hidden">
        <div className="absolute top-4 right-4 z-20"><ThemeToggle /></div>
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-primary-soft/50 blur-3xl pointer-events-none lg:hidden" aria-hidden="true" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-accent-soft/40 blur-3xl pointer-events-none lg:hidden" aria-hidden="true" />

        <PageTransition className="w-full max-w-md relative z-10">
          {/* Brand compact cho mobile */}
          <div className="flex flex-col items-center mb-7 lg:hidden" data-stagger>
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/25 flex items-center justify-center mb-3">
              <Waves className="w-8 h-8 text-white" aria-hidden="true" />
            </div>
            <h1 className="text-2xl font-extrabold text-content tracking-tight font-display">Pool Manager</h1>
            <p className="text-sm text-content-muted mt-0.5 font-medium">Hệ thống quản lý bể bơi thông minh</p>
          </div>

          <div className="bg-surface rounded-3xl shadow-pop border border-line p-7 sm:p-9" data-stagger>
            <h2 className="text-xl font-bold text-content font-display">Đăng nhập</h2>
            <p className="text-sm text-content-muted mt-1 mb-6">Nhập số điện thoại và mật khẩu để tiếp tục</p>

            {formError && (
              <div role="alert" className="mb-5 flex items-start gap-2.5 rounded-xl bg-danger-soft border border-danger/20 px-3.5 py-3 animate-fade-in">
                <AlertCircle className="w-4 h-4 text-danger-text shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-sm text-danger-text font-medium">{formError}</p>
              </div>
            )}

            <form onSubmit={submit} className="space-y-5" noValidate>
              <div className="flex flex-col gap-1.5">
                <label htmlFor={phoneId} className="text-sm font-semibold text-content">
                  Số điện thoại <span className="text-danger" aria-hidden="true">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-content-subtle pointer-events-none" aria-hidden="true" />
                  <input
                    id={phoneId}
                    type="tel"
                    value={form.phoneNumber}
                    onChange={(e) => setField('phoneNumber', e.target.value)}
                    className={`${inputCls} pl-10`}
                    placeholder="0xxx xxx xxx"
                    autoFocus
                    autoComplete="username"
                    aria-invalid={errors.phoneNumber ? true : undefined}
                    aria-describedby={errors.phoneNumber ? phoneErrId : undefined}
                  />
                </div>
                {errors.phoneNumber && <p id={phoneErrId} role="alert" className="text-xs text-danger-text font-medium">{errors.phoneNumber}</p>}
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor={pwId} className="text-sm font-semibold text-content">
                  Mật khẩu <span className="text-danger" aria-hidden="true">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-content-subtle pointer-events-none" aria-hidden="true" />
                  <input
                    id={pwId}
                    type={showPw ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => setField('password', e.target.value)}
                    className={`${inputCls} pl-10 pr-12`}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    aria-invalid={errors.password ? true : undefined}
                    aria-describedby={errors.password ? pwErrId : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    aria-label={showPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    aria-pressed={showPw}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex h-9 w-9 items-center justify-center rounded-lg text-content-subtle hover:text-content hover:bg-surface-muted transition-colors"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
                  </button>
                </div>
                {errors.password && <p id={pwErrId} role="alert" className="text-xs text-danger-text font-medium">{errors.password}</p>}
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer select-none min-h-11">
                <input
                  type="checkbox"
                  checked={form.rememberMe}
                  onChange={(e) => setField('rememberMe', e.target.checked)}
                  className="w-4 h-4 rounded border-line-strong accent-primary"
                />
                <span className="text-sm text-content-muted font-medium">Ghi nhớ đăng nhập (30 ngày)</span>
              </label>

              <Button type="submit" size="lg" className="w-full" loading={loading}>
                {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </Button>
            </form>
          </div>

          <p className="text-center text-xs text-content-subtle mt-7 font-medium lg:hidden" data-stagger>
            © 2026 Pool Manager. Phát triển bởi The Wiii Lab.
          </p>
        </PageTransition>
      </div>
    </div>
  )
}