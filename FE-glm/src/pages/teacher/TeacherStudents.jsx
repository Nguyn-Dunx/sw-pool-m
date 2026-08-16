import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Users, Eye, Calendar, CheckCircle, CheckCircle2, ChevronDown, ChevronUp, Shield, AlertTriangle } from 'lucide-react'
import { getMyStudents, getMyStudentDetail, getStudentHistory, checkInStudent, getShifts, completeMyEnrollment } from '../../lib/apiTeacher'
import { Badge, Button, Spinner, EmptyState, Pagination, Modal, Field, inputCls, ColumnHeaderFilter, ActiveFilterChips } from '../../components/ui'
import { toast } from '../../components/ui/Toast'
import { errMsg } from '../../lib/api'
import { useDebounce } from '../../lib/useDebounce'

const STATUS = { ACTIVE: 'green', COMPLETED: 'blue', EXPIRED: 'gray' }
const STYLE = { FROG: 'Ếch', FREE: 'Sải', BACK: 'Ngửa', FLY: 'Bướm' }

export default function TeacherStudents() {
  const [searchParams] = useSearchParams()
  const [list, setList] = useState({ content: [], totalElements: 0, totalPages: 0, currentPage: 1, pageSize: 10 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState(searchParams.get('status') || '')
  const [swimStyle, setSwimStyle] = useState('')
  const [isGuaranteed, setIsGuaranteed] = useState('')
  const [page, setPage] = useState(1)
  const [detailId, setDetailId] = useState(null) // enrollment ID for detail modal
  const [quickCheckIn, setQuickCheckIn] = useState(null) // { id, studentName } for quick check in

  useEffect(() => {
    const s = searchParams.get('status')
    if (s !== null) setStatus(s)
  }, [searchParams])

  const debouncedSearch = useDebounce(search, 350)

  const load = () => {
    setLoading(true)
    getMyStudents({
      searchName: debouncedSearch,
      status,
      swimStyle,
      isGuaranteed: isGuaranteed === '' ? undefined : isGuaranteed === 'true' || isGuaranteed === true,
      page,
      size: 10
    })
      .then(setList)
      .catch((e) => toast.error(errMsg(e)))
      .finally(() => setLoading(false))
  }

  useEffect(() => { setPage(1) }, [debouncedSearch, status, swimStyle, isGuaranteed])
  useEffect(() => { load() }, [debouncedSearch, status, swimStyle, isGuaranteed, page])

  const hasAnyFilter = Boolean(search || status || swimStyle || isGuaranteed !== '')

  return (
    <div className="space-y-4">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-ink-900 tracking-tight">Học viên của tôi</h1>
        <p className="text-sm text-ink-500 mt-1">Danh sách học viên đang phụ trách — Nhấn vào biểu tượng lọc ở từng tiêu đề cột để lọc</p>
      </div>

      {/* Thanh hiển thị các bộ lọc đang kích hoạt */}
      <ActiveFilterChips
        filters={[
          { label: 'Học viên', value: search, onRemove: () => setSearch('') },
          { label: 'Kiểu bơi', value: swimStyle, displayValue: STYLE[swimStyle] ? `Bơi ${STYLE[swimStyle]}` : swimStyle, onRemove: () => setSwimStyle('') },
          { label: 'Cam kết', value: isGuaranteed, displayValue: isGuaranteed === 'true' ? 'Cam kết' : isGuaranteed === 'false' ? 'Thường' : '', onRemove: () => setIsGuaranteed('') },
          { label: 'Trạng thái', value: status, displayValue: status === 'ACTIVE' ? 'Đang học' : status === 'COMPLETED' ? 'Hoàn thành' : status === 'EXPIRED' ? 'Hết hạn' : '', onRemove: () => setStatus('') },
        ]}
        onClearAll={() => {
          setSearch('')
          setSwimStyle('')
          setIsGuaranteed('')
          setStatus('')
        }}
      />

      <div className="bg-white rounded-2xl border border-ink-100/60 overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
        {loading ? <Spinner className="py-20" size={32} /> : list.content.length === 0 ? (
          <EmptyState
            icon={Users}
            title={hasAnyFilter ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có học viên'}
            description={hasAnyFilter ? 'Không có học viên nào khớp với bộ lọc đã chọn. Hãy thử điều chỉnh lại bộ lọc.' : 'Bạn chưa phụ trách học viên nào.'}
            action={hasAnyFilter ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSearch('')
                  setSwimStyle('')
                  setIsGuaranteed('')
                  setStatus('')
                }}
              >
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
                    <th className="px-4 py-3">
                      <ColumnHeaderFilter
                        label="Học viên"
                        type="search"
                        value={search}
                        onChange={setSearch}
                        placeholder="Tìm tên học viên..."
                      />
                    </th>
                    <th className="px-4 py-3 hidden sm:table-cell">
                      <ColumnHeaderFilter
                        label="Kiểu bơi"
                        type="select"
                        value={swimStyle}
                        onChange={setSwimStyle}
                        options={[
                          { value: 'FROG', label: 'Bơi ếch' },
                          { value: 'FREE', label: 'Bơi sải' },
                          { value: 'BACK', label: 'Bơi ngửa' },
                          { value: 'FLY', label: 'Bơi bướm' },
                        ]}
                      />
                    </th>
                    <th className="px-4 py-3">
                      <ColumnHeaderFilter
                        label="Cam kết"
                        type="select"
                        value={isGuaranteed}
                        onChange={setIsGuaranteed}
                        options={[
                          { value: 'true', label: 'Cam kết', badgeColor: 'amber' },
                          { value: 'false', label: 'Thường', badgeColor: 'gray' },
                        ]}
                      />
                    </th>
                    <th className="px-4 py-3 font-semibold text-ink-600">Tiến độ</th>
                    <th className="px-4 py-3 font-semibold text-ink-600 hidden md:table-cell">Còn lại</th>
                    <th className="px-4 py-3">
                      <ColumnHeaderFilter
                        label="Trạng thái"
                        type="select"
                        value={status}
                        onChange={setStatus}
                        options={[
                          { value: 'ACTIVE', label: 'Đang học', badgeColor: 'green' },
                          { value: 'COMPLETED', label: 'Hoàn thành', badgeColor: 'blue' },
                          { value: 'EXPIRED', label: 'Hết hạn', badgeColor: 'gray' },
                        ]}
                      />
                    </th>
                    <th className="px-4 py-3 font-semibold text-ink-600 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100/60">
                  {list.content.map((s) => (
                    <tr key={s.enrollmentId} className="hover:bg-pool-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-ink-800">{s.studentName}</p>
                        <p className="text-xs text-ink-400">{s.studentPhone || ''}</p>
                      </td>
                      <td className="px-4 py-3 text-ink-600 hidden sm:table-cell font-medium">Bơi {STYLE[s.swimStyle] || s.swimStyle}</td>
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
                          <span className={`font-medium text-sm ${s.daysRemaining < 5 ? 'text-rose-600 font-semibold' : 'text-ink-600'}`}>
                            {s.daysRemaining} ngày
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3"><Badge color={STATUS[s.status]}>{s.status === 'ACTIVE' ? 'Đang học' : s.status === 'COMPLETED' ? 'Hoàn thành' : 'Hết hạn'}</Badge></td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {s.status === 'ACTIVE' && (
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => setQuickCheckIn({ id: s.enrollmentId, studentName: s.studentName })}
                              className="px-2.5 py-1 text-xs whitespace-nowrap shadow-xs"
                              title="Điểm danh học viên này"
                            >
                              <Calendar className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Điểm danh</span>
                            </Button>
                          )}
                          <button
                            onClick={() => setDetailId(s.enrollmentId)}
                            className="p-1.5 rounded-lg text-pool-600 hover:bg-pool-50 transition-colors"
                            title="Xem chi tiết & lịch sử"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
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

      {quickCheckIn && (
        <CheckInModal
          enrollmentId={quickCheckIn.id}
          studentName={quickCheckIn.studentName}
          onClose={() => setQuickCheckIn(null)}
          onDone={() => {
            setQuickCheckIn(null)
            load()
          }}
        />
      )}
    </div>
  )
}

// ===== Detail Modal =====
function StudentDetailModal({ enrollmentId, onClose, onReload }) {
  const [data, setData] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCheckIn, setShowCheckIn] = useState(false)
  const [showConfirmClose, setShowConfirmClose] = useState(false)
  const [completing, setCompleting] = useState(false)

  const load = () => {
    setLoading(true)
    Promise.all([
      getMyStudentDetail(enrollmentId),
      getStudentHistory(enrollmentId)
    ])
      .then(([d, h]) => {
        setData(d)
        const histList = Array.isArray(h) ? h : (h?.content || d?.attendanceHistory || [])
        setHistory(histList)
      })
      .catch((e) => toast.error(errMsg(e)))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [enrollmentId])

  const calcDaysRemaining = (expireDate) => {
    if (!expireDate) return null
    const today = new Date(new Date().toISOString().slice(0, 10))
    const exp = new Date(expireDate)
    return Math.ceil((exp - today) / (1000 * 60 * 60 * 24))
  }

  const daysRemaining = data?.expireDate ? calcDaysRemaining(data.expireDate) : null
  const progressPercent = data?.totalQuota ? Math.min(100, Math.round(((data.attendedSessions || 0) / data.totalQuota) * 100)) : 0

  return (
    <Modal open onClose={onClose} title="Chi tiết học viên & Khóa học" size="lg">
      {loading ? (
        <Spinner className="py-12" size={32} />
      ) : !data ? (
        <EmptyState icon={Users} title="Không tìm thấy thông tin" description="Không thể tải dữ liệu chi tiết của học viên." />
      ) : (
        <div className="space-y-5">
          {/* Header Card */}
          <div className="bg-gradient-to-br from-pool-50/80 to-pool-100/40 border border-pool-100 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xl font-bold text-ink-900">{data.studentName}</h3>
                {data.isGuaranteed ? (
                  <Badge color="amber"><Shield className="w-3 h-3" /> Cam kết</Badge>
                ) : (
                  <Badge color="gray">Thường</Badge>
                )}
                <Badge color={STATUS[data.status]}>
                  {data.status === 'ACTIVE' ? 'Đang học' : data.status === 'COMPLETED' ? 'Hoàn thành' : 'Hết hạn'}
                </Badge>
              </div>
              <p className="text-sm text-ink-600 mt-1">
                {data.studentPhone ? `SĐT: ${data.studentPhone}` : 'Chưa có SĐT'} • Kiểu bơi: <span className="font-semibold text-pool-700">Bơi {STYLE[data.swimStyle] || data.swimStyle}</span>
              </p>
            </div>

            {data.status === 'ACTIVE' && (
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={() => setShowCheckIn(true)}>
                  <Calendar className="w-4 h-4" /> Điểm danh ngay
                </Button>
                <Button size="sm" variant="danger" onClick={() => setShowConfirmClose(true)}>
                  <AlertTriangle className="w-4 h-4" /> Đóng khóa học
                </Button>
              </div>
            )}
          </div>

          {/* Progress Bar Section */}
          <div className="bg-white rounded-2xl border border-ink-100/80 p-4 shadow-xs">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-semibold text-ink-800 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-pool-500"></span>
                Tiến độ học tập
              </span>
              <span className="font-bold text-pool-700 text-base">
                {data.attendedSessions || 0} / {data.totalQuota || 0} buổi ({progressPercent}%)
              </span>
            </div>
            <div className="h-3 bg-ink-100 rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-gradient-to-r from-pool-400 via-pool-500 to-pool-600 rounded-full transition-all duration-500 shadow-xs"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Key Information Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <InfoCard label="Ngày sinh" value={data.studentDob || '—'} />
            <InfoCard label="Ngày bắt đầu" value={data.startDate || '—'} />
            <InfoCard label="Ngày hết hạn" value={data.expireDate || '—'} />
            <InfoCard
              label="Thời hạn còn lại"
              value={
                daysRemaining != null ? (
                  <span className={daysRemaining < 5 ? 'text-rose-600 font-bold' : 'text-ink-800 font-semibold'}>
                    {daysRemaining >= 0 ? `${daysRemaining} ngày` : `Quá hạn ${Math.abs(daysRemaining)} ngày`}
                  </span>
                ) : '—'
              }
            />
          </div>

          {data.teacherNames?.length > 0 && (
            <div className="bg-ink-50/50 rounded-xl p-3 text-xs text-ink-600">
              <span className="font-semibold text-ink-700">Giáo viên phụ trách: </span>
              {data.teacherNames.join(', ')}
            </div>
          )}

          {/* Attendance History Section */}
          <div className="bg-white rounded-2xl border border-ink-100/80 overflow-hidden shadow-xs">
            <div className="px-4 py-3 bg-ink-50/60 border-b border-ink-100 flex items-center justify-between">
              <h4 className="font-semibold text-ink-800 text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4 text-pool-600" />
                Lịch sử điểm danh ({history.length} buổi)
              </h4>
            </div>

            <div className="max-h-60 overflow-y-auto">
              {history.length === 0 ? (
                <div className="py-8 text-center text-ink-400 text-sm">
                  Chưa có buổi học nào được điểm danh
                </div>
              ) : (
                <table className="w-full text-xs">
                  <thead className="bg-ink-50/40 text-ink-500 text-left border-b border-ink-100/60 sticky top-0 bg-white">
                    <tr>
                      <th className="px-3.5 py-2.5 font-semibold">#</th>
                      <th className="px-3.5 py-2.5 font-semibold">Ngày học</th>
                      <th className="px-3.5 py-2.5 font-semibold">Ca học</th>
                      <th className="px-3.5 py-2.5 font-semibold">Người điểm danh</th>
                      <th className="px-3.5 py-2.5 font-semibold">Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100/60">
                    {history.map((h, index) => (
                      <tr key={h.attendanceId || index} className="hover:bg-pool-50/40 transition-colors">
                        <td className="px-3.5 py-2.5 text-ink-400 font-mono">{index + 1}</td>
                        <td className="px-3.5 py-2.5 font-medium text-ink-800">{h.attendDate}</td>
                        <td className="px-3.5 py-2.5 font-medium text-pool-700">{h.shiftTime || '—'}</td>
                        <td className="px-3.5 py-2.5 text-ink-600">{h.checkedInBy || '—'}</td>
                        <td className="px-3.5 py-2.5 text-ink-500 italic">{h.note || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {showCheckIn && (
        <CheckInModal
          enrollmentId={enrollmentId}
          studentName={data?.studentName}
          onClose={() => setShowCheckIn(false)}
          onDone={() => {
            setShowCheckIn(false)
            load()
            onReload && onReload()
          }}
        />
      )}

      {showConfirmClose && (
        <Modal open onClose={() => setShowConfirmClose(false)} title="Xác nhận đóng khóa học" size="sm">
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3.5 bg-rose-50 border border-rose-200/80 rounded-xl text-rose-900">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-rose-900">Cảnh báo đóng khóa học</p>
                <p className="text-rose-700 mt-1">
                  Bạn có chắc chắn muốn đóng khóa học của học viên <strong className="text-rose-950">{data?.studentName}</strong>?
                </p>
                <p className="text-xs text-rose-600 mt-2">
                  Sau khi đóng, khóa học sẽ chuyển sang trạng thái <strong>Hoàn thành (COMPLETED)</strong> và học viên sẽ không thể tiếp tục điểm danh.
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <Button variant="outline" onClick={() => setShowConfirmClose(false)} className="flex-1">
                Hủy bỏ
              </Button>
              <Button
                variant="danger"
                onClick={async () => {
                  setCompleting(true)
                  try {
                    await completeMyEnrollment(enrollmentId)
                    toast.success('Đã hoàn thành khóa học')
                    setShowConfirmClose(false)
                    load()
                    onReload && onReload()
                  } catch (e) {
                    toast.error(errMsg(e))
                  } finally {
                    setCompleting(false)
                  }
                }}
                disabled={completing}
                className="flex-1"
              >
                {completing ? 'Đang đóng...' : 'Xác nhận đóng'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
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

function CheckInModal({ enrollmentId, studentName, onClose, onDone }) {
  const [form, setForm] = useState({ shiftId: '', attendDate: new Date().toISOString().slice(0, 10), note: '' })
  const [shifts, setShifts] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getShifts().then(setShifts).catch(() => { })
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
    <Modal open onClose={onClose} title={studentName ? `Điểm danh: ${studentName}` : 'Điểm danh học viên'}>
      <form onSubmit={submit} className="space-y-4">
        {studentName && (
          <div className="bg-pool-50/70 border border-pool-100 rounded-xl p-3 text-sm">
            <p className="text-xs text-pool-600 font-medium">Học viên đang điểm danh</p>
            <p className="font-semibold text-pool-950 text-base mt-0.5">{studentName}</p>
          </div>
        )}
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
