// src/components/layout/AdminSidebar.jsx
import React, { useState, useEffect } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { 
  Building2, LayoutDashboard, Users, FileCheck, 
  CreditCard, MessageCircle, Settings, LogOut,
  Menu, X, BarChart3, User, Activity, Bell, 
  Home, Shield, DollarSign, ChevronDown, ChevronUp,
  UserCog, Building, TrendingUp, Key, Monitor,
  Globe, Wallet, Lock, Bell as BellIcon, ChevronRight
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

const API_URL = 'http://localhost:8000'

const AdminSidebar = ({ sidebarOpen, setSidebarOpen, unreadCount = 0 }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout, refreshUser } = useAuth()
  const [pendingCount, setPendingCount] = useState(0)
  const [pendingPaymentsCount, setPendingPaymentsCount] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const [adminMessagesUnreadCount, setAdminMessagesUnreadCount] = useState(0)
  
  // Main Settings dropdown state
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [adminSettingsOpen, setAdminSettingsOpen] = useState(false)
  const [companySettingsOpen, setCompanySettingsOpen] = useState(false)

  // Force refresh user data every 5 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      if (refreshUser) {
        const freshUser = await refreshUser();
        console.log('Auto-refreshed user:', freshUser);
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [refreshUser]);

  // Listen for storage events (when user data changes in another tab)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'user') {
        console.log('User data changed in storage, refreshing...');
        if (refreshUser) {
          refreshUser();
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [refreshUser]);

  // Listener for admin messages unread updates
  useEffect(() => {
    const handleUnreadUpdate = (event) => {
      if (event.detail?.count !== undefined) {
        console.log('📬 Admin sidebar received unread update:', event.detail.count);
        setAdminMessagesUnreadCount(event.detail.count);
      }
    };
    
    window.addEventListener('admin_unread_update', handleUnreadUpdate);
    
    const savedCount = localStorage.getItem('admin_unread_count');
    if (savedCount) {
      setAdminMessagesUnreadCount(parseInt(savedCount));
    }
    
    // Fetch unread count from API
    const fetchUnreadCount = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${API_URL}/api/messages/unread-count`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          const count = data.unread_count || data.count || 0;
          setAdminMessagesUnreadCount(count);
          localStorage.setItem('admin_unread_count', count.toString());
        }
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };
    
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    
    return () => {
      window.removeEventListener('admin_unread_update', handleUnreadUpdate);
      clearInterval(interval);
    };
  }, []);

  const fetchAllCounts = async () => {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) return
      
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
      
      try {
        const paymentResponse = await fetch(`${API_URL}/api/payment/admin/payments?status=pending`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (paymentResponse.ok) {
          const payments = await paymentResponse.json()
          const count = Array.isArray(payments) ? payments.length : 0
          setPendingPaymentsCount(count)
          localStorage.setItem('pendingPaymentsCount', count.toString())
        }
      } catch (e) {
        console.error('Error fetching payments:', e)
      }
    } catch (error) {
      console.error('Error fetching counts:', error)
    }
  }

  useEffect(() => {
    const handlePaymentUpdate = () => {
      fetchAllCounts()
    }
    
    window.addEventListener('payment-updated', handlePaymentUpdate)
    window.addEventListener('storage', (e) => {
      if (e.key === 'pendingPaymentsCount') {
        const newCount = parseInt(e.newValue, 10)
        if (!isNaN(newCount)) {
          setPendingPaymentsCount(newCount)
        }
      }
    })
    
    return () => {
      window.removeEventListener('payment-updated', handlePaymentUpdate)
    }
  }, [])

  useEffect(() => {
    fetchAllCounts()
    
    const interval = setInterval(fetchAllCounts, 10000)
    
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => {
      clearInterval(interval)
      window.removeEventListener('resize', checkMobile)
    }
  }, [])

  // Auto-expand settings if any route is active
  useEffect(() => {
    const isSettingsActive = location.pathname.startsWith('/admin/settings') || 
                             location.pathname.startsWith('/admin/company-settings')
    
    if (isSettingsActive) {
      setSettingsOpen(true)
      
      if (location.pathname.startsWith('/admin/settings')) {
        setAdminSettingsOpen(true)
      }
      if (location.pathname.startsWith('/admin/company-settings')) {
        setCompanySettingsOpen(true)
      }
    }
  }, [location.pathname])

 // In AdminSidebar.jsx, update the menuItems array - remove the badge from Payment History
const menuItems = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { path: '/admin/users', label: 'User Management', icon: Users },
  { path: '/admin/verification-queue', label: 'Verification Queue', icon: FileCheck, badge: pendingCount },
  { path: '/admin/payment-approvals', label: 'Payment History', icon: CreditCard }, // Removed badge here
  { path: '/admin/reports', label: 'Reports & Analytics', icon: BarChart3 },
  { path: '/admin/messages', label: 'Messages', icon: MessageCircle, badge: adminMessagesUnreadCount },
]

  const handleLogoutClick = () => {
    logout()
    toast.success('Logged out successfully')
  }

  const getUserName = () => {
    if (user?.full_name) return user.full_name
    if (user?.username) return user.username
    return 'Admin'
  }

  const getUserPosition = () => {
    if (user?.position) return user.position
    return 'Administrator'
  }

  return (
    <>
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
            
            const hasBadge = item.badge !== undefined && item.badge > 0
            
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
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && (
                  <div className="flex-1 flex items-center justify-between">
                    <span className="text-sm">{item.label}</span>
                    {hasBadge && (
                      <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full ml-2 animate-pulse">
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                  </div>
                )}
                {!sidebarOpen && hasBadge && (
                  <span className="absolute right-2 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                )}
              </NavLink>
            )
          })}

          {/* ========== SETTINGS DROPDOWN (MAIN) ========== */}
          <div className="settings-dropdown mt-2">
            <button
              onClick={() => sidebarOpen && setSettingsOpen(!settingsOpen)}
              className={`w-full flex items-center justify-between px-5 py-3 transition-colors ${
                location.pathname.startsWith('/admin/settings') || location.pathname.startsWith('/admin/company-settings')
                  ? 'bg-blue-600 text-white border-r-4 border-blue-400' 
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span className="text-sm font-medium">Settings</span>}
              </div>
              {sidebarOpen && (
                <span className="text-gray-400">
                  {settingsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </span>
              )}
            </button>
            
            {sidebarOpen && settingsOpen && (
              <div className="bg-gray-800/30 ml-6 mt-1 rounded-lg overflow-hidden">
                <NavLink
                  to="/admin/settings"
                  onClick={() => setSettingsOpen(true)}
                  className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${
                    location.pathname.startsWith('/admin/settings')
                      ? 'bg-blue-600/50 text-white border-l-2 border-blue-400' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                  }`}
                >
                  <UserCog className="w-4 h-4" />
                  <span className="text-sm">Admin Settings</span>
                </NavLink>
                
                <NavLink
                  to="/admin/company-settings"
                  onClick={() => setSettingsOpen(true)}
                  className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${
                    location.pathname.startsWith('/admin/company-settings')
                      ? 'bg-blue-600/50 text-white border-l-2 border-blue-400' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                  }`}
                >
                  <Building className="w-4 h-4" />
                  <span className="text-sm">Company Settings</span>
                </NavLink>
              </div>
            )}
          </div>
        </nav>

        {/* Bottom Section - User Info */}
        <div className="border-t border-gray-700">
          <div className="p-3">
            <div className="w-full flex items-center gap-3 p-2 rounded-lg">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0">
                {getUserName().charAt(0).toUpperCase()}
              </div>
              {sidebarOpen && (
                <div className="flex-1 text-left">
                  <p className="font-semibold text-sm truncate">{getUserName()}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <p className="text-xs text-gray-400">{getUserPosition()}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="p-3 pt-0">
            <button
              onClick={handleLogoutClick}
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