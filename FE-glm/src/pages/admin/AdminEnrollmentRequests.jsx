import { useEffect, useState } from 'react'
import { ClipboardCheck, CheckCircle, XCircle } from 'lucide-react'
import { getEnrollmentRequests, reviewEnrollmentRequest, getTeachers } from '../../lib/apiAdmin'
import { Button, Badge, Spinner, EmptyState, Pagination, Modal, Field, inputCls } from '../../components/ui'
import { toast } from '../../components/ui/Toast'
import { errMsg } from '../../lib/api'

const STYLE = { FROG: 'Ếch', FREE: 'Tự do', BACK: 'Ngửa', FLY: 'Bướm' }
const STATUS_COLOR = { PENDING: 'amber', APPROVED: 'green', REJECTED: 'red' }
const STATUS_LABEL = { PENDING: 'Chờ duyệt', APPROVED: 'Đã duyệt', REJECTED: 'Từ chối' }
const TYPE_LABEL = { CREATE: 'Tạo mới', UPDATE: 'Cập nhật' }

export default function AdminEnrollmentRequests() {
  const [list, setList] = useState({ content: [], totalElements: 0, totalPages: 0, currentPage: 1, pageSize: 10 })
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [review, setReview] = useState(null)

  const load = () => {
    setLoading(true)
    getEnrollmentRequests({ status, page, size: 10 })
      .then(setList)
      .catch((e) => toast.error(errMsg(e)))
      .finally(() => setLoading(false))
  }

  useEffect(() => { setPage(1) }, [status])
  useEffect(() => { load() }, [status, page])

  return (
    <div className="space-y-4">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-ink-900 tracking-tight">Yêu cầu đăng ký</h1>
        <p className="text-sm text-ink-500 mt-1">Duyệt yêu cầu tạo/cập nhật khóa học từ giáo viên</p>
      </div>

      <div className="bg-white rounded-2xl border border-ink-100/60 p-4 animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className={inputCls + ' w-auto'}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="PENDING">Chờ duyệt</option>
          <option value="APPROVED">Đã duyệt</option>
          <option value="REJECTED">Từ chối</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-ink-100/60 overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        {loading ? <Spinner className="py-20" size={32} /> : list.content.length === 0 ? (
          <EmptyState icon={ClipboardCheck} title="Không có yêu cầu" description="Chưa có yêu cầu đăng ký nào cần duyệt." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-ink-50/80 text-ink-500 text-left">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Học viên</th>
                    <th className="px-4 py-3 font-semibold">GV đề xuất</th>
                    <th className="px-4 py-3 font-semibold">Kiểu bơi</th>
                    <th className="px-4 py-3 font-semibold">Cam kết</th>
                    <th className="px-4 py-3 font-semibold">Loại</th>
                    <th className="px-4 py-3 font-semibold">Trạng thái</th>
                    <th className="px-4 py-3 font-semibold">Ngày tạo</th>
                    <th className="px-4 py-3 font-semibold text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100/60">
                  {list.content.map((r) => (
                    <tr key={r.id} className="hover:bg-pool-50/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-ink-800">{r.studentName}</td>
                      <td className="px-4 py-3 text-ink-600">{(r.teacherNames || []).join(', ') || '—'}</td>
                      <td className="px-4 py-3 text-ink-600">{STYLE[r.swimStyle] || r.swimStyle}</td>
                      <td className="px-4 py-3">{r.guaranteed ? <Badge color="amber">Cam kết</Badge> : <Badge color="gray">Thường</Badge>}</td>
                      <td className="px-4 py-3"><Badge color={r.requestType === 'CREATE' ? 'blue' : 'purple'}>{TYPE_LABEL[r.requestType] || r.requestType}</Badge></td>
                      <td className="px-4 py-3"><Badge color={STATUS_COLOR[r.status]}>{STATUS_LABEL[r.status]}</Badge></td>
                      <td className="px-4 py-3 text-ink-500">{r.createdAt || '—'}</td>
                      <td className="px-4 py-3 text-right">
                        {r.status === 'PENDING' && (
                          <Button size="sm" onClick={() => setReview(r)}>Duyệt</Button>
                        )}
                      </td>
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

      {review && <ReviewModal request={review} onClose={() => setReview(null)} onDone={() => { setReview(null); load() }} />}
    </div>
  )
}

function ReviewModal({ request, onClose, onDone }) {
  const [teachers, setTeachers] = useState([])
  const [form, setForm] = useState({
    status: 'APPROVED',
    adminNote: '',
    totalQuota: '',
    startDate: '',
    expireDate: '',
    teacherIds: []
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getTeachers({ page: 1, size: 100 }).then((r) => setTeachers(r.content)).catch(() => {})
  }, [])

  const toggleTeacher = (id) => {
    setForm((f) => ({
      ...f,
      teacherIds: f.teacherIds.includes(id) ? f.teacherIds.filter((t) => t !== id) : [...f.teacherIds, id]
    }))
  }

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const body = {
        status: form.status,
        adminNote: form.adminNote || undefined,
        totalQuota: form.totalQuota ? Number(form.totalQuota) : undefined,
        startDate: form.startDate || undefined,
        expireDate: form.expireDate || undefined,
        teacherIds: form.status === 'APPROVED' ? form.teacherIds : undefined
      }
      await reviewEnrollmentRequest(request.id, body)
      toast.success(form.status === 'APPROVED' ? 'Đã duyệt yêu cầu' : 'Đã từ chối yêu cầu')
      onDone()
    } catch (e) { toast.error(errMsg(e)) } finally { setLoading(false) }
  }

  return (
    <Modal open onClose={onClose} title={`Duyệt yêu cầu — ${request.studentName}`} size="lg">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-ink-50/60 rounded-lg p-3">
            <p className="text-xs text-ink-400">Kiểu bơi</p>
            <p className="font-medium text-ink-800">{STYLE[request.swimStyle] || request.swimStyle}</p>
          </div>
          <div className="bg-ink-50/60 rounded-lg p-3">
            <p className="text-xs text-ink-400">Cam kết</p>
            <p className="font-medium text-ink-800">{request.guaranteed ? 'Có' : 'Không'}</p>
          </div>
          <div className="bg-ink-50/60 rounded-lg p-3">
            <p className="text-xs text-ink-400">GV đề xuất</p>
            <p className="font-medium text-ink-800">{(request.teacherNames || []).join(', ') || '—'}</p>
          </div>
          <div className="bg-ink-50/60 rounded-lg p-3">
            <p className="text-xs text-ink-400">Loại yêu cầu</p>
            <p className="font-medium text-ink-800">{TYPE_LABEL[request.requestType] || request.requestType}</p>
          </div>
        </div>

        <Field label="Quyết định" required>
          <div className="flex gap-2">
            <button type="button" onClick={() => setForm({ ...form, status: 'APPROVED' })} className={`flex-1 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all ${form.status === 'APPROVED' ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-sm' : 'border-ink-200 text-ink-600 hover:bg-ink-50'}`}>
              <CheckCircle className="w-4 h-4 inline mr-1.5" /> Duyệt
            </button>
            <button type="button" onClick={() => setForm({ ...form, status: 'REJECTED' })} className={`flex-1 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all ${form.status === 'REJECTED' ? 'bg-rose-50 border-rose-300 text-rose-700 shadow-sm' : 'border-ink-200 text-ink-600 hover:bg-ink-50'}`}>
              <XCircle className="w-4 h-4 inline mr-1.5" /> Từ chối
            </button>
          </div>
        </Field>

        <Field label="Ghi chú admin">
          <textarea value={form.adminNote} onChange={(e) => setForm({ ...form, adminNote: e.target.value })} className={inputCls} rows={2} placeholder="Ghi chú cho giáo viên..." />
        </Field>

        {form.status === 'APPROVED' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Tổng buổi" hint="Để trống = mặc định">
                <input type="number" min="1" value={form.totalQuota} onChange={(e) => setForm({ ...form, totalQuota: e.target.value })} className={inputCls} placeholder="12" />
              </Field>
              <Field label="Ngày bắt đầu">
                <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Ngày hết hạn">
                <input type="date" value={form.expireDate} onChange={(e) => setForm({ ...form, expireDate: e.target.value })} className={inputCls} />
              </Field>
            </div>

            <Field label="Chọn giáo viên phụ trách" hint="Có thể override danh sách giáo viên đề xuất">
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border border-ink-200 rounded-xl">
                {teachers.map((t) => (
                  <label key={t.id} className="flex items-center gap-2 cursor-pointer text-sm">
                    <input type="checkbox" checked={form.teacherIds.includes(t.id)} onChange={() => toggleTeacher(t.id)} className="w-4 h-4 rounded text-pool-600" />
                    <span className="text-ink-700">{t.fullName}</span>
                  </label>
                ))}
              </div>
            </Field>
          </>
        )}

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">Hủy</Button>
          <Button type="submit" disabled={loading} className="flex-1">{loading ? 'Đang xử lý...' : 'Xác nhận'}</Button>
        </div>
      </form>
    </Modal>
  )
}
