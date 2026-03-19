import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => localStorage.getItem('theme') || 'system')

  useEffect(() => {
    const root = document.documentElement

    if (theme === 'dark') {
      root.classList.add('dark')
      return
    }

    if (theme === 'light') {
      root.classList.remove('dark')
      return
    }

    // system
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    mq.matches ? root.classList.add('dark') : root.classList.remove('dark')
    const handler = (e) => e.matches ? root.classList.add('dark') : root.classList.remove('dark')
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

  const setTheme = (t) => {
    localStorage.setItem('theme', t)
    setThemeState(t)
  }

  const cycleTheme = () => {
    const next = { light: 'dark', dark: 'system', system: 'light' }
    setTheme(next[theme])
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, cycleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
