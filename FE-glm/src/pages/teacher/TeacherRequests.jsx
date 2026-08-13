import { useEffect, useState, useMemo } from 'react'
import { ListChecks, Plus, Search, UserPlus, Users } from 'lucide-react'
import { getMyEnrollmentRequests, createEnrollmentRequest, getTeacherStudents, createTeacherStudent, getMyStudents } from '../../lib/apiTeacher'
import { Button, Badge, Spinner, EmptyState, Pagination, Modal, Field, inputCls } from '../../components/ui'
import { toast } from '../../components/ui/Toast'
import { errMsg } from '../../lib/api'
import { useDebounce } from '../../lib/useDebounce'

const STYLE = { FROG: 'Ếch', FREE: 'Tự do', BACK: 'Ngửa', FLY: 'Bướm' }
const STATUS_COLOR = { PENDING: 'amber', APPROVED: 'green', REJECTED: 'red' }
const STATUS_LABEL = { PENDING: 'Chờ duyệt', APPROVED: 'Đã duyệt', REJECTED: 'Từ chối' }
const TYPE_LABEL = { CREATE: 'Tạo mới', UPDATE: 'Cập nhật' }

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
                      <td className="px-4 py-3 hidden md:table-cell"><Badge color="blue">{TYPE_LABEL[r.requestType] || r.requestType}</Badge></td>
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
    targetEnrollmentId: '',
    swimStyle: 'FROG',
    isGuaranteed: false,
    totalQuota: '',
    startDate: '',
    expireDate: '',
    note: ''
  })
  const [loading, setLoading] = useState(false)

  // Student selection mode for CREATE
  const [studentMode, setStudentMode] = useState('existing') // 'existing' | 'new'
  const [newStudent, setNewStudent] = useState({ fullName: '', phoneNumber: '', dob: '' })

  // Student search for existing
  const [studentSearch, setStudentSearch] = useState('')
  const [students, setStudents] = useState([])
  const [studentsLoading, setStudentsLoading] = useState(false)
  const debouncedStudentSearch = useDebounce(studentSearch, 300)

  // For UPDATE: after selecting student, load their enrollments
  const [selectedStudentForUpdate, setSelectedStudentForUpdate] = useState(null)
  const [enrollments, setEnrollments] = useState([])
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(false)
  const [updateStudentSearch, setUpdateStudentSearch] = useState('')
  const debouncedUpdateSearch = useDebounce(updateStudentSearch, 300)

  // Load students when searching (CREATE mode)
  useEffect(() => {
    if (requestType === 'CREATE' && studentMode === 'existing') {
      setStudentsLoading(true)
      getTeacherStudents({ keyword: debouncedStudentSearch, page: 1, size: 50 })
        .then(r => setStudents(r.content || []))
        .catch(() => setStudents([]))
        .finally(() => setStudentsLoading(false))
    }
  }, [debouncedStudentSearch, requestType, studentMode])

  // Load students when searching (UPDATE mode)
  useEffect(() => {
    if (requestType === 'UPDATE') {
      setStudentsLoading(true)
      getTeacherStudents({ keyword: debouncedUpdateSearch, page: 1, size: 50 })
        .then(r => setStudents(r.content || []))
        .catch(() => setStudents([]))
        .finally(() => setStudentsLoading(false))
    }
  }, [debouncedUpdateSearch, requestType])

  // When student is selected for UPDATE, load their enrollments
  useEffect(() => {
    if (selectedStudentForUpdate) {
      setEnrollmentsLoading(true)
      // Use teacher enrollments API with searchName to filter by student name
      getMyStudents({ studentName: selectedStudentForUpdate.fullName, page: 1, size: 50 })
        .then(r => setEnrollments(r.content || []))
        .catch(() => setEnrollments([]))
        .finally(() => setEnrollmentsLoading(false))
    } else {
      setEnrollments([])
    }
  }, [selectedStudentForUpdate])

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      let studentId = form.studentId

      // If CREATE + new student mode → create student first
      if (requestType === 'CREATE' && studentMode === 'new') {
        const created = await createTeacherStudent(newStudent)
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
        note: form.note || undefined
      }

      await createEnrollmentRequest(body)
      toast.success('Đã gửi yêu cầu đăng ký')
      onCreated()
    } catch (e) { toast.error(errMsg(e)) } finally { setLoading(false) }
  }

  return (
    <Modal open onClose={onClose} title="Tạo yêu cầu đăng ký" size="lg">
      <form onSubmit={submit} className="space-y-5">
        {/* Request type selector */}
        <Field label="Loại yêu cầu" required>
          <div className="flex gap-2">
            <button type="button" onClick={() => { setRequestType('CREATE'); setSelectedStudentForUpdate(null) }} className={`flex-1 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all ${requestType === 'CREATE' ? 'bg-pool-50 border-pool-300 text-pool-700 shadow-sm' : 'border-ink-200 text-ink-600 hover:bg-ink-50'}`}>
              <Plus className="w-4 h-4 inline mr-1.5" /> Tạo khóa học mới
            </button>
            <button type="button" onClick={() => { setRequestType('UPDATE'); setForm(f => ({ ...f, studentId: '' })) }} className={`flex-1 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all ${requestType === 'UPDATE' ? 'bg-pool-50 border-pool-300 text-pool-700 shadow-sm' : 'border-ink-200 text-ink-600 hover:bg-ink-50'}`}>
              <ListChecks className="w-4 h-4 inline mr-1.5" /> Cập nhật khóa học
            </button>
          </div>
        </Field>

        {/* ===== CREATE MODE ===== */}
        {requestType === 'CREATE' && (
          <>
            {/* Student mode selector */}
            <Field label="Học viên" required>
              <div className="flex gap-2 mb-3">
                <button type="button" onClick={() => setStudentMode('existing')} className={`flex-1 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${studentMode === 'existing' ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'border-ink-200 text-ink-600 hover:bg-ink-50'}`}>
                  <Users className="w-4 h-4 inline mr-1.5" /> Chọn học viên đã có
                </button>
                <button type="button" onClick={() => setStudentMode('new')} className={`flex-1 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${studentMode === 'new' ? 'bg-violet-50 border-violet-300 text-violet-700' : 'border-ink-200 text-ink-600 hover:bg-ink-50'}`}>
                  <UserPlus className="w-4 h-4 inline mr-1.5" /> Tạo học viên mới
                </button>
              </div>

              {studentMode === 'existing' ? (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                    <input
                      placeholder="Tìm theo tên hoặc SĐT..."
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      className={inputCls + ' pl-10'}
                    />
                  </div>
                  <div className="border border-ink-200 rounded-xl max-h-40 overflow-y-auto">
                    {studentsLoading ? (
                      <Spinner className="py-4" size={20} />
                    ) : students.length === 0 ? (
                      <p className="text-sm text-ink-400 py-4 text-center">Không tìm thấy học viên</p>
                    ) : (
                      students.map(s => (
                        <label key={s.id} className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-pool-50/50 transition-colors ${form.studentId === s.id ? 'bg-pool-50' : ''}`}>
                          <input type="radio" name="student" value={s.id} checked={form.studentId === s.id} onChange={() => setForm({ ...form, studentId: s.id })} className="w-4 h-4 text-pool-600" />
                          <div>
                            <p className="text-sm font-medium text-ink-800">{s.fullName}</p>
                            <p className="text-xs text-ink-400">{s.phoneNumber} {s.dob ? `• ${s.dob}` : ''}</p>
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-3 p-3 bg-violet-50/50 rounded-xl border border-violet-200/60">
                  <Field label="Họ tên" required>
                    <input value={newStudent.fullName} onChange={e => setNewStudent({ ...newStudent, fullName: e.target.value })} className={inputCls} placeholder="Nguyễn Văn A" required={studentMode === 'new'} />
                  </Field>
                  <Field label="Số điện thoại" required hint="Định dạng: 0xxxxxxxxx">
                    <input type="tel" value={newStudent.phoneNumber} onChange={e => setNewStudent({ ...newStudent, phoneNumber: e.target.value })} className={inputCls} placeholder="0912345678" required={studentMode === 'new'} />
                  </Field>
                  <Field label="Ngày sinh" required>
                    <input type="date" value={newStudent.dob} onChange={e => setNewStudent({ ...newStudent, dob: e.target.value })} className={inputCls} required={studentMode === 'new'} />
                  </Field>
                </div>
              )}
            </Field>
          </>
        )}

        {/* ===== UPDATE MODE ===== */}
        {requestType === 'UPDATE' && (
          <>
            <Field label="Chọn học viên" required hint="Tìm kiếm học viên, sau đó chọn khóa học cần cập nhật">
              <div className="relative mb-2">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                <input
                  placeholder="Tìm theo tên hoặc SĐT..."
                  value={updateStudentSearch}
                  onChange={(e) => { setUpdateStudentSearch(e.target.value); setSelectedStudentForUpdate(null) }}
                  className={inputCls + ' pl-10'}
                />
              </div>
              {!selectedStudentForUpdate && (
                <div className="border border-ink-200 rounded-xl max-h-36 overflow-y-auto">
                  {studentsLoading ? (
                    <Spinner className="py-4" size={20} />
                  ) : students.length === 0 ? (
                    <p className="text-sm text-ink-400 py-4 text-center">Không tìm thấy học viên</p>
                  ) : (
                    students.map(s => (
                      <button type="button" key={s.id} onClick={() => { setSelectedStudentForUpdate(s); setUpdateStudentSearch(s.fullName) }} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-pool-50/50 transition-colors text-left">
                        <div>
                          <p className="text-sm font-medium text-ink-800">{s.fullName}</p>
                          <p className="text-xs text-ink-400">{s.phoneNumber}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </Field>

            {selectedStudentForUpdate && (
              <Field label="Chọn khóa học cần cập nhật" required>
                <div className="border border-ink-200 rounded-xl max-h-48 overflow-y-auto">
                  {enrollmentsLoading ? (
                    <Spinner className="py-4" size={20} />
                  ) : enrollments.length === 0 ? (
                    <p className="text-sm text-ink-400 py-4 text-center">Học viên chưa có khóa học nào</p>
                  ) : (
                    enrollments.map(en => (
                      <label key={en.enrollmentId} className={`flex items-center justify-between px-3 py-3 cursor-pointer hover:bg-pool-50/50 transition-colors border-b border-ink-100/40 last:border-0 ${form.targetEnrollmentId === en.enrollmentId ? 'bg-pool-50' : ''}`}>
                        <div className="flex items-center gap-3">
                          <input type="radio" name="enrollment" value={en.enrollmentId} checked={form.targetEnrollmentId === en.enrollmentId} onChange={() => setForm({ ...form, targetEnrollmentId: en.enrollmentId })} className="w-4 h-4 text-pool-600" />
                          <div>
                            <p className="text-sm font-medium text-ink-800">{en.studentName} — {STYLE[en.swimStyle] || en.swimStyle}</p>
                            <p className="text-xs text-ink-400">Tiến độ: {en.attendedSessions}/{en.totalQuota} buổi • Hạn: {en.expireDate || '—'}</p>
                          </div>
                        </div>
                        <Badge color={en.status === 'ACTIVE' ? 'green' : en.status === 'COMPLETED' ? 'blue' : 'gray'}>
                          {en.status === 'ACTIVE' ? 'Đang học' : en.status === 'COMPLETED' ? 'Xong' : 'Hết hạn'}
                        </Badge>
                      </label>
                    ))
                  )}
                </div>
              </Field>
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
            <input type="date" value={form.expireDate} onChange={e => setForm({ ...form, expireDate: e.target.value })} className={inputCls} />
          </Field>
        </div>

        <Field label="Ghi chú cho Admin">
          <textarea value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} className={inputCls} rows={2} placeholder="Lý do đề xuất..." />
        </Field>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">Hủy</Button>
          <Button type="submit" disabled={loading} className="flex-1">{loading ? 'Đang gửi...' : 'Gửi yêu cầu'}</Button>
        </div>
      </form>
    </Modal>
  )
}
