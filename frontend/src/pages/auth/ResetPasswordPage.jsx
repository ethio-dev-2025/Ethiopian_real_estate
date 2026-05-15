import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Building2, Lock, Eye, EyeOff, CheckCircle, ArrowLeft, AlertCircle, Loader } from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import HumanImage from '../../components/common/HumanImage'

const API_URL = 'http://localhost:8000/api'

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')
  
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(true)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [tokenValid, setTokenValid] = useState(false)

  useEffect(() => {
    if (token) {
      verifyToken()
    } else {
      setVerifying(false)
      setError('Invalid or missing reset token')
    }
  }, [token])

  const verifyToken = async () => {
    try {
      const response = await fetch(`${API_URL}/password-reset/verify-token/${token}`)
      const data = await response.json()
      
      if (data.valid) {
        setTokenValid(true)
      } else {
        setError('Invalid or expired reset token. Please request a new one.')
      }
    } catch (error) {
      console.error('Token verification error:', error)
      setError('Failed to verify reset token')
    } finally {
      setVerifying(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!password) {
      setError('Please enter a new password')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (!token) {
      setError('Invalid reset token')
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      const response = await fetch(`${API_URL}/password-reset/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: password })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setSubmitted(true)
        toast.success('Password reset successfully!')
        setTimeout(() => {
          navigate('/login')
        }, 3000)
      } else {
        setError(data.detail || 'Failed to reset password')
        toast.error(data.detail || 'Failed to reset password')
      }
    } catch (err) {
      setError('Network error. Please try again.')
      toast.error('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (verifying) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900">
        <div className="relative z-10 flex min-h-screen items-center justify-center p-8">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/20 max-w-md w-full text-center">
            <Loader className="w-12 h-12 animate-spin text-blue-400 mx-auto mb-4" />
            <p className="text-white">Verifying reset link...</p>
          </div>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900">
        <div className="relative z-10 flex min-h-screen items-center justify-center p-8">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/20 max-w-md w-full text-center">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Password Reset Successful!</h2>
            <p className="text-gray-300 mb-6">
              Your password has been reset successfully. You can now log in with your new password.
            </p>
            <Link to="/login" className="text-blue-400 hover:text-blue-300 font-semibold">
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900">
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 flex min-h-screen">
        <HumanImage />
        
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-md"
          >
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/20">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-lg mb-4">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white">Reset Password</h2>
                <p className="text-gray-300 mt-2">Enter your new password below</p>
              </div>

              {error && (
                <div className="mb-6 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
                  {error}
                </div>
              )}

              {!tokenValid ? (
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 text-yellow-400 mb-4">
                    <AlertCircle className="w-5 h-5" />
                    <p>Invalid or expired reset token</p>
                  </div>
                  <Link to="/forgot-password" className="text-blue-400 hover:text-blue-300">
                    Request new reset link
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter new password"
                        className="w-full pl-10 pr-10 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
                        required
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2">
                        {showPassword ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Minimum 6 characters</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm your new password"
                        className="w-full pl-10 pr-10 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
                        required
                      />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2">
                        {showConfirmPassword ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {loading ? 'Resetting...' : 'Reset Password'}
                  </button>
                </form>
              )}

              <div className="mt-6 text-center">
                <Link to="/login" className="text-blue-400 hover:text-blue-300 font-semibold flex items-center justify-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Login
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default ResetPasswordPage