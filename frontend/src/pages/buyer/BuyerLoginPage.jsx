// src/pages/buyer/BuyerLoginPage.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, User, Lock, LogIn, Home, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = 'http://localhost:8000';

const BuyerLoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const returnTo = location.state?.returnTo;
  const openContact = location.state?.openContact;

  useEffect(() => {
    const savedUsername = localStorage.getItem('remembered_buyer_username');
    const savedPassword = localStorage.getItem('remembered_buyer_password');
    const rememberChecked = localStorage.getItem('remember_buyer_me') === 'true';
    
    if (savedUsername && savedPassword && rememberChecked && !username) {
      setUsername(savedUsername);
      setPassword(savedPassword);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username || !password) {
      setError('Please enter both username and password');
      toast.error('Please enter both username and password');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ email: username, password })
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Invalid credentials');
      }
      
      const userRole = data.user.role_type || data.user.role;
      if (userRole !== 'buyer') {
        toast.error('This account is not a buyer account.');
        setLoading(false);
        return;
      }
      
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('user_role', 'buyer');
      localStorage.setItem('role_selected', 'true');
      
      if (rememberMe) {
        localStorage.setItem('remembered_buyer_username', username);
        localStorage.setItem('remembered_buyer_password', password);
        localStorage.setItem('remember_buyer_me', 'true');
      } else {
        localStorage.removeItem('remembered_buyer_username');
        localStorage.removeItem('remembered_buyer_password');
        localStorage.removeItem('remember_buyer_me');
      }
      
      toast.success(`Welcome back, ${data.user.full_name || data.user.username}!`);
      
      if (returnTo && openContact) {
        localStorage.setItem('openChatAfterLogin', 'true');
        localStorage.setItem('chatPropertyId', String(returnTo));
        navigate(`/properties/${returnTo}`, { replace: true });
        return;
      }
      
      navigate('/dashboard/buyer', { replace: true });
      
    } catch (err) {
      console.error('Login error:', err);
      setError('Invalid username or password');
      toast.error('Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          {/* Header - White/Black theme */}
          <div className="bg-white p-6 text-center border-b border-gray-100">
            <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-3">
              <Home className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Buyer Login</h1>
            <p className="text-gray-500 text-sm mt-1">Sign in to explore properties</p>
          </div>

          {/* Form */}
          <div className="p-6">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                <div className="w-4 h-4 text-red-500">⚠️</div>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                    placeholder="Enter your username"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                    placeholder="Enter your password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center mb-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                  />
                  <span className="text-sm text-gray-600">Remember me</span>
                </label>
                
                <Link to="/forgot-password" className="text-sm text-gray-600 hover:text-gray-900">
                  Forgot Password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    Sign In
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don't have a buyer account?{' '}
                <Link to="/buyer/register" className="text-gray-900 hover:text-gray-700 font-semibold">
                  Sign Up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuyerLoginPage;