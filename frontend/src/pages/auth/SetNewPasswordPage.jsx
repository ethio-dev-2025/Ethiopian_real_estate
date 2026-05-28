// src/pages/auth/SetNewPasswordPage.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Lock, Eye, EyeOff, Shield, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = 'http://localhost:8000';

const SetNewPasswordPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';
  const codeFromState = location.state?.code || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [hasMinLength, setHasMinLength] = useState(false);
  const [passwordsMatch, setPasswordsMatch] = useState(true);

  useEffect(() => {
    if (!email) {
      navigate('/forgot-password');
    }
    
    const codeFromStorage = localStorage.getItem('reset_code');
    const finalCode = codeFromState || codeFromStorage;
    
    console.log('SetNewPasswordPage - Email:', email);
    console.log('SetNewPasswordPage - Code from state:', codeFromState);
    console.log('SetNewPasswordPage - Code from storage:', codeFromStorage);
    console.log('SetNewPasswordPage - Final code:', finalCode);
    
    if (!finalCode) {
      setError('No verification code found. Please go back and verify your code first.');
    }
  }, [email, navigate, codeFromState]);

  useEffect(() => {
    setHasMinLength(password.length >= 6);
    setPasswordsMatch(password === confirmPassword || confirmPassword === '');
  }, [password, confirmPassword]);

  const getPasswordStrength = () => {
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    
    if (strength <= 1) return { text: 'Weak', color: 'red', bg: 'bg-red-100', textColor: 'text-red-600' };
    if (strength <= 2) return { text: 'Fair', color: 'yellow', bg: 'bg-yellow-100', textColor: 'text-yellow-600' };
    if (strength <= 3) return { text: 'Good', color: 'blue', bg: 'bg-blue-100', textColor: 'text-blue-600' };
    return { text: 'Strong', color: 'green', bg: 'bg-green-100', textColor: 'text-green-600' };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('=== Form Submission Started ===');
    console.log('Email:', email);
    console.log('Password length:', password.length);
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      toast.error('Passwords do not match');
      return;
    }
    
    const resetCode = codeFromState || localStorage.getItem('reset_code');
    
    console.log('Reset code being used:', resetCode);
    
    if (!resetCode) {
      setError('No verification code found. Please go back and verify your code first.');
      toast.error('No verification code found');
      return;
    }
    
    setLoading(true);
    setError('');
    
    const requestBody = {
      email: email,
      code: resetCode,
      new_password: password
    };
    
    console.log('Sending request to:', `${API_URL}/api/password-reset/reset-password`);
    console.log('Request body:', requestBody);
    
    try {
      const response = await fetch(`${API_URL}/api/password-reset/reset-password`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      console.log('Response status:', response.status);
      
      const data = await response.json();
      console.log('Response data:', data);
      
      if (response.ok && data.success) {
        setSuccess(true);
        toast.success('Password set successfully! Redirecting to login...');
        localStorage.removeItem('reset_code');
        localStorage.removeItem('reset_email');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        const errorMsg = data.message || data.detail || 'Failed to set password';
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error('Reset password error:', error);
      setError('Failed to set password. Please try again.');
      toast.error('Connection failed');
    } finally {
      setLoading(false);
    }
  };

  const strength = getPasswordStrength();

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <button
          onClick={() => navigate('/')}
          className="fixed top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-xl text-gray-700 hover:bg-white transition-all duration-300 border border-gray-200 shadow-sm group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Back to Home</span>
        </button>

        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Password Set!</h2>
          <p className="text-gray-600 mb-6">Your password has been set successfully. Redirecting to login...</p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
        </div>

        <div className="fixed bottom-6 left-0 right-0 flex justify-center gap-6">
          <div className="flex items-center gap-2 text-xs text-gray-400"><Shield className="w-3 h-3" /> Secure</div>
          <div className="flex items-center gap-2 text-xs text-gray-400"><Shield className="w-3 h-3" /> Fast</div>
          <div className="flex items-center gap-2 text-xs text-gray-400"><Shield className="w-3 h-3" /> Private</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <button
        onClick={() => navigate('/')}
        className="fixed top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-xl text-gray-700 hover:bg-white transition-all duration-300 border border-gray-200 shadow-sm group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-medium">Back to Home</span>
      </button>

      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-teal-600 to-emerald-600 p-6 text-center text-white">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold">Set New Password</h2>
            <p className="text-teal-100 text-sm mt-1">Create a strong password for your account</p>
          </div>
          
          <div className="p-6">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="Enter new password (min 6 characters)"
                  />
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                  </button>
                </div>
              </div>
              
              {password.length > 0 && (
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm font-medium text-gray-700">Password Strength</p>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${strength.bg} ${strength.textColor}`}>
                      {strength.text}
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${
                        strength.text === 'Weak' ? 'bg-red-500 w-1/4' :
                        strength.text === 'Fair' ? 'bg-yellow-500 w-2/4' :
                        strength.text === 'Good' ? 'bg-teal-500 w-3/4' : 'bg-green-500 w-full'
                      }`}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Password must be at least 6 characters</p>
                </div>
              )}
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full pl-10 pr-10 py-3 border rounded-xl focus:ring-2 focus:ring-teal-500 ${
                      !passwordsMatch && confirmPassword ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Re-enter password"
                  />
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                  </button>
                </div>
                {!passwordsMatch && confirmPassword && (
                  <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                )}
                {passwordsMatch && confirmPassword && password && password === confirmPassword && (
                  <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Passwords match!
                  </p>
                )}
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Setting Password...
                  </div>
                ) : (
                  'Set New Password'
                )}
              </button>
            </form>
            
            <div className="mt-6 pt-4 border-t text-center">
              <Link to="/login" className="text-sm text-teal-600 hover:text-teal-700 flex items-center justify-center gap-1">
                <ArrowLeft className="w-3 h-3" /> Back to Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetNewPasswordPage;