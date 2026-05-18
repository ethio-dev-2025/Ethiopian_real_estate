// src/pages/buyer/BuyerLoginPage.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
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
      console.log('Login response:', data);
      
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
      
      // Redirect to property page to trigger auto-open chat
      if (returnTo && openContact) {
        console.log('Redirecting to property page after login:', returnTo);
        localStorage.setItem('openChatAfterLogin', 'true');
        localStorage.setItem('chatPropertyId', String(returnTo));
        navigate(`/properties/${returnTo}`, { replace: true });
        return;
      }
      
      navigate('/dashboard/buyer', { replace: true });
      
    } catch (err) {
      console.error('Login error:', err);
      let errorMessage = 'Login failed. Please try again.';
      if (err.message === 'Failed to fetch') {
        errorMessage = 'Cannot connect to server. Please make sure the backend is running on port 8000.';
      } else if (err.message === 'Invalid credentials') {
        errorMessage = 'Invalid username or password';
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
      background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 50%, #0f766e 100%)',
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
            background: 'linear-gradient(135deg, #0d9488, #14b8a6)',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            fontSize: '40px'
          }}>
            🏠
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: 'white', marginBottom: '8px' }}>
            Buyer Login
          </h1>
          <p style={{ color: '#cbd5e1' }}>Sign in with your username</p>
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
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
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
              placeholder="Enter your username"
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
              background: 'linear-gradient(135deg, #0d9488, #14b8a6)',
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
          <p style={{ fontSize: '14px', color: '#cbd5e1' }}>
            Don't have a buyer account?{' '}
            <Link to="/buyer/register" style={{ color: '#60a5fa', textDecoration: 'none', fontWeight: '600' }}>
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default BuyerLoginPage;