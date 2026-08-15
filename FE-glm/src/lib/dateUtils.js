import { getDurationDays, getDefaultQuota } from './settings'

export const parseLocalDate = (dateInput) => {
  if (!dateInput) return null
  if (dateInput instanceof Date) return isNaN(dateInput.getTime()) ? null : dateInput
  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim()
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const [year, month, day] = trimmed.split('-').map(Number)
      return new Date(year, month - 1, day)
    }
  }
  const d = new Date(dateInput)
  return isNaN(d.getTime()) ? null : d
}

export const formatISODate = (date) => {
  if (!date) return ''
  const d = parseLocalDate(date)
  if (!d) return ''
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const getTodayDate = () => formatISODate(new Date())

export const addDays = (startDateStr, days) => {
  if (!startDateStr) return ''
  const d = parseLocalDate(startDateStr)
  if (!d) return ''
  const duration = (days !== undefined && days !== null && !isNaN(Number(days))) ? Number(days) : getDurationDays()
  d.setDate(d.getDate() + duration)
  return formatISODate(d)
}

export const formatDisplayDate = (dateStr) => {
  if (!dateStr) return '—'
  const d = parseLocalDate(dateStr)
  if (!d) return String(dateStr)
  return d.toLocaleDateString('vi-VN')
}
