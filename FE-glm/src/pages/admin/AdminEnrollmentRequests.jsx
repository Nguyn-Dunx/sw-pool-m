import { useEffect, useState } from 'react'
import { ClipboardCheck, CheckCircle, XCircle, Eye, Shield } from 'lucide-react'
import { getEnrollmentRequests, reviewEnrollmentRequest, getTeachers, getEnrollmentDetail, exportEnrollmentRequests } from '../../lib/apiAdmin'
import { Button, Badge, EmptyState, ErrorState, TableSkeleton, Pagination, Modal, Field, inputCls, ColumnHeaderFilter, ActiveFilterChips, ExportButton, IconButton, InfoTile, PageHeader } from '../../components/ui'
import { useClientSort, SortHeader, SortScopeNote } from '../../components/ui/Sort'
import TeacherPicker from '../../components/ui/TeacherPicker'
import { PageTransition } from '../../components/motion/Motion'
import { useAuth } from '../../store/auth'
import { useRequestNotification } from '../../store/notifications'
import { toast } from '../../components/ui/Toast'
import { errMsg } from '../../lib/api'
import { useDebounce } from '../../lib/useDebounce'
import { getTodayDate, addDays, formatDisplayDate, formatISODate } from '../../lib/dateUtils'
import { useSystemSettings } from '../../lib/settings'
import { downloadFile } from '../../lib/fileDownload'

const STYLE = { FROG: 'Ếch', FREE: 'Sải', BACK: 'Ngửa', FLY: 'Bướm' }
const STATUS_COLOR = { PENDING: 'amber', APPROVED: 'green', REJECTED: 'red' }
const STATUS_LABEL = { PENDING: 'Chờ duyệt', APPROVED: 'Đã duyệt', REJECTED: 'Từ chối' }
const TYPE_LABEL = { CREATE: 'Tạo mới', UPDATE: 'Cập nhật' }

