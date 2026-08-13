import { useEffect, useState } from 'react'
import { GraduationCap, Plus, Search, Eye, CheckCircle } from 'lucide-react'
import { getEnrollments, getEnrollmentDetail, createEnrollment, completeEnrollment, getStudents, getTeachers } from '../../lib/apiAdmin'
import { Button, Badge, Spinner, EmptyState, Pagination, Modal, Field, inputCls } from '../../components/ui'
import { toast } from '../../components/ui/Toast'
import { errMsg } from '../../lib/api'
import { useDebounce } from '../../lib/useDebounce'

const STATUS = { ACTIVE: 'green', COMPLETED: 'blue', EXPIRED: 'gray' }
const STYLE = { FROG: 'Ếch', FREE: 'Tự do', BACK: 'Ngửa', FLY: 'Bướm' }

export default function AdminEnrollments() {
  const [list, setList] = useState({ content: [], totalElements: 0, totalPages: 0, currentPage: 1, pageSize: 10 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [swimStyle, setSwimStyle] = useState('')
  const [page, setPage] = useState(1)
  const [detail, setDetail] = useState(null)
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
                      <td className="px-4 py-3">{e.isGuaranteed ? <Badge color="amber">Cam kết</Badge> : <Badge color="gray">Thường</Badge>}</td>
                      <td className="px-4 py-3 text-ink-600">{e.expireDate || '—'}</td>
                      <td className="px-4 py-3"><Badge color={STATUS[e.status]}>{e.status === 'ACTIVE' ? 'Đang học' : e.status === 'COMPLETED' ? 'Hoàn thành' : 'Hết hạn'}</Badge></td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => setDetail(e.id)} className="p-1.5 rounded-lg text-pool-600 hover:bg-pool-50 transition-colors"><Eye className="w-4 h-4" /></button>
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

      {detail && <DetailModal id={detail} onClose={() => setDetail(null)} />}
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

function DetailModal({ id, onClose }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getEnrollmentDetail(id).then(setData).catch(() => {}).finally(() => setLoading(false))
  }, [id])

  const handleComplete = async () => {
    try {
      await completeEnrollment(id)
      toast.success('Đã đóng khóa học')
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
            <Info label="Giáo viên" value={(data.teacherNames || []).join(', ')} />
            <Info label="Cam kết" value={data.isGuaranteed ? 'Có' : 'Không'} />
            <Info label="Tổng buổi" value={data.totalQuota} />
            <Info label="Đã học" value={data.attendedSessions} />
            <Info label="Bắt đầu" value={data.startDate || '—'} />
            <Info label="Hết hạn" value={data.expireDate || '—'} />
            <Info label="Trạng thái" value={<Badge color={STATUS[data.status]}>{data.status}</Badge>} />
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
              <h4 className="font-semibold text-ink-800 mb-2">Lịch sử điểm danh</h4>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {data.attendanceHistory.map((h) => (
                  <div key={h.attendanceId} className="flex items-center justify-between text-sm bg-ink-50/60 rounded-lg px-3 py-2">
                    <span className="text-ink-700">{h.attendDate}</span>
                    <span className="text-ink-500">{h.shiftTime}</span>
                    {h.note && <span className="text-ink-400 text-xs">{h.note}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.status === 'ACTIVE' && (
            <Button variant="danger" onClick={handleComplete} className="w-full">
              <CheckCircle className="w-4 h-4" /> Đóng khóa học
            </Button>
          )}
        </div>
      ) : <p className="text-ink-500">Không tìm thấy dữ liệu.</p>}
    </Modal>
  )
}

function CreateModal({ onClose, onCreated }) {
  const [students, setStudents] = useState([])
  const [teachers, setTeachers] = useState([])
  const [form, setForm] = useState({ studentId: '', teacherIds: [], swimStyle: 'FROG', isGuaranteed: false, totalQuota: '', startDate: '', expireDate: '' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getStudents({ page: 1, size: 100 }).then(r => setStudents(r.content)).catch(() => {})
    getTeachers({ page: 1, size: 100 }).then(r => setTeachers(r.content)).catch(() => {})
  }, [])

  const submit = async (e) => {
    e.preventDefault()
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
    } catch (e) { toast.error(errMsg(e)) } finally { setLoading(false) }
  }

  const toggleTeacher = (id) => {
    setForm(f => ({
      ...f,
      teacherIds: f.teacherIds.includes(id) ? f.teacherIds.filter(t => t !== id) : [...f.teacherIds, id]
    }))
  }

  return (
    <Modal open onClose={onClose} title="Tạo khóa học mới" size="lg">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Học viên" required>
          <select value={form.studentId} onChange={e => setForm({ ...form, studentId: e.target.value })} className={inputCls} required>
            <option value="">Chọn học viên...</option>
            {students.map(s => <option key={s.id} value={s.id}>{s.fullName} ({s.phoneNumber})</option>)}
          </select>
        </Field>

        <Field label="Giáo viên phụ trách" required hint="Chọn 1 hoặc nhiều giáo viên">
          <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border border-ink-200 rounded-xl">
            {teachers.map(t => (
              <label key={t.id} className="flex items-center gap-2 cursor-pointer text-sm">
                <input type="checkbox" checked={form.teacherIds.includes(t.id)} onChange={() => toggleTeacher(t.id)} className="w-4 h-4 rounded text-pool-600" />
                <span className="text-ink-700">{t.fullName}</span>
              </label>
            ))}
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
            <input type="date" value={form.expireDate} onChange={e => setForm({ ...form, expireDate: e.target.value })} className={inputCls} />
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
