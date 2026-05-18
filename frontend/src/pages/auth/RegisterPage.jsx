// src/pages/auth/RegisterPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const API_URL = 'http://localhost:8000';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    username: '',
    phone: '',
    password: '',
    confirm_password: ''
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required for seller account';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (formData.password !== formData.confirm_password) {
      newErrors.confirm_password = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    const toastId = toast.loading('Creating seller account...');
    
    try {
      // IMPORTANT: Send role_type as 'dual' for seller
      const requestBody = {
        full_name: formData.full_name,
        email: formData.email,
        username: formData.username,
        phone: formData.phone || '',
        password: formData.password,
        role_type: 'dual'  // <-- THIS IS CRITICAL
      };
      
      console.log('Seller registration request:', requestBody);
      
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      
      const data = await response.json();
      console.log('Registration response:', data);
      
      if (response.ok && data.id) {
        toast.success('Seller account created successfully! Please login.', { id: toastId });
        setTimeout(() => navigate('/login'), 2000);
      } else {
        const errorMsg = data.detail || data.message || 'Registration failed';
        toast.error(errorMsg, { id: toastId });
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Failed to create account. Please try again.', { id: toastId });
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
        maxWidth: '500px',
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
            Seller Registration
          </h1>
          <p style={{ color: '#cbd5e1' }}>Create your seller account to list properties</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#e2e8f0', marginBottom: '8px' }}>
              Full Name <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(255,255,255,0.05)',
                border: `1px solid ${errors.full_name ? '#ef4444' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: '12px',
                color: 'white',
                fontSize: '16px',
                outline: 'none'
              }}
              placeholder="Enter your full name"
            />
            {errors.full_name && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.full_name}</p>}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#e2e8f0', marginBottom: '8px' }}>
              Email Address <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(255,255,255,0.05)',
                border: `1px solid ${errors.email ? '#ef4444' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: '12px',
                color: 'white',
                fontSize: '16px',
                outline: 'none'
              }}
              placeholder="Enter your email"
            />
            {errors.email && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.email}</p>}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#e2e8f0', marginBottom: '8px' }}>
              Username <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(255,255,255,0.05)',
                border: `1px solid ${errors.username ? '#ef4444' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: '12px',
                color: 'white',
                fontSize: '16px',
                outline: 'none'
              }}
              placeholder="Choose a username"
            />
            {errors.username && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.username}</p>}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#e2e8f0', marginBottom: '8px' }}>
              Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
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
              placeholder="Enter your phone number"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#e2e8f0', marginBottom: '8px' }}>
              Password <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(255,255,255,0.05)',
                  border: `1px solid ${errors.password ? '#ef4444' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: '12px',
                  color: 'white',
                  fontSize: '16px',
                  outline: 'none',
                  paddingRight: '40px'
                }}
                placeholder="Create a password"
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
            {errors.password && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.password}</p>}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#e2e8f0', marginBottom: '8px' }}>
              Confirm Password <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirm_password"
                value={formData.confirm_password}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(255,255,255,0.05)',
                  border: `1px solid ${errors.confirm_password ? '#ef4444' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: '12px',
                  color: 'white',
                  fontSize: '16px',
                  outline: 'none',
                  paddingRight: '40px'
                }}
                placeholder="Confirm your password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {errors.confirm_password && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.confirm_password}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              border: 'none',
              borderRadius: '12px',
              color: 'white',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              marginTop: '8px'
            }}
          >
            {loading ? 'Creating Account...' : 'Create Seller Account'}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <p style={{ fontSize: '14px', color: '#cbd5e1' }}>
            Already have a seller account?{' '}
            <Link to="/login" style={{ color: '#60a5fa', textDecoration: 'none', fontWeight: '600' }}>
              Sign In
            </Link>
          </p>
          <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '12px' }}>
            <Link to="/buyer/register" style={{ color: '#60a5fa', textDecoration: 'none' }}>
              Looking to buy a property? Register as Buyer →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;