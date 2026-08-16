import { useEffect, useState } from 'react'
import { UserCircle, Plus, Search, Pencil, Trash2 } from 'lucide-react'
import { getTeachers, createTeacher, updateTeacher, deleteTeacher } from '../../lib/apiAdmin'
import { Button, Badge, Spinner, EmptyState, Pagination, Modal, Field, inputCls, ColumnHeaderFilter, ActiveFilterChips } from '../../components/ui'
import { toast } from '../../components/ui/Toast'
import { errMsg } from '../../lib/api'
import { useDebounce } from '../../lib/useDebounce'

export default function AdminTeachers() {
  const [list, setList] = useState({ content: [], totalElements: 0, totalPages: 0, currentPage: 1, pageSize: 10 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)

  const debouncedSearch = useDebounce(search, 350)

  const load = () => {
    setLoading(true)
    getTeachers({ teacherName: debouncedSearch, status: status || undefined, page, size: 10 })
      .then(setList)
      .catch((e) => toast.error(errMsg(e)))
      .finally(() => setLoading(false))
  }

  useEffect(() => { setPage(1) }, [debouncedSearch, status])
  useEffect(() => { load() }, [debouncedSearch, status, page])

  const teachers = list.content || []
  const hasAnyFilter = Boolean(search || status)

  const handleDelete = async (id, name) => {
    if (!confirm(`Xóa giáo viên "${name}"?`)) return
    try {
      await deleteTeacher(id)
      toast.success('Đã xóa giáo viên')
      load()
    } catch (e) { toast.error(errMsg(e)) }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-ink-900 tracking-tight">Giáo viên</h1>
          <p className="text-sm text-ink-500 mt-1">Quản lý danh sách giáo viên — Lọc trực tiếp trên từng cột</p>
        </div>
        <Button onClick={() => { setEditing(null); setShowForm(true) }}><Plus className="w-4 h-4" /> Thêm giáo viên</Button>
      </div>

      {/* Thanh hiển thị các bộ lọc đang kích hoạt */}
      <ActiveFilterChips
        filters={[
          { label: 'Họ tên / SĐT', value: search, onRemove: () => setSearch('') },
          { label: 'Trạng thái', value: status, displayValue: status === 'ACTIVE' ? 'Hoạt động' : status === 'INACTIVE' ? 'Ngừng hoạt động' : '', onRemove: () => setStatus('') },
        ]}
        onClearAll={() => {
          setSearch('')
          setStatus('')
        }}
      />

      <div className="bg-white rounded-2xl border border-ink-100/60 overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
        {loading ? <Spinner className="py-20" size={32} /> : teachers.length === 0 ? (
          <EmptyState
            icon={UserCircle}
            title={hasAnyFilter ? 'Không tìm thấy giáo viên phù hợp' : 'Chưa có giáo viên'}
            description={hasAnyFilter ? 'Không có giáo viên nào khớp với bộ lọc đã chọn.' : 'Thêm giáo viên đầu tiên cho hệ thống.'}
            action={hasAnyFilter ? (
              <Button variant="secondary" size="sm" onClick={() => { setSearch(''); setStatus('') }}>
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
                        label="Họ tên"
                        type="search"
                        value={search}
                        onChange={setSearch}
                        placeholder="Tìm tên hoặc SĐT..."
                      />
                    </th>
                    <th className="px-4 py-3 font-semibold text-ink-600">SĐT</th>
                    <th className="px-4 py-3 font-semibold text-ink-600 hidden sm:table-cell">Chuyên môn</th>
                    <th className="px-4 py-3">
                      <ColumnHeaderFilter
                        label="Trạng thái"
                        type="select"
                        value={status}
                        onChange={setStatus}
                        options={[
                          { value: 'ACTIVE', label: 'Hoạt động', badgeColor: 'green' },
                          { value: 'INACTIVE', label: 'Ngừng hoạt động', badgeColor: 'gray' },
                        ]}
                      />
                    </th>
                    <th className="px-4 py-3 font-semibold text-ink-600 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100/60">
                  {teachers.map((t) => (
                    <tr key={t.id} className="hover:bg-pool-50/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-ink-800">{t.fullName}</td>
                      <td className="px-4 py-3 text-ink-600">{t.phoneNumber}</td>
                      <td className="px-4 py-3 text-ink-600 hidden sm:table-cell">{t.specialty || '—'}</td>
                      <td className="px-4 py-3">
                        <Badge color={t.status === 'ACTIVE' ? 'green' : 'gray'}>
                          {t.status === 'ACTIVE' ? 'Hoạt động' : 'Ngừng'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => { setEditing(t); setShowForm(true) }} className="p-1.5 rounded-lg text-pool-600 hover:bg-pool-50 transition-colors"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(t.id, t.fullName)} className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-ink-100/60">
              <p className="text-xs text-ink-400 mb-3">Tổng {list.totalElements || 0} giáo viên</p>
              <Pagination page={list.currentPage} totalPages={list.totalPages} onChange={setPage} />
            </div>
          </>
        )}
      </div>

      {showForm && <TeacherForm teacher={editing} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load() }} />}
    </div>
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
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()

    const trimmedName = form.fullName.trim()
    if (!trimmedName) {
      toast.error('Vui lòng nhập họ tên giáo viên')
      return
    }
    if (trimmedName.length > 100) {
      toast.error('Họ tên không được vượt quá 100 ký tự')
      return
    }

    if (!isEdit) {
      const trimmedPhone = form.phoneNumber.trim()
      if (!trimmedPhone) {
        toast.error('Vui lòng nhập số điện thoại')
        return
      }
      const phoneRegex = /^(0|\+84)[3|5|7|8|9][0-9]{8}$/
      if (!phoneRegex.test(trimmedPhone)) {
        toast.error('Số điện thoại không hợp lệ (10 chữ số, ví dụ 0912345678 hoặc +84912345678)')
        return
      }

      if (!form.password) {
        toast.error('Vui lòng nhập mật khẩu')
        return
      }
      if (form.password.length < 6) {
        toast.error('Mật khẩu phải có tối thiểu 6 ký tự')
        return
      }
      if (form.password.length > 50) {
        toast.error('Mật khẩu không được vượt quá 50 ký tự')
        return
      }
    }

    const trimmedSpecialty = form.specialty ? form.specialty.trim() : ''
    if (trimmedSpecialty.length > 100) {
      toast.error('Chuyên môn không được vượt quá 100 ký tự')
      return
    }

    setLoading(true)
    try {
      if (isEdit) {
        const body = {
          fullName: trimmedName,
          specialty: trimmedSpecialty || undefined,
          status: form.status
        }
        await updateTeacher(teacher.id, body)
        toast.success('Cập nhật giáo viên thành công')
      } else {
        const body = {
          fullName: trimmedName,
          phoneNumber: form.phoneNumber.trim(),
          password: form.password,
          specialty: trimmedSpecialty || undefined
        }
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
      <form onSubmit={submit} className="space-y-4">
        <Field label="Họ tên" required>
          <input
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            className={inputCls}
            placeholder="Nguyễn Văn A"
            maxLength={100}
            required
          />
        </Field>
        <Field label="Số điện thoại" required hint={isEdit ? 'Số điện thoại không thể thay đổi' : 'Định dạng: 0xxxxxxxxx (10 số)'}>
          <input
            type="tel"
            value={form.phoneNumber}
            onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
            className={`${inputCls} ${isEdit ? 'bg-ink-50 text-ink-500 cursor-not-allowed' : ''}`}
            placeholder="0912345678"
            required
            disabled={isEdit}
          />
        </Field>
        {!isEdit && (
          <Field label="Mật khẩu" required hint="Tối thiểu 6 ký tự, tối đa 50 ký tự">
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className={inputCls}
              placeholder="••••••••"
              minLength={6}
              maxLength={50}
              required
            />
          </Field>
        )}
        <Field label="Chuyên môn" hint="VD: Bơi ếch, bơi sải, bơi ngửa...">
          <input
            value={form.specialty}
            onChange={(e) => setForm({ ...form, specialty: e.target.value })}
            className={inputCls}
            placeholder="Bơi ếch, bơi sải"
            maxLength={100}
          />
        </Field>
        {isEdit && (
          <Field label="Trạng thái" required>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inputCls}>
              <option value="ACTIVE">Hoạt động</option>
              <option value="INACTIVE">Ngừng hoạt động</option>
            </select>
          </Field>
        )}
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            Hủy
          </Button>
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? 'Đang lưu...' : 'Lưu'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
