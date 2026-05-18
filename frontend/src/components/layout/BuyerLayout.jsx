// src/components/layout/BuyerLayout.jsx
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import BuyerSidebar from './BuyerSidebar';

const BuyerLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/properties')) return 'Browse Properties';
    if (path.includes('/saved')) return 'Saved Properties';
    if (path.includes('/messages')) return 'Messages';
    if (path.includes('/settings')) return 'Settings';
    return 'Dashboard';
  };

  // Always show buyer dashboard header for all buyer routes
  return (
    <div className="min-h-screen bg-gray-50">
      <BuyerSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      <div className={`transition-all duration-300 min-h-screen ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        {/* Buyer Dashboard Header - Always show for all buyer routes */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white sticky top-0 z-10 shadow-md">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-bold">{getPageTitle()}</h1>
            <p className="text-blue-100 text-sm mt-1">Welcome to your buyer dashboard</p>
          </div>
        </div>
        
        {/* Main Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default BuyerLayout;