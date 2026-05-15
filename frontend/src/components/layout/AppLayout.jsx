import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import AppSidebar from './AppSidebar'

const AppLayout = ({ children }) => {
  const { user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  console.log('AppLayout - User:', user)

  return (
    <div className="min-h-screen bg-gray-100">
      <AppSidebar 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen}
      />
      <main className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        {children}
      </main>
    </div>
  )
}

export default AppLayout