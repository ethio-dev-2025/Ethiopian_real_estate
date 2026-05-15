import React, { useState, useEffect } from 'react'
import { 
  Users, Home, FileCheck, CreditCard, TrendingUp, Eye, 
  DollarSign, Clock, CheckCircle, AlertCircle, PlusCircle,
  List, Bell, Activity, Shield, Award, Target, Zap,
  Building2, Key, UserCheck, Wallet, HelpCircle, Calendar,
  ArrowUp, ArrowDown, MoreVertical, Download, RefreshCw,
  Loader
} from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

const API_URL = 'http://localhost:8000'

const DashboardOverview = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeListings: 0,
    pendingVerifications: 0,
    totalRevenue: 0,
    monthlyGrowth: 0,
    userGrowth: 0,
    propertyGrowth: 0,
    satisfactionRate: 0
  })
  const [loading, setLoading] = useState(true)
  const [recentActivities, setRecentActivities] = useState([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('access_token')
      
      if (!token) {
        setLoading(false)
        return
      }
      
      // Fetch data with fallbacks
      let usersData = { total: 0, growth: 0 }
      let listingsData = { active: 0, growth: 0 }
      let verificationsData = { pending: 0 }
      let revenueData = { total: 0, growth: 0 }
      let activitiesData = []
      
      try {
        const usersRes = await fetch(`${API_URL}/api/admin/stats/users`, { 
          headers: { 'Authorization': `Bearer ${token}` } 
        })
        if (usersRes.ok) usersData = await usersRes.json()
      } catch (e) {}
      
      try {
        const listingsRes = await fetch(`${API_URL}/api/admin/stats/listings`, { 
          headers: { 'Authorization': `Bearer ${token}` } 
        })
        if (listingsRes.ok) listingsData = await listingsRes.json()
      } catch (e) {}
      
      try {
        const verificationsRes = await fetch(`${API_URL}/api/admin/stats/verifications`, { 
          headers: { 'Authorization': `Bearer ${token}` } 
        })
        if (verificationsRes.ok) verificationsData = await verificationsRes.json()
      } catch (e) {}
      
      try {
        const revenueRes = await fetch(`${API_URL}/api/admin/stats/revenue`, { 
          headers: { 'Authorization': `Bearer ${token}` } 
        })
        if (revenueRes.ok) revenueData = await revenueRes.json()
      } catch (e) {}
      
      try {
        const activitiesRes = await fetch(`${API_URL}/api/admin/recent-activities`, { 
          headers: { 'Authorization': `Bearer ${token}` } 
        })
        if (activitiesRes.ok) activitiesData = await activitiesRes.json()
      } catch (e) {}
      
      setStats({
        totalUsers: usersData.total || 0,
        activeListings: listingsData.active || 0,
        pendingVerifications: verificationsData.pending || 0,
        totalRevenue: revenueData.total || 0,
        monthlyGrowth: revenueData.growth || 0,
        userGrowth: usersData.growth || 0,
        propertyGrowth: listingsData.growth || 0,
        satisfactionRate: 94.5
      })
      
      setRecentActivities(Array.isArray(activitiesData) ? activitiesData : [
        { id: 1, user: 'Samuel Girma', action: 'New property listed', time: '2 minutes ago', icon: 'Home' },
        { id: 2, user: 'Martha Tadele', action: 'Account verification requested', time: '1 hour ago', icon: 'FileCheck' },
        { id: 3, user: 'Tekle Berhan', action: 'Payment completed', time: '3 hours ago', icon: 'CreditCard' }
      ])
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      // Set default values
      setStats({
        totalUsers: 0,
        activeListings: 0,
        pendingVerifications: 0,
        totalRevenue: 0,
        monthlyGrowth: 0,
        userGrowth: 0,
        propertyGrowth: 0,
        satisfactionRate: 94.5
      })
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price) => {
    if (!price) return 'ETB 0'
    if (price >= 10000000) return `${(price / 10000000).toFixed(1)} Cr`
    if (price >= 1000000) return `${(price / 1000000).toFixed(1)} M`
    return price.toLocaleString()
  }

  const getIcon = (iconName) => {
    switch(iconName) {
      case 'Home': return <Home className="w-5 h-5 text-green-600" />
      case 'FileCheck': return <FileCheck className="w-5 h-5 text-orange-600" />
      case 'CreditCard': return <CreditCard className="w-5 h-5 text-purple-600" />
      default: return <Users className="w-5 h-5 text-blue-600" />
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center h-64">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-500">Welcome to your admin dashboard</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-sm border p-6 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Users</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
              <p className="text-xs text-green-600 mt-1">↑ {stats.userGrowth}% this month</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border p-6 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Listings</p>
              <p className="text-3xl font-bold text-gray-900">{stats.activeListings}</p>
              <p className="text-xs text-green-600 mt-1">↑ {stats.propertyGrowth}% this month</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Home className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border p-6 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending Verifications</p>
              <p className="text-3xl font-bold text-orange-600">{stats.pendingVerifications}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border p-6 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-3xl font-bold text-purple-600">ETB {formatPrice(stats.totalRevenue)}</p>
              <p className="text-xs text-green-600 mt-1">↑ {stats.monthlyGrowth}% this month</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl shadow-sm border p-6 mb-8">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-500" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link to="/users" className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition group">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-blue-900">Manage Users</p>
              <p className="text-sm text-blue-600">View and manage all users</p>
            </div>
          </Link>
          <Link to="/verification-queue" className="flex items-center gap-3 p-4 bg-green-50 rounded-xl hover:bg-green-100 transition group">
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
              <FileCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-green-900">Verification Queue</p>
              <p className="text-sm text-green-600">Review pending verifications</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl shadow-sm border">
        <div className="p-5 border-b flex justify-between items-center">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            Recent Activity
          </h3>
          <button onClick={fetchDashboardData} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        <div className="divide-y max-h-96 overflow-y-auto">
          {recentActivities.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <Activity className="w-12 h-12 mx-auto mb-3" />
              <p>No recent activity</p>
            </div>
          ) : (
            recentActivities.map(activity => (
              <div key={activity.id} className="p-4 flex items-center gap-3 hover:bg-gray-50">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                  {getIcon(activity.icon)}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{activity.user}</p>
                  <p className="text-sm text-gray-500">{activity.action}</p>
                </div>
                <p className="text-xs text-gray-400">{activity.time}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default DashboardOverview