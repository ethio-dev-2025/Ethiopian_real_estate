// src/components/layout/AdminLayout.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import { LogOut, Bell, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const AdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // Auto-close sidebar on mobile, auto-open on desktop
      if (mobile) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // Close sidebar on mobile when route changes
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) return;
        const response = await fetch('http://localhost:8000/api/messages/unread-count', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setUnreadCount(data.count || 0);
        }
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };
    
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, []);

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/admin' || path === '/admin/dashboard') return 'Dashboard';
    if (path.includes('/users')) return 'User Management';
    if (path.includes('/verification-queue')) return 'Verification Queue';
    if (path.includes('/payment-approvals')) return 'Payment History'; // Changed from 'Payment Approvals' to 'Payment History'
    if (path.includes('/reports')) return 'Reports & Analytics';
    if (path.includes('/messages')) return 'Admin Messages';
    if (path.includes('/settings')) return 'Settings';
    return 'Admin Panel';
  };

  const getUserName = () => {
    if (user?.full_name) return user.full_name;
    if (user?.username) return user.username;
    return 'Admin';
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminSidebar 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
        unreadCount={unreadCount}
        isMobile={isMobile}
      />
      
      {/* Main Content */}
      <div className={`transition-all duration-300 ease-in-out
        ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}
      `}>
        {/* Mobile Header */}
        <header className="sticky top-0 z-20 bg-white shadow-sm lg:shadow-none">
          <div className="flex items-center justify-between px-4 py-3 lg:px-6 lg:py-4">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Menu className="w-5 h-5 text-gray-700" />
            </button>
            
            {/* Page Title - Hidden on mobile (shown in header) */}
            <div className="flex-1 lg:flex-none">
              <h1 className="text-lg font-bold text-gray-900 lg:text-xl lg:hidden">
                {getPageTitle()}
              </h1>
            </div>
            
            {/* Desktop Title */}
            <div className="hidden lg:block flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{getPageTitle()}</h1>
              <p className="text-sm text-gray-500">Welcome back, {getUserName()}</p>
            </div>
            
            {/* Notifications */}
            <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <Bell className="w-5 h-5 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              )}
            </button>
          </div>
        </header>
        
        {/* Main Content Area */}
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;