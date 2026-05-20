// src/components/dashboard/common/Settings.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  User, Mail, Phone, Calendar, MapPin, Lock, 
  Shield, LogOut, Save, CheckCircle, AlertCircle,
  Camera, Trash2, Eye, EyeOff, Key, Bell,
  Monitor, Sun, Moon
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import toast from 'react-hot-toast';

const API_URL = 'http://localhost:8000';

const Settings = () => {
  const { user, logout, refreshUser, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const fileInputRef = useRef(null);

  // Password modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark';
  });

  // Profile Form Data
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    username: '',
    phone: '',
    date_of_birth: '',
    region_city: '',
    bio: '',
    address: ''
  });

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState({
    email_messages: true,
    push_messages: true
  });

  // Privacy Settings
  const [privacySettings, setPrivacySettings] = useState({
    profile_visibility: 'public',
    email_visibility: 'private',
    phone_visibility: 'private'
  });

  // Apply dark mode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Load user data with proper date formatting
  useEffect(() => {
    if (user) {
      // Format date_of_birth for input field (YYYY-MM-DD)
      let formattedDate = '';
      if (user.date_of_birth) {
        // If date is in DD/MM/YYYY format, convert to YYYY-MM-DD
        if (user.date_of_birth.includes('/')) {
          const parts = user.date_of_birth.split('/');
          if (parts.length === 3) {
            formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
          }
        } else {
          formattedDate = user.date_of_birth;
        }
      }
      
      setFormData({
        full_name: user.full_name || '',
        email: user.email || '',
        username: user.username || '',
        phone: user.phone || '',
        date_of_birth: formattedDate,
        region_city: user.city || user.region || '',
        bio: user.bio || '',
        address: user.address || ''
      });
      setProfileImage(user.avatar_url || null);
    }
  }, [user]);

  const getBioStrength = () => {
    const length = formData.bio.length;
    if (length >= 150) return { text: 'Excellent', color: 'green', percentage: 100 };
    if (length >= 100) return { text: 'Good', color: 'blue', percentage: 75 };
    if (length >= 50) return { text: 'Fair', color: 'yellow', percentage: 50 };
    return { text: 'Needs Improvement', color: 'red', percentage: 25 };
  };

  const bioStrength = getBioStrength();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getProfileImageUrl = () => {
    if (!profileImage) return null;
    if (profileImage.startsWith('http')) return profileImage;
    if (profileImage.startsWith('/uploads')) return `${API_URL}${profileImage}`;
    return `${API_URL}/uploads/${profileImage}`;
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
        setProfileImage(newImageUrl);
        
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const updatedUser = { ...currentUser, avatar_url: newImageUrl };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        if (updateUser) updateUser(updatedUser);
        
        toast.success('Profile picture updated!', { id: toastId });
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

  const handleRemoveImage = async () => {
    if (!window.confirm('Are you sure you want to remove your profile picture?')) return;

    setUploading(true);
    const toastId = toast.loading('Removing profile picture...');

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_URL}/api/users/remove-profile-picture`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setProfileImage(null);
        
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const updatedUser = { ...currentUser, avatar_url: null };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        if (updateUser) updateUser(updatedUser);
        
        toast.success('Profile picture removed', { id: toastId });
      } else {
        toast.error(data.message || 'Failed to remove image', { id: toastId });
      }
    } catch (error) {
      console.error('Remove error:', error);
      toast.error('Failed to remove image', { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  // Save function with date handling
  const handleSave = async () => {
    setLoading(true);
    const toastId = toast.loading('Saving profile...');

    try {
      const token = localStorage.getItem('access_token');
      
      const response = await fetch(`${API_URL}/api/users/update-profile-settings`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          full_name: formData.full_name,
          phone: formData.phone,
          date_of_birth: formData.date_of_birth,
          city: formData.region_city,
          address: formData.address,
          bio: formData.bio
        })
      });

      const data = await response.json();
      console.log('Save response:', data);

      if (response.ok && data.success) {
        if (data.user) {
          // Format date for display
          let savedDate = data.user.date_of_birth || '';
          
          setFormData(prev => ({
            ...prev,
            full_name: data.user.full_name || prev.full_name,
            phone: data.user.phone || prev.phone,
            date_of_birth: savedDate,
            region_city: data.user.city || prev.region_city,
            address: data.user.address || prev.address,
            bio: data.user.bio || prev.bio
          }));
          
          const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
          const updatedUser = { 
            ...currentUser, 
            full_name: data.user.full_name,
            phone: data.user.phone,
            date_of_birth: data.user.date_of_birth,
            city: data.user.city,
            address: data.user.address,
            bio: data.user.bio
          };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          
          if (updateUser) {
            updateUser(updatedUser);
          }
        }
        
        toast.success('Profile saved successfully!', { id: toastId });
      } else {
        toast.error(data.message || 'Failed to save', { id: toastId });
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save changes', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  // Password change function
  const handleChangePassword = async () => {
    setPasswordError('');
    setPasswordSuccess(false);
    
    const trimmedCurrent = currentPassword.trim();
    const trimmedNew = newPassword.trim();
    const trimmedConfirm = confirmPassword.trim();
    
    if (!trimmedCurrent) {
      setPasswordError('Current password is required');
      toast.error('Current password is required');
      return;
    }
    
    if (!trimmedNew) {
      setPasswordError('New password is required');
      toast.error('New password is required');
      return;
    }
    
    if (trimmedNew.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    if (trimmedNew !== trimmedConfirm) {
      setPasswordError('New passwords do not match');
      toast.error('New passwords do not match');
      return;
    }

    setChangingPassword(true);
    const toastId = toast.loading('Changing password...');

    try {
      const token = localStorage.getItem('access_token');
      
      const response = await fetch(`${API_URL}/api/users/change-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          current_password: trimmedCurrent,
          new_password: trimmedNew
        })
      });

      const data = await response.json();
      console.log('Password change response:', data);

      if (response.ok && data.success) {
        setPasswordSuccess(true);
        toast.success('Password changed successfully!', { id: toastId });
        
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        
        setTimeout(() => {
          setShowPasswordModal(false);
          setPasswordSuccess(false);
          setPasswordError('');
        }, 2000);
      } else {
        const errorMsg = data.message || data.detail || 'Failed to change password';
        toast.error(errorMsg, { id: toastId });
        setPasswordError(errorMsg);
      }
    } catch (error) {
      console.error('Password change error:', error);
      toast.error('Failed to change password. Please check your connection.', { id: toastId });
      setPasswordError('Network error. Please try again.');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleModalClose = () => {
    setShowPasswordModal(false);
    setPasswordError('');
    setPasswordSuccess(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    setTimeout(() => {
      window.location.href = '/login';
    }, 500);
  };

  const profileImageUrl = getProfileImageUrl();

  const menuItems = [
    { id: 'profile', label: 'Profile Information', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Lock },
    { id: 'appearance', label: 'Appearance', icon: Monitor }
  ];

  const PasswordModal = () => {
    if (!showPasswordModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl">
          <div className="p-6 border-b dark:border-gray-700 bg-gradient-to-r from-orange-500 to-amber-500 rounded-t-2xl">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Key className="w-5 h-5" />
                Change Password
              </h2>
              <button onClick={handleModalClose} className="p-1 hover:bg-white/20 rounded-lg transition text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-white/80 text-sm mt-1">Update your password to keep your account secure</p>
          </div>
          
          <div className="p-6 space-y-4">
            {passwordSuccess && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                <p className="text-green-600 dark:text-green-400 text-sm flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Password changed successfully! Redirecting...
                </p>
              </div>
            )}
            
            {passwordError && !passwordSuccess && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {passwordError}
                </p>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 pr-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Enter your current password"
                  autoComplete="off"
                  disabled={passwordSuccess}
                />
                <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700" disabled={passwordSuccess}>
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 pr-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Enter new password (min 6 characters)"
                  autoComplete="off"
                  disabled={passwordSuccess}
                />
                <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700" disabled={passwordSuccess}>
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Password must be at least 6 characters</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 pr-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Confirm your new password"
                  autoComplete="off"
                  disabled={passwordSuccess}
                />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700" disabled={passwordSuccess}>
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {newPassword && confirmPassword && !passwordSuccess && (
              newPassword === confirmPassword ? (
                <div className="flex items-center gap-2 text-green-600 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  Passwords match!
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-500 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  Passwords do not match
                </div>
              )
            )}
          </div>
          
          <div className="p-6 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-b-2xl flex justify-end gap-3">
            <button onClick={handleModalClose} className="px-4 py-2 border rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition" disabled={changingPassword}>
              Cancel
            </button>
            <button onClick={handleChangePassword} disabled={changingPassword || passwordSuccess} className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg font-semibold hover:shadow-lg transition flex items-center gap-2 disabled:opacity-50">
              {changingPassword ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Key className="w-4 h-4" />}
              {changingPassword ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      <PasswordModal />
      
      <div className="max-w-6xl mx-auto py-6 px-4">
        <div className="mb-6">
          <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Settings</h1>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Manage your account settings and preferences</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Sidebar */}
          <div className="lg:w-72">
            <div className={`rounded-xl shadow-sm border p-5 mb-5 text-center ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
              <div className="relative inline-block">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-r from-orange-500 to-amber-500 flex items-center justify-center mx-auto shadow">
                  {profileImageUrl && !imageError ? (
                    <img src={profileImageUrl} alt="Profile" className="w-full h-full object-cover" onError={() => setImageError(true)} />
                  ) : (
                    <span className="text-white text-3xl font-bold">{formData.full_name?.charAt(0)?.toUpperCase() || 'U'}</span>
                  )}
                </div>
                {uploading && <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center"><div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div></div>}
                <button onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 bg-orange-500 rounded-full p-1.5 text-white hover:bg-orange-600 transition shadow" disabled={uploading}>
                  <Camera className="w-3.5 h-3.5" />
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </div>
              {profileImageUrl && (
                <button onClick={handleRemoveImage} className="mt-2 text-xs text-red-500 hover:text-red-700 transition flex items-center justify-center gap-1 mx-auto" disabled={uploading}>
                  <Trash2 className="w-3 h-3" /> Remove photo
                </button>
              )}
              <h3 className={`font-semibold mt-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{formData.full_name || 'Your Name'}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 break-all">{formData.email}</p>
            </div>

            <div className={`rounded-xl shadow-sm border overflow-hidden ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-3 px-4 py-3 text-left transition ${isActive ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border-r-2 border-orange-500' : `${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'}`}`}>
                    <Icon className={`w-4 h-4 ${isActive ? 'text-orange-500' : 'text-gray-400'}`} />
                    <span className="text-sm">{item.label}</span>
                  </button>
                );
              })}
              <div className={`border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}></div>
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition text-left">
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Log Out</span>
              </button>
            </div>
          </div>

          {/* Right Content */}
          <div className="flex-1">
            <div className={`rounded-xl shadow-sm border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
              
              {/* PROFILE INFORMATION SECTION */}
              {activeTab === 'profile' && (
                <>
                  <div className="p-5 border-b dark:border-gray-700">
                    <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Profile Information</h2>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Update your personal details</p>
                  </div>
                  
                  <div className="p-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Full Name</label>
                        <input type="text" name="full_name" value={formData.full_name} onChange={handleChange} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}`} />
                      </div>
                      
                      <div>
                        <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Email Address</label>
                        <input type="email" value={formData.email} disabled className={`w-full px-3 py-2 border rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-400' : 'bg-gray-50 text-gray-500'}`} />
                      </div>
                      
                      <div>
                        <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Phone Number</label>
                        <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}`} />
                      </div>
                      
                      <div>
                        <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Username</label>
                        <input type="text" value={formData.username} disabled className={`w-full px-3 py-2 border rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-400' : 'bg-gray-50 text-gray-500'}`} />
                      </div>
                      
                      <div>
                        <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Date of Birth</label>
                        <input type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}`} />
                      </div>
                      
                      <div>
                        <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>City / Region</label>
                        <input type="text" name="region_city" value={formData.region_city} onChange={handleChange} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}`} />
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Bio</label>
                        <textarea name="bio" value={formData.bio} onChange={handleChange} rows={3} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 resize-none ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}`} placeholder="Tell us about yourself..." />
                        <div className="mt-1 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full transition-all bg-${bioStrength.color}-500`} style={{ width: `${bioStrength.percentage}%` }}></div>
                            </div>
                            <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{bioStrength.text}</span>
                          </div>
                          <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`}>{formData.bio.length} / 500</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-5 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-b-xl flex justify-end">
                    <button onClick={handleSave} disabled={loading} className="px-5 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition flex items-center gap-2 disabled:opacity-50">
                      {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Save className="w-4 h-4" />}
                      Save Changes
                    </button>
                  </div>
                </>
              )}

              {/* SECURITY SECTION */}
              {activeTab === 'security' && (
                <div>
                  <div className="p-5 border-b dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center"><Shield className="w-5 h-5 text-green-600 dark:text-green-400" /></div>
                      <div><h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Security</h2><p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Manage your account security</p></div>
                    </div>
                  </div>
                  
                  <div className="p-5">
                    <div className={`rounded-xl border p-5 ${isDarkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-md flex-shrink-0"><Key className="w-6 h-6 text-white" /></div>
                        <div className="flex-1">
                          <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Password</h3>
                          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>Update your password regularly to keep your account secure</p>
                          <button onClick={() => setShowPasswordModal(true)} className="mt-3 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg text-sm font-medium hover:shadow-md transition flex items-center gap-2">
                            <Key className="w-4 h-4" /> Change Password
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* NOTIFICATIONS SECTION */}
              {activeTab === 'notifications' && (
                <>
                  <div className="p-5 border-b dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center"><Bell className="w-5 h-5 text-orange-600 dark:text-orange-400" /></div>
                      <div><h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Notifications</h2><p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Choose how you want to be notified</p></div>
                    </div>
                  </div>
                  
                  <div className="divide-y dark:divide-gray-700">
                    <div className="p-5 flex items-center justify-between">
                      <div><p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Email Messages</p><p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Receive email when you get new messages</p></div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={notificationSettings.email_messages} onChange={() => setNotificationSettings(prev => ({...prev, email_messages: !prev.email_messages}))} />
                        <div className="w-10 h-5 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500"></div>
                      </label>
                    </div>
                    
                    <div className="p-5 flex items-center justify-between">
                      <div><p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Push Messages</p><p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Real-time notifications on your browser</p></div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={notificationSettings.push_messages} onChange={() => setNotificationSettings(prev => ({...prev, push_messages: !prev.push_messages}))} />
                        <div className="w-10 h-5 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500"></div>
                      </label>
                    </div>
                  </div>
                </>
              )}

              {/* PRIVACY SECTION */}
              {activeTab === 'privacy' && (
                <>
                  <div className="p-5 border-b dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center"><Lock className="w-5 h-5 text-red-600 dark:text-red-400" /></div>
                      <div><h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Privacy Settings</h2><p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Control who can see your information</p></div>
                    </div>
                  </div>
                  
                  <div className="divide-y dark:divide-gray-700">
                    <div className="p-5"><p className={`font-medium mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Profile Visibility</p><div className="flex gap-4">{['public', 'private'].map((option) => (<label key={option} className="flex items-center gap-2"><input type="radio" name="profile_visibility" value={option} checked={privacySettings.profile_visibility === option} onChange={(e) => setPrivacySettings(prev => ({...prev, profile_visibility: e.target.value}))} className="w-4 h-4 text-orange-500" /><span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{option}</span></label>))}</div></div>
                    <div className="p-5"><p className={`font-medium mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Email Visibility</p><div className="flex gap-4">{['public', 'private'].map((option) => (<label key={option} className="flex items-center gap-2"><input type="radio" name="email_visibility" value={option} checked={privacySettings.email_visibility === option} onChange={(e) => setPrivacySettings(prev => ({...prev, email_visibility: e.target.value}))} className="w-4 h-4 text-orange-500" /><span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{option}</span></label>))}</div></div>
                    <div className="p-5"><p className={`font-medium mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Phone Visibility</p><div className="flex gap-4">{['public', 'private'].map((option) => (<label key={option} className="flex items-center gap-2"><input type="radio" name="phone_visibility" value={option} checked={privacySettings.phone_visibility === option} onChange={(e) => setPrivacySettings(prev => ({...prev, phone_visibility: e.target.value}))} className="w-4 h-4 text-orange-500" /><span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{option}</span></label>))}</div></div>
                  </div>
                </>
              )}

              {/* APPEARANCE SECTION */}
              {activeTab === 'appearance' && (
                <>
                  <div className="p-5 border-b dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center"><Monitor className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /></div>
                      <div><h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Appearance</h2><p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Customize how the platform looks</p></div>
                    </div>
                  </div>
                  
                  <div className="p-5">
                    <p className={`font-medium mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Theme</p>
                    <div className="grid grid-cols-2 gap-3 max-w-md">
                      <button onClick={() => setIsDarkMode(false)} className={`p-4 border-2 rounded-xl flex flex-col items-center gap-2 transition ${!isDarkMode ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : `border-gray-200 dark:border-gray-700 hover:border-indigo-200`}`}>
                        <Sun className={`w-6 h-6 ${!isDarkMode ? 'text-indigo-600' : 'text-gray-400'}`} />
                        <span className={`text-sm ${!isDarkMode ? 'text-indigo-600 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>Light</span>
                      </button>
                      <button onClick={() => setIsDarkMode(true)} className={`p-4 border-2 rounded-xl flex flex-col items-center gap-2 transition ${isDarkMode ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : `border-gray-200 dark:border-gray-700 hover:border-indigo-200`}`}>
                        <Moon className={`w-6 h-6 ${isDarkMode ? 'text-indigo-600' : 'text-gray-400'}`} />
                        <span className={`text-sm ${isDarkMode ? 'text-indigo-600 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>Dark</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;