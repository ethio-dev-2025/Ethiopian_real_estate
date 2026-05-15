import React, { useState, useEffect, lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import AdminSidebar from './AdminSidebar'
import { Loader } from 'lucide-react'

// Lazy load components
const DashboardOverview = lazy(() => import('./DashboardOverview'))
const UserManagement = lazy(() => import('./UserManagement'))
const VerificationQueue = lazy(() => import('./VerificationQueue'))
const PaymentApprovals = lazy(() => import('./PaymentApprovals'))
const ReportsAnalytics = lazy(() => import('./ReportsAnalytics'))
const AdminSettings = lazy(() => import('./AdminSettings'))
const AdminMessages = lazy(() => import('./AdminMessages'))

const PageLoader = () => (
  <div className="flex justify-center items-center h-64">
    <Loader className="w-8 h-8 animate-spin text-blue-600" />
  </div>
)

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
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
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
        <Suspense fallback={<PageLoader />}>
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
        </Suspense>
      </main>
    </div>
  )
}

export default AdminDashboard