import { useEffect, useId, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import { getTeachers } from '../../lib/apiAdmin'
import { useDebounce } from '../../lib/useDebounce'
import { Badge, Field, inputCls } from './index'

/**
 * TeacherPicker — combobox chọn nhiều giáo viên, có tìm kiếm, điều hướng bàn phím.
 * selected: [{ id, fullName }] — onChange(nextSelected).
 */
export default function TeacherPicker({ selected = [], onChange, label = 'Giáo viên phụ trách', required, hint, error, placeholder = 'Tìm giáo viên theo tên...' }) {
  const inputId = useId()
  const listId = useId()
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [teachers, setTeachers] = useState([])
  const [activeIdx, setActiveIdx] = useState(0)
  const wrapRef = useRef(null)
  const inputRef = useRef(null)
  const debounced = useDebounce(search, 250)

  useEffect(() => {
    getTeachers({ keyword: debounced, page: 1, size: 50 })
      .then((r) => setTeachers(r.content || []))
      .catch(() => setTeachers([]))
  }, [debounced])

  useEffect(() => {
    if (!open) return
    const handleMouseDown = (e) => {
      if (wrapRef.current?.contains(e.target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [open])

  const filtered = teachers.filter((t) => !selected.find((s) => s.id === t.id))

  useEffect(() => { setActiveIdx(0) }, [debounced, open])

  const add = (t) => {
    if (!selected.find((s) => s.id === t.id)) onChange([...selected, t])
    setSearch('')
    setOpen(false)
    inputRef.current?.focus()
  }
  const remove = (id) => onChange(selected.filter((t) => t.id !== id))

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      setActiveIdx((i) => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      if (open && filtered[activeIdx]) {
        e.preventDefault()
        add(filtered[activeIdx])
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <Field label={label} required={required} hint={hint} error={error} htmlFor={inputId}>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-1">
          {selected.map((t) => (
            <span key={t.id} className="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-lg bg-primary-soft text-primary-soft-text text-sm font-medium border border-primary/20">
              {t.fullName}
              <button
                type="button"
                onClick={() => remove(t.id)}
                aria-label={`Bỏ giáo viên ${t.fullName}`}
                className="inline-flex h-6 w-6 items-center justify-center rounded-md hover:bg-primary/15 transition-colors"
              >
                <X className="w-3 h-3" aria-hidden="true" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="relative" ref={wrapRef}>
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-content-subtle pointer-events-none" aria-hidden="true" />
        <input
          ref={inputRef}
          id={inputId}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && filtered[activeIdx] ? `${listId}-opt-${activeIdx}` : undefined}
          placeholder={placeholder}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          className={inputCls + ' pl-10'}
        />
        {open && (
          <div
            id={listId}
            role="listbox"
            aria-label="Danh sách giáo viên"
            className="absolute z-50 left-0 right-0 top-full mt-1 bg-surface border border-line rounded-xl shadow-pop max-h-44 overflow-y-auto"
          >
            {filtered.length === 0 ? (
              <p className="text-sm text-content-subtle py-3 text-center">Không tìm thấy giáo viên</p>
            ) : (
              filtered.map((t, idx) => (
                <button
                  type="button"
                  key={t.id}
                  id={`${listId}-opt-${idx}`}
                  role="option"
                  aria-selected={idx === activeIdx}
                  onClick={() => add(t)}
                  onMouseEnter={() => setActiveIdx(idx)}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 transition-colors text-left border-b border-line/50 last:border-0 ${
                    idx === activeIdx ? 'bg-primary-soft/60' : 'hover:bg-surface-muted'
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-content truncate">{t.fullName}</span>
                    <span className="block text-xs text-content-subtle">{t.phoneNumber} {t.specialty ? `• ${t.specialty}` : ''}</span>
                  </span>
                  <Badge color={t.status === 'ACTIVE' ? 'green' : 'gray'}>{t.status === 'ACTIVE' ? 'Đang dạy' : t.status}</Badge>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </Field>
  )
}