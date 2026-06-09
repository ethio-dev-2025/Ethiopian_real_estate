// src/pages/auth/LoginPage.jsx
import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { 
  Mail, Lock, Eye, EyeOff, Building2, 
  Sparkles, AlertCircle, ArrowLeft, Shield
} from 'lucide-react'
import { GoogleLogin } from '@react-oauth/google'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

const API_URL = 'http://localhost:8000'

const LoginPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { setAuthData, isInitialized } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [error, setError] = useState('')
  const isProcessingRef = useRef(false)
  const googleProcessedRef = useRef(false)

  const returnTo = location.state?.returnTo
  const openContact = location.state?.openContact
  const prefilledEmail = location.state?.prefilledEmail

  useEffect(() => {
    if (prefilledEmail && !email) {
      setEmail(prefilledEmail)
    }
  }, [prefilledEmail, email])

  const redirectToDashboard = (role) => {
    if (role === 'seller' || role === 'landlord' || role === 'dual') {
      window.location.href = '/dashboard'
    } else if (role === 'buyer') {
      window.location.href = '/dashboard/buyer'
    } else if (role === 'admin') {
      window.location.href = '/admin/dashboard'
    } else {
      window.location.href = '/dashboard'
    }
  }

  const handleGoogleSuccess = async (credentialResponse) => {
    if (isProcessingRef.current || isLoggingIn || googleProcessedRef.current) return
    
    isProcessingRef.current = true
    setIsLoggingIn(true)
    
    const loadingToast = toast.loading('Authenticating with Google...')
    
    try {
      const credential = credentialResponse.credential
      
      const response = await fetch(`${API_URL}/api/auth/google-auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          credential: credential,
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          role_type: "dual"
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        const userRole = data.user.role_type || 'dual'
        
        googleProcessedRef.current = true
        
        localStorage.clear()
        
        localStorage.setItem('access_token', data.access_token)
        localStorage.setItem('user', JSON.stringify(data.user))
        localStorage.setItem('user_role', userRole)
        localStorage.setItem('role_selected', 'true')
        
        setAuthData(data.access_token, data.user)
        
        toast.dismiss(loadingToast)
        toast.success(`Welcome, ${data.user.full_name || data.user.username}!`)
        
        redirectToDashboard(userRole)
      } else {
        toast.dismiss(loadingToast)
        toast.error(data.message || data.detail || 'Google authentication failed')
        setIsLoggingIn(false)
        isProcessingRef.current = false
      }
    } catch (error) {
      console.error('Google auth error:', error)
      toast.dismiss(loadingToast)
      toast.error('Failed to authenticate with Google. Please try again.')
      setIsLoggingIn(false)
      isProcessingRef.current = false
    }
  }

  const handleGoogleError = () => {
    toast.error('Google login failed. Please try again.')
    setIsLoggingIn(false)
    isProcessingRef.current = false
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (isProcessingRef.current || isLoggingIn) return
    
    if (!email || !password) {
      setError('Please enter both email and password')
      toast.error('Please enter both email and password')
      return
    }
    
    isProcessingRef.current = true
    setIsLoggingIn(true)
    setError('')
    
    const loadingToast = toast.loading('Signing in...')
    
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || data.detail || 'Invalid credentials')
      }
      
      const userRole = data.user.role_type
      
      localStorage.clear()
      
      localStorage.setItem('access_token', data.access_token)
      localStorage.setItem('user', JSON.stringify(data.user))
      localStorage.setItem('user_role', userRole)
      localStorage.setItem('role_selected', 'true')
      
      setAuthData(data.access_token, data.user)
      
      toast.dismiss(loadingToast)
      toast.success(`Welcome back, ${data.user.full_name || data.user.username}!`)
      
      redirectToDashboard(userRole)
      
    } catch (err) {
      toast.dismiss(loadingToast)
      let errorMessage = 'Login failed. Please try again.'
      if (err.message === 'Failed to fetch') {
        errorMessage = 'Cannot connect to server. Please make sure the backend is running on port 8000.'
      } else {
        errorMessage = err.message
      }
      setError(errorMessage)
      toast.error(errorMessage)
      setIsLoggingIn(false)
      isProcessingRef.current = false
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-border-light">
          <div className="bg-gradient-to-r from-primary-800 to-primary-900 p-6 text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Welcome Back</h1>
            <p className="text-primary-100 text-sm mt-1">Sign in to your account</p>
          </div>

          <div className="p-6">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-error" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-primary mb-1">
                  Email or Username
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-border-light rounded-xl focus:ring-2 focus:ring-primary-600 focus:border-primary-600 transition-all"
                    placeholder="Enter your email or username"
                    autoComplete="email"
                    autoFocus
                    disabled={isLoggingIn}
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-text-primary mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 border border-border-light rounded-xl focus:ring-2 focus:ring-primary-600 focus:border-primary-600 transition-all"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    disabled={isLoggingIn}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end mb-6">
                <Link to="/forgot-password" className="text-sm text-secondary-600 hover:text-secondary-700 transition-colors">
                  Forgot Password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-3 bg-gradient-to-r from-primary-700 to-primary-800 text-white rounded-xl font-semibold hover:from-primary-800 hover:to-primary-900 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
              >
                {isLoggingIn ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Signing in...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Sign In
                  </>
                )}
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border-light"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white text-text-muted">Or continue with</span>
              </div>
            </div>

            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                useOneTap={false}
                theme="outline"
                text="continue_with"
                shape="rectangular"
              />
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-text-secondary">
                Don't have an account?{' '}
                <Link to="/register" className="text-secondary-600 hover:text-secondary-700 font-semibold transition-colors">
                  Sign Up
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
  )
}

export default LoginPage