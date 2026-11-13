import { LayoutDashboard, Users, GraduationCap, FileText, Bell, UserCircle, ListChecks, Settings } from 'lucide-react'

export const adminNav = [
  { to: '/admin', icon: LayoutDashboard, label: 'Tổng quan', end: true },
  { to: '/admin/enrollments', icon: GraduationCap, label: 'Khóa học' },
  { to: '/admin/enrollment-requests', icon: FileText, label: 'Yêu cầu đăng ký', hasNotification: true },
  { to: '/admin/students', icon: Users, label: 'Học viên' },
  { to: '/admin/teachers', icon: UserCircle, label: 'Giáo viên' },
  { to: '/admin/alerts', icon: Bell, label: 'Cảnh báo' },
  { to: '/admin/settings', icon: Settings, label: 'Cấu hình' }
]

export const teacherNav = [
  { to: '/teacher', icon: LayoutDashboard, label: 'Tổng quan', end: true },
  { to: '/teacher/students', icon: Users, label: 'Học viên của tôi' },
  { to: '/teacher/requests', icon: ListChecks, label: 'Yêu cầu đăng ký', hasNotification: true },
  { to: '/teacher/alerts', icon: Bell, label: 'Cảnh báo' }
]

export function getNavItems(role) {
  return role === 'ADMIN' ? adminNav : teacherNav
}

export function getBreadcrumb(role, pathname) {
  const items = getNavItems(role)
  const root = items[0]
  const match = items.find((i) => (i.end ? pathname === i.to : pathname.startsWith(i.to)))
  if (!match || match.end) return [{ label: root.label, to: root.to, current: true }]
  return [
    { label: root.label, to: root.to, current: false },
    { label: match.label, to: match.to, current: true }
  ]
}