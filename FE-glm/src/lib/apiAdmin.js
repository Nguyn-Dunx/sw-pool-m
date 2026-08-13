import api, { unwrap, unwrapPage } from './api'

const qs = (params) => {
  const u = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') u.set(k, v)
  })
  return '?' + u.toString()
}

// ===== Dashboard =====
export const getAdminDashboard = async () => unwrap(await api.get('/admin/dashboard/summary'))

// ===== Enrollments =====
export const getEnrollments = async (params) => unwrapPage(await api.get('/admin/enrollments' + qs(params)))
export const getEnrollmentDetail = async (id) => unwrap(await api.get(`/admin/enrollments/${id}`))
export const createEnrollment = async (body) => unwrap(await api.post('/admin/enrollments', body))
export const updateEnrollment = async (id, body) => unwrap(await api.put(`/admin/enrollments/${id}`, body))
export const completeEnrollment = async (id) => unwrap(await api.put(`/admin/enrollments/${id}/complete`))

// ===== Enrollment Requests =====
export const getEnrollmentRequests = async (params) => unwrapPage(await api.get('/admin/enrollment-requests' + qs(params)))
export const reviewEnrollmentRequest = async (id, body) => unwrap(await api.put(`/admin/enrollment-requests/${id}/review`, body))

// ===== Students =====
export const getStudents = async (params) => unwrapPage(await api.get('/admin/students' + qs({ ...params, keyword: params.studentName || params.keyword })))
export const createStudent = async (body) => unwrap(await api.post('/admin/students', body))
export const updateStudent = async (id, body) => unwrap(await api.put(`/admin/students/${id}`, body))
export const deleteStudent = async (id) => unwrap(await api.delete(`/admin/students/${id}`))

// ===== Teachers =====
export const getTeachers = async (params) => unwrapPage(await api.get('/admin/teachers' + qs({ ...params, keyword: params.teacherName || params.keyword })))
export const createTeacher = async (body) => unwrap(await api.post('/admin/teachers', body))
export const updateTeacher = async (id, body) => unwrap(await api.put(`/admin/teachers/${id}`, body))
export const deleteTeacher = async (id) => unwrap(await api.delete(`/admin/teachers/${id}`))

// ===== Alerts =====
export const getAlerts = async () => unwrap(await api.get('/alerts'))
export const triggerAutoExpire = async () => unwrap(await api.post('/alerts/cronjobs/auto-expire'))
