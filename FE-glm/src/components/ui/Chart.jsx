import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts'
import { Activity } from 'lucide-react'
import { useTheme } from '../../lib/theme'
import { Badge, Card } from './index'

const GRADIENTS = {
  primary: ['#38bdf8', '#0284c7'],
  accent: ['#2dd4bf', '#0d9488'],
  success: ['#34d399', '#059669'],
  warning: ['#fbbf24', '#d97706'],
  info: ['#60a5fa', '#2563eb']
}

function cssVar(name, fallback) {
  if (typeof window === 'undefined') return fallback
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return v || fallback
}

/** Bảng màu chart đọc từ CSS variable để tự đổi theo light/dark. */
export function useChartTheme() {
  const { theme } = useTheme()
  return useMemo(() => ({
    grid: cssVar('--color-line', '#e2e8f0'),
    tick: cssVar('--color-content-subtle', '#8a99b5'),
    tooltipBg: cssVar('--color-surface', '#ffffff'),
    tooltipBorder: cssVar('--color-line', '#e2e8f0'),
    tooltipText: cssVar('--color-content', '#0f172a'),
    cursor: theme === 'dark' ? 'rgba(56,189,248,0.08)' : 'rgba(2,132,199,0.06)'
  }), [theme])
}

let gradientSeq = 0

/**
 * TrendChart — biểu đồ cột dùng chung, theme-aware, có gradient và tooltip đẹp.
 * data: [{ label, value }]
 */
export function TrendChart({ data = [], color = 'primary', height = 280, name = 'Số lượng', emptyText = 'Chưa có dữ liệu' }) {
  const t = useChartTheme()
  const gid = useMemo(() => `trend-grad-${color}-${++gradientSeq}`, [color])
  const [from, to] = GRADIENTS[color] || GRADIENTS.primary

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center" style={{ height }}>
        <Activity className="w-8 h-8 text-content-subtle mb-2" aria-hidden="true" />
        <p className="text-sm text-content-subtle">{emptyText}</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={from} />
            <stop offset="100%" stopColor={to} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={t.grid} vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 12, fill: t.tick }} axisLine={false} tickLine={false} dy={6} />
        <YAxis tick={{ fontSize: 12, fill: t.tick }} axisLine={false} tickLine={false} allowDecimals={false} width={40} />
        <Tooltip
          contentStyle={{
            borderRadius: 12,
            border: `1px solid ${t.tooltipBorder}`,
            background: t.tooltipBg,
            color: t.tooltipText,
            fontSize: 13,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
          }}
          labelStyle={{ color: t.tooltipText, fontWeight: 600, marginBottom: 2 }}
          itemStyle={{ color: t.tooltipText }}
          cursor={{ fill: t.cursor, radius: 8 }}
        />
        <Bar dataKey="value" fill={`url(#${gid})`} radius={[8, 8, 0, 0]} name={name} maxBarSize={48} />
      </BarChart>
    </ResponsiveContainer>
  )
}

/** ChartCard — khung card chứa biểu đồ với tiêu đề và badge. */
export function ChartCard({ title, icon: Icon = Activity, badge, badgeColor = 'blue', children, className = '' }) {
  return (
    <Card className={`p-5 ${className}`} data-stagger>
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-8 h-8 rounded-lg bg-primary-soft text-primary-soft-text flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4" aria-hidden="true" />
          </span>
          <h2 className="font-semibold text-content truncate font-display">{title}</h2>
        </div>
        {badge && <Badge color={badgeColor}>{badge}</Badge>}
      </div>
      {children}
    </Card>
  )
}