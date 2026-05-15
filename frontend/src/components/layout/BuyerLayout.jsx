import React, { useState } from 'react'
import BuyerSidebar from './BuyerSidebar'

const BuyerLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="min-h-screen bg-gray-50">
      <BuyerSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      <div className={`transition-all duration-300 min-h-screen ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        {/* STATIC HEADER - Removed Welcome text from right corner */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white sticky top-0 z-10 shadow-md">
          <div className="px-6 py-5">
            <div>
              <h1 className="text-2xl font-bold">Find Your Dream Home</h1>
              <p className="text-blue-100 text-sm mt-1">Discover the best properties in Ethiopia</p>
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

export default BuyerLayout