export default function AdminEnrollmentRequests() {
  const { user } = useAuth()
  const { checkNotifications } = useRequestNotification()
  const [list, setList] = useState({ content: [], totalElements: 0, totalPages: 0, currentPage: 1, pageSize: 10 })
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [swimStyle, setSwimStyle] = useState('')
  const [isGuaranteed, setIsGuaranteed] = useState('')
  const [requestType, setRequestType] = useState('')
  const [page, setPage] = useState(1)
  const [review, setReview] = useState(null)

  const debouncedSearch = useDebounce(search, 300)

  const load = () => {
    setLoading(true)
    setLoadError(null)
    getEnrollmentRequests({
      status: status || undefined,
      requestType: requestType || undefined,
      swimStyle: swimStyle || undefined,
      isGuaranteed: isGuaranteed === 'true' ? true : isGuaranteed === 'false' ? false : undefined,
      search: debouncedSearch || undefined,
      page,
      size: 10
    })
      .then((res) => {
        setList(res)
        checkNotifications('ADMIN', user?.id)
      })
      .catch((e) => { setLoadError(e); toast.error(errMsg(e)) })
      .finally(() => setLoading(false))
  }

  const handleExport = () => downloadFile(
    () => exportEnrollmentRequests({
      status: status || undefined,
      requestType: requestType || undefined,
      swimStyle: swimStyle || undefined,
      isGuaranteed: isGuaranteed === 'true' ? true : isGuaranteed === 'false' ? false : undefined,
      search: debouncedSearch || undefined
    }),
    `Yeu_Cau_Dang_Ky_${getTodayDate()}.xlsx`
  )

  useEffect(() => { setPage(1) }, [status, requestType, debouncedSearch, swimStyle, isGuaranteed])
  useEffect(() => { load() }, [status, requestType, debouncedSearch, swimStyle, isGuaranteed, page])

  const requests = list.content || []
  const { sorted, sortKey, sortDir, toggleSort } = useClientSort(requests)
  const hasAnyFilter = Boolean(search || status || swimStyle || isGuaranteed !== '' || requestType)

  const clearFilters = () => {
    setSearch('')
    setSwimStyle('')
    setIsGuaranteed('')
    setRequestType('')
    setStatus('')
  }

  return (
    <PageTransition className="space-y-4">
      <PageHeader
        title="Yêu cầu đăng ký"
        description="Duyệt yêu cầu tạo/cập nhật khóa học từ giáo viên — lọc trực tiếp trên từng cột"
        actions={<ExportButton onExport={handleExport} />}
      />

      <ActiveFilterChips
        filters={[
          { label: 'Học viên', value: search, onRemove: () => setSearch('') },
          { label: 'Kiểu bơi', value: swimStyle, displayValue: STYLE[swimStyle] ? `Bơi ${STYLE[swimStyle]}` : swimStyle, onRemove: () => setSwimStyle('') },
          { label: 'Cam kết', value: isGuaranteed, displayValue: isGuaranteed === 'true' ? 'Cam kết' : isGuaranteed === 'false' ? 'Thường' : '', onRemove: () => setIsGuaranteed('') },
          { label: 'Loại yêu cầu', value: requestType, displayValue: TYPE_LABEL[requestType], onRemove: () => setRequestType('') },
          { label: 'Trạng thái', value: status, displayValue: STATUS_LABEL[status], onRemove: () => setStatus('') },
        ]}
        onClearAll={clearFilters}
      />

      <div className="bg-surface rounded-2xl border border-line shadow-card overflow-hidden" data-stagger>
        {loading ? <TableSkeleton rows={6} cols={6} className="border-0 shadow-none rounded-none" /> : loadError ? (
          <ErrorState onRetry={load} />
        ) : requests.length === 0 ? (
          <EmptyState
            icon={ClipboardCheck}
            title={hasAnyFilter ? 'Không tìm thấy yêu cầu phù hợp' : 'Không có yêu cầu'}
            description={hasAnyFilter ? 'Không có yêu cầu nào khớp với bộ lọc đã chọn.' : 'Chưa có yêu cầu đăng ký nào cần duyệt.'}
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
                    <th className="px-4 py-2 font-semibold text-content-muted">GV đề xuất</th>
                    <th className="px-4 py-2 hidden sm:table-cell">
                      <ColumnHeaderFilter label="Kiểu bơi" type="select" value={swimStyle} onChange={setSwimStyle}
                        options={[
                          { value: 'FROG', label: 'Bơi ếch' },
                          { value: 'FREE', label: 'Bơi sải' },
                          { value: 'BACK', label: 'Bơi ngửa' },
                          { value: 'FLY', label: 'Bơi bướm' },
                        ]} />
                    </th>
                    <th className="px-4 py-2 hidden md:table-cell">
                      <ColumnHeaderFilter label="Cam kết" type="select" value={isGuaranteed} onChange={setIsGuaranteed}
                        options={[
                          { value: 'true', label: 'Cam kết', badgeColor: 'amber' },
                          { value: 'false', label: 'Thường', badgeColor: 'gray' },
                        ]} />
                    </th>
                    <th className="px-4 py-2 hidden md:table-cell">
                      <ColumnHeaderFilter label="Loại" type="select" value={requestType} onChange={setRequestType}
                        options={[
                          { value: 'CREATE', label: 'Tạo mới', badgeColor: 'blue' },
                          { value: 'UPDATE', label: 'Cập nhật', badgeColor: 'purple' },
                        ]} />
                    </th>
                    <th className="px-4 py-2">
                      <ColumnHeaderFilter label="Trạng thái" type="select" value={status} onChange={setStatus}
                        options={[
                          { value: 'PENDING', label: 'Chờ duyệt', badgeColor: 'amber' },
                          { value: 'APPROVED', label: 'Đã duyệt', badgeColor: 'green' },
                          { value: 'REJECTED', label: 'Từ chối', badgeColor: 'red' },
                        ]} />
                    </th>
                    <th className="px-4 py-2 hidden sm:table-cell" aria-sort={sortKey === 'createdAt' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}>
                      <SortHeader label="Ngày tạo" sortKey="createdAt" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
                    </th>
                    <th className="px-4 py-2 font-semibold text-content-muted text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/70">
                  {sorted.map((r) => (
                    <tr key={r.id} className="hover:bg-primary-soft/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-content">{r.studentName}</td>
                      <td className="px-4 py-3 text-content-muted">{r.teacherName || '—'}</td>
                      <td className="px-4 py-3 text-content-muted hidden sm:table-cell font-medium">Bơi {STYLE[r.swimStyle] || r.swimStyle}</td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {r.isGuaranteed ? <Badge color="amber"><Shield className="w-3 h-3" aria-hidden="true" /> Cam kết</Badge> : <Badge color="gray">Thường</Badge>}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell"><Badge color={r.requestType === 'CREATE' ? 'blue' : 'purple'}>{TYPE_LABEL[r.requestType] || r.requestType}</Badge></td>
                      <td className="px-4 py-3"><Badge color={STATUS_COLOR[r.status]}>{STATUS_LABEL[r.status]}</Badge></td>
                      <td className="px-4 py-3 text-content-muted hidden sm:table-cell whitespace-nowrap">{formatDisplayDate(r.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        {r.status === 'PENDING' ? (
                          <Button size="sm" onClick={() => setReview(r)}>Duyệt</Button>
                        ) : (
                          <IconButton label={`Xem yêu cầu của ${r.studentName}`} tone="neutral" onClick={() => setReview(r)}>
                            <Eye className="w-4 h-4" aria-hidden="true" />
                          </IconButton>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-line">
              <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                <p className="text-xs text-content-subtle">Tổng {list.totalElements || 0} yêu cầu</p>
                <SortScopeNote active={Boolean(sortKey)} />
              </div>
              <Pagination page={list.currentPage} totalPages={list.totalPages} onChange={setPage} />
            </div>
          </>
        )}
      </div>

      {review && <ReviewModal request={review} onClose={() => setReview(null)} onDone={() => { setReview(null); load() }} />}
    </PageTransition>
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
  const [form, setForm] = useState({
    status: 'APPROVED',
    adminNote: request.adminNote || '',
    totalQuota: defaultQuotaStr,
    startDate: defaultStart,
    expireDate: defaultExpire,
    teacherIds: []
  })
  const [selectedTeachers, setSelectedTeachers] = useState([])
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  // Tải danh sách giáo viên để khởi tạo tag (CREATE/UPDATE)
  useEffect(() => {
    getTeachers({ keyword: '', page: 1, size: 50 })
      .then((r) => setAllTeachers(r.content || []))
      .catch(() => setAllTeachers([]))
  }, [])

  // Khởi tạo giáo viên phụ trách theo loại yêu cầu
  useEffect(() => {
    if (request.requestType === 'CREATE') {
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

  const handleTeachersChange = (next) => {
    setSelectedTeachers(next)
    setForm(f => ({ ...f, teacherIds: next.map(t => t.id).filter(id => id && id !== 'proposing-teacher') }))
    if (next.length > 0) setErrors(er => ({ ...er, teacherIds: undefined }))
  }

  const submit = async (e) => {
    e.preventDefault()
    const next = {}
    if (form.status === 'APPROVED') {
      if (form.teacherIds.length === 0 && request.requestType === 'CREATE') next.teacherIds = 'Vui lòng chọn ít nhất một giáo viên phụ trách'
      if (form.startDate && form.expireDate && new Date(form.startDate) >= new Date(form.expireDate)) next.expireDate = 'Ngày hết hạn phải sau ngày bắt đầu'
      if (form.totalQuota && Number(form.totalQuota) < 1) next.totalQuota = 'Tổng buổi phải lớn hơn 0'
    }
    setErrors(next)
    if (Object.keys(next).length > 0) return

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
    <Modal open onClose={onClose} title={isPending ? 'Duyệt yêu cầu' : 'Chi tiết yêu cầu'} size="lg">
      <div className="space-y-5">
        <div className="bg-surface-muted/60 rounded-xl p-4 space-y-3 border border-line">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h3 className="font-display font-semibold text-content text-lg">{request.studentName}</h3>
            <div className="flex items-center gap-2">
              <Badge color={request.requestType === 'CREATE' ? 'blue' : 'purple'}>{TYPE_LABEL[request.requestType]}</Badge>
              <Badge color={STATUS_COLOR[request.status]}>{STATUS_LABEL[request.status]}</Badge>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            <InfoTile label="GV đề xuất">{request.teacherName || '—'}</InfoTile>
            <InfoTile label="Kiểu bơi">Bơi {STYLE[request.swimStyle] || request.swimStyle || '—'}</InfoTile>
            <InfoTile label="Cam kết">{request.isGuaranteed ? 'Có cam kết' : 'Không'}</InfoTile>
            <InfoTile label="Tổng buổi">{defaultQuota} buổi {request.totalQuota ? '' : '(mặc định)'}</InfoTile>
            <InfoTile label="Ngày bắt đầu">{formatDisplayDate(defaultStart)} {request.startDate ? '' : '(mặc định)'}</InfoTile>
            <InfoTile label="Ngày hết hạn">{formatDisplayDate(defaultExpire)} {request.expireDate ? '' : '(mặc định)'}</InfoTile>
          </div>
          {request.note && (
            <div className="pt-1">
              <p className="text-xs text-content-subtle">Ghi chú GV</p>
              <p className="text-sm text-content bg-surface rounded-lg px-3 py-2 mt-1 border border-line">{request.note}</p>
            </div>
          )}
          {request.adminNote && !isPending && (
            <div className="pt-1">
              <p className="text-xs text-content-subtle">Ghi chú Admin</p>
              <p className="text-sm text-content bg-surface rounded-lg px-3 py-2 mt-1 border border-line">{request.adminNote}</p>
            </div>
          )}
        </div>

        {isPending ? (
          <form onSubmit={submit} className="space-y-4" noValidate>
            <Field label="Quyết định" required>
              <div className="flex gap-2" role="group" aria-label="Quyết định duyệt yêu cầu">
                <button
                  type="button"
                  aria-pressed={form.status === 'APPROVED'}
                  onClick={() => setForm({ ...form, status: 'APPROVED' })}
                  className={`flex-1 min-h-11 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all inline-flex items-center justify-center gap-1.5 ${form.status === 'APPROVED' ? 'bg-success-soft border-success/40 text-success-text shadow-sm' : 'border-line text-content-muted hover:bg-surface-muted'}`}
                >
                  <CheckCircle className="w-4 h-4" aria-hidden="true" /> Duyệt
                </button>
                <button
                  type="button"
                  aria-pressed={form.status === 'REJECTED'}
                  onClick={() => setForm({ ...form, status: 'REJECTED' })}
                  className={`flex-1 min-h-11 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all inline-flex items-center justify-center gap-1.5 ${form.status === 'REJECTED' ? 'bg-danger-soft border-danger/40 text-danger-text shadow-sm' : 'border-line text-content-muted hover:bg-surface-muted'}`}
                >
                  <XCircle className="w-4 h-4" aria-hidden="true" /> Từ chối
                </button>
              </div>
            </Field>

            <Field label="Ghi chú admin" hint="Ghi chú sẽ hiển thị cho giáo viên">
              <textarea value={form.adminNote} onChange={(e) => setForm({ ...form, adminNote: e.target.value })} className={inputCls} rows={2} placeholder="Ghi chú cho giáo viên..." />
            </Field>

            {form.status === 'APPROVED' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Field label="Tổng buổi" hint={`Mặc định: ${defaultQuota} buổi`} error={errors.totalQuota}>
                    <input type="number" min="1" value={form.totalQuota} onChange={(e) => { setForm({ ...form, totalQuota: e.target.value }); if (errors.totalQuota) setErrors({ ...errors, totalQuota: undefined }) }} className={inputCls} placeholder={String(defaultQuota)} />
                  </Field>
                  <Field label="Ngày bắt đầu" hint="Mặc định: Hôm nay">
                    <input
                      type="date"
                      value={form.startDate}
                      onChange={(e) => {
                        const val = e.target.value
                        setForm(f => ({ ...f, startDate: val, expireDate: val ? addDays(val, durationDays) : f.expireDate }))
                        if (errors.expireDate) setErrors(er => ({ ...er, expireDate: undefined }))
                      }}
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Ngày hết hạn" hint={`Mặc định: +${durationDays} ngày`} error={errors.expireDate}>
                    <input type="date" value={form.expireDate} min={form.startDate || undefined} onChange={(e) => { setForm({ ...form, expireDate: e.target.value }); if (errors.expireDate) setErrors({ ...errors, expireDate: undefined }) }} className={inputCls} />
                  </Field>
                </div>

                <TeacherPicker
                  selected={selectedTeachers}
                  onChange={handleTeachersChange}
                  required={request.requestType === 'CREATE'}
                  hint={request.requestType === 'UPDATE' ? 'Tag giáo viên hiện tại (thêm hoặc bấm X để xóa)' : 'Tag sẵn GV gửi yêu cầu (thêm hoặc bấm X để xóa)'}
                  error={errors.teacherIds}
                  placeholder="Tìm thêm giáo viên theo tên..."
                />
              </>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">Hủy</Button>
              <Button type="submit" loading={loading} variant={form.status === 'REJECTED' ? 'danger' : 'primary'} className="flex-1">
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
