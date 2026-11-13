import { useEffect, useState } from 'react'
import { UserCircle, Plus, Pencil, Trash2 } from 'lucide-react'
import { getTeachers, createTeacher, updateTeacher, deleteTeacher, exportTeachers } from '../../lib/apiAdmin'
import { Button, Badge, EmptyState, ErrorState, TableSkeleton, Pagination, Modal, ConfirmDialog, Field, inputCls, ColumnHeaderFilter, ActiveFilterChips, ExportButton, IconButton, PageHeader } from '../../components/ui'
import { useClientSort, SortHeader, SortScopeNote } from '../../components/ui/Sort'
import { PageTransition } from '../../components/motion/Motion'
import { toast } from '../../components/ui/Toast'
import { errMsg } from '../../lib/api'
import { useDebounce } from '../../lib/useDebounce'
import { downloadFile } from '../../lib/fileDownload'
import { getTodayDate } from '../../lib/dateUtils'

const STATUS_LABEL = { ACTIVE: 'Hoạt động', INACTIVE: 'Ngừng hoạt động' }

export default function AdminTeachers() {
  const [list, setList] = useState({ content: [], totalElements: 0, totalPages: 0, currentPage: 1, pageSize: 10 })
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const debouncedSearch = useDebounce(search, 350)

  const load = () => {
    setLoading(true)
    setLoadError(null)
    getTeachers({ teacherName: debouncedSearch, status: status || undefined, page, size: 10 })
      .then(setList)
      .catch((e) => { setLoadError(e); toast.error(errMsg(e)) })
      .finally(() => setLoading(false))
  }

  const handleExport = () => downloadFile(
    () => exportTeachers({ teacherName: debouncedSearch, status: status || undefined }),
    `Danh_Sach_Giao_Vien_${getTodayDate()}.xlsx`
  )

  useEffect(() => { setPage(1) }, [debouncedSearch, status])
  useEffect(() => { load() }, [debouncedSearch, status, page])

  const teachers = list.content || []
  const { sorted, sortKey, sortDir, toggleSort } = useClientSort(teachers)
  const hasAnyFilter = Boolean(search || status)

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteTeacher(deleteTarget.id)
      toast.success('Đã xóa giáo viên')
      setDeleteTarget(null)
      load()
    } catch (e) {
      toast.error(errMsg(e))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <PageTransition className="space-y-4">
      <PageHeader
        title="Giáo viên"
        description="Quản lý danh sách giáo viên — lọc trực tiếp trên từng cột"
        actions={<>
          <ExportButton onExport={handleExport} />
          <Button onClick={() => { setEditing(null); setShowForm(true) }}><Plus className="w-4 h-4" aria-hidden="true" /> Thêm giáo viên</Button>
        </>}
      />

      <ActiveFilterChips
        filters={[
          { label: 'Họ tên / SĐT', value: search, onRemove: () => setSearch('') },
          { label: 'Trạng thái', value: status, displayValue: STATUS_LABEL[status], onRemove: () => setStatus('') },
        ]}
        onClearAll={() => { setSearch(''); setStatus('') }}
      />

      <div className="bg-surface rounded-2xl border border-line shadow-card overflow-hidden" data-stagger>
        {loading ? <TableSkeleton rows={6} cols={4} className="border-0 shadow-none rounded-none" /> : loadError ? (
          <ErrorState onRetry={load} />
        ) : teachers.length === 0 ? (
          <EmptyState
            icon={UserCircle}
            title={hasAnyFilter ? 'Không tìm thấy giáo viên phù hợp' : 'Chưa có giáo viên'}
            description={hasAnyFilter ? 'Không có giáo viên nào khớp với bộ lọc đã chọn.' : 'Thêm giáo viên đầu tiên cho hệ thống.'}
            action={hasAnyFilter ? <Button variant="secondary" size="sm" onClick={() => { setSearch(''); setStatus('') }}>Xóa tất cả bộ lọc</Button> : null}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-muted/60 text-content-muted text-left border-b border-line">
                  <tr>
                    <th className="px-4 py-2">
                      <ColumnHeaderFilter label="Họ tên" type="search" value={search} onChange={setSearch} placeholder="Tìm tên hoặc SĐT..." />
                    </th>
                    <th className="px-4 py-2 font-semibold text-content-muted">SĐT</th>
                    <th className="px-4 py-2 hidden sm:table-cell" aria-sort={sortKey === 'specialty' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}>
                      <SortHeader label="Chuyên môn" sortKey="specialty" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
                    </th>
                    <th className="px-4 py-2">
                      <ColumnHeaderFilter label="Trạng thái" type="select" value={status} onChange={setStatus}
                        options={[
                          { value: 'ACTIVE', label: 'Hoạt động', badgeColor: 'green' },
                          { value: 'INACTIVE', label: 'Ngừng hoạt động', badgeColor: 'gray' },
                        ]} />
                    </th>
                    <th className="px-4 py-2 font-semibold text-content-muted text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/70">
                  {sorted.map((t) => (
                    <tr key={t.id} className="hover:bg-primary-soft/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-content">{t.fullName}</td>
                      <td className="px-4 py-3 text-content-muted whitespace-nowrap">{t.phoneNumber}</td>
                      <td className="px-4 py-3 text-content-muted hidden sm:table-cell">{t.specialty || '—'}</td>
                      <td className="px-4 py-3">
                        <Badge color={t.status === 'ACTIVE' ? 'green' : 'gray'}>{STATUS_LABEL[t.status] || t.status || '—'}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <IconButton label={`Sửa giáo viên ${t.fullName}`} tone="primary" onClick={() => { setEditing(t); setShowForm(true) }}>
                            <Pencil className="w-4 h-4" aria-hidden="true" />
                          </IconButton>
                          <IconButton label={`Xóa giáo viên ${t.fullName}`} tone="danger" onClick={() => setDeleteTarget({ id: t.id, name: t.fullName })}>
                            <Trash2 className="w-4 h-4" aria-hidden="true" />
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
                <p className="text-xs text-content-subtle">Tổng {list.totalElements || 0} giáo viên</p>
                <SortScopeNote active={Boolean(sortKey)} />
              </div>
              <Pagination page={list.currentPage} totalPages={list.totalPages} onChange={setPage} />
            </div>
          </>
        )}
      </div>

      {showForm && <TeacherForm teacher={editing} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load() }} />}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        danger
        title="Xóa giáo viên"
        confirmLabel="Xóa giáo viên"
        message={`Xóa giáo viên "${deleteTarget?.name || ''}"? Hành động này không thể hoàn tác.`}
      />
    </PageTransition>
  )
}

