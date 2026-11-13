import { useState, useEffect, useCallback } from 'react'

/**
 * useAsyncData — tải dữ liệu bất đồng bộ với loading/error/retry.
 * fetcher nên là hàm ổn định (module-level hoặc useCallback). deps quyết định khi tải lại.
 */
export function useAsyncData(fetcher, deps = []) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetcher()
      setData(result)
    } catch (e) {
      setError(e)
    } finally {
      setLoading(false)
    }
  }, deps)

  useEffect(() => { load() }, [load])

  return { data, loading, error, reload: load, setData }
}