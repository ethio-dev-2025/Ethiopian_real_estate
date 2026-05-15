import React from 'react'
import { Navigate } from 'react-router-dom'

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('access_token')
  const userRole = localStorage.getItem('user_role')
  
  // Check if token exists
  if (!token) {
    // Redirect based on where user came from or default to buyer login
    return <Navigate to="/buyer/login" replace />
  }
  
  return children
}

export default PrivateRoute