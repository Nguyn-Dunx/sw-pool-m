import { useEffect, useState, useMemo } from 'react'
import { Settings, Save, RotateCcw, RefreshCw, Calendar, Clock, BookOpen, ShieldAlert, Check } from 'lucide-react'
import { getSettings, updateSetting } from '../../lib/apiAdmin'
import { fetchSystemSettings } from '../../lib/settings'
import { Button, Spinner, ErrorState, Skeleton, inputCls, IconButton } from '../../components/ui'
import { PageTransition } from '../../components/motion/Motion'
import { toast } from '../../components/ui/Toast'
import { errMsg } from '../../lib/api'

const SETTING_DEFINITIONS = {
  'enrollment.duration-days': {
    title: 'Thời hạn khóa học mặc định',
    unit: 'ngày',
    icon: Calendar,
    type: 'number',
    min: 1,
    hint: 'Số ngày hiệu lực tính từ ngày bắt đầu khóa học.',
    category: 'course'
  },
  'enrollment.default-quota': {
    title: 'Số buổi học mặc định',
    unit: 'buổi',
    icon: BookOpen,
    type: 'number',
    min: 1,
    hint: 'Số buổi bơi tiêu chuẩn được cấp khi tạo một khóa học mới.',
    category: 'course'
  },
  'alert.expire-threshold-days': {
    title: 'Ngưỡng cảnh báo sắp hết hạn',
    unit: 'ngày',
    icon: Clock,
    type: 'number',
    min: 1,
    hint: 'Hệ thống sẽ gửi cảnh báo khi khóa học còn dưới số ngày này.',
    category: 'alerts'
  },
  'alert.absent-threshold-days': {
    title: 'Ngưỡng cảnh báo học viên vắng mặt',
    unit: 'ngày',
    icon: ShieldAlert,
    type: 'number',
    min: 1,
    hint: 'Hệ thống sẽ cảnh báo khi học viên không đi học quá số ngày này.',
    category: 'alerts'
  }
}

const CATEGORY_GROUPS = [
  {
    id: 'course',
    title: 'Cấu hình Khóa học',
    description: 'Các tham số mặc định áp dụng khi tạo hoặc duyệt khóa học bơi',
    keys: ['enrollment.duration-days', 'enrollment.default-quota']
  },
  {
    id: 'alerts',
    title: 'Cảnh báo & Điểm danh',
    description: 'Các ngưỡng kích hoạt cảnh báo tự động cho giáo viên và quản trị viên',
    keys: ['alert.expire-threshold-days', 'alert.absent-threshold-days']
  }
]

