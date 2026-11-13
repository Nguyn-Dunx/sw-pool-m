import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Users, Eye, Calendar, Shield, AlertTriangle } from 'lucide-react'
import { getMyStudents, getMyStudentDetail, getStudentHistory, checkInStudent, getShifts, completeMyEnrollment, updateMyEnrollmentPaymentStatus, exportTeacherStudents, exportStudentHistory } from '../../lib/apiTeacher'
import { Badge, Button, Spinner, EmptyState, ErrorState, TableSkeleton, Pagination, Modal, ConfirmDialog, Field, inputCls, ColumnHeaderFilter, ActiveFilterChips, ExportButton, IconButton, InfoTile, ProgressBar, PageHeader } from '../../components/ui'
import { useClientSort, SortHeader, SortScopeNote } from '../../components/ui/Sort'
import PaymentStatusSelect, { PAYMENT_STATUS_META, PAYMENT_STATUS_OPTIONS } from '../../components/ui/PaymentStatusSelect'
import { PageTransition } from '../../components/motion/Motion'
import { toast } from '../../components/ui/Toast'
import { errMsg } from '../../lib/api'
import { useDebounce } from '../../lib/useDebounce'
import { downloadFile } from '../../lib/fileDownload'
import { getTodayDate, formatDisplayDate, parseLocalDate } from '../../lib/dateUtils'

const STATUS = { ACTIVE: 'green', COMPLETED: 'blue', EXPIRED: 'gray' }
const STATUS_LABEL = { ACTIVE: 'Đang học', COMPLETED: 'Hoàn thành', EXPIRED: 'Hết hạn' }
const STYLE = { FROG: 'Ếch', FREE: 'Sải', BACK: 'Ngửa', FLY: 'Bướm' }

