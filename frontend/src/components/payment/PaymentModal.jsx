import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { X, Loader, CreditCard } from 'lucide-react'
import toast from 'react-hot-toast'

const API_URL = 'http://localhost:8000/api'

const PaymentModal = ({ planType, amount, onClose, onSuccess }) => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)

  const handlePayment = async () => {
    setLoading(true)
    
    const firstName = user?.full_name?.split(' ')[0] || user?.username || 'Customer'
    const lastName = user?.full_name?.split(' ')[1] || 'User'
    const phoneNumber = "0911111111"  // Test phone number
    
    try {
      const response = await fetch(`${API_URL}/payments/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          plan_type: planType,
          amount: amount,
          email: user?.email,
          first_name: firstName,
          last_name: lastName,
          phone: phoneNumber
        })
      })
      
      const data = await response.json()
      
      if (data.success && data.checkout_url) {
        window.location.href = data.checkout_url
      } else {
        toast.error(data.detail || 'Payment failed')
        setLoading(false)
      }
    } catch (error) {
      console.error('Payment error:', error)
      toast.error('Connection error')
      setLoading(false)
    }
  }

  const plans = {
    seller: { name: 'Seller Plan', price: 149 },
    landlord: { name: 'Landlord Plan', price: 199 },
    dual: { name: 'Dual Plan', price: 298 }
  }

  const plan = plans[planType]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full">
        <div className="p-6 border-b flex justify-between">
          <h2 className="text-xl font-bold">Complete Payment</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        
        <div className="p-6">
          <div className="text-center mb-6">
            <p className="text-gray-600">{plan?.name}</p>
            <p className="text-3xl font-bold text-blue-600">${plan?.price}<span className="text-sm">/month</span></p>
          </div>
          
          <div className="bg-yellow-50 p-3 rounded-lg mb-6 text-sm text-yellow-800">
            💳 Test Card: <strong>4242 4242 4242 4242</strong> | Exp: 12/25 | CVV: 123
            <br />
            📱 Test Phone: <strong>0911111111</strong>
          </div>
          
          <button
            onClick={handlePayment}
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
            {loading ? 'Processing...' : `Pay $${plan?.price}`}
          </button>
        </div>
      </div>
    </div>
  )
}

export default PaymentModal