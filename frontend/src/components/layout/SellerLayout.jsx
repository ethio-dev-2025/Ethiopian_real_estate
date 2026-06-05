import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import SellerSidebar from './SellerSidebar';
import { Menu, Zap, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const SellerLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [isExpiringSoon, setIsExpiringSoon] = useState(false);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, forceRefreshUser } = useAuth();

  const calculateDaysRemaining = (endDateString) => {
    if (!endDateString) return 0;
    try {
      const end = new Date(endDateString);
      const now = new Date();
      const diff = end - now;
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
      return days > 0 ? days : 0;
    } catch (error) {
      console.error('Error calculating days:', error);
      return 0;
    }
  };

  const refreshSubscriptionStatus = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setLoading(false);
        return;
      }
      
      // ALWAYS fetch from API first - most reliable source
      const response = await fetch('http://localhost:8000/api/activation/status', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('📊 SellerLayout - API Status:', data);
        
        const days = data.days_remaining || 0;
        const hasActive = data.can_create_listings === true && days > 0;
        
        setDaysRemaining(days);
        setHasActiveSubscription(hasActive);
        setIsExpiringSoon(days > 0 && days <= 30);
        setLoading(false);
        return;
      }
      
      // Fallback to user object - but only use real data
      let currentUser = user;
      if (!currentUser) {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          currentUser = JSON.parse(storedUser);
        }
      }
      
      if (currentUser) {
        // Only use actual subscription_end_date, NO HARDCODED VALUES
        let days = calculateDaysRemaining(currentUser.subscription_end_date);
        const hasActive = (currentUser.has_active_subscription === true || 
                          currentUser.can_create_listings === true) && days > 0;
        
        console.log('📊 SellerLayout - User data:', {
          subscription_end_date: currentUser.subscription_end_date,
          daysRemaining: days,
          hasActiveSubscription: hasActive
        });
        
        setDaysRemaining(days);
        setHasActiveSubscription(hasActive);
        setIsExpiringSoon(days > 0 && days <= 30);
      } else {
        setDaysRemaining(0);
        setHasActiveSubscription(false);
        setIsExpiringSoon(false);
      }
    } catch (error) {
      console.error('Error refreshing subscription status:', error);
      setDaysRemaining(0);
      setHasActiveSubscription(false);
      setIsExpiringSoon(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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
    if (loading) {
      return {
        text: 'Loading...',
        color: 'bg-gray-500',
        icon: <Clock className="w-3 h-3 animate-spin" />
      };
    }
    
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