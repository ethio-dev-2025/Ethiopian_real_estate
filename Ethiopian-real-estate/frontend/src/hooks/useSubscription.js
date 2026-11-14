// src/hooks/useSubscription.js
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

const API_BASE = (() => {
  let env = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  env = env.replace(/\/$/, '');
  if (env.endsWith('/api')) env = env.slice(0, -4);
  return env;
})();

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

      const response = await fetch(`${API_BASE}/api/activation/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📊 useSubscription - From API:', data);
        
        // ✅ FORCE data to be handled safely as strings/numbers
        let daysRemaining = Number(data.days_remaining) || 0;
        
        if (daysRemaining === 0 && data.subscription_end_date) {
          daysRemaining = calculateDaysRemaining(data.subscription_end_date);
        }
        
        const canCreate = data.can_create_listings === true;
        const hasActive = canCreate && daysRemaining > 0;
        
        // ✅ Safely extract status text
        const statusText = typeof data.status === 'string' ? data.status : '';
        const planText = typeof data.subscription_plan === 'string' ? data.subscription_plan : null;
        const messageText = typeof data.message === 'string' ? data.message : '';

        setSubscription({
          hasActiveSubscription: hasActive,
          canCreateListings: canCreate,
          daysRemaining: daysRemaining,
          plan: planText || (hasActive ? 'seller' : null),
          endDate: data.subscription_end_date || null,
          isExpiringSoon: daysRemaining > 0 && daysRemaining <= 30,
          message: hasActive ? `Active - ${daysRemaining} days remaining` : (messageText || 'No active subscription'),
          status: statusText, // Include status safely
          loading: false
        });
        return;
      }
      
      // Fallback to user object
      if (user) {
        let daysRemaining = 0;
        const endDate = user.subscription_end_date;
        
        if (endDate) {
          daysRemaining = calculateDaysRemaining(endDate);
        }
        
        const hasActive = (user.has_active_subscription === true || user.can_create_listings === true) && daysRemaining > 0;
        
        setSubscription({
          hasActiveSubscription: hasActive,
          canCreateListings: hasActive,
          daysRemaining: daysRemaining,
          plan: user.subscription_plan || (hasActive ? 'seller' : null),
          endDate: endDate || null,
          isExpiringSoon: daysRemaining > 0 && daysRemaining <= 30,
          message: hasActive ? `Active - ${daysRemaining} days remaining` : 'No active subscription',
          status: user.status || '',
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
      if (forceRefreshUser) await forceRefreshUser();
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
    const interval = setInterval(fetchSubscription, 15000);
    return () => clearInterval(interval);
  }, [fetchSubscription]);

  return {
    ...subscription,
    refreshSubscription: fetchSubscription,
    forceRefreshSubscription,
    refreshUser
  };
};

export default useSubscription;