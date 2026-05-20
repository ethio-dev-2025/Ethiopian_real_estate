// src/components/dashboard/seller/SellerSubscription.jsx
import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle, Shield, Home, Crown, Lock, Wallet, X, Loader, AlertCircle, Trash2 } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import toast from 'react-hot-toast';

const API_URL = 'http://localhost:8000';

const SellerSubscription = () => {
  const { user, refreshUser } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [activationStatus, setActivationStatus] = useState(null);
  const [paymentSubmitted, setPaymentSubmitted] = useState(false);

  useEffect(() => {
    fetchActivationStatus();
  }, []);

  const fetchActivationStatus = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/api/activation/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      console.log('Activation status:', data);
      setActivationStatus(data);
    } catch (error) {
      console.error('Error fetching status:', error);
    }
  };

  const canSubscribe = () => {
    return activationStatus?.status === 'documents_approved';
  };

  const isFullyActivated = () => {
    return activationStatus?.status === 'fully_activated';
  };

  const plans = [
    { id: 'seller', name: 'Seller Plan', price: 149, icon: Shield, bgColor: 'from-blue-500 to-blue-600', description: 'Perfect for selling properties', features: ['Up to 10 active listings', 'Professional property photos', 'Virtual tour integration', 'Priority customer support'] },
    { id: 'landlord', name: 'Landlord Plan', price: 199, icon: Home, bgColor: 'from-green-500 to-green-600', description: 'Ideal for rental properties', features: ['Up to 20 rental listings', 'Tenant management system', 'Rent collection tools', '24/7 priority support'] },
    { id: 'dual', name: 'Dual Plan', price: 298, icon: Crown, bgColor: 'from-purple-500 to-purple-600', description: 'Complete solution for professionals', features: ['Unlimited listings', 'Advanced analytics', 'Dedicated account manager', 'Priority support 24/7'] }
  ];

  const handleSubscribe = (planId) => {
    if (!canSubscribe()) {
      toast.error('Please complete document verification first');
      return;
    }
    setSelectedPlan(planId);
    setShowPaymentModal(true);
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
        setShowPaymentModal(false);
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
            <div className="bg-yellow-50 p-3 rounded-lg text-sm text-yellow-800">
              💳 Test Card: <strong>4242 4242 4242 4242</strong> | Exp: 12/25 | CVV: 123
              <br />
              📱 After payment, admin will verify and activate your account
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

  // Show pending payment message
  if (activationStatus?.status === 'payment_pending') {
    return (
      <div className="text-center py-12">
        <div className="bg-yellow-50 rounded-2xl p-8 max-w-md mx-auto">
          <Clock className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Under Review</h2>
          <p className="text-gray-600 mb-4">Your payment is being verified by our admin team.</p>
          <p className="text-sm text-gray-500">You will be notified once your account is activated.</p>
        </div>
      </div>
    );
  }

  // Show fully activated message
  if (isFullyActivated()) {
    return (
      <div className="text-center py-12">
        <div className="bg-green-50 rounded-2xl p-8 max-w-md mx-auto">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Fully Activated!</h2>
          <p className="text-gray-600 mb-6">Your account is now fully activated. You can start creating listings.</p>
          <button
            onClick={() => window.location.href = '/create-listing'}
            className="px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl font-semibold"
          >
            Create Your First Listing
          </button>
        </div>
      </div>
    );
  }

  // Show message if documents not approved
  if (!canSubscribe() && activationStatus?.status !== 'fully_activated' && activationStatus?.status !== 'payment_pending') {
    return (
      <div className="text-center py-12">
        <div className="bg-blue-50 rounded-2xl p-8 max-w-md mx-auto">
          <AlertCircle className="w-16 h-16 text-blue-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Documents Required First</h2>
          <p className="text-gray-600 mb-6">Please complete document verification before subscribing.</p>
          <button
            onClick={() => window.location.href = '/activation'}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold"
          >
            Go to Document Verification
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PaymentModal />
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Subscription Plans</h1>
        <p className="text-gray-500 mt-1">Choose the perfect plan for your real estate needs</p>
        {activationStatus?.status === 'documents_approved' && (
          <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
            <CheckCircle className="w-4 h-4" /> Documents Approved! Choose a plan to activate
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
                <p className="text-2xl font-bold mt-2">ETB {plan.price}<span className="text-sm">/month</span></p>
                <p className="text-sm opacity-80 mt-1">{plan.description}</p>
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
                  onClick={() => handleSubscribe(plan.id)}
                  className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-4 h-4" /> Subscribe Now
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SellerSubscription;