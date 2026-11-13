import { useEffect, useState } from 'react'
import { Users, Plus, Pencil, Trash2 } from 'lucide-react'
import { getStudents, createStudent, updateStudent, deleteStudent, exportStudents } from '../../lib/apiAdmin'
import { Button, Badge, EmptyState, ErrorState, TableSkeleton, Pagination, Modal, ConfirmDialog, Field, inputCls, ColumnHeaderFilter, ActiveFilterChips, ExportButton, IconButton, PageHeader } from '../../components/ui'
import { useClientSort, SortHeader, SortScopeNote } from '../../components/ui/Sort'
import { PageTransition } from '../../components/motion/Motion'
import { toast } from '../../components/ui/Toast'
import { errMsg } from '../../lib/api'
import { useDebounce } from '../../lib/useDebounce'
import { downloadFile } from '../../lib/fileDownload'
import { getTodayDate, formatDisplayDate } from '../../lib/dateUtils'

const SOURCE_LABEL = { POOL: 'Tự đến', TEACHER: 'GV giới thiệu' }
const SOURCE_COLOR = { POOL: 'blue', TEACHER: 'purple' }

export default function AdminStudents() {
  const [list, setList] = useState({ content: [], totalElements: 0, totalPages: 0, currentPage: 1, pageSize: 10 })
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [search, setSearch] = useState('')
  const [sourceType, setSourceType] = useState('')
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const debouncedSearch = useDebounce(search, 350)

  const load = () => {
    setLoading(true)
    setLoadError(null)
    getStudents({ studentName: debouncedSearch, sourceType: sourceType || undefined, page, size: 10 })
      .then(setList)
      .catch((e) => { setLoadError(e); toast.error(errMsg(e)) })
      .finally(() => setLoading(false))
  }

  const handleExport = () => downloadFile(
    () => exportStudents({ studentName: debouncedSearch, sourceType: sourceType || undefined }),
    `Danh_Sach_Hoc_Vien_${getTodayDate()}.xlsx`
  )

  useEffect(() => { setPage(1) }, [debouncedSearch, sourceType])
  useEffect(() => { load() }, [debouncedSearch, sourceType, page])

  const students = list.content || []
  const { sorted, sortKey, sortDir, toggleSort } = useClientSort(students)
  const hasAnyFilter = Boolean(search || sourceType)

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteStudent(deleteTarget.id)
      toast.success('Đã xóa học viên')
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
        title="Học viên"
        description="Quản lý danh sách học viên — lọc trực tiếp trên từng cột"
        actions={<>
          <ExportButton onExport={handleExport} />
          <Button onClick={() => { setEditing(null); setShowForm(true) }}><Plus className="w-4 h-4" aria-hidden="true" /> Thêm học viên</Button>
        </>}
      />

      <ActiveFilterChips
        filters={[
          { label: 'Họ tên / SĐT', value: search, onRemove: () => setSearch('') },
          { label: 'Nguồn', value: sourceType, displayValue: SOURCE_LABEL[sourceType], onRemove: () => setSourceType('') },
        ]}
        onClearAll={() => { setSearch(''); setSourceType('') }}
      />

      <div className="bg-surface rounded-2xl border border-line shadow-card overflow-hidden" data-stagger>
        {loading ? <TableSkeleton rows={6} cols={4} className="border-0 shadow-none rounded-none" /> : loadError ? (
          <ErrorState onRetry={load} />
        ) : students.length === 0 ? (
          <EmptyState
            icon={Users}
            title={hasAnyFilter ? 'Không tìm thấy học viên phù hợp' : 'Chưa có học viên'}
            description={hasAnyFilter ? 'Không có học viên nào khớp với bộ lọc đã chọn.' : 'Thêm học viên đầu tiên cho hệ thống.'}
            action={hasAnyFilter ? <Button variant="secondary" size="sm" onClick={() => { setSearch(''); setSourceType('') }}>Xóa tất cả bộ lọc</Button> : null}
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
                    <th className="px-4 py-2 hidden sm:table-cell" aria-sort={sortKey === 'dob' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}>
                      <SortHeader label="Ngày sinh" sortKey="dob" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
                    </th>
                    <th className="px-4 py-2">
                      <ColumnHeaderFilter label="Nguồn" type="select" value={sourceType} onChange={setSourceType}
                        options={[
                          { value: 'POOL', label: 'Tự đến', badgeColor: 'blue' },
                          { value: 'TEACHER', label: 'GV giới thiệu', badgeColor: 'purple' },
                        ]} />
                    </th>
                    <th className="px-4 py-2 font-semibold text-content-muted text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/70">
                  {sorted.map((s) => (
                    <tr key={s.id} className="hover:bg-primary-soft/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-content">{s.fullName}</td>
                      <td className="px-4 py-3 text-content-muted whitespace-nowrap">{s.phoneNumber}</td>
                      <td className="px-4 py-3 text-content-muted hidden sm:table-cell whitespace-nowrap">{formatDisplayDate(s.dob)}</td>
                      <td className="px-4 py-3">
                        <Badge color={SOURCE_COLOR[s.sourceType] || 'gray'}>{SOURCE_LABEL[s.sourceType] || s.sourceType || '—'}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <IconButton label={`Sửa học viên ${s.fullName}`} tone="primary" onClick={() => { setEditing(s); setShowForm(true) }}>
                            <Pencil className="w-4 h-4" aria-hidden="true" />
                          </IconButton>
                          <IconButton label={`Xóa học viên ${s.fullName}`} tone="danger" onClick={() => setDeleteTarget({ id: s.id, name: s.fullName })}>
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
                <p className="text-xs text-content-subtle">Tổng {list.totalElements || 0} học viên</p>
                <SortScopeNote active={Boolean(sortKey)} />
              </div>
              <Pagination page={list.currentPage} totalPages={list.totalPages} onChange={setPage} />
            </div>
          </>
        )}
      </div>

      {showForm && <StudentForm student={editing} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load() }} />}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        danger
        title="Xóa học viên"
        confirmLabel="Xóa học viên"
        message={`Xóa học viên "${deleteTarget?.name || ''}"? Hành động này không thể hoàn tác.`}
      />
    </PageTransition>
  )
}

