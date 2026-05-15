import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AppSidebar from '../components/layout/AppSidebar'
import SubscriptionManager from '../components/dashboard/user/SubscriptionManager'

const SubscriptionPage = () => {
  const { user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = React.useState(true)

  const handleSubscriptionUpdated = async () => {
    // Refresh user data after subscription
    const token = localStorage.getItem('access_token')
    const response = await fetch('http://localhost:8000/api/auth/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (response.ok) {
      const userData = await response.json()
      localStorage.setItem('user', JSON.stringify(userData))
      window.location.reload()
    }
  }
  
  return (
    <div className="min-h-screen bg-gray-100">
      <AppSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <main className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <div className="p-6">
          <div className="max-w-6xl mx-auto">
            <SubscriptionManager user={user} onSubscriptionUpdated={handleSubscriptionUpdated} />
          </div>
        </div>
      </main>
    </div>
  )
}

export default SubscriptionPage