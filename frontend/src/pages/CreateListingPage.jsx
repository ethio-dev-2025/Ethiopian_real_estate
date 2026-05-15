import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AppSidebar from '../components/layout/AppSidebar'
import CreateListingWizard from '../components/wizard/CreateListingWizard'
import { Shield, CreditCard, Loader } from 'lucide-react'

const API_URL = 'http://localhost:8000'

// Test users that bypass activation and subscription
const TEST_USERS = ['reduss@gmail.com', 'dani@gmail.com', 'test@example.com', 'reduss']

const CreateListingPage = () => {
  const navigate = useNavigate()
  const { user, refreshUser } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [loading, setLoading] = useState(false) // Start with false - NO SPINNER
  const [canProceed, setCanProceed] = useState(true) // Default to true
  const [needsActivation, setNeedsActivation] = useState(false)
  const [needsSubscription, setNeedsSubscription] = useState(false)
  
  const hasChecked = useRef(false)

  // Check if user is test user
  const isTestUser = () => {
    if (!user) return false
    return TEST_USERS.includes(user.email) || TEST_USERS.includes(user.username)
  }

  useEffect(() => {
    if (!hasChecked.current) {
      hasChecked.current = true
      // Check but don't show spinner
      checkAndProceed()
    }
  }, [user])

  const checkAndProceed = async () => {
    try {
      // Refresh user data in background
      await refreshUser()
      
      // Get fresh user from localStorage
      const storedUser = localStorage.getItem('user')
      let currentUser = user
      
      if (storedUser) {
        currentUser = JSON.parse(storedUser)
      }
      
      // Check if user is test user
      const isTest = TEST_USERS.includes(currentUser?.email) || TEST_USERS.includes(currentUser?.username)
      
      if (isTest) {
        setCanProceed(true)
        setNeedsActivation(false)
        setNeedsSubscription(false)
        return
      }
      
      // Check activation status
      const isActivated = currentUser?.is_activated === true || 
                          currentUser?.status === 'active' ||
                          currentUser?.role_type === 'seller' ||
                          currentUser?.role_type === 'landlord' ||
                          currentUser?.role_type === 'dual'
      
      // Check subscription/access status
      const hasAccess = isActivated && (
        currentUser?.has_active_subscription === true ||
        currentUser?.seller_enabled === true ||
        currentUser?.seller_approved === true ||
        currentUser?.landlord_enabled === true ||
        currentUser?.landlord_approved === true ||
        currentUser?.role_type === 'dual' ||
        currentUser?.role_type === 'seller' ||
        currentUser?.role_type === 'landlord' ||
        isTest
      )
      
      if (isActivated && hasAccess) {
        setCanProceed(true)
        setNeedsActivation(false)
        setNeedsSubscription(false)
      } else if (!isActivated) {
        setCanProceed(false)
        setNeedsActivation(true)
        setNeedsSubscription(false)
      } else {
        setCanProceed(false)
        setNeedsActivation(false)
        setNeedsSubscription(true)
      }
      
    } catch (error) {
      console.error('Error checking status:', error)
      setCanProceed(true) // Default to allow on error
      setNeedsActivation(false)
      setNeedsSubscription(false)
    }
  }
  
  // Show content immediately - NO SPINNER
  if (needsActivation) {
    return (
      <div className="min-h-screen bg-gray-100">
        <AppSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
          <div className="flex items-center justify-center min-h-[80vh] p-6">
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md">
              <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-10 h-10 text-yellow-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Not Activated</h2>
              <p className="text-gray-600 mb-6">Please activate your account to create listings.</p>
              <button
                onClick={() => navigate('/activation')}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg"
              >
                Activate Account
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (needsSubscription) {
    return (
      <div className="min-h-screen bg-gray-100">
        <AppSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
          <div className="flex items-center justify-center min-h-[80vh] p-6">
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-10 h-10 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Subscription Required</h2>
              <p className="text-gray-600 mb-6">Subscribe to a plan to start listing properties.</p>
              <button
                onClick={() => navigate('/subscription')}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg"
              >
                Subscribe Now
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Show content immediately - NO SPINNER
  return (
    <div className="min-h-screen bg-gray-100">
      <AppSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <main className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <div className="p-6">
          <CreateListingWizard />
        </div>
      </main>
    </div>
  )
}

export default CreateListingPage