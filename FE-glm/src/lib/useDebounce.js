import { useState, useEffect } from 'react'

/**
 * Debounce a value — returns the debounced value after `delay` ms of inactivity.
 * Useful for search inputs to avoid spamming the API on every keystroke.
 */
export function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}
