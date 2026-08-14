import { useEffect, useState, useMemo } from 'react'
import { Settings, Save, RotateCcw, RefreshCw, Calendar, Clock, BookOpen, ShieldAlert, Check, Sparkles } from 'lucide-react'
import { getSettings, updateSetting } from '../../lib/apiAdmin'
import { fetchSystemSettings } from '../../lib/settings'
import { Button, Spinner, inputCls } from '../../components/ui'
import { toast } from '../../components/ui/Toast'
import { errMsg } from '../../lib/api'

// Deterministic metadata and categories
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
  const [settingsMap, setSettingsMap] = useState({}) // { [key]: { settingKey, settingValue, description, updatedAt } }
  const [editValues, setEditValues] = useState({}) // { [key]: string }
  const [savedKeys, setSavedKeys] = useState({}) // { [key]: boolean }
  const [loading, setLoading] = useState(true)
  const [savingKey, setSavingKey] = useState(null)
  const [savingAll, setSavingAll] = useState(false)

  const load = () => {
    setLoading(true)
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
      .catch((e) => toast.error(errMsg(e)))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const handleInputChange = (key, val) => {
    setEditValues((prev) => ({ ...prev, [key]: val }))
  }

  const handleReset = (key) => {
    const original = settingsMap[key]?.settingValue ?? ''
    setEditValues((prev) => ({ ...prev, [key]: original }))
  }

  const handleSaveItem = async (key) => {
    const original = settingsMap[key]
    const newValue = editValues[key]?.trim()

    if (newValue === undefined || newValue === '') {
      toast.error('Giá trị không được để trống')
      return
    }

    const def = SETTING_DEFINITIONS[key]
    if (def?.type === 'number') {
      const num = Number(newValue)
      if (isNaN(num) || num < (def.min ?? 1)) {
        toast.error(`Giá trị phải là số nguyên dương lớn hơn hoặc bằng ${def.min ?? 1}`)
        return
      }
    }

    setSavingKey(key)
    try {
      const updated = await updateSetting(key, { value: newValue })
      
      // Update local state without re-ordering or moving elements
      setSettingsMap((prev) => ({
        ...prev,
        [key]: {
          ...(prev[key] || {}),
          settingValue: updated?.settingValue ?? newValue,
          updatedAt: updated?.updatedAt ?? new Date().toISOString()
        }
      }))
      setEditValues((prev) => ({
        ...prev,
        [key]: updated?.settingValue ?? newValue
      }))

      // Show temporary green check indicator
      setSavedKeys((prev) => ({ ...prev, [key]: true }))
      setTimeout(() => {
        setSavedKeys((prev) => ({ ...prev, [key]: false }))
      }, 2500)

      // Refresh global settings cache
      fetchSystemSettings(true)
      toast.success(`Đã lưu: ${def?.title || original?.description || key}`)
    } catch (e) {
      toast.error(errMsg(e))
    } finally {
      setSavingKey(null)
    }
  }

  // Check if there are any dirty values across all settings
  const dirtyKeys = useMemo(() => {
    return Object.keys(editValues).filter((key) => {
      const original = settingsMap[key]?.settingValue ?? ''
      return editValues[key] !== original
    })
  }, [editValues, settingsMap])

  const handleSaveAll = async () => {
    if (dirtyKeys.length === 0) return
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

  // Collect other unmapped keys if any exist in DB
  const unmappedKeys = useMemo(() => {
    const definedKeys = new Set(Object.keys(SETTING_DEFINITIONS))
    return Object.keys(settingsMap).filter((k) => !definedKeys.has(k))
  }, [settingsMap])

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pool-500 to-pool-600 text-white flex items-center justify-center shadow-md shadow-pool-200">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-ink-900 tracking-tight">Cấu hình hệ thống</h1>
            <p className="text-sm text-ink-500">Các tham số và quy tắc kinh doanh tự động của hệ thống bể bơi</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {dirtyKeys.length > 0 && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveAll}
              disabled={savingAll || !!savingKey}
              className="animate-pulse shadow-sm"
            >
              {savingAll ? <Spinner size={16} color="white" /> : <><Save className="w-4 h-4 mr-1.5" /> Lưu tất cả ({dirtyKeys.length})</>}
            </Button>
          )}

          <Button variant="outline" size="sm" onClick={load} disabled={loading || savingAll || !!savingKey}>
            <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-ink-100/80 p-12 text-center shadow-sm">
          <Spinner size={32} />
          <p className="text-sm text-ink-400 mt-3 font-medium">Đang tải danh sách thông số cấu hình...</p>
        </div>
      ) : Object.keys(settingsMap).length === 0 ? (
        <div className="bg-white rounded-2xl border border-ink-100/80 p-12 text-center shadow-sm">
          <p className="text-ink-500">Chưa có thông số cấu hình nào trong cơ sở dữ liệu.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {CATEGORY_GROUPS.map((group) => {
            const groupItems = group.keys
              .map((key) => ({ key, data: settingsMap[key], def: SETTING_DEFINITIONS[key] }))
              .filter((item) => !!item.data)

            if (groupItems.length === 0) return null

            return (
              <div
                key={group.id}
                className="bg-white rounded-2xl border border-ink-100/80 shadow-sm overflow-hidden"
              >
                {/* Category Header */}
                <div className="px-6 py-4 bg-ink-50/60 border-b border-ink-100/60 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-ink-900">{group.title}</h2>
                    <p className="text-xs text-ink-400 mt-0.5">{group.description}</p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-ink-100 text-ink-600">
                    {groupItems.length} mục
                  </span>
                </div>

                {/* Items in Category */}
                <div className="divide-y divide-ink-100/60">
                  {groupItems.map(({ key, data, def }) => {
                    const Icon = def?.icon || Settings
                    const currentVal = data?.settingValue ?? ''
                    const editVal = editValues[key] ?? ''
                    const isDirty = editVal !== currentVal
                    const isSaving = savingKey === key
                    const isSaved = savedKeys[key]

                    return (
                      <div
                        key={key}
                        className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 items-center hover:bg-ink-50/30 transition-colors"
                      >
                        {/* Info Column */}
                        <div className="lg:col-span-5 space-y-1">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-pool-50 text-pool-600 flex items-center justify-center shrink-0 border border-pool-100">
                              <Icon className="w-4 h-4" />
                            </div>
                            <p className="font-semibold text-ink-900 text-sm sm:text-base">
                              {def?.title || data?.description || key}
                            </p>
                          </div>
                          <p className="text-xs text-ink-500 pl-10 leading-relaxed">
                            {def?.hint || data?.description || 'Không có mô tả chi tiết.'}
                          </p>
                          <div className="flex items-center gap-2 pl-10 pt-1">
                            <code className="text-[11px] font-mono text-ink-400 bg-ink-50 px-2 py-0.5 rounded border border-ink-200/40">
                              {key}
                            </code>
                            {data?.updatedAt && (
                              <span className="text-[11px] text-ink-400">
                                • Cập nhật: {new Date(data.updatedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}{' '}
                                {new Date(data.updatedAt).toLocaleDateString('vi-VN')}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Current Active Value Badge */}
                        <div className="lg:col-span-3 flex justify-start lg:justify-center">
                          <div className="bg-pool-50/70 border border-pool-200/80 rounded-xl px-4 py-2 text-center min-w-[140px]">
                            <span className="text-[10px] font-semibold text-pool-600 uppercase tracking-wider block">
                              Đang áp dụng
                            </span>
                            <div className="mt-0.5 flex items-baseline justify-center gap-1">
                              <span className="text-xl font-bold text-pool-900">{currentVal}</span>
                              {def?.unit && (
                                <span className="text-xs font-semibold text-pool-700">{def.unit}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Input & Action Buttons */}
                        <div className="lg:col-span-4 flex items-center gap-2">
                          <div className="relative flex-1">
                            <input
                              type={def?.type === 'number' ? 'number' : 'text'}
                              min={def?.min}
                              value={editVal}
                              onChange={(e) => handleInputChange(key, e.target.value)}
                              disabled={isSaving}
                              placeholder="Giá trị mới..."
                              className={`${inputCls} ${
                                isDirty
                                  ? 'border-amber-400 bg-amber-50/20 focus:border-amber-500 focus:ring-amber-200 font-medium'
                                  : 'bg-white'
                              } ${def?.unit ? 'pr-14' : ''}`}
                            />
                            {def?.unit && (
                              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-ink-400 pointer-events-none">
                                {def.unit}
                              </span>
                            )}
                          </div>

                          {isDirty && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              title="Khôi phục giá trị đang áp dụng"
                              onClick={() => handleReset(key)}
                              disabled={isSaving}
                              className="px-2.5 h-[42px]"
                            >
                              <RotateCcw className="w-4 h-4 text-ink-500" />
                            </Button>
                          )}

                          <Button
                            type="button"
                            size="sm"
                            variant={isDirty ? 'primary' : 'outline'}
                            onClick={() => handleSaveItem(key)}
                            disabled={isSaving || (!isDirty && editVal === currentVal)}
                            className="h-[42px] min-w-[85px]"
                          >
                            {isSaving ? (
                              <Spinner size={16} color="white" />
                            ) : isSaved ? (
                              <>
                                <Check className="w-4 h-4 mr-1 text-emerald-500" />
                                Đã lưu
                              </>
                            ) : (
                              <>
                                <Save className="w-4 h-4 mr-1" />
                                Lưu
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {/* Unmapped Other Settings if any */}
          {unmappedKeys.length > 0 && (
            <div className="bg-white rounded-2xl border border-ink-100/80 shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-ink-50/60 border-b border-ink-100/60">
                <h2 className="text-base font-bold text-ink-900">Cấu hình khác</h2>
              </div>
              <div className="divide-y divide-ink-100/60 p-6 space-y-4">
                {unmappedKeys.map((key) => {
                  const data = settingsMap[key]
                  const currentVal = data?.settingValue ?? ''
                  const editVal = editValues[key] ?? ''
                  const isDirty = editVal !== currentVal
                  const isSaving = savingKey === key

                  return (
                    <div key={key} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-3 first:pt-0">
                      <div>
                        <p className="font-semibold text-ink-900 text-sm">{data?.description || key}</p>
                        <code className="text-xs text-ink-400 font-mono">{key}</code>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <input
                          type="text"
                          value={editVal}
                          onChange={(e) => handleInputChange(key, e.target.value)}
                          className={inputCls}
                        />
                        <Button
                          size="sm"
                          onClick={() => handleSaveItem(key)}
                          disabled={isSaving || !isDirty}
                        >
                          {isSaving ? <Spinner size={16} color="white" /> : <Save className="w-4 h-4" />}
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
    </div>
  )
}
