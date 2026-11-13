import { useEffect, lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './store/auth'
import { ToastContainer } from './components/ui/Toast'
import { Spinner, Skeleton } from './components/ui'
import AppLayout from './components/layout/AppLayout'
import LoginPage from './pages/auth/LoginPage'
import NotFoundPage from './pages/NotFoundPage'

// Lazy-load theo trang để giảm bundle khởi tạo; giữ nguyên routing & phân quyền
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const AdminEnrollments = lazy(() => import('./pages/admin/AdminEnrollments'))
const AdminEnrollmentRequests = lazy(() => import('./pages/admin/AdminEnrollmentRequests'))
const AdminStudents = lazy(() => import('./pages/admin/AdminStudents'))
const AdminTeachers = lazy(() => import('./pages/admin/AdminTeachers'))
const AdminAlerts = lazy(() => import('./pages/admin/AdminAlerts'))
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'))

const TeacherDashboard = lazy(() => import('./pages/teacher/TeacherDashboard'))
const TeacherStudents = lazy(() => import('./pages/teacher/TeacherStudents'))
const TeacherRequests = lazy(() => import('./pages/teacher/TeacherRequests'))
const TeacherAlerts = lazy(() => import('./pages/teacher/TeacherAlerts'))

function PageLoader() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Đang tải trang">
      <div className="space-y-2">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <Skeleton className="h-40 w-full rounded-2xl" />
      <Skeleton className="h-64 w-full rounded-2xl" />
    </div>
  )
}

function ProtectedRoute({ role, children }) {
  const { role: currentRole, loading } = useAuth()
  if (loading) return <Spinner className="min-h-[100dvh]" size={32} />
  if (!currentRole) return <Navigate to="/login" replace />
  if (role && currentRole !== role) return <Navigate to={currentRole === 'ADMIN' ? '/admin' : '/teacher'} replace />
  return children
}

export default function App() {
  const { fetchMe, loading, role } = useAuth()

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
          <Route index element={<Suspense fallback={<PageLoader />}><AdminDashboard /></Suspense>} />
          <Route path="enrollments" element={<Suspense fallback={<PageLoader />}><AdminEnrollments /></Suspense>} />
          <Route path="enrollment-requests" element={<Suspense fallback={<PageLoader />}><AdminEnrollmentRequests /></Suspense>} />
          <Route path="students" element={<Suspense fallback={<PageLoader />}><AdminStudents /></Suspense>} />
          <Route path="teachers" element={<Suspense fallback={<PageLoader />}><AdminTeachers /></Suspense>} />
          <Route path="alerts" element={<Suspense fallback={<PageLoader />}><AdminAlerts /></Suspense>} />
          <Route path="settings" element={<Suspense fallback={<PageLoader />}><AdminSettings /></Suspense>} />
        </Route>

        {/* Teacher */}
        <Route path="/teacher" element={<ProtectedRoute role="TEACHER"><AppLayout role="TEACHER" /></ProtectedRoute>}>
          <Route index element={<Suspense fallback={<PageLoader />}><TeacherDashboard /></Suspense>} />
          <Route path="students" element={<Suspense fallback={<PageLoader />}><TeacherStudents /></Suspense>} />
          <Route path="requests" element={<Suspense fallback={<PageLoader />}><TeacherRequests /></Suspense>} />
          <Route path="alerts" element={<Suspense fallback={<PageLoader />}><TeacherAlerts /></Suspense>} />
        </Route>

        <Route path="/" element={<Navigate to={role === 'ADMIN' ? '/admin' : role === 'TEACHER' ? '/teacher' : '/login'} replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  )
}