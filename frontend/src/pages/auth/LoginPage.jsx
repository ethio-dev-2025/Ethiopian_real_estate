import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { 
  Mail, Lock, Eye, EyeOff, LogIn, Shield, Building2, 
  Sparkles, AlertCircle, ArrowLeft, Github, Chrome, 
  Facebook, Twitter 
} from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

const API_URL = 'http://localhost:8000'

const LoginPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [socialLoading, setSocialLoading] = useState(null)
  const [error, setError] = useState('')
  const [rememberMe, setRememberMe] = useState(false)

  const returnTo = location.state?.returnTo
  const openContact = location.state?.openContact
  const prefilledEmail = location.state?.prefilledEmail

  useEffect(() => {
    if (prefilledEmail && !email) {
      setEmail(prefilledEmail)
    }
    
    const savedEmail = localStorage.getItem('remembered_email')
    const savedPassword = localStorage.getItem('remembered_password')
    const rememberChecked = localStorage.getItem('remember_me') === 'true'
    
    if (savedEmail && savedPassword && rememberChecked && !email) {
      setEmail(savedEmail)
      setPassword(savedPassword)
      setRememberMe(true)
    }
  }, [prefilledEmail, email])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!email || !password) {
      setError('Please enter both email and password')
      toast.error('Please enter both email and password')
      return
    }
    
    setLoading(true)
    setError('')
    
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
      console.log('Login response:', data)
      
      if (!data.success) {
        throw new Error(data.error || 'Invalid credentials')
      }
      
      // Store auth data
      localStorage.setItem('access_token', data.access_token)
      localStorage.setItem('user', JSON.stringify(data.user))
      localStorage.setItem('user_role', data.user.role_type)
      
      if (rememberMe) {
        localStorage.setItem('remembered_email', email)
        localStorage.setItem('remembered_password', password)
        localStorage.setItem('remember_me', 'true')
      } else {
        localStorage.removeItem('remembered_email')
        localStorage.removeItem('remembered_password')
        localStorage.removeItem('remember_me')
      }
      
      toast.success(`Welcome back, ${data.user.full_name || data.user.username}!`)
      
      // Handle return to property contact
      if (returnTo && openContact) {
        localStorage.setItem('openContactForm', 'true')
        localStorage.setItem('contactPropertyId', returnTo)
        navigate(`/properties/${returnTo}`)
        return
      }
      
      // Role-based redirects
      const role = data.user.role_type
      console.log('User role:', role)
      
      switch(role) {
        case 'admin':
          navigate('/admin/dashboard')
          break
        case 'buyer':
          navigate('/dashboard/buyer')
          break
        case 'seller':
          navigate('/dashboard')
          break
        case 'landlord':
          navigate('/dashboard')
          break
        case 'dual':
          navigate('/dashboard')
          break
        default:
          navigate('/dashboard')
      }
      
    } catch (err) {
      console.error('Login error:', err)
      let errorMessage = 'Login failed. Please try again.'
      if (err.message === 'Failed to fetch') {
        errorMessage = 'Cannot connect to server. Please make sure the backend is running on port 8000.'
      } else if (err.message === 'Invalid credentials') {
        errorMessage = 'Invalid email/username or password'
      }
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleSocialLogin = (provider) => {
    setSocialLoading(provider)
    setTimeout(() => {
      toast.info(`${provider} login would be integrated here`)
      setSocialLoading(null)
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Back to Home Arrow - Top Left Corner */}
      <button
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 z-20 flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl text-white hover:bg-white/20 transition-all duration-300 border border-white/20 group"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-medium">Back to Home</span>
      </button>

      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000"></div>
      </div>

      <div className="max-w-md w-full relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20"
        >
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, type: "spring" }}
              className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
            >
              <Building2 className="w-10 h-10 text-white" />
            </motion.div>
            <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
            <p className="text-gray-300">Sign in to your account</p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Email or Username
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-blue-400 transition-colors" />
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter your email or username"
                  autoComplete="username"
                  autoFocus
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Password
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-blue-400 transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-300">Remember me</span>
              </label>
              
              <Link to="/forgot-password" className="text-sm text-blue-400 hover:text-blue-300 transition">
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-semibold text-white hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
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

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/20"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-transparent text-gray-400">Or continue with</span>
            </div>
          </div>

          {/* Social Login Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleSocialLogin('Google')}
              disabled={socialLoading !== null}
              className="flex items-center justify-center gap-2 py-2.5 bg-white/5 border border-white/10 rounded-xl text-gray-200 hover:bg-white/10 transition-all duration-300 disabled:opacity-50"
            >
              {socialLoading === 'Google' ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Chrome className="w-5 h-5 text-red-400" />
              )}
              <span className="text-sm">Google</span>
            </button>
            
            <button
              onClick={() => handleSocialLogin('Facebook')}
              disabled={socialLoading !== null}
              className="flex items-center justify-center gap-2 py-2.5 bg-white/5 border border-white/10 rounded-xl text-gray-200 hover:bg-white/10 transition-all duration-300 disabled:opacity-50"
            >
              {socialLoading === 'Facebook' ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Facebook className="w-5 h-5 text-blue-500" />
              )}
              <span className="text-sm">Facebook</span>
            </button>
            
            <button
              onClick={() => handleSocialLogin('Twitter')}
              disabled={socialLoading !== null}
              className="flex items-center justify-center gap-2 py-2.5 bg-white/5 border border-white/10 rounded-xl text-gray-200 hover:bg-white/10 transition-all duration-300 disabled:opacity-50"
            >
              {socialLoading === 'Twitter' ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Twitter className="w-5 h-5 text-sky-400" />
              )}
              <span className="text-sm">Twitter</span>
            </button>
            
            <button
              onClick={() => handleSocialLogin('GitHub')}
              disabled={socialLoading !== null}
              className="flex items-center justify-center gap-2 py-2.5 bg-white/5 border border-white/10 rounded-xl text-gray-200 hover:bg-white/10 transition-all duration-300 disabled:opacity-50"
            >
              {socialLoading === 'GitHub' ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Github className="w-5 h-5 text-gray-300" />
              )}
              <span className="text-sm">GitHub</span>
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-300">
              Don't have an account?{' '}
              <Link to="/register" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
                Sign Up
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default LoginPage