export default function TeacherStudents() {
  const [searchParams] = useSearchParams()
  const [list, setList] = useState({ content: [], totalElements: 0, totalPages: 0, currentPage: 1, pageSize: 10 })
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState(searchParams.get('status') || '')
  const [swimStyle, setSwimStyle] = useState('')
  const [isGuaranteed, setIsGuaranteed] = useState('')
  const [paymentStatus, setPaymentStatus] = useState(searchParams.get('paymentStatus') || '')
  const [page, setPage] = useState(1)
  const [detailId, setDetailId] = useState(null)
  const [quickCheckIn, setQuickCheckIn] = useState(null)

  useEffect(() => {
    const s = searchParams.get('status')
    if (s !== null) setStatus(s)
    const p = searchParams.get('paymentStatus')
    if (p !== null) setPaymentStatus(p)
  }, [searchParams])

  const debouncedSearch = useDebounce(search, 350)

  const load = () => {
    setLoading(true)
    setLoadError(null)
    getMyStudents({
      searchName: debouncedSearch,
      status: status || undefined,
      swimStyle: swimStyle || undefined,
      isGuaranteed: isGuaranteed === '' ? undefined : isGuaranteed === 'true' || isGuaranteed === true,
      paymentStatus: paymentStatus || undefined,
      page,
      size: 10
    })
      .then(setList)
      .catch((e) => { setLoadError(e); toast.error(errMsg(e)) })
      .finally(() => setLoading(false))
  }

  const handleExport = () => downloadFile(
    () => exportTeacherStudents({
      searchName: debouncedSearch,
      status: status || undefined,
      swimStyle: swimStyle || undefined,
      isGuaranteed: isGuaranteed === '' ? undefined : isGuaranteed === 'true' || isGuaranteed === true,
      paymentStatus: paymentStatus || undefined
    }),
    `Hoc_Vien_Phu_Trach_${getTodayDate()}.xlsx`
  )

  const handlePaymentStatusChange = async (enrollmentId, nextStatus) => {
    try {
      await updateMyEnrollmentPaymentStatus(enrollmentId, nextStatus)
      toast.success('Đã cập nhật trạng thái học phí')
      load()
    } catch (e) {
      toast.error(errMsg(e))
    }
  }

  useEffect(() => { setPage(1) }, [debouncedSearch, status, swimStyle, isGuaranteed, paymentStatus])
  useEffect(() => { load() }, [debouncedSearch, status, swimStyle, isGuaranteed, paymentStatus, page])

  const students = list.content || []
  const { sorted, sortKey, sortDir, toggleSort } = useClientSort(students)
  const hasAnyFilter = Boolean(search || status || swimStyle || isGuaranteed !== '' || paymentStatus)

  const clearFilters = () => {
    setSearch('')
    setSwimStyle('')
    setIsGuaranteed('')
    setPaymentStatus('')
    setStatus('')
  }

  return (
    <PageTransition className="space-y-4">
      <PageHeader
        title="Học viên của tôi"
        description="Danh sách học viên đang phụ trách — lọc trực tiếp trên từng cột"
        actions={<ExportButton onExport={handleExport} />}
      />

      <ActiveFilterChips
        filters={[
          { label: 'Học viên', value: search, onRemove: () => setSearch('') },
          { label: 'Kiểu bơi', value: swimStyle, displayValue: STYLE[swimStyle] ? `Bơi ${STYLE[swimStyle]}` : swimStyle, onRemove: () => setSwimStyle('') },
          { label: 'Cam kết', value: isGuaranteed, displayValue: isGuaranteed === 'true' ? 'Cam kết' : isGuaranteed === 'false' ? 'Thường' : '', onRemove: () => setIsGuaranteed('') },
          { label: 'Học phí', value: paymentStatus, displayValue: PAYMENT_STATUS_META[paymentStatus]?.label, onRemove: () => setPaymentStatus('') },
          { label: 'Trạng thái', value: status, displayValue: STATUS_LABEL[status] || '', onRemove: () => setStatus('') },
        ]}
        onClearAll={clearFilters}
      />

      <div className="bg-surface rounded-2xl border border-line shadow-card overflow-hidden" data-stagger>
        {loading ? <TableSkeleton rows={6} cols={5} className="border-0 shadow-none rounded-none" /> : loadError ? (
          <ErrorState onRetry={load} />
        ) : students.length === 0 ? (
          <EmptyState
            icon={Users}
            title={hasAnyFilter ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có học viên'}
            description={hasAnyFilter ? 'Không có học viên nào khớp với bộ lọc đã chọn. Hãy thử điều chỉnh lại bộ lọc.' : 'Bạn chưa phụ trách học viên nào.'}
            action={hasAnyFilter ? <Button variant="secondary" size="sm" onClick={clearFilters}>Xóa tất cả bộ lọc</Button> : null}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-muted/60 text-content-muted text-left border-b border-line">
                  <tr>
                    <th className="px-4 py-2">
                      <ColumnHeaderFilter label="Học viên" type="search" value={search} onChange={setSearch} placeholder="Tìm tên học viên..." />
                    </th>
                    <th className="px-4 py-2 hidden sm:table-cell">
                      <ColumnHeaderFilter label="Kiểu bơi" type="select" value={swimStyle} onChange={setSwimStyle}
                        options={[
                          { value: 'FROG', label: 'Bơi ếch' },
                          { value: 'FREE', label: 'Bơi sải' },
                          { value: 'BACK', label: 'Bơi ngửa' },
                          { value: 'FLY', label: 'Bơi bướm' },
                        ]} />
                    </th>
                    <th className="px-4 py-2">
                      <ColumnHeaderFilter label="Cam kết" type="select" value={isGuaranteed} onChange={setIsGuaranteed}
                        options={[
                          { value: 'true', label: 'Cam kết', badgeColor: 'amber' },
                          { value: 'false', label: 'Thường', badgeColor: 'gray' },
                        ]} />
                    </th>
                    <th className="px-4 py-2 font-semibold text-content-muted">Tiến độ</th>
                    <th className="px-4 py-2 hidden md:table-cell" aria-sort={sortKey === 'daysRemaining' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}>
                      <SortHeader label="Còn lại" sortKey="daysRemaining" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
                    </th>
                    <th className="px-4 py-2">
                      <ColumnHeaderFilter label="Học phí" type="select" value={paymentStatus} onChange={setPaymentStatus} options={PAYMENT_STATUS_OPTIONS} />
                    </th>
                    <th className="px-4 py-2">
                      <ColumnHeaderFilter label="Trạng thái" type="select" value={status} onChange={setStatus}
                        options={[
                          { value: 'ACTIVE', label: 'Đang học', badgeColor: 'green' },
                          { value: 'COMPLETED', label: 'Hoàn thành', badgeColor: 'blue' },
                          { value: 'EXPIRED', label: 'Hết hạn', badgeColor: 'gray' },
                        ]} />
                    </th>
                    <th className="px-4 py-2 font-semibold text-content-muted text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/70">
                  {sorted.map((s) => (
                    <tr key={s.enrollmentId} className="hover:bg-primary-soft/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-content">{s.studentName}</p>
                        <p className="text-xs text-content-subtle">{s.studentPhone || ''}</p>
                      </td>
                      <td className="px-4 py-3 text-content-muted hidden sm:table-cell font-medium">Bơi {STYLE[s.swimStyle] || s.swimStyle}</td>
                      <td className="px-4 py-3">
                        {s.isGuaranteed ? <Badge color="amber"><Shield className="w-3 h-3" aria-hidden="true" /> Cam kết</Badge> : <Badge color="gray">Thường</Badge>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <ProgressBar value={s.attendedSessions || 0} max={s.totalQuota || 0} className="w-20" label={`Tiến độ của ${s.studentName}`} />
                          <span className="text-xs text-content-muted font-medium tabular-nums whitespace-nowrap">{s.attendedSessions}/{s.totalQuota}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {s.daysRemaining != null && (
                          <span className={`font-medium text-sm tabular-nums ${s.daysRemaining < 5 ? 'text-danger-text font-semibold' : 'text-content-muted'}`}>
                            {s.daysRemaining} ngày
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <PaymentStatusSelect value={s.paymentStatus} studentName={s.studentName} onChange={(next) => handlePaymentStatusChange(s.enrollmentId, next)} />
                      </td>
                      <td className="px-4 py-3"><Badge color={STATUS[s.status]}>{STATUS_LABEL[s.status] || s.status}</Badge></td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {s.status === 'ACTIVE' && (
                            <Button size="sm" onClick={() => setQuickCheckIn({ id: s.enrollmentId, studentName: s.studentName })} className="whitespace-nowrap" title={`Điểm danh ${s.studentName}`}>
                              <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                              <span className="hidden sm:inline">Điểm danh</span>
                            </Button>
                          )}
                          <IconButton label={`Xem chi tiết & lịch sử của ${s.studentName}`} tone="primary" onClick={() => setDetailId(s.enrollmentId)}>
                            <Eye className="w-4 h-4" aria-hidden="true" />
                          </IconButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-line">
              <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                <p className="text-xs text-content-subtle">Tổng {list.totalElements || 0} học viên</p>
                <SortScopeNote active={Boolean(sortKey)} />
              </div>
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
          onDone={() => { setQuickCheckIn(null); load() }}
        />
      )}
    </PageTransition>
  )
}

// ===== Detail Modal =====
function StudentDetailModal({ enrollmentId, onClose, onReload }) {
  const [data, setData] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showCheckIn, setShowCheckIn] = useState(false)
  const [showConfirmClose, setShowConfirmClose] = useState(false)
  const [completing, setCompleting] = useState(false)

  const load = () => {
    setLoading(true)
    setError(null)
    Promise.all([
      getMyStudentDetail(enrollmentId),
      getStudentHistory(enrollmentId)
    ])
      .then(([d, h]) => {
        setData(d)
        const histList = Array.isArray(h) ? h : (h?.content || d?.attendanceHistory || [])
        setHistory(histList)
      })
      .catch((e) => { setError(e); toast.error(errMsg(e)) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [enrollmentId])

  const calcDaysRemaining = (expireDate) => {
    if (!expireDate) return null
    const today = parseLocalDate(getTodayDate())
    const exp = parseLocalDate(expireDate)
    if (!today || !exp) return null
    return Math.ceil((exp - today) / (1000 * 60 * 60 * 24))
  }

  const daysRemaining = data?.expireDate ? calcDaysRemaining(data.expireDate) : null

  const handleComplete = async () => {
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
  }

  return (
    <Modal open onClose={onClose} title="Chi tiết học viên & Khóa học" size="lg">
      {loading ? (
        <Spinner className="py-12" size={32} />
      ) : error || !data ? (
        <ErrorState onRetry={load} />
      ) : (
        <div className="space-y-5">
          <div className="bg-gradient-to-br from-primary-soft to-accent-soft/50 border border-primary/15 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xl font-bold text-content font-display">{data.studentName}</h3>
                {data.isGuaranteed ? <Badge color="amber"><Shield className="w-3 h-3" aria-hidden="true" /> Cam kết</Badge> : <Badge color="gray">Thường</Badge>}
                <Badge color={STATUS[data.status]}>{STATUS_LABEL[data.status] || data.status}</Badge>
                <Badge color={PAYMENT_STATUS_META[data.paymentStatus]?.color || 'gray'}>{PAYMENT_STATUS_META[data.paymentStatus]?.label || 'Chưa xác nhận'}</Badge>
              </div>
              <p className="text-sm text-content-muted mt-1">
                {data.studentPhone ? `SĐT: ${data.studentPhone}` : 'Chưa có SĐT'} • Kiểu bơi: <span className="font-semibold text-primary-soft-text">Bơi {STYLE[data.swimStyle] || data.swimStyle}</span>
              </p>
            </div>

            {data.status === 'ACTIVE' && (
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={() => setShowCheckIn(true)}>
                  <Calendar className="w-4 h-4" aria-hidden="true" /> Điểm danh ngay
                </Button>
                <Button size="sm" variant="danger" onClick={() => setShowConfirmClose(true)}>
                  <AlertTriangle className="w-4 h-4" aria-hidden="true" /> Đóng khóa
                </Button>
              </div>
            )}
          </div>

          <div className="bg-surface rounded-2xl border border-line p-4 shadow-card">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-semibold text-content">Tiến độ học tập</span>
              <span className="font-bold text-primary-soft-text text-base tabular-nums">
                {data.attendedSessions || 0} / {data.totalQuota || 0} buổi
              </span>
            </div>
            <ProgressBar value={data.attendedSessions || 0} max={data.totalQuota || 0} className="h-3" label={`Tiến độ học tập của ${data.studentName}`} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <InfoTile label="Ngày sinh">{formatDisplayDate(data.studentDob)}</InfoTile>
            <InfoTile label="Ngày bắt đầu">{formatDisplayDate(data.startDate)}</InfoTile>
            <InfoTile label="Ngày hết hạn">{formatDisplayDate(data.expireDate)}</InfoTile>
            <InfoTile label="Thời hạn còn lại">
              {daysRemaining != null ? (
                <span className={daysRemaining < 5 ? 'text-danger-text font-bold' : 'text-content font-semibold'}>
                  {daysRemaining >= 0 ? `${daysRemaining} ngày` : `Quá hạn ${Math.abs(daysRemaining)} ngày`}
                </span>
              ) : '—'}
            </InfoTile>
          </div>

          {data.teacherNames?.length > 0 && (
            <div className="bg-surface-muted/60 rounded-xl p-3 text-xs text-content-muted border border-line">
              <span className="font-semibold text-content">Giáo viên phụ trách: </span>
              {data.teacherNames.join(', ')}
            </div>
          )}

          <div className="bg-surface rounded-2xl border border-line overflow-hidden shadow-card">
            <div className="px-4 py-3 bg-surface-muted/60 border-b border-line flex items-center justify-between flex-wrap gap-2">
              <h4 className="font-semibold text-content text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary-soft-text" aria-hidden="true" />
                Lịch sử điểm danh ({history.length} buổi)
              </h4>
              {history.length > 0 && (
                <ExportButton
                  size="sm"
                  label="Xuất lịch sử"
                  onExport={() => downloadFile(
                    () => exportStudentHistory(enrollmentId),
                    `Lich_Su_Diem_Danh_${data?.studentName || 'Hoc_Vien'}_${getTodayDate()}.xlsx`
                  )}
                />
              )}
            </div>

            <div className="max-h-60 overflow-y-auto">
              {history.length === 0 ? (
                <div className="py-8 text-center text-content-subtle text-sm">Chưa có buổi học nào được điểm danh</div>
              ) : (
                <table className="w-full text-xs">
                  <thead className="bg-surface-muted/80 text-content-muted text-left border-b border-line sticky top-0">
                    <tr>
                      <th className="px-3.5 py-2.5 font-semibold">#</th>
                      <th className="px-3.5 py-2.5 font-semibold">Ngày học</th>
                      <th className="px-3.5 py-2.5 font-semibold">Ca học</th>
                      <th className="px-3.5 py-2.5 font-semibold">Người điểm danh</th>
                      <th className="px-3.5 py-2.5 font-semibold">Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/70">
                    {history.map((h, index) => (
                      <tr key={h.attendanceId || index} className="hover:bg-primary-soft/30 transition-colors">
                        <td className="px-3.5 py-2.5 text-content-subtle tabular-nums">{index + 1}</td>
                        <td className="px-3.5 py-2.5 font-medium text-content whitespace-nowrap">{formatDisplayDate(h.attendDate)}</td>
                        <td className="px-3.5 py-2.5 font-medium text-primary-soft-text">{h.shiftTime || '—'}</td>
                        <td className="px-3.5 py-2.5 text-content-muted">{h.checkedInBy || '—'}</td>
                        <td className="px-3.5 py-2.5 text-content-subtle italic">{h.note || '—'}</td>
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
          onDone={() => { setShowCheckIn(false); load(); onReload && onReload() }}
        />
      )}

      <ConfirmDialog
        open={showConfirmClose}
        onClose={() => setShowConfirmClose(false)}
        onConfirm={handleComplete}
        loading={completing}
        danger
        title="Xác nhận đóng khóa học"
        confirmLabel="Xác nhận đóng"
        message={`Đóng khóa học của học viên ${data?.studentName || ''}? Khóa sẽ chuyển sang Hoàn thành và học viên không thể tiếp tục điểm danh.`}
      />
    </Modal>
  )
}

function CheckInModal({ enrollmentId, studentName, onClose, onDone }) {
  const [form, setForm] = useState({ shiftId: '', attendDate: getTodayDate(), note: '' })
  const [shifts, setShifts] = useState([])
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getShifts().then(setShifts).catch(() => {})
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    const next = {}
    if (!form.shiftId) next.shiftId = 'Vui lòng chọn ca học'
    if (!form.attendDate) next.attendDate = 'Vui lòng chọn ngày học'
    setErrors(next)
    if (Object.keys(next).length > 0) return

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
      <form onSubmit={submit} className="space-y-4" noValidate>
        {studentName && (
          <div className="bg-primary-soft/70 border border-primary/15 rounded-xl p-3 text-sm">
            <p className="text-xs text-primary-soft-text font-medium">Học viên đang điểm danh</p>
            <p className="font-semibold text-content text-base mt-0.5">{studentName}</p>
          </div>
        )}
        <Field label="Ca học" required error={errors.shiftId}>
          <select value={form.shiftId} onChange={e => { setForm({ ...form, shiftId: e.target.value }); if (errors.shiftId) setErrors({ ...errors, shiftId: undefined }) }} className={inputCls}>
            <option value="">Chọn ca học...</option>
            {shifts.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Ngày học" required error={errors.attendDate}>
          <input type="date" value={form.attendDate} max={getTodayDate()} onChange={e => { setForm({ ...form, attendDate: e.target.value }); if (errors.attendDate) setErrors({ ...errors, attendDate: undefined }) }} className={inputCls} />
        </Field>
        <Field label="Ghi chú" hint="Tùy chọn">
          <textarea value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} className={inputCls} rows={2} placeholder="Ghi chú về buổi học..." />
        </Field>
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">Hủy</Button>
          <Button type="submit" loading={loading} className="flex-1">{loading ? 'Đang lưu...' : 'Xác nhận'}</Button>
        </div>
      </form>
    </Modal>
  )
}
