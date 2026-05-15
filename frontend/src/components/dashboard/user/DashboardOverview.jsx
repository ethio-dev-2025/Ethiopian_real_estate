import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { 
  Users, Home, DollarSign, Mail, TrendingUp, 
  CheckCircle, Clock, AlertCircle, ArrowUp,
  MessageCircle, List, Eye, Calendar, Bell,
  FileText, UserCheck, Building2, Activity
} from 'lucide-react'
import toast from 'react-hot-toast'

const API_URL = 'http://localhost:8000'

const DashboardOverview = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    user_stats: {},
    listing_stats: {},
    message_stats: {},
    pending_approvals: 0,
    recent_activity: { messages: [], listings: [] }
  })
  const [loading, setLoading] = useState(true)

  const getToken = () => localStorage.getItem('access_token')

  const fetchOverview = async () => {
    setLoading(true)
    try {
      const token = getToken()
      const response = await fetch(`${API_URL}/api/dashboard/overview`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.success) {
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching overview:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOverview()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold">Welcome back, {user?.full_name?.split(' ')[0] || user?.username || 'User'}!</h1>
        <p className="text-blue-100 mt-1">Here's what's happening with your account today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-xl shadow-sm border p-5 hover:shadow-md transition">
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-500">Your Role</p>
              <p className="text-2xl font-bold capitalize">{stats.user_stats?.your_role || 'User'}</p>
              <p className="text-xs text-green-600 mt-1">Active Account</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-5 hover:shadow-md transition">
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-500">Your Listings</p>
              <p className="text-2xl font-bold">{stats.listing_stats?.your_listings || 0}</p>
              <p className="text-xs text-green-600 mt-1">Total properties</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Home className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-5 hover:shadow-md transition">
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-500">Messages</p>
              <p className="text-2xl font-bold">{stats.message_stats?.unread || 0}</p>
              <p className="text-xs text-gray-500 mt-1">{stats.message_stats?.total || 0} total</p>
            </div>
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Mail className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-5 hover:shadow-md transition">
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-500">Platform Stats</p>
              <p className="text-2xl font-bold">{stats.listing_stats?.total_listings || 0}</p>
              <p className="text-xs text-green-600 mt-1">properties</p>
            </div>
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Second Row Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            Quick Stats
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500">Active Properties</p>
              <p className="text-xl font-bold text-green-600">{stats.listing_stats?.active_listings || 0}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-500">Platform Users</p>
              <p className="text-xl font-bold text-blue-600">{stats.user_stats?.total_users || 0}</p>
            </div>
            {stats.pending_approvals > 0 && (
              <div className="bg-yellow-50 rounded-lg p-3 text-center col-span-2">
                <p className="text-xs text-yellow-600">Pending Approvals</p>
                <p className="text-xl font-bold text-yellow-600">{stats.pending_approvals}</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-orange-600" />
            At a Glance
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Account Status</span>
              <span className={`px-2 py-1 rounded-full text-xs ${user?.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                {user?.status || 'Pending'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Email Verified</span>
              <span className={`px-2 py-1 rounded-full text-xs ${user?.is_verified ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {user?.is_verified ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Seller Status</span>
              <span className={`px-2 py-1 rounded-full text-xs ${user?.seller_approved ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                {user?.seller_approved ? 'Approved' : user?.seller_documents_submitted ? 'Pending' : 'Not Applied'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Landlord Status</span>
              <span className={`px-2 py-1 rounded-full text-xs ${user?.landlord_approved ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                {user?.landlord_approved ? 'Approved' : user?.landlord_documents_submitted ? 'Pending' : 'Not Applied'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
            <h3 className="font-semibold flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-blue-600" />
              Recent Messages
            </h3>
          </div>
          <div className="divide-y">
            {stats.recent_activity?.messages?.length > 0 ? (
              stats.recent_activity.messages.map((msg, idx) => (
                <div key={idx} className="p-4 hover:bg-gray-50">
                  <p className="text-sm text-gray-800">{msg.content}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    From: {msg.sender} • {new Date(msg.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">No recent messages</div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
            <h3 className="font-semibold flex items-center gap-2">
              <List className="w-5 h-5 text-green-600" />
              Recent Listings
            </h3>
          </div>
          <div className="divide-y">
            {stats.recent_activity?.listings?.length > 0 ? (
              stats.recent_activity.listings.map((listing, idx) => (
                <div key={idx} className="p-4 hover:bg-gray-50">
                  <p className="text-sm font-medium text-gray-800">{listing.title}</p>
                  <div className="flex justify-between items-center mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      listing.status === 'active' ? 'bg-green-100 text-green-700' :
                      listing.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {listing.status}
                    </span>
                    <span className="text-xs text-gray-400">{new Date(listing.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">No recent listings</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardOverview