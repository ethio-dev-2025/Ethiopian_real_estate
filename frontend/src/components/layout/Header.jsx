// src/components/layout/Header.jsx (Updated - Language toggle removed)
import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { Building2, Menu, X, User, LogOut, Settings, LayoutDashboard, ChevronDown } from 'lucide-react'

const Header = () => {
  const { user, logout } = useAuth()
  const { t, language } = useLanguage()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/')
    setUserDropdownOpen(false)
  }

  const navLinks = [
    { to: '/', label: t('home') },
    { to: '/properties', label: t('properties') },
    { to: '/about', label: t('about') },
    { to: '/contact', label: t('contact') },
  ]

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white shadow-md py-3' : 'bg-gradient-to-r from-blue-900 to-purple-900 py-5'}`}>
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group shrink-0">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className={`text-xl font-bold transition ${scrolled ? 'text-gray-900' : 'text-white'}`}>
              RealEstate Pro
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`transition hover:text-blue-600 font-medium ${scrolled ? 'text-gray-700' : 'text-white'}`}
              >
                {link.label}
              </Link>
            ))}
            
            {/* Sign In and Sign Up as normal links */}
            {!user && (
              <>
                <Link
                  to="/login"
                  className={`transition hover:text-blue-600 font-medium ${scrolled ? 'text-gray-700' : 'text-white'}`}
                >
                  {t('signin')}
                </Link>
                <Link
                  to="/register"
                  className={`transition hover:text-blue-600 font-medium ${scrolled ? 'text-gray-700' : 'text-white'}`}
                >
                  {t('signup')}
                </Link>
              </>
            )}

            {/* User Dropdown (when logged in) */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${
                    scrolled 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'bg-white text-blue-600 hover:bg-gray-100'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">{user?.full_name?.split(' ')[0] || user?.username}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border py-2 z-50">
                    <Link
                      to="/dashboard"
                      className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 transition"
                      onClick={() => setUserDropdownOpen(false)}
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      {t('dashboard')}
                    </Link>
                    <Link
                      to="/settings"
                      className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 transition"
                      onClick={() => setUserDropdownOpen(false)}
                    >
                      <Settings className="w-4 h-4" />
                      {t('settings')}
                    </Link>
                    <div className="border-t my-1"></div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 transition"
                    >
                      <LogOut className="w-4 h-4" />
                      {t('logout')}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`md:hidden p-2 rounded-lg ${scrolled ? 'text-gray-900' : 'text-white'}`}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pt-4 border-t border-gray-200 bg-white rounded-lg shadow-lg p-4">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="block py-3 text-gray-700 hover:text-blue-600 transition font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            
            {!user && (
              <>
                <Link
                  to="/login"
                  className="block py-3 text-gray-700 hover:text-blue-600 transition font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('signin')}
                </Link>
                <Link
                  to="/register"
                  className="block py-3 text-gray-700 hover:text-blue-600 transition font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('signup')}
                </Link>
              </>
            )}
            
            {user && (
              <div className="pt-3 mt-2 border-t border-gray-200">
                <Link to="/dashboard" className="block py-2 text-gray-700" onClick={() => setMobileMenuOpen(false)}>{t('dashboard')}</Link>
                <Link to="/settings" className="block py-2 text-gray-700" onClick={() => setMobileMenuOpen(false)}>{t('settings')}</Link>
                <button onClick={handleLogout} className="block w-full text-left py-2 text-red-600">{t('logout')}</button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}

export default Header