// src/components/dashboard/admin/AdminDashboard.jsx
import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import AdminLayout from '../../layout/AdminLayout'
import DashboardOverview from './DashboardOverview'
import UserManagement from './UserManagement'
import VerificationQueue from './VerificationQueue'
import PaymentHistory from './PaymentHistory'  // Changed from PaymentApprovals to PaymentHistory
import ReportsAnalytics from './ReportsAnalytics'
import AdminSettings from './AdminSettings'
import AdminMessages from './AdminMessages'
import { useNotification } from '../../../context/NotificationContext'

const API_URL = 'http://localhost:8000'

const AdminDashboard = () => {
  const { showInfo } = useNotification()
  const [lastPaymentCount, setLastPaymentCount] = useState(() => {
    const saved = localStorage.getItem('lastPaymentCount');
    return saved ? parseInt(saved) : 0;
  })

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

  const arePaymentNotificationsEnabled = () => {
    const settings = localStorage.getItem('admin_notifications');
    if (settings) {
      try {
        const parsed = JSON.parse(settings);
        return parsed.payment_notifications !== false;
      } catch (e) {
        return true;
      }
    }
    return true;
  };

  useEffect(() => {
    let isMounted = true;
    let intervalId = null;

    const checkNewPayments = async () => {
      try {
        const token = localStorage.getItem('access_token')
        if (!token) return

        const response = await fetch(`${API_URL}/api/payment/admin/payments?status=pending`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })

        if (response.ok) {
          const payments = await response.json()
          const currentCount = Array.isArray(payments) ? payments.length : 0
          
          if (lastPaymentCount > 0 && currentCount > lastPaymentCount) {
            const newPaymentsCount = currentCount - lastPaymentCount
            const notificationsEnabled = arePaymentNotificationsEnabled()
            
            if (notificationsEnabled) {
              showInfo(`💰 ${newPaymentsCount} new payment(s) received!`, 'payment')
            }
          }
          
          if (isMounted) {
            setLastPaymentCount(currentCount)
            localStorage.setItem('lastPaymentCount', currentCount.toString())
          }
          
          localStorage.setItem('pendingPaymentsCount', currentCount.toString())
          window.dispatchEvent(new Event('payment-updated'))
        }
      } catch (error) {
        console.error('Error checking payments:', error)
      }
    }

    const initialTimeout = setTimeout(() => {
      if (isMounted) checkNewPayments()
    }, 2000)
    
    intervalId = setInterval(() => {
      if (isMounted) checkNewPayments()
    }, 30000)
    
    return () => {
      isMounted = false
      clearTimeout(initialTimeout)
      if (intervalId) clearInterval(intervalId)
    }
  }, [lastPaymentCount, showInfo])

  return (
    <AdminLayout>
      <Routes>
        <Route path="/" element={<DashboardOverview />} />
        <Route path="/users" element={<UserManagement />} />
        <Route path="/verification-queue" element={<VerificationQueue />} />
        <Route path="/payment-approvals" element={<PaymentHistory />} />  {/* Changed component to PaymentHistory */}
        <Route path="/reports" element={<ReportsAnalytics />} />
        <Route path="/messages" element={<AdminMessages />} />
        <Route path="/settings" element={<AdminSettings />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </AdminLayout>
  )
}

export default AdminDashboard