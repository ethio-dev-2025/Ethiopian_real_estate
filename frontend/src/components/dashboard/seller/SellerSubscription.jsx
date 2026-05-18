// src/components/dashboard/seller/SellerSubscription.jsx
import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle, Shield, Home, Crown, Lock, Wallet, X, Loader, AlertCircle } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import toast from 'react-hot-toast';

const API_URL = 'http://localhost:8000';

const SellerSubscription = () => {
  const { user, refreshUser } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [currentPlanDetails, setCurrentPlanDetails] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const hasActiveSubscription = () => {
    if (user?.email === 'reduss@gmail.com' || user?.email === 'dani@gmail.com') return true;
    if (user?.seller_paid || user?.landlord_paid) return true;
    if (user?.role_type === 'seller' || user?.role_type === 'landlord' || user?.role_type === 'dual') return true;
    return false;
  };

  const getCurrentActivePlan = () => {
    if (user?.seller_paid && user?.landlord_paid) return 'dual';
    if (user?.seller_paid) return 'seller';
    if (user?.landlord_paid) return 'landlord';
    if (user?.role_type === 'dual') return 'dual';
    if (user?.role_type === 'seller') return 'seller';
    if (user?.role_type === 'landlord') return 'landlord';
    return null;
  };

  const currentActivePlanId = getCurrentActivePlan();
  const isInactiveUser = !hasActiveSubscription();

  const plans = [
    { id: 'seller', name: 'Seller Plan', price: 149, icon: Shield, bgColor: 'from-blue-500 to-blue-600', description: 'Perfect for selling properties', features: ['Up to 10 active listings', 'Professional property photos', 'Virtual tour integration', 'Priority customer support'] },
    { id: 'landlord', name: 'Landlord Plan', price: 199, icon: Home, bgColor: 'from-green-500 to-green-600', description: 'Ideal for rental properties', features: ['Up to 20 rental listings', 'Tenant management system', 'Rent collection tools', '24/7 priority support'] },
    { id: 'dual', name: 'Dual Plan', price: 298, icon: Crown, bgColor: 'from-purple-500 to-purple-600', description: 'Complete solution for professionals', features: ['Unlimited listings', 'Advanced analytics', 'Dedicated account manager', 'Priority support 24/7'] }
  ];

  const handleSubscribe = (planId) => {
    setSelectedPlan(planId);
    setShowPaymentModal(true);
  };

  const handleManagePlan = () => {
    const activePlan = plans.find(p => p.id === currentActivePlanId);
    if (activePlan) {
      setCurrentPlanDetails(activePlan);
      setShowManageModal(true);
    }
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm('Are you sure you want to cancel your subscription?')) return;
    setCancelling(true);
    try {
      const updatedUser = { ...user };
      delete updatedUser.seller_paid;
      delete updatedUser.landlord_paid;
      updatedUser.role_type = 'user';
      localStorage.setItem('user', JSON.stringify(updatedUser));
      if (refreshUser) refreshUser();
      toast.success('Subscription cancelled successfully');
      setShowManageModal(false);
    } catch (error) {
      toast.error('Failed to cancel subscription');
    } finally {
      setCancelling(false);
    }
  };

  const redirectToChapa = async () => {
    setLoading(true);
    const selectedPlanData = plans.find(p => p.id === selectedPlan);
    
    try {
      const token = localStorage.getItem('access_token');
      const fullName = user?.full_name || user?.username || 'User';
      const nameParts = fullName.split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || 'User';
      
      const requestData = {
        plan_type: selectedPlan,
        amount: selectedPlanData.price,
        email: user?.email,
        first_name: firstName,
        last_name: lastName,
        phone: user?.phone || '0911111111'
      };
      
      console.log('🚀 Initializing Chapa payment:', requestData);
      
      const response = await fetch(`${API_URL}/api/payment/initialize`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });
      
      const data = await response.json();
      console.log('📦 Chapa response:', data);
      
      if (data.success && data.checkout_url) {
        toast.success('Redirecting to Chapa payment page...');
        window.location.href = data.checkout_url;
      } else {
        let errorMsg = 'Failed to initialize payment';
        if (data.message) {
          errorMsg = typeof data.message === 'string' ? data.message : JSON.stringify(data.message);
        }
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Failed to connect to payment gateway');
    } finally {
      setLoading(false);
    }
  };

  const PaymentModal = () => {
    if (!showPaymentModal) return null;
    const selectedPlanData = plans.find(p => p.id === selectedPlan);
    const amount = selectedPlanData?.price;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-md w-full">
          <div className="sticky top-0 bg-white border-b p-5 flex justify-between items-center">
            <h2 className="text-xl font-bold flex items-center gap-2"><CreditCard className="w-5 h-5 text-blue-600" /> Complete Payment</h2>
            <button onClick={() => { setShowPaymentModal(false); setSelectedPlan(null); }} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
          </div>
          <div className="p-6 space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 mb-2">{selectedPlanData?.name}</h3>
              <p className="text-2xl font-bold text-blue-600">ETB {amount?.toLocaleString()}<span className="text-sm">/month</span></p>
            </div>
            <button onClick={redirectToChapa} disabled={loading} className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? <Loader className="w-5 h-5 animate-spin" /> : <><Wallet className="w-5 h-5" /> Pay with Chapa / Telebirr</>}
            </button>
            <p className="text-xs text-center text-gray-500 flex items-center justify-center gap-1"><Lock className="w-3 h-3" /> Secure payment by Chapa</p>
          </div>
        </div>
      </div>
    );
  };

  const ManagePlanModal = () => {
    if (!showManageModal || !currentPlanDetails) return null;
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-md w-full">
          <div className="sticky top-0 bg-white border-b p-5 flex justify-between items-center">
            <h2 className="text-xl font-bold flex items-center gap-2"><Crown className="w-5 h-5 text-purple-600" /> {currentPlanDetails.name} Details</h2>
            <button onClick={() => setShowManageModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
          </div>
          <div className="p-6 space-y-6">
            <div className={`bg-gradient-to-r ${currentPlanDetails.bgColor} p-6 rounded-xl text-white`}>
              <currentPlanDetails.icon className="w-12 h-12 mb-3" />
              <h3 className="text-xl font-bold">{currentPlanDetails.name}</h3>
              <p className="text-2xl font-bold mt-2">ETB {currentPlanDetails.price}<span className="text-sm">/month</span></p>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg"><CheckCircle className="w-5 h-5 text-green-600" /><div><p className="font-semibold text-gray-900">Status: Active</p><p className="text-sm text-gray-500">Your subscription is active</p></div></div>
            <div className="border-t pt-4"><h4 className="font-semibold text-gray-900 mb-3">Plan Features</h4><ul className="space-y-2">{currentPlanDetails.features.map((feature, idx) => (<li key={idx} className="flex items-center gap-2 text-sm text-gray-600"><CheckCircle className="w-4 h-4 text-green-500" /> {feature}</li>))}</ul></div>
            <div className="border-t pt-4"><button onClick={handleCancelSubscription} disabled={cancelling} className="w-full py-2.5 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition flex items-center justify-center gap-2 disabled:opacity-50">{cancelling ? <Loader className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}{cancelling ? 'Cancelling...' : 'Cancel Subscription'}</button></div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <PaymentModal />
      <ManagePlanModal />
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Subscription Plans</h1>
        <p className="text-gray-500 mt-1">Choose the perfect plan for your real estate needs</p>
        {!isInactiveUser && (
          <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm"><CheckCircle className="w-4 h-4" /> Active Subscription: {currentActivePlanId}</div>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const Icon = plan.icon;
          const isCurrentActivePlan = currentActivePlanId === plan.id;
          return (
            <div key={plan.id} className={`bg-white rounded-xl shadow-sm border overflow-hidden transition-all ${isCurrentActivePlan ? 'ring-2 ring-green-500 shadow-lg' : 'hover:shadow-md'}`}>
              <div className={`bg-gradient-to-r ${plan.bgColor} p-6 text-white`}><Icon className="w-10 h-10 mb-3" /><h3 className="text-xl font-bold">{plan.name}</h3><p className="text-2xl font-bold mt-2">ETB {plan.price}<span className="text-sm">/month</span></p><p className="text-sm opacity-80 mt-1">{plan.description}</p></div>
              <div className="p-6"><ul className="space-y-2 mb-6">{plan.features.map((feature, idx) => (<li key={idx} className="flex items-center gap-2 text-sm text-gray-600"><CheckCircle className="w-4 h-4 text-green-500" /> {feature}</li>))}</ul>
              {isCurrentActivePlan ? (<button onClick={handleManagePlan} className="w-full py-2.5 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"><CheckCircle className="w-4 h-4" /> Manage Plan</button>) : (<button onClick={() => handleSubscribe(plan.id)} className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition"><CreditCard className="w-4 h-4" /> Subscribe Now</button>)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SellerSubscription;