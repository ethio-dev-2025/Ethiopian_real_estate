import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth()
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }
  
  if (!isAuthenticated) {
    return children
  }
  
  // If authenticated, redirect based on role
  if (user?.role_type === 'admin') {
    return <Navigate to="/admin" replace />
  }
  return <Navigate to="/dashboard" replace />
}

export default PublicRoute
