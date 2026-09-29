// src/components/dashboard/admin/DashboardOverview.jsx
import React, { useState, useEffect } from 'react'
import { Users, Home, FileCheck, CreditCard, DollarSign, Clock, TrendingUp, Activity } from 'lucide-react'

const API_URL = 'http://localhost:8000'

const DashboardOverview = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeListings: 0,
    pendingVerifications: 0,
    pendingPayments: 0,
    totalRevenue: 0,
    userGrowth: 0,
    propertyGrowth: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
    const interval = setInterval(fetchDashboardData, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        setLoading(false)
        return
      }
      
      const statsRes = await fetch(`${API_URL}/api/admin/dashboard-stats`, { 
        headers: { 'Authorization': `Bearer ${token}` } 
      })
      
      if (statsRes.ok) {
        const data = await statsRes.json()
        setStats({
          totalUsers: data.total_users || 0,
          activeListings: data.active_properties || 0,
          pendingVerifications: data.pending_activations || 0,
          pendingPayments: data.pending_payments || 0,
          totalRevenue: data.total_revenue || 0,
          userGrowth: data.user_growth?.length ? data.user_growth[data.user_growth.length - 1]?.count || 0 : 0,
          propertyGrowth: 0
        })
      }
      
      const paymentsRes = await fetch(`${API_URL}/api/admin/real-payments?status=pending`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (paymentsRes.ok) {
        const payments = await paymentsRes.json()
        setStats(prev => ({ ...prev, pendingPayments: payments.length || 0 }))
      }
      
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
    return `ETB ${price.toLocaleString()}`
  }

  const StatCard = ({ title, value, icon: Icon, color, trend, onClick }) => (
    <div onClick={onClick} className="bg-white rounded-xl shadow-sm border border-border-light p-4 hover:shadow-md transition cursor-pointer hover:scale-[1.02] duration-300">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-text-muted truncate">{title}</p>
          <p className="text-2xl lg:text-3xl font-bold text-text-primary mt-1">{value !== undefined ? value.toLocaleString() : <span className="inline-block w-16 h-8 bg-gray-200 rounded animate-pulse"></span>}</p>
          {trend !== undefined && trend !== 0 && (
            <p className={`text-xs mt-1 flex items-center gap-1 ${trend > 0 ? 'text-success' : 'text-error'}`}>
              <TrendingUp className="w-3 h-3" /> {trend > 0 ? '+' : ''}{trend}% this month
            </p>
          )}
        </div>
        <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  )

  if (loading && stats.totalUsers === 0) {
    return (
      <div className="p-6">
        <div className="mb-6"><div className="h-8 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div><div className="h-4 bg-gray-200 rounded w-96 animate-pulse"></div></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1,2,3,4].map(i => <div key={i} className="bg-white rounded-xl shadow-sm border border-border-light p-5"><div className="flex justify-between"><div><div className="h-4 bg-gray-200 rounded w-24 mb-2 animate-pulse"></div><div className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div></div><div className="w-12 h-12 bg-gray-200 rounded-xl"></div></div></div>)}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard title="Total Users" value={stats.totalUsers} icon={Users} color="bg-primary-600" trend={stats.userGrowth} />
        <StatCard title="Active Listings" value={stats.activeListings} icon={Home} color="bg-success" trend={stats.propertyGrowth} />
        <StatCard title="Pending Verifications" value={stats.pendingVerifications} icon={Clock} color="bg-secondary-500" />
        <StatCard title="Pending Payments" value={stats.pendingPayments} icon={CreditCard} color="bg-warning" />
      </div>

      {/* Revenue Card */}
      <div className="bg-gradient-to-r from-primary-700 to-primary-800 rounded-xl shadow-lg p-6 text-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-primary-100 text-sm">Total Revenue</p>
            <p className="text-3xl lg:text-4xl font-bold mt-1 truncate">{formatPrice(stats.totalRevenue)}</p>
            <p className="text-primary-100 text-sm mt-1">From subscription payments</p>
          </div>
          <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <DollarSign className="w-7 h-7" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardOverview