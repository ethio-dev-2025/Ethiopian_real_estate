// src/components/layout/SellerLayout.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  PlusCircle,
  List,
  MessageCircle,
  CheckCircle,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X,
  Home,
  User,
  Building2
} from 'lucide-react';
import toast from 'react-hot-toast';

const SellerLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const navigationTimeoutRef = useRef(null);

  console.log('SellerLayout rendering - Current path:', location.pathname);
  console.log('SellerLayout - User:', user);

  // Check mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch unread messages count
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
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleNavigation = useCallback((path) => {
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
    }
    navigationTimeoutRef.current = setTimeout(() => {
      if (location.pathname !== path) {
        console.log('Navigating to:', path);
        navigate(path);
      }
    }, 50);
  }, [navigate, location.pathname]);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const isActive = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/';
    }
    return location.pathname === path;
  };

  // Menu items for seller
  const menuItems = [
    { key: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { key: '/create-listing', label: 'Create Listing', icon: <PlusCircle size={18} /> },
    { key: '/listings', label: 'My Listings', icon: <List size={18} /> },
    { key: '/messages', label: 'Messages', icon: <MessageCircle size={18} />, badge: unreadCount },
    { key: '/activation', label: 'Activation', icon: <CheckCircle size={18} /> },
    { key: '/subscription', label: 'Subscription', icon: <CreditCard size={18} /> },
    { key: '/settings', label: 'Settings', icon: <Settings size={18} /> }
  ];

  // Get user info
  const userDisplayName = user?.full_name || user?.username || 'Seller';
  const userRole = 'Seller Account';

  // Auto-close sidebar on mobile when navigating
  useEffect(() => {
    if (isMobile && !collapsed) {
      setCollapsed(true);
    }
  }, [location.pathname, isMobile]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
      {/* Sidebar */}
      <div style={{
        width: collapsed ? (isMobile ? 0 : 80) : 260,
        backgroundColor: '#001529',
        transition: 'all 0.3s ease',
        position: 'fixed',
        height: '100vh',
        left: 0,
        top: 0,
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '2px 0 8px rgba(0,0,0,0.15)',
        overflow: 'hidden'
      }}>
        {/* Logo */}
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          gap: 8
        }}>
          {!collapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => handleNavigation('/dashboard')}>
              <div style={{
                width: 32,
                height: 32,
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Building2 size={16} color="white" />
              </div>
              <span style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>EstateHub</span>
            </div>
          )}
          {!isMobile && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.65)',
                cursor: 'pointer',
                padding: 4
              }}
            >
              {collapsed ? <Menu size={18} /> : <X size={18} />}
            </button>
          )}
        </div>

        {/* Menu Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 0' }}>
          {menuItems.map((item) => (
            <div
              key={item.key}
              onClick={() => handleNavigation(item.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: collapsed ? 'center' : 'flex-start',
                gap: 12,
                padding: '12px 16px',
                margin: '4px 8px',
                borderRadius: 8,
                color: isActive(item.key) ? '#1890ff' : 'rgba(255,255,255,0.65)',
                backgroundColor: isActive(item.key) ? 'rgba(24,144,255,0.1)' : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.3s',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                if (!isActive(item.key)) {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive(item.key)) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <span style={{ color: isActive(item.key) ? '#1890ff' : 'rgba(255,255,255,0.65)' }}>
                {item.icon}
              </span>
              {!collapsed && (
                <>
                  <span style={{ flex: 1, fontSize: 14 }}>{item.label}</span>
                  {item.badge > 0 && (
                    <span style={{
                      backgroundColor: '#f44336',
                      color: 'white',
                      fontSize: 10,
                      borderRadius: 10,
                      padding: '2px 6px',
                      minWidth: 18,
                      textAlign: 'center'
                    }}>
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </>
              )}
              {collapsed && item.badge > 0 && (
                <span style={{
                  position: 'absolute',
                  top: 4,
                  right: 8,
                  width: 8,
                  height: 8,
                  backgroundColor: '#f44336',
                  borderRadius: '50%'
                }} />
              )}
            </div>
          ))}
        </div>

        {/* User Info & Logout */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', padding: '16px' }}>
          {!collapsed && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 16,
              padding: '8px',
              backgroundColor: 'rgba(255,255,255,0.05)',
              borderRadius: 8
            }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                backgroundColor: '#1890ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <User size={18} color="white" />
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontSize: 14, fontWeight: 'bold', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {userDisplayName}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>{userRole}</div>
              </div>
            </div>
          )}
          
          <div
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-start',
              gap: 12,
              width: '100%',
              padding: '10px 16px',
              backgroundColor: 'rgba(255,255,255,0.05)',
              borderRadius: 8,
              color: 'rgba(255,255,255,0.65)',
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(244,67,54,0.2)';
              e.currentTarget.style.color = '#f44336';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
              e.currentTarget.style.color = 'rgba(255,255,255,0.65)';
            }}
          >
            <LogOut size={18} />
            {!collapsed && <span>Logout</span>}
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {isMobile && !collapsed && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 99
          }}
          onClick={() => setCollapsed(true)}
        />
      )}

      {/* Main Content */}
      <div style={{
        flex: 1,
        marginLeft: collapsed ? (isMobile ? 0 : 80) : 260,
        transition: 'all 0.3s ease',
        minHeight: '100vh'
      }}>
        {/* Header - WITHOUT "Seller Dashboard" text */}
        <div style={{
          height: 64,
          backgroundColor: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          padding: '0 24px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          position: 'sticky',
          top: 0,
          zIndex: 99
        }}>
          {isMobile && (
            <button
              onClick={() => setCollapsed(false)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 8,
                marginRight: 'auto'
              }}
            >
              <Menu size={20} />
            </button>
          )}
        </div>

        {/* Page Content */}
        <div style={{ padding: '24px' }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default SellerLayout;