function StudentForm({ student, onClose, onSaved }) {
  const isEdit = !!student
  const [form, setForm] = useState({
    fullName: student?.fullName || '',
    phoneNumber: student?.phoneNumber || '',
    password: '',
    dob: student?.dob || '',
    sourceType: student?.sourceType || 'POOL'
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
    if (!trimmedName) next.fullName = 'Vui lòng nhập họ tên học viên'
    else if (trimmedName.length > 100) next.fullName = 'Họ tên không được vượt quá 100 ký tự'

    const trimmedPhone = form.phoneNumber.trim()
    const phoneRegex = /^(0|\+84)[3|5|7|8|9][0-9]{8}$/
    if (!trimmedPhone) next.phoneNumber = 'Vui lòng nhập số điện thoại'
    else if (!phoneRegex.test(trimmedPhone)) next.phoneNumber = 'SĐT không hợp lệ (10 chữ số, ví dụ 0912345678 hoặc +84912345678)'

    if (!form.dob) next.dob = 'Vui lòng chọn ngày sinh'
    else if (new Date(form.dob) >= new Date()) next.dob = 'Ngày sinh phải là ngày trong quá khứ'

    setErrors(next)
    if (Object.keys(next).length > 0) return

    setLoading(true)
    try {
      if (isEdit) {
        const { password, ...body } = form
        body.fullName = trimmedName
        body.phoneNumber = trimmedPhone
        await updateStudent(student.id, body)
        toast.success('Cập nhật học viên thành công')
      } else {
        const body = { fullName: trimmedName, phoneNumber: trimmedPhone, dob: form.dob, sourceType: form.sourceType }
        await createStudent(body)
        toast.success('Thêm học viên thành công')
      }
      onSaved()
    } catch (e) {
      toast.error(errMsg(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open onClose={onClose} title={isEdit ? 'Sửa học viên' : 'Thêm học viên'}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Họ tên" required error={errors.fullName}>
          <input value={form.fullName} onChange={set('fullName')} className={inputCls} placeholder="Nguyễn Văn A" maxLength={100} autoComplete="name" />
        </Field>
        <Field label="Số điện thoại" required hint="Định dạng: 0xxxxxxxxx (10 số)" error={errors.phoneNumber}>
          <input type="tel" value={form.phoneNumber} onChange={set('phoneNumber')} className={inputCls} placeholder="0912345678" autoComplete="tel" />
        </Field>
        <Field label="Ngày sinh" required error={errors.dob}>
          <input type="date" value={form.dob} max={getTodayDate()} onChange={set('dob')} className={inputCls} />
        </Field>
        <Field label="Nguồn học viên" required hint="Học viên tự đến bể hoặc do giáo viên giới thiệu">
          <select value={form.sourceType} onChange={set('sourceType')} className={inputCls}>
            <option value="POOL">Tự đến bể</option>
            <option value="TEACHER">Giáo viên giới thiệu</option>
          </select>
        </Field>
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">Hủy</Button>
          <Button type="submit" loading={loading} className="flex-1">{loading ? 'Đang lưu...' : 'Lưu'}</Button>
        </div>
      </form>
    </Modal>
  )
}