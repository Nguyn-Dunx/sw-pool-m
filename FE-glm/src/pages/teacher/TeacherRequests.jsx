import { useEffect, useState } from 'react'
import { ListChecks, Plus, Search, UserPlus, Users, Shield, Info, Eye, CheckCircle } from 'lucide-react'
import { getMyEnrollmentRequests, createEnrollmentRequest, getTeacherStudents, createTeacherStudent, getMyStudents, exportTeacherRequests } from '../../lib/apiTeacher'
import { Button, Badge, Spinner, EmptyState, ErrorState, TableSkeleton, Pagination, Modal, Field, inputCls, ColumnHeaderFilter, ActiveFilterChips, ExportButton, InfoTile, PageHeader } from '../../components/ui'
import { useClientSort, SortHeader, SortScopeNote } from '../../components/ui/Sort'
import { PageTransition } from '../../components/motion/Motion'
import { useAuth } from '../../store/auth'
import { useRequestNotification } from '../../store/notifications'
import { toast } from '../../components/ui/Toast'
import { errMsg } from '../../lib/api'
import { useDebounce } from '../../lib/useDebounce'
import { getTodayDate, addDays, formatDisplayDate, formatISODate } from '../../lib/dateUtils'
import { useSystemSettings } from '../../lib/settings'
import { downloadFile } from '../../lib/fileDownload'

const STYLE = { FROG: 'Ếch', FREE: 'Sải', BACK: 'Ngửa', FLY: 'Bướm' }
const STATUS_COLOR = { PENDING: 'amber', APPROVED: 'green', REJECTED: 'red' }
const STATUS_LABEL = { PENDING: 'Chờ duyệt', APPROVED: 'Đã duyệt', REJECTED: 'Từ chối' }
const TYPE_LABEL = { CREATE: 'Tạo mới', UPDATE: 'Cập nhật' }
const STATUS_EN = { ACTIVE: 'Đang học', COMPLETED: 'Hoàn thành', EXPIRED: 'Hết hạn' }

