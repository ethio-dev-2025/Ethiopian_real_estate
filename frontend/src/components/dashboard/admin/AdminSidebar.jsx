import React, { useState, useEffect } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { 
  Building2, LayoutDashboard, Users, FileCheck, 
  CreditCard, MessageCircle, Settings, LogOut,
  Menu, X, BarChart3, User, ChevronDown, ChevronUp,
  Activity, Bell, Shield, Award, TrendingUp
} from 'lucide-react'
import toast from 'react-hot-toast'

const API_URL = 'http://localhost:8000'

const AdminSidebar = ({ sidebarOpen, setSidebarOpen, unreadCount = 0 }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)

  // Fetch pending activation requests count for badge
  const fetchPendingCount = async () => {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) return
      
      const response = await fetch(`${API_URL}/api/activation/pending-count`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setPendingCount(data.count || 0)
      }
    } catch (error) {
      console.error('Error fetching pending count:', error)
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
    
    // Fetch pending count on mount
    fetchPendingCount()
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchPendingCount, 30000)
    return () => clearInterval(interval)
  }, [])

  const menuItems = [
    { path: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true, badge: 0 },
    { path: '/admin/users', label: 'User Management', icon: Users, badge: 0 },
    { path: '/admin/verification-queue', label: 'Verification Queue', icon: FileCheck, badge: pendingCount },
    { path: '/admin/payment-approvals', label: 'Payment Approvals', icon: CreditCard, badge: 0 },
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

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-blue-600 text-white rounded-lg shadow-lg"
      >
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full bg-gradient-to-b from-gray-900 to-gray-800 text-white transition-all duration-300 z-40 shadow-xl flex flex-col ${sidebarOpen ? 'w-64' : 'w-20'}`}>
        {/* Logo - Top */}
        <div className="p-5 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <Building2 className="w-8 h-8 text-blue-400 flex-shrink-0" />
            {sidebarOpen && (
              <div className="overflow-hidden">
                <h1 className="font-bold text-lg">EstateHub</h1>
                <p className="text-xs text-gray-400">Real Estate Pro</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Menu - Middle (grows to fill space) */}
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

        {/* User Account Section - Bottom */}
        <div className="border-t border-gray-700">
          {/* Collapse Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center gap-3 px-5 py-3 text-gray-400 hover:text-white transition-colors hover:bg-gray-800"
          >
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            {sidebarOpen && <span className="text-sm">Collapse Menu</span>}
          </button>

          {/* User Profile */}
          <div className="p-3">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0">
                {user?.full_name?.charAt(0) || user?.username?.charAt(0) || 'A'}
              </div>
              {sidebarOpen && (
                <div className="flex-1 text-left">
                  <p className="font-semibold text-sm truncate">{user?.full_name || user?.username || 'Admin'}</p>
                  <p className="text-xs text-gray-400">Administrator</p>
                </div>
              )}
              {sidebarOpen && (
                <div className="flex-shrink-0">
                  {userMenuOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              )}
            </button>
            
            {/* User Dropdown Menu */}
            {userMenuOpen && sidebarOpen && (
              <div className="mt-2 pl-12 space-y-1">
                <button className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-2">
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
      </div>
    </>
  )
}

export default AdminSidebar