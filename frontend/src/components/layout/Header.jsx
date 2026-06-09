// src/components/layout/Header.jsx
import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { Menu, X, User, LogOut, Settings, LayoutDashboard, ChevronDown } from 'lucide-react'

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
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white shadow-md py-3' : 'bg-gradient-to-r from-primary-800 to-primary-900 py-5'}`}>
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group shrink-0">
            <img 
              src="/assets/images/image.png" 
              alt="BetFinder" 
              className="w-12 h-12 object-contain rounded-xl shadow-md"
            />
            <span className={`text-xl font-bold transition ${scrolled ? 'text-primary-800' : 'text-white'}`}>
              BetFinder
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`transition hover:text-secondary-500 font-medium ${scrolled ? 'text-gray-700 hover:text-primary-800' : 'text-white hover:text-secondary-400'}`}
              >
                {link.label}
              </Link>
            ))}
            
            {!user && (
              <>
                <Link
                  to="/login"
                  className={`transition font-medium ${scrolled ? 'text-gray-700 hover:text-primary-800' : 'text-white hover:text-secondary-400'}`}
                >
                  {t('signin')}
                </Link>
                <Link
                  to="/register"
                  className={`px-4 py-2 rounded-lg transition font-medium ${
                    scrolled 
                      ? 'bg-primary-800 text-white hover:bg-primary-900' 
                      : 'bg-secondary-500 text-white hover:bg-secondary-600'
                  }`}
                >
                  {t('signup')}
                </Link>
              </>
            )}

            {user && (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${
                    scrolled 
                      ? 'bg-primary-800 text-white hover:bg-primary-900' 
                      : 'bg-white text-primary-800 hover:bg-gray-100'
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
                      className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-primary-50 hover:text-primary-800 transition"
                      onClick={() => setUserDropdownOpen(false)}
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      {t('dashboard')}
                    </Link>
                    <Link
                      to="/settings"
                      className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-primary-50 hover:text-primary-800 transition"
                      onClick={() => setUserDropdownOpen(false)}
                    >
                      <Settings className="w-4 h-4" />
                      {t('settings')}
                    </Link>
                    <div className="border-t my-1"></div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-error hover:bg-red-50 transition"
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
            className={`md:hidden p-2 rounded-lg ${scrolled ? 'text-primary-800' : 'text-white'}`}
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
                className="block py-3 text-gray-700 hover:text-primary-800 transition font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            
            {!user && (
              <>
                <Link
                  to="/login"
                  className="block py-3 text-gray-700 hover:text-primary-800 transition font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('signin')}
                </Link>
                <Link
                  to="/register"
                  className="block py-3 mt-2 bg-primary-800 text-white text-center rounded-lg hover:bg-primary-900 transition"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('signup')}
                </Link>
              </>
            )}
            
            {user && (
              <div className="pt-3 mt-2 border-t border-gray-200">
                <Link to="/dashboard" className="block py-2 text-gray-700 hover:text-primary-800" onClick={() => setMobileMenuOpen(false)}>{t('dashboard')}</Link>
                <Link to="/settings" className="block py-2 text-gray-700 hover:text-primary-800" onClick={() => setMobileMenuOpen(false)}>{t('settings')}</Link>
                <button onClick={handleLogout} className="block w-full text-left py-2 text-error hover:bg-red-50">{t('logout')}</button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}

export default Header