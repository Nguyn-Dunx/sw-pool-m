import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { GraduationCap, Plus, Search, Eye, Pencil, Shield, AlertTriangle } from 'lucide-react'
import { getEnrollments, getEnrollmentDetail, createEnrollment, updateEnrollment, completeEnrollment, updateEnrollmentPaymentStatus, getStudents, getTeachers, exportEnrollments } from '../../lib/apiAdmin'
import { Button, Badge, Spinner, EmptyState, ErrorState, TableSkeleton, Pagination, Modal, ConfirmDialog, Field, inputCls, ColumnHeaderFilter, ActiveFilterChips, ExportButton, IconButton, InfoTile, ProgressBar, PageHeader } from '../../components/ui'
import { useClientSort, SortHeader, SortScopeNote } from '../../components/ui/Sort'
import TeacherPicker from '../../components/ui/TeacherPicker'
import PaymentStatusSelect, { PAYMENT_STATUS_META, PAYMENT_STATUS_OPTIONS } from '../../components/ui/PaymentStatusSelect'
import { PageTransition } from '../../components/motion/Motion'
import { toast } from '../../components/ui/Toast'
import { errMsg } from '../../lib/api'
import { useDebounce } from '../../lib/useDebounce'
import { getTodayDate, addDays, formatDisplayDate } from '../../lib/dateUtils'
import { useSystemSettings } from '../../lib/settings'
import { downloadFile } from '../../lib/fileDownload'

const STATUS = { ACTIVE: 'green', COMPLETED: 'blue', EXPIRED: 'gray' }
const STATUS_LABEL = { ACTIVE: 'Đang học', COMPLETED: 'Hoàn thành', EXPIRED: 'Hết hạn' }
const STYLE = { FROG: 'Ếch', FREE: 'Sải', BACK: 'Ngửa', FLY: 'Bướm' }

