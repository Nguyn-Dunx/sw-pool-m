import { useEffect, useState } from 'react'
import { Users, Search, Eye, Calendar, CheckCircle, ChevronDown, ChevronUp, Shield } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getMyStudents, getMyStudentDetail, getStudentHistory, checkInStudent, getShifts, completeMyEnrollment } from '../../lib/apiTeacher'
import { Badge, Button, Spinner, EmptyState, Pagination, Modal, Field, inputCls } from '../../components/ui'
import { toast } from '../../components/ui/Toast'
import { errMsg } from '../../lib/api'
import { useDebounce } from '../../lib/useDebounce'

const STATUS = { ACTIVE: 'green', COMPLETED: 'blue', EXPIRED: 'gray' }
const STYLE = { FROG: 'Ếch', FREE: 'Tự do', BACK: 'Ngửa', FLY: 'Bướm' }

export default function TeacherStudents() {
  const [list, setList] = useState({ content: [], totalElements: 0, totalPages: 0, currentPage: 1, pageSize: 10 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [detailId, setDetailId] = useState(null) // enrollment ID for detail modal

  const debouncedSearch = useDebounce(search, 350)

  const load = () => {
    setLoading(true)
    getMyStudents({ studentName: debouncedSearch, status, page, size: 10 })
      .then(setList)
      .catch((e) => toast.error(errMsg(e)))
      .finally(() => setLoading(false))
  }

  useEffect(() => { setPage(1) }, [debouncedSearch, status])
  useEffect(() => { load() }, [debouncedSearch, status, page])

  return (
    <div className="space-y-4">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-ink-900 tracking-tight">Học viên của tôi</h1>
        <p className="text-sm text-ink-500 mt-1">Danh sách học viên đang phụ trách</p>
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
      </div>

      <div className="bg-white rounded-2xl border border-ink-100/60 overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        {loading ? <Spinner className="py-20" size={32} /> : list.content.length === 0 ? (
          <EmptyState icon={Users} title="Chưa có học viên" description="Bạn chưa phụ trách học viên nào." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-ink-50/80 text-ink-500 text-left">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Học viên</th>
                    <th className="px-4 py-3 font-semibold hidden sm:table-cell">Kiểu bơi</th>
                    <th className="px-4 py-3 font-semibold">Cam kết</th>
                    <th className="px-4 py-3 font-semibold">Tiến độ</th>
                    <th className="px-4 py-3 font-semibold hidden md:table-cell">Còn lại</th>
                    <th className="px-4 py-3 font-semibold">Trạng thái</th>
                    <th className="px-4 py-3 font-semibold text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100/60">
                  {list.content.map((s) => (
                    <tr key={s.enrollmentId} className="hover:bg-pool-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-ink-800">{s.studentName}</p>
                        <p className="text-xs text-ink-400">{s.studentPhone || ''}</p>
                      </td>
                      <td className="px-4 py-3 text-ink-600 hidden sm:table-cell">{STYLE[s.swimStyle] || s.swimStyle}</td>
                      <td className="px-4 py-3">
                        {s.isGuaranteed ? (
                          <Badge color="amber">
                            <Shield className="w-3 h-3" /> Cam kết
                          </Badge>
                        ) : (
                          <Badge color="gray">Thường</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-ink-100 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-pool-400 to-pool-600 rounded-full transition-all" style={{ width: `${s.progressPercentage || 0}%` }} />
                          </div>
                          <span className="text-xs text-ink-500 font-medium">{s.attendedSessions}/{s.totalQuota}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {s.daysRemaining != null && (
                          <span className={`font-medium text-sm ${s.daysRemaining < 5 ? 'text-rose-600' : 'text-ink-600'}`}>
                            {s.daysRemaining} ngày
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3"><Badge color={STATUS[s.status]}>{s.status === 'ACTIVE' ? 'Đang học' : s.status === 'COMPLETED' ? 'Hoàn thành' : 'Hết hạn'}</Badge></td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => setDetailId(s.enrollmentId)} className="p-1.5 rounded-lg text-pool-600 hover:bg-pool-50 transition-colors" title="Xem chi tiết">
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-ink-100/60">
              <p className="text-xs text-ink-400 mb-3">Tổng {list.totalElements} học viên</p>
              <Pagination page={list.currentPage} totalPages={list.totalPages} onChange={setPage} />
            </div>
          </>
        )}
      </div>

      {detailId && <StudentDetailModal enrollmentId={detailId} onClose={() => setDetailId(null)} onReload={load} />}
    </div>
  )
}

// ===== Detail Modal =====
function StudentDetailModal({ enrollmentId, onClose, onReload }) {
  const [data, setData] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [showHistory, setShowHistory] = useState(false)
  const [showCheckIn, setShowCheckIn] = useState(false)

  const load = () => {
    setLoading(true)
    Promise.all([getMyStudentDetail(enrollmentId), getStudentHistory(enrollmentId)])
      .then(([d, h]) => { setData(d); setHistory(h || []) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [enrollmentId])

  const handleComplete = async () => {
    if (!confirm('Đóng khóa học này? Học viên sẽ không thể điểm danh thêm.')) return
    try {
      await completeMyEnrollment(enrollmentId)
      toast.success('Đã đóng khóa học')
      onReload()
      onClose()
    } catch (e) { toast.error(errMsg(e)) }
  }

  return (
    <Modal open onClose={onClose} title="Chi tiết học viên" size="lg">
      {loading ? <Spinner className="py-12" size={32} /> : !data ? (
        <p className="text-ink-500 text-center py-8">Không tìm thấy dữ liệu.</p>
      ) : (
        <div className="space-y-5">
          {/* Student header */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-bold text-ink-900">{data.studentName}</h3>
              <p className="text-sm text-ink-500 mt-0.5">{data.studentPhone || '—'} • {STYLE[data.swimStyle] || data.swimStyle}</p>
            </div>
            <div className="flex items-center gap-2">
              {data.isGuaranteed && <Badge color="amber"><Shield className="w-3 h-3" /> Cam kết</Badge>}
              <Badge color={STATUS[data.status]}>{data.status === 'ACTIVE' ? 'Đang học' : data.status === 'COMPLETED' ? 'Hoàn thành' : 'Hết hạn'}</Badge>
            </div>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <InfoCard label="Ngày sinh" value={data.studentDob || '—'} />
            <InfoCard label="Bắt đầu" value={data.startDate || '—'} />
            <InfoCard label="Hết hạn" value={data.expireDate || '—'} />
            <InfoCard label="Giáo viên" value={(data.teacherNames || []).join(', ') || '—'} />
          </div>

          {/* Progress */}
          <div>
            <div className="flex justify-between text-sm mb-1.5">
              <span className="text-ink-600 font-medium">Tiến độ học</span>
              <span className="font-semibold text-ink-800">{data.attendedSessions}/{data.totalQuota} buổi</span>
            </div>
            <div className="h-2.5 bg-ink-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-pool-400 to-pool-600 rounded-full transition-all" style={{ width: `${Math.min(100, ((data.attendedSessions || 0) / (data.totalQuota || 1)) * 100)}%` }} />
            </div>
          </div>

          {/* Actions */}
          {data.status === 'ACTIVE' && (
            <div className="flex gap-3">
              <Button onClick={() => setShowCheckIn(true)} className="flex-1"><Calendar className="w-4 h-4" /> Điểm danh</Button>
              <Button variant="danger" onClick={handleComplete}><CheckCircle className="w-4 h-4" /> Đóng khóa</Button>
            </div>
          )}

          {/* Attendance History (expandable) */}
          <div className="border border-ink-100/60 rounded-xl overflow-hidden">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-ink-800 hover:bg-ink-50/50 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-pool-500" />
                Lịch sử điểm danh ({history.length} buổi)
              </span>
              {showHistory ? <ChevronUp className="w-4 h-4 text-ink-400" /> : <ChevronDown className="w-4 h-4 text-ink-400" />}
            </button>
            {showHistory && (
              <div className="border-t border-ink-100/60 max-h-60 overflow-y-auto">
                {history.length === 0 ? (
                  <p className="text-sm text-ink-400 py-6 text-center">Chưa có buổi học nào</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-ink-50/60 text-ink-500 text-left sticky top-0">
                      <tr>
                        <th className="px-4 py-2 font-medium">#</th>
                        <th className="px-4 py-2 font-medium">Ngày</th>
                        <th className="px-4 py-2 font-medium">Ca học</th>
                        <th className="px-4 py-2 font-medium hidden sm:table-cell">Người điểm danh</th>
                        <th className="px-4 py-2 font-medium hidden sm:table-cell">Ghi chú</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink-100/40">
                      {history.map((h, i) => (
                        <tr key={h.attendanceId} className="hover:bg-pool-50/30 transition-colors">
                          <td className="px-4 py-2 text-ink-400">{i + 1}</td>
                          <td className="px-4 py-2 font-medium text-ink-700">{h.attendDate}</td>
                          <td className="px-4 py-2 text-ink-600">{h.shiftTime}</td>
                          <td className="px-4 py-2 text-ink-500 hidden sm:table-cell">{h.checkedInBy || '—'}</td>
                          <td className="px-4 py-2 text-ink-400 hidden sm:table-cell max-w-[150px] truncate">{h.note || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {showCheckIn && <CheckInModal enrollmentId={enrollmentId} onClose={() => setShowCheckIn(false)} onDone={() => { setShowCheckIn(false); load() }} />}
    </Modal>
  )
}

function InfoCard({ label, value }) {
  return (
    <div className="bg-ink-50/60 rounded-xl p-3">
      <p className="text-xs text-ink-400">{label}</p>
      <p className="text-sm font-semibold text-ink-800">{value}</p>
    </div>
  )
}

function CheckInModal({ enrollmentId, onClose, onDone }) {
  const [form, setForm] = useState({ shiftId: '', attendDate: new Date().toISOString().slice(0, 10), note: '' })
  const [shifts, setShifts] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getShifts().then(setShifts).catch(() => {})
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    if (!form.shiftId) {
      toast.error('Vui lòng chọn ca học')
      return
    }
    setLoading(true)
    try {
      await checkInStudent({
        enrollmentId,
        shiftId: Number(form.shiftId),
        attendDate: form.attendDate,
        note: form.note || undefined
      })
      toast.success('Điểm danh thành công')
      onDone()
    } catch (e) { toast.error(errMsg(e)) } finally { setLoading(false) }
  }

  return (
    <Modal open onClose={onClose} title="Điểm danh học viên">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Ca học" required>
          <select value={form.shiftId} onChange={e => setForm({ ...form, shiftId: e.target.value })} className={inputCls} required>
            <option value="">Chọn ca học...</option>
            {shifts.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Ngày học" required>
          <input type="date" value={form.attendDate} max={new Date().toISOString().slice(0, 10)} onChange={e => setForm({ ...form, attendDate: e.target.value })} className={inputCls} required />
        </Field>
        <Field label="Ghi chú" hint="Tùy chọn">
          <textarea value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} className={inputCls} rows={2} placeholder="Ghi chú về buổi học..." />
        </Field>
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">Hủy</Button>
          <Button type="submit" disabled={loading} className="flex-1">{loading ? 'Đang lưu...' : 'Xác nhận'}</Button>
        </div>
      </form>
    </Modal>
  )
}
