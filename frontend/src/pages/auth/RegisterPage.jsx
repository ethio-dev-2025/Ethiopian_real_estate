// src/pages/auth/RegisterPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, User, Mail, Phone, Lock, UserPlus, Building2, CheckCircle, AlertCircle, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = 'http://localhost:8000';

// Ethiopian phone number validation
const validateEthiopianPhone = (phone) => {
  if (!phone) return false;
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  const patterns = [
    /^09\d{8}$/,
    /^07\d{8}$/,
    /^2519\d{8}$/,
    /^\+2519\d{8}$/,
  ];
  return patterns.some(pattern => pattern.test(cleaned));
};

// Gmail validation
const validateGmail = (email) => {
  if (!email) return false;
  const emailLower = email.toLowerCase().trim();
  return emailLower.endsWith('@gmail.com') || emailLower.endsWith('@googlemail.com');
};

const RegisterPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: ''
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.full_name.trim()) newErrors.full_name = 'Full name is required';
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateGmail(formData.email)) {
      newErrors.email = 'Only Gmail addresses are allowed';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!validateEthiopianPhone(formData.phone)) {
      newErrors.phone = 'Please enter a valid Ethiopian phone number';
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

  const generateUsername = (email) => {
    const username = email.split('@')[0];
    return username.replace(/\./g, '');
  };

  const extractErrorMessage = (data) => {
    if (!data) return 'Registration failed';
    
    if (typeof data.detail === 'string') {
      return data.detail;
    }
    
    if (Array.isArray(data.detail) && data.detail.length > 0) {
      const firstError = data.detail[0];
      if (firstError && firstError.msg) {
        const field = firstError.loc ? firstError.loc[firstError.loc.length - 1] : '';
        if (field === 'email') {
          setErrors(prev => ({ ...prev, email: firstError.msg }));
        } else if (field === 'phone') {
          setErrors(prev => ({ ...prev, phone: firstError.msg }));
        } else if (field === 'username') {
          setErrors(prev => ({ ...prev, username: firstError.msg }));
        }
        return firstError.msg;
      }
    }
    
    if (typeof data.detail === 'object' && data.detail.message) {
      return data.detail.message;
    }
    
    return 'Registration failed';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);
    const toastId = toast.loading('Creating seller account...');
    
    try {
      const username = generateUsername(formData.email);
      
      const requestBody = {
        full_name: formData.full_name,
        email: formData.email,
        username: username,
        phone: formData.phone,
        password: formData.password,
        role_type: 'dual'
      };
      
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      
      let data;
      try {
        data = await response.json();
      } catch (e) {
        data = { detail: 'Invalid response from server' };
      }
      
      if (response.ok && data.id) {
        toast.success('Seller account created successfully! Please login.', { id: toastId });
        setTimeout(() => navigate('/login'), 2000);
      } else {
        const errorMessage = extractErrorMessage(data);
        
        if (errorMessage.includes('Email already registered') || errorMessage.includes('email already registered') || errorMessage.includes('already exists')) {
          toast.error('This email is already registered. Please login or use a different email.', { id: toastId });
          setErrors(prev => ({ ...prev, email: 'Email already registered' }));
        } else if (errorMessage.includes('Phone number already registered') || errorMessage.includes('phone already registered')) {
          toast.error('This phone number is already registered. Please login or use a different phone number.', { id: toastId });
          setErrors(prev => ({ ...prev, phone: 'Phone number already registered' }));
        } else if (errorMessage.includes('Username already taken') || errorMessage.includes('username already taken')) {
          toast.error('Username already taken. Please choose another username.', { id: toastId });
          setErrors(prev => ({ ...prev, username: 'Username already taken' }));
        } else if (errorMessage.includes('Gmail') || errorMessage.includes('gmail.com')) {
          toast.error('Only Gmail addresses are allowed.', { id: toastId });
          setErrors(prev => ({ ...prev, email: 'Only Gmail addresses are allowed' }));
        } else if (errorMessage.includes('Ethiopian phone')) {
          toast.error('Please enter a valid Ethiopian phone number.', { id: toastId });
          setErrors(prev => ({ ...prev, phone: 'Invalid Ethiopian phone number' }));
        } else {
          toast.error(errorMessage, { id: toastId });
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Failed to create account. Please try again.', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-border-light">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-800 to-primary-900 p-6 text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Create Account</h1>
            <p className="text-primary-100 text-sm mt-1">Join as a seller to list properties</p>
          </div>

          {/* Form */}
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  Full Name <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-3 border ${errors.full_name ? 'border-error' : 'border-border-light'} rounded-xl focus:ring-2 focus:ring-primary-600 focus:border-primary-600 transition-all`}
                    placeholder="Enter your full name"
                    autoComplete="name"
                  />
                </div>
                {errors.full_name && <p className="text-error text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.full_name}</p>}
              </div>

              {/* Email - Gmail only */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  Email Address <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-3 border ${errors.email ? 'border-error' : 'border-border-light'} rounded-xl focus:ring-2 focus:ring-primary-600 focus:border-primary-600 transition-all`}
                    placeholder="your.email@gmail.com"
                    autoComplete="email"
                  />
                </div>
                {errors.email && <p className="text-error text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.email}</p>}
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  Phone Number <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-3 border ${errors.phone ? 'border-error' : 'border-border-light'} rounded-xl focus:ring-2 focus:ring-primary-600 focus:border-primary-600 transition-all`}
                    placeholder="0912345678"
                    autoComplete="tel"
                  />
                </div>
                {errors.phone && <p className="text-error text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.phone}</p>}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  Password <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-10 py-3 border ${errors.password ? 'border-error' : 'border-border-light'} rounded-xl focus:ring-2 focus:ring-primary-600 focus:border-primary-600 transition-all`}
                    placeholder="Create a password (min 6 characters)"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && <p className="text-error text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.password}</p>}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  Confirm Password <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirm_password"
                    value={formData.confirm_password}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-10 py-3 border ${errors.confirm_password ? 'border-error' : 'border-border-light'} rounded-xl focus:ring-2 focus:ring-primary-600 focus:border-primary-600 transition-all`}
                    placeholder="Confirm your password"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.confirm_password && <p className="text-error text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.confirm_password}</p>}
                {formData.password && formData.confirm_password && formData.password === formData.confirm_password && (
                  <p className="text-success text-xs mt-1 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Passwords match!
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-primary-700 to-primary-800 text-white rounded-xl font-semibold hover:from-primary-800 hover:to-primary-900 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating Account...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" />
                    Create Seller Account
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-text-secondary">
                Already have an account?{' '}
                <Link to="/login" className="text-secondary-600 hover:text-secondary-700 font-semibold transition-colors">
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Footer Security Badges */}
        <div className="mt-6 flex justify-center gap-6">
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <Shield className="w-3 h-3" /> Secure
          </div>
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <Shield className="w-3 h-3" /> Fast
          </div>
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <Shield className="w-3 h-3" /> Private
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;