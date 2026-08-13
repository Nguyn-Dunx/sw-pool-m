import { create } from 'zustand'
import api, { unwrap } from '../lib/api'

/** Normalize role: "ROLE_ADMIN" → "ADMIN", "ADMIN" → "ADMIN" */
function normalizeRole(role) {
  if (!role) return null
  return role.replace(/^ROLE_/, '')
}

export const useAuth = create((set, get) => ({
  user: null,
  role: null,
  teacherId: null,
  loading: true,
  error: null,

  /** Gọi /auth/me để lấy thông tin user hiện tại */
  fetchMe: async () => {
    set({ loading: true, error: null })
    try {
      const data = await unwrap(await api.get('/auth/me'))
      const role = normalizeRole(data?.role)
      set({ user: data, role, teacherId: data?.teacherId, loading: false })
      return { ...data, role }
    } catch (e) {
      set({ user: null, role: null, teacherId: null, loading: false })
      return null
    }
  },

  /** Login bằng phone + password */
  login: async ({ phoneNumber, password, rememberMe }) => {
    set({ error: null })
    try {
      await api.post('/auth/login', { phoneNumber, password, rememberMe })
      const data = await get().fetchMe()
      return data
    } catch (e) {
      const msg = e.response?.data?.message || 'Đăng nhập thất bại'
      set({ error: msg })
      throw new Error(msg)
    }
  },

  /** Logout: clear state, redirect */
  logout: async () => {
    try { await api.post('/auth/logout') } catch (_) {}
    set({ user: null, role: null, teacherId: null, loading: false })
  }
}))
