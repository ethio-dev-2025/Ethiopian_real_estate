import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Building2, Lock, Eye, EyeOff, User, Phone, Sparkles, ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

const API_URL = 'http://localhost:8000'

const BuyerLoginPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    identifier: '',
    password: ''
  })

  const returnTo = location.state?.returnTo
  const openContact = location.state?.openContact

  useEffect(() => {
    console.log('BuyerLoginPage mounted with state:', { returnTo, openContact })
    
    // Clear any stale flags when component mounts
    // This prevents opening chat if user navigates away and comes back
    if (!returnTo) {
      localStorage.removeItem('openChatAfterLogin')
      localStorage.removeItem('chatPropertyId')
    }
  }, [returnTo, openContact])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    console.log('Login attempt with identifier:', formData.identifier)
    
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.identifier,
          password: formData.password
        })
      })
      
      const data = await response.json()
      console.log('Login response:', data)
      
      if (!response.ok || !data.success) {
        setError(data.error || data.detail || 'Invalid username/phone number or password')
        toast.error(data.error || 'Invalid credentials')
        setLoading(false)
        return
      }
      
      // Store auth data
      localStorage.setItem('access_token', data.access_token)
      localStorage.setItem('user', JSON.stringify(data.user))
      localStorage.setItem('user_role', data.user.role_type)
      
      toast.success(`Welcome back, ${data.user.full_name || data.user.username}!`)
      
      // Handle return to property contact - ONLY SET FLAGS IF NOT ALREADY SET
      if (returnTo && openContact) {
        // Only set flags if they haven't been set yet (to prevent duplicates)
        const existingFlag = localStorage.getItem('openChatAfterLogin')
        const existingPropertyId = localStorage.getItem('chatPropertyId')
        
        if (existingFlag !== 'true' || existingPropertyId !== returnTo.toString()) {
          console.log('Setting chat flags for property:', returnTo)
          localStorage.setItem('openChatAfterLogin', 'true')
          localStorage.setItem('chatPropertyId', returnTo.toString())
        } else {
          console.log('Chat flags already set for this property, skipping')
        }
        
        // Use replace to prevent back button issues
        navigate(`/properties/${returnTo}`, { replace: true })
        return
      }
      
      // Role-based redirects
      if (returnTo) {
        navigate(`/properties/${returnTo}`, { replace: true })
        return
      }
      
      const role = data.user.role_type
      console.log('User role:', role)
      
      switch(role) {
        case 'admin':
          navigate('/admin/dashboard', { replace: true })
          break
        case 'buyer':
          navigate('/dashboard/buyer', { replace: true })
          break
        case 'seller':
          navigate('/dashboard', { replace: true })
          break
        case 'landlord':
          navigate('/dashboard', { replace: true })
          break
        case 'dual':
          navigate('/dashboard', { replace: true })
          break
        default:
          navigate('/dashboard', { replace: true })
      }
      
    } catch (error) {
      console.error('Login error:', error)
      setError('Login failed. Please check your connection.')
      toast.error('Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Back to Home Button - Top Left Corner */}
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
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
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
            <p className="text-gray-300">Sign in to your buyer account</p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">Username or Phone Number</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-blue-400 transition-colors" />
                <input
                  type="text"
                  name="identifier"
                  value={formData.identifier}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter your username or phone number"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-blue-400 transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-12 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter your password"
                  required
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

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-semibold text-white hover:shadow-lg transition-all disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Signing in...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Sign In
                </div>
              )}
            </motion.button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-300">
              Don't have an account?{' '}
              <Link 
                to="/buyer/register" 
                className="text-blue-400 hover:text-blue-300 font-semibold" 
                state={{ returnTo, openContact }}
              >
                Create Account
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default BuyerLoginPage