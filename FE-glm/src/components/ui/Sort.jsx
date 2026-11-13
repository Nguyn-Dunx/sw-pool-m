import { useMemo, useState } from 'react'
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'

function compareValues(a, b) {
  if (a === b) return 0
  if (a === undefined || a === null || a === '') return 1
  if (b === undefined || b === null || b === '') return -1
  const na = Number(a)
  const nb = Number(b)
  if (!Number.isNaN(na) && !Number.isNaN(nb) && String(a).trim() !== '' && String(b).trim() !== '') {
    return na - nb
  }
  const da = Date.parse(a)
  const db = Date.parse(b)
  if (!Number.isNaN(da) && !Number.isNaN(db) && /\d{4}-\d{2}-\d{2}/.test(String(a)) && /\d{4}-\d{2}-\d{2}/.test(String(b))) {
    return da - db
  }
  return String(a).localeCompare(String(b), 'vi', { sensitivity: 'base' })
}

/**
 * useClientSort — sắp xếp dữ liệu của TRANG HIỆN TẠI (không gọi lại API).
 * Backend giữ thứ tự cố định phía server, nên đây chỉ là sắp xếp cục bộ cho dễ đọc.
 */
export function useClientSort(items, initialKey = null) {
  const [sortKey, setSortKey] = useState(initialKey)
  const [sortDir, setSortDir] = useState('asc')

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sorted = useMemo(() => {
    if (!sortKey) return items
    const arr = [...items]
    arr.sort((a, b) => {
      const r = compareValues(a[sortKey], b[sortKey])
      return sortDir === 'asc' ? r : -r
    })
    return arr
  }, [items, sortKey, sortDir])

  return { sorted, sortKey, sortDir, toggleSort }
}

/** Nút tiêu đề cột có thể sắp xếp, kèm mũi tên chỉ hướng. */
export function SortHeader({ label, sortKey, activeKey, dir, onSort, align = 'left' }) {
  const active = activeKey === sortKey
  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      aria-label={`Sắp xếp theo ${label}${active ? (dir === 'asc' ? ' (tăng dần)' : ' (giảm dần)') : ''}`}
      title="Sắp xếp trong trang hiện tại"
      className={`inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 -mx-2 font-semibold transition-colors hover:bg-surface-muted hover:text-content ${
        active ? 'text-primary-soft-text' : 'text-content-muted'
      } ${align === 'right' ? 'flex-row-reverse' : ''}`}
    >
      <span>{label}</span>
      {active
        ? (dir === 'asc' ? <ArrowUp className="w-3.5 h-3.5" aria-hidden="true" /> : <ArrowDown className="w-3.5 h-3.5" aria-hidden="true" />)
        : <ArrowUpDown className="w-3.5 h-3.5 opacity-40" aria-hidden="true" />}
    </button>
  )
}

/** Ghi chú nhỏ cho biết sắp xếp chỉ áp dụng trong trang hiện tại. */
export function SortScopeNote({ active }) {
  if (!active) return null
  return <span className="text-[11px] text-content-subtle italic">Đang sắp xếp trong trang hiện tại</span>
}