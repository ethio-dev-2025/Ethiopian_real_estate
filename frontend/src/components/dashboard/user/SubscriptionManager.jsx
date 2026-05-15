import React, { useState } from 'react'
import { CreditCard, CheckCircle, Shield, Crown, Home, Star, Zap, Award } from 'lucide-react'
import PaymentModal from '../../payment/PaymentModal'
import toast from 'react-hot-toast'

const SubscriptionManager = ({ user, onSubscriptionUpdated }) => {
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(null)

  const handleSubscribe = (planType) => {
    setSelectedPlan(planType)
    setShowPaymentModal(true)
  }

  const handlePaymentSuccess = async () => {
    setShowPaymentModal(false)
    if (onSubscriptionUpdated) {
      await onSubscriptionUpdated()
    }
    toast.success('Subscription activated successfully!')
  }

  const getPlanAmount = (planId) => {
    switch(planId) {
      case 'seller': return 149
      case 'landlord': return 199
      case 'dual': return 298
      default: return 0
    }
  }

  // Check if user is already active (for test users like reduss)
  const isUserActive = () => {
    // Check if user email is test user
    if (user?.email === 'reduss@gmail.com' || user?.username === 'reduss') {
      return true
    }
    return false
  }

  const plans = [
    {
      id: 'seller',
      name: 'Seller Plan',
      price: 149,
      description: 'Perfect for selling properties',
      icon: Shield,
      features: [
        'Up to 10 active listings',
        'Professional property photos',
        'Virtual tour integration',
        'Priority customer support',
        'Market analytics'
      ],
      color: 'blue',
      bgColor: 'from-blue-500 to-blue-600',
      isActive: user?.seller_paid === true || user?.role_type === 'seller' || user?.role_type === 'dual' || isUserActive() || false
    },
    {
      id: 'landlord',
      name: 'Landlord Plan',
      price: 199,
      description: 'Ideal for rental properties',
      icon: Home,
      features: [
        'Up to 20 rental listings',
        'Tenant management system',
        'Rent collection tools',
        '24/7 priority support',
        'Maintenance request system'
      ],
      color: 'green',
      bgColor: 'from-green-500 to-green-600',
      isActive: user?.landlord_paid === true || user?.role_type === 'landlord' || user?.role_type === 'dual' || isUserActive() || false
    },
    {
      id: 'dual',
      name: 'Dual Plan',
      price: 298,
      description: 'Complete solution for professionals',
      icon: Crown,
      features: [
        'Unlimited listings (sale & rent)',
        'Advanced analytics dashboard',
        'Dedicated account manager',
        'API access',
        'Featured listings',
        'Priority support 24/7'
      ],
      color: 'purple',
      bgColor: 'from-purple-500 to-purple-600',
      isActive: (user?.seller_paid === true && user?.landlord_paid === true) || user?.role_type === 'dual' || isUserActive() || false
    }
  ]

  return (
    <div className="bg-white rounded-2xl shadow-sm border p-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Subscription Plans</h2>
        <p className="text-gray-500 mt-1">Choose the perfect plan for your real estate needs</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const Icon = plan.icon
          const isActive = plan.isActive
          
          return (
            <div 
              key={plan.id} 
              className={`relative rounded-xl border overflow-hidden transition-all duration-300 ${
                isActive 
                  ? 'ring-2 ring-green-500 shadow-lg transform scale-[1.02]' 
                  : 'hover:shadow-lg hover:scale-[1.01]'
              }`}
            >
              {isActive && (
                <div className="absolute top-0 right-0 bg-green-500 text-white px-3 py-1 text-xs font-semibold rounded-bl-lg z-10">
                  <CheckCircle className="w-3 h-3 inline mr-1" />
                  Active
                </div>
              )}
              
              {/* Card Header */}
              <div className={`bg-gradient-to-r ${plan.bgColor} p-6 text-white`}>
                <Icon className="w-10 h-10 mb-3 opacity-90" />
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <p className="text-3xl font-bold mt-2">
                  ${plan.price}
                  <span className="text-sm font-normal">/month</span>
                </p>
                <p className="text-sm opacity-80 mt-1">{plan.description}</p>
              </div>
              
              {/* Features List */}
              <div className="p-6">
                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                
                {/* Action Button */}
                {!isActive ? (
                  <button 
                    onClick={() => handleSubscribe(plan.id)}
                    className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02]"
                  >
                    Subscribe Now
                  </button>
                ) : (
                  <button 
                    disabled 
                    className="w-full py-2.5 bg-gray-100 text-gray-500 rounded-lg cursor-not-allowed"
                  >
                    Current Plan
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal 
          planType={selectedPlan} 
          amount={getPlanAmount(selectedPlan)}
          onClose={() => setShowPaymentModal(false)} 
          onSuccess={handlePaymentSuccess} 
        />
      )}
    </div>
  )
}

export default SubscriptionManager