import { toast } from '../components/ui/Toast'
import { errMsg } from './api'

/**
 * Utility tải file từ API trả về Blob
 * @param {Function} apiCall - Async function gọi axios trả về response dạng blob
 * @param {string} defaultFilename - Tên file mặc định
 */
export async function downloadFile(apiCall, defaultFilename = 'download.xlsx') {
  try {
    const response = await apiCall()

    // Bắt tên file từ header Content-Disposition nếu có
    let filename = defaultFilename
    const disposition = response?.headers?.['content-disposition'] || response?.headers?.['Content-Disposition']
    if (disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
      if (match && match[1]) {
        filename = match[1].replace(/['"]/g, '').trim()
      }
    }

    const blob = new Blob([response.data], {
      type: response.headers['content-type'] || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })

    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()

    setTimeout(() => {
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    }, 200)

    toast.success(`Đã tải xuống: ${filename}`)
    return true
  } catch (error) {
    console.error('File download error:', error)
    toast.error(errMsg(error) || 'Không thể tải xuống file')
    return false
  }
}
