import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Building2, Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import HumanImage from '../../components/common/HumanImage'

const API_URL = 'http://localhost:8000/api'

const ForgotPasswordPage = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [resetLink, setResetLink] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) {
      setError('Please enter your email address')
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      const response = await fetch(`${API_URL}/password-reset/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setSubmitted(true)
        if (data.reset_link) {
          setResetLink(data.reset_link)
          console.log('Reset link (copy this):', data.reset_link)
        }
        toast.success('Reset link sent! Check console for link (development mode)')
      } else {
        setError(data.detail || 'Failed to send reset link')
        toast.error(data.detail || 'Failed to send reset link')
      }
    } catch (err) {
      setError('Network error. Please try again.')
      toast.error('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900">
        <div className="relative z-10 flex min-h-screen items-center justify-center p-8">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/20 max-w-md w-full text-center">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Check Your Email</h2>
            <p className="text-gray-300 mb-6">
              We've sent a password reset link to <strong className="text-white">{email}</strong>
            </p>
            {resetLink && (
              <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-300 mb-2">Development Mode - Reset Link:</p>
                <p className="text-xs text-blue-200 break-all">{resetLink}</p>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(resetLink)
                    toast.success('Link copied!')
                  }}
                  className="mt-2 text-xs bg-blue-600 text-white px-3 py-1 rounded"
                >
                  Copy Link
                </button>
              </div>
            )}
            <p className="text-sm text-gray-400 mb-4">The link will expire in 1 hour</p>
            <Link to="/login" className="text-blue-400 hover:text-blue-300 font-semibold">
              Back to Login
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
                <h2 className="text-2xl font-bold text-white">Forgot Password?</h2>
                <p className="text-gray-300 mt-2">
                  Enter your email address and we'll send you a link to reset your password
                </p>
              </div>

              {error && (
                <div className="mb-6 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>

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

export default ForgotPasswordPage