import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import SellerSidebar from './SellerSidebar';
import { Menu, Zap, Clock, Shield, CreditCard, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const API_URL = 'http://localhost:8000';

const SellerLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activationStatus, setActivationStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, forceRefreshUser } = useAuth();

  // Shared state that will be passed to sidebar via event
  const [sharedStatus, setSharedStatus] = useState({
    daysRemaining: 0,
    hasActiveSubscription: false,
    status: 'pending',
    message: ''
  });

  const calculateDaysRemaining = (endDateString) => {
    if (!endDateString) return 0;
    try {
      const end = new Date(endDateString);
      const now = new Date();
      const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return diff > 0 ? diff : 0;
    } catch (error) {
      return 0;
    }
  };

  const fetchActivationStatus = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;
      
      const response = await fetch(`${API_URL}/api/activation/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('📊 SellerLayout - Activation Status:', data);
        setActivationStatus(data);
        
        let days = data.days_remaining || 0;
        
        // Calculate days from subscription_end_date if available
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
        
        const newSharedStatus = {
          daysRemaining: days,
          hasActiveSubscription: hasActive,
          status: data.status,
          message: data.message,
          can_create_listings: data.can_create_listings,
          is_activated: data.is_activated
        };
        
        setSharedStatus(newSharedStatus);
        
        // Dispatch event for sidebar to sync
        window.dispatchEvent(new CustomEvent('activation_status_update', { 
          detail: newSharedStatus
        }));
        
        // Also dispatch subscription update for backward compatibility
        window.dispatchEvent(new CustomEvent('subscription_update', { 
          detail: { daysRemaining: days, hasActiveSubscription: hasActive }
        }));
        
        // Store in localStorage for persistence
        localStorage.setItem('seller_days_remaining', days.toString());
        localStorage.setItem('seller_has_active_subscription', hasActive.toString());
        localStorage.setItem('activation_status', JSON.stringify(newSharedStatus));
      }
    } catch (error) {
      console.error('Error fetching activation status:', error);
    }
  }, [user]);

  useEffect(() => {
    // Load from localStorage first for immediate display
    const storedStatus = localStorage.getItem('activation_status');
    if (storedStatus) {
      try {
        const parsed = JSON.parse(storedStatus);
        setSharedStatus(parsed);
      } catch (e) {}
    }
    
    fetchActivationStatus();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchActivationStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchActivationStatus]);

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

  const getBadgeInfo = () => {
    const { status, daysRemaining, hasActiveSubscription } = sharedStatus;
    
    // Check activation status first
    if (status === 'documents_pending') {
      return {
        text: 'Pending Approval',
        color: 'bg-red-500',
        icon: <Shield className="w-3 h-3" />,
        action: '/dashboard/activation'
      };
    }
    
    if (status === 'documents_approved') {
      return {
        text: 'Subscribe Now',
        color: 'bg-yellow-500',
        icon: <CreditCard className="w-3 h-3" />,
        action: '/dashboard/subscription'
      };
    }
    
    if (status === 'payment_pending') {
      return {
        text: 'Payment Pending',
        color: 'bg-orange-500',
        icon: <Clock className="w-3 h-3" />,
        action: '/dashboard/subscription'
      };
    }
    
    if (status === 'not_submitted') {
      return {
        text: 'inactive',
        color: 'bg-red-500',
        icon: <Shield className="w-3 h-3" />,
        action: '/dashboard/activation'
      };
    }
    
    if (status === 'fully_activated' && daysRemaining > 0) {
      if (daysRemaining <= 30) {
        return {
          text: `${daysRemaining}d left`,
          color: 'bg-orange-500',
          icon: <Clock className="w-3 h-3" />,
          action: '/dashboard/subscription'
        };
      }
      return {
        text: `${daysRemaining}d left`,
        color: 'bg-green-500',
        icon: <Clock className="w-3 h-3" />,
        action: '/dashboard/subscription'
      };
    }
    
    if (status === 'subscription_expired' || daysRemaining === 0) {
      return {
        text: 'Renew',
        color: 'bg-red-500',
        icon: <CreditCard className="w-3 h-3" />,
        action: '/dashboard/subscription'
      };
    }
    
    return {
      text: 'Pending',
      color: 'bg-gray-500',
      icon: <AlertCircle className="w-3 h-3" />,
      action: '/dashboard/activation'
    };
  };

  const badge = getBadgeInfo();

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

  const handleBadgeClick = () => {
    navigate(badge.action);
  };

  // Pass shared status to sidebar via context or prop
  // Using window event for now

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
              onClick={handleBadgeClick}
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
                  onClick={handleBadgeClick}
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