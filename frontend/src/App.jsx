// src/App.jsx
import React, { useEffect } from 'react';
import { BrowserRouter, useNavigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { PresenceProvider } from './context/PresenceContext';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import AppRoutes from './routes/AppRoutes';

const API_URL = 'http://localhost:8000';

// Payment Success Handler Component
const PaymentSuccessHandler = ({ children }) => {
  const { refreshUser, forceRefreshUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handlePaymentSuccess = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const status = urlParams.get('status');
      const tx_ref = urlParams.get('tx_ref');
      const plan = urlParams.get('plan');

      console.log('🔍 Checking payment params:', { status, tx_ref, plan });

      if ((status === 'success' || window.location.pathname.includes('/payment/success')) && tx_ref) {
        console.log('✅ Payment success detected! Verifying...');
        
        try {
          const token = localStorage.getItem('access_token');
          if (!token) {
            console.error('No token found');
            return;
          }

          const response = await fetch(`${API_URL}/api/payment/verify?tx_ref=${tx_ref}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });

          const data = await response.json();
          console.log('📦 Verification response:', data);

          if (data.success && data.activated) {
            console.log('🎉 Payment verified! Refreshing user data...');
            
            await forceRefreshUser();
            await new Promise(resolve => setTimeout(resolve, 1000));
            await forceRefreshUser();
            
            const { toast } = await import('react-hot-toast');
            toast.success(data.renewed ? 'Subscription renewed successfully!' : 'Payment successful! Your account is now activated.');
            
            if (window.location.pathname !== '/payment/success') {
              navigate('/payment/success?tx_ref=' + tx_ref);
            }
          } else {
            console.warn('Payment verification failed:', data);
            const { toast } = await import('react-hot-toast');
            toast.error('Payment verification failed. Please contact support.');
          }
        } catch (error) {
          console.error('Payment verification error:', error);
        }
      }
    };

    handlePaymentSuccess();
  }, [refreshUser, forceRefreshUser, navigate]);

  return children;
};

function AppContent() {
  return (
    <PaymentSuccessHandler>
      <AppRoutes />
    </PaymentSuccessHandler>
  );
}

function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <LanguageProvider>
          <AuthProvider>
            <SocketProvider>
              <PresenceProvider>
                <ThemeProvider>
                  <NotificationProvider>
                    <Toaster 
                      position="top-right"
                      toastOptions={{
                        success: {
                          duration: 3000,
                          style: {
                            background: '#4caf50',
                            color: 'white',
                          },
                        },
                        error: {
                          duration: 4000,
                          style: {
                            background: '#f44336',
                            color: 'white',
                          },
                        },
                      }}
                    />
                    <AppContent />
                  </NotificationProvider>
                </ThemeProvider>
              </PresenceProvider>
            </SocketProvider>
          </AuthProvider>
        </LanguageProvider>
      </BrowserRouter>
    </HelmetProvider>
  );
}

export default App;