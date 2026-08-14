import { useEffect, useState } from 'react'
import { ClipboardCheck, CheckCircle, XCircle, Eye, Search, Shield, X, User } from 'lucide-react'
import { getEnrollmentRequests, reviewEnrollmentRequest, getTeachers, getEnrollmentDetail } from '../../lib/apiAdmin'
import { Button, Badge, Spinner, EmptyState, Pagination, Modal, Field, inputCls } from '../../components/ui'
import { toast } from '../../components/ui/Toast'
import { errMsg } from '../../lib/api'
import { useDebounce } from '../../lib/useDebounce'
import { getTodayDate, addDays, formatDisplayDate, formatISODate } from '../../lib/dateUtils'
import { useSystemSettings } from '../../lib/settings'

const STYLE = { FROG: 'Ếch', FREE: 'Sải', BACK: 'Ngửa', FLY: 'Bướm' }
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
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls + ' w-auto'}>
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
                    <th className="px-4 py-3 font-semibold hidden sm:table-cell">Kiểu bơi</th>
                    <th className="px-4 py-3 font-semibold hidden md:table-cell">Cam kết</th>
                    <th className="px-4 py-3 font-semibold hidden md:table-cell">Loại</th>
                    <th className="px-4 py-3 font-semibold">Trạng thái</th>
                    <th className="px-4 py-3 font-semibold hidden sm:table-cell">Ngày tạo</th>
                    <th className="px-4 py-3 font-semibold text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100/60">
                  {list.content.map((r) => (
                    <tr key={r.id} className="hover:bg-pool-50/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-ink-800">{r.studentName}</td>
                      <td className="px-4 py-3 text-ink-600">{r.teacherName || '—'}</td>
                      <td className="px-4 py-3 text-ink-600 hidden sm:table-cell">{STYLE[r.swimStyle] || r.swimStyle}</td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {r.isGuaranteed ? (
                          <Badge color="amber"><Shield className="w-3 h-3" /> Cam kết</Badge>
                        ) : (
                          <Badge color="gray">Thường</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell"><Badge color={r.requestType === 'CREATE' ? 'blue' : 'purple'}>{TYPE_LABEL[r.requestType] || r.requestType}</Badge></td>
                      <td className="px-4 py-3"><Badge color={STATUS_COLOR[r.status]}>{STATUS_LABEL[r.status]}</Badge></td>
                      <td className="px-4 py-3 text-ink-500 hidden sm:table-cell">{r.createdAt ? new Date(r.createdAt).toLocaleDateString('vi-VN') : '—'}</td>
                      <td className="px-4 py-3 text-right">
                        <Button size="sm" variant={r.status === 'PENDING' ? 'primary' : 'outline'} onClick={() => setReview(r)}>
                          {r.status === 'PENDING' ? 'Duyệt' : <Eye className="w-4 h-4" />}
                        </Button>
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

// ===== REVIEW MODAL =====
function ReviewModal({ request, onClose, onDone }) {
  const isPending = request.status === 'PENDING'
  const { durationDays, defaultQuota } = useSystemSettings()

  const defaultStart = request.startDate || (request.createdAt ? formatISODate(request.createdAt) : getTodayDate())
  const defaultExpire = request.expireDate || addDays(defaultStart, durationDays)
  const defaultQuotaStr = request.totalQuota ? String(request.totalQuota) : String(defaultQuota || 12)

  const [allTeachers, setAllTeachers] = useState([])
  const [teacherSearch, setTeacherSearch] = useState('')
  const [showTeacherDropdown, setShowTeacherDropdown] = useState(false)
  const debouncedTeacherSearch = useDebounce(teacherSearch, 250)

  const [form, setForm] = useState({
    status: 'APPROVED',
    adminNote: request.adminNote || '',
    totalQuota: defaultQuotaStr,
    startDate: defaultStart,
    expireDate: defaultExpire,
    teacherIds: []
  })
  const [selectedTeachers, setSelectedTeachers] = useState([]) // [{id, fullName}]
  const [loading, setLoading] = useState(false)

  // Load all teachers for combobox
  useEffect(() => {
    getTeachers({ keyword: debouncedTeacherSearch, page: 1, size: 50 })
      .then((r) => setAllTeachers(r.content || []))
      .catch(() => setAllTeachers([]))
  }, [debouncedTeacherSearch])

  // Initialize teacher tags
  useEffect(() => {
    if (request.requestType === 'CREATE') {
      // For CREATE: pre-tag proposing teacher
      if (allTeachers.length > 0) {
        const proposing = allTeachers.find(
          t => (request.teacherId && t.id === request.teacherId) || (request.teacherName && t.fullName === request.teacherName)
        )
        if (proposing) {
          setSelectedTeachers([proposing])
          setForm(f => ({ ...f, teacherIds: [proposing.id] }))
        } else if (request.teacherId || request.teacherName) {
          const fallbackTeacher = { id: request.teacherId || 'proposing-teacher', fullName: request.teacherName || 'Giáo viên đề xuất' }
          setSelectedTeachers([fallbackTeacher])
          if (request.teacherId) setForm(f => ({ ...f, teacherIds: [request.teacherId] }))
        }
      }
    } else if (request.requestType === 'UPDATE' && request.targetEnrollmentId) {
      // For UPDATE: load target enrollment's current teachers
      getEnrollmentDetail(request.targetEnrollmentId)
        .then((detail) => {
          let currentTeachers = (detail.teacherIds || []).map((tid, idx) => ({
            id: tid,
            fullName: detail.teacherNames?.[idx] || ''
          }))

          if (currentTeachers.length === 0 && detail.teacherNames?.length > 0 && allTeachers.length > 0) {
            currentTeachers = allTeachers.filter(at => detail.teacherNames.includes(at.fullName))
          }

          if (currentTeachers.length > 0) {
            setSelectedTeachers(currentTeachers)
            setForm(f => ({ ...f, teacherIds: currentTeachers.map(t => t.id).filter(Boolean) }))
          }
        })
        .catch(() => {})
    }
  }, [request, allTeachers])

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

  // Filter out already-selected teachers
  const filteredTeachers = allTeachers.filter(t => !selectedTeachers.find(st => st.id === t.id))

  const submit = async (e) => {
    e.preventDefault()
    if (form.status === 'APPROVED') {
      if (form.teacherIds.length === 0 && request.requestType === 'CREATE') {
        toast.error('Vui lòng chọn ít nhất một giáo viên phụ trách')
        return
      }
      if (form.startDate && form.expireDate && new Date(form.startDate) >= new Date(form.expireDate)) {
        toast.error('Ngày hết hạn phải sau ngày bắt đầu')
        return
      }
      if (form.totalQuota && Number(form.totalQuota) < 1) {
        toast.error('Tổng buổi phải lớn hơn 0')
        return
      }
    }
    setLoading(true)
    try {
      const body = {
        status: form.status,
        adminNote: form.adminNote || undefined,
        totalQuota: form.totalQuota ? Number(form.totalQuota) : undefined,
        startDate: form.startDate || undefined,
        expireDate: form.expireDate || undefined,
        teacherIds: form.status === 'APPROVED' && form.teacherIds.length > 0 ? form.teacherIds : undefined
      }
      await reviewEnrollmentRequest(request.id, body)
      toast.success(form.status === 'APPROVED' ? 'Đã duyệt yêu cầu' : 'Đã từ chối yêu cầu')
      onDone()
    } catch (e) { toast.error(errMsg(e)) } finally { setLoading(false) }
  }

  return (
    <Modal open onClose={onClose} title={isPending ? `Duyệt yêu cầu` : `Chi tiết yêu cầu`} size="lg">
      <div className="space-y-5">
        {/* Request info header */}
        <div className="bg-ink-50/60 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-ink-900 text-lg">{request.studentName}</h3>
            <div className="flex items-center gap-2">
              <Badge color={request.requestType === 'CREATE' ? 'blue' : 'purple'}>{TYPE_LABEL[request.requestType]}</Badge>
              <Badge color={STATUS_COLOR[request.status]}>{STATUS_LABEL[request.status]}</Badge>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            <InfoItem label="GV đề xuất" value={request.teacherName || '—'} />
            <InfoItem label="Kiểu bơi" value={STYLE[request.swimStyle] || request.swimStyle || '—'} />
            <InfoItem label="Cam kết" value={request.isGuaranteed ? 'Có cam kết' : 'Không'} />
            <InfoItem label="Tổng buổi" value={`${defaultQuota} buổi ${request.totalQuota ? '' : '(mặc định)'}`} />
            <InfoItem label="Ngày bắt đầu" value={`${formatDisplayDate(defaultStart)} ${request.startDate ? '' : '(mặc định)'}`} />
            <InfoItem label="Ngày hết hạn" value={`${formatDisplayDate(defaultExpire)} ${request.expireDate ? '' : '(mặc định)'}`} />
          </div>
          {request.note && (
            <div className="pt-1">
              <p className="text-xs text-ink-400">Ghi chú GV</p>
              <p className="text-sm text-ink-700 bg-white/80 rounded-lg px-3 py-2 mt-1">{request.note}</p>
            </div>
          )}
          {request.adminNote && !isPending && (
            <div className="pt-1">
              <p className="text-xs text-ink-400">Ghi chú Admin</p>
              <p className="text-sm text-ink-700 bg-white/80 rounded-lg px-3 py-2 mt-1">{request.adminNote}</p>
            </div>
          )}
        </div>

        {/* Only show review form for PENDING requests */}
        {isPending ? (
          <form onSubmit={submit} className="space-y-4">
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

            <Field label="Ghi chú admin" hint="Ghi chú sẽ hiển thị cho giáo viên">
              <textarea value={form.adminNote} onChange={(e) => setForm({ ...form, adminNote: e.target.value })} className={inputCls} rows={2} placeholder="Ghi chú cho giáo viên..." />
            </Field>

            {form.status === 'APPROVED' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Field label="Tổng buổi" hint={`Mặc định: ${defaultQuota} buổi`}>
                    <input type="number" min="1" value={form.totalQuota} onChange={(e) => setForm({ ...form, totalQuota: e.target.value })} className={inputCls} placeholder={String(defaultQuota)} />
                  </Field>
                  <Field label="Ngày bắt đầu" hint="Mặc định: Hôm nay">
                    <input
                      type="date"
                      value={form.startDate}
                      onChange={(e) => {
                        const val = e.target.value
                        setForm(f => ({
                          ...f,
                          startDate: val,
                          expireDate: val ? addDays(val, durationDays) : f.expireDate
                        }))
                      }}
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Ngày hết hạn" hint={`Mặc định: +${durationDays} ngày`}>
                    <input type="date" value={form.expireDate} min={form.startDate || undefined} onChange={(e) => setForm({ ...form, expireDate: e.target.value })} className={inputCls} />
                  </Field>
                </div>

                <Field label="Giáo viên phụ trách" required={request.requestType === 'CREATE'} hint={request.requestType === 'UPDATE' ? 'Tag giáo viên hiện tại (thêm hoặc bấm X để xóa)' : 'Tag sẵn GV gửi yêu cầu (thêm hoặc bấm X để xóa)'}>
                  {/* Selected teachers tags */}
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

                  {/* Searchable combobox */}
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                    <input
                      placeholder="Tìm thêm giáo viên theo tên..."
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
                            <button type="button" key={t.id} onClick={() => addTeacher(t)} className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-pool-50/50 transition-colors text-left border-b border-ink-100/40 last:border-0">
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
              </>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">Hủy</Button>
              <Button type="submit" disabled={loading} variant={form.status === 'REJECTED' ? 'danger' : 'primary'} className="flex-1">
                {loading ? 'Đang xử lý...' : form.status === 'APPROVED' ? 'Xác nhận duyệt' : 'Xác nhận từ chối'}
              </Button>
            </div>
          </form>
        ) : (
          <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={onClose}>Đóng</Button>
          </div>
        )}
      </div>
    </Modal>
  )
}

function InfoItem({ label, value }) {
  return (
    <div>
      <p className="text-xs text-ink-400">{label}</p>
      <p className="font-medium text-ink-800">{value}</p>
    </div>
  )
}
