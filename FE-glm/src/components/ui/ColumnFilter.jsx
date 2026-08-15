import { useState, useRef, useEffect } from 'react'
import { Filter, Search, X, Check, RotateCcw } from 'lucide-react'
import { Badge } from './index'

/**
 * ColumnHeaderFilter
 * Component lọc tại header cột chuẩn nghiệp vụ Data Grid
 */
export function ColumnHeaderFilter({
  label,
  type = 'select', // 'select' | 'search'
  value,
  onChange,
  options = [], // [{ value: '', label: 'Tất cả' }, { value: 'FROG', label: 'Bơi ếch', badgeColor?: 'blue' }]
  placeholder = 'Tìm kiếm...',
  align = 'left', // 'left' | 'right'
  className = ''
}) {
  const [open, setOpen] = useState(false)
  const [tempSearch, setTempSearch] = useState(value || '')
  const inputRef = useRef(null)

  const isActive = value !== undefined && value !== null && value !== ''

  useEffect(() => {
    setTempSearch(value || '')
  }, [value])

  useEffect(() => {
    if (open && type === 'search') {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open, type])

  const handleSelectOption = (optVal) => {
    onChange(optVal)
    setOpen(false)
  }

  const handleSearchSubmit = (e) => {
    e?.preventDefault()
    onChange(tempSearch.trim())
    setOpen(false)
  }

  const handleClear = (e) => {
    e?.stopPropagation()
    onChange('')
    setTempSearch('')
    setOpen(false)
  }

  return (
    <div className={`relative inline-flex items-center gap-1.5 select-none ${className}`}>
      {/* Tên cột */}
      <span className={`font-semibold transition-colors ${isActive ? 'text-pool-700 font-bold' : 'text-ink-600'}`}>
        {label}
      </span>

      {/* Nút trigger icon lọc */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setOpen(!open)
        }}
        className={`p-1 rounded-md transition-all duration-150 flex items-center justify-center relative ${
          isActive
            ? 'bg-pool-100/80 text-pool-700 ring-1 ring-pool-300 shadow-xs'
            : 'text-ink-400 hover:text-ink-700 hover:bg-ink-100/70'
        }`}
        title={`Lọc theo ${label}${isActive ? ' (Đang lọc)' : ''}`}
      >
        {type === 'search' ? (
          <Search className="w-3.5 h-3.5" />
        ) : (
          <Filter className="w-3.5 h-3.5" />
        )}
        {isActive && (
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-pool-600 ring-2 ring-white animate-pulse" />
        )}
      </button>

      {/* Dropdown Menu Popup */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-30 cursor-default"
            onClick={(e) => {
              e.stopPropagation()
              setOpen(false)
            }}
          />

          <div
            onClick={(e) => e.stopPropagation()}
            className={`absolute top-full mt-1.5 z-40 bg-white rounded-xl shadow-xl border border-ink-100/90 py-2 min-w-[210px] animate-scale-in text-ink-800 ${
              align === 'right' ? 'right-0 origin-top-right' : 'left-0 origin-top-left'
            }`}
          >
            {/* Header của Filter Popup */}
            <div className="flex items-center justify-between px-3 pb-2 mb-1 border-b border-ink-100/60">
              <span className="text-[11px] font-bold uppercase tracking-wider text-ink-400">
                Lọc {label}
              </span>
              {isActive && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-[11px] font-semibold text-pool-600 hover:text-pool-800 hover:underline flex items-center gap-1"
                >
                  <RotateCcw className="w-2.5 h-2.5" /> Đặt lại
                </button>
              )}
            </div>

            {/* Content: Kiểu Search */}
            {type === 'search' ? (
              <form onSubmit={handleSearchSubmit} className="p-2 space-y-2">
                <div className="relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={tempSearch}
                    onChange={(e) => setTempSearch(e.target.value)}
                    placeholder={placeholder}
                    className="w-full px-3 py-1.5 pr-7 text-xs rounded-lg border border-ink-200 focus:outline-none focus:ring-2 focus:ring-pool-400/40 focus:border-pool-400"
                  />
                  {tempSearch && (
                    <button
                      type="button"
                      onClick={() => setTempSearch('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="flex items-center justify-end gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setTempSearch('')
                      onChange('')
                      setOpen(false)
                    }}
                    className="px-2.5 py-1 text-xs text-ink-500 hover:bg-ink-50 rounded-md font-medium"
                  >
                    Xóa
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 text-xs bg-pool-600 text-white rounded-md hover:bg-pool-700 font-semibold shadow-xs"
                  >
                    Áp dụng
                  </button>
                </div>
              </form>
            ) : (
              /* Content: Kiểu Chọn Options (Select/Radio) */
              <div className="max-h-60 overflow-y-auto py-0.5">
                <button
                  type="button"
                  onClick={() => handleSelectOption('')}
                  className={`w-full flex items-center justify-between px-3 py-1.5 text-xs text-left hover:bg-pool-50/70 transition-colors font-medium ${
                    !isActive ? 'text-pool-700 font-bold bg-pool-50/40' : 'text-ink-600'
                  }`}
                >
                  <span>Tất cả</span>
                  {!isActive && <Check className="w-3.5 h-3.5 text-pool-600" />}
                </button>

                {options.map((opt) => {
                  const isSelected = String(value) === String(opt.value)
                  return (
                    <button
                      key={String(opt.value)}
                      type="button"
                      onClick={() => handleSelectOption(opt.value)}
                      className={`w-full flex items-center justify-between px-3 py-1.5 text-xs text-left hover:bg-pool-50/70 transition-colors ${
                        isSelected ? 'text-pool-700 font-bold bg-pool-50/50' : 'text-ink-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {opt.badgeColor ? (
                          <Badge color={opt.badgeColor} className="text-[10px] py-0 px-1.5">
                            {opt.label}
                          </Badge>
                        ) : (
                          <span>{opt.label}</span>
                        )}
                        {opt.description && (
                          <span className="text-[10px] text-ink-400">({opt.description})</span>
                        )}
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-pool-600 shrink-0" />}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

/**
 * ActiveFilterChips
 * Thanh hiển thị các bộ lọc đang kích hoạt kèm nút xóa nhanh
 */
export function ActiveFilterChips({ filters = [], onClearAll, className = '' }) {
  const activeList = filters.filter((f) => f.value !== undefined && f.value !== null && f.value !== '')

  if (activeList.length === 0) return null

  return (
    <div className={`flex items-center flex-wrap gap-2 py-2 px-3 bg-pool-50/50 rounded-xl border border-pool-100 text-xs animate-fade-in ${className}`}>
      <span className="font-semibold text-pool-800 flex items-center gap-1">
        <Filter className="w-3 h-3 text-pool-600" /> Đang lọc:
      </span>
      {activeList.map((f, idx) => (
        <span
          key={idx}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-pool-200 text-ink-700 shadow-xs"
        >
          <span className="text-ink-400 font-medium">{f.label}:</span>
          <span className="font-semibold text-pool-800">{f.displayValue || f.value}</span>
          <button
            type="button"
            onClick={f.onRemove}
            className="p-0.5 rounded-full hover:bg-rose-50 hover:text-rose-600 text-ink-400 transition-colors ml-0.5"
            title="Xóa bộ lọc này"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
      <button
        type="button"
        onClick={onClearAll}
        className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:underline ml-auto flex items-center gap-1"
      >
        <RotateCcw className="w-3 h-3" /> Xóa tất cả
      </button>
    </div>
  )
}
