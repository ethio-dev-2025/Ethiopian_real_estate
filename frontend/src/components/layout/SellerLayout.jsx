// src/components/layout/SellerLayout.jsx
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import SellerSidebar from './SellerSidebar';

const SellerLayout = ({ children }) => {
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
    if (path === '/dashboard') return 'Dashboard';
    if (path.includes('/create-listing')) return 'Create Listing';
    if (path.includes('/listings')) return 'My Listings';
    if (path.includes('/messages')) return 'Messages';
    if (path.includes('/activation')) return 'Activation';
    if (path.includes('/subscription')) return 'Subscription';
    if (path.includes('/settings')) return 'Settings';
    return 'Dashboard';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SellerSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      <div className={`transition-all duration-300 min-h-screen ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white sticky top-0 z-10 shadow-md">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-bold">{getPageTitle()}</h1>
            <p className="text-blue-100 text-sm mt-1">Welcome to your seller dashboard</p>
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

export default SellerLayout;