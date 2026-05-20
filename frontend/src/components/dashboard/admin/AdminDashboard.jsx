// src/components/dashboard/admin/AdminDashboard.jsx
import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import AdminSidebar from './AdminSidebar'
import DashboardOverview from './DashboardOverview'
import UserManagement from './UserManagement'
import VerificationQueue from './VerificationQueue'
import PaymentApprovals from './PaymentApprovals'
import ReportsAnalytics from './ReportsAnalytics'
import AdminSettings from './AdminSettings'
import AdminMessages from './AdminMessages'

const AdminDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      try {
        const user = JSON.parse(userData)
        if (user.role_type === 'admin') {
          setIsAdmin(true)
        } else {
          window.location.href = '/'
          return
        }
      } catch (e) {
        console.error('Error parsing user data', e)
        window.location.href = '/login'
        return
      }
    } else {
      window.location.href = '/login'
      return
    }
    
    const savedState = localStorage.getItem('admin_sidebar_open')
    if (savedState !== null) {
      setSidebarOpen(savedState === 'true')
    }
    
    setLoading(false)
  }, [])

  if (loading) {
    return <div className="min-h-screen bg-gray-100"></div>
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminSidebar 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
        unreadCount={unreadCount}
      />
      
      <main className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <Routes>
          <Route path="/" element={<DashboardOverview />} />
          <Route path="/users" element={<UserManagement />} />
          <Route path="/verification-queue" element={<VerificationQueue />} />
          <Route path="/payment-approvals" element={<PaymentApprovals />} />
          <Route path="/reports" element={<ReportsAnalytics />} />
          <Route path="/messages" element={<AdminMessages />} />
          <Route path="/settings" element={<AdminSettings />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default AdminDashboard