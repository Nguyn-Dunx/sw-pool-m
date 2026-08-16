import api, { unwrap, unwrapPage } from './api'

const qs = (params) => {
  const u = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') u.set(k, v)
  })
  return '?' + u.toString()
}

// ===== Dashboard =====
export const getTeacherDashboard = async () => unwrap(await api.get('/teacher/dashboard/summary'))

// ===== My Students (Enrollments) =====
export const getMyStudents = async (params) => unwrapPage(await api.get('/teacher/enrollments' + qs({ ...params, searchName: params.studentName || params.searchName })))
export const getMyStudentDetail = async (enrollmentId) => unwrap(await api.get(`/teacher/enrollments/${enrollmentId}`))
export const getStudentHistory = async (enrollmentId) => unwrap(await api.get(`/teacher/enrollments/${enrollmentId}/history`))
export const completeMyEnrollment = async (enrollmentId) => unwrap(await api.put(`/teacher/enrollments/${enrollmentId}/complete`))
export const exportTeacherStudents = (params) => api.get('/teacher/enrollments/export' + qs({ ...params, searchName: params.studentName || params.searchName }), { responseType: 'blob' })
export const exportStudentHistory = (enrollmentId) => api.get(`/teacher/enrollments/${enrollmentId}/history/export`, { responseType: 'blob' })

// ===== Students (cho dropdown tạo request) =====
export const getTeacherStudents = async (params) => unwrapPage(await api.get('/teacher/students' + qs(params)))
export const createTeacherStudent = async (body) => unwrap(await api.post('/teacher/students', body))

// ===== Shifts =====
export const getShifts = async () => unwrap(await api.get('/teacher/shifts'))

// ===== Attendance =====
export const checkInStudent = async (body) => unwrap(await api.post('/teacher/attendances/check-in', body))

// ===== Enrollment Requests =====
export const createEnrollmentRequest = async (body) => unwrap(await api.post('/teacher/enrollment-requests', body))
export const getMyEnrollmentRequests = async (params) => unwrapPage(await api.get('/teacher/enrollment-requests' + qs(params)))
export const exportTeacherRequests = (params) => api.get('/teacher/enrollment-requests/export' + qs(params), { responseType: 'blob' })

// ===== Alerts (Teacher cũng xem được) =====
export const getTeacherAlerts = async () => unwrap(await api.get('/alerts'))
