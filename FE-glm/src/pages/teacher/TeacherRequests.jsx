import { useEffect, useState } from 'react'
import { ListChecks, Plus, Search, UserPlus, Users, Shield, Info, Eye, CheckCircle } from 'lucide-react'
import { getMyEnrollmentRequests, createEnrollmentRequest, getTeacherStudents, createTeacherStudent, getMyStudents, exportTeacherRequests } from '../../lib/apiTeacher'
import { Button, Badge, Spinner, EmptyState, Pagination, Modal, Field, inputCls, ColumnHeaderFilter, ActiveFilterChips, ExportButton } from '../../components/ui'
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
  const [status, setStatus] = useState('')
  const [requestType, setRequestType] = useState('')
  const [page, setPage] = useState(1)
  const [showCreate, setShowCreate] = useState(false)
  const [detail, setDetail] = useState(null)

  const load = () => {
    setLoading(true)
    getMyEnrollmentRequests({ requestType: requestType || undefined, status: status || undefined, page, size: 10 })
      .then((res) => {
        setList(res)
      })
      .catch((e) => toast.error(errMsg(e)))
      .finally(() => setLoading(false))
  }

  const handleExport = () => downloadFile(
    () => exportTeacherRequests({
      requestType: requestType || undefined,
      status: status || undefined
    }),
    `Yeu_Cau_Cua_Toi_${getTodayDate()}.xlsx`
  )

  useEffect(() => { setPage(1) }, [status, requestType])
  useEffect(() => { load() }, [status, requestType, page])

  const requests = list.content || []
  const hasAnyFilter = Boolean(status || requestType)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-ink-900 tracking-tight">Yêu cầu đăng ký</h1>
          <p className="text-sm text-ink-500 mt-1">Gửi yêu cầu tạo/cập nhật khóa học cho Admin duyệt — Lọc trực tiếp trên từng cột</p>
        </div>
        <div className="flex items-center gap-2">
          {teacherNewResponseCount > 0 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => markAllTeacherRequestsSeen(user?.id, list.content)}
              title="Đánh dấu tất cả phản hồi hiện tại là đã xem"
            >
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              Đánh dấu đã xem tất cả ({teacherNewResponseCount})
            </Button>
          )}
          <ExportButton onExport={handleExport} />
          <Button onClick={() => setShowCreate(true)}><Plus className="w-4 h-4" /> Tạo yêu cầu</Button>
        </div>
      </div>

      {/* Thanh hiển thị các bộ lọc đang kích hoạt */}
      <ActiveFilterChips
        filters={[
          { label: 'Loại yêu cầu', value: requestType, displayValue: TYPE_LABEL[requestType], onRemove: () => setRequestType('') },
          { label: 'Trạng thái', value: status, displayValue: STATUS_LABEL[status], onRemove: () => setStatus('') },
        ]}
        onClearAll={() => {
          setStatus('')
          setRequestType('')
        }}
      />

      <div className="bg-white rounded-2xl border border-ink-100/60 overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
        {loading ? <Spinner className="py-20" size={32} /> : requests.length === 0 ? (
          <EmptyState
            icon={ListChecks}
            title={hasAnyFilter ? 'Không tìm thấy yêu cầu phù hợp' : 'Chưa có yêu cầu'}
            description={hasAnyFilter ? 'Không có yêu cầu nào khớp với bộ lọc đã chọn.' : 'Tạo yêu cầu đăng ký khóa học đầu tiên.'}
            action={hasAnyFilter ? (
              <Button variant="secondary" size="sm" onClick={() => { setStatus(''); setRequestType('') }}>
                Xóa tất cả bộ lọc
              </Button>
            ) : null}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-ink-50/80 text-ink-500 text-left border-b border-ink-100/60">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-ink-600">Học viên</th>
                    <th className="px-4 py-3 font-semibold text-ink-600 hidden sm:table-cell">Kiểu bơi</th>
                    <th className="px-4 py-3 hidden md:table-cell">
                      <ColumnHeaderFilter
                        label="Loại"
                        type="select"
                        value={requestType}
                        onChange={setRequestType}
                        options={[
                          { value: 'CREATE', label: 'Tạo mới', badgeColor: 'blue' },
                          { value: 'UPDATE', label: 'Cập nhật', badgeColor: 'purple' },
                        ]}
                      />
                    </th>
                    <th className="px-4 py-3">
                      <ColumnHeaderFilter
                        label="Trạng thái"
                        type="select"
                        value={status}
                        onChange={setStatus}
                        options={[
                          { value: 'PENDING', label: 'Chờ duyệt', badgeColor: 'amber' },
                          { value: 'APPROVED', label: 'Đã duyệt', badgeColor: 'green' },
                          { value: 'REJECTED', label: 'Từ chối', badgeColor: 'red' },
                        ]}
                      />
                    </th>
                    <th className="px-4 py-3 font-semibold text-ink-600 hidden md:table-cell">Ghi chú Admin</th>
                    <th className="px-4 py-3 font-semibold text-ink-600 hidden sm:table-cell">Ngày tạo</th>
                    <th className="px-4 py-3 font-semibold text-ink-600 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100/60">
                  {requests.map((r) => {
                    const isUnseen = isRequestUnseen(user?.id, r)

                    return (
                      <tr
                        key={r.id}
                        className={`transition-colors ${
                          isUnseen
                            ? 'bg-rose-50/40 hover:bg-rose-50/70'
                            : 'hover:bg-pool-50/50'
                        }`}
                      >
                        <td className="px-4 py-3 font-medium text-ink-800">
                          <div className="flex items-center gap-2">
                            {isUnseen && (
                              <span className="flex h-2.5 w-2.5 relative shrink-0" title="Phản hồi mới chưa xem">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                              </span>
                            )}
                            <span>{r.studentName || '—'}</span>
                            {isUnseen && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 tracking-tight">
                                Mới
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-ink-600 hidden sm:table-cell font-medium">Bơi {STYLE[r.swimStyle] || '—'}</td>
                        <td className="px-4 py-3 hidden md:table-cell"><Badge color={r.requestType === 'CREATE' ? 'blue' : 'purple'}>{TYPE_LABEL[r.requestType] || r.requestType}</Badge></td>
                        <td className="px-4 py-3"><Badge color={STATUS_COLOR[r.status]}>{STATUS_LABEL[r.status]}</Badge></td>
                        <td className="px-4 py-3 text-ink-500 hidden md:table-cell max-w-[200px] truncate">{r.adminNote || '—'}</td>
                        <td className="px-4 py-3 text-ink-500 hidden sm:table-cell">{r.createdAt ? new Date(r.createdAt).toLocaleDateString('vi-VN') : '—'}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => {
                              setDetail(r)
                              markSingleRequestSeen(user?.id, r)
                            }}
                            className="relative p-1.5 rounded-lg text-pool-600 hover:bg-pool-50 transition-colors"
                            title="Xem chi tiết (Xóa thông báo mới)"
                          >
                            <Eye className="w-4 h-4" />
                            {isUnseen && (
                              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
                            )}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-ink-100/60">
              <p className="text-xs text-ink-400 mb-3">Tổng {list.totalElements || 0} yêu cầu</p>
              <Pagination page={list.currentPage} totalPages={list.totalPages} onChange={setPage} />
            </div>
          </>
        )}
      </div>

      {showCreate && <CreateRequestModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); load() }} />}

      {detail && <DetailModal request={detail} onClose={() => setDetail(null)} />}
    </div>
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
  const [loading, setLoading] = useState(false)
  const [resolvingStudentId, setResolvingStudentId] = useState(false)

  // Student selection mode for CREATE
  const [studentMode, setStudentMode] = useState('existing') // 'existing' | 'new'
  const [newStudent, setNewStudent] = useState({ fullName: '', phoneNumber: '', dob: '' })

  // My enrollments search (teacher's own students only via /teacher/enrollments)
  const [studentSearch, setStudentSearch] = useState('')
  const [myEnrollments, setMyEnrollments] = useState([])
  const [studentsLoading, setStudentsLoading] = useState(false)
  const debouncedStudentSearch = useDebounce(studentSearch, 300)

  // For UPDATE
  const [selectedEnrollment, setSelectedEnrollment] = useState(null)
  const [updateStudentSearch, setUpdateStudentSearch] = useState('')
  const debouncedUpdateSearch = useDebounce(updateStudentSearch, 300)
  const [updateEnrollments, setUpdateEnrollments] = useState([])
  const [updateLoading, setUpdateLoading] = useState(false)

  // Unique student list from enrollments (for CREATE "existing" mode)
  const uniqueStudents = (() => {
    const map = new Map()
    myEnrollments.forEach(en => {
      if (en.studentName && !map.has(en.studentName)) {
        map.set(en.studentName, { studentName: en.studentName, studentPhone: en.studentPhone })
      }
    })
    return Array.from(map.values())
  })()

  // Load my enrollments for CREATE existing mode (search by student name)
  useEffect(() => {
    if (requestType === 'CREATE' && studentMode === 'existing') {
      setStudentsLoading(true)
      getMyStudents({ studentName: debouncedStudentSearch, page: 1, size: 100 })
        .then(r => setMyEnrollments(r.content || []))
        .catch(() => setMyEnrollments([]))
        .finally(() => setStudentsLoading(false))
    }
  }, [debouncedStudentSearch, requestType, studentMode])

  // Load my enrollments for UPDATE mode (search by student name)
  useEffect(() => {
    if (requestType === 'UPDATE') {
      setUpdateLoading(true)
      getMyStudents({ studentName: debouncedUpdateSearch, page: 1, size: 100 })
        .then(r => setUpdateEnrollments(r.content || []))
        .catch(() => setUpdateEnrollments([]))
        .finally(() => setUpdateLoading(false))
    }
  }, [debouncedUpdateSearch, requestType])

  // When selecting an existing student in CREATE mode: resolve their UUID via getTeacherStudents
  const handleSelectExistingStudent = async (student) => {
    setForm(f => ({ ...f, selectedStudentName: student.studentName, studentId: '' }))
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

  // Sync default values when dynamic settings load
  useEffect(() => {
    if (requestType === 'CREATE') {
      setForm(f => ({
        ...f,
        totalQuota: f.totalQuota === '12' || !f.totalQuota ? String(defaultQuota) : f.totalQuota,
        expireDate: f.startDate ? addDays(f.startDate, durationDays) : f.expireDate
      }))
    }
  }, [durationDays, defaultQuota, requestType])

  // When selecting an enrollment in UPDATE mode, pre-fill form with current data
  const handleSelectEnrollment = (en) => {
    setSelectedEnrollment(en)
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

    // Validate
    if (requestType === 'CREATE') {
      if (studentMode === 'existing') {
        if (!form.selectedStudentName) {
          toast.error('Vui lòng chọn học viên')
          return
        }
        if (!form.studentId) {
          toast.error('Đang tải ID học viên hoặc chưa tìm thấy ID, vui lòng thử chọn lại')
          return
        }
      }
      if (studentMode === 'new') {
        const trimmedFullName = newStudent.fullName.trim()
        if (!trimmedFullName) {
          toast.error('Vui lòng nhập họ tên học viên')
          return
        }
        if (trimmedFullName.length > 100) {
          toast.error('Họ tên không được vượt quá 100 ký tự')
          return
        }
        const trimmedPhone = newStudent.phoneNumber.trim()
        if (!trimmedPhone) {
          toast.error('Vui lòng nhập số điện thoại')
          return
        }
        const phoneRegex = /^(0|\+84)[3|5|7|8|9][0-9]{8}$/
        if (!phoneRegex.test(trimmedPhone)) {
          toast.error('Số điện thoại không hợp lệ (10 chữ số, ví dụ 0912345678 hoặc +84912345678)')
          return
        }
        if (!newStudent.dob) {
          toast.error('Vui lòng nhập ngày sinh')
          return
        }
        if (new Date(newStudent.dob) >= new Date()) {
          toast.error('Ngày sinh phải là ngày trong quá khứ')
          return
        }
      }
    }

    if (requestType === 'UPDATE' && !form.targetEnrollmentId) {
      toast.error('Vui lòng chọn khóa học cần cập nhật')
      return
    }

    if (!form.swimStyle) {
      toast.error('Vui lòng chọn kiểu bơi')
      return
    }

    if (form.totalQuota && Number(form.totalQuota) < 1) {
      toast.error('Tổng số buổi học phải lớn hơn 0')
      return
    }

    if (form.startDate && form.expireDate && new Date(form.startDate) >= new Date(form.expireDate)) {
      toast.error('Ngày hết hạn phải sau ngày bắt đầu')
      return
    }

    setLoading(true)
    try {
      let studentId = form.studentId

      // If CREATE + new student mode → create student first
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

  return (
    <Modal open onClose={onClose} title="Tạo yêu cầu đăng ký" size="lg">
      <form onSubmit={submit} className="space-y-5">
        {/* Request type selector */}
        <Field label="Loại yêu cầu" required>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setRequestType('CREATE')
                setSelectedEnrollment(null)
              }}
              className={`flex-1 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all ${requestType === 'CREATE' ? 'bg-pool-50 border-pool-300 text-pool-700 shadow-sm' : 'border-ink-200 text-ink-600 hover:bg-ink-50'}`}
            >
              <Plus className="w-4 h-4 inline mr-1.5" /> Tạo khóa học mới
            </button>
            <button
              type="button"
              onClick={() => {
                setRequestType('UPDATE')
                setForm(f => ({ ...f, studentId: '', selectedStudentName: '' }))
              }}
              className={`flex-1 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all ${requestType === 'UPDATE' ? 'bg-pool-50 border-pool-300 text-pool-700 shadow-sm' : 'border-ink-200 text-ink-600 hover:bg-ink-50'}`}
            >
              <ListChecks className="w-4 h-4 inline mr-1.5" /> Cập nhật khóa học
            </button>
          </div>
        </Field>

        {/* ===== CREATE MODE ===== */}
        {requestType === 'CREATE' && (
          <>
            <Field label="Học viên" required>
              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setStudentMode('existing')}
                  className={`flex-1 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${studentMode === 'existing' ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'border-ink-200 text-ink-600 hover:bg-ink-50'}`}
                >
                  <Users className="w-4 h-4 inline mr-1.5" /> Chọn học viên đã có
                </button>
                <button
                  type="button"
                  onClick={() => setStudentMode('new')}
                  className={`flex-1 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${studentMode === 'new' ? 'bg-violet-50 border-violet-300 text-violet-700' : 'border-ink-200 text-ink-600 hover:bg-ink-50'}`}
                >
                  <UserPlus className="w-4 h-4 inline mr-1.5" /> Tạo học viên mới
                </button>
              </div>

              {studentMode === 'existing' ? (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                    <input
                      placeholder="Tìm theo tên học viên của bạn..."
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      className={inputCls + ' pl-10'}
                    />
                  </div>
                  <p className="text-xs text-ink-400 flex items-center gap-1">
                    <Info className="w-3 h-3" /> Chỉ hiển thị học viên mà bạn đang phụ trách
                  </p>
                  <div className="border border-ink-200 rounded-xl max-h-40 overflow-y-auto divide-y divide-ink-100/60">
                    {studentsLoading ? (
                      <Spinner className="py-4" size={20} />
                    ) : uniqueStudents.length === 0 ? (
                      <p className="text-sm text-ink-400 py-4 text-center">Không tìm thấy học viên</p>
                    ) : (
                      uniqueStudents.map(s => (
                        <label
                          key={s.studentName}
                          className={`flex items-center justify-between px-3 py-2.5 cursor-pointer hover:bg-pool-50/50 transition-colors ${form.selectedStudentName === s.studentName ? 'bg-pool-50' : ''}`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="student"
                              checked={form.selectedStudentName === s.studentName}
                              onChange={() => handleSelectExistingStudent(s)}
                              className="w-4 h-4 text-pool-600"
                            />
                            <div>
                              <p className="text-sm font-medium text-ink-800">{s.studentName}</p>
                              <p className="text-xs text-ink-400">{s.studentPhone || ''}</p>
                            </div>
                          </div>
                          {form.selectedStudentName === s.studentName && resolvingStudentId && (
                            <span className="text-xs text-pool-600 font-medium animate-pulse">Đang nạp ID...</span>
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
                <div className="space-y-3 p-3 bg-violet-50/50 rounded-xl border border-violet-200/60">
                  <Field label="Họ tên" required>
                    <input
                      value={newStudent.fullName}
                      onChange={e => setNewStudent({ ...newStudent, fullName: e.target.value })}
                      className={inputCls}
                      placeholder="Nguyễn Văn A"
                      maxLength={100}
                    />
                  </Field>
                  <Field label="Số điện thoại" required hint="Định dạng: 0xxxxxxxxx (10 số)">
                    <input
                      type="tel"
                      value={newStudent.phoneNumber}
                      onChange={e => setNewStudent({ ...newStudent, phoneNumber: e.target.value })}
                      className={inputCls}
                      placeholder="0912345678"
                    />
                  </Field>
                  <Field label="Ngày sinh" required>
                    <input
                      type="date"
                      value={newStudent.dob}
                      max={new Date().toISOString().slice(0, 10)}
                      onChange={e => setNewStudent({ ...newStudent, dob: e.target.value })}
                      className={inputCls}
                    />
                  </Field>
                </div>
              )}
            </Field>
          </>
        )}

        {/* ===== UPDATE MODE ===== */}
        {requestType === 'UPDATE' && (
          <>
            <Field label="Chọn khóa học cần cập nhật" required hint="Chỉ hiển thị học viên của bạn">
              <div className="relative mb-2">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                <input
                  placeholder="Tìm theo tên học viên..."
                  value={updateStudentSearch}
                  onChange={(e) => {
                    setUpdateStudentSearch(e.target.value)
                    setSelectedEnrollment(null)
                  }}
                  className={inputCls + ' pl-10'}
                />
              </div>
              <div className="border border-ink-200 rounded-xl max-h-52 overflow-y-auto">
                {updateLoading ? (
                  <Spinner className="py-4" size={20} />
                ) : updateEnrollments.length === 0 ? (
                  <p className="text-sm text-ink-400 py-4 text-center">Không tìm thấy khóa học</p>
                ) : (
                  updateEnrollments.map(en => (
                    <label
                      key={en.enrollmentId}
                      className={`flex items-center justify-between px-3 py-3 cursor-pointer hover:bg-pool-50/50 transition-colors border-b border-ink-100/40 last:border-0 ${form.targetEnrollmentId === en.enrollmentId ? 'bg-pool-50' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="enrollment"
                          value={en.enrollmentId}
                          checked={form.targetEnrollmentId === en.enrollmentId}
                          onChange={() => handleSelectEnrollment(en)}
                          className="w-4 h-4 text-pool-600"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-medium text-ink-800">{en.studentName}</p>
                            {en.isGuaranteed && <Shield className="w-3 h-3 text-amber-500" />}
                          </div>
                          <p className="text-xs text-ink-400">{STYLE[en.swimStyle] || en.swimStyle} • {en.attendedSessions}/{en.totalQuota} buổi • Hạn: {en.expireDate || '—'}</p>
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

            {/* Show current enrollment info when selected */}
            {selectedEnrollment && (
              <div className="bg-pool-50/50 border border-pool-200/60 rounded-xl p-4 space-y-2">
                <p className="text-xs font-semibold text-pool-700 uppercase tracking-wider">Thông tin hiện tại</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-ink-400">Học viên</p>
                    <p className="font-medium text-ink-800">{selectedEnrollment.studentName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-ink-400">Kiểu bơi</p>
                    <p className="font-medium text-ink-800">{STYLE[selectedEnrollment.swimStyle] || selectedEnrollment.swimStyle}</p>
                  </div>
                  <div>
                    <p className="text-xs text-ink-400">Cam kết</p>
                    <p className="font-medium text-ink-800">{selectedEnrollment.isGuaranteed ? 'Có' : 'Không'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-ink-400">Tổng buổi</p>
                    <p className="font-medium text-ink-800">{selectedEnrollment.totalQuota}</p>
                  </div>
                  <div>
                    <p className="text-xs text-ink-400">Đã học</p>
                    <p className="font-medium text-ink-800">{selectedEnrollment.attendedSessions} buổi ({selectedEnrollment.progressPercentage || 0}%)</p>
                  </div>
                  <div>
                    <p className="text-xs text-ink-400">Còn lại</p>
                    <p className={`font-medium ${selectedEnrollment.daysRemaining != null && selectedEnrollment.daysRemaining < 5 ? 'text-rose-600' : 'text-ink-800'}`}>
                      {selectedEnrollment.daysRemaining != null ? `${selectedEnrollment.daysRemaining} ngày` : '—'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Common fields */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Kiểu bơi" required>
            <select value={form.swimStyle} onChange={e => setForm({ ...form, swimStyle: e.target.value })} className={inputCls}>
              {Object.entries(STYLE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
          <Field label="Cam kết" required>
            <select value={form.isGuaranteed ? '1' : '0'} onChange={e => setForm({ ...form, isGuaranteed: e.target.value === '1' })} className={inputCls}>
              <option value="0">Không cam kết</option>
              <option value="1">Có cam kết</option>
            </select>
          </Field>
          <Field label="Tổng buổi" hint={`Số buổi học (mặc định: ${defaultQuota})`}>
            <input type="number" min="1" value={form.totalQuota} onChange={e => setForm({ ...form, totalQuota: e.target.value })} className={inputCls} placeholder={String(defaultQuota)} />
          </Field>
          <Field label="Ngày bắt đầu" hint={requestType === 'UPDATE' ? 'Không thể đổi ngày bắt đầu khi cập nhật' : 'Mặc định là hôm nay'}>
            <input
              type="date"
              value={form.startDate}
              onChange={e => {
                const val = e.target.value
                setForm(f => ({
                  ...f,
                  startDate: val,
                  expireDate: val ? addDays(val, durationDays) : f.expireDate
                }))
              }}
              disabled={requestType === 'UPDATE'}
              className={inputCls + (requestType === 'UPDATE' ? ' bg-ink-50/50 text-ink-400' : '')}
            />
          </Field>
          <Field label="Ngày hết hạn" hint={`Mặc định = Ngày bắt đầu + ${durationDays} ngày`}>
            <input type="date" value={form.expireDate} min={form.startDate || undefined} onChange={e => setForm({ ...form, expireDate: e.target.value })} className={inputCls} />
          </Field>
        </div>

        <Field label="Ghi chú cho Admin">
          <textarea value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} className={inputCls} rows={2} placeholder="Lý do đề xuất..." />
        </Field>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">Hủy</Button>
          <Button type="submit" disabled={loading || resolvingStudentId} className="flex-1">
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
        <div className="bg-ink-50/60 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-ink-900 text-lg">{request.studentName || '—'}</h3>
            <div className="flex items-center gap-2">
              <Badge color={request.requestType === 'CREATE' ? 'blue' : 'purple'}>{TYPE_LABEL[request.requestType]}</Badge>
              <Badge color={STATUS_COLOR[request.status]}>{STATUS_LABEL[request.status]}</Badge>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-xs text-ink-400">Kiểu bơi</p>
              <p className="font-medium text-ink-800">{STYLE[request.swimStyle] || request.swimStyle || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-ink-400">Cam kết</p>
              <p className="font-medium text-ink-800">{request.isGuaranteed ? 'Có cam kết' : 'Không'}</p>
            </div>
            <div>
              <p className="text-xs text-ink-400">Tổng buổi</p>
              <p className="font-medium text-ink-800">{displayQuota} buổi {request.totalQuota ? '' : '(mặc định)'}</p>
            </div>
            <div>
              <p className="text-xs text-ink-400">Ngày bắt đầu</p>
              <p className="font-medium text-ink-800">{formatDisplayDate(displayStart)} {request.startDate ? '' : '(mặc định)'}</p>
            </div>
            <div>
              <p className="text-xs text-ink-400">Ngày hết hạn</p>
              <p className="font-medium text-ink-800">{formatDisplayDate(displayExpire)} {request.expireDate ? '' : '(mặc định)'}</p>
            </div>
            <div>
              <p className="text-xs text-ink-400">Ngày tạo</p>
              <p className="font-medium text-ink-800">{request.createdAt ? new Date(request.createdAt).toLocaleDateString('vi-VN') : '—'}</p>
            </div>
          </div>
          {request.note && (
            <div className="pt-1">
              <p className="text-xs text-ink-400">Ghi chú của bạn</p>
              <p className="text-sm text-ink-700 bg-white/80 rounded-lg px-3 py-2 mt-1">{request.note}</p>
            </div>
          )}
          {request.adminNote && (
            <div className="pt-1">
              <p className="text-xs text-ink-400">Phản hồi từ Admin</p>
              <p className="text-sm text-ink-700 bg-white/80 rounded-lg px-3 py-2 mt-1">{request.adminNote}</p>
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