export default function TeacherRequests() {
  const { user } = useAuth()
  const { isRequestUnseen, markSingleRequestSeen, markAllTeacherRequestsSeen, teacherNewResponseCount } = useRequestNotification()
  const [list, setList] = useState({ content: [], totalElements: 0, totalPages: 0, currentPage: 1, pageSize: 10 })
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [status, setStatus] = useState('')
  const [requestType, setRequestType] = useState('')
  const [page, setPage] = useState(1)
  const [showCreate, setShowCreate] = useState(false)
  const [detail, setDetail] = useState(null)

  const load = () => {
    setLoading(true)
    setLoadError(null)
    getMyEnrollmentRequests({ requestType: requestType || undefined, status: status || undefined, page, size: 10 })
      .then((res) => setList(res))
      .catch((e) => { setLoadError(e); toast.error(errMsg(e)) })
      .finally(() => setLoading(false))
  }

  const handleExport = () => downloadFile(
    () => exportTeacherRequests({ requestType: requestType || undefined, status: status || undefined }),
    `Yeu_Cau_Cua_Toi_${getTodayDate()}.xlsx`
  )

  useEffect(() => { setPage(1) }, [status, requestType])
  useEffect(() => { load() }, [status, requestType, page])

  const requests = list.content || []
  const { sorted, sortKey, sortDir, toggleSort } = useClientSort(requests)
  const hasAnyFilter = Boolean(status || requestType)

  return (
    <PageTransition className="space-y-4">
      <PageHeader
        title="Yêu cầu đăng ký"
        description="Gửi yêu cầu tạo/cập nhật khóa học cho Admin duyệt — lọc trực tiếp trên từng cột"
        actions={<>
          {teacherNewResponseCount > 0 && (
            <Button variant="secondary" size="sm" onClick={() => markAllTeacherRequestsSeen(user?.id, list.content)} title="Đánh dấu tất cả phản hồi hiện tại là đã xem">
              <CheckCircle className="w-4 h-4 text-success-text" aria-hidden="true" />
              Đánh dấu đã xem tất cả ({teacherNewResponseCount})
            </Button>
          )}
          <ExportButton onExport={handleExport} />
          <Button onClick={() => setShowCreate(true)}><Plus className="w-4 h-4" aria-hidden="true" /> Tạo yêu cầu</Button>
        </>}
      />

      <ActiveFilterChips
        filters={[
          { label: 'Loại yêu cầu', value: requestType, displayValue: TYPE_LABEL[requestType], onRemove: () => setRequestType('') },
          { label: 'Trạng thái', value: status, displayValue: STATUS_LABEL[status], onRemove: () => setStatus('') },
        ]}
        onClearAll={() => { setStatus(''); setRequestType('') }}
      />

      <div className="bg-surface rounded-2xl border border-line shadow-card overflow-hidden" data-stagger>
        {loading ? <TableSkeleton rows={6} cols={5} className="border-0 shadow-none rounded-none" /> : loadError ? (
          <ErrorState onRetry={load} />
        ) : requests.length === 0 ? (
          <EmptyState
            icon={ListChecks}
            title={hasAnyFilter ? 'Không tìm thấy yêu cầu phù hợp' : 'Chưa có yêu cầu'}
            description={hasAnyFilter ? 'Không có yêu cầu nào khớp với bộ lọc đã chọn.' : 'Tạo yêu cầu đăng ký khóa học đầu tiên.'}
            action={hasAnyFilter ? <Button variant="secondary" size="sm" onClick={() => { setStatus(''); setRequestType('') }}>Xóa tất cả bộ lọc</Button> : null}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-muted/60 text-content-muted text-left border-b border-line">
                  <tr>
                    <th className="px-4 py-2 font-semibold text-content-muted">Học viên</th>
                    <th className="px-4 py-2 font-semibold text-content-muted hidden sm:table-cell">Kiểu bơi</th>
                    <th className="px-4 py-2 hidden md:table-cell">
                      <ColumnHeaderFilter label="Loại" type="select" value={requestType} onChange={setRequestType}
                        options={[
                          { value: 'CREATE', label: 'Tạo mới', badgeColor: 'blue' },
                          { value: 'UPDATE', label: 'Cập nhật', badgeColor: 'purple' },
                        ]} />
                    </th>
                    <th className="px-4 py-2">
                      <ColumnHeaderFilter label="Trạng thái" type="select" value={status} onChange={setStatus}
                        options={[
                          { value: 'PENDING', label: 'Chờ duyệt', badgeColor: 'amber' },
                          { value: 'APPROVED', label: 'Đã duyệt', badgeColor: 'green' },
                          { value: 'REJECTED', label: 'Từ chối', badgeColor: 'red' },
                        ]} />
                    </th>
                    <th className="px-4 py-2 font-semibold text-content-muted hidden md:table-cell">Ghi chú Admin</th>
                    <th className="px-4 py-2 hidden sm:table-cell" aria-sort={sortKey === 'createdAt' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}>
                      <SortHeader label="Ngày tạo" sortKey="createdAt" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
                    </th>
                    <th className="px-4 py-2 font-semibold text-content-muted text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/70">
                  {sorted.map((r) => {
                    const isUnseen = isRequestUnseen(user?.id, r)
                    return (
                      <tr key={r.id} className={`transition-colors ${isUnseen ? 'bg-danger-soft/40 hover:bg-danger-soft/60' : 'hover:bg-primary-soft/30'}`}>
                        <td className="px-4 py-3 font-medium text-content">
                          <div className="flex items-center gap-2">
                            {isUnseen && <span className="h-2.5 w-2.5 rounded-full bg-danger shrink-0" title="Phản hồi mới chưa xem" aria-hidden="true" />}
                            <span>{r.studentName || '—'}</span>
                            {isUnseen && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-danger-soft text-danger-text tracking-tight">Mới</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-content-muted hidden sm:table-cell font-medium">Bơi {STYLE[r.swimStyle] || '—'}</td>
                        <td className="px-4 py-3 hidden md:table-cell"><Badge color={r.requestType === 'CREATE' ? 'blue' : 'purple'}>{TYPE_LABEL[r.requestType] || r.requestType}</Badge></td>
                        <td className="px-4 py-3"><Badge color={STATUS_COLOR[r.status]}>{STATUS_LABEL[r.status]}</Badge></td>
                        <td className="px-4 py-3 text-content-muted hidden md:table-cell max-w-[200px] truncate" title={r.adminNote || ''}>{r.adminNote || '—'}</td>
                        <td className="px-4 py-3 text-content-muted hidden sm:table-cell whitespace-nowrap">{formatDisplayDate(r.createdAt)}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => { setDetail(r); markSingleRequestSeen(user?.id, r) }}
                            aria-label={`Xem chi tiết yêu cầu của ${r.studentName || 'học viên'}${isUnseen ? ' (phản hồi mới)' : ''}`}
                            title="Xem chi tiết (Xóa thông báo mới)"
                            className="relative inline-flex h-11 w-11 items-center justify-center rounded-xl text-primary-soft-text hover:bg-primary-soft transition-all duration-150 active:scale-95"
                          >
                            <Eye className="w-4 h-4" aria-hidden="true" />
                            {isUnseen && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-danger ring-2 ring-surface" aria-hidden="true" />}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-line">
              <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                <p className="text-xs text-content-subtle">Tổng {list.totalElements || 0} yêu cầu</p>
                <SortScopeNote active={Boolean(sortKey)} />
              </div>
              <Pagination page={list.currentPage} totalPages={list.totalPages} onChange={setPage} />
            </div>
          </>
        )}
      </div>

      {showCreate && <CreateRequestModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); load() }} />}
      {detail && <DetailModal request={detail} onClose={() => setDetail(null)} />}
    </PageTransition>
  )
}

// ===== CREATE REQUEST MODAL =====
function CreateRequestModal({ onClose, onCreated }) {
  const { durationDays, defaultQuota } = useSystemSettings()
  const [requestType, setRequestType] = useState('CREATE')
  const [form, setForm] = useState({
    studentId: '',
    selectedStudentName: '',
    targetEnrollmentId: '',
    swimStyle: 'FROG',
    isGuaranteed: false,
    totalQuota: String(defaultQuota || 12),
    startDate: getTodayDate(),
    expireDate: addDays(getTodayDate(), durationDays),
    note: ''
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [resolvingStudentId, setResolvingStudentId] = useState(false)

  const [studentMode, setStudentMode] = useState('existing')
  const [newStudent, setNewStudent] = useState({ fullName: '', phoneNumber: '', dob: '' })

  const [studentSearch, setStudentSearch] = useState('')
  const [myEnrollments, setMyEnrollments] = useState([])
  const [studentsLoading, setStudentsLoading] = useState(false)
  const debouncedStudentSearch = useDebounce(studentSearch, 300)

  const [selectedEnrollment, setSelectedEnrollment] = useState(null)
  const [updateStudentSearch, setUpdateStudentSearch] = useState('')
  const debouncedUpdateSearch = useDebounce(updateStudentSearch, 300)
  const [updateEnrollments, setUpdateEnrollments] = useState([])
  const [updateLoading, setUpdateLoading] = useState(false)

  const uniqueStudents = (() => {
    const map = new Map()
    myEnrollments.forEach(en => {
      if (en.studentName && !map.has(en.studentName)) {
        map.set(en.studentName, { studentName: en.studentName, studentPhone: en.studentPhone })
      }
    })
    return Array.from(map.values())
  })()

  useEffect(() => {
    if (requestType === 'CREATE' && studentMode === 'existing') {
      setStudentsLoading(true)
      getMyStudents({ studentName: debouncedStudentSearch, page: 1, size: 100 })
        .then(r => setMyEnrollments(r.content || []))
        .catch(() => setMyEnrollments([]))
        .finally(() => setStudentsLoading(false))
    }
  }, [debouncedStudentSearch, requestType, studentMode])

  useEffect(() => {
    if (requestType === 'UPDATE') {
      setUpdateLoading(true)
      getMyStudents({ studentName: debouncedUpdateSearch, page: 1, size: 100 })
        .then(r => setUpdateEnrollments(r.content || []))
        .catch(() => setUpdateEnrollments([]))
        .finally(() => setUpdateLoading(false))
    }
  }, [debouncedUpdateSearch, requestType])

  const handleSelectExistingStudent = async (student) => {
    setForm(f => ({ ...f, selectedStudentName: student.studentName, studentId: '' }))
    setErrors(er => ({ ...er, student: undefined }))
    setResolvingStudentId(true)
    try {
      const res = await getTeacherStudents({ keyword: student.studentPhone || student.studentName, page: 1, size: 10 })
      const matched = res.content?.find(st => st.phoneNumber === student.studentPhone || st.fullName === student.studentName) || res.content?.[0]
      if (matched) {
        setForm(f => ({ ...f, selectedStudentName: student.studentName, studentId: matched.id }))
      } else {
        toast.error('Không tìm thấy mã học viên trong hệ thống')
      }
    } catch (err) {
      toast.error('Không lấy được thông tin học viên: ' + errMsg(err))
    } finally {
      setResolvingStudentId(false)
    }
  }

  useEffect(() => {
    if (requestType === 'CREATE') {
      setForm(f => ({
        ...f,
        totalQuota: f.totalQuota === '12' || !f.totalQuota ? String(defaultQuota) : f.totalQuota,
        expireDate: f.startDate ? addDays(f.startDate, durationDays) : f.expireDate
      }))
    }
  }, [durationDays, defaultQuota, requestType])

  const handleSelectEnrollment = (en) => {
    setSelectedEnrollment(en)
    setErrors(er => ({ ...er, targetEnrollmentId: undefined }))
    const sDate = en.startDate || getTodayDate()
    const eDate = en.expireDate || addDays(sDate, durationDays)
    setForm(f => ({
      ...f,
      targetEnrollmentId: en.enrollmentId,
      swimStyle: en.swimStyle || 'FROG',
      isGuaranteed: !!en.isGuaranteed,
      totalQuota: en.totalQuota ? String(en.totalQuota) : String(defaultQuota),
      startDate: sDate,
      expireDate: eDate
    }))
  }

  const submit = async (e) => {
    e.preventDefault()
    const next = {}

    if (requestType === 'CREATE') {
      if (studentMode === 'existing') {
        if (!form.selectedStudentName) next.student = 'Vui lòng chọn học viên'
        else if (!form.studentId) next.student = 'Đang tải ID học viên hoặc chưa tìm thấy ID, vui lòng thử chọn lại'
      }
      if (studentMode === 'new') {
        const trimmedFullName = newStudent.fullName.trim()
        if (!trimmedFullName) next.newFullName = 'Vui lòng nhập họ tên học viên'
        else if (trimmedFullName.length > 100) next.newFullName = 'Họ tên không được vượt quá 100 ký tự'
        const trimmedPhone = newStudent.phoneNumber.trim()
        const phoneRegex = /^(0|\+84)[3|5|7|8|9][0-9]{8}$/
        if (!trimmedPhone) next.newPhone = 'Vui lòng nhập số điện thoại'
        else if (!phoneRegex.test(trimmedPhone)) next.newPhone = 'SĐT không hợp lệ (10 chữ số, ví dụ 0912345678 hoặc +84912345678)'
        if (!newStudent.dob) next.newDob = 'Vui lòng nhập ngày sinh'
        else if (new Date(newStudent.dob) >= new Date()) next.newDob = 'Ngày sinh phải là ngày trong quá khứ'
      }
    }

    if (requestType === 'UPDATE' && !form.targetEnrollmentId) next.targetEnrollmentId = 'Vui lòng chọn khóa học cần cập nhật'
    if (!form.swimStyle) next.swimStyle = 'Vui lòng chọn kiểu bơi'
    if (form.totalQuota && Number(form.totalQuota) < 1) next.totalQuota = 'Tổng số buổi học phải lớn hơn 0'
    if (form.startDate && form.expireDate && new Date(form.startDate) >= new Date(form.expireDate)) next.expireDate = 'Ngày hết hạn phải sau ngày bắt đầu'

    setErrors(next)
    if (Object.keys(next).length > 0) return

    setLoading(true)
    try {
      let studentId = form.studentId

      if (requestType === 'CREATE' && studentMode === 'new') {
        const created = await createTeacherStudent({
          fullName: newStudent.fullName.trim(),
          phoneNumber: newStudent.phoneNumber.trim(),
          dob: newStudent.dob
        })
        studentId = created.id
      }

      const body = {
        requestType,
        studentId: requestType === 'CREATE' ? studentId : undefined,
        targetEnrollmentId: requestType === 'UPDATE' ? form.targetEnrollmentId : undefined,
        swimStyle: form.swimStyle,
        isGuaranteed: form.isGuaranteed,
        totalQuota: form.totalQuota ? Number(form.totalQuota) : undefined,
        startDate: form.startDate || undefined,
        expireDate: form.expireDate || undefined,
        note: form.note?.trim() || undefined
      }

      await createEnrollmentRequest(body)
      toast.success('Đã gửi yêu cầu đăng ký cho Admin duyệt')
      onCreated()
    } catch (e) {
      toast.error(errMsg(e))
    } finally {
      setLoading(false)
    }
  }

  const clearErr = (key) => { if (errors[key]) setErrors(er => ({ ...er, [key]: undefined })) }

  return (
    <Modal open onClose={onClose} title="Tạo yêu cầu đăng ký" size="lg">
      <form onSubmit={submit} className="space-y-5" noValidate>
        <Field label="Loại yêu cầu" required>
          <div className="flex gap-2" role="group" aria-label="Loại yêu cầu">
            <button
              type="button"
              aria-pressed={requestType === 'CREATE'}
              onClick={() => { setRequestType('CREATE'); setSelectedEnrollment(null) }}
              className={`flex-1 min-h-11 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all inline-flex items-center justify-center gap-1.5 ${requestType === 'CREATE' ? 'bg-primary-soft border-primary/40 text-primary-soft-text shadow-sm' : 'border-line text-content-muted hover:bg-surface-muted'}`}
            >
              <Plus className="w-4 h-4" aria-hidden="true" /> Tạo khóa học mới
            </button>
            <button
              type="button"
              aria-pressed={requestType === 'UPDATE'}
              onClick={() => { setRequestType('UPDATE'); setForm(f => ({ ...f, studentId: '', selectedStudentName: '' })) }}
              className={`flex-1 min-h-11 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all inline-flex items-center justify-center gap-1.5 ${requestType === 'UPDATE' ? 'bg-primary-soft border-primary/40 text-primary-soft-text shadow-sm' : 'border-line text-content-muted hover:bg-surface-muted'}`}
            >
              <ListChecks className="w-4 h-4" aria-hidden="true" /> Cập nhật khóa học
            </button>
          </div>
        </Field>

        {requestType === 'CREATE' && (
          <Field label="Học viên" required error={errors.student}>
            <div className="flex gap-2 mb-3" role="group" aria-label="Cách chọn học viên">
              <button
                type="button"
                aria-pressed={studentMode === 'existing'}
                onClick={() => setStudentMode('existing')}
                className={`flex-1 min-h-11 px-3 py-2 rounded-xl border text-sm font-medium transition-all inline-flex items-center justify-center gap-1.5 ${studentMode === 'existing' ? 'bg-success-soft border-success/40 text-success-text' : 'border-line text-content-muted hover:bg-surface-muted'}`}
              >
                <Users className="w-4 h-4" aria-hidden="true" /> Chọn học viên đã có
              </button>
              <button
                type="button"
                aria-pressed={studentMode === 'new'}
                onClick={() => setStudentMode('new')}
                className={`flex-1 min-h-11 px-3 py-2 rounded-xl border text-sm font-medium transition-all inline-flex items-center justify-center gap-1.5 ${studentMode === 'new' ? 'bg-purple-soft border-purple-text/30 text-purple-text' : 'border-line text-content-muted hover:bg-surface-muted'}`}
              >
                <UserPlus className="w-4 h-4" aria-hidden="true" /> Tạo học viên mới
              </button>
            </div>

            {studentMode === 'existing' ? (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-content-subtle pointer-events-none" aria-hidden="true" />
                  <input
                    placeholder="Tìm theo tên học viên của bạn..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    aria-label="Tìm học viên đang phụ trách"
                    className={inputCls + ' pl-10'}
                  />
                </div>
                <p className="text-xs text-content-subtle flex items-center gap-1">
                  <Info className="w-3 h-3" aria-hidden="true" /> Chỉ hiển thị học viên mà bạn đang phụ trách
                </p>
                <div className="border border-line rounded-xl max-h-40 overflow-y-auto divide-y divide-line/60" role="radiogroup" aria-label="Chọn học viên đã có">
                  {studentsLoading ? (
                    <Spinner className="py-4" size={20} />
                  ) : uniqueStudents.length === 0 ? (
                    <p className="text-sm text-content-subtle py-4 text-center">Không tìm thấy học viên</p>
                  ) : (
                    uniqueStudents.map(s => (
                      <label
                        key={s.studentName}
                        className={`flex items-center justify-between px-3 py-2.5 cursor-pointer hover:bg-primary-soft/40 transition-colors ${form.selectedStudentName === s.studentName ? 'bg-primary-soft/60' : ''}`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="student"
                            checked={form.selectedStudentName === s.studentName}
                            onChange={() => handleSelectExistingStudent(s)}
                            className="w-4 h-4 accent-[var(--color-primary)]"
                          />
                          <div>
                            <p className="text-sm font-medium text-content">{s.studentName}</p>
                            <p className="text-xs text-content-subtle">{s.studentPhone || ''}</p>
                          </div>
                        </div>
                        {form.selectedStudentName === s.studentName && resolvingStudentId && (
                          <span className="text-xs text-primary-soft-text font-medium">Đang nạp ID...</span>
                        )}
                        {form.selectedStudentName === s.studentName && form.studentId && (
                          <Badge color="green">Đã chọn</Badge>
                        )}
                      </label>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3 p-3 bg-purple-soft/40 rounded-xl border border-purple-text/20">
                <Field label="Họ tên" required error={errors.newFullName}>
                  <input
                    value={newStudent.fullName}
                    onChange={e => { setNewStudent({ ...newStudent, fullName: e.target.value }); clearErr('newFullName') }}
                    className={inputCls}
                    placeholder="Nguyễn Văn A"
                    maxLength={100}
                    autoComplete="name"
                  />
                </Field>
                <Field label="Số điện thoại" required hint="Định dạng: 0xxxxxxxxx (10 số)" error={errors.newPhone}>
                  <input
                    type="tel"
                    value={newStudent.phoneNumber}
                    onChange={e => { setNewStudent({ ...newStudent, phoneNumber: e.target.value }); clearErr('newPhone') }}
                    className={inputCls}
                    placeholder="0912345678"
                    autoComplete="tel"
                  />
                </Field>
                <Field label="Ngày sinh" required error={errors.newDob}>
                  <input
                    type="date"
                    value={newStudent.dob}
                    max={getTodayDate()}
                    onChange={e => { setNewStudent({ ...newStudent, dob: e.target.value }); clearErr('newDob') }}
                    className={inputCls}
                  />
                </Field>
              </div>
            )}
          </Field>
        )}

        {requestType === 'UPDATE' && (
          <>
            <Field label="Chọn khóa học cần cập nhật" required hint="Chỉ hiển thị học viên của bạn" error={errors.targetEnrollmentId}>
              <div className="relative mb-2">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-content-subtle pointer-events-none" aria-hidden="true" />
                <input
                  placeholder="Tìm theo tên học viên..."
                  value={updateStudentSearch}
                  onChange={(e) => { setUpdateStudentSearch(e.target.value); setSelectedEnrollment(null) }}
                  aria-label="Tìm khóa học cần cập nhật"
                  className={inputCls + ' pl-10'}
                />
              </div>
              <div className="border border-line rounded-xl max-h-52 overflow-y-auto" role="radiogroup" aria-label="Chọn khóa học cần cập nhật">
                {updateLoading ? (
                  <Spinner className="py-4" size={20} />
                ) : updateEnrollments.length === 0 ? (
                  <p className="text-sm text-content-subtle py-4 text-center">Không tìm thấy khóa học</p>
                ) : (
                  updateEnrollments.map(en => (
                    <label
                      key={en.enrollmentId}
                      className={`flex items-center justify-between px-3 py-3 cursor-pointer hover:bg-primary-soft/40 transition-colors border-b border-line/50 last:border-0 ${form.targetEnrollmentId === en.enrollmentId ? 'bg-primary-soft/60' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="enrollment"
                          value={en.enrollmentId}
                          checked={form.targetEnrollmentId === en.enrollmentId}
                          onChange={() => handleSelectEnrollment(en)}
                          className="w-4 h-4 accent-[var(--color-primary)]"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-medium text-content">{en.studentName}</p>
                            {en.isGuaranteed && <Shield className="w-3 h-3 text-warning-text" aria-hidden="true" />}
                          </div>
                          <p className="text-xs text-content-subtle">Bơi {STYLE[en.swimStyle] || en.swimStyle} • {en.attendedSessions}/{en.totalQuota} buổi • Hạn: {formatDisplayDate(en.expireDate)}</p>
                        </div>
                      </div>
                      <Badge color={en.status === 'ACTIVE' ? 'green' : en.status === 'COMPLETED' ? 'blue' : 'gray'}>
                        {STATUS_EN[en.status] || en.status}
                      </Badge>
                    </label>
                  ))
                )}
              </div>
            </Field>

            {selectedEnrollment && (
              <div className="bg-primary-soft/50 border border-primary/20 rounded-xl p-4 space-y-2">
                <p className="text-xs font-semibold text-primary-soft-text uppercase tracking-wider">Thông tin hiện tại</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                  <InfoTile label="Học viên">{selectedEnrollment.studentName}</InfoTile>
                  <InfoTile label="Kiểu bơi">Bơi {STYLE[selectedEnrollment.swimStyle] || selectedEnrollment.swimStyle}</InfoTile>
                  <InfoTile label="Cam kết">{selectedEnrollment.isGuaranteed ? 'Có' : 'Không'}</InfoTile>
                  <InfoTile label="Tổng buổi">{selectedEnrollment.totalQuota}</InfoTile>
                  <InfoTile label="Đã học">{selectedEnrollment.attendedSessions} buổi ({selectedEnrollment.progressPercentage || 0}%)</InfoTile>
                  <InfoTile label="Còn lại">
                    <span className={selectedEnrollment.daysRemaining != null && selectedEnrollment.daysRemaining < 5 ? 'text-danger-text' : 'text-content'}>
                      {selectedEnrollment.daysRemaining != null ? `${selectedEnrollment.daysRemaining} ngày` : '—'}
                    </span>
                  </InfoTile>
                </div>
              </div>
            )}
          </>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Field label="Kiểu bơi" required error={errors.swimStyle}>
            <select value={form.swimStyle} onChange={e => { setForm({ ...form, swimStyle: e.target.value }); clearErr('swimStyle') }} className={inputCls}>
              {Object.entries(STYLE).map(([k, v]) => <option key={k} value={k}>Bơi {v}</option>)}
            </select>
          </Field>
          <Field label="Cam kết" required>
            <select value={form.isGuaranteed ? '1' : '0'} onChange={e => setForm({ ...form, isGuaranteed: e.target.value === '1' })} className={inputCls}>
              <option value="0">Không cam kết</option>
              <option value="1">Có cam kết</option>
            </select>
          </Field>
          <Field label="Tổng buổi" hint={`Số buổi học (mặc định: ${defaultQuota})`} error={errors.totalQuota}>
            <input type="number" min="1" value={form.totalQuota} onChange={e => { setForm({ ...form, totalQuota: e.target.value }); clearErr('totalQuota') }} className={inputCls} placeholder={String(defaultQuota)} />
          </Field>
          <Field label="Ngày bắt đầu" hint={requestType === 'UPDATE' ? 'Không thể đổi ngày bắt đầu khi cập nhật' : 'Mặc định là hôm nay'}>
            <input
              type="date"
              value={form.startDate}
              onChange={e => {
                const val = e.target.value
                setForm(f => ({ ...f, startDate: val, expireDate: val ? addDays(val, durationDays) : f.expireDate }))
                clearErr('expireDate')
              }}
              disabled={requestType === 'UPDATE'}
              className={inputCls + (requestType === 'UPDATE' ? ' bg-surface-muted text-content-subtle' : '')}
            />
          </Field>
          <Field label="Ngày hết hạn" hint={`Mặc định = Ngày bắt đầu + ${durationDays} ngày`} error={errors.expireDate}>
            <input type="date" value={form.expireDate} min={form.startDate || undefined} onChange={e => { setForm({ ...form, expireDate: e.target.value }); clearErr('expireDate') }} className={inputCls} />
          </Field>
        </div>

        <Field label="Ghi chú cho Admin">
          <textarea value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} className={inputCls} rows={2} placeholder="Lý do đề xuất..." />
        </Field>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">Hủy</Button>
          <Button type="submit" loading={loading} disabled={resolvingStudentId} className="flex-1">
            {loading ? 'Đang gửi...' : 'Gửi yêu cầu'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function DetailModal({ request, onClose }) {
  const { durationDays, defaultQuota } = useSystemSettings()
  const displayStart = request.startDate || (request.createdAt ? formatISODate(request.createdAt) : getTodayDate())
  const displayExpire = request.expireDate || addDays(displayStart, durationDays)
  const displayQuota = request.totalQuota || defaultQuota

  return (
    <Modal open onClose={onClose} title="Chi tiết yêu cầu" size="lg">
      <div className="space-y-4">
        <div className="bg-surface-muted/60 rounded-xl p-4 space-y-3 border border-line">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h3 className="font-display font-semibold text-content text-lg">{request.studentName || '—'}</h3>
            <div className="flex items-center gap-2">
              <Badge color={request.requestType === 'CREATE' ? 'blue' : 'purple'}>{TYPE_LABEL[request.requestType]}</Badge>
              <Badge color={STATUS_COLOR[request.status]}>{STATUS_LABEL[request.status]}</Badge>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            <InfoTile label="Kiểu bơi">Bơi {STYLE[request.swimStyle] || request.swimStyle || '—'}</InfoTile>
            <InfoTile label="Cam kết">{request.isGuaranteed ? 'Có cam kết' : 'Không'}</InfoTile>
            <InfoTile label="Tổng buổi">{displayQuota} buổi {request.totalQuota ? '' : '(mặc định)'}</InfoTile>
            <InfoTile label="Ngày bắt đầu">{formatDisplayDate(displayStart)} {request.startDate ? '' : '(mặc định)'}</InfoTile>
            <InfoTile label="Ngày hết hạn">{formatDisplayDate(displayExpire)} {request.expireDate ? '' : '(mặc định)'}</InfoTile>
            <InfoTile label="Ngày tạo">{formatDisplayDate(request.createdAt)}</InfoTile>
          </div>
          {request.note && (
            <div className="pt-1">
              <p className="text-xs text-content-subtle">Ghi chú của bạn</p>
              <p className="text-sm text-content bg-surface rounded-lg px-3 py-2 mt-1 border border-line">{request.note}</p>
            </div>
          )}
          {request.adminNote && (
            <div className="pt-1">
              <p className="text-xs text-content-subtle">Phản hồi từ Admin</p>
              <p className="text-sm text-content bg-surface rounded-lg px-3 py-2 mt-1 border border-line">{request.adminNote}</p>
            </div>
          )}
        </div>
        <div className="flex justify-end pt-2">
          <Button variant="outline" onClick={onClose}>Đóng</Button>
        </div>
      </div>
    </Modal>
  )
}
