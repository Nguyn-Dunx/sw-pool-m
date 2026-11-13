import { useState } from 'react'
import { LoaderCircle } from 'lucide-react'

export const PAYMENT_STATUS_META = {
  PAID: { label: 'Đã đóng', color: 'green' },
  UNPAID: { label: 'Chưa đóng', color: 'red' },
  UNKNOWN: { label: 'Chưa xác nhận', color: 'gray' }
}

export const PAYMENT_STATUS_OPTIONS = Object.entries(PAYMENT_STATUS_META).map(([value, meta]) => ({
  value,
  label: meta.label,
  badgeColor: meta.color
}))

const selectStyles = {
  PAID: 'border-success/30 bg-success-soft text-success-text',
  UNPAID: 'border-danger/30 bg-danger-soft text-danger-text',
  UNKNOWN: 'border-line bg-surface-muted text-content-muted'
}

export default function PaymentStatusSelect({ value, studentName, onChange, disabled = false }) {
  const [saving, setSaving] = useState(false)
  const currentValue = PAYMENT_STATUS_META[value] ? value : 'UNKNOWN'

  const handleChange = async (event) => {
    setSaving(true)
    try {
      await onChange(event.target.value)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="relative inline-flex items-center">
      <select
        value={currentValue}
        onChange={handleChange}
        disabled={disabled || saving}
        aria-label={`Trạng thái học phí của ${studentName}`}
        aria-busy={saving}
        className={`min-h-11 min-w-36 cursor-pointer rounded-xl border py-2 pl-3 pr-8 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${selectStyles[currentValue]}`}
      >
        {PAYMENT_STATUS_OPTIONS.map(option => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
      {saving && (
        <LoaderCircle className="pointer-events-none absolute right-2.5 h-4 w-4 animate-spin text-current" aria-hidden="true" />
      )}
      <span className="sr-only" role="status">{saving ? 'Đang lưu trạng thái học phí' : ''}</span>
    </div>
  )
}