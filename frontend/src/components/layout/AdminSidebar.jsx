// src/components/layout/AdminSidebar.jsx
import React, { useState, useEffect } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { 
  Building2, LayoutDashboard, Users, FileCheck, 
  CreditCard, MessageCircle, Settings, LogOut,
  Menu, X, BarChart3, User, ChevronDown, ChevronUp,
  Activity, Bell, Home, Shield, DollarSign
} from 'lucide-react'
import toast from 'react-hot-toast'

const API_URL = 'http://localhost:8000'

const AdminSidebar = ({ sidebarOpen, setSidebarOpen, unreadCount = 0 }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const [pendingPaymentsCount, setPendingPaymentsCount] = useState(0)
  const [isMobile, setIsMobile] = useState(false)

  const fetchPendingCounts = async () => {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) return
      
      // Fetch pending verifications
      try {
        const verifyResponse = await fetch(`${API_URL}/api/activation/admin/pending-count`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (verifyResponse.ok) {
          const data = await verifyResponse.json()
          setPendingCount(data.count || 0)
        }
      } catch (e) {
        console.error('Error fetching pending count:', e)
      }
      
      // Fetch pending payments
      try {
        const paymentResponse = await fetch(`${API_URL}/api/activation/admin/pending-payments`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (paymentResponse.ok) {
          const payments = await paymentResponse.json()
          setPendingPaymentsCount(Array.isArray(payments) ? payments.length : 0)
        }
      } catch (e) {
        console.error('Error fetching payments:', e)
      }
    } catch (error) {
      console.error('Error fetching counts:', error)
    }
  }

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      try {
        setUser(JSON.parse(userData))
      } catch (e) {
        console.error('Error parsing user data', e)
      }
    }
    
    fetchPendingCounts()
    const interval = setInterval(fetchPendingCounts, 30000)
    
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => {
      clearInterval(interval)
      window.removeEventListener('resize', checkMobile)
    }
  }, [])

  const menuItems = [
    { path: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true, badge: 0 },
    { path: '/admin/users', label: 'User Management', icon: Users, badge: 0 },
    { path: '/admin/verification-queue', label: 'Verification Queue', icon: FileCheck, badge: pendingCount },
    { path: '/admin/payment-approvals', label: 'Payment Approvals', icon: CreditCard, badge: pendingPaymentsCount },
    { path: '/admin/reports', label: 'Reports & Analytics', icon: BarChart3, badge: 0 },
    { path: '/admin/messages', label: 'Messages', icon: MessageCircle, badge: unreadCount },
    { path: '/admin/settings', label: 'Settings', icon: Settings, badge: 0 }
  ]

  const handleLogout = () => {
    localStorage.clear()
    sessionStorage.clear()
    toast.success('Logged out successfully')
    navigate('/login')
  }

  const getUserName = () => {
    if (user?.full_name) return user.full_name
    if (user?.username) return user.username
    return 'Admin'
  }

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-30" onClick={() => setSidebarOpen(false)} />
      )}
      
      <aside className={`fixed left-0 top-0 h-full bg-gradient-to-b from-gray-900 to-gray-800 text-white transition-all duration-300 z-40 shadow-xl flex flex-col ${sidebarOpen ? 'w-64' : 'w-20'} ${isMobile && !sidebarOpen ? '-translate-x-full' : 'translate-x-0'}`}>
        {/* Logo */}
        <div className="p-5 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/admin')}>
              <Building2 className="w-8 h-8 text-blue-400 flex-shrink-0" />
              {sidebarOpen && (
                <div className="overflow-hidden">
                  <h1 className="font-bold text-lg">EstateHub</h1>
                  <p className="text-xs text-gray-400">Admin Portal</p>
                </div>
              )}
            </div>
            {!isMobile && (
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg hover:bg-gray-700 transition">
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <div className="px-3 mb-2">
            {sidebarOpen && <p className="text-xs text-gray-500 uppercase tracking-wider">Main Menu</p>}
          </div>
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = item.end 
              ? location.pathname === item.path
              : location.pathname.startsWith(item.path)
            
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive: active }) =>
                  `flex items-center gap-3 px-5 py-3 transition-colors ${
                    active ? 'bg-blue-600 text-white border-r-4 border-blue-400' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`
                }
              >
                <div className="relative">
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {item.badge > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 animate-pulse">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </div>
                {sidebarOpen && (
                  <div className="flex-1 flex items-center justify-between">
                    <span className="text-sm">{item.label}</span>
                    {item.badge > 0 && (
                      <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full ml-2">
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* Bottom Section */}
        <div className="border-t border-gray-700">
          {/* User Info */}
          <div className="p-3">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0">
                {getUserName().charAt(0).toUpperCase()}
              </div>
              {sidebarOpen && (
                <div className="flex-1 text-left">
                  <p className="font-semibold text-sm truncate">{getUserName()}</p>
                  <p className="text-xs text-gray-400">Administrator</p>
                </div>
              )}
              {sidebarOpen && (
                <div className="flex-shrink-0">
                  {userMenuOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              )}
            </button>
            
            {userMenuOpen && sidebarOpen && (
              <div className="mt-2 pl-12 space-y-1">
                <button 
                  onClick={() => { navigate('/admin/settings'); setUserMenuOpen(false); }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" /> Settings
                </button>
                <button 
                  onClick={() => { navigate('/admin/profile'); setUserMenuOpen(false); }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-2"
                >
                  <User className="w-4 h-4" /> Profile
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-2">
                  <Activity className="w-4 h-4" /> Activity
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-2">
                  <Bell className="w-4 h-4" /> Notifications
                </button>
              </div>
            )}
          </div>

          {/* Logout Button */}
          <div className="p-3 pt-0">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 text-gray-300 hover:bg-red-600/20 hover:text-red-400 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              {sidebarOpen && <span className="text-sm">Logout</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

export default AdminSidebar