import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CreateListingWizard from '../../wizard/CreateListingWizard';
import { Shield, AlertCircle, Loader, Key, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = 'http://localhost:8000';

const SellerCreateListing = () => {
  const navigate = useNavigate();
  const [activationStatus, setActivationStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchActivationStatus = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setLoading(false);
        return;
      }
      
      const response = await fetch(`${API_URL}/api/activation/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Activation status for create listing:', data);
        setActivationStatus(data);
      }
    } catch (error) {
      console.error('Error fetching activation status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivationStatus();
  }, []);

  const handleSuccess = () => {
    navigate('/dashboard/listings');
  };

  const handleGoToActivation = () => {
    navigate('/dashboard/activation');
  };

  const handleGoToSubscription = () => {
    navigate('/dashboard/subscription');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  // Case 1: Not submitted yet - needs document upload
  if (activationStatus?.status === 'not_submitted') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border p-8 text-center">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-10 h-10 text-yellow-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Not Activated</h2>
          <p className="text-gray-600 mb-4">
            Your account needs to be activated before you can create listings.
          </p>
          <p className="text-gray-500 text-sm mb-6">
            Please complete the document verification process to activate your account.
          </p>
          <button
            onClick={handleGoToActivation}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-700 text-white rounded-lg font-semibold hover:shadow-lg transition"
          >
            <Key className="w-5 h-5" />
            Go to Activation
          </button>
        </div>
      </div>
    );
  }

  // Case 2: Documents pending review
  if (activationStatus?.status === 'documents_pending') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border p-8 text-center">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Loader className="w-10 h-10 text-yellow-600 animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Documents Under Review</h2>
          <p className="text-gray-600 mb-4">
            Your documents are being reviewed by our admin team.
          </p>
          <p className="text-gray-500 text-sm">
            You will be notified once approved. Please check back later.
          </p>
        </div>
      </div>
    );
  }

  // Case 3: Documents approved - needs subscription
  if (activationStatus?.status === 'documents_approved') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border p-8 text-center">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-10 h-10 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Documents Approved!</h2>
          <p className="text-gray-600 mb-4">
            Your documents have been approved by the admin.
          </p>
          <p className="text-gray-600 mb-6">
            Please subscribe to activate your account and start creating listings.
          </p>
          <button
            onClick={handleGoToSubscription}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-700 text-white rounded-lg font-semibold hover:shadow-lg transition"
          >
            <CreditCard className="w-5 h-5" />
            Subscribe Now
          </button>
        </div>
      </div>
    );
  }

  // Case 4: Payment pending
  if (activationStatus?.status === 'payment_pending') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border p-8 text-center">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Loader className="w-10 h-10 text-yellow-600 animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Under Review</h2>
          <p className="text-gray-600 mb-4">
            Your payment is being verified by our admin team.
          </p>
          <p className="text-gray-500 text-sm">
            You will be notified once your account is activated.
          </p>
        </div>
      </div>
    );
  }

  // Case 5: Subscription expired
  if (activationStatus?.status === 'subscription_expired') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border p-8 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Subscription Expired</h2>
          <p className="text-gray-600 mb-4">
            Your subscription has expired. Please renew to continue.
          </p>
          <button
            onClick={handleGoToSubscription}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-700 text-white rounded-lg font-semibold hover:shadow-lg transition"
          >
            <CreditCard className="w-5 h-5" />
            Renew Subscription
          </button>
        </div>
      </div>
    );
  }

  // Case 6: Fully activated - show the create listing form
  if (activationStatus?.status === 'fully_activated' && activationStatus?.can_create_listings === true) {
    return <CreateListingWizard onSuccess={handleSuccess} />;
  }

  // Fallback - show loading or default message
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border p-8 text-center">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-10 h-10 text-gray-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Unable to Create Listing</h2>
        <p className="text-gray-600 mb-4">
          Your account is not fully activated.
        </p>
        <button
          onClick={handleGoToActivation}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-700 text-white rounded-lg font-semibold hover:shadow-lg transition"
        >
          <Key className="w-5 h-5" />
          Go to Activation
        </button>
      </div>
    </div>
  );
};

export default SellerCreateListing;