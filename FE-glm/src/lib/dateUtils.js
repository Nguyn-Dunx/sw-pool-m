import { getDurationDays, getDefaultQuota } from './settings'

export const formatISODate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const getTodayDate = () => formatISODate(new Date())

export const addDays = (startDateStr, days) => {
  if (!startDateStr) return ''
  const d = new Date(startDateStr)
  if (isNaN(d.getTime())) return ''
  const duration = (days !== undefined && days !== null && !isNaN(Number(days))) ? Number(days) : getDurationDays()
  d.setDate(d.getDate() + duration)
  return formatISODate(d)
}

export const formatDisplayDate = (dateStr) => {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return String(dateStr)
  return d.toLocaleDateString('vi-VN')
}
