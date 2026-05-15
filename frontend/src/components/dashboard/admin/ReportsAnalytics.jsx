import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Users, Home, DollarSign, TrendingUp, Calendar, BarChart3, PieChart, ArrowUp, ArrowDown } from 'lucide-react'
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
  const [loading, setLoading] = useState(true)
  const abortControllerRef = useRef(null)

  useEffect(() => {
    fetchReports()
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  const fetchReports = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    const abortController = new AbortController()
    abortControllerRef.current = abortController
    
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_URL}/api/admin/reports`, {
        headers: { 'Authorization': `Bearer ${token}` },
        signal: abortController.signal
      })
      
      if (!response.ok) throw new Error('Failed to fetch reports')
      
      const data = await response.json()
      setReports(data)
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error fetching reports:', error)
        toast.error('Failed to load reports')
      }
    } finally {
      setLoading(false)
    }
  }

  const statsCards = [
    { title: 'Total Users', value: reports.property_stats?.total || 0, icon: Users, color: 'bg-blue-500', change: '+12%', changeType: 'up' },
    { title: 'Total Properties', value: reports.property_stats?.total || 0, icon: Home, color: 'bg-purple-500', change: '+8%', changeType: 'up' },
    { title: 'Est. Revenue', value: `ETB ${(reports.revenue_stats?.total || 0).toLocaleString()}`, icon: DollarSign, color: 'bg-yellow-500', change: '+5%', changeType: 'up' },
  ]

  const propertyDistribution = [
    { label: 'Properties for Sale', value: reports.property_stats?.for_sale || 0, color: 'bg-green-500' },
    { label: 'Properties for Rent', value: reports.property_stats?.for_rent || 0, color: 'bg-blue-500' },
    { label: 'Active Properties', value: reports.property_stats?.active || 0, color: 'bg-emerald-500' },
    { label: 'Pending Properties', value: reports.property_stats?.pending || 0, color: 'bg-yellow-500' },
    { label: 'Draft Properties', value: reports.property_stats?.draft || 0, color: 'bg-gray-500' },
  ]

  const maxRegistration = Math.max(...(reports.user_registrations?.map(r => r.registrations) || [0]), 1)

  // No loading spinner - just show empty content while loading
  if (loading && reports.user_registrations.length === 0) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-500">Platform performance overview</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl shadow-sm border p-6">
              <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-32 mb-2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-gray-500">Platform performance overview</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="bg-white rounded-2xl shadow-sm border p-6 hover:shadow-md transition">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${stat.color} bg-opacity-10`}>
                  <Icon className={`w-6 h-6 ${stat.color.replace('bg-', 'text-')}`} />
                </div>
                {stat.change && (
                  <div className={`flex items-center gap-1 text-sm ${stat.changeType === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.changeType === 'up' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                    {stat.change}
                  </div>
                )}
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
              <p className="text-sm text-gray-500 mt-1">{stat.title}</p>
            </div>
          )
        })}
      </div>

      {/* User Registrations Chart */}
      <div className="bg-white rounded-2xl shadow-sm border p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Monthly User Registrations</h2>
          <TrendingUp className="w-5 h-5 text-green-500" />
        </div>
        <div className="h-64 flex items-end gap-4">
          {reports.user_registrations && reports.user_registrations.length > 0 ? (
            reports.user_registrations.map((item, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center group">
                <div className="relative w-full">
                  <div 
                    className="w-full bg-gradient-to-t from-blue-500 to-blue-600 rounded-t-lg transition-all duration-500 hover:from-blue-600 hover:to-blue-700 cursor-pointer"
                    style={{ height: `${(item.registrations / maxRegistration) * 200}px` }}
                  />
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                    {item.registrations} registrations
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">{item.month}</p>
                <p className="text-xs font-semibold text-gray-700">{item.registrations}</p>
              </div>
            ))
          ) : (
            <div className="w-full text-center text-gray-500 py-8">No registration data available</div>
          )}
        </div>
      </div>

      {/* Property Distribution and Platform Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Property Distribution */}
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Property Distribution</h2>
            <PieChart className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {propertyDistribution.map((item, idx) => {
              const total = reports.property_stats?.total || 1
              const percentage = total > 0 ? (item.value / total) * 100 : 0
              return (
                <div key={idx} className="group">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{item.label}</span>
                    <div className="flex gap-2">
                      <span className="font-semibold text-gray-900">{item.value}</span>
                      <span className="text-gray-400">({percentage.toFixed(1)}%)</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`${item.color} rounded-full h-2 transition-all duration-700 ease-out`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Platform Overview */}
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Platform Overview</h2>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b hover:bg-gray-50 px-2 rounded-lg transition">
              <span className="text-gray-600">Total Users</span>
              <span className="font-semibold text-blue-600 text-lg">{reports.property_stats?.total || 0}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b hover:bg-gray-50 px-2 rounded-lg transition">
              <span className="text-gray-600">Properties for Sale</span>
              <span className="font-semibold text-green-600 text-lg">{reports.property_stats?.for_sale || 0}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b hover:bg-gray-50 px-2 rounded-lg transition">
              <span className="text-gray-600">Properties for Rent</span>
              <span className="font-semibold text-purple-600 text-lg">{reports.property_stats?.for_rent || 0}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b hover:bg-gray-50 px-2 rounded-lg transition">
              <span className="text-gray-600">Active Properties</span>
              <span className="font-semibold text-emerald-600 text-lg">{reports.property_stats?.active || 0}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b hover:bg-gray-50 px-2 rounded-lg transition">
              <span className="text-gray-600">Pending Properties</span>
              <span className="font-semibold text-yellow-600 text-lg">{reports.property_stats?.pending || 0}</span>
            </div>
            <div className="flex justify-between items-center py-3 hover:bg-gray-50 px-2 rounded-lg transition">
              <span className="text-gray-600">Revenue (This Month)</span>
              <span className="font-semibold text-green-600 text-lg">ETB {(reports.revenue_stats?.this_month || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Refresh Button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={fetchReports}
          className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh Data
        </button>
      </div>
    </div>
  )
}

export default ReportsAnalytics