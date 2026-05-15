import React, { useState } from 'react'
import { useLanguage } from '../../context/LanguageContext'
import { Globe, ChevronDown } from 'lucide-react'

const LanguageSwitcher = () => {
  const { language, setLanguage } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)

  const handleLanguageChange = (lang) => {
    setLanguage(lang)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow-md hover:bg-gray-50 transition-colors border"
      >
        <Globe className="w-4 h-4 text-gray-600" />
        <span className="text-sm font-medium">{language === 'en' ? 'English' : 'አማርኛ'}</span>
        <ChevronDown className="w-4 h-4 text-gray-600" />
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-36 bg-white rounded-lg shadow-lg border py-1 z-50">
          <button
            onClick={() => handleLanguageChange('en')}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
          >
            English
          </button>
          <button
            onClick={() => handleLanguageChange('am')}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
          >
            አማርኛ
          </button>
        </div>
      )}
    </div>
  )
}

export default LanguageSwitcher