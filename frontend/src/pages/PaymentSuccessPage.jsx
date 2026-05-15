import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle } from 'lucide-react'

const PaymentSuccessPage = () => {
  const navigate = useNavigate()
  
  useEffect(() => {
    setTimeout(() => navigate('/dashboard'), 3000)
  }, [])
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
        <p className="text-gray-600">Your subscription has been activated. Redirecting to dashboard...</p>
      </div>
    </div>
  )
}

export default PaymentSuccessPage