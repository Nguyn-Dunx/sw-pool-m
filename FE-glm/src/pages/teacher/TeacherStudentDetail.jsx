import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle, Calendar, Phone, User } from 'lucide-react'
import { getMyStudentDetail, getStudentHistory, completeMyEnrollment, checkInStudent, getShifts } from '../../lib/apiTeacher'
import { Button, Badge, Spinner, Modal, Field, inputCls } from '../../components/ui'
import { toast } from '../../components/ui/Toast'
import { errMsg } from '../../lib/api'

const STATUS = { ACTIVE: 'green', COMPLETED: 'blue', EXPIRED: 'gray' }
const STYLE = { FROG: 'Ếch', FREE: 'Tự do', BACK: 'Ngửa', FLY: 'Bướm' }

export default function TeacherStudentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCheckIn, setShowCheckIn] = useState(false)

  const load = () => {
    setLoading(true)
    Promise.all([getMyStudentDetail(id), getStudentHistory(id)])
      .then(([d, h]) => { setData(d); setHistory(h || []) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [id])

  const handleComplete = async () => {
    if (!confirm('Đóng khóa học này? Học viên sẽ không thể điểm danh thêm.')) return
    try {
      await completeMyEnrollment(id)
      toast.success('Đã đóng khóa học')
      load()
    } catch (e) { toast.error(errMsg(e)) }
  }

  if (loading) return <Spinner className="py-20" size={32} />
  if (!data) return <p className="text-ink-500 text-center py-16">Không tìm thấy học viên.</p>

  return (
    <div className="space-y-4">
      <button onClick={() => navigate('/teacher/students')} className="flex items-center gap-2 text-sm text-ink-500 hover:text-ink-700 transition-colors font-medium animate-fade-in">
        <ArrowLeft className="w-4 h-4" /> Quay lại
      </button>

      {/* Student info card */}
      <div className="bg-white rounded-2xl border border-ink-100/60 p-5 animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pool-400 to-pool-600 flex items-center justify-center shadow-md shadow-pool-200">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-ink-900">{data.studentName}</h1>
              <div className="flex items-center gap-3 text-sm text-ink-500 mt-1">
                <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {data.studentPhone || '—'}</span>
                <span>•</span>
                <span>{STYLE[data.swimStyle] || data.swimStyle}</span>
                {data.isGuaranteed && <Badge color="amber">Cam kết</Badge>}
              </div>
            </div>
          </div>
          <Badge color={STATUS[data.status]}>{data.status === 'ACTIVE' ? 'Đang học' : data.status === 'COMPLETED' ? 'Hoàn thành' : 'Hết hạn'}</Badge>
        </div>

        {/* Progress */}
        <div className="mt-5">
          <div className="flex justify-between text-sm mb-1.5">
            <span className="text-ink-600 font-medium">Tiến độ học</span>
            <span className="font-semibold text-ink-800">{data.attendedSessions}/{data.totalQuota} buổi</span>
          </div>
          <div className="h-2.5 bg-ink-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-pool-400 to-pool-600 rounded-full transition-all" style={{ width: `${Math.min(100, ((data.attendedSessions || 0) / (data.totalQuota || 1)) * 100)}%` }} />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          <Info label="Bắt đầu" value={data.startDate || '—'} />
          <Info label="Hết hạn" value={data.expireDate || '—'} />
          <Info label="Tổng buổi" value={data.totalQuota} />
          <Info label="Đã học" value={data.attendedSessions} />
        </div>

        {data.status === 'ACTIVE' && (
          <div className="flex gap-3 mt-5">
            <Button onClick={() => setShowCheckIn(true)} className="flex-1"><Calendar className="w-4 h-4" /> Điểm danh</Button>
            <Button variant="danger" onClick={handleComplete}><CheckCircle className="w-4 h-4" /> Đóng khóa học</Button>
          </div>
        )}
      </div>

      {/* History */}
      <div className="bg-white rounded-2xl border border-ink-100/60 p-5 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <h2 className="font-semibold text-ink-900 mb-3">Lịch sử điểm danh</h2>
        {history.length === 0 ? (
          <p className="text-sm text-ink-400 py-8 text-center">Chưa có buổi học nào</p>
        ) : (
          <div className="space-y-2">
            {history.map((h) => (
              <div key={h.attendanceId} className="flex items-center justify-between text-sm bg-ink-50/60 rounded-xl px-4 py-3 hover:bg-ink-100/60 transition-colors">
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-pool-500" />
                  <span className="text-ink-700 font-medium">{h.attendDate}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-ink-500">{h.shiftTime}</span>
                  <span className="text-ink-400 text-xs">{h.checkedInBy}</span>
                </div>
                {h.note && <span className="text-ink-400 text-xs hidden sm:block">{h.note}</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      {showCheckIn && <CheckInModal enrollmentId={id} onClose={() => setShowCheckIn(false)} onDone={() => { setShowCheckIn(false); load() }} />}
    </div>
  )
}

function Info({ label, value }) {
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
