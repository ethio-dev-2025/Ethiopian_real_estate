import React from 'react'
import { Navigate } from 'react-router-dom'

const AdminRoute = ({ children }) => {
  const token = localStorage.getItem('access_token')
  const userData = localStorage.getItem('user')
  
  // Check if token exists
  if (!token) {
    return <Navigate to="/login" replace />
  }
  
  // Check if user data exists and user is admin
  if (userData) {
    try {
      const user = JSON.parse(userData)
      if (user.role_type === 'admin') {
        return children
      }
    } catch (e) {
      console.error('Error parsing user data', e)
    }
  }
  
  // Not admin, redirect to home page
  return <Navigate to="/" replace />
}

export default AdminRoute