// src/components/layout/BuyerSidebar.jsx
import React, { useState, useEffect, memo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Home, Search, Heart, MessageCircle, Settings, LogOut, Menu, X, ChevronRight, Building2, Bell, Camera,
  User, Lock, Shield, Monitor, ChevronDown
} from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = 'http://localhost:8000';

const BuyerSidebar = memo(({ sidebarOpen, setSidebarOpen }) => {
  const { user, logout, refreshUser, updateUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [profileImage, setProfileImage] = useState(null);
  const [imageError, setImageError] = useState(false);
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

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    const fetchUnreadCount = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) return;
        const response = await fetch('http://localhost:8000/api/buyer/conversations', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const conversations = await response.json();
          const total = conversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);
          setUnreadCount(total);
        }
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };
    
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      clearInterval(interval);
    };
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

  // Main menu items
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/dashboard/buyer' },
    { id: 'properties', label: 'Browse Properties', icon: Search, path: '/dashboard/buyer/properties' },
    { id: 'saved', label: 'Saved Properties', icon: Heart, path: '/dashboard/buyer/saved' },
    { id: 'messages', label: 'Messages', icon: MessageCircle, path: '/dashboard/buyer/messages', badge: unreadCount }
  ];

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) setSidebarOpen(false);
  };

  // Handle settings dropdown navigation
  const handleSettingsNavigation = (tab) => {
    navigate(`/dashboard/buyer/settings?tab=${tab}`);
    setIsSettingsDropdownOpen(false);
    if (isMobile) setSidebarOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const getUserName = () => {
    if (user?.full_name) return user.full_name;
    if (user?.username) return user.username;
    return 'Buyer';
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
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const profileImageUrl = profileImage;
  
  // Get current tab from URL params
  const getCurrentTab = () => {
    const params = new URLSearchParams(location.search);
    return params.get('tab') || 'profile';
  };
  
  const currentTab = getCurrentTab();
  const isSettingsActive = location.pathname === '/dashboard/buyer/settings';

  // Toggle dropdown - prevent event propagation
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
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleNavigation('/dashboard/buyer')}>
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                {sidebarOpen && (
                  <div>
                    <span className="text-xl font-bold tracking-tight">EstateHub</span>
                    <p className="text-xs text-slate-400">Buyer Portal</p>
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
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' 
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
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' 
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
              
              {/* Dropdown Menu - Opens downward */}
              {sidebarOpen && isSettingsDropdownOpen && (
                <div 
                  ref={settingsDropdownRef}
                  className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50"
                >
                  {settingsMenuItems.map((item) => {
                    const Icon = item.icon;
                    // Check if this specific tab is active
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

          {/* Bottom Section - User Profile with Picture */}
          <div className="p-4 border-t border-white/10">
            {sidebarOpen ? (
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="relative group">
                    <div 
                      className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 cursor-pointer"
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
                        <span className="text-white text-xs font-medium">
                          {getUserName().charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                         onClick={() => fileInputRef.current?.click()}>
                      <Camera className="w-3 h-3 text-white" />
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{getUserName()}</p>
                    <p className="text-xs text-slate-400 truncate">Buyer Account</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg text-slate-400 hover:bg-red-600 hover:text-white transition-all duration-150"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="relative group">
                  <div 
                    className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center cursor-pointer"
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
                      <span className="text-white text-sm font-medium">
                        {getUserName().charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                       onClick={() => fileInputRef.current?.click()}>
                    <Camera className="w-3 h-3 text-white" />
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex justify-center p-2 rounded-lg text-slate-400 hover:bg-red-600 hover:text-white transition-all duration-150"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
});

BuyerSidebar.displayName = 'BuyerSidebar';

export default BuyerSidebar;