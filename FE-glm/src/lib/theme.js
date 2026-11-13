import { create } from 'zustand'

const STORAGE_KEY = 'pool-theme'

function applyTheme(theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', theme === 'dark' ? '#0B1120' : '#0284C7')
}

function getInitialTheme() {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

export const useTheme = create((set) => ({
  theme: getInitialTheme(),
  toggleTheme: () => set((state) => {
    const next = state.theme === 'dark' ? 'light' : 'dark'
    try { localStorage.setItem(STORAGE_KEY, next) } catch { /* bỏ qua khi bị chặn */ }
    applyTheme(next)
    return { theme: next }
  })
}))