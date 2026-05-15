import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { Building2, Menu, X, User, LogOut, Settings, Home, MessageSquare, ChevronDown } from 'lucide-react'

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth()
  const { language, setLanguage, t } = useLanguage()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false)
  const languageDropdownRef = useRef(null)

  // Close language dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(event.target)) {
        setLanguageMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const navLinks = [
    { path: '/', label: t('home') },
    { path: '/properties', label: t('properties') },
    { path: '/about', label: t('about') },
    { path: '/contact', label: t('contact') },
  ]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <Building2 className="w-8 h-8 text-blue-600" />
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              RealEstate Pro
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="text-gray-700 hover:text-blue-600 transition-colors"
              >
                {link.label}
              </Link>
            ))}

            {/* Language Dropdown */}
            <div className="relative" ref={languageDropdownRef}>
              <button
                onClick={() => setLanguageMenuOpen(!languageMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors border border-gray-200 rounded-lg hover:border-gray-300"
              >
                <span>{language === 'en' ? t('language_english') : t('language_amharic')}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${languageMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {languageMenuOpen && (
                <div className="absolute right-0 mt-2 w-32 bg-white rounded-lg shadow-lg border overflow-hidden z-50">
                  <button
                    onClick={() => {
                      setLanguage('en')
                      setLanguageMenuOpen(false)
                    }}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                      language === 'en' ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                    }`}
                  >
                    {t('language_english')}
                  </button>
                  <button
                    onClick={() => {
                      setLanguage('am')
                      setLanguageMenuOpen(false)
                    }}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                      language === 'am' ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                    }`}
                  >
                    {t('language_amharic')}
                  </button>
                </div>
              )}
            </div>

            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white">
                    {user?.full_name?.[0] || user?.username?.[0] || 'U'}
                  </div>
                  <span className="text-sm font-medium">{user?.full_name?.split(' ')[0] || user?.username}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border overflow-hidden">
                    <Link
                      to="/dashboard"
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <Home className="w-4 h-4" />
                      {t('dashboard')}
                    </Link>
                    <Link
                      to="/messages"
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <MessageSquare className="w-4 h-4" />
                      {t('messages')}
                    </Link>
                    <Link
                      to="/settings"
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <Settings className="w-4 h-4" />
                      {t('settings')}
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full px-4 py-3 hover:bg-gray-50 text-red-600"
                    >
                      <LogOut className="w-4 h-4" />
                      {t('logout')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="px-4 py-2 text-gray-700 hover:text-blue-600 transition-colors"
                >
                  {t('login')}
                </Link>
                <Link
                  to="/register"
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
                >
                  {t('signup')}
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="block py-3 text-gray-700 hover:text-blue-600"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}

            {/* Mobile Language Selector */}
            <div className="py-3 border-b border-gray-200 mb-3" ref={languageDropdownRef}>
              <button
                onClick={() => setLanguageMenuOpen(!languageMenuOpen)}
                className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors border border-gray-200 rounded-lg hover:border-gray-300"
              >
                <span>{language === 'en' ? t('language_english') : t('language_amharic')}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${languageMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {languageMenuOpen && (
                <div className="mt-2 bg-white rounded-lg shadow-lg border overflow-hidden">
                  <button
                    onClick={() => {
                      setLanguage('en')
                      setLanguageMenuOpen(false)
                    }}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                      language === 'en' ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                    }`}
                  >
                    {t('language_english')}
                  </button>
                  <button
                    onClick={() => {
                      setLanguage('am')
                      setLanguageMenuOpen(false)
                    }}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                      language === 'am' ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                    }`}
                  >
                    {t('language_amharic')}
                  </button>
                </div>
              )}
            </div>

            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className="block py-3 text-gray-700 hover:text-blue-600"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('dashboard')}
                </Link>
                <Link
                  to="/messages"
                  className="block py-3 text-gray-700 hover:text-blue-600"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('messages')}
                </Link>
                <Link
                  to="/settings"
                  className="block py-3 text-gray-700 hover:text-blue-600"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('settings')}
                </Link>
                <button
                  onClick={() => {
                    handleLogout()
                    setMobileMenuOpen(false)
                  }}
                  className="block w-full text-left py-3 text-red-600"
                >
                  {t('logout')}
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="block py-3 text-gray-700 hover:text-blue-600"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('login')}
                </Link>
                <Link
                  to="/register"
                  className="block py-3 text-blue-600 font-semibold"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('register')}
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar
