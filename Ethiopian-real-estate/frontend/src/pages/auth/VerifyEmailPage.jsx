// src/pages/auth/VerifyEmailPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Shield, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = 'http://localhost:8000';

const VerifyEmailPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verified, setVerified] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [canResend, setCanResend] = useState(true);

  useEffect(() => {
    if (!email) navigate('/register');
  }, [email, navigate]);

  useEffect(() => {
    let timer;
    if (countdown > 0 && !canResend) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (countdown === 0) {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [countdown, canResend]);

  const handleCodeChange = (index, value) => {
    if (value.length > 1) return;
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    if (value && index < 5) document.getElementById(`code-input-${index + 1}`)?.focus();
  };

  const handleVerify = async () => {
    const verificationCode = code.join('');
    if (verificationCode.length !== 6) {
      setError('Please enter the 6-digit verification code');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${API_URL}/api/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: verificationCode })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setVerified(true);
        toast.success('Email verified successfully!');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError(data.detail || 'Invalid verification code');
        toast.error(data.detail || 'Invalid code');
      }
    } catch (error) {
      setError('Failed to verify email');
      toast.error('Connection failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        toast.success('New verification code sent!');
        setCountdown(45);
        setCanResend(false);
        setCode(['', '', '', '', '', '']);
        setError('');
      } else {
        toast.error(data.detail || 'Failed to resend code');
      }
    } catch (error) {
      toast.error('Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

  if (verified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-gray-100 flex items-center justify-center p-4">
        <button
          onClick={() => navigate('/')}
          className="fixed top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-xl text-text-primary hover:bg-white transition-all duration-300 border border-border-light shadow-sm group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Back to Home</span>
        </button>

        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-success" />
          </div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">Email Verified!</h2>
          <p className="text-text-secondary mb-4">Your email has been successfully verified.</p>
          <p className="text-sm text-text-muted mb-6">Redirecting to login...</p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
        </div>

        <div className="fixed bottom-6 left-0 right-0 flex justify-center gap-6">
          <div className="flex items-center gap-2 text-xs text-text-muted"><Shield className="w-3 h-3" /> Secure</div>
          <div className="flex items-center gap-2 text-xs text-text-muted"><Shield className="w-3 h-3" /> Fast</div>
          <div className="flex items-center gap-2 text-xs text-text-muted"><Shield className="w-3 h-3" /> Private</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-gray-100 flex items-center justify-center p-4">
      <button
        onClick={() => navigate('/')}
        className="fixed top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-xl text-text-primary hover:bg-white transition-all duration-300 border border-border-light shadow-sm group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-medium">Back to Home</span>
      </button>

      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-primary-800 to-primary-900 p-6 text-center">
            <Mail className="w-12 h-12 text-white mx-auto mb-3" />
            <h2 className="text-2xl font-bold text-white">Verify Your Email</h2>
            <p className="text-primary-100 text-sm mt-1">
              We've sent a verification code to <strong>{email}</strong>
            </p>
          </div>
          
          <div className="p-6">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-error" />
                <p className="text-sm text-error">{error}</p>
              </div>
            )}
            
            <div className="flex justify-center gap-2 mb-6">
              {code.map((digit, index) => (
                <input 
                  key={index} 
                  id={`code-input-${index}`} 
                  type="text" 
                  maxLength={1} 
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)} 
                  className="w-12 h-12 text-center text-2xl font-bold border-2 border-border-light rounded-lg focus:border-primary-500 focus:outline-none transition-all" 
                />
              ))}
            </div>
            
            <button 
              onClick={handleVerify} 
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-primary-700 to-primary-800 text-white rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify Email'}
            </button>
            
            <div className="text-center mt-4">
              <p className="text-sm text-text-muted">
                Didn't receive the code?{' '}
                {canResend ? (
                  <button onClick={handleResendCode} disabled={loading} className="text-secondary-600 hover:text-secondary-700 font-medium">
                    Resend code
                  </button>
                ) : (
                  <span className="text-gray-400">Resend code in {countdown}s</span>
                )}
              </p>
            </div>
            
            <div className="mt-6 pt-4 border-t border-border-light text-center">
              <button onClick={() => navigate('/register')} className="text-sm text-secondary-600 hover:text-secondary-700 flex items-center justify-center gap-1 mx-auto transition-colors">
                <ArrowLeft className="w-3 h-3" /> Back to Sign Up
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;