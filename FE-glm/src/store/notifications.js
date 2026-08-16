import { create } from 'zustand'
import { getEnrollmentRequests } from '../lib/apiAdmin'
import { getMyEnrollmentRequests } from '../lib/apiTeacher'

const getStorageKey = (userId) => `pool_seen_teacher_requests_${userId || 'default'}`

const readSeenTokens = (userId) => {
  try {
    const stored = localStorage.getItem(getStorageKey(userId))
    return stored ? JSON.parse(stored) : []
  } catch (_) {
    return []
  }
}

const writeSeenTokens = (userId, tokens) => {
  try {
    localStorage.setItem(getStorageKey(userId), JSON.stringify(tokens))
  } catch (_) {}
}

export const useRequestNotification = create((set, get) => ({
  adminPendingCount: 0,
  teacherNewResponseCount: 0,
  seenTokens: [],
  lastChecked: null,

  /** Khởi tạo hoặc nạp lại danh sách token đã xem từ localStorage */
  loadSeenTokens: (userId) => {
    const tokens = readSeenTokens(userId)
    set({ seenTokens: tokens })
    return tokens
  },

  /** Kiểm tra xem 1 yêu cầu cụ thể có phải là phản hồi mới chưa xem không */
  isRequestUnseen: (userId, request) => {
    if (!request || request.status === 'PENDING') return false
    const token = `${request.id}_${request.status}`
    const tokens = get().seenTokens.length > 0 ? get().seenTokens : readSeenTokens(userId)
    return !tokens.includes(token)
  },

  /** Đánh dấu 1 yêu cầu cụ thể đã được xem (khi click vào xem chi tiết) */
  markSingleRequestSeen: (userId, request) => {
    if (!request || request.status === 'PENDING') return
    const token = `${request.id}_${request.status}`
    const currentTokens = readSeenTokens(userId)
    if (!currentTokens.includes(token)) {
      const updatedTokens = [...currentTokens, token]
      writeSeenTokens(userId, updatedTokens)
      const newCount = Math.max(0, get().teacherNewResponseCount - 1)
      set({ seenTokens: updatedTokens, teacherNewResponseCount: newCount })
    }
  },

  /** Đánh dấu tất cả phản hồi hiện tại là đã xem */
  markAllTeacherRequestsSeen: (userId, requests = []) => {
    const currentTokens = readSeenTokens(userId)
    const newTokens = (requests || [])
      .filter(r => r.status === 'APPROVED' || r.status === 'REJECTED')
      .map(r => `${r.id}_${r.status}`)

    const updatedTokens = Array.from(new Set([...currentTokens, ...newTokens]))
    writeSeenTokens(userId, updatedTokens)
    set({ seenTokens: updatedTokens, teacherNewResponseCount: 0 })
  },

  /** Polling định kỳ kiểm tra số lượng thông báo */
  checkNotifications: async (role, userId) => {
    if (!role) return

    try {
      if (role === 'ADMIN') {
        // Admin: Đếm số lượng yêu cầu đang PENDING
        const res = await getEnrollmentRequests({ status: 'PENDING', page: 1, size: 1 })
        const count = res?.totalElements || 0
        set({ adminPendingCount: count, lastChecked: new Date() })
      } else if (role === 'TEACHER') {
        // Teacher: Lấy danh sách yêu cầu mới nhất (tối đa 50) để kiểm tra các phản hồi chưa xem
        const res = await getMyEnrollmentRequests({ page: 1, size: 50 })
        const requests = res?.content || []

        const reviewedRequests = requests.filter(
          r => r.status === 'APPROVED' || r.status === 'REJECTED'
        )

        const seenTokens = readSeenTokens(userId)

        // Đếm những yêu cầu có phản hồi mới mà chưa có trong seenTokens
        const unseenResponses = reviewedRequests.filter(
          r => !seenTokens.includes(`${r.id}_${r.status}`)
        )

        set({
          seenTokens,
          teacherNewResponseCount: unseenResponses.length,
          lastChecked: new Date()
        })
      }
    } catch (_) {
      // Bỏ qua lỗi mạng ngầm
    }
  }
}))
