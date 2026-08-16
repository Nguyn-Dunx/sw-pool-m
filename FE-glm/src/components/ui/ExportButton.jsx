import { useState } from 'react'
import { FileSpreadsheet, Loader2 } from 'lucide-react'

/**
 * Nút Xuất Excel dùng chung có hiệu ứng loading spinner và style trang nhã
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

  const sizeCls = size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || loading}
      title={title}
      className={`inline-flex items-center justify-center gap-1.5 font-medium rounded-xl border transition-all duration-200
        bg-emerald-50/90 text-emerald-700 border-emerald-200/80 hover:bg-emerald-100 hover:border-emerald-300
        shadow-sm hover:shadow active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
        ${sizeCls} ${className}`}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
      ) : (
        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
      )}
      <span>{loading ? loadingLabel : label}</span>
    </button>
  )
}
