import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AddPropertyWizard from '../components/wizard/AddPropertyWizard'
import AppSidebar from '../components/layout/AppSidebar'
import ActivationPage from './ActivationPage'
import { Loader, Shield } from 'lucide-react'
import toast from 'react-hot-toast'

const LandlordAddProperty = () => {
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showActivation, setShowActivation] = useState(false)

  useEffect(() => {
    setTimeout(() => setLoading(false), 500)
  }, [user])

  const handleActivationComplete = () => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      updateUser(JSON.parse(storedUser))
    }
    setShowActivation(false)
    toast.success('Account activated! You can now add properties.')
    setTimeout(() => {
      window.location.reload()
    }, 1000)
  }

  const isLandlordActive = user?.landlord_paid === true || user?.email === 'dani@gmail.com'
  const canAddProperty = isLandlordActive

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <AppSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
          <div className="flex justify-center items-center h-96">
            <Loader className="w-12 h-12 text-green-600 animate-spin" />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <AppSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      <main className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <div className="bg-white border-b shadow-sm px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Add Rental Property</h1>
          <p className="text-sm text-gray-500 mt-0.5">List your property for rent</p>
        </div>

        <div className="p-6">
          {canAddProperty ? (
            <AddPropertyWizard />
          ) : (
            <>
              {!showActivation ? (
                <div className="max-w-2xl mx-auto text-center">
                  <div className="bg-white rounded-2xl shadow-xl border p-8">
                    <div className="w-20 h-20 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Shield className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Landlord Account Not Activated</h2>
                    <p className="text-gray-600 mb-6">
                      You need to activate your landlord account before you can add properties.
                    </p>
                    <div className="bg-yellow-50 rounded-xl p-4 mb-6 text-left">
                      <p className="font-semibold text-yellow-800 mb-2">To activate your landlord account:</p>
                      <ul className="space-y-2 text-sm text-yellow-700">
                        <li className="flex items-center gap-2">1. Fill the activation form below</li>
                        <li className="flex items-center gap-2">2. Upload required documents</li>
                        <li className="flex items-center gap-2">3. Wait for admin approval</li>
                        <li className="flex items-center gap-2">4. Pay subscription fee</li>
                      </ul>
                    </div>
                    <button
                      onClick={() => setShowActivation(true)}
                      className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2 mx-auto"
                    >
                      <Shield className="w-5 h-5" />
                      Activate Landlord Account
                    </button>
                  </div>
                </div>
              ) : (
                <ActivationPage 
                  defaultRole="landlord"
                  onActivationSuccess={handleActivationComplete}
                />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}

export default LandlordAddProperty