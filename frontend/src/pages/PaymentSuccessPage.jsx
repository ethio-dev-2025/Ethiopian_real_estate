// src/pages/PaymentSuccessPage.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Loader, XCircle, Download, Receipt, Calendar, CreditCard, Home, PlusCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = 'http://localhost:8000';

const PaymentSuccessPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [paymentData, setPaymentData] = useState(null);
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(5);
  
  const tx_ref = searchParams.get('tx_ref');
  const status = searchParams.get('status');

 useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tx_ref = urlParams.get('tx_ref');
    const status = urlParams.get('status');
    
    console.log('📦 PaymentSuccessPage params:', { tx_ref, status });
    
    if (tx_ref) {
        verifyPayment(tx_ref);
    } else {
        setError('No payment reference found');
        setLoading(false);
    }
}, []);

  // Countdown timer for auto-redirect
  useEffect(() => {
    if (!loading && !error && paymentData) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            navigate('/dashboard');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [loading, error, paymentData, navigate]);

  const verifyPayment = async () => {
    console.log('🔍 Verifying payment with tx_ref:', tx_ref);
    
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setError('Please login again');
        setLoading(false);
        return;
      }
      
      // GET request to verify endpoint
      const response = await fetch(`${API_URL}/api/payment/verify?tx_ref=${tx_ref}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      console.log('📦 Verification response:', data);
      
      if (data.success && data.activated) {
        // Refresh user data
        const userResponse = await fetch(`${API_URL}/api/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        let freshUser = null;
        if (userResponse.ok) {
          freshUser = await userResponse.json();
          localStorage.setItem('user', JSON.stringify(freshUser));
          sessionStorage.setItem('user', JSON.stringify(freshUser));
          window.dispatchEvent(new CustomEvent('user:updated', { detail: freshUser }));
          console.log('✅ User data refreshed:', freshUser);
        }
        
        // Get user from localStorage
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : {};
        
        setPaymentData({
          transaction_id: tx_ref,
          amount: data.amount || 894,
          plan: data.plan_type || (data.renewed ? 'Renewed Plan' : 'Seller Plan'),
          status: 'completed',
          payment_method: 'Chapa / Telebirr',
          date: new Date().toISOString(),
          email: freshUser?.email || user?.email || 'customer@example.com',
          customer_name: freshUser?.full_name || freshUser?.username || user?.full_name || user?.username || 'Valued Customer',
          renewed: data.renewed || false,
          subscription_end_date: data.subscription_end_date
        });
        
        toast.success(data.renewed ? 'Subscription renewed successfully!' : 'Payment successful! Your subscription is active.');
      } else {
        setError(data.message || 'Payment verification failed');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setError('Failed to verify payment. Please contact support.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAmount = (amount) => {
    return `ETB ${(amount || 0).toLocaleString()}`;
  };

  const handleDownloadReceipt = () => {
    if (!paymentData) return;
    
    const receiptHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payment Receipt - EstateHub</title>
        <meta charset="UTF-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; background: #f0f2f5; padding: 40px; }
          .receipt { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.1); overflow: hidden; }
          .header { background: linear-gradient(135deg, #10b981, #059669); padding: 30px; text-align: center; color: white; }
          .logo { font-size: 48px; margin-bottom: 10px; }
          .title { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
          .subtitle { opacity: 0.9; font-size: 14px; }
          .content { padding: 30px; }
          .success-badge { background: #d1fae5; color: #065f46; padding: 12px; border-radius: 8px; text-align: center; margin-bottom: 25px; }
          .details { border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; margin-bottom: 25px; }
          .row { display: flex; justify-content: space-between; padding: 12px 20px; border-bottom: 1px solid #e5e7eb; }
          .row:last-child { border-bottom: none; }
          .label { font-weight: 600; color: #4b5563; }
          .value { color: #1f2937; }
          .total { background: #f0fdf4; }
          .total .label, .total .value { font-size: 18px; font-weight: bold; color: #059669; }
          .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 12px; border-top: 1px solid #e5e7eb; }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <div class="logo">🏠</div>
            <div class="title">Payment Receipt</div>
            <div class="subtitle">EstateHub Real Estate</div>
          </div>
          <div class="content">
            <div class="success-badge">✅ ${paymentData.renewed ? 'Subscription Renewed' : 'Payment Successful'}</div>
            <div class="details">
              <div class="row"><span class="label">Transaction ID:</span><span class="value">${paymentData.transaction_id}</span></div>
              <div class="row"><span class="label">Date:</span><span class="value">${formatDate(paymentData.date)}</span></div>
              <div class="row"><span class="label">Plan:</span><span class="value">${paymentData.plan}</span></div>
              <div class="row"><span class="label">Payment Method:</span><span class="value">${paymentData.payment_method}</span></div>
              <div class="row"><span class="label">Customer:</span><span class="value">${paymentData.customer_name}</span></div>
              <div class="row"><span class="label">Email:</span><span class="value">${paymentData.email}</span></div>
              ${paymentData.subscription_end_date ? `<div class="row"><span class="label">Valid Until:</span><span class="value">${formatDate(paymentData.subscription_end_date)}</span></div>` : ''}
              <div class="row total"><span class="label">Total Paid:</span><span class="value">${formatAmount(paymentData.amount)}</span></div>
            </div>
          </div>
          <div class="footer">
            <p>This is a computer-generated receipt. No signature is required.</p>
            <p>© 2024 EstateHub Real Estate. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    const blob = new Blob([receiptHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Receipt_${paymentData.transaction_id.slice(-8)}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Receipt downloaded!');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900">Verifying Payment</h2>
          <p className="text-gray-500 mt-2">Please wait while we confirm your payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 text-center shadow-xl">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-red-600 mb-2">Payment Failed</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex gap-4">
            <button 
              onClick={() => navigate('/dashboard/subscription')} 
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Try Again
            </button>
            <button 
              onClick={() => navigate('/dashboard')} 
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl overflow-hidden shadow-xl">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-center text-white">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold">{paymentData?.renewed ? 'Subscription Renewed!' : 'Payment Successful!'}</h1>
            <p className="text-green-100 mt-1">
              {paymentData?.renewed ? 'Your subscription has been renewed' : 'Your subscription is now active'}
            </p>
          </div>
          
          {/* Content */}
          <div className="p-6">
            {/* Receipt */}
            <div className="border border-gray-200 rounded-xl overflow-hidden mb-6">
              <div className="bg-gray-50 p-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="font-semibold flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-blue-600" />
                  Payment Receipt
                </h3>
                <button 
                  onClick={handleDownloadReceipt}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Transaction ID</span>
                  <span className="font-mono font-medium">{paymentData?.transaction_id?.slice(-12)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Date & Time</span>
                  <span>{formatDate(paymentData?.date)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Plan</span>
                  <span className="font-medium">{paymentData?.plan}</span>
                </div>
                {paymentData?.subscription_end_date && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Valid Until</span>
                    <span className="font-medium text-green-600">{formatDate(paymentData?.subscription_end_date)}</span>
                  </div>
                )}
                <div className="border-t pt-3 mt-2">
                  <div className="flex justify-between">
                    <span className="font-bold">Total Paid</span>
                    <span className="font-bold text-green-600">{formatAmount(paymentData?.amount)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Auto-redirect */}
            <p className="text-center text-sm text-gray-500 mb-4">
              Redirecting to dashboard in <span className="font-bold text-blue-600">{countdown}</span> seconds...
            </p>
            
            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex-1 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                Dashboard
              </button>
              <button
                onClick={() => navigate('/dashboard/create-listing')}
                className="flex-1 py-2 border-2 border-blue-600 text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition flex items-center justify-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                Create Listing
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;