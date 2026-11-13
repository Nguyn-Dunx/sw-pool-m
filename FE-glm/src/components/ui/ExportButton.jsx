import { useState } from 'react'
import { FileSpreadsheet, Loader2 } from 'lucide-react'

/**
 * Nút Xuất Excel dùng chung — có trạng thái loading và aria-busy.
 */
export default function ExportButton({
  onExport,
  label = 'Xuất Excel',
  loadingLabel = 'Đang xuất...',
  size = 'sm',
  className = '',
  disabled = false,
  title = 'Xuất toàn bộ danh sách hiện tại ra file Excel (.xlsx)'
}) {
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    if (loading || disabled || !onExport) return
    setLoading(true)
    try {
      await onExport()
    } finally {
      setLoading(false)
    }
  }

  const sizeCls = size === 'sm' ? 'min-h-11 px-3.5 text-xs' : 'min-h-11 px-4 text-sm'

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || loading}
      title={title}
      aria-busy={loading || undefined}
      className={`inline-flex items-center justify-center gap-1.5 font-semibold rounded-xl border transition-all duration-200
        bg-success-soft text-success-text border-success/25 hover:bg-success/15 hover:border-success/40
        shadow-sm active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
        ${sizeCls} ${className}`}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
      ) : (
        <FileSpreadsheet className="w-4 h-4 shrink-0" aria-hidden="true" />
      )}
      <span>{loading ? loadingLabel : label}</span>
    </button>
  )
}