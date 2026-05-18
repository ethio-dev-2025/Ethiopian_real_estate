// src/components/dashboard/admin/DashboardOverview.jsx
import React, { useState, useEffect } from 'react'
import { 
  Users, Home, FileCheck, CreditCard, 
  DollarSign, Clock, Activity, RefreshCw
} from 'lucide-react'

const API_URL = 'http://localhost:8000'

const DashboardOverview = () => {
  const [stats, setStats] = useState({
    totalUsers: null,
    activeListings: null,
    pendingVerifications: null,
    totalRevenue: null,
    monthlyGrowth: 0,
    userGrowth: 0,
    propertyGrowth: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('access_token')
      
      if (!token) {
        setLoading(false)
        return
      }
      
      let usersData = { total: 0, growth: 0 }
      let listingsData = { active: 0, growth: 0 }
      let verificationsData = { pending: 0 }
      let revenueData = { total: 0, growth: 0 }
      
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
      
      setStats({
        totalUsers: usersData.total ?? 0,
        activeListings: listingsData.active ?? 0,
        pendingVerifications: verificationsData.pending ?? 0,
        totalRevenue: revenueData.total ?? 0,
        monthlyGrowth: revenueData.growth ?? 0,
        userGrowth: usersData.growth ?? 0,
        propertyGrowth: listingsData.growth ?? 0
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
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

  // Show skeleton with actual structure - content appears immediately
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-500">Welcome to your admin dashboard</p>
      </div>

      {/* Stats Grid - Only stats cards, no Quick Actions or Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border p-6 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Users</p>
              <p className="text-3xl font-bold text-gray-900">
                {stats.totalUsers !== null ? stats.totalUsers.toLocaleString() : 
                  <span className="inline-block w-16 h-8 bg-gray-200 rounded animate-pulse"></span>}
              </p>
              {stats.userGrowth > 0 && (
                <p className="text-xs text-green-600 mt-1">↑ {stats.userGrowth}% this month</p>
              )}
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
              <p className="text-3xl font-bold text-gray-900">
                {stats.activeListings !== null ? stats.activeListings.toLocaleString() : 
                  <span className="inline-block w-16 h-8 bg-gray-200 rounded animate-pulse"></span>}
              </p>
              {stats.propertyGrowth > 0 && (
                <p className="text-xs text-green-600 mt-1">↑ {stats.propertyGrowth}% this month</p>
              )}
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
              <p className="text-3xl font-bold text-orange-600">
                {stats.pendingVerifications !== null ? stats.pendingVerifications.toLocaleString() : 
                  <span className="inline-block w-16 h-8 bg-gray-200 rounded animate-pulse"></span>}
              </p>
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
              <p className="text-3xl font-bold text-purple-600">
                {stats.totalRevenue !== null ? `ETB ${formatPrice(stats.totalRevenue)}` : 
                  <span className="inline-block w-24 h-8 bg-gray-200 rounded animate-pulse"></span>}
              </p>
              {stats.monthlyGrowth > 0 && (
                <p className="text-xs text-green-600 mt-1">↑ {stats.monthlyGrowth}% this month</p>
              )}
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardOverview