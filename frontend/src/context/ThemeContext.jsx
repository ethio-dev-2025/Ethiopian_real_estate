// src/context/ThemeContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react'

const ThemeContext = createContext()

export const useTheme = () => useContext(ThemeContext)

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode')
    return saved === 'true'
  })

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode)
    if (darkMode) {
      document.documentElement.classList.add('dark')
      // Set dark mode CSS variables
      document.documentElement.style.setProperty('--background', '#0f172a')
      document.documentElement.style.setProperty('--surface', '#1e293b')
      document.documentElement.style.setProperty('--text-primary', '#f1f5f9')
      document.documentElement.style.setProperty('--text-secondary', '#cbd5e1')
      document.documentElement.style.setProperty('--border-light', '#334155')
    } else {
      document.documentElement.classList.remove('dark')
      // Set light mode CSS variables (Option 1 colors)
      document.documentElement.style.setProperty('--background', '#f8fafc')
      document.documentElement.style.setProperty('--surface', '#ffffff')
      document.documentElement.style.setProperty('--text-primary', '#1f2937')
      document.documentElement.style.setProperty('--text-secondary', '#4b5563')
      document.documentElement.style.setProperty('--border-light', '#e2e8f0')
    }
  }, [darkMode])

  const toggleDarkMode = () => setDarkMode(prev => !prev)

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  )
}