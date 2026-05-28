import React, { useState, useEffect, useCallback, memo, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { 
  Building2, MessageSquare, Settings, LogOut,
  PlusCircle, List, Shield, CreditCard, Menu, X,
  LayoutDashboard, Users, UserCheck, TrendingUp, DollarSign
} from 'lucide-react'
  // Add import
import { cachedFetch, invalidateCache } from '../../utils/apiCache';


const API_URL = 'http://localhost:8000'

const AppSidebar = memo(({ sidebarOpen, setSidebarOpen }) => {
  const { user: authUser, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isMobile, setIsMobile] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [pendingVerifications, setPendingVerifications] = useState(0)
  const [user, setUser] = useState(null)
  const navigationTimeoutRef = useRef(null)

  // Load user from both auth context and localStorage
  useEffect(() => {
    let currentUser = authUser
    
    if (!currentUser) {
      try {
        const storedUser = localStorage.getItem('user')
        if (storedUser) {
          currentUser = JSON.parse(storedUser)
        }
      } catch (e) {
        console.error('Error parsing user from localStorage:', e)
      }
    }
    
    setUser(currentUser)
  }, [authUser])

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
  

// Replace the fetch functions:
const fetchUnreadCount = async () => {
  try {
    const token = localStorage.getItem('access_token')
    if (!token) return
    const data = await cachedFetch(`${API_URL}/api/messages/unread-count`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    setUnreadCount(data.count || 0)
  } catch (error) {
    console.error('Error fetching unread count:', error)
  }
}

const fetchPendingVerifications = async () => {
  try {
    const token = localStorage.getItem('access_token')
    if (!token) return
    
    let userRole = 'user'
    if (authUser && authUser.role_type) {
      userRole = authUser.role_type
    } else {
      try {
        const storedUser = localStorage.getItem('user')
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser)
          userRole = parsedUser.role_type || 'user'
        }
      } catch (e) {}
    }
    
    if (userRole === 'admin') {
      const data = await cachedFetch(`${API_URL}/api/activation/admin/pending-count`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      setPendingVerifications(data.count || 0)
    }
  } catch (error) {
    console.error('Error fetching pending verifications:', error)
  }
}
    
    const fetchPendingVerifications = async () => {
      try {
        const token = localStorage.getItem('access_token')
        if (!token) return
        
        let userRole = 'user'
        if (authUser && authUser.role_type) {
          userRole = authUser.role_type
        } else {
          try {
            const storedUser = localStorage.getItem('user')
            if (storedUser) {
              const parsedUser = JSON.parse(storedUser)
              userRole = parsedUser.role_type || 'user'
            }
          } catch (e) {}
        }
        
        if (userRole === 'admin') {
          const response = await fetch(`${API_URL}/api/activation/admin/pending-count`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          if (response.ok) {
            const data = await response.json()
            setPendingVerifications(data.count || 0)
          }
        }
      } catch (error) {
        console.error('Error fetching pending verifications:', error)
      }
    }
    
    fetchUnreadCount()
    fetchPendingVerifications()
    
    // FIX 3: Increased interval from 30 seconds to 60 seconds
    const interval = setInterval(() => {
      fetchUnreadCount()
      fetchPendingVerifications()
    }, 60000)  // Changed from 30000 to 60000
    
    return () => {
      window.removeEventListener('resize', checkMobile)
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current)
      }
      clearInterval(interval)
    }
  }, [authUser])

  const handleLogout = useCallback(() => {
    logout()
    navigate('/login')
  }, [logout, navigate])

  const handleNavigation = useCallback((path) => {
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current)
    }
    
    navigationTimeoutRef.current = setTimeout(() => {
      if (location.pathname !== path) {
        navigate(path)
      }
    }, 50)
  }, [navigate, location.pathname])

  // Get user role
  let userRole = 'user'
  
  if (user && user.role_type) {
    userRole = user.role_type
  } else {
    try {
      const storedUser = localStorage.getItem('user')
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser)
        if (parsedUser.role_type) {
          userRole = parsedUser.role_type
        }
      }
    } catch (e) {
      console.error('Error parsing user from localStorage:', e)
    }
  }
  
  const isAdmin = userRole === 'admin'
  const isSeller = userRole === 'seller' || userRole === 'dual'
  const isLandlord = userRole === 'landlord' || userRole === 'dual'

  // ============ SELLER/LANDLORD MENU ITEMS ============
  const sellerMenuItems = [
    { id: 'seller-dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { id: 'seller-create-listing', label: 'Create Listing', icon: PlusCircle, path: '/create-listing' },
    { id: 'seller-my-listings', label: 'My Listings', icon: List, path: '/my-listings' },
    { id: 'seller-activation', label: 'Activation', icon: Shield, path: '/activation' },
    { id: 'seller-messages', label: 'Messages', icon: MessageSquare, path: '/dashboard/messages', badge: unreadCount },
    { id: 'seller-subscription', label: 'Subscription', icon: CreditCard, path: '/subscription' },
    { id: 'seller-settings', label: 'Settings', icon: Settings, path: '/settings' }
  ]

  // ADMIN MENU ITEMS - ONLY ONE BADGE
  const adminMenuItems = [
    { id: 'admin-dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
    { id: 'admin-users', label: 'User Management', icon: Users, path: '/admin/users' },
    { id: 'admin-verification', label: 'Verification Queue', icon: UserCheck, path: '/admin/verification-queue', badge: pendingVerifications },
    { id: 'admin-payments', label: 'Payment Approvals', icon: DollarSign, path: '/admin/payments' },
    { id: 'admin-reports', label: 'Reports', icon: TrendingUp, path: '/admin/reports' },
    { id: 'admin-messages', label: 'Messages', icon: MessageSquare, path: '/admin/messages', badge: unreadCount },
    { id: 'admin-settings', label: 'Settings', icon: Settings, path: '/admin/settings' }
  ]

  // ============ DEFAULT USER MENU ITEMS ============
  const defaultMenuItems = [
    { id: 'default-dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { id: 'default-messages', label: 'Messages', icon: MessageSquare, path: '/dashboard/messages', badge: unreadCount },
    { id: 'default-settings', label: 'Settings', icon: Settings, path: '/settings' }
  ]

  // Select menu items based on user role
  let menuItems = []
  let defaultPath = '/'
  
  if (isAdmin) {
    menuItems = adminMenuItems
    defaultPath = '/admin/dashboard'
  } else if (isSeller || isLandlord) {
    menuItems = sellerMenuItems
    defaultPath = '/dashboard'
  } else {
    menuItems = defaultMenuItems
    defaultPath = '/dashboard'
  }

  // Get user status display
  const getUserStatusDisplay = useCallback(() => {
    let userStatus = 'pending'
    
    if (user && user.status) {
      userStatus = user.status
    } else {
      try {
        const storedUser = localStorage.getItem('user')
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser)
          userStatus = parsedUser.status || 'pending'
        }
      } catch (e) {}
    }
    
    if (userStatus === 'active') {
      return { text: 'Active', color: 'text-green-400', dotColor: 'bg-green-500' }
    }
    if (userStatus === 'pending') {
      return { text: 'Pending', color: 'text-yellow-400', dotColor: 'bg-yellow-500' }
    }
    if (userStatus === 'suspended') {
      return { text: 'Suspended', color: 'text-red-400', dotColor: 'bg-red-500' }
    }
    return { text: 'Pending', color: 'text-yellow-400', dotColor: 'bg-yellow-500' }
  }, [user])

  const statusDisplay = getUserStatusDisplay()
  
  // Get user display name
  let userDisplayName = 'User'
  if (user && user.full_name) {
    userDisplayName = user.full_name
  } else if (user && user.username) {
    userDisplayName = user.username
  } else {
    try {
      const storedUser = localStorage.getItem('user')
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser)
        userDisplayName = parsedUser.full_name || parsedUser.username || 'User'
      }
    } catch (e) {}
  }
  
  const getRoleDisplay = () => {
    if (isAdmin) return 'Administrator'
    if (isSeller && isLandlord) return 'Seller & Landlord'
    if (isSeller) return 'Seller'
    if (isLandlord) return 'Landlord'
    return 'User'
  }

  return (
    <>
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-20" onClick={() => setSidebarOpen(false)} />
      )}
      
      <aside className={`fixed top-0 left-0 z-40 h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'} ${isMobile && !sidebarOpen ? '-translate-x-full' : 'translate-x-0'}`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-5 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleNavigation(defaultPath)}>
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                {sidebarOpen && (
                  <div>
                    <span className="text-xl font-bold tracking-tight">EstateHub</span>
                    <p className="text-xs text-gray-400">Real Estate Pro</p>
                  </div>
                )}
              </div>
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg hover:bg-gray-700 transition-all hidden md:block">
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path || 
                (item.path === '/admin/dashboard' && location.pathname.startsWith('/admin')) ||
                (item.path === '/dashboard/messages' && location.pathname === '/dashboard/messages')
              
              const hasBadge = item.badge && item.badge > 0
              
              return (
                <div
                  key={item.id}
                  onClick={() => handleNavigation(item.path)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 cursor-pointer ${
                    isActive 
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' 
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleNavigation(item.path)}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {sidebarOpen ? (
                    <>
                      <span className="flex-1 text-left text-sm font-medium">{item.label}</span>
                      {hasBadge && (
                        <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-5 text-center animate-pulse">
                          {item.badge > 99 ? '99+' : item.badge}
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      {hasBadge && (
                        <span className="absolute right-2 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                      )}
                    </>
                  )}
                </div>
              )
            })}
          </nav>

          {/* Logout Button */}
          <div className="p-4 border-t border-gray-700">
            <div
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-gray-300 hover:bg-red-600 hover:text-white transition-all"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleLogout()}
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span className="text-sm font-medium">Logout</span>}
            </div>
          </div>

          {/* User Info */}
          <div className="p-4 pt-0 pb-5">
            <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-gray-800/50">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md flex-shrink-0">
                <span className="text-white font-bold text-sm">
                  {userDisplayName.charAt(0).toUpperCase()}
                </span>
              </div>
              {sidebarOpen && (
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{userDisplayName}</p>
                  <p className="text-xs text-gray-400 truncate">{getRoleDisplay()}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <div className={`w-2 h-2 ${statusDisplay.dotColor} rounded-full animate-pulse`}></div>
                    <span className={`text-xs ${statusDisplay.color}`}>{statusDisplay.text}</span>
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

AppSidebar.displayName = 'AppSidebar'

export default AppSidebar