export default function AdminEnrollments() {
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
  const [detail, setDetail] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [showCreate, setShowCreate] = useState(false)

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
    getEnrollments({
      studentName: debouncedSearch,
      status: status || undefined,
      swimStyle: swimStyle || undefined,
      isGuaranteed: isGuaranteed === 'true' ? true : isGuaranteed === 'false' ? false : undefined,
      paymentStatus: paymentStatus || undefined,
      page,
      size: 10
    })
      .then(setList)
      .catch((e) => { setLoadError(e); toast.error(errMsg(e)) })
      .finally(() => setLoading(false))
  }

  const handleExport = () => downloadFile(
    () => exportEnrollments({
      studentName: debouncedSearch,
      status: status || undefined,
      swimStyle: swimStyle || undefined,
      isGuaranteed: isGuaranteed === 'true' ? true : isGuaranteed === 'false' ? false : undefined,
      paymentStatus: paymentStatus || undefined
    }),
    `Danh_Sach_Khoa_Hoc_${getTodayDate()}.xlsx`
  )

  const handlePaymentStatusChange = async (id, nextStatus) => {
    try {
      await updateEnrollmentPaymentStatus(id, nextStatus)
      toast.success('Đã cập nhật trạng thái học phí')
      load()
    } catch (e) {
      toast.error(errMsg(e))
    }
  }

  useEffect(() => { setPage(1) }, [debouncedSearch, status, swimStyle, isGuaranteed, paymentStatus])
  useEffect(() => { load() }, [debouncedSearch, status, swimStyle, isGuaranteed, paymentStatus, page])

  const enrollments = list.content || []
  const { sorted, sortKey, sortDir, toggleSort } = useClientSort(enrollments)
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
        title="Khóa học"
        description="Quản lý đăng ký khóa học bơi — lọc trực tiếp trên từng cột"
        actions={<>
          <ExportButton onExport={handleExport} />
          <Button onClick={() => setShowCreate(true)}><Plus className="w-4 h-4" aria-hidden="true" /> Tạo khóa học</Button>
        </>}
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
        ) : enrollments.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title={hasAnyFilter ? 'Không tìm thấy khóa học phù hợp' : 'Chưa có khóa học'}
            description={hasAnyFilter ? 'Không có khóa học nào khớp với bộ lọc đã chọn.' : 'Tạo khóa học đầu tiên cho hệ thống.'}
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
                    <th className="px-4 py-2 font-semibold text-content-muted">Giáo viên</th>
                    <th className="px-4 py-2">
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
                    <th className="px-4 py-2" aria-sort={sortKey === 'expireDate' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}>
                      <SortHeader label="Hạn" sortKey="expireDate" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
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
                  {sorted.map((e) => (
                    <tr key={e.id} className="hover:bg-primary-soft/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-content">{e.studentName}</td>
                      <td className="px-4 py-3 text-content-muted">{(e.teacherNames || []).join(', ') || '—'}</td>
                      <td className="px-4 py-3 text-content-muted font-medium">Bơi {STYLE[e.swimStyle] || e.swimStyle}</td>
                      <td className="px-4 py-3">{e.isGuaranteed ? <Badge color="amber"><Shield className="w-3 h-3" aria-hidden="true" /> Cam kết</Badge> : <Badge color="gray">Thường</Badge>}</td>
                      <td className="px-4 py-3 text-content-muted whitespace-nowrap">{formatDisplayDate(e.expireDate)}</td>
                      <td className="px-4 py-3">
                        <PaymentStatusSelect value={e.paymentStatus} studentName={e.studentName} onChange={(next) => handlePaymentStatusChange(e.id, next)} />
                      </td>
                      <td className="px-4 py-3"><Badge color={STATUS[e.status]}>{STATUS_LABEL[e.status] || e.status}</Badge></td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <IconButton label={`Xem chi tiết khóa của ${e.studentName}`} tone="primary" onClick={() => setDetail(e.id)}>
                            <Eye className="w-4 h-4" aria-hidden="true" />
                          </IconButton>
                          <IconButton label={`Sửa khóa của ${e.studentName}`} tone="neutral" onClick={() => setEditingId(e.id)}>
                            <Pencil className="w-4 h-4" aria-hidden="true" />
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
                <p className="text-xs text-content-subtle">Tổng {list.totalElements || 0} khóa học</p>
                <SortScopeNote active={Boolean(sortKey)} />
              </div>
              <Pagination page={list.currentPage} totalPages={list.totalPages} onChange={setPage} />
            </div>
          </>
        )}
      </div>

      {detail && <DetailModal id={detail} onClose={() => setDetail(null)} onEdit={(id) => { setDetail(null); setEditingId(id) }} onReload={load} />}
      {editingId && <EditModal id={editingId} onClose={() => setEditingId(null)} onSaved={() => { setEditingId(null); load() }} />}
      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); load() }} />}
    </PageTransition>
  )
}

