import React, { useState, useEffect, memo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Home, Search, Heart, MessageCircle, Settings, LogOut, Menu, X, ChevronRight, Building2, Bell
} from 'lucide-react';

const BuyerSidebar = memo(({ sidebarOpen, setSidebarOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    const fetchUnreadCount = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) return;
        const response = await fetch('http://localhost:8000/api/buyer/conversations', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const conversations = await response.json();
          const total = conversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);
          setUnreadCount(total);
        }
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };
    
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      clearInterval(interval);
    };
  }, []);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/dashboard/buyer' },
    { id: 'properties', label: 'Browse Properties', icon: Search, path: '/dashboard/buyer/properties' },
    { id: 'saved', label: 'Saved Properties', icon: Heart, path: '/dashboard/buyer/saved' },
    { id: 'messages', label: 'Messages', icon: MessageCircle, path: '/dashboard/buyer/messages', badge: unreadCount },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/dashboard/buyer/settings' }
  ];

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) setSidebarOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const getUserName = () => {
    if (user?.full_name) return user.full_name;
    if (user?.username) return user.username;
    return 'Buyer';
  };

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
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleNavigation('/dashboard/buyer')}>
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                {sidebarOpen && (
                  <div>
                    <span className="text-xl font-bold tracking-tight">EstateHub</span>
                    <p className="text-xs text-slate-400">Buyer Portal</p>
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
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.path)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 ${
                    isActive 
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' 
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
              );
            })}
          </nav>

          {/* Bottom Section */}
          <div className="p-4 border-t border-white/10">
            {sidebarOpen ? (
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-medium">{getUserName().charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{getUserName()}</p>
                    <p className="text-xs text-slate-400 truncate">Buyer Account</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg text-slate-400 hover:bg-red-600 hover:text-white transition-all duration-150"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleLogout}
                className="w-full flex justify-center p-2 rounded-lg text-slate-400 hover:bg-red-600 hover:text-white transition-all duration-150"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
});

BuyerSidebar.displayName = 'BuyerSidebar';

export default BuyerSidebar;