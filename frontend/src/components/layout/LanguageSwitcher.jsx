import React, { useState, useRef, useEffect } from 'react'
import { useLanguage } from '../../context/LanguageContext'
import { Globe, ChevronDown } from 'lucide-react'

const LanguageSwitcher = () => {
  const { language, setLanguage } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLanguageChange = (lang) => {
    setLanguage(lang)
    setIsOpen(false)
    // Optional: reload page to refresh all content
    // window.location.reload()
  }

  // Determine button style based on parent context
  const isInHeader = () => {
    // Check if parent has dark background
    return true
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors border border-gray-300 shadow-sm"
      >
        <Globe className="w-4 h-4 text-gray-600" />
        <span className="text-sm font-medium text-gray-700">{language === 'en' ? 'English' : 'አማርኛ'}</span>
        <ChevronDown className="w-4 h-4 text-gray-600" />
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border py-1 z-50">
          <button
            onClick={() => handleLanguageChange('en')}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <span className="text-lg">🇬🇧</span>
            <span>English</span>
          </button>
          <button
            onClick={() => handleLanguageChange('am')}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <span className="text-lg">🇪🇹</span>
            <span>አማርኛ</span>
          </button>
        </div>
      )}
    </div>
  )
}

export default LanguageSwitcher