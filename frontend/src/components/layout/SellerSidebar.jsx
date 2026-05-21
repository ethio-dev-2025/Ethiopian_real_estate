// src/components/layout/SellerSidebar.jsx
import React, { useState, useEffect, memo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, PlusCircle, List, Building2, MessageSquare,
  Shield, CreditCard, Settings, LogOut, Menu, X, ChevronRight, Camera,
  User, Lock, Bell, Monitor, ChevronDown
} from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = 'http://localhost:8000';

const SellerSidebar = memo(({ sidebarOpen, setSidebarOpen }) => {
  const { user, logout, refreshUser, updateUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [profileImage, setProfileImage] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isSettingsDropdownOpen, setIsSettingsDropdownOpen] = useState(false);
  const settingsButtonRef = useRef(null);
  const settingsDropdownRef = useRef(null);
  const fileInputRef = useRef(null);

  // Settings dropdown menu items
  const settingsMenuItems = [
    { id: 'profile', label: 'Profile Information', icon: User, tab: 'profile' },
    { id: 'security', label: 'Security', icon: Lock, tab: 'security' },
    { id: 'notifications', label: 'Notifications', icon: Bell, tab: 'notifications' },
    { id: 'privacy', label: 'Privacy', icon: Shield, tab: 'privacy' },
    { id: 'appearance', label: 'Appearance', icon: Monitor, tab: 'appearance' }
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (settingsDropdownRef.current && 
          !settingsDropdownRef.current.contains(event.target) &&
          settingsButtonRef.current &&
          !settingsButtonRef.current.contains(event.target)) {
        setIsSettingsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown when route changes
  useEffect(() => {
    setIsSettingsDropdownOpen(false);
  }, [location.pathname]);

  // Check mobile screen
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch initial unread count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${API_URL}/api/messages/unread-count`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setTotalUnreadCount(data.count || 0);
        }
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };
    
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Load profile image from user context
  useEffect(() => {
    if (user?.avatar_url) {
      let imageUrl = user.avatar_url;
      if (imageUrl.startsWith('/uploads')) {
        imageUrl = `${API_URL}${imageUrl}`;
      }
      setProfileImage(imageUrl);
    } else {
      setProfileImage(null);
    }
  }, [user]);

  // Main menu items with correct paths
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { id: 'create-listing', label: 'Create Listing', icon: PlusCircle, path: '/create-listing' },
    { id: 'my-listings', label: 'My Listings', icon: List, path: '/listings' },
    { id: 'messages', label: 'Messages', icon: MessageSquare, path: '/messages', badge: totalUnreadCount },
    { id: 'activation', label: 'Activation', icon: Shield, path: '/activation' },
    { id: 'subscription', label: 'Subscription', icon: CreditCard, path: '/subscription' }
  ];

  const handleNavigation = (path) => {
    console.log('Navigating to:', path);
    navigate(path);
    if (isMobile) setSidebarOpen(false);
    setIsSettingsDropdownOpen(false);
  };

  const handleSettingsNavigation = (tab) => {
    navigate(`/settings?tab=${tab}`);
    setIsSettingsDropdownOpen(false);
    if (isMobile) setSidebarOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setUploading(true);
    const toastId = toast.loading('Uploading profile picture...');

    try {
      const token = localStorage.getItem('access_token');
      const formData = new FormData();
      formData.append('profile_picture', file);

      const response = await fetch(`${API_URL}/api/users/upload-profile-picture`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const newImageUrl = data.profile_picture_url;
        const fullImageUrl = newImageUrl.startsWith('http') ? newImageUrl : `${API_URL}${newImageUrl}`;
        setProfileImage(fullImageUrl);
        
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const updatedUser = { ...currentUser, avatar_url: newImageUrl };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        if (updateUser) {
          updateUser(updatedUser);
        }
        
        toast.success('Profile picture updated!', { id: toastId });
        await refreshUser();
      } else {
        toast.error(data.message || 'Failed to upload image', { id: toastId });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image', { id: toastId });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const getUserInitial = () => {
    if (user?.full_name) return user.full_name.charAt(0).toUpperCase();
    if (user?.username) return user.username.charAt(0).toUpperCase();
    return 'S';
  };

  const getUserName = () => {
    if (user?.full_name) return user.full_name;
    if (user?.username) return user.username;
    return 'Seller';
  };

  const getRoleDisplay = () => {
    const role = user?.role_type;
    if (role === 'dual') return 'Seller & Landlord';
    if (role === 'seller') return 'Seller';
    if (role === 'landlord') return 'Landlord';
    return 'Seller';
  };

  // Determine user status based on is_activated and payment_approved
  const getUserStatus = () => {
    // Admin is always active
    if (user?.role_type === 'admin') {
      return { text: 'Active', color: 'green', dotColor: 'bg-green-500' };
    }
    
    // Check activation and payment status
    if (user?.is_activated === true && user?.payment_approved === true && user?.can_create_listings === true) {
      return { text: 'Active', color: 'green', dotColor: 'bg-green-500' };
    }
    
    if (user?.is_activated === true && user?.payment_approved === false) {
      return { text: 'Payment Pending', color: 'yellow', dotColor: 'bg-yellow-500' };
    }
    
    if (user?.is_activated === false) {
      return { text: 'Pending Approval', color: 'red', dotColor: 'bg-red-500' };
    }
    
    return { text: 'Pending', color: 'yellow', dotColor: 'bg-yellow-500' };
  };

  const status = getUserStatus();
  const profileImageUrl = profileImage;

  // Check current tab from URL
  const getCurrentTab = () => {
    const params = new URLSearchParams(location.search);
    return params.get('tab') || 'profile';
  };
  
  const currentTab = getCurrentTab();
  const isSettingsActive = location.pathname === '/settings';

  const toggleDropdown = (e) => {
    e.stopPropagation();
    setIsSettingsDropdownOpen(!isSettingsDropdownOpen);
  };

  return (
    <>
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-20" onClick={() => setSidebarOpen(false)} />
      )}
      
      <aside className={`fixed top-0 left-0 z-40 h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'} ${isMobile && !sidebarOpen ? '-translate-x-full' : 'translate-x-0'}`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-5 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleNavigation('/dashboard')}>
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                {sidebarOpen && (
                  <div>
                    <span className="text-xl font-bold tracking-tight">EstateHub</span>
                    <p className="text-xs text-slate-400">Seller Portal</p>
                  </div>
                )}
              </div>
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg hover:bg-white/10 transition-all hidden md:block">
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-1 mt-4">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.path)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 ${
                    isActive 
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {sidebarOpen && (
                    <>
                      <span className="flex-1 text-left text-sm font-medium">{item.label}</span>
                      {item.badge > 0 && (
                        <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-5 text-center">
                          {item.badge > 99 ? '99+' : item.badge}
                        </span>
                      )}
                      {isActive && <ChevronRight className="w-4 h-4 opacity-70" />}
                    </>
                  )}
                  {!sidebarOpen && item.badge > 0 && (
                    <span className="absolute right-2 top-1 w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                </button>
              );
            })}

            {/* Settings Menu Item with Dropdown */}
            <div className="relative">
              <button
                ref={settingsButtonRef}
                onClick={toggleDropdown}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-150 ${
                  isSettingsActive 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Settings className="w-5 h-5 flex-shrink-0" />
                  {sidebarOpen && <span className="text-sm font-medium">Settings</span>}
                </div>
                {sidebarOpen && (
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isSettingsDropdownOpen ? 'rotate-180' : ''}`} />
                )}
              </button>
              
              {/* Dropdown Menu */}
              {sidebarOpen && isSettingsDropdownOpen && (
                <div 
                  ref={settingsDropdownRef}
                  className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50"
                >
                  {settingsMenuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = isSettingsActive && currentTab === item.tab;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSettingsNavigation(item.tab)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 transition ${
                          isActive 
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-sm">{item.label}</span>
                        {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>

          {/* User Info with Profile Picture and Status */}
          <div className="p-4 pt-0 pb-5">
            <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-gray-800/50">
              <div className="relative group">
                <div 
                  className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-md flex-shrink-0 cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {profileImageUrl && !imageError ? (
                    <img
                      src={profileImageUrl}
                      alt="Profile"
                      className="w-full h-full object-cover"
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <span className="text-white font-bold text-sm">{getUserInitial()}</span>
                  )}
                </div>
                {uploading && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                     onClick={() => fileInputRef.current?.click()}>
                  <Camera className="w-4 h-4 text-white" />
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
              
              {sidebarOpen && (
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{getUserName()}</p>
                  <p className="text-xs text-gray-400 truncate">{getRoleDisplay()}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <div className={`w-2 h-2 ${status.dotColor} rounded-full animate-pulse`}></div>
                    <span className={`text-xs ${status.color === 'green' ? 'text-green-400' : status.color === 'yellow' ? 'text-yellow-400' : 'text-red-400'}`}>
                      {status.text}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Logout Button */}
          <div className="p-4 border-t border-white/10">
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:bg-red-600 hover:text-white transition-all duration-150">
              <LogOut className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span className="text-sm font-medium">Logout</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
});

SellerSidebar.displayName = 'SellerSidebar';

export default SellerSidebar;