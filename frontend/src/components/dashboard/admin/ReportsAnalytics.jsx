import React, { useState, useEffect, useCallback, useRef } from 'react'
import { 
  Users, Home, DollarSign, TrendingUp, Calendar, BarChart3, PieChart, 
  ArrowUp, ArrowDown, RefreshCw, Eye, Building2, CreditCard, UserCheck, 
  Clock, CheckCircle, XCircle, Activity, Zap, Award, Target, Globe,
  Sparkles, Shield, Star, Wallet, Landmark, Briefcase, MapPin,
  FileText, Headphones, Store
} from 'lucide-react'
import toast from 'react-hot-toast'

const API_URL = 'http://localhost:8000'

const ReportsAnalytics = () => {
  const [reports, setReports] = useState({
    user_registrations: [],
    property_stats: {
      total: 0,
      for_sale: 0,
      for_rent: 0,
      active: 0,
      pending: 0,
      draft: 0
    },
    revenue_stats: {
      total: 0,
      this_month: 0,
      last_month: 0
    }
  })
  const [userStats, setUserStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    suspended: 0,
    verified: 0,
    growth: []
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [hoveredCard, setHoveredCard] = useState(null)
  const abortControllerRef = useRef(null)

  const fetchReports = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    const abortController = new AbortController()
    abortControllerRef.current = abortController
    
    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        toast.error('Authentication required')
        return
      }
      
      const [reportsResponse, userStatsResponse, revenueResponse, listingsResponse] = await Promise.allSettled([
        fetch(`${API_URL}/api/admin/reports`, {
          headers: { 'Authorization': `Bearer ${token}` },
          signal: abortController.signal
        }),
        fetch(`${API_URL}/api/admin/stats/users`, {
          headers: { 'Authorization': `Bearer ${token}` },
          signal: abortController.signal
        }),
        fetch(`${API_URL}/api/admin/stats/revenue`, {
          headers: { 'Authorization': `Bearer ${token}` },
          signal: abortController.signal
        }),
        fetch(`${API_URL}/api/admin/stats/listings`, {
          headers: { 'Authorization': `Bearer ${token}` },
          signal: abortController.signal
        })
      ])
      
      if (reportsResponse.status === 'fulfilled' && reportsResponse.value.ok) {
        const data = await reportsResponse.value.json()
        setReports(data)
      }
      
      if (userStatsResponse.status === 'fulfilled' && userStatsResponse.value.ok) {
        const data = await userStatsResponse.value.json()
        setUserStats(data)
      }
      
      if (revenueResponse.status === 'fulfilled' && revenueResponse.value.ok) {
        const revenueData = await revenueResponse.value.json()
        setReports(prev => ({
          ...prev,
          revenue_stats: {
            total: revenueData.total || 0,
            this_month: revenueData.this_month || 0,
            last_month: revenueData.last_month || 0,
            trend: revenueData.trend || []
          }
        }))
      }
      
      if (listingsResponse.status === 'fulfilled' && listingsResponse.value.ok) {
        const listingsData = await listingsResponse.value.json()
        setReports(prev => ({
          ...prev,
          property_stats: {
            total: listingsData.total || 0,
            for_sale: listingsData.for_sale || 0,
            for_rent: listingsData.for_rent || 0,
            active: listingsData.active || 0,
            pending: listingsData.pending || 0,
            draft: listingsData.draft || 0,
            by_property_type: listingsData.by_property_type || {}
          }
        }))
      }
      
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error fetching reports:', error)
        toast.error('Failed to load reports')
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchReports()
    const interval = setInterval(fetchReports, 60000)
    return () => {
      clearInterval(interval)
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [fetchReports])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchReports()
    toast.success('📊 Reports refreshed successfully!')
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0)
  }

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num || 0)
  }

  const statsCards = [
    { 
      title: 'Total Users', 
      value: userStats.total || 0, 
      icon: Users, 
      gradient: 'from-blue-500 to-blue-600',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      detail: `${userStats.active || 0} active users`
    },
    { 
      title: 'Total Properties', 
      value: reports.property_stats?.total || 0, 
      icon: Home, 
      gradient: 'from-purple-500 to-purple-600',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      detail: `${reports.property_stats?.active || 0} active listings`
    },
    { 
      title: 'Total Revenue', 
      value: formatCurrency(reports.revenue_stats?.total || 0), 
      icon: DollarSign, 
      gradient: 'from-emerald-500 to-emerald-600',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      detail: `This month: ${formatCurrency(reports.revenue_stats?.this_month || 0)}`
    },
  ]

  const additionalStats = [
    { title: 'Verified Users', value: userStats.verified || 0, icon: Shield, color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
    { title: 'Pending Users', value: userStats.pending || 0, icon: Clock, color: 'text-amber-600', bgColor: 'bg-amber-100' },
    { title: 'Suspended Users', value: userStats.suspended || 0, icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-100' },
    { title: 'Properties for Sale', value: reports.property_stats?.for_sale || 0, icon: TrendingUp, color: 'text-green-600', bgColor: 'bg-green-100' },
    { title: 'Properties for Rent', value: reports.property_stats?.for_rent || 0, icon: Home, color: 'text-blue-600', bgColor: 'bg-blue-100' },
    { title: 'Pending Listings', value: reports.property_stats?.pending || 0, icon: Clock, color: 'text-orange-600', bgColor: 'bg-orange-100' },
  ]

  const propertyDistribution = [
    { label: 'Properties for Sale', value: reports.property_stats?.for_sale || 0, color: 'bg-gradient-to-r from-green-500 to-emerald-500', icon: TrendingUp },
    { label: 'Properties for Rent', value: reports.property_stats?.for_rent || 0, color: 'bg-gradient-to-r from-blue-500 to-cyan-500', icon: Home },
    { label: 'Active Properties', value: reports.property_stats?.active || 0, color: 'bg-gradient-to-r from-emerald-500 to-teal-500', icon: CheckCircle },
    { label: 'Pending Properties', value: reports.property_stats?.pending || 0, color: 'bg-gradient-to-r from-amber-500 to-orange-500', icon: Clock },
    { label: 'Draft Properties', value: reports.property_stats?.draft || 0, color: 'bg-gradient-to-r from-gray-500 to-slate-500', icon: FileText },
  ]

  const totalForDistribution = reports.property_stats?.total || 1
  const chartData = userStats.growth?.length > 0 ? userStats.growth : reports.user_registrations || []
  const maxRegistration = Math.max(...(chartData.map(r => r.count || r.registrations || 0)), 1)

  if (loading && chartData.length === 0) {
    return (
      <div className="p-8 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
        <div className="mb-8">
          <div className="h-10 bg-gray-200 rounded-xl w-64 mb-3 animate-pulse"></div>
          <div className="h-5 bg-gray-200 rounded-xl w-96 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl shadow-lg p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded-lg w-32 mb-4"></div>
              <div className="h-10 bg-gray-200 rounded-lg w-40"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 bg-gradient-to-br from-gray-50 via-white to-gray-50 min-h-screen">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Reports & Analytics
              </h1>
            </div>
            <p className="text-gray-500 ml-14">Real-time platform performance insights and analytics</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="group px-5 py-2.5 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-all duration-300 flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-gray-500 group-hover:rotate-180 transition-transform duration-500 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium text-gray-600">{refreshing ? 'Refreshing...' : 'Refresh Data'}</span>
          </button>
        </div>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon
          const isHovered = hoveredCard === index
          return (
            <div
              key={index}
              className="relative group cursor-pointer"
              onMouseEnter={() => setHoveredCard(index)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className={`absolute inset-0 bg-gradient-to-r ${stat.gradient} rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity duration-500`}></div>
              <div className={`relative bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}>
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl ${stat.iconBg} group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</h3>
                <p className="text-sm text-gray-500 mb-2">{stat.title}</p>
                <p className="text-xs text-gray-400">{stat.detail}</p>
                <div className="mt-4 h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full w-0 bg-gradient-to-r ${stat.gradient} rounded-full transition-all duration-1000 ${isHovered ? 'w-full' : 'w-3/4'}`}></div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {additionalStats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div
              key={index}
              className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className={`p-2 rounded-lg ${stat.bgColor} group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className={`w-4 h-4 ${stat.color}`} />
                </div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{stat.title}</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(stat.value)}</p>
              <div className="mt-2 w-full bg-gray-100 rounded-full h-1">
                <div className={`h-full w-0 ${stat.bgColor} rounded-full transition-all duration-700 group-hover:w-full`}></div>
              </div>
            </div>
          )
        })}
      </div>

      {/* User Growth Chart */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8 hover:shadow-xl transition-all duration-300">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              User Growth Over Time
            </h2>
            <p className="text-sm text-gray-500 mt-1">Monthly user registration trends</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-xs text-gray-500">New Users</span>
            </div>
            <div className="px-3 py-1 bg-gray-100 rounded-lg">
              <span className="text-xs text-gray-500">Last 6 months</span>
            </div>
          </div>
        </div>
        <div className="h-80 flex items-end gap-4">
          {chartData.length > 0 ? (
            chartData.map((item, idx) => {
              const count = item.count || item.registrations || 0
              const month = item.month || ''
              const height = (count / maxRegistration) * 250
              return (
                <div key={idx} className="flex-1 flex flex-col items-center group">
                  <div className="relative w-full">
                    <div 
                      className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-xl transition-all duration-500 hover:from-blue-600 hover:to-blue-500 cursor-pointer relative overflow-hidden"
                      style={{ height: `${height}px` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                    </div>
                    <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap shadow-lg">
                      📊 {count} new users
                    </div>
                  </div>
                  <p className="text-xs font-medium text-gray-600 mt-3">{month}</p>
                  <p className="text-xs font-bold text-gray-800 mt-1">{formatNumber(count)}</p>
                </div>
              )
            })
          ) : (
            <div className="w-full text-center text-gray-400 py-12">
              <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No registration data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Property Distribution and Platform Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Property Distribution */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <PieChart className="w-5 h-5 text-purple-600" />
                </div>
                Property Distribution
              </h2>
              <p className="text-sm text-gray-500 mt-1">Breakdown by property status</p>
            </div>
          </div>
          <div className="space-y-5">
            {propertyDistribution.map((item, idx) => {
              const Icon = item.icon
              const percentage = totalForDistribution > 0 ? (item.value / totalForDistribution) * 100 : 0
              return (
                <div key={idx} className="group">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-600">{item.label}</span>
                    </div>
                    <div className="flex gap-3">
                      <span className="text-sm font-bold text-gray-900">{formatNumber(item.value)}</span>
                      <span className="text-xs text-gray-400">({percentage.toFixed(1)}%)</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`${item.color} rounded-full h-2 transition-all duration-700 ease-out group-hover:opacity-80`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Platform Overview */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Activity className="w-5 h-5 text-green-600" />
                </div>
                Platform Overview
              </h2>
              <p className="text-sm text-gray-500 mt-1">Key metrics at a glance</p>
            </div>
          </div>
          <div className="space-y-3">
            {[
              { icon: Users, label: 'Total Users', value: userStats.total || 0, color: 'text-blue-600', bg: 'bg-blue-50' },
              { icon: Shield, label: 'Verified Users', value: userStats.verified || 0, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { icon: Home, label: 'Properties for Sale', value: reports.property_stats?.for_sale || 0, color: 'text-green-600', bg: 'bg-green-50' },
              { icon: Building2, label: 'Properties for Rent', value: reports.property_stats?.for_rent || 0, color: 'text-purple-600', bg: 'bg-purple-50' },
              { icon: CheckCircle, label: 'Active Properties', value: reports.property_stats?.active || 0, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { icon: Clock, label: 'Pending Properties', value: reports.property_stats?.pending || 0, color: 'text-amber-600', bg: 'bg-amber-50' },
              { icon: DollarSign, label: 'Total Revenue', value: formatCurrency(reports.revenue_stats?.total || 0), color: 'text-green-600', bg: 'bg-green-50' },
            ].map((item, idx) => {
              const Icon = item.icon
              return (
                <div key={idx} className="flex justify-between items-center py-3 px-4 rounded-xl hover:bg-gray-50 transition-all duration-300 group">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${item.bg} group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className={`w-4 h-4 ${item.color}`} />
                    </div>
                    <span className="text-sm text-gray-600">{item.label}</span>
                  </div>
                  <span className="font-bold text-gray-900 text-lg">{item.value}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Property Type Breakdown */}
      {reports.property_stats?.by_property_type && Object.keys(reports.property_stats.by_property_type).length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Building2 className="w-5 h-5 text-indigo-600" />
                </div>
                Property Type Breakdown
              </h2>
              <p className="text-sm text-gray-500 mt-1">Distribution by property category</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.entries(reports.property_stats.by_property_type).map(([type, count], idx) => {
              const gradients = [
                'from-rose-500 to-pink-500',
                'from-violet-500 to-purple-500',
                'from-indigo-500 to-blue-500',
                'from-amber-500 to-orange-500',
                'from-emerald-500 to-teal-500',
                'from-cyan-500 to-sky-500'
              ]
              const gradient = gradients[idx % gradients.length]
              return (
                <div key={type} className="relative group cursor-pointer">
                  <div className={`absolute inset-0 bg-gradient-to-r ${gradient} rounded-xl blur-md opacity-0 group-hover:opacity-30 transition-opacity duration-500`}></div>
                  <div className="relative bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 text-center border border-gray-100 group-hover:border-transparent transition-all duration-300">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-r bg-gray-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Building2 className="w-6 h-6 text-gray-600" />
                    </div>
                    <p className="text-xs font-medium text-gray-500 capitalize mb-1">{type}</p>
                    <p className="text-2xl font-bold text-gray-900">{formatNumber(count)}</p>
                    <div className="mt-2 w-full bg-gray-100 rounded-full h-1">
                      <div className={`h-full w-0 bg-gradient-to-r ${gradient} rounded-full transition-all duration-700 group-hover:w-full`}></div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-gray-100">
          <Activity className="w-3 h-3 text-green-500 animate-pulse" />
          <span className="text-xs text-gray-500">Live Data • Last updated: {new Date().toLocaleString()}</span>
        </div>
      </div>
    </div>
  )
}

export default ReportsAnalytics