// src/pages/PaymentSuccessPage.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Loader, XCircle, Download, Receipt, Calendar, CreditCard, User, Mail, Phone, Clock, ArrowRight, Home, PlusCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = 'http://localhost:8000';

const PaymentSuccessPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [paymentData, setPaymentData] = useState(null);
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(10);
  
  const tx_ref = searchParams.get('tx_ref');
  const status = searchParams.get('status');

  useEffect(() => {
    if (status === 'success' || tx_ref) {
      verifyPayment();
    } else {
      setLoading(false);
      setError('No payment reference found');
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
    if (!tx_ref) {
      setError('Invalid payment reference');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      
      const response = await fetch(`${API_URL}/api/payment/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tx_ref })
      });
      
      const data = await response.json();
      console.log('Verification response:', data);
      
      if (data.success) {
        // Get user info from localStorage
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : {};
        
        setPaymentData({
          transaction_id: tx_ref,
          amount: 149,
          plan: 'Seller Plan',
          status: 'completed',
          payment_method: 'Chapa / Telebirr',
          date: new Date().toISOString(),
          email: user?.email || 'customer@example.com',
          customer_name: user?.full_name || user?.username || 'Valued Customer'
        });
        
        toast.success('Payment successful! Your subscription is active.');
      } else {
        setError(data.message || 'Payment verification failed');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setError('Failed to verify payment');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAmount = (amount) => {
    return `ETB ${amount.toLocaleString()}`;
  };

  const handleDownloadReceipt = () => {
    const receiptHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payment Receipt - RealEstate Pro</title>
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
          button { background: #059669; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; margin-top: 15px; }
          button:hover { background: #047857; }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <div class="logo">🏠</div>
            <div class="title">Payment Receipt</div>
            <div class="subtitle">RealEstate Pro</div>
          </div>
          <div class="content">
            <div class="success-badge">
              ✅ Payment Successful
            </div>
            <div class="details">
              <div class="row"><span class="label">Transaction ID:</span><span class="value">${paymentData?.transaction_id}</span></div>
              <div class="row"><span class="label">Date:</span><span class="value">${formatDate(paymentData?.date)}</span></div>
              <div class="row"><span class="label">Plan:</span><span class="value">${paymentData?.plan}</span></div>
              <div class="row"><span class="label">Payment Method:</span><span class="value">${paymentData?.payment_method}</span></div>
              <div class="row"><span class="label">Customer:</span><span class="value">${paymentData?.customer_name}</span></div>
              <div class="row"><span class="label">Email:</span><span class="value">${paymentData?.email}</span></div>
              <div class="row total"><span class="label">Total Paid:</span><span class="value">${formatAmount(paymentData?.amount)}</span></div>
            </div>
            <p style="text-align: center; color: #6b7280; font-size: 12px;">Thank you for your payment! Your subscription is now active.</p>
          </div>
          <div class="footer">
            <p>This is a computer-generated receipt. No signature is required.</p>
            <p>&copy; 2024 RealEstate Pro. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    const blob = new Blob([receiptHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Receipt_${paymentData?.transaction_id?.slice(-8) || 'payment'}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Receipt downloaded!');
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', border: '3px solid #e5e7eb', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }}></div>
          <p style={{ color: '#6b7280' }}>Verifying your payment...</p>
          <style>{'@keyframes spin { to { transform: rotate(360deg); } }'}</style>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5', padding: '16px' }}>
        <div style={{ maxWidth: '400px', width: '100%', background: 'white', borderRadius: '16px', padding: '32px', textAlign: 'center', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}>
          <div style={{ width: '80px', height: '80px', background: '#fee2e2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <XCircle style={{ width: '40px', height: '40px', color: '#dc2626' }} />
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>Payment Failed</h2>
          <p style={{ color: '#6b7280', marginBottom: '24px' }}>{error}</p>
          <button onClick={() => navigate('/subscription')} style={{ width: '100%', padding: '12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '600', cursor: 'pointer' }}>
            Back to Subscription
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5', padding: '24px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {/* Success Card */}
        <div style={{ background: 'white', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}>
          {/* Header */}
          <div style={{ background: 'linear-gradient(135deg, #10b981, #059669)', padding: '32px', textAlign: 'center', color: 'white' }}>
            <div style={{ width: '80px', height: '80px', background: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <CheckCircle style={{ width: '40px', height: '40px' }} />
            </div>
            <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>Payment Successful!</h1>
            <p style={{ opacity: 0.9 }}>Your subscription has been activated</p>
          </div>
          
          {/* Content */}
          <div style={{ padding: '32px' }}>
            {/* Success Message */}
            <div style={{ background: '#d1fae5', borderRadius: '12px', padding: '16px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <CheckCircle style={{ width: '24px', height: '24px', color: '#059669' }} />
              <div>
                <p style={{ fontWeight: '600', color: '#065f46', marginBottom: '4px' }}>Thank you for your payment!</p>
                <p style={{ fontSize: '14px', color: '#047857' }}>Your subscription is now active. You can start listing properties immediately.</p>
              </div>
            </div>
            
            {/* Receipt */}
            <div style={{ border: '1px solid #e5e7eb', borderRadius: '16px', overflow: 'hidden', marginBottom: '24px' }}>
              <div style={{ background: '#f9fafb', padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Receipt style={{ width: '20px', height: '20px', color: '#3b82f6' }} />
                  Payment Receipt
                </h3>
                <button onClick={handleDownloadReceipt} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}>
                  <Download style={{ width: '16px', height: '16px' }} />
                  Download
                </button>
              </div>
              
              <div style={{ padding: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Transaction ID</p>
                    <p style={{ fontSize: '13px', fontFamily: 'monospace', fontWeight: '600' }}>{paymentData?.transaction_id?.slice(-12)}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Date & Time</p>
                    <p style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar style={{ width: '12px', height: '12px' }} />
                      {formatDate(paymentData?.date)}
                    </p>
                  </div>
                </div>
                
                <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '16px', marginBottom: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Plan</p>
                      <p style={{ fontSize: '14px', fontWeight: '600' }}>{paymentData?.plan}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Payment Method</p>
                      <p style={{ fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CreditCard style={{ width: '12px', height: '12px' }} />
                        {paymentData?.payment_method}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div style={{ borderTop: '2px dashed #e5e7eb', paddingTop: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '18px', fontWeight: 'bold' }}>Total Paid</span>
                    <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#059669' }}>{formatAmount(paymentData?.amount)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* What's Next */}
            <div style={{ background: '#eff6ff', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
              <h3 style={{ fontWeight: '600', color: '#1e40af', marginBottom: '12px' }}>What's Next?</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, space: '8px' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '14px', color: '#1e3a8a' }}>
                  <CheckCircle style={{ width: '16px', height: '16px' }} /> Start creating your first property listing
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '14px', color: '#1e3a8a' }}>
                  <CheckCircle style={{ width: '16px', height: '16px' }} /> Access premium features and analytics
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#1e3a8a' }}>
                  <CheckCircle style={{ width: '16px', height: '16px' }} /> Get priority customer support
                </li>
              </ul>
            </div>
            
            {/* Auto-redirect Message */}
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <p style={{ fontSize: '14px', color: '#6b7280' }}>
                Redirecting to dashboard in <span style={{ fontWeight: 'bold', color: '#3b82f6' }}>{countdown}</span> seconds...
              </p>
            </div>
            
            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => navigate('/dashboard')} style={{ flex: 1, padding: '14px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Home style={{ width: '18px', height: '18px' }} />
                Go to Dashboard
              </button>
              <button onClick={() => navigate('/create-listing')} style={{ flex: 1, padding: '14px', background: 'white', color: '#3b82f6', border: '2px solid #3b82f6', borderRadius: '12px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <PlusCircle style={{ width: '18px', height: '18px' }} />
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