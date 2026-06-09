// src/components/layout/SellerLayout.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import SellerSidebar from './SellerSidebar';
import { Menu, Zap, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const SellerLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState(() => {
    const saved = localStorage.getItem('seller_days_remaining');
    return saved ? parseInt(saved) : 0;
  });
  const [hasActiveSubscription, setHasActiveSubscription] = useState(() => {
    const saved = localStorage.getItem('seller_has_active_subscription');
    return saved === 'true';
  });
  const [isExpiringSoon, setIsExpiringSoon] = useState(false);
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, forceRefreshUser } = useAuth();

  const calculateDaysRemaining = (endDateString) => {
    if (!endDateString) return 0;
    try {
      const end = new Date(endDateString);
      const now = new Date();
      const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return diff > 0 ? diff : 0;
    } catch (error) {
      console.error('Error calculating days:', error);
      return 0;
    }
  };

  const updateDaysRemaining = (days, hasActive) => {
    setDaysRemaining(days);
    setHasActiveSubscription(hasActive);
    setIsExpiringSoon(days > 0 && days <= 30);
    
    localStorage.setItem('seller_days_remaining', days.toString());
    localStorage.setItem('seller_has_active_subscription', hasActive.toString());
  };

  useEffect(() => {
    const handleImmediateUpdate = (event) => {
      if (event.detail) {
        console.log('📡 Layout received immediate update:', event.detail);
        updateDaysRemaining(event.detail.daysRemaining, event.detail.hasActiveSubscription);
      }
    };
    
    window.addEventListener('subscription_immediate_update', handleImmediateUpdate);
    
    return () => {
      window.removeEventListener('subscription_immediate_update', handleImmediateUpdate);
    };
  }, []);

  const refreshSubscriptionStatus = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;
      
      const response = await fetch('http://localhost:8000/api/activation/status', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('📊 SellerLayout - API Status (background):', data);
        
        let days = data.days_remaining || 0;
        
        let currentUser = user;
        if (!currentUser) {
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            currentUser = JSON.parse(storedUser);
          }
        }
        
        if (currentUser?.subscription_end_date && days === 0) {
          const calculatedDays = calculateDaysRemaining(currentUser.subscription_end_date);
          if (calculatedDays > 0) {
            days = calculatedDays;
          }
        }
        
        const hasActive = data.can_create_listings === true && days > 0;
        
        updateDaysRemaining(days, hasActive);
        
        window.dispatchEvent(new CustomEvent('subscription_update', { 
          detail: { daysRemaining: days, hasActiveSubscription: hasActive }
        }));
      }
    } catch (error) {
      console.error('Error refreshing subscription status:', error);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const currentUser = JSON.parse(storedUser);
        if (currentUser?.subscription_end_date) {
          const days = calculateDaysRemaining(currentUser.subscription_end_date);
          const hasActive = (currentUser.has_active_subscription === true || 
                            currentUser.can_create_listings === true) && days > 0;
          updateDaysRemaining(days, hasActive);
        }
      } catch (e) {}
    }
    
    refreshSubscriptionStatus();
    
    const interval = setInterval(refreshSubscriptionStatus, 30000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
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
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Dashboard';
    if (path.includes('/create-listing')) return 'Create Listing';
    if (path.includes('/listings')) return 'My Listings';
    if (path.includes('/messages')) return 'Messages';
    if (path.includes('/activation')) return 'Activation';
    if (path.includes('/subscription')) return 'Subscription';
    if (path.includes('/settings')) return 'Settings';
    return 'Dashboard';
  };

  const getSubscriptionBadge = () => {
    if (!hasActiveSubscription || daysRemaining === 0) {
      return {
        text: 'Inactive',
        color: 'bg-red-500',
        icon: <Zap className="w-3 h-3" />
      };
    }
    if (isExpiringSoon) {
      return {
        text: `${daysRemaining}d left`,
        color: 'bg-orange-500',
        icon: <Clock className="w-3 h-3" />
      };
    }
    return {
      text: `${daysRemaining}d left`,
      color: 'bg-green-500',
      icon: <Clock className="w-3 h-3" />
    };
  };

  const badge = getSubscriptionBadge();

  const getUserName = () => {
    try {
      const storedUser = localStorage.getItem('user');
      let currentUser = user;
      
      if (!currentUser && storedUser) {
        currentUser = JSON.parse(storedUser);
      }
      
      if (currentUser?.full_name && currentUser.full_name !== 'vvvvv' && currentUser.full_name !== 'vvvvvvv') {
        return currentUser.full_name;
      }
      if (currentUser?.username && currentUser.username !== 'vvvvv' && currentUser.username !== 'vvvvvvv') {
        return currentUser.username;
      }
      if (currentUser?.email) {
        return currentUser.email.split('@')[0];
      }
      return 'User';
    } catch (error) {
      return 'User';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SellerSidebar 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen}
        isMobile={isMobile}
      />
      
      <div className={`transition-all duration-300 ease-in-out
        ${sidebarOpen && !isMobile ? 'lg:ml-64' : !isMobile ? 'lg:ml-20' : ''}
      `}>
        <header className="sticky top-0 z-30 bg-white shadow-md lg:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
            
            <h1 className="text-lg font-bold text-gray-900">{getPageTitle()}</h1>
            
            <button
              onClick={() => navigate('/dashboard/subscription')}
              className={`${badge.color} text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1`}
            >
              {badge.icon}
              <span>{badge.text}</span>
            </button>
          </div>
        </header>
        
        <header className="hidden lg:block bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{getPageTitle()}</h1>
                <p className="text-gray-500 text-sm mt-1">
                  Welcome back, {getUserName()}
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate('/dashboard/subscription')}
                  className={`${badge.color} text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 hover:opacity-80 transition`}
                >
                  {badge.icon}
                  <span>{badge.text}</span>
                </button>
              </div>
            </div>
          </div>
        </header>
        
        <main className="p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};

export default SellerLayout;