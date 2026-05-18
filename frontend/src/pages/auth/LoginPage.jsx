// src/pages/auth/LoginPage.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';

const API_URL = 'http://localhost:8000';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const returnTo = location.state?.returnTo;
  const openContact = location.state?.openContact;
  const prefilledEmail = location.state?.prefilledEmail;

  useEffect(() => {
    if (prefilledEmail && !email) {
      setEmail(prefilledEmail);
    }
    
    const savedEmail = localStorage.getItem('remembered_email');
    const savedPassword = localStorage.getItem('remembered_password');
    const rememberChecked = localStorage.getItem('remember_me') === 'true';
    
    if (savedEmail && savedPassword && rememberChecked && !email) {
      setEmail(savedEmail);
      setPassword(savedPassword);
      setRememberMe(true);
    }
  }, [prefilledEmail, email]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please enter both email and password');
      toast.error('Please enter both email and password');
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
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      console.log('Login response:', data);
      
      if (!data.success) {
        throw new Error(data.error || 'Invalid credentials');
      }
      
      // Store auth data
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Get raw role from user data
      let rawRole = data.user.role_type || data.user.role || 'buyer';
      
      // Only convert 'user' to 'buyer', leave everything else
      let finalRole = rawRole;
      if (rawRole === 'user') {
        finalRole = 'buyer';
      }
      
      console.log('Raw role:', rawRole, 'Final role:', finalRole);
      
      localStorage.setItem('user_role', finalRole);
      localStorage.setItem('role_selected', 'true');
      
      if (rememberMe) {
        localStorage.setItem('remembered_email', email);
        localStorage.setItem('remembered_password', password);
        localStorage.setItem('remember_me', 'true');
      } else {
        localStorage.removeItem('remembered_email');
        localStorage.removeItem('remembered_password');
        localStorage.removeItem('remember_me');
      }
      
      toast.success(`Welcome back, ${data.user.full_name || data.user.username}!`);
      
      // Handle return to property contact
      if (returnTo && openContact) {
        localStorage.setItem('openContactForm', 'true');
        localStorage.setItem('contactPropertyId', returnTo);
        navigate(`/properties/${returnTo}`);
        return;
      }
      
      // Role-based redirects
      const role = finalRole.toLowerCase();
      console.log('Redirecting based on role:', role);
      
      // Force a full page reload to ensure AppRoutes re-renders with new auth state
      if (role === 'seller' || role === 'landlord' || role === 'dual') {
        console.log('✅ Seller role detected, redirecting to /dashboard');
        window.location.href = '/dashboard';
        return;
      } 
      else if (role === 'admin') {
        console.log('✅ Admin role detected, redirecting to /admin/dashboard');
        window.location.href = '/admin/dashboard';
        return;
      }
      else if (role === 'buyer') {
        console.log('✅ Buyer role detected, redirecting to /dashboard/buyer');
        window.location.href = '/dashboard/buyer';
        return;
      }
      else {
        window.location.href = '/';
      }
      
    } catch (err) {
      console.error('Login error:', err);
      let errorMessage = 'Login failed. Please try again.';
      if (err.message === 'Failed to fetch') {
        errorMessage = 'Cannot connect to server. Please make sure the backend is running on port 8000.';
      } else if (err.message === 'Invalid credentials') {
        errorMessage = 'Invalid email/username or password';
      }
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <button
        onClick={() => navigate('/')}
        style={{
          position: 'absolute',
          top: '24px',
          left: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '12px',
          color: 'white',
          border: 'none',
          cursor: 'pointer'
        }}
      >
        ← Back to Home
      </button>

      <div style={{
        maxWidth: '400px',
        width: '100%',
        background: 'rgba(255,255,255,0.1)',
        backdropFilter: 'blur(10px)',
        borderRadius: '24px',
        padding: '32px',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            fontSize: '40px'
          }}>
            🏢
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: 'white', marginBottom: '8px' }}>
            Seller / Admin Login
          </h1>
          <p style={{ color: '#cbd5e1' }}>Sign in to your seller or admin account</p>
        </div>

        {error && (
          <div style={{
            marginBottom: '24px',
            padding: '12px',
            background: 'rgba(239,68,68,0.2)',
            border: '1px solid rgba(239,68,68,0.5)',
            borderRadius: '12px',
            color: '#fecaca',
            fontSize: '14px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#e2e8f0', marginBottom: '8px' }}>
              Email or Username
            </label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                color: 'white',
                fontSize: '16px',
                outline: 'none'
              }}
              placeholder="Enter your email or username"
              disabled={loading}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#e2e8f0', marginBottom: '8px' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  color: 'white',
                  fontSize: '16px',
                  outline: 'none'
                }}
                placeholder="Enter your password"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer'
                }}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ width: '16px', height: '16px' }}
              />
              <span style={{ fontSize: '14px', color: '#cbd5e1' }}>Remember me</span>
            </label>
            
            <Link to="/forgot-password" style={{ fontSize: '14px', color: '#60a5fa', textDecoration: 'none' }}>
              Forgot Password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              border: 'none',
              borderRadius: '12px',
              color: 'white',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <p style={{ fontSize: '14px', color: '#cbd5e1', marginTop: '8px' }}>
            Don't have a seller account?{' '}
            <Link to="/register" style={{ color: '#60a5fa', textDecoration: 'none', fontWeight: '600' }}>
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;