import React, { useState } from 'react'
import AppSidebar from '../components/layout/AppSidebar'
import MessagesPage from '../components/messages/MessagesPage'

const MessagesWrapper = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="min-h-screen bg-gray-100">
      <AppSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <main className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <div className="h-screen">
          <MessagesPage />
        </div>
      </main>
    </div>
  )
}

export default MessagesWrapper