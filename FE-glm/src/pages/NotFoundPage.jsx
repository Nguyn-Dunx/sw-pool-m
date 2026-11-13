import { useNavigate } from 'react-router-dom'
import { Waves, Home, ArrowLeft } from 'lucide-react'
import { Button } from '../components/ui'

export default function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <div className="relative min-h-[100dvh] flex flex-col items-center justify-center p-4 bg-gradient-to-br from-primary-soft via-canvas to-accent-soft/40 overflow-hidden">
      <div className="absolute -top-20 -right-16 w-72 h-72 rounded-full bg-primary-soft/50 blur-3xl pointer-events-none" aria-hidden="true" />
      <div className="absolute -bottom-24 -left-16 w-80 h-80 rounded-full bg-accent-soft/40 blur-3xl pointer-events-none" aria-hidden="true" />

      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-6 shadow-xl shadow-primary/25 animate-float">
          <Waves className="w-10 h-10 text-white" aria-hidden="true" />
        </div>
        <h1 className="text-7xl font-extrabold text-primary-soft-text mb-2 tracking-tight font-display animate-fade-in-up tabular-nums">404</h1>
        <p className="text-content-muted mb-8 max-w-sm animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          Trang bạn tìm không tồn tại hoặc đã bị di chuyển.
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-3 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <Button size="lg" onClick={() => navigate('/')}>
            <Home className="w-4 h-4" aria-hidden="true" /> Về trang chủ
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Quay lại
          </Button>
        </div>
      </div>
    </div>
  )
}