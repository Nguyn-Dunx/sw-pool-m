import { Link } from 'react-router-dom'
import { Waves } from 'lucide-react'
import { Button } from '../components/ui'

export default function NotFoundPage() {
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center p-4 bg-gradient-to-br from-pool-50 via-white to-pool-100">
      <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-pool-400 to-pool-600 flex items-center justify-center mb-6 shadow-xl shadow-pool-200/40 animate-float">
        <Waves className="w-10 h-10 text-white" />
      </div>
      <h1 className="text-7xl font-extrabold text-pool-700 mb-2 tracking-tight animate-fade-in-up">404</h1>
      <p className="text-ink-500 mb-8 text-center max-w-sm animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        Trang bạn tìm không tồn tại hoặc đã bị di chuyển.
      </p>
      <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <Link to="/">
          <Button size="lg">Về trang chủ</Button>
        </Link>
      </div>
    </div>
  )
}
