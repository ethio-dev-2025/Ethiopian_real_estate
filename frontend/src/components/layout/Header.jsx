import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import LanguageSwitcher from './LanguageSwitcher'
import { Building2, Menu, X, User, LogOut, Settings, LayoutDashboard, ChevronDown } from 'lucide-react'

const Header = () => {
  const { user, logout } = useAuth()
  const { t } = useLanguage()
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
    { to: '/', label: 'Home' },
    { to: '/properties', label: 'Properties' },
    { to: '/about', label: 'About' },
    { to: '/contact', label: 'Contact' },
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
          </div>

          {/* Right Side Buttons */}
          <div className="flex items-center gap-3">
            <div className="hidden md:block">
              <LanguageSwitcher />
            </div>

            {user ? (
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
                      Dashboard
                    </Link>
                    <Link
                      to="/settings"
                      className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 transition"
                      onClick={() => setUserDropdownOpen(false)}
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </Link>
                    <div className="border-t my-1"></div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 transition"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex gap-2">
                <Link
                  to="/login"
                  className={`px-4 py-2 rounded-lg font-semibold transition ${
                    scrolled 
                      ? 'border border-blue-600 text-blue-600 hover:bg-blue-50' 
                      : 'border border-white text-white hover:bg-white/10'
                  }`}
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className={`px-4 py-2 rounded-lg font-semibold transition ${
                    scrolled 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'bg-white text-blue-600 hover:bg-gray-100'
                  }`}
                >
                  Sign Up
                </Link>
              </div>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`md:hidden p-2 rounded-lg ${scrolled ? 'text-gray-900' : 'text-white'}`}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
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
            
            {user ? (
              <div className="pt-3 mt-2 border-t border-gray-200">
                <Link to="/dashboard" className="block py-2 text-gray-700" onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
                <Link to="/settings" className="block py-2 text-gray-700" onClick={() => setMobileMenuOpen(false)}>Settings</Link>
                <button onClick={handleLogout} className="block w-full text-left py-2 text-red-600">Logout</button>
              </div>
            ) : (
              <div className="pt-3 mt-2 border-t border-gray-200">
                <Link to="/login" className="block py-2 text-blue-600 font-semibold" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
                <Link to="/register" className="block py-2 text-green-600 font-semibold" onClick={() => setMobileMenuOpen(false)}>Sign Up</Link>
              </div>
            )}
            
            <div className="pt-3 mt-2 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Language</span>
                <LanguageSwitcher />
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Header