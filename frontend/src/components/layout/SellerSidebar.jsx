// src/components/layout/SellerSidebar.jsx
import React, { useState, useEffect, memo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, PlusCircle, List, Building2, MessageSquare,
  Shield, CreditCard, Settings, LogOut, Menu, X, ChevronRight, Camera
} from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = 'http://localhost:8000';

const SellerSidebar = memo(({ sidebarOpen, setSidebarOpen }) => {
  const { user, logout, refreshUser, updateUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [profileImage, setProfileImage] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    const fetchUnreadCount = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch('http://localhost:8000/api/messages/unread-count', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setUnreadCount(data.count || 0);
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

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { id: 'create-listing', label: 'Create Listing', icon: PlusCircle, path: '/create-listing' },
    { id: 'my-listings', label: 'My Listings', icon: List, path: '/listings' },
    { id: 'my-properties', label: 'My Properties', icon: Building2, path: '/properties' },
    { id: 'messages', label: 'Messages', icon: MessageSquare, path: '/messages', badge: unreadCount },
    { id: 'activation', label: 'Activation', icon: Shield, path: '/activation' },
    { id: 'subscription', label: 'Subscription', icon: CreditCard, path: '/subscription' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' }
  ];

  const handleNavigation = (path) => {
    navigate(path);
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

  // FIXED: Determine correct status based on user.can_create_listings and user.is_activated
  const getUserStatus = () => {
    // Check if user is fully activated (both documents and payment approved)
    if (user?.can_create_listings === true && user?.is_activated === true && user?.payment_approved === true) {
      return { text: 'Active', color: 'green', dotColor: 'bg-green-500' };
    }
    // Check if user is at payment pending stage
    if (user?.payment_approved === false && user?.is_activated === false) {
      return { text: 'Pending', color: 'yellow', dotColor: 'bg-yellow-500' };
    }
    // Default pending
    return { text: 'Pending', color: 'yellow', dotColor: 'bg-yellow-500' };
  };

  const status = getUserStatus();

  const getProfileImageUrl = () => {
    if (!profileImage) return null;
    return profileImage;
  };

  const profileImageUrl = getProfileImageUrl();

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
          </nav>

          {/* User Info with Profile Picture */}
          <div className="p-4 pt-0 pb-5">
            <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-gray-800/50">
              {/* Profile Picture with Upload */}
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
                {/* Camera icon on hover */}
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
                    <span className={`text-xs text-${status.color}-400`}>
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