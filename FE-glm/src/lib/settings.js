import { useState, useEffect } from 'react'
import { getSettings } from './apiAdmin'

// In-memory cache for settings
let cachedSettings = null
let fetchPromise = null
const listeners = new Set()

export const DEFAULT_DURATION_DAYS = 45
export const DEFAULT_QUOTA = 12

export const fetchSystemSettings = async (forceRefresh = false) => {
  if (!forceRefresh && cachedSettings) {
    return cachedSettings
  }
  if (!forceRefresh && fetchPromise) {
    return fetchPromise
  }
  fetchPromise = getSettings()
    .then((data) => {
      const list = Array.isArray(data) ? data : []
      const map = {}
      list.forEach((item) => {
        if (item && item.settingKey) {
          map[item.settingKey] = item.settingValue
        }
      })
      cachedSettings = { list, map }
      listeners.forEach((listener) => listener(cachedSettings))
      return cachedSettings
    })
    .catch((err) => {
      console.warn('Could not load system settings from server, using defaults:', err)
      if (!cachedSettings) {
        cachedSettings = { list: [], map: {} }
      }
      return cachedSettings
    })
    .finally(() => {
      fetchPromise = null
    })

  return fetchPromise
}

export const getSetting = (key, fallback = '') => {
  if (cachedSettings && cachedSettings.map[key] !== undefined) {
    return cachedSettings.map[key]
  }
  return fallback
}

export const getSettingInt = (key, fallback = 0) => {
  const val = getSetting(key, null)
  if (val !== null && val !== '') {
    const parsed = parseInt(val, 10)
    if (!isNaN(parsed)) return parsed
  }
  return fallback
}

export const getDurationDays = () => getSettingInt('enrollment.duration-days', DEFAULT_DURATION_DAYS)
export const getDefaultQuota = () => getSettingInt('enrollment.default-quota', DEFAULT_QUOTA)

export const useSystemSettings = () => {
  const [settingsState, setSettingsState] = useState(() => cachedSettings || { list: [], map: {} })
  const [loading, setLoading] = useState(!cachedSettings)

  useEffect(() => {
    const handleUpdate = (newSettings) => {
      setSettingsState(newSettings)
    }
    listeners.add(handleUpdate)

    if (!cachedSettings) {
      setLoading(true)
      fetchSystemSettings()
        .then((res) => {
          setSettingsState(res)
        })
        .finally(() => setLoading(false))
    }

    return () => {
      listeners.delete(handleUpdate)
    }
  }, [])

  const durationDays = getSettingInt('enrollment.duration-days', DEFAULT_DURATION_DAYS)
  const defaultQuota = getSettingInt('enrollment.default-quota', DEFAULT_QUOTA)

  return {
    settings: settingsState.list,
    settingsMap: settingsState.map,
    durationDays,
    defaultQuota,
    loading,
    reload: () => fetchSystemSettings(true)
  }
}
