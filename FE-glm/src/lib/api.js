import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
})

// Interceptor: attach CSRF token cho mọi request (POST/PUT/DELETE)
// Backend dùng CookieCsrfTokenRepository với cookie "XSRF-TOKEN" và header "X-XSRF-TOKEN"
api.interceptors.request.use((config) => {
  const csrf = getCookie('XSRF-TOKEN')
  if (csrf) {
    config.headers['X-XSRF-TOKEN'] = decodeURIComponent(csrf)
  }
  return config
})

// Interceptor: xử lý 401 → redirect login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

function getCookie(name) {
  const match = document.cookie.match(new RegExp('(^|; )' + name + '=([^;]+)'))
  return match ? match[2] : null
}

/** Helper: unwrap ApiResponse<T> */
export const unwrap = (res) => res.data?.data

/** Helper: unwrap PageResponse<T> — backend dùng items + pageNumber */
export const unwrapPage = (res) => ({
  content: res.data?.data?.items || [],
  totalElements: res.data?.data?.totalElements || 0,
  totalPages: res.data?.data?.totalPages || 0,
  currentPage: res.data?.data?.pageNumber || 1,
  pageSize: res.data?.data?.pageSize || 10
})

/** Helper: lấy message lỗi từ response */
export const errMsg = (err) => {
  const d = err.response?.data
  if (typeof d === 'string') return d
  if (d?.errors?.length) {
    return d.errors.map(e => `${e.field}: ${e.message}`).join('; ')
  }
  return d?.message || d?.error || err.message || 'Lỗi không xác định'
}

/** Fetch CSRF token: gọi 1 GET bất kỳ để Spring set cookie XSRF-TOKEN */
export const fetchCsrfToken = async () => {
  try {
    await api.get('/auth/me')
  } catch (_) {
    // 401 vẫn set CSRF cookie, bỏ qua lỗi
  }
}

export default api
