// src/components/layout/StaticSidebar.jsx
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { 
  Building2, User, LogOut, Settings, 
  PlusCircle, List, Home, Shield, CreditCard,
  Star, Clock, Heart, MessageSquare, Bell
} from 'lucide-react'

const StaticSidebar = ({ activeMenuItem, sidebarOpen, setSidebarOpen }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const goToDashboard = () => navigate('/dashboard')
  const goToMessages = () => navigate('/messages')
  const goToCreateListing = () => navigate('/create-listing')
  const goToAddProperty = () => navigate('/add-property')
  const goToMyListings = () => navigate('/dashboard')
  const goToMyProperty = () => navigate('/dashboard')

  const isSellerVerified = user?.seller_approved && user?.seller_paid
  const isLandlordVerified = user?.landlord_approved && user?.landlord_paid

  return (
    <div className="fixed top-0 left-0 z-40 h-screen w-64 bg-gradient-to-b from-gray-900 to-gray-800 text-white overflow-y-auto">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <Building2 className="w-8 h-8 text-blue-400" />
            <div>
              <span className="text-xl font-bold">RealEstate Pro</span>
              <p className="text-xs text-gray-400">Unified Dashboard</p>
            </div>
          </div>
        </div>

        {/* SIDEBAR MENU - STATIC */}
        <div className="flex-1 overflow-y-auto p-4">
          
          {/* SELLER ACCOUNT */}
          <div className="mb-6">
            <div className="px-4 py-2">
              <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">SELLER ACCOUNT</p>
            </div>
            <button 
              onClick={goToCreateListing} 
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all mb-1 ${
                activeMenuItem === 'create-listing'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <PlusCircle className="w-5 h-5" />
              <span className="flex-1 text-left">Create Listing</span>
              {!isSellerVerified && <span className="text-xs text-yellow-400">(Verify)</span>}
            </button>
            <button 
              onClick={goToMyListings} 
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-gray-700 transition-all"
            >
              <List className="w-5 h-5" />
              <span className="flex-1 text-left">My Listings</span>
            </button>
          </div>

          {/* LANDLORD ACCOUNT */}
          <div className="mb-6">
            <div className="px-4 py-2">
              <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">LANDLORD ACCOUNT</p>
            </div>
            <button 
              onClick={goToAddProperty} 
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all mb-1 ${
                activeMenuItem === 'add-property'
                  ? 'bg-gradient-to-r from-green-600 to-teal-600 text-white shadow-lg'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <PlusCircle className="w-5 h-5" />
              <span className="flex-1 text-left">Add Property</span>
              {!isLandlordVerified && <span className="text-xs text-yellow-400">(Verify)</span>}
            </button>
            <button 
              onClick={goToMyProperty} 
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-gray-700 transition-all"
            >
              <Home className="w-5 h-5" />
              <span className="flex-1 text-left">My Property</span>
            </button>
          </div>

          {/* ACTIVITY */}
          <div className="mb-6">
            <div className="px-4 py-2">
              <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">ACTIVITY</p>
            </div>
            <button 
              onClick={goToMessages} 
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all mb-1 ${
                activeMenuItem === 'messages'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <MessageSquare className="w-5 h-5" />
              <span className="flex-1 text-left">Messages</span>
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">3</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-gray-700 transition-all">
              <Bell className="w-5 h-5" />
              <span className="flex-1 text-left">Notifications</span>
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">5</span>
            </button>
          </div>

          {/* SAVED */}
          <div className="mb-6">
            <div className="px-4 py-2">
              <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">SAVED</p>
            </div>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-gray-700 transition-all mb-1">
              <Clock className="w-5 h-5" />
              <span className="flex-1 text-left">Recent</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-gray-700 transition-all">
              <Heart className="w-5 h-5" />
              <span className="flex-1 text-left">Saved</span>
            </button>
          </div>

          {/* MANAGEMENT */}
          <div className="mb-6">
            <div className="px-4 py-2">
              <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">MANAGEMENT</p>
            </div>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-gray-700 transition-all mb-1">
              <Shield className="w-5 h-5" />
              <span className="flex-1 text-left">Verification</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-gray-700 transition-all mb-1">
              <CreditCard className="w-5 h-5" />
              <span className="flex-1 text-left">Subscription</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-gray-700 transition-all">
              <Star className="w-5 h-5" />
              <span className="flex-1 text-left">Reviews</span>
            </button>
          </div>

          {/* ACCOUNT */}
          <div className="mb-6">
            <div className="px-4 py-2">
              <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">ACCOUNT</p>
            </div>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-gray-700 transition-all">
              <Settings className="w-5 h-5" />
              <span className="flex-1 text-left">Settings</span>
            </button>
          </div>
        </div>

        {/* User Account at Bottom */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center gap-3 px-4 py-3 mb-3 rounded-xl bg-gray-800">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">{user?.full_name || user?.username}</p>
              <p className="text-xs text-gray-400 capitalize">{user?.role_type || 'User'} Account</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-red-600 hover:text-white transition-all">
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default StaticSidebar