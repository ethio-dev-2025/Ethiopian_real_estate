// src/components/dashboard/admin/AdminDashboard.jsx
import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import AdminLayout from '../../layout/AdminLayout'
import DashboardOverview from './DashboardOverview'
import UserManagement from './UserManagement'
import VerificationQueue from './VerificationQueue'
import PaymentApprovals from './PaymentApprovals'
import ReportsAnalytics from './ReportsAnalytics'
import AdminSettings from './AdminSettings'
import AdminMessages from './AdminMessages'

const AdminDashboard = () => {
  // Check if user is admin
  const userData = localStorage.getItem('user')
  if (userData) {
    try {
      const user = JSON.parse(userData)
      if (user.role_type !== 'admin') {
        window.location.href = '/'
        return null
      }
    } catch (e) {
      window.location.href = '/login'
      return null
    }
  } else {
    window.location.href = '/login'
    return null
  }

  return (
    <AdminLayout>
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
    </AdminLayout>
  )
}

export default AdminDashboard