import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const RoleBasedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, loading, user } = useAuth()
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  if (!allowedRoles.includes(user?.role_type)) {
    return <Navigate to="/dashboard" replace />
  }
  
  return children
}

export default RoleBasedRoute
