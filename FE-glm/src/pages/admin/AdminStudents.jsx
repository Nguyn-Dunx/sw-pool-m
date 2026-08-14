import { useEffect, useState } from 'react'
import { Users, Plus, Search, Pencil, Trash2 } from 'lucide-react'
import { getStudents, createStudent, updateStudent, deleteStudent } from '../../lib/apiAdmin'
import { Button, Badge, Spinner, EmptyState, Pagination, Modal, Field, inputCls } from '../../components/ui'
import { toast } from '../../components/ui/Toast'
import { errMsg } from '../../lib/api'
import { useDebounce } from '../../lib/useDebounce'

const SOURCE_LABEL = { POOL: 'Tự đến', TEACHER: 'GV giới thiệu' }
const SOURCE_COLOR = { POOL: 'blue', TEACHER: 'purple' }

export default function AdminStudents() {
  const [list, setList] = useState({ content: [], totalElements: 0, totalPages: 0, currentPage: 1, pageSize: 10 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)

  const debouncedSearch = useDebounce(search, 350)

  const load = () => {
    setLoading(true)
    getStudents({ studentName: debouncedSearch, page, size: 10 })
      .then(setList)
      .catch((e) => toast.error(errMsg(e)))
      .finally(() => setLoading(false))
  }

  useEffect(() => { setPage(1) }, [debouncedSearch])
  useEffect(() => { load() }, [debouncedSearch, page])

  const handleDelete = async (id, name) => {
    if (!confirm(`Xóa học viên "${name}"? Hành động này không thể hoàn tác.`)) return
    try {
      await deleteStudent(id)
      toast.success('Đã xóa học viên')
      load()
    } catch (e) { toast.error(errMsg(e)) }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-ink-900 tracking-tight">Học viên</h1>
          <p className="text-sm text-ink-500 mt-1">Quản lý danh sách học viên</p>
        </div>
        <Button onClick={() => { setEditing(null); setShowForm(true) }}><Plus className="w-4 h-4" /> Thêm học viên</Button>
      </div>

      <div className="bg-white rounded-2xl border border-ink-100/60 p-4 animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
          <input
            placeholder="Tìm theo tên hoặc SĐT..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={inputCls + ' pl-10'}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-ink-100/60 overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        {loading ? <Spinner className="py-20" size={32} /> : list.content.length === 0 ? (
          <EmptyState icon={Users} title="Chưa có học viên" description="Thêm học viên đầu tiên cho hệ thống." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-ink-50/80 text-ink-500 text-left">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Họ tên</th>
                    <th className="px-4 py-3 font-semibold">SĐT</th>
                    <th className="px-4 py-3 font-semibold hidden sm:table-cell">Ngày sinh</th>
                    <th className="px-4 py-3 font-semibold">Nguồn</th>
                    <th className="px-4 py-3 font-semibold text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100/60">
                  {list.content.map((s) => (
                    <tr key={s.id} className="hover:bg-pool-50/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-ink-800">{s.fullName}</td>
                      <td className="px-4 py-3 text-ink-600">{s.phoneNumber}</td>
                      <td className="px-4 py-3 text-ink-600 hidden sm:table-cell">{s.dob || '—'}</td>
                      <td className="px-4 py-3">
                        <Badge color={SOURCE_COLOR[s.sourceType] || 'gray'}>
                          {SOURCE_LABEL[s.sourceType] || s.sourceType || '—'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => { setEditing(s); setShowForm(true) }} className="p-1.5 rounded-lg text-pool-600 hover:bg-pool-50 transition-colors"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(s.id, s.fullName)} className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"><Trash2 className="w-4 h-4" /></button>
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

      {showForm && <StudentForm student={editing} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load() }} />}
    </div>
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
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()

    const trimmedName = form.fullName.trim()
    if (!trimmedName) {
      toast.error('Vui lòng nhập họ tên học viên')
      return
    }
    if (trimmedName.length > 100) {
      toast.error('Họ tên không được vượt quá 100 ký tự')
      return
    }

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

    if (!form.dob) {
      toast.error('Vui lòng chọn ngày sinh')
      return
    }
    if (new Date(form.dob) >= new Date()) {
      toast.error('Ngày sinh phải là ngày trong quá khứ')
      return
    }

    setLoading(true)
    try {
      if (isEdit) {
        const { password, ...body } = form
        body.fullName = trimmedName
        body.phoneNumber = trimmedPhone
        await updateStudent(student.id, body)
        toast.success('Cập nhật học viên thành công')
      } else {
        const body = {
          fullName: trimmedName,
          phoneNumber: trimmedPhone,
          dob: form.dob,
          sourceType: form.sourceType
        }
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
        <Field label="Số điện thoại" required hint="Định dạng: 0xxxxxxxxx (10 số)">
          <input
            type="tel"
            value={form.phoneNumber}
            onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
            className={inputCls}
            placeholder="0912345678"
            required
          />
        </Field>
        <Field label="Ngày sinh" required>
          <input
            type="date"
            value={form.dob}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setForm({ ...form, dob: e.target.value })}
            className={inputCls}
            required
          />
        </Field>
        <Field label="Nguồn học viên" required hint="Học viên tự đến bể hoặc do giáo viên giới thiệu">
          <select value={form.sourceType} onChange={(e) => setForm({ ...form, sourceType: e.target.value })} className={inputCls} required>
            <option value="POOL">Tự đến bể (POOL)</option>
            <option value="TEACHER">Giáo viên giới thiệu (TEACHER)</option>
          </select>
        </Field>
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