export default function AdminSettings() {
  const [settingsMap, setSettingsMap] = useState({})
  const [editValues, setEditValues] = useState({})
  const [savedKeys, setSavedKeys] = useState({})
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [savingKey, setSavingKey] = useState(null)
  const [savingAll, setSavingAll] = useState(false)

  const load = () => {
    setLoading(true)
    setLoadError(null)
    getSettings()
      .then((list) => {
        const map = {}
        const edits = {}
        if (Array.isArray(list)) {
          list.forEach((item) => {
            if (item && item.settingKey) {
              map[item.settingKey] = item
              edits[item.settingKey] = item.settingValue ?? ''
            }
          })
        }
        setSettingsMap(map)
        setEditValues(edits)
      })
      .catch((e) => { setLoadError(e); toast.error(errMsg(e)) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleInputChange = (key, val) => {
    setEditValues((prev) => ({ ...prev, [key]: val }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const handleReset = (key) => {
    const original = settingsMap[key]?.settingValue ?? ''
    setEditValues((prev) => ({ ...prev, [key]: original }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const validate = (key, newValue) => {
    if (newValue === undefined || newValue === '') return 'Giá trị không được để trống'
    const def = SETTING_DEFINITIONS[key]
    if (def?.type === 'number') {
      const num = Number(newValue)
      if (isNaN(num) || num < (def.min ?? 1)) return `Giá trị phải là số lớn hơn hoặc bằng ${def.min ?? 1}`
    }
    return null
  }

  const handleSaveItem = async (key) => {
    const original = settingsMap[key]
    const newValue = editValues[key]?.trim()
    const err = validate(key, newValue)
    if (err) {
      setErrors((prev) => ({ ...prev, [key]: err }))
      return
    }

    const def = SETTING_DEFINITIONS[key]
    setSavingKey(key)
    try {
      const updated = await updateSetting(key, { value: newValue })
      setSettingsMap((prev) => ({
        ...prev,
        [key]: {
          ...(prev[key] || {}),
          settingValue: updated?.settingValue ?? newValue,
          updatedAt: updated?.updatedAt ?? new Date().toISOString()
        }
      }))
      setEditValues((prev) => ({ ...prev, [key]: updated?.settingValue ?? newValue }))
      setSavedKeys((prev) => ({ ...prev, [key]: true }))
      setTimeout(() => setSavedKeys((prev) => ({ ...prev, [key]: false })), 2500)
      fetchSystemSettings(true)
      toast.success(`Đã lưu: ${def?.title || original?.description || key}`)
    } catch (e) {
      toast.error(errMsg(e))
    } finally {
      setSavingKey(null)
    }
  }

  const dirtyKeys = useMemo(() => {
    return Object.keys(editValues).filter((key) => {
      const original = settingsMap[key]?.settingValue ?? ''
      return editValues[key] !== original
    })
  }, [editValues, settingsMap])

  const handleSaveAll = async () => {
    if (dirtyKeys.length === 0) return
    const nextErrors = {}
    dirtyKeys.forEach((key) => {
      const err = validate(key, editValues[key]?.trim())
      if (err) nextErrors[key] = err
    })
    if (Object.keys(nextErrors).length > 0) {
      setErrors((prev) => ({ ...prev, ...nextErrors }))
      toast.error('Một số giá trị chưa hợp lệ, vui lòng kiểm tra lại')
      return
    }
    setSavingAll(true)
    try {
      for (const key of dirtyKeys) {
        const val = editValues[key]?.trim()
        if (val !== undefined && val !== '') {
          await updateSetting(key, { value: val })
        }
      }
      toast.success('Đã lưu tất cả các thay đổi cấu hình')
      fetchSystemSettings(true)
      load()
    } catch (e) {
      toast.error(errMsg(e))
    } finally {
      setSavingAll(false)
    }
  }

  const unmappedKeys = useMemo(() => {
    const definedKeys = new Set(Object.keys(SETTING_DEFINITIONS))
    return Object.keys(settingsMap).filter((k) => !definedKeys.has(k))
  }, [settingsMap])

  return (
    <PageTransition className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-4" data-stagger>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary to-accent text-white flex items-center justify-center shadow-card shrink-0">
            <Settings className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-content tracking-tight font-display">Cấu hình hệ thống</h1>
            <p className="text-sm text-content-muted">Các tham số và quy tắc kinh doanh tự động của hệ thống bể bơi</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {dirtyKeys.length > 0 && (
            <Button variant="primary" size="sm" onClick={handleSaveAll} loading={savingAll} disabled={!!savingKey}>
              {!savingAll && <Save className="w-4 h-4" aria-hidden="true" />}
              {savingAll ? 'Đang lưu...' : `Lưu tất cả (${dirtyKeys.length})`}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={load} disabled={loading || savingAll || !!savingKey}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
            Làm mới
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-6" aria-busy="true" aria-label="Đang tải cấu hình">
          {[0, 1].map((i) => (
            <div key={i} className="bg-surface rounded-2xl border border-line shadow-card overflow-hidden">
              <div className="px-6 py-4 border-b border-line"><Skeleton className="h-5 w-48" /></div>
              <div className="divide-y divide-line/70">
                {[0, 1].map((r) => (
                  <div key={r} className="p-6 flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
                    <Skeleton className="h-4 flex-1" />
                    <Skeleton className="h-11 w-40 rounded-xl" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : loadError ? (
        <div className="bg-surface rounded-2xl border border-line shadow-card"><ErrorState onRetry={load} /></div>
      ) : Object.keys(settingsMap).length === 0 ? (
        <div className="bg-surface rounded-2xl border border-line shadow-card p-12 text-center">
          <p className="text-content-muted">Chưa có thông số cấu hình nào trong cơ sở dữ liệu.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {CATEGORY_GROUPS.map((group) => {
            const groupItems = group.keys
              .map((key) => ({ key, data: settingsMap[key], def: SETTING_DEFINITIONS[key] }))
              .filter((item) => !!item.data)
            if (groupItems.length === 0) return null

            return (
              <div key={group.id} className="bg-surface rounded-2xl border border-line shadow-card overflow-hidden" data-stagger>
                <div className="px-6 py-4 bg-surface-muted/60 border-b border-line flex items-center justify-between gap-2">
                  <div>
                    <h2 className="text-base font-bold text-content">{group.title}</h2>
                    <p className="text-xs text-content-subtle mt-0.5">{group.description}</p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-surface-muted text-content-muted border border-line shrink-0">
                    {groupItems.length} mục
                  </span>
                </div>

                <div className="divide-y divide-line/70">
                  {groupItems.map(({ key, data, def }) => {
                    const Icon = def?.icon || Settings
                    const currentVal = data?.settingValue ?? ''
                    const editVal = editValues[key] ?? ''
                    const isDirty = editVal !== currentVal
                    const isSaving = savingKey === key
                    const isSaved = savedKeys[key]
                    const itemError = errors[key]

                    return (
                      <div key={key} className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 items-center hover:bg-surface-muted/30 transition-colors">
                        <div className="lg:col-span-5 space-y-1">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-primary-soft text-primary-soft-text flex items-center justify-center shrink-0 border border-primary/15">
                              <Icon className="w-4 h-4" aria-hidden="true" />
                            </div>
                            <label htmlFor={`setting-${key}`} className="font-semibold text-content text-sm sm:text-base">
                              {def?.title || data?.description || key}
                            </label>
                          </div>
                          <p className="text-xs text-content-muted pl-10 leading-relaxed">
                            {def?.hint || data?.description || 'Không có mô tả chi tiết.'}
                          </p>
                          <div className="flex items-center gap-2 pl-10 pt-1 flex-wrap">
                            <code className="text-[11px] font-mono text-content-subtle bg-surface-muted px-2 py-0.5 rounded border border-line">
                              {key}
                            </code>
                            {data?.updatedAt && (
                              <span className="text-[11px] text-content-subtle">
                                • Cập nhật: {new Date(data.updatedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}{' '}
                                {new Date(data.updatedAt).toLocaleDateString('vi-VN')}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="lg:col-span-3 flex justify-start lg:justify-center">
                          <div className="bg-primary-soft/70 border border-primary/20 rounded-xl px-4 py-2 text-center min-w-[140px]">
                            <span className="text-[10px] font-semibold text-primary-soft-text uppercase tracking-wider block">Đang áp dụng</span>
                            <div className="mt-0.5 flex items-baseline justify-center gap-1">
                              <span className="text-xl font-bold text-content tabular-nums">{currentVal}</span>
                              {def?.unit && <span className="text-xs font-semibold text-primary-soft-text">{def.unit}</span>}
                            </div>
                          </div>
                        </div>

                        <div className="lg:col-span-4">
                          <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                              <input
                                id={`setting-${key}`}
                                type={def?.type === 'number' ? 'number' : 'text'}
                                min={def?.min}
                                value={editVal}
                                onChange={(e) => handleInputChange(key, e.target.value)}
                                disabled={isSaving}
                                placeholder="Giá trị mới..."
                                aria-invalid={itemError ? true : undefined}
                                aria-describedby={itemError ? `setting-${key}-error` : undefined}
                                className={`${inputCls} ${isDirty ? 'border-warning/60 bg-warning-soft/20 font-medium' : ''} ${def?.unit ? 'pr-14' : ''}`}
                              />
                              {def?.unit && (
                                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-content-subtle pointer-events-none">{def.unit}</span>
                              )}
                            </div>

                            {isDirty && (
                              <IconButton label="Khôi phục giá trị đang áp dụng" tone="neutral" onClick={() => handleReset(key)} disabled={isSaving}>
                                <RotateCcw className="w-4 h-4" aria-hidden="true" />
                              </IconButton>
                            )}

                            <Button
                              type="button"
                              size="sm"
                              variant={isDirty ? 'primary' : 'outline'}
                              onClick={() => handleSaveItem(key)}
                              loading={isSaving}
                              disabled={!isDirty && editVal === currentVal}
                              className="min-w-[85px]"
                            >
                              {!isSaving && (isSaved ? <Check className="w-4 h-4 text-success-text" aria-hidden="true" /> : <Save className="w-4 h-4" aria-hidden="true" />)}
                              {isSaving ? 'Đang lưu' : isSaved ? 'Đã lưu' : 'Lưu'}
                            </Button>
                          </div>
                          {itemError && <p id={`setting-${key}-error`} role="alert" className="text-xs text-danger-text font-medium mt-1.5">{itemError}</p>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {unmappedKeys.length > 0 && (
            <div className="bg-surface rounded-2xl border border-line shadow-card overflow-hidden" data-stagger>
              <div className="px-6 py-4 bg-surface-muted/60 border-b border-line">
                <h2 className="text-base font-bold text-content">Cấu hình khác</h2>
              </div>
              <div className="divide-y divide-line/70 p-6 space-y-4">
                {unmappedKeys.map((key) => {
                  const data = settingsMap[key]
                  const currentVal = data?.settingValue ?? ''
                  const editVal = editValues[key] ?? ''
                  const isDirty = editVal !== currentVal
                  const isSaving = savingKey === key

                  return (
                    <div key={key} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-3 first:pt-0">
                      <div>
                        <label htmlFor={`setting-${key}`} className="font-semibold text-content text-sm">{data?.description || key}</label>
                        <code className="block text-xs text-content-subtle font-mono">{key}</code>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <input
                          id={`setting-${key}`}
                          type="text"
                          value={editVal}
                          onChange={(e) => handleInputChange(key, e.target.value)}
                          className={inputCls}
                        />
                        <Button size="sm" onClick={() => handleSaveItem(key)} loading={isSaving} disabled={!isDirty} aria-label={`Lưu ${key}`}>
                          {!isSaving && <Save className="w-4 h-4" aria-hidden="true" />}
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </PageTransition>
  )
}
