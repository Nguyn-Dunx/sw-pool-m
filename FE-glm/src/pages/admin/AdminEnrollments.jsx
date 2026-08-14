import { useEffect, useState } from 'react'
import { GraduationCap, Plus, Search, Eye, CheckCircle, Pencil, X, Shield, Users } from 'lucide-react'
import { getEnrollments, getEnrollmentDetail, createEnrollment, updateEnrollment, completeEnrollment, getStudents, getTeachers } from '../../lib/apiAdmin'
import { Button, Badge, Spinner, EmptyState, Pagination, Modal, Field, inputCls } from '../../components/ui'
import { toast } from '../../components/ui/Toast'
import { errMsg } from '../../lib/api'
import { useDebounce } from '../../lib/useDebounce'

const STATUS = { ACTIVE: 'green', COMPLETED: 'blue', EXPIRED: 'gray' }
const STYLE = { FROG: 'Ếch', FREE: 'Sải', BACK: 'Ngửa', FLY: 'Bướm' }

export default function AdminEnrollments() {
  const [list, setList] = useState({ content: [], totalElements: 0, totalPages: 0, currentPage: 1, pageSize: 10 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [swimStyle, setSwimStyle] = useState('')
  const [page, setPage] = useState(1)
  const [detail, setDetail] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [showCreate, setShowCreate] = useState(false)

  const debouncedSearch = useDebounce(search, 350)

  const load = () => {
    setLoading(true)
    getEnrollments({ studentName: debouncedSearch, status, swimStyle, page, size: 10 })
      .then(setList)
      .catch((e) => toast.error(errMsg(e)))
      .finally(() => setLoading(false))
  }

  useEffect(() => { setPage(1) }, [debouncedSearch, status, swimStyle])
  useEffect(() => { load() }, [debouncedSearch, status, swimStyle, page])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-ink-900 tracking-tight">Khóa học</h1>
          <p className="text-sm text-ink-500 mt-1">Quản lý đăng ký khóa học bơi</p>
        </div>
        <Button onClick={() => setShowCreate(true)}><Plus className="w-4 h-4" /> Tạo khóa học</Button>
      </div>

      <div className="bg-white rounded-2xl border border-ink-100/60 p-4 flex flex-wrap gap-3 animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
          <input
            placeholder="Tên học viên..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={inputCls + ' pl-10'}
          />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls + ' w-auto'}>
          <option value="">Tất cả trạng thái</option>
          <option value="ACTIVE">Đang học</option>
          <option value="COMPLETED">Hoàn thành</option>
          <option value="EXPIRED">Hết hạn</option>
        </select>
        <select value={swimStyle} onChange={(e) => setSwimStyle(e.target.value)} className={inputCls + ' w-auto'}>
          <option value="">Tất cả kiểu bơi</option>
          {Object.entries(STYLE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-ink-100/60 overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        {loading ? <Spinner className="py-20" size={32} /> : list.content.length === 0 ? (
          <EmptyState icon={GraduationCap} title="Chưa có khóa học" description="Tạo khóa học đầu tiên cho hệ thống." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-ink-50/80 text-ink-500 text-left">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Học viên</th>
                    <th className="px-4 py-3 font-semibold">Giáo viên</th>
                    <th className="px-4 py-3 font-semibold">Kiểu bơi</th>
                    <th className="px-4 py-3 font-semibold">Cam kết</th>
                    <th className="px-4 py-3 font-semibold">Hạn</th>
                    <th className="px-4 py-3 font-semibold">Trạng thái</th>
                    <th className="px-4 py-3 font-semibold text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100/60">
                  {list.content.map((e) => (
                    <tr key={e.id} className="hover:bg-pool-50/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-ink-800">{e.studentName}</td>
                      <td className="px-4 py-3 text-ink-600">{(e.teacherNames || []).join(', ') || '—'}</td>
                      <td className="px-4 py-3 text-ink-600">{STYLE[e.swimStyle] || e.swimStyle}</td>
                      <td className="px-4 py-3">{e.isGuaranteed ? <Badge color="amber"><Shield className="w-3 h-3" /> Cam kết</Badge> : <Badge color="gray">Thường</Badge>}</td>
                      <td className="px-4 py-3 text-ink-600">{e.expireDate || '—'}</td>
                      <td className="px-4 py-3"><Badge color={STATUS[e.status]}>{e.status === 'ACTIVE' ? 'Đang học' : e.status === 'COMPLETED' ? 'Hoàn thành' : 'Hết hạn'}</Badge></td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => setDetail(e.id)} className="p-1.5 rounded-lg text-pool-600 hover:bg-pool-50 transition-colors" title="Xem chi tiết">
                            <Eye className="w-4 h-4" />
                          </button>
                          {e.status === 'ACTIVE' && (
                            <button onClick={() => setEditingId(e.id)} className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors" title="Sửa khóa học">
                              <Pencil className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-ink-100/60">
              <p className="text-xs text-ink-400 mb-3">Tổng {list.totalElements} khóa học</p>
              <Pagination page={list.currentPage} totalPages={list.totalPages} onChange={setPage} />
            </div>
          </>
        )}
      </div>

      {detail && <DetailModal id={detail} onClose={() => setDetail(null)} onEdit={(id) => { setDetail(null); setEditingId(id) }} onReload={load} />}
      {editingId && <EditModal id={editingId} onClose={() => setEditingId(null)} onSaved={() => { setEditingId(null); load() }} />}
      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); load() }} />}
    </div>
  )
}

function Info({ label, value }) {
  return (
    <div className="bg-ink-50/60 rounded-lg p-3">
      <p className="text-xs text-ink-400">{label}</p>
      <p className="text-sm font-medium text-ink-800">{value}</p>
    </div>
  )
}

function DetailModal({ id, onClose, onEdit, onReload }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadDetail = () => {
    setLoading(true)
    getEnrollmentDetail(id).then(setData).catch(() => { }).finally(() => setLoading(false))
  }

  useEffect(() => {
    loadDetail()
  }, [id])

  const handleComplete = async () => {
    if (!confirm('Đóng khóa học này? Học viên sẽ không thể điểm danh thêm.')) return
    try {
      await completeEnrollment(id)
      toast.success('Đã đóng khóa học')
      onReload?.()
      onClose()
    } catch (e) { toast.error(errMsg(e)) }
  }

  return (
    <Modal open onClose={onClose} title="Chi tiết khóa học" size="lg">
      {loading ? <Spinner className="py-10" /> : data ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Info label="Học viên" value={data.studentName} />
            <Info label="SĐT" value={data.studentPhone || '—'} />
            <Info label="Ngày sinh" value={data.studentDob || '—'} />
            <Info label="Kiểu bơi" value={STYLE[data.swimStyle] || data.swimStyle} />
            <Info label="Giáo viên" value={(data.teacherNames || []).join(', ') || '—'} />
            <Info label="Cam kết" value={data.isGuaranteed ? 'Có cam kết' : 'Không'} />
            <Info label="Tổng buổi" value={data.totalQuota} />
            <Info label="Đã học" value={data.attendedSessions} />
            <Info label="Bắt đầu" value={data.startDate || '—'} />
            <Info label="Hết hạn" value={data.expireDate || '—'} />
            <Info label="Trạng thái" value={<Badge color={STATUS[data.status]}>{data.status === 'ACTIVE' ? 'Đang học' : data.status === 'COMPLETED' ? 'Hoàn thành' : 'Hết hạn'}</Badge>} />
          </div>

          {data.totalQuota > 0 && (
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-ink-600 font-medium">Tiến độ</span>
                <span className="font-semibold text-ink-800">{data.attendedSessions}/{data.totalQuota}</span>
              </div>
              <div className="h-2.5 bg-ink-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-pool-400 to-pool-600 rounded-full transition-all" style={{ width: `${Math.min(100, (data.attendedSessions / data.totalQuota) * 100)}%` }} />
              </div>
            </div>
          )}

          {data.attendanceHistory?.length > 0 && (
            <div>
              <h4 className="font-semibold text-ink-800 mb-2">Lịch sử điểm danh ({data.attendanceHistory.length} buổi)</h4>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {data.attendanceHistory.map((h) => (
                  <div key={h.attendanceId} className="flex items-center justify-between text-sm bg-ink-50/60 rounded-lg px-3 py-2">
                    <span className="text-ink-700 font-medium">{h.attendDate}</span>
                    <span className="text-ink-500">{h.shiftTime}</span>
                    <span className="text-ink-400 text-xs">{h.checkedInBy || ''}</span>
                    {h.note && <span className="text-ink-400 text-xs">{h.note}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.status === 'ACTIVE' && (
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => onEdit(data.id)} className="flex-1">
                <Pencil className="w-4 h-4" /> Sửa thông tin
              </Button>
              <Button variant="danger" onClick={handleComplete} className="flex-1">
                <CheckCircle className="w-4 h-4" /> Đóng khóa học
              </Button>
            </div>
          )}
        </div>
      ) : <p className="text-ink-500">Không tìm thấy dữ liệu.</p>}
    </Modal>
  )
}

function CreateModal({ onClose, onCreated }) {
  const [studentSearch, setStudentSearch] = useState('')
  const [students, setStudents] = useState([])
  const [studentsLoading, setStudentsLoading] = useState(false)
  const debouncedStudentSearch = useDebounce(studentSearch, 300)

  const [allTeachers, setAllTeachers] = useState([])
  const [teacherSearch, setTeacherSearch] = useState('')
  const [showTeacherDropdown, setShowTeacherDropdown] = useState(false)
  const debouncedTeacherSearch = useDebounce(teacherSearch, 250)

  const [form, setForm] = useState({
    studentId: '',
    teacherIds: [],
    swimStyle: 'FROG',
    isGuaranteed: false,
    totalQuota: '',
    startDate: '',
    expireDate: ''
  })
  const [selectedTeachers, setSelectedTeachers] = useState([])
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [loading, setLoading] = useState(false)

  // Search students
  useEffect(() => {
    setStudentsLoading(true)
    getStudents({ keyword: debouncedStudentSearch, page: 1, size: 50 })
      .then(r => setStudents(r.content || []))
      .catch(() => setStudents([]))
      .finally(() => setStudentsLoading(false))
  }, [debouncedStudentSearch])

  // Search teachers
  useEffect(() => {
    getTeachers({ keyword: debouncedTeacherSearch, page: 1, size: 50 })
      .then(r => setAllTeachers(r.content || []))
      .catch(() => setAllTeachers([]))
  }, [debouncedTeacherSearch])

  const addTeacher = (teacher) => {
    if (!selectedTeachers.find(t => t.id === teacher.id)) {
      setSelectedTeachers(prev => [...prev, teacher])
      setForm(f => ({ ...f, teacherIds: [...f.teacherIds, teacher.id] }))
    }
    setTeacherSearch('')
    setShowTeacherDropdown(false)
  }

  const removeTeacher = (id) => {
    setSelectedTeachers(prev => prev.filter(t => t.id !== id))
    setForm(f => ({ ...f, teacherIds: f.teacherIds.filter(tid => tid !== id) }))
  }

  const filteredTeachers = allTeachers.filter(t => !selectedTeachers.find(st => st.id === t.id))

  const submit = async (e) => {
    e.preventDefault()

    if (!form.studentId) {
      toast.error('Vui lòng chọn học viên')
      return
    }

    if (!form.teacherIds || form.teacherIds.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 giáo viên phụ trách')
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
      const body = {
        studentId: form.studentId,
        teacherIds: form.teacherIds,
        swimStyle: form.swimStyle,
        isGuaranteed: form.isGuaranteed,
        totalQuota: form.totalQuota ? Number(form.totalQuota) : undefined,
        startDate: form.startDate || undefined,
        expireDate: form.expireDate || undefined
      }
      await createEnrollment(body)
      toast.success('Tạo khóa học thành công')
      onCreated()
    } catch (e) {
      toast.error(errMsg(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open onClose={onClose} title="Tạo khóa học mới" size="lg">
      <form onSubmit={submit} className="space-y-4">
        {/* Searchable Student Selection */}
        <Field label="Học viên" required hint="Tìm theo tên hoặc số điện thoại">
          <div className="relative mb-2">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
            <input
              placeholder="Tìm học viên..."
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              className={inputCls + ' pl-10'}
            />
          </div>
          <div className="border border-ink-200 rounded-xl max-h-36 overflow-y-auto divide-y divide-ink-100/60">
            {studentsLoading ? (
              <Spinner className="py-4" size={20} />
            ) : students.length === 0 ? (
              <p className="text-sm text-ink-400 py-3 text-center">Không tìm thấy học viên</p>
            ) : (
              students.map(s => (
                <label key={s.id} className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-pool-50/50 transition-colors ${form.studentId === s.id ? 'bg-pool-50' : ''}`}>
                  <input
                    type="radio"
                    name="selectedStudent"
                    checked={form.studentId === s.id}
                    onChange={() => {
                      setForm(f => ({ ...f, studentId: s.id }))
                      setSelectedStudent(s)
                    }}
                    className="w-4 h-4 text-pool-600"
                  />
                  <div>
                    <p className="text-sm font-medium text-ink-800">{s.fullName}</p>
                    <p className="text-xs text-ink-400">{s.phoneNumber} {s.dob ? `• ${s.dob}` : ''}</p>
                  </div>
                </label>
              ))
            )}
          </div>
          {selectedStudent && (
            <p className="text-xs text-emerald-600 font-medium mt-1">Đã chọn: {selectedStudent.fullName} ({selectedStudent.phoneNumber})</p>
          )}
        </Field>

        {/* Searchable Teacher Combobox */}
        <Field label="Giáo viên phụ trách" required hint="Chọn 1 hoặc nhiều giáo viên">
          {selectedTeachers.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {selectedTeachers.map(t => (
                <span key={t.id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-pool-50 text-pool-700 text-sm font-medium border border-pool-200">
                  {t.fullName}
                  <button type="button" onClick={() => removeTeacher(t.id)} className="p-0.5 rounded hover:bg-pool-100 transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
            <input
              placeholder="Tìm giáo viên theo tên..."
              value={teacherSearch}
              onChange={(e) => { setTeacherSearch(e.target.value); setShowTeacherDropdown(true) }}
              onFocus={() => setShowTeacherDropdown(true)}
              className={inputCls + ' pl-10'}
            />
            {showTeacherDropdown && (
              <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-ink-200 rounded-xl shadow-xl max-h-40 overflow-y-auto">
                {filteredTeachers.length === 0 ? (
                  <p className="text-sm text-ink-400 py-3 text-center">Không tìm thấy</p>
                ) : (
                  filteredTeachers.map(t => (
                    <button
                      type="button"
                      key={t.id}
                      onClick={() => addTeacher(t)}
                      className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-pool-50/50 transition-colors text-left border-b border-ink-100/40 last:border-0"
                    >
                      <div>
                        <p className="text-sm font-medium text-ink-800">{t.fullName}</p>
                        <p className="text-xs text-ink-400">{t.phoneNumber} {t.specialty ? `• ${t.specialty}` : ''}</p>
                      </div>
                      <Badge color={t.status === 'ACTIVE' ? 'green' : 'gray'}>{t.status === 'ACTIVE' ? 'Đang dạy' : t.status}</Badge>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </Field>

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
          <Field label="Tổng buổi" hint="Để trống = dùng mặc định (12)">
            <input type="number" min="1" value={form.totalQuota} onChange={e => setForm({ ...form, totalQuota: e.target.value })} className={inputCls} placeholder="12" />
          </Field>
          <Field label="Ngày bắt đầu">
            <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className={inputCls} />
          </Field>
          <Field label="Ngày hết hạn">
            <input type="date" value={form.expireDate} min={form.startDate || undefined} onChange={e => setForm({ ...form, expireDate: e.target.value })} className={inputCls} />
          </Field>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">Hủy</Button>
          <Button type="submit" disabled={loading} className="flex-1">{loading ? 'Đang tạo...' : 'Tạo khóa học'}</Button>
        </div>
      </form>
    </Modal>
  )
}

function EditModal({ id, onClose, onSaved }) {
  const [detail, setDetail] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(true)

  const [allTeachers, setAllTeachers] = useState([])
  const [teacherSearch, setTeacherSearch] = useState('')
  const [showTeacherDropdown, setShowTeacherDropdown] = useState(false)
  const debouncedTeacherSearch = useDebounce(teacherSearch, 250)

  const [form, setForm] = useState({
    teacherIds: [],
    swimStyle: 'FROG',
    isGuaranteed: false,
    totalQuota: '',
    expireDate: ''
  })
  const [selectedTeachers, setSelectedTeachers] = useState([])
  const [loading, setLoading] = useState(false)

  // Load enrollment detail
  useEffect(() => {
    setLoadingDetail(true)
    getEnrollmentDetail(id)
      .then((d) => {
        setDetail(d)
        setForm({
          teacherIds: [], // TeacherIds to override if changed
          swimStyle: d.swimStyle || 'FROG',
          isGuaranteed: !!d.isGuaranteed,
          totalQuota: d.totalQuota ? String(d.totalQuota) : '',
          expireDate: d.expireDate || ''
        })
      })
      .catch((e) => toast.error(errMsg(e)))
      .finally(() => setLoadingDetail(false))
  }, [id])

  // Search teachers
  useEffect(() => {
    getTeachers({ keyword: debouncedTeacherSearch, page: 1, size: 50 })
      .then(r => setAllTeachers(r.content || []))
      .catch(() => setAllTeachers([]))
  }, [debouncedTeacherSearch])

  const addTeacher = (teacher) => {
    if (!selectedTeachers.find(t => t.id === teacher.id)) {
      setSelectedTeachers(prev => [...prev, teacher])
      setForm(f => ({ ...f, teacherIds: [...f.teacherIds, teacher.id] }))
    }
    setTeacherSearch('')
    setShowTeacherDropdown(false)
  }

  const removeTeacher = (tid) => {
    setSelectedTeachers(prev => prev.filter(t => t.id !== tid))
    setForm(f => ({ ...f, teacherIds: f.teacherIds.filter(id => id !== tid) }))
  }

  const filteredTeachers = allTeachers.filter(t => !selectedTeachers.find(st => st.id === t.id))

  const submit = async (e) => {
    e.preventDefault()

    if (form.totalQuota && Number(form.totalQuota) < 1) {
      toast.error('Tổng số buổi học phải lớn hơn 0')
      return
    }

    if (detail?.startDate && form.expireDate && new Date(detail.startDate) >= new Date(form.expireDate)) {
      toast.error('Ngày hết hạn phải sau ngày bắt đầu')
      return
    }

    setLoading(true)
    try {
      const body = {
        teacherIds: form.teacherIds.length > 0 ? form.teacherIds : undefined,
        swimStyle: form.swimStyle,
        isGuaranteed: form.isGuaranteed,
        totalQuota: form.totalQuota ? Number(form.totalQuota) : undefined,
        expireDate: form.expireDate || undefined
      }
      await updateEnrollment(id, body)
      toast.success('Cập nhật khóa học thành công')
      onSaved()
    } catch (e) {
      toast.error(errMsg(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open onClose={onClose} title="Sửa khóa học" size="lg">
      {loadingDetail ? (
        <Spinner className="py-10" />
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div className="bg-ink-50/60 rounded-xl p-3.5 text-sm">
            <p className="text-xs text-ink-400">Học viên</p>
            <p className="font-semibold text-ink-800 text-base">{detail?.studentName} ({detail?.studentPhone || '—'})</p>
            <p className="text-xs text-ink-500 mt-1">Giáo viên hiện tại: {(detail?.teacherNames || []).join(', ') || 'Chưa có'}</p>
          </div>

          <Field label="Thay đổi giáo viên phụ trách" hint="Để trống nếu muốn giữ nguyên giáo viên cũ">
            {selectedTeachers.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {selectedTeachers.map(t => (
                  <span key={t.id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-pool-50 text-pool-700 text-sm font-medium border border-pool-200">
                    {t.fullName}
                    <button type="button" onClick={() => removeTeacher(t.id)} className="p-0.5 rounded hover:bg-pool-100 transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
              <input
                placeholder="Tìm giáo viên mới..."
                value={teacherSearch}
                onChange={(e) => { setTeacherSearch(e.target.value); setShowTeacherDropdown(true) }}
                onFocus={() => setShowTeacherDropdown(true)}
                className={inputCls + ' pl-10'}
              />
              {showTeacherDropdown && (
                <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-ink-200 rounded-xl shadow-xl max-h-40 overflow-y-auto">
                  {filteredTeachers.length === 0 ? (
                    <p className="text-sm text-ink-400 py-3 text-center">Không tìm thấy</p>
                  ) : (
                    filteredTeachers.map(t => (
                      <button
                        type="button"
                        key={t.id}
                        onClick={() => addTeacher(t)}
                        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-pool-50/50 transition-colors text-left border-b border-ink-100/40 last:border-0"
                      >
                        <div>
                          <p className="text-sm font-medium text-ink-800">{t.fullName}</p>
                          <p className="text-xs text-ink-400">{t.phoneNumber} {t.specialty ? `• ${t.specialty}` : ''}</p>
                        </div>
                        <Badge color={t.status === 'ACTIVE' ? 'green' : 'gray'}>{t.status === 'ACTIVE' ? 'Đang dạy' : t.status}</Badge>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </Field>

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
            <Field label="Tổng buổi">
              <input type="number" min="1" value={form.totalQuota} onChange={e => setForm({ ...form, totalQuota: e.target.value })} className={inputCls} placeholder="12" />
            </Field>
            <Field label="Ngày hết hạn">
              <input type="date" value={form.expireDate} min={detail?.startDate || undefined} onChange={e => setForm({ ...form, expireDate: e.target.value })} className={inputCls} />
            </Field>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Hủy</Button>
            <Button type="submit" disabled={loading} className="flex-1">{loading ? 'Đang lưu...' : 'Lưu thay đổi'}</Button>
          </div>
        </form>
      )}
    </Modal>
  )
}
