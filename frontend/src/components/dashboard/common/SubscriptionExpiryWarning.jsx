// frontend/src/components/dashboard/common/SubscriptionExpiryWarning.jsx
import React, { useState, useEffect } from 'react';
import { AlertCircle, Clock, Zap, CreditCard } from 'lucide-react';

const SubscriptionExpiryWarning = () => {
  const [subscriptionData, setSubscriptionData] = useState({
    hasActiveSubscription: false,
    daysRemaining: 0,
    plan: null,
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

  const fetchSubscriptionStatus = async () => {
    try {
      // Check from user object in localStorage
      const storedUser = localStorage.getItem('user');
      
      if (storedUser) {
        const user = JSON.parse(storedUser);
        
        // Calculate days remaining from subscription_end_date
        let daysRemaining = calculateDaysRemaining(user.subscription_end_date);
        let hasActive = daysRemaining > 0;
        
        // Also check other flags
        hasActive = hasActive || 
                    user.has_active_subscription === true || 
                    user.can_create_listings === true || 
                    user.is_activated === true ||
                    user.payment_approved === true;
        
        console.log('📊 SubscriptionExpiryWarning - User data:', {
          subscription_end_date: user.subscription_end_date,
          daysRemaining,
          hasActive
        });
        
        setSubscriptionData({
          hasActiveSubscription: hasActive,
          daysRemaining: daysRemaining,
          plan: user.subscription_plan || (hasActive ? 'seller' : null),
          loading: false
        });
        return;
      }
      
      setSubscriptionData(prev => ({ ...prev, loading: false }));
    } catch (error) {
      console.error('Error fetching subscription status:', error);
      setSubscriptionData(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    fetchSubscriptionStatus();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchSubscriptionStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  // Don't show for admin or if not seller/landlord - check from localStorage
  const storedUser = localStorage.getItem('user');
  let userRole = null;
  if (storedUser) {
    try {
      const user = JSON.parse(storedUser);
      userRole = user.role_type;
    } catch (e) {}
  }

  if (subscriptionData.loading || !userRole || userRole === 'admin' || 
      (userRole !== 'seller' && userRole !== 'landlord' && userRole !== 'dual')) {
    return null;
  }

  const { hasActiveSubscription, daysRemaining, plan } = subscriptionData;

  // No active subscription
  if (!hasActiveSubscription || daysRemaining <= 0) {
    return (
      <div className="mb-4 bg-red-50 border-l-4 border-red-500 rounded-lg p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-red-800">No Active Subscription</h3>
            <p className="text-sm text-red-700 mt-1">
              You don't have an active subscription. You cannot create or publish new listings.
            </p>
            <a 
              href="/dashboard/subscription"
              className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition"
            >
              <CreditCard className="w-4 h-4" />
              Subscribe Now
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Expiring soon (30 days or less)
  if (daysRemaining <= 30 && daysRemaining > 0) {
    const days = daysRemaining;
    let colorClass = 'bg-yellow-50 border-yellow-500';
    let textColor = 'text-yellow-800';
    let buttonColor = 'bg-yellow-600 hover:bg-yellow-700';
    
    if (days <= 7) {
      colorClass = 'bg-orange-50 border-orange-500';
      textColor = 'text-orange-800';
      buttonColor = 'bg-orange-600 hover:bg-orange-700';
    }
    if (days <= 3) {
      colorClass = 'bg-red-50 border-red-500';
      textColor = 'text-red-800';
      buttonColor = 'bg-red-600 hover:bg-red-700';
    }
    
    let urgencyText = '';
    if (days <= 1) urgencyText = 'TOMORROW!';
    else if (days <= 3) urgencyText = `in ${days} days!`;
    else urgencyText = `in ${days} days`;
    
    return (
      <div className={`mb-4 ${colorClass} border-l-4 rounded-lg p-4 shadow-sm`}>
        <div className="flex items-start gap-3">
          <Clock className={`w-5 h-5 ${textColor} mt-0.5`} />
          <div className="flex-1">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className={`font-semibold ${textColor}`}>⚠️ Subscription Expiring {urgencyText}</h3>
                <p className={`text-sm ${textColor} mt-1`}>
                  Your {plan || 'seller'} plan expires in {days} days
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    <span className="text-sm font-medium">{days} days remaining</span>
                  </div>
                </div>
              </div>
              <a 
                href="/dashboard/subscription"
                className={`inline-flex items-center gap-2 px-4 py-2 ${buttonColor} text-white text-sm font-medium rounded-lg transition`}
              >
                <CreditCard className="w-4 h-4" />
                Renew Now
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Active subscription with more than 30 days left
  if (hasActiveSubscription && daysRemaining > 30) {
    return (
      <div className="mb-4 bg-green-50 border-l-4 border-green-500 rounded-lg p-3 shadow-sm">
        <div className="flex items-center gap-3">
          <Clock className="w-4 h-4 text-green-600" />
          <div className="flex-1">
            <p className="text-sm text-green-700">
              ✅ Active Subscription: {plan || 'seller'} plan • {daysRemaining} days remaining
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default SubscriptionExpiryWarning;