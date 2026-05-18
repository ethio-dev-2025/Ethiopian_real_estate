import React, { useState, useEffect, memo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  LayoutDashboard, PlusCircle, List, Building2, MessageSquare,
  Shield, CreditCard, Settings, LogOut, Menu, X, ChevronRight
} from 'lucide-react'

const SellerSidebar = memo(({ sidebarOpen, setSidebarOpen }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isMobile, setIsMobile] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    const fetchUnreadCount = async () => {
      try {
        const token = localStorage.getItem('access_token')
        const response = await fetch('http://localhost:8000/api/messages/unread-count', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (response.ok) {
          const data = await response.json()
          setUnreadCount(data.count || 0)
        }
      } catch (error) {
        console.error('Error fetching unread count:', error)
      }
    }
    
    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => {
      window.removeEventListener('resize', checkMobile)
      clearInterval(interval)
    }
  }, [])

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { id: 'create-listing', label: 'Create Listing', icon: PlusCircle, path: '/create-listing' },
    { id: 'my-listings', label: 'My Listings', icon: List, path: '/my-listings' },
    { id: 'my-properties', label: 'My Properties', icon: Building2, path: '/my-properties' },
    { id: 'messages', label: 'Messages', icon: MessageSquare, path: '/dashboard/messages', badge: unreadCount },
    { id: 'activation', label: 'Activation', icon: Shield, path: '/activation' },
    { id: 'subscription', label: 'Subscription', icon: CreditCard, path: '/subscription' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' }
  ]

  const handleNavigation = (path) => {
    navigate(path)
    if (isMobile) setSidebarOpen(false)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const getUserInitial = () => {
    if (user?.full_name) return user.full_name.charAt(0).toUpperCase()
    if (user?.username) return user.username.charAt(0).toUpperCase()
    return 'S'
  }

  const getUserName = () => {
    if (user?.full_name) return user.full_name
    if (user?.username) return user.username
    return 'Seller'
  }

  const getRoleDisplay = () => {
    const role = user?.role_type
    if (role === 'dual') return 'Seller & Landlord'
    if (role === 'seller') return 'Seller'
    if (role === 'landlord') return 'Landlord'
    return 'Seller'
  }

  return (
    <>
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-20" onClick={() => setSidebarOpen(false)} />
      )}
      
      <aside className={`fixed top-0 left-0 z-40 h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'} ${isMobile && !sidebarOpen ? '-translate-x-full' : 'translate-x-0'}`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-5 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleNavigation('/dashboard')}>
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                {sidebarOpen && (
                  <div>
                    <span className="text-xl font-bold tracking-tight">EstateHub</span>
                    <p className="text-xs text-slate-400">Seller Portal</p>
                  </div>
                )}
              </div>
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg hover:bg-white/10 transition-all hidden md:block">
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-1 mt-4">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.path)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 ${
                    isActive 
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {sidebarOpen && (
                    <>
                      <span className="flex-1 text-left text-sm font-medium">{item.label}</span>
                      {item.badge > 0 && (
                        <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-5 text-center">
                          {item.badge > 99 ? '99+' : item.badge}
                        </span>
                      )}
                      {isActive && <ChevronRight className="w-4 h-4 opacity-70" />}
                    </>
                  )}
                  {!sidebarOpen && item.badge > 0 && (
                    <span className="absolute right-2 top-1 w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                </button>
              )
            })}
          </nav>

          {/* Logout Button */}
          <div className="p-4 border-t border-white/10">
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:bg-red-600 hover:text-white transition-all duration-150">
              <LogOut className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span className="text-sm font-medium">Logout</span>}
            </button>
          </div>

          {/* User Info */}
          <div className="p-4 pt-0 pb-5">
            <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-gray-800/50">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md flex-shrink-0">
                <span className="text-white font-bold text-sm">{getUserInitial()}</span>
              </div>
              {sidebarOpen && (
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{getUserName()}</p>
                  <p className="text-xs text-gray-400 truncate">{getRoleDisplay()}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <div className={`w-2 h-2 ${user?.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'} rounded-full animate-pulse`}></div>
                    <span className={`text-xs ${user?.status === 'active' ? 'text-green-400' : 'text-yellow-400'}`}>
                      {user?.status === 'active' ? 'Active' : 'Pending'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  )
})

SellerSidebar.displayName = 'SellerSidebar'

export default SellerSidebar