function TeacherForm({ teacher, onClose, onSaved }) {
  const isEdit = !!teacher
  const [form, setForm] = useState({
    fullName: teacher?.fullName || '',
    phoneNumber: teacher?.phoneNumber || '',
    password: '',
    specialty: teacher?.specialty || '',
    status: teacher?.status || 'ACTIVE'
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const set = (key) => (e) => {
    setForm({ ...form, [key]: e.target.value })
    if (errors[key]) setErrors({ ...errors, [key]: undefined })
  }

  const submit = async (e) => {
    e.preventDefault()
    const next = {}
    const trimmedName = form.fullName.trim()
    if (!trimmedName) next.fullName = 'Vui lòng nhập họ tên giáo viên'
    else if (trimmedName.length > 100) next.fullName = 'Họ tên không được vượt quá 100 ký tự'

    if (!isEdit) {
      const trimmedPhone = form.phoneNumber.trim()
      const phoneRegex = /^(0|\+84)[3|5|7|8|9][0-9]{8}$/
      if (!trimmedPhone) next.phoneNumber = 'Vui lòng nhập số điện thoại'
      else if (!phoneRegex.test(trimmedPhone)) next.phoneNumber = 'SĐT không hợp lệ (10 chữ số, ví dụ 0912345678 hoặc +84912345678)'

      if (!form.password) next.password = 'Vui lòng nhập mật khẩu'
      else if (form.password.length < 6) next.password = 'Mật khẩu phải có tối thiểu 6 ký tự'
      else if (form.password.length > 50) next.password = 'Mật khẩu không được vượt quá 50 ký tự'
    }

    const trimmedSpecialty = form.specialty ? form.specialty.trim() : ''
    if (trimmedSpecialty.length > 100) next.specialty = 'Chuyên môn không được vượt quá 100 ký tự'

    setErrors(next)
    if (Object.keys(next).length > 0) return

    setLoading(true)
    try {
      if (isEdit) {
        const body = { fullName: trimmedName, specialty: trimmedSpecialty || undefined, status: form.status }
        await updateTeacher(teacher.id, body)
        toast.success('Cập nhật giáo viên thành công')
      } else {
        const body = { fullName: trimmedName, phoneNumber: form.phoneNumber.trim(), password: form.password, specialty: trimmedSpecialty || undefined }
        await createTeacher(body)
        toast.success('Thêm giáo viên thành công')
      }
      onSaved()
    } catch (e) {
      toast.error(errMsg(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open onClose={onClose} title={isEdit ? 'Sửa giáo viên' : 'Thêm giáo viên'}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Họ tên" required error={errors.fullName}>
          <input value={form.fullName} onChange={set('fullName')} className={inputCls} placeholder="Nguyễn Văn A" maxLength={100} autoComplete="name" />
        </Field>
        <Field label="Số điện thoại" required hint={isEdit ? 'Số điện thoại không thể thay đổi' : 'Định dạng: 0xxxxxxxxx (10 số)'} error={errors.phoneNumber}>
          <input
            type="tel"
            value={form.phoneNumber}
            onChange={set('phoneNumber')}
            className={`${inputCls} ${isEdit ? 'bg-surface-muted text-content-subtle cursor-not-allowed' : ''}`}
            placeholder="0912345678"
            autoComplete="tel"
            disabled={isEdit}
          />
        </Field>
        {!isEdit && (
          <Field label="Mật khẩu" required hint="Tối thiểu 6 ký tự, tối đa 50 ký tự" error={errors.password}>
            <input type="password" value={form.password} onChange={set('password')} className={inputCls} placeholder="••••••••" minLength={6} maxLength={50} autoComplete="new-password" />
          </Field>
        )}
        <Field label="Chuyên môn" hint="VD: Bơi ếch, bơi sải, bơi ngửa..." error={errors.specialty}>
          <input value={form.specialty} onChange={set('specialty')} className={inputCls} placeholder="Bơi ếch, bơi sải" maxLength={100} />
        </Field>
        {isEdit && (
          <Field label="Trạng thái" required>
            <select value={form.status} onChange={set('status')} className={inputCls}>
              <option value="ACTIVE">Hoạt động</option>
              <option value="INACTIVE">Ngừng hoạt động</option>
            </select>
          </Field>
        )}
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">Hủy</Button>
          <Button type="submit" loading={loading} className="flex-1">{loading ? 'Đang lưu...' : 'Lưu'}</Button>
        </div>
      </form>
    </Modal>
  )
}