function DetailModal({ id, onClose, onEdit, onReload }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showConfirmClose, setShowConfirmClose] = useState(false)
  const [completing, setCompleting] = useState(false)

  const loadDetail = () => {
    setLoading(true)
    setError(null)
    getEnrollmentDetail(id).then(setData).catch((e) => setError(e)).finally(() => setLoading(false))
  }

  useEffect(() => { loadDetail() }, [id])

  const handleComplete = async () => {
    setCompleting(true)
    try {
      await completeEnrollment(id)
      toast.success('Đã đóng khóa học')
      setShowConfirmClose(false)
      onReload?.()
      onClose()
    } catch (e) {
      toast.error(errMsg(e))
    } finally {
      setCompleting(false)
    }
  }

  return (
    <Modal open onClose={onClose} title="Chi tiết khóa học" size="lg">
      {loading ? <Spinner className="py-10" /> : error || !data ? (
        <ErrorState onRetry={loadDetail} />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <InfoTile label="Học viên">{data.studentName}</InfoTile>
            <InfoTile label="SĐT">{data.studentPhone || '—'}</InfoTile>
            <InfoTile label="Ngày sinh">{formatDisplayDate(data.studentDob)}</InfoTile>
            <InfoTile label="Kiểu bơi">Bơi {STYLE[data.swimStyle] || data.swimStyle}</InfoTile>
            <InfoTile label="Giáo viên">{(data.teacherNames || []).join(', ') || '—'}</InfoTile>
            <InfoTile label="Cam kết">{data.isGuaranteed ? 'Có cam kết' : 'Không'}</InfoTile>
            <InfoTile label="Tổng buổi">{data.totalQuota}</InfoTile>
            <InfoTile label="Đã học">{data.attendedSessions}</InfoTile>
            <InfoTile label="Bắt đầu">{formatDisplayDate(data.startDate)}</InfoTile>
            <InfoTile label="Hết hạn">{formatDisplayDate(data.expireDate)}</InfoTile>
            <InfoTile label="Học phí"><Badge color={PAYMENT_STATUS_META[data.paymentStatus]?.color || 'gray'}>{PAYMENT_STATUS_META[data.paymentStatus]?.label || 'Chưa xác nhận'}</Badge></InfoTile>
            <InfoTile label="Trạng thái"><Badge color={STATUS[data.status]}>{STATUS_LABEL[data.status] || data.status}</Badge></InfoTile>
          </div>

          {data.totalQuota > 0 && (
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-content-muted font-medium">Tiến độ</span>
                <span className="font-semibold text-content tabular-nums">{data.attendedSessions}/{data.totalQuota}</span>
              </div>
              <ProgressBar value={data.attendedSessions} max={data.totalQuota} label={`Tiến độ khóa học của ${data.studentName}`} />
            </div>
          )}

          {data.attendanceHistory?.length > 0 && (
            <div>
              <h4 className="font-semibold text-content mb-2">Lịch sử điểm danh ({data.attendanceHistory.length} buổi)</h4>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {data.attendanceHistory.map((h) => (
                  <div key={h.attendanceId} className="flex items-center justify-between gap-2 text-sm bg-surface-muted/60 rounded-lg px-3 py-2">
                    <span className="text-content font-medium">{formatDisplayDate(h.attendDate)}</span>
                    <span className="text-content-muted">{h.shiftTime}</span>
                    <span className="text-content-subtle text-xs">{h.checkedInBy || ''}</span>
                    {h.note && <span className="text-content-subtle text-xs">{h.note}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onEdit(data.id)} className="flex-1">
              <Pencil className="w-4 h-4" aria-hidden="true" /> Sửa thông tin / Trạng thái
            </Button>
            {data.status === 'ACTIVE' && (
              <Button variant="danger" onClick={() => setShowConfirmClose(true)} className="flex-1">
                <AlertTriangle className="w-4 h-4" aria-hidden="true" /> Đóng khóa học
              </Button>
            )}
          </div>
        </div>
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

function CreateModal({ onClose, onCreated }) {
  const { durationDays, defaultQuota } = useSystemSettings()
  const [studentSearch, setStudentSearch] = useState('')
  const [students, setStudents] = useState([])
  const [studentsLoading, setStudentsLoading] = useState(false)
  const debouncedStudentSearch = useDebounce(studentSearch, 300)

  const [form, setForm] = useState({
    studentId: '',
    teacherIds: [],
    swimStyle: 'FROG',
    isGuaranteed: false,
    totalQuota: String(defaultQuota || 12),
    startDate: getTodayDate(),
    expireDate: addDays(getTodayDate(), durationDays)
  })
  const [errors, setErrors] = useState({})
  const [selectedTeachers, setSelectedTeachers] = useState([])
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setForm(f => ({
      ...f,
      totalQuota: f.totalQuota === '12' || !f.totalQuota ? String(defaultQuota) : f.totalQuota,
      expireDate: f.startDate ? addDays(f.startDate, durationDays) : f.expireDate
    }))
  }, [durationDays, defaultQuota])

  useEffect(() => {
    setStudentsLoading(true)
    getStudents({ keyword: debouncedStudentSearch, page: 1, size: 50 })
      .then(r => setStudents(r.content || []))
      .catch(() => setStudents([]))
      .finally(() => setStudentsLoading(false))
  }, [debouncedStudentSearch])

  const handleTeachersChange = (next) => {
    setSelectedTeachers(next)
    setForm(f => ({ ...f, teacherIds: next.map(t => t.id) }))
    if (next.length > 0) setErrors(er => ({ ...er, teacherIds: undefined }))
  }

  const submit = async (e) => {
    e.preventDefault()
    const next = {}
    if (!form.studentId) next.studentId = 'Vui lòng chọn học viên'
    if (!form.teacherIds || form.teacherIds.length === 0) next.teacherIds = 'Vui lòng chọn ít nhất 1 giáo viên phụ trách'
    if (!form.swimStyle) next.swimStyle = 'Vui lòng chọn kiểu bơi'
    if (form.totalQuota && Number(form.totalQuota) < 1) next.totalQuota = 'Tổng số buổi học phải lớn hơn 0'
    if (form.startDate && form.expireDate && new Date(form.startDate) >= new Date(form.expireDate)) next.expireDate = 'Ngày hết hạn phải sau ngày bắt đầu'
    setErrors(next)
    if (Object.keys(next).length > 0) return

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
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Học viên" required hint="Tìm theo tên hoặc số điện thoại" error={errors.studentId}>
          <div>
            <div className="relative mb-2">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-content-subtle pointer-events-none" aria-hidden="true" />
              <input
                placeholder="Tìm học viên..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                aria-label="Tìm học viên"
                className={inputCls + ' pl-10'}
              />
            </div>
            <div className="border border-line rounded-xl max-h-36 overflow-y-auto divide-y divide-line/60" role="radiogroup" aria-label="Chọn học viên">
              {studentsLoading ? (
                <Spinner className="py-4" size={20} />
              ) : students.length === 0 ? (
                <p className="text-sm text-content-subtle py-3 text-center">Không tìm thấy học viên</p>
              ) : (
                students.map(s => (
                  <label key={s.id} className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-primary-soft/40 transition-colors ${form.studentId === s.id ? 'bg-primary-soft/60' : ''}`}>
                    <input
                      type="radio"
                      name="selectedStudent"
                      checked={form.studentId === s.id}
                      onChange={() => {
                        setForm(f => ({ ...f, studentId: s.id }))
                        setSelectedStudent(s)
                        setErrors(er => ({ ...er, studentId: undefined }))
                      }}
                      className="w-4 h-4 accent-[var(--color-primary)]"
                    />
                    <span>
                      <span className="block text-sm font-medium text-content">{s.fullName}</span>
                      <span className="block text-xs text-content-subtle">{s.phoneNumber} {s.dob ? `• ${formatDisplayDate(s.dob)}` : ''}</span>
                    </span>
                  </label>
                ))
              )}
            </div>
            {selectedStudent && (
              <p className="text-xs text-success-text font-medium mt-1.5">Đã chọn: {selectedStudent.fullName} ({selectedStudent.phoneNumber})</p>
            )}
          </div>
        </Field>

        <TeacherPicker
          selected={selectedTeachers}
          onChange={handleTeachersChange}
          required
          hint="Chọn 1 hoặc nhiều giáo viên"
          error={errors.teacherIds}
        />

        <div className="grid grid-cols-2 gap-4">
          <Field label="Kiểu bơi" required error={errors.swimStyle}>
            <select value={form.swimStyle} onChange={e => setForm({ ...form, swimStyle: e.target.value })} className={inputCls}>
              {Object.entries(STYLE).map(([k, v]) => <option key={k} value={k}>Bơi {v}</option>)}
            </select>
          </Field>
          <Field label="Cam kết" required>
            <select value={form.isGuaranteed ? '1' : '0'} onChange={e => setForm({ ...form, isGuaranteed: e.target.value === '1' })} className={inputCls}>
              <option value="0">Không cam kết</option>
              <option value="1">Có cam kết</option>
            </select>
          </Field>
          <Field label="Tổng buổi" hint={`Số buổi học (mặc định: ${defaultQuota})`} error={errors.totalQuota}>
            <input type="number" min="1" value={form.totalQuota} onChange={e => setForm({ ...form, totalQuota: e.target.value })} className={inputCls} placeholder={String(defaultQuota)} />
          </Field>
          <Field label="Ngày bắt đầu" hint="Mặc định là hôm nay">
            <input
              type="date"
              value={form.startDate}
              onChange={e => {
                const val = e.target.value
                setForm(f => ({ ...f, startDate: val, expireDate: val ? addDays(val, durationDays) : f.expireDate }))
              }}
              className={inputCls}
            />
          </Field>
          <Field label="Ngày hết hạn" hint={`Mặc định = Ngày bắt đầu + ${durationDays} ngày`} error={errors.expireDate}>
            <input type="date" value={form.expireDate} min={form.startDate || undefined} onChange={e => setForm({ ...form, expireDate: e.target.value })} className={inputCls} />
          </Field>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">Hủy</Button>
          <Button type="submit" loading={loading} className="flex-1">{loading ? 'Đang tạo...' : 'Tạo khóa học'}</Button>
        </div>
      </form>
    </Modal>
  )
}

function EditModal({ id, onClose, onSaved }) {
  const { durationDays, defaultQuota } = useSystemSettings()
  const [detail, setDetail] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(true)
  const [detailError, setDetailError] = useState(null)

  const [allTeachers, setAllTeachers] = useState([])
  const [form, setForm] = useState({
    teacherIds: [],
    swimStyle: 'FROG',
    isGuaranteed: false,
    totalQuota: '',
    expireDate: '',
    status: 'ACTIVE'
  })
  const [errors, setErrors] = useState({})
  const [selectedTeachers, setSelectedTeachers] = useState([])
  const [loading, setLoading] = useState(false)

  const loadDetail = () => {
    setLoadingDetail(true)
    setDetailError(null)
    getEnrollmentDetail(id)
      .then((d) => {
        setDetail(d)
        const initialTeachers = (d.teacherIds || []).map((tid, index) => ({
          id: tid,
          fullName: d.teacherNames?.[index] || ''
        }))
        setSelectedTeachers(initialTeachers)
        setForm({
          teacherIds: initialTeachers.map(t => t.id),
          swimStyle: d.swimStyle || 'FROG',
          isGuaranteed: !!d.isGuaranteed,
          totalQuota: d.totalQuota ? String(d.totalQuota) : String(defaultQuota),
          expireDate: d.expireDate || addDays(d.startDate || getTodayDate(), durationDays),
          status: d.status || 'ACTIVE'
        })
      })
      .catch((e) => setDetailError(e))
      .finally(() => setLoadingDetail(false))
  }

  useEffect(() => { loadDetail() }, [id, durationDays, defaultQuota])

  // Đồng bộ tên giáo viên khi danh sách tải về sau
  useEffect(() => {
    getTeachers({ keyword: '', page: 1, size: 50 })
      .then(r => setAllTeachers(r.content || []))
      .catch(() => setAllTeachers([]))
  }, [])

  useEffect(() => {
    if (!detail || allTeachers.length === 0) return
    setSelectedTeachers(prev => {
      if (prev.length > 0) {
        return prev.map(t => {
          const found = allTeachers.find(at => at.id === t.id)
          return found ? { ...t, fullName: found.fullName } : t
        })
      }
      if (detail.teacherNames?.length > 0) {
        const matched = allTeachers.filter(at => detail.teacherNames.includes(at.fullName))
        if (matched.length > 0) {
          setForm(f => ({ ...f, teacherIds: matched.map(m => m.id) }))
          return matched
        }
      }
      return prev
    })
  }, [detail, allTeachers])

  const handleTeachersChange = (next) => {
    setSelectedTeachers(next)
    setForm(f => ({ ...f, teacherIds: next.map(t => t.id) }))
  }

  const submit = async (e) => {
    e.preventDefault()
    const next = {}
    if (form.totalQuota && Number(form.totalQuota) < 1) next.totalQuota = 'Tổng số buổi học phải lớn hơn 0'
    if (detail?.startDate && form.expireDate && new Date(detail.startDate) >= new Date(form.expireDate)) next.expireDate = 'Ngày hết hạn phải sau ngày bắt đầu'
    setErrors(next)
    if (Object.keys(next).length > 0) return

    setLoading(true)
    try {
      const body = {
        teacherIds: form.teacherIds.length > 0 ? form.teacherIds : undefined,
        swimStyle: form.swimStyle,
        isGuaranteed: form.isGuaranteed,
        totalQuota: form.totalQuota ? Number(form.totalQuota) : undefined,
        expireDate: form.expireDate || undefined,
        status: form.status
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
    <Modal open onClose={onClose} title="Sửa khóa học & Trạng thái" size="lg">
      {loadingDetail ? <Spinner className="py-10" /> : detailError || !detail ? (
        <ErrorState onRetry={loadDetail} />
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          <div className="bg-surface-muted/60 rounded-xl p-3.5 text-sm border border-line">
            <p className="text-xs text-content-subtle">Học viên</p>
            <p className="font-semibold text-content text-base">{detail?.studentName} ({detail?.studentPhone || '—'})</p>
            <p className="text-xs text-content-muted mt-1">Giáo viên hiện tại: {(detail?.teacherNames || []).join(', ') || 'Chưa có'}</p>
          </div>

          <Field label="Trạng thái khóa học" required hint="Admin có thể mở lại khóa học nếu bị giáo viên ấn nhầm đóng">
            <select
              value={form.status}
              onChange={e => setForm({ ...form, status: e.target.value })}
              className={inputCls + ' font-semibold'}
            >
              <option value="ACTIVE">Đang học — Mở lại khóa</option>
              <option value="COMPLETED">Hoàn thành — Đã học xong</option>
              <option value="EXPIRED">Hết hạn</option>
            </select>
          </Field>

          <TeacherPicker
            selected={selectedTeachers}
            onChange={handleTeachersChange}
            hint="Thêm hoặc bớt giáo viên phụ trách khóa học này"
            placeholder="Tìm giáo viên mới..."
          />

          <div className="grid grid-cols-2 gap-4">
            <Field label="Kiểu bơi" required>
              <select value={form.swimStyle} onChange={e => setForm({ ...form, swimStyle: e.target.value })} className={inputCls}>
                {Object.entries(STYLE).map(([k, v]) => <option key={k} value={k}>Bơi {v}</option>)}
              </select>
            </Field>
            <Field label="Cam kết" required>
              <select value={form.isGuaranteed ? '1' : '0'} onChange={e => setForm({ ...form, isGuaranteed: e.target.value === '1' })} className={inputCls}>
                <option value="0">Không cam kết</option>
                <option value="1">Có cam kết</option>
              </select>
            </Field>
            <Field label="Tổng buổi" error={errors.totalQuota}>
              <input type="number" min="1" value={form.totalQuota} onChange={e => setForm({ ...form, totalQuota: e.target.value })} className={inputCls} placeholder="12" />
            </Field>
            <Field label="Ngày hết hạn" error={errors.expireDate}>
              <input type="date" value={form.expireDate} min={detail?.startDate || undefined} onChange={e => setForm({ ...form, expireDate: e.target.value })} className={inputCls} />
            </Field>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Hủy</Button>
            <Button type="submit" loading={loading} className="flex-1">{loading ? 'Đang lưu...' : 'Lưu thay đổi'}</Button>
          </div>
        </form>
      )}
    </Modal>
  )
}