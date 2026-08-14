import { useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from './store/auth'
import { ToastContainer } from './components/ui/Toast'
import { Spinner } from './components/ui'
import AppLayout from './components/layout/AppLayout'
import LoginPage from './pages/auth/LoginPage'
import NotFoundPage from './pages/NotFoundPage'

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminEnrollments from './pages/admin/AdminEnrollments'
import AdminEnrollmentRequests from './pages/admin/AdminEnrollmentRequests'
import AdminStudents from './pages/admin/AdminStudents'
import AdminTeachers from './pages/admin/AdminTeachers'
import AdminAlerts from './pages/admin/AdminAlerts'
import AdminSettings from './pages/admin/AdminSettings'

// Teacher pages
import TeacherDashboard from './pages/teacher/TeacherDashboard'
import TeacherStudents from './pages/teacher/TeacherStudents'
import TeacherRequests from './pages/teacher/TeacherRequests'
import TeacherAlerts from './pages/teacher/TeacherAlerts'

function ProtectedRoute({ role, children }) {
  const { role: currentRole, loading } = useAuth()
  if (loading) return <Spinner className="min-h-[100dvh]" size={32} />
  if (!currentRole) return <Navigate to="/login" replace />
  if (role && currentRole !== role) return <Navigate to={currentRole === 'ADMIN' ? '/admin' : '/teacher'} replace />
  return children
}

export default function App() {
  const { fetchMe, loading, role } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    fetchMe()
  }, [])

  if (loading) return <Spinner className="min-h-[100dvh]" size={32} />

  return (
    <>
      <ToastContainer />
      <Routes>
        <Route path="/login" element={role ? <Navigate to={role === 'ADMIN' ? '/admin' : '/teacher'} replace /> : <LoginPage />} />

        {/* Admin */}
        <Route path="/admin" element={<ProtectedRoute role="ADMIN"><AppLayout role="ADMIN" /></ProtectedRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="enrollments" element={<AdminEnrollments />} />
          <Route path="enrollment-requests" element={<AdminEnrollmentRequests />} />
          <Route path="students" element={<AdminStudents />} />
          <Route path="teachers" element={<AdminTeachers />} />
          <Route path="alerts" element={<AdminAlerts />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        {/* Teacher */}
        <Route path="/teacher" element={<ProtectedRoute role="TEACHER"><AppLayout role="TEACHER" /></ProtectedRoute>}>
          <Route index element={<TeacherDashboard />} />
          <Route path="students" element={<TeacherStudents />} />
          <Route path="requests" element={<TeacherRequests />} />
          <Route path="alerts" element={<TeacherAlerts />} />
        </Route>

        <Route path="/" element={<Navigate to={role === 'ADMIN' ? '/admin' : role === 'TEACHER' ? '/teacher' : '/login'} replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  )
}
