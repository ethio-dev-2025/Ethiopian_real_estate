// frontend/src/hooks/useSubscription.js
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

const API_URL = 'http://localhost:8000';

const useSubscription = () => {
  const { user, refreshUser, forceRefreshUser } = useAuth();
  const [subscription, setSubscription] = useState({
    hasActiveSubscription: false,
    canCreateListings: false,
    daysRemaining: 0,
    plan: null,
    endDate: null,
    isExpiringSoon: false,
    message: '',
    loading: true
  });

  const calculateDaysRemaining = (endDateString) => {
    if (!endDateString) return 0;
    try {
      const end = new Date(endDateString);
      const now = new Date();
      const diff = end - now;
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
      return days > 0 ? days : 0;
    } catch (e) {
      console.error('Error calculating days:', e);
      return 0;
    }
  };

  const fetchSubscription = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setSubscription(prev => ({ ...prev, loading: false }));
        return;
      }

      // ALWAYS fetch from API first (most reliable source)
      const response = await fetch(`${API_URL}/api/activation/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📊 useSubscription - From API:', data);
        
        let daysRemaining = data.days_remaining || 0;
        
        // If API didn't return days_remaining but has end date, calculate it
        if (daysRemaining === 0 && data.subscription_end_date) {
          daysRemaining = calculateDaysRemaining(data.subscription_end_date);
        }
        
        const hasActive = data.status === 'fully_activated' || daysRemaining > 0 || data.can_create_listings === true;
        
        setSubscription({
          hasActiveSubscription: hasActive,
          canCreateListings: data.can_create_listings || hasActive,
          daysRemaining: daysRemaining,
          plan: data.subscription_plan || (hasActive ? 'seller' : null),
          endDate: data.subscription_end_date || null,
          isExpiringSoon: daysRemaining > 0 && daysRemaining <= 30,
          message: data.message || (hasActive ? `Active - ${daysRemaining} days remaining` : 'No active subscription'),
          loading: false
        });
        return;
      }
      
      // Fallback to user object from AuthContext
      if (user) {
        let daysRemaining = 0;
        const endDate = user.subscription_end_date;
        
        if (endDate) {
          daysRemaining = calculateDaysRemaining(endDate);
        }
        
        let hasActive = daysRemaining > 0;
        hasActive = hasActive || 
                    user.has_active_subscription === true || 
                    user.can_create_listings === true || 
                    user.is_activated === true;
        
        setSubscription({
          hasActiveSubscription: hasActive,
          canCreateListings: user.can_create_listings === true || hasActive,
          daysRemaining: daysRemaining,
          plan: user.subscription_plan || (hasActive ? 'seller' : null),
          endDate: endDate || null,
          isExpiringSoon: daysRemaining > 0 && daysRemaining <= 30,
          message: hasActive ? `Active - ${daysRemaining} days remaining` : 'No active subscription',
          loading: false
        });
        return;
      }
      
      setSubscription(prev => ({ ...prev, loading: false }));
    } catch (error) {
      console.error('Error fetching subscription:', error);
      setSubscription(prev => ({ ...prev, loading: false }));
    }
  }, [user]);

  const forceRefreshSubscription = useCallback(async () => {
    setSubscription(prev => ({ ...prev, loading: true }));
    try {
      await forceRefreshUser();
      await new Promise(resolve => setTimeout(resolve, 500));
      await fetchSubscription();
    } catch (error) {
      console.error('Force refresh subscription error:', error);
    } finally {
      setSubscription(prev => ({ ...prev, loading: false }));
    }
  }, [forceRefreshUser, fetchSubscription]);

  useEffect(() => {
    fetchSubscription();
    
    // Refresh every 10 seconds for real-time countdown
    const interval = setInterval(() => {
      fetchSubscription();
    }, 10000);
    
    return () => clearInterval(interval);
  }, [fetchSubscription]);

  const checkCanCreateListing = useCallback(async () => {
    if (subscription.hasActiveSubscription && subscription.daysRemaining > 0) {
      return { can_create: true, message: 'Subscription active' };
    }
    return { can_create: false, message: 'No active subscription' };
  }, [subscription]);

  return {
    ...subscription,
    refreshSubscription: fetchSubscription,
    forceRefreshSubscription,
    checkCanCreateListing,
    refreshUser
  };
};

export default useSubscription;