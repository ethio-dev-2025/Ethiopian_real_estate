// src/components/dashboard/seller/SellerSubscription.jsx
import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle, Shield, Home, Crown, Lock, Wallet, X, Loader, AlertCircle, Clock, Calendar, Zap } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import useSubscription from '../../../hooks/useSubscription';
import toast from 'react-hot-toast';

const API_URL = 'http://localhost:8000';

const SellerSubscription = () => {
  const { user, refreshUser, forceRefreshUser } = useAuth();
  const { forceRefreshSubscription } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [activationStatus, setActivationStatus] = useState(null);
  const [subscriptionInfo, setSubscriptionInfo] = useState(null);
  const [verifyingPayment, setVerifyingPayment] = useState(false);

 // In SellerSubscription.jsx, update the checkPaymentSuccess function
useEffect(() => {
  const checkPaymentSuccess = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get('status');
    const tx_ref = urlParams.get('tx_ref');

    if (status === 'success' && tx_ref && !verifyingPayment) {
      setVerifyingPayment(true);
      console.log('💰 Payment success detected in subscription page!');
      
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${API_URL}/api/payment/verify?tx_ref=${tx_ref}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        console.log('📦 Verification result:', data);
        
        if (data.success && data.activated) {
          toast.success(data.renewed ? 'Subscription renewed successfully!' : 'Payment successful! Your account is now activated.');
          
          // Force multiple refreshes to ensure all data is updated
          await forceRefreshSubscription();
          await forceRefreshUser();
          
          // Wait a bit for database to update
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Fetch updated status
          await fetchActivationStatus();
          await fetchSubscriptionInfo();
          
          // Force refresh user again
          await forceRefreshUser();
          
          // Clear URL parameters
          window.history.replaceState({}, document.title, '/dashboard/subscription');
          
          // Reload page to ensure all components get fresh data
          window.location.reload();
        } else {
          toast.error(data.message || 'Payment verification failed');
        }
      } catch (error) {
        console.error('Verification error:', error);
        toast.error('Failed to verify payment. Please contact support.');
      } finally {
        setVerifyingPayment(false);
      }
    }
  };
  
  checkPaymentSuccess();
}, [forceRefreshSubscription, forceRefreshUser]);

  useEffect(() => {
    fetchActivationStatus();
    fetchSubscriptionInfo();
  }, [refreshUser, user]);

  const fetchActivationStatus = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/api/activation/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      console.log('📊 Activation status:', data);
      setActivationStatus(data);

      if (data?.status === 'fully_activated') {
        await forceRefreshUser();
      }
    } catch (error) {
      console.error('Error fetching status:', error);
    }
  };

  const fetchSubscriptionInfo = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/api/subscription/my-subscription`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSubscriptionInfo(data);
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    }
  };

  // Calculate days remaining from user object or subscription info
  const getDaysRemaining = () => {
    // First check user object
    if (user?.subscription_end_date) {
      const end = new Date(user.subscription_end_date);
      const now = new Date();
      const diff = end - now;
      return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    }
    // Then check subscriptionInfo
    if (subscriptionInfo?.subscription_end_date) {
      const end = new Date(subscriptionInfo.subscription_end_date);
      const now = new Date();
      const diff = end - now;
      return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    }
    // Check from activationStatus
    if (activationStatus?.days_remaining > 0) {
      return activationStatus.days_remaining;
    }
    return 0;
  };

  const daysRemaining = getDaysRemaining();
  const isExpiringSoon = daysRemaining > 0 && daysRemaining <= 30;
  const isExpired = daysRemaining <= 0;
  
  // Check if user has active subscription from multiple sources
  const hasActiveSubscription = 
    user?.has_active_subscription === true ||
    user?.can_create_listings === true ||
    user?.is_activated === true ||
    subscriptionInfo?.has_subscription === true ||
    daysRemaining > 0 ||
    activationStatus?.status === 'fully_activated';

  // Show loading while verifying payment
  if (verifyingPayment) {
    return (
      <div className="text-center py-12">
        <div className="bg-blue-50 rounded-2xl p-8 max-w-md mx-auto">
          <Loader className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-spin" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifying Payment</h2>
          <p className="text-gray-600">Please wait while we confirm your payment...</p>
        </div>
      </div>
    );
  }

  // ============ IF USER HAS ACTIVE SUBSCRIPTION - SHOW ONLY BANNER ============
  if (hasActiveSubscription && daysRemaining > 0) {
    return (
      <div className="max-w-2xl mx-auto">
        {/* Active Subscription Banner - Only this section */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
          <h2 className="text-2xl font-bold text-green-700 mb-2">Subscription Active!</h2>
          <p className="text-green-600">Your account is fully activated and ready to use.</p>
        </div>
        
        <PaymentModal 
          showPaymentModal={showPaymentModal}
          setShowPaymentModal={setShowPaymentModal}
          selectedPlan={selectedPlan}
          setSelectedPlan={setSelectedPlan}
          loading={loading}
          setLoading={setLoading}
          user={user}
        />
      </div>
    );
  }

  // ============ SHOW PLANS FOR SUBSCRIPTION ============
  const plans = [
    { id: 'seller', name: 'Seller Plan', price: 894, monthlyPrice: 149, icon: Shield, bgColor: 'from-blue-500 to-blue-600', description: 'Perfect for selling properties', features: ['Up to 10 active listings', 'Professional property photos', 'Virtual tour integration', '6 months subscription'] },
    { id: 'landlord', name: 'Landlord Plan', price: 1194, monthlyPrice: 199, icon: Home, bgColor: 'from-green-500 to-green-600', description: 'Ideal for rental properties', features: ['Up to 20 rental listings', 'Tenant management system', 'Rent collection tools', '6 months subscription'] },
    { id: 'dual', name: 'Dual Plan', price: 1788, monthlyPrice: 298, icon: Crown, bgColor: 'from-purple-500 to-purple-600', description: 'Complete solution for professionals', features: ['Unlimited listings', 'Advanced analytics', 'Dedicated account manager', '6 months subscription'] }
  ];

  return (
    <div>
      <PaymentModal 
        showPaymentModal={showPaymentModal}
        setShowPaymentModal={setShowPaymentModal}
        selectedPlan={selectedPlan}
        setSelectedPlan={setSelectedPlan}
        loading={loading}
        setLoading={setLoading}
        user={user}
      />
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Subscription Plans</h1>
        <p className="text-gray-500 mt-1">Choose a 6-month plan to activate your account</p>
        {activationStatus?.status === 'documents_approved' && (
          <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
            <CheckCircle className="w-4 h-4" /> Documents Approved!
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const Icon = plan.icon;
          return (
            <div key={plan.id} className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition">
              <div className={`bg-gradient-to-r ${plan.bgColor} p-6 text-white`}>
                <Icon className="w-10 h-10 mb-3" />
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <p className="text-2xl font-bold mt-2">ETB {plan.price}<span className="text-sm">/6 months</span></p>
                <p className="text-xs opacity-80 mt-1">(ETB {plan.monthlyPrice}/month equivalent)</p>
                <p className="text-sm opacity-80 mt-2">{plan.description}</p>
              </div>
              <div className="p-6">
                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-500" /> {feature}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => { setSelectedPlan(plan.id); setShowPaymentModal(true); }}
                  className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-4 h-4" /> Subscribe for 6 Months
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// PaymentModal Component
const PaymentModal = ({ showPaymentModal, setShowPaymentModal, selectedPlan, setSelectedPlan, loading, setLoading, user }) => {
  if (!showPaymentModal) return null;
  
  const plans = [
    { id: 'seller', name: 'Seller Plan', price: 894 },
    { id: 'landlord', name: 'Landlord Plan', price: 1194 },
    { id: 'dual', name: 'Dual Plan', price: 1788 }
  ];
  const selectedPlanData = plans.find(p => p.id === selectedPlan);
  const amount = selectedPlanData?.price;

  const redirectToChapa = async () => {
    setLoading(true);
    
    try {
      const token = localStorage.getItem('access_token');
      const fullName = user?.full_name || user?.username || 'User';
      const nameParts = fullName.split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || 'User';
      
      const requestData = {
        plan_type: selectedPlan,
        amount: amount,
        email: user?.email,
        first_name: firstName,
        last_name: lastName,
        phone: user?.phone || '0911111111'
      };
      
      const response = await fetch(`${API_URL}/api/payment/initialize`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });
      
      const data = await response.json();
      
      if (data.success && data.checkout_url) {
        toast.success('Redirecting to Chapa payment page...');
        window.location.href = data.checkout_url;
      } else {
        toast.error(data.message || 'Failed to initialize payment');
        setShowPaymentModal(false);
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Failed to connect to payment gateway');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full">
        <div className="sticky top-0 bg-white border-b p-5 flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-600" /> Complete Payment
          </h2>
          <button 
            onClick={() => { setShowPaymentModal(false); setSelectedPlan(null); }} 
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-6">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4">
            <h3 className="font-semibold text-gray-900 mb-2">{selectedPlanData?.name}</h3>
            <p className="text-2xl font-bold text-blue-600">
              ETB {amount?.toLocaleString()}<span className="text-sm">/6 months</span>
            </p>
          </div>
          <div className="bg-yellow-50 p-3 rounded-lg text-sm text-yellow-800">
            💳 Test Card: <strong>4242 4242 4242 4242</strong> | Exp: 12/25 | CVV: 123
          </div>
          <button 
            onClick={redirectToChapa} 
            disabled={loading} 
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader className="w-5 h-5 animate-spin" /> : <><Wallet className="w-5 h-5" /> Pay with Chapa / Telebirr</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SellerSubscription;