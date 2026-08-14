import { useEffect, useState } from 'react'
import { ListChecks, Plus, Search, UserPlus, Users, Shield, Info } from 'lucide-react'
import { getMyEnrollmentRequests, createEnrollmentRequest, getTeacherStudents, createTeacherStudent, getMyStudents } from '../../lib/apiTeacher'
import { Button, Badge, Spinner, EmptyState, Pagination, Modal, Field, inputCls } from '../../components/ui'
import { toast } from '../../components/ui/Toast'
import { errMsg } from '../../lib/api'
import { useDebounce } from '../../lib/useDebounce'

const STYLE = { FROG: 'Ếch', FREE: 'Sải', BACK: 'Ngửa', FLY: 'Bướm' }
const STATUS_COLOR = { PENDING: 'amber', APPROVED: 'green', REJECTED: 'red' }
const STATUS_LABEL = { PENDING: 'Chờ duyệt', APPROVED: 'Đã duyệt', REJECTED: 'Từ chối' }
const TYPE_LABEL = { CREATE: 'Tạo mới', UPDATE: 'Cập nhật' }
const STATUS_EN = { ACTIVE: 'Đang học', COMPLETED: 'Hoàn thành', EXPIRED: 'Hết hạn' }

export default function TeacherRequests() {
  const [list, setList] = useState({ content: [], totalElements: 0, totalPages: 0, currentPage: 1, pageSize: 10 })
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [showCreate, setShowCreate] = useState(false)

  const load = () => {
    setLoading(true)
    getMyEnrollmentRequests({ status, page, size: 10 })
      .then(setList)
      .catch((e) => toast.error(errMsg(e)))
      .finally(() => setLoading(false))
  }

  useEffect(() => { setPage(1) }, [status])
  useEffect(() => { load() }, [status, page])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-ink-900 tracking-tight">Yêu cầu đăng ký</h1>
          <p className="text-sm text-ink-500 mt-1">Gửi yêu cầu tạo/cập nhật khóa học cho Admin duyệt</p>
        </div>
        <Button onClick={() => setShowCreate(true)}><Plus className="w-4 h-4" /> Tạo yêu cầu</Button>
      </div>

      <div className="bg-white rounded-2xl border border-ink-100/60 p-4 animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls + ' w-auto'}>
          <option value="">Tất cả trạng thái</option>
          <option value="PENDING">Chờ duyệt</option>
          <option value="APPROVED">Đã duyệt</option>
          <option value="REJECTED">Từ chối</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-ink-100/60 overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        {loading ? <Spinner className="py-20" size={32} /> : list.content.length === 0 ? (
          <EmptyState icon={ListChecks} title="Chưa có yêu cầu" description="Tạo yêu cầu đăng ký khóa học đầu tiên." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-ink-50/80 text-ink-500 text-left">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Học viên</th>
                    <th className="px-4 py-3 font-semibold hidden sm:table-cell">Kiểu bơi</th>
                    <th className="px-4 py-3 font-semibold hidden md:table-cell">Loại</th>
                    <th className="px-4 py-3 font-semibold">Trạng thái</th>
                    <th className="px-4 py-3 font-semibold hidden md:table-cell">Ghi chú Admin</th>
                    <th className="px-4 py-3 font-semibold hidden sm:table-cell">Ngày tạo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100/60">
                  {list.content.map((r) => (
                    <tr key={r.id} className="hover:bg-pool-50/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-ink-800">{r.studentName || '—'}</td>
                      <td className="px-4 py-3 text-ink-600 hidden sm:table-cell">{STYLE[r.swimStyle] || '—'}</td>
                      <td className="px-4 py-3 hidden md:table-cell"><Badge color={r.requestType === 'CREATE' ? 'blue' : 'purple'}>{TYPE_LABEL[r.requestType] || r.requestType}</Badge></td>
                      <td className="px-4 py-3"><Badge color={STATUS_COLOR[r.status]}>{STATUS_LABEL[r.status]}</Badge></td>
                      <td className="px-4 py-3 text-ink-500 hidden md:table-cell max-w-[200px] truncate">{r.adminNote || '—'}</td>
                      <td className="px-4 py-3 text-ink-500 hidden sm:table-cell">{r.createdAt ? new Date(r.createdAt).toLocaleDateString('vi-VN') : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-ink-100/60">
              <p className="text-xs text-ink-400 mb-3">Tổng {list.totalElements} yêu cầu</p>
              <Pagination page={list.currentPage} totalPages={list.totalPages} onChange={setPage} />
            </div>
          </>
        )}
      </div>

      {showCreate && <CreateRequestModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); load() }} />}
    </div>
  )
}

// ===== CREATE REQUEST MODAL =====
function CreateRequestModal({ onClose, onCreated }) {
  const [requestType, setRequestType] = useState('CREATE')
  const [form, setForm] = useState({
    studentId: '',
    selectedStudentName: '',
    targetEnrollmentId: '',
    swimStyle: 'FROG',
    isGuaranteed: false,
    totalQuota: '',
    startDate: '',
    expireDate: '',
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

  // When selecting an enrollment in UPDATE mode, pre-fill form with current data
  const handleSelectEnrollment = (en) => {
    setSelectedEnrollment(en)
    setForm(f => ({
      ...f,
      targetEnrollmentId: en.enrollmentId,
      swimStyle: en.swimStyle || 'FROG',
      isGuaranteed: !!en.isGuaranteed,
      totalQuota: en.totalQuota ? String(en.totalQuota) : '',
      startDate: en.startDate || '',
      expireDate: en.expireDate || ''
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
          <Field label="Tổng buổi" hint="Để trống = mặc định">
            <input type="number" min="1" value={form.totalQuota} onChange={e => setForm({ ...form, totalQuota: e.target.value })} className={inputCls} placeholder="12" />
          </Field>
          <Field label="Ngày bắt đầu">
            <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Ngày hết hạn">
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
