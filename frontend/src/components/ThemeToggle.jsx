import React, { useEffect, useState } from 'react'

export function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    if (typeof window === 'undefined') return false
    const stored = localStorage.getItem('theme')
    if (stored) return stored === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    const root = document.documentElement
    if (dark) {
      root.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      root.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [dark])

  return (
    <button
      onClick={() => setDark(d => !d)}
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="rounded-lg border border-slate-300 bg-white text-slate-700 px-3 py-2 text-sm hover:bg-slate-50 transition dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600"
    >
      {dark ? '☾ Dark' : '☀︎ Light'}
    </button>
  )
}
