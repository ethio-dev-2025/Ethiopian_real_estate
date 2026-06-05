import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, PlusCircle, List, Building2, MessageSquare,
  Shield, CreditCard, Settings, LogOut, Menu, X, ChevronRight, Camera,
  User, Lock, Bell, Monitor, ChevronDown
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '../../context/LanguageContext'

const API_URL = 'http://localhost:8000';

const SellerSidebar = ({ sidebarOpen, setSidebarOpen, isMobile }) => {
  const { user, logout, refreshUser, updateUser, forceRefreshUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [profileImage, setProfileImage] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isSettingsDropdownOpen, setIsSettingsDropdownOpen] = useState(false);
  const [liveStatus, setLiveStatus] = useState(null);
  const settingsButtonRef = useRef(null);
  const settingsDropdownRef = useRef(null);
  const fileInputRef = useRef(null);
  const intervalRef = useRef(null);
  const isMountedRef = useRef(true);
  const hasFetchedRef = useRef(false);

  const { t } = useLanguage()

  const settingsMenuItems = [
    { id: 'profile', labelKey: 'profile_information', label: 'Profile Information', icon: User, tab: 'profile' },
    { id: 'security', labelKey: 'security', label: 'Security', icon: Lock, tab: 'security' },
    { id: 'notifications', labelKey: 'notification_preferences', label: 'Notification Preferences', icon: Bell, tab: 'notifications' },
    { id: 'privacy', labelKey: 'privacy', label: 'Privacy', icon: Shield, tab: 'privacy' },
    { id: 'appearance', labelKey: 'appearance', label: 'Appearance', icon: Monitor, tab: 'appearance' }
  ];

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

  useEffect(() => {
    setIsSettingsDropdownOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleUnreadUpdate = (event) => {
      if (event.detail?.count !== undefined) {
        console.log('📬 Sidebar received unread update:', event.detail.count);
        setTotalUnreadCount(event.detail.count);
      }
    };
    
    window.addEventListener('seller_unread_update', handleUnreadUpdate);
    
    const savedCount = localStorage.getItem('seller_unread_count');
    if (savedCount) {
      setTotalUnreadCount(parseInt(savedCount));
    }
    
    return () => {
      window.removeEventListener('seller_unread_update', handleUnreadUpdate);
    };
  }, []);

  const fetchUnreadCount = async () => {
    if (hasFetchedRef.current) return;
    
    const token = localStorage.getItem('access_token');
    if (!token) return;
    
    hasFetchedRef.current = true;
    
    try {
      const response = await fetch(`${API_URL}/api/messages/unread-count`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok && isMountedRef.current) {
        const data = await response.json();
        setTotalUnreadCount(data.unread_count || data.count || 0);
        localStorage.setItem('seller_unread_count', data.unread_count || data.count || 0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const fetchLiveActivationStatus = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    
    try {
      const response = await fetch(`${API_URL}/api/activation/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const statusData = await response.json();
        console.log('📊 Sidebar - Live Status:', statusData);
        setLiveStatus(statusData);
      }
    } catch (error) {
      console.error('Error fetching activation status:', error);
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    
    const timer = setTimeout(() => {
      fetchUnreadCount();
      fetchLiveActivationStatus();
    }, 1000);
    
    intervalRef.current = setInterval(() => {
      fetchLiveActivationStatus();
    }, 10000);
    
    return () => {
      clearTimeout(timer);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      isMountedRef.current = false;
    };
  }, []);

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
    setImageError(false);
  }, [user?.avatar_url]);

  const getUserName = () => {
    if (!user) return 'Seller';
    if (user.full_name && user.full_name !== 'vvvvv' && user.full_name !== 'vvvvvvv' && user.full_name.trim() !== '') {
      return user.full_name;
    }
    if (user.username && user.username !== 'vvvvv' && user.username !== 'vvvvvvv' && user.username.trim() !== '') {
      return user.username;
    }
    if (user.email) {
      const emailName = user.email.split('@')[0];
      if (emailName && emailName !== 'vvvvv' && emailName !== 'vvvvvvv' && emailName.trim() !== '') {
        return emailName;
      }
    }
    return 'Seller';
  };

  const getUserInitial = () => {
    const name = getUserName();
    if (name && name !== 'Seller') {
      return name.charAt(0).toUpperCase();
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'S';
  };

  const getRoleDisplay = () => {
    const role = user?.role_type;
    if (role === 'dual') return 'Seller & Landlord';
    if (role === 'seller') return 'Seller';
    if (role === 'landlord') return 'Landlord';
    return 'Seller';
  };

  // FIXED: NO HARDCODED DAYS - only use real subscription end date
  const getDaysRemaining = () => {
    if (user?.subscription_end_date) {
      const end = new Date(user.subscription_end_date);
      const now = new Date();
      const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
      return diff > 0 ? diff : 0;
    }
    if (liveStatus?.days_remaining !== undefined) {
      return liveStatus.days_remaining > 0 ? liveStatus.days_remaining : 0;
    }
    return 0;
  };

  const daysRemaining = getDaysRemaining();

  // FIXED: Get user status based ONLY on real API data
  const getUserStatus = () => {
    // First check liveStatus from API (most reliable)
    if (liveStatus) {
      // Only active if can_create_listings is true AND days_remaining > 0
      if (liveStatus.can_create_listings === true && (liveStatus.days_remaining || 0) > 0) {
        return { text: 'Active', color: 'green', dotColor: 'bg-green-500' };
      }
      if (liveStatus.status === 'payment_pending') {
        return { text: 'Payment Pending', color: 'yellow', dotColor: 'bg-yellow-500' };
      }
      if (liveStatus.status === 'documents_pending') {
        return { text: 'Pending Approval', color: 'red', dotColor: 'bg-red-500' };
      }
      if (liveStatus.status === 'documents_approved') {
        return { text: 'Payment Required', color: 'yellow', dotColor: 'bg-yellow-500' };
      }
      if (liveStatus.status === 'subscription_expired') {
        return { text: 'Payment Required', color: 'yellow', dotColor: 'bg-yellow-500' };
      }
      if (liveStatus.status === 'not_submitted') {
        return { text: 'Pending Approval', color: 'red', dotColor: 'bg-red-500' };
      }
      return { text: 'Pending', color: 'yellow', dotColor: 'bg-yellow-500' };
    }
    
    // Check user object if liveStatus not available
    if (user?.role_type === 'admin') {
      return { text: 'Active', color: 'green', dotColor: 'bg-green-500' };
    }

    // Only active if has_active_subscription AND subscription_end_date is in future
    if ((user?.has_active_subscription === true || user?.can_create_listings === true) && daysRemaining > 0) {
      return { text: 'Active', color: 'green', dotColor: 'bg-green-500' };
    }

    if (user?.is_activated === true && user?.payment_approved === true && daysRemaining > 0) {
      return { text: 'Active', color: 'green', dotColor: 'bg-green-500' };
    }

    if (user?.is_activated === true && user?.payment_approved === false) {
      return { text: 'Payment Pending', color: 'yellow', dotColor: 'bg-yellow-500' };
    }

    return { text: 'Pending Approval', color: 'red', dotColor: 'bg-red-500' };
  };

  const status = getUserStatus();

  const toggleDropdown = (e) => {
    e.stopPropagation();
    setIsSettingsDropdownOpen(!isSettingsDropdownOpen);
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', labelKey: 'dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { id: 'create-listing', label: 'Create Listing', labelKey: 'create_listing', icon: PlusCircle, path: '/dashboard/create-listing' },
    { id: 'my-listings', label: 'My Listings', labelKey: 'my_listings', icon: List, path: '/dashboard/listings' },
    { id: 'messages', label: 'Messages', labelKey: 'messages', icon: MessageSquare, path: '/dashboard/messages', badge: totalUnreadCount },
    { id: 'activation', label: 'Activation', labelKey: 'activation', icon: Shield, path: '/dashboard/activation' },
    { id: 'subscription', label: 'Subscription', labelKey: 'subscription', icon: CreditCard, path: '/dashboard/subscription' }
  ];

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) setSidebarOpen(false);
    setIsSettingsDropdownOpen(false);
  };

  const handleSettingsNavigation = (tab) => {
    navigate(`/dashboard/settings?tab=${tab}`);
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

  return (
    <>
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      <aside className={`fixed top-0 left-0 z-40 h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white transition-all duration-300 shadow-xl
        ${sidebarOpen ? 'w-64' : 'w-20'} 
        ${isMobile && !sidebarOpen ? '-translate-x-full' : 'translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          <div className="p-5 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleNavigation('/dashboard')}>
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                {sidebarOpen && (
                  <div className="overflow-hidden">
                    <span className="text-xl font-bold tracking-tight block">EstateHub</span>
                    <p className="text-xs text-slate-400">Seller Portal</p>
                  </div>
                )}
              </div>
              {!isMobile && (
                <button 
                  onClick={() => setSidebarOpen(!sidebarOpen)} 
                  className="p-2 rounded-lg hover:bg-white/10 transition-all hidden md:block"
                >
                  {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              )}
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto p-3 space-y-1 mt-4">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              const hasBadge = item.badge && item.badge > 0;
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.path)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 relative group
                    ${isActive 
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {sidebarOpen && (
                    <>
                      <span className="flex-1 text-left text-sm font-medium">
                        {t(item.labelKey) || item.label}
                      </span>
                      {hasBadge && (
                        <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5 min-w-5 text-center shadow-md animate-pulse">
                          {item.badge > 99 ? '99+' : item.badge}
                        </span>
                      )}
                      {isActive && <ChevronRight className="w-4 h-4 opacity-70" />}
                    </>
                  )}
                  {!sidebarOpen && hasBadge && (
                    <span className="absolute top-1 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  )}
                </button>
              );
            })}

            <div className="relative">
              <button
                ref={settingsButtonRef}
                onClick={toggleDropdown}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-150
                  ${location.pathname === '/dashboard/settings'
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
              
              {sidebarOpen && isSettingsDropdownOpen && (
                <div 
                  ref={settingsDropdownRef}
                  className="absolute left-3 right-3 top-full mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50"
                >
                  {settingsMenuItems.map((item) => {
                    const Icon = item.icon;
                    const currentTab = new URLSearchParams(location.search).get('tab') || 'profile';
                    const isActive = location.pathname === '/dashboard/settings' && currentTab === item.tab;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSettingsNavigation(item.tab)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 transition text-left
                          ${isActive 
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm">{t(item.labelKey) || item.label}</span>
                        {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>

          <div className="p-4 pt-0 pb-5 mt-auto">
            <div className={`flex items-center ${sidebarOpen ? 'gap-3' : 'flex-col gap-2'}`}>
              <div className="relative group">
                <div 
                  className={`${sidebarOpen ? 'w-10 h-10' : 'w-10 h-10'} rounded-full overflow-hidden bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-md flex-shrink-0 cursor-pointer`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {profileImage && !imageError ? (
                    <img
                      src={profileImage}
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
              
              {sidebarOpen && (
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{getUserName()}</p>
                  <p className="text-xs text-slate-400 truncate">{getRoleDisplay()}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <div className={`w-2 h-2 ${status.dotColor} rounded-full animate-pulse`}></div>
                    <span className={`text-xs ${status.color === 'green' ? 'text-green-400' : status.color === 'yellow' ? 'text-yellow-400' : 'text-red-400'}`}>
                      {status.text}
                    </span>
                  </div>
                  {daysRemaining > 0 && status.text === 'Active' && (
                    <div className="text-xs text-green-400 mt-1">
                      {daysRemaining} days left
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="p-4 border-t border-white/10">
            <button 
              onClick={handleLogout} 
              className="w-full flex items-center justify-center gap-3 px-3 py-2.5 rounded-xl text-slate-300 hover:bg-red-600 hover:text-white transition-all duration-150"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span className="text-sm font-medium">Logout</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default SellerSidebar;