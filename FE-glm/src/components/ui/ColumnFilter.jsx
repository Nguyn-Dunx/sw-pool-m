import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Filter, Search, X, Check, RotateCcw } from 'lucide-react'
import { Badge } from './Badge'

const DROPDOWN_WIDTH = 248

/**
 * ColumnHeaderFilter — lọc tại header cột.
 * Dropdown render qua portal nên không bị cắt bởi overflow của bảng;
 * hỗ trợ Escape, phím mũi tên, trả focus về nút trigger.
 */
export function ColumnHeaderFilter({
  label,
  type = 'select',
  value,
  onChange,
  options = [],
  placeholder = 'Tìm kiếm...',
  align = 'left',
  className = ''
}) {
  const [open, setOpen] = useState(false)
  const [tempSearch, setTempSearch] = useState(value || '')
  const [pos, setPos] = useState({ left: 0, top: 0, maxHeight: 320 })
  const triggerRef = useRef(null)
  const dropdownRef = useRef(null)
  const inputRef = useRef(null)

  const isActive = value !== undefined && value !== null && value !== ''

  useEffect(() => { setTempSearch(value || '') }, [value])

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current
    if (!trigger) return
    const rect = trigger.getBoundingClientRect()
    const margin = 8
    let left = align === 'right' ? rect.right - DROPDOWN_WIDTH : rect.left
    left = Math.max(margin, Math.min(left, window.innerWidth - DROPDOWN_WIDTH - margin))
    const spaceBelow = window.innerHeight - rect.bottom - margin
    const spaceAbove = rect.top - margin
    const openUp = spaceBelow < 220 && spaceAbove > spaceBelow
    const maxHeight = Math.min(340, openUp ? spaceAbove : spaceBelow)
    const top = openUp ? Math.max(margin, rect.top - maxHeight - 6) : rect.bottom + 6
    setPos({ left, top, maxHeight: Math.max(160, maxHeight) })
  }, [align])

  useLayoutEffect(() => {
    if (!open) return
    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [open, updatePosition])

  const close = useCallback((returnFocus = true) => {
    setOpen(false)
    if (returnFocus) triggerRef.current?.focus({ preventScroll: true })
  }, [])

  useEffect(() => {
    if (!open) return
    const handleMouseDown = (e) => {
      if (triggerRef.current?.contains(e.target) || dropdownRef.current?.contains(e.target)) return
      setOpen(false)
    }
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        close()
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('keydown', handleKeyDown)
    const focusTarget = type === 'search' ? inputRef.current : dropdownRef.current?.querySelector('[data-filter-option]')
    focusTarget?.focus({ preventScroll: true })
    return () => {
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, type, close])

  const handleSelectOption = (optVal) => {
    onChange(optVal)
    close()
  }

  const handleSearchSubmit = (e) => {
    e?.preventDefault()
    onChange(tempSearch.trim())
    close()
  }

  const handleClear = (e) => {
    e?.stopPropagation()
    onChange('')
    setTempSearch('')
    close()
  }

  const handleDropdownKeyDown = (e) => {
    if (type === 'search') return
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) return
    const items = Array.from(dropdownRef.current.querySelectorAll('[data-filter-option]'))
    if (items.length === 0) return
    e.preventDefault()
    const idx = items.indexOf(document.activeElement)
    let next = 0
    if (e.key === 'ArrowDown') next = idx < items.length - 1 ? idx + 1 : 0
    else if (e.key === 'ArrowUp') next = idx > 0 ? idx - 1 : items.length - 1
    else if (e.key === 'End') next = items.length - 1
    items[next].focus()
  }

  const dropdownId = `column-filter-${label.replace(/\s+/g, '-').toLowerCase()}`

  return (
    <div className={`relative inline-flex items-center select-none ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(!open) }}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? dropdownId : undefined}
        aria-label={`Lọc theo ${label}${isActive ? ' (đang lọc)' : ''}`}
        title={`Lọc theo ${label}${isActive ? ' (đang lọc)' : ''}`}
        className={`inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 -mx-2 font-semibold transition-colors ${
          isActive ? 'text-primary-soft-text' : 'text-content-muted hover:text-content hover:bg-surface-muted'
        }`}
      >
        <span>{label}</span>
        <span className={`relative inline-flex h-6 w-6 items-center justify-center rounded-md ${isActive ? 'bg-primary-soft text-primary-soft-text' : 'text-content-subtle'}`}>
          {type === 'search' ? <Search className="w-3.5 h-3.5" aria-hidden="true" /> : <Filter className="w-3.5 h-3.5" aria-hidden="true" />}
          {isActive && <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-primary ring-2 ring-surface" aria-hidden="true" />}
        </span>
      </button>

      {open && createPortal(
        <div
          ref={dropdownRef}
          id={dropdownId}
          role="dialog"
          aria-label={`Lọc theo ${label}`}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={handleDropdownKeyDown}
          style={{ left: pos.left, top: pos.top, width: DROPDOWN_WIDTH, maxHeight: pos.maxHeight }}
          className="fixed z-[60] flex flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-pop animate-scale-in text-content"
        >
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-line shrink-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-content-subtle">Lọc {label}</span>
            {isActive && (
              <button
                type="button"
                onClick={handleClear}
                className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-semibold text-primary-soft-text hover:bg-primary-soft transition-colors"
              >
                <RotateCcw className="w-3 h-3" aria-hidden="true" /> Đặt lại
              </button>
            )}
          </div>

          <div className="overflow-y-auto">
            {type === 'search' ? (
              <form onSubmit={handleSearchSubmit} className="p-2.5 space-y-2">
                <div className="relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={tempSearch}
                    onChange={(e) => setTempSearch(e.target.value)}
                    placeholder={placeholder}
                    aria-label={`Tìm theo ${label}`}
                    className="w-full min-h-11 px-3 py-2 pr-9 text-sm rounded-lg border border-line bg-surface text-content placeholder-content-subtle"
                  />
                  {tempSearch && (
                    <button
                      type="button"
                      onClick={() => setTempSearch('')}
                      aria-label="Xóa từ khóa"
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-content-subtle hover:text-content"
                    >
                      <X className="w-4 h-4" aria-hidden="true" />
                    </button>
                  )}
                </div>
                <div className="flex items-center justify-end gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => { setTempSearch(''); onChange(''); close() }}
                    className="min-h-11 px-3 text-xs text-content-muted hover:bg-surface-muted rounded-lg font-medium transition-colors"
                  >
                    Xóa
                  </button>
                  <button
                    type="submit"
                    className="min-h-11 px-4 text-xs bg-primary-strong text-white rounded-lg hover:bg-primary-strong/90 font-semibold shadow-sm transition-colors"
                  >
                    Áp dụng
                  </button>
                </div>
              </form>
            ) : (
              <div className="py-1">
                <button
                  type="button"
                  data-filter-option
                  onClick={() => handleSelectOption('')}
                  aria-pressed={!isActive}
                  className={`w-full flex min-h-11 items-center justify-between px-3 py-2 text-sm text-left hover:bg-primary-soft/60 transition-colors font-medium ${
                    !isActive ? 'text-primary-soft-text font-bold bg-primary-soft/40' : 'text-content-muted'
                  }`}
                >
                  <span>Tất cả</span>
                  {!isActive && <Check className="w-4 h-4 text-primary" aria-hidden="true" />}
                </button>

                {options.map((opt) => {
                  const isSelected = String(value) === String(opt.value)
                  return (
                    <button
                      key={String(opt.value)}
                      type="button"
                      data-filter-option
                      onClick={() => handleSelectOption(opt.value)}
                      aria-pressed={isSelected}
                      className={`w-full flex min-h-11 items-center justify-between gap-2 px-3 py-2 text-sm text-left hover:bg-primary-soft/60 transition-colors ${
                        isSelected ? 'text-primary-soft-text font-bold bg-primary-soft/40' : 'text-content'
                      }`}
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        {opt.badgeColor ? (
                          <Badge color={opt.badgeColor}>{opt.label}</Badge>
                        ) : (
                          <span className="truncate">{opt.label}</span>
                        )}
                        {opt.description && <span className="text-[11px] text-content-subtle shrink-0">({opt.description})</span>}
                      </span>
                      {isSelected && <Check className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

/**
 * ActiveFilterChips — các bộ lọc đang kích hoạt kèm nút xóa nhanh.
 */
export function ActiveFilterChips({ filters = [], onClearAll, className = '' }) {
  const activeList = filters.filter((f) => f.value !== undefined && f.value !== null && f.value !== '')
  if (activeList.length === 0) return null

  return (
    <div className={`flex items-center flex-wrap gap-2 py-2 px-3 bg-primary-soft/50 rounded-xl border border-primary/15 text-xs animate-fade-in ${className}`}>
      <span className="font-semibold text-primary-soft-text flex items-center gap-1">
        <Filter className="w-3 h-3" aria-hidden="true" /> Đang lọc:
      </span>
      {activeList.map((f, idx) => (
        <span
          key={idx}
          className="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-lg bg-surface border border-line text-content shadow-sm"
        >
          <span className="text-content-subtle font-medium">{f.label}:</span>
          <span className="font-semibold text-primary-soft-text">{f.displayValue || f.value}</span>
          <button
            type="button"
            onClick={f.onRemove}
            aria-label={`Xóa bộ lọc ${f.label}`}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full hover:bg-danger-soft hover:text-danger-text text-content-subtle transition-colors"
          >
            <X className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </span>
      ))}
      <button
        type="button"
        onClick={onClearAll}
        className="min-h-8 inline-flex items-center gap-1 rounded-lg px-2 text-[11px] font-semibold text-danger-text hover:bg-danger-soft ml-auto transition-colors"
      >
        <RotateCcw className="w-3 h-3" aria-hidden="true" /> Xóa tất cả
      </button>
    </div>
  )
}