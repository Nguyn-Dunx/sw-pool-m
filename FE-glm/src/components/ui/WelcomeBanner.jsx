import { useId } from 'react'
import { Waves } from 'lucide-react'

/**
 * WelcomeBanner — lời chào đầu trang dashboard với dải sóng nước chuyển động nhẹ.
 * Sóng chỉ chạy khi không bật prefers-reduced-motion (xem index.css).
 */
export default function WelcomeBanner({ name, subtitle }) {
  const uid = useId().replace(/:/g, '')
  const waveId = `wave-${uid}`

  return (
    <div
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-strong via-primary to-accent px-6 py-6 sm:px-8 sm:py-7 shadow-card"
      data-stagger
    >
      <div className="relative z-10 flex items-center gap-4">
        <div className="hidden sm:flex w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-sm items-center justify-center shrink-0">
          <Waves className="w-6 h-6 text-white" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-white/80">Xin chào,</p>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-display truncate">{name}</h1>
          {subtitle && <p className="text-sm text-white/75 mt-0.5">{subtitle}</p>}
        </div>
      </div>

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