// src/components/dashboard/common/Settings.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  User, Mail, Phone, Calendar, MapPin, Lock, 
  Shield, LogOut, Save, CheckCircle, AlertCircle,
  Camera, Trash2, Eye, EyeOff, Key, Bell,
  Monitor, Sun, Moon, X
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import toast from 'react-hot-toast';

const API_URL = 'http://localhost:8000';

const Settings = () => {
  const { user, logout, refreshUser, updateUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [imageError, setImageError] = useState(false);
  
  // Get active tab from URL parameter
  const [activeTab, setActiveTab] = useState(() => {
    const tab = searchParams.get('tab');
    return tab || 'profile';
  });
  
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

  // Theme state - FULLY FUNCTIONAL
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

  // Listen for URL parameter changes from sidebar dropdown
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

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
      let formattedDate = '';
      if (user.date_of_birth) {
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

      if (response.ok && data.success) {
        if (data.user) {
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

  const PasswordModal = () => {
    if (!showPasswordModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl">
          <div className="p-6 border-b dark:border-gray-700 bg-gradient-to-r from-blue-600 to-purple-600 rounded-t-2xl">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Key className="w-5 h-5" />
                Change Password
              </h2>
              <button onClick={handleModalClose} className="p-1 hover:bg-white/20 rounded-lg transition text-white">
                <X className="w-5 h-5" />
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
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 pr-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 pr-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 pr-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
            <button onClick={handleChangePassword} disabled={changingPassword || passwordSuccess} className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition flex items-center gap-2 disabled:opacity-50">
              {changingPassword ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Key className="w-4 h-4" />}
              {changingPassword ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <PasswordModal />
      
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Profile Information Section */}
        {activeTab === 'profile' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Profile Information</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Update your personal details and public profile</p>
            </div>
            
            <div className="p-6">
              {/* Profile Picture Upload */}
              <div className="flex flex-col items-center mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
                <div className="relative inline-block">
                  <div className="w-28 h-28 rounded-full overflow-hidden bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center shadow-lg ring-4 ring-white dark:ring-gray-800">
                    {profileImageUrl && !imageError ? (
                      <img src={profileImageUrl} alt="Profile" className="w-full h-full object-cover" onError={() => setImageError(true)} />
                    ) : (
                      <span className="text-white text-4xl font-bold">{formData.full_name?.charAt(0)?.toUpperCase() || 'U'}</span>
                    )}
                  </div>
                  {uploading && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 bg-blue-600 rounded-full p-2 text-white hover:bg-blue-700 transition shadow-lg"
                    disabled={uploading}
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </div>
                {profileImageUrl && (
                  <button onClick={handleRemoveImage} className="mt-3 text-sm text-red-500 hover:text-red-600 transition flex items-center gap-1" disabled={uploading}>
                    <Trash2 className="w-3 h-3" /> Remove photo
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition"
                    placeholder="+251 911 234 567"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Username</label>
                  <input
                    type="text"
                    value={formData.username}
                    disabled
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date of Birth</label>
                  <input
                    type="date"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">City / Region</label>
                  <input
                    type="text"
                    name="region_city"
                    value={formData.region_city}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition"
                    placeholder="Addis Ababa"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Bio / About Me</label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none dark:bg-gray-700 dark:text-white transition"
                    placeholder="Tell us about yourself..."
                  />
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all bg-${bioStrength.color}-500`}
                          style={{ width: `${bioStrength.percentage}%` }}
                        ></div>
                      </div>
                      <span className={`text-xs font-medium text-${bioStrength.color}-600 dark:text-${bioStrength.color}-400`}>{bioStrength.text}</span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{formData.bio.length} / 500 characters</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-gray-50 dark:bg-gray-900/50 rounded-b-2xl flex justify-end">
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Save className="w-4 h-4" />}
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}

        {/* Security Section */}
        {activeTab === 'security' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Security</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Manage your account security</p>
            </div>
            
            <div className="p-6">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-100 dark:border-green-800 p-6">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                    <Key className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">Password</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Update your password regularly to keep your account secure
                    </p>
                    <button
                      onClick={() => setShowPasswordModal(true)}
                      className="mt-4 px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl text-sm font-medium hover:shadow-lg transition flex items-center gap-2"
                    >
                      <Key className="w-4 h-4" />
                      Change Password
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notifications Section */}
        {activeTab === 'notifications' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Notification Preferences</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Choose how you want to be notified</p>
            </div>
            
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              <div className="p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Email Messages</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Receive email when you get new messages</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={notificationSettings.email_messages}
                    onChange={() => setNotificationSettings(prev => ({...prev, email_messages: !prev.email_messages}))}
                  />
                  <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              <div className="p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Push Messages</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Real-time notifications on your browser</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={notificationSettings.push_messages}
                    onChange={() => setNotificationSettings(prev => ({...prev, push_messages: !prev.push_messages}))}
                  />
                  <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Privacy Section */}
        {activeTab === 'privacy' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Privacy Settings</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Control who can see your information</p>
            </div>
            
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              <div className="p-6">
                <p className="font-medium text-gray-900 dark:text-white mb-4">Profile Visibility</p>
                <div className="flex gap-6">
                  {['public', 'private'].map((option) => (
                    <label key={option} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="profile_visibility"
                        value={option}
                        checked={privacySettings.profile_visibility === option}
                        onChange={(e) => setPrivacySettings(prev => ({...prev, profile_visibility: e.target.value}))}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">{option}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="p-6">
                <p className="font-medium text-gray-900 dark:text-white mb-4">Email Visibility</p>
                <div className="flex gap-6">
                  {['public', 'private'].map((option) => (
                    <label key={option} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="email_visibility"
                        value={option}
                        checked={privacySettings.email_visibility === option}
                        onChange={(e) => setPrivacySettings(prev => ({...prev, email_visibility: e.target.value}))}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">{option}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="p-6">
                <p className="font-medium text-gray-900 dark:text-white mb-4">Phone Visibility</p>
                <div className="flex gap-6">
                  {['public', 'private'].map((option) => (
                    <label key={option} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="phone_visibility"
                        value={option}
                        checked={privacySettings.phone_visibility === option}
                        onChange={(e) => setPrivacySettings(prev => ({...prev, phone_visibility: e.target.value}))}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Appearance Section - FULLY FUNCTIONAL */}
        {activeTab === 'appearance' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Appearance</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Customize how the platform looks</p>
            </div>
            
            <div className="p-6">
              <p className="font-medium text-gray-900 dark:text-white mb-4">Theme Preference</p>
              <div className="grid grid-cols-2 gap-4 max-w-md">
                <button
                  onClick={() => setIsDarkMode(false)}
                  className={`p-4 border-2 rounded-xl flex flex-col items-center gap-2 transition-all ${
                    !isDarkMode
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <Sun className={`w-8 h-8 ${!isDarkMode ? 'text-blue-600' : 'text-gray-400'}`} />
                  <span className={`text-sm font-medium ${!isDarkMode ? 'text-blue-600' : 'text-gray-600 dark:text-gray-400'}`}>
                    Light Mode
                  </span>
                  {!isDarkMode && (
                    <div className="mt-2 w-full h-1 bg-blue-500 rounded-full animate-pulse"></div>
                  )}
                </button>
                
                <button
                  onClick={() => setIsDarkMode(true)}
                  className={`p-4 border-2 rounded-xl flex flex-col items-center gap-2 transition-all ${
                    isDarkMode
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <Moon className={`w-8 h-8 ${isDarkMode ? 'text-blue-600' : 'text-gray-400'}`} />
                  <span className={`text-sm font-medium ${isDarkMode ? 'text-blue-600' : 'text-gray-600 dark:text-gray-400'}`}>
                    Dark Mode
                  </span>
                  {isDarkMode && (
                    <div className="mt-2 w-full h-1 bg-blue-500 rounded-full animate-pulse"></div>
                  )}
                </button>
              </div>
              
              {/* Preview Section */}
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <p className="font-medium text-gray-900 dark:text-white mb-4">Preview</p>
                <div className={`p-4 rounded-xl transition-all duration-300 ${
                  isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isDarkMode ? 'bg-blue-600' : 'bg-blue-500'
                    }`}>
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {formData.full_name || 'Your Name'}
                      </p>
                      <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {formData.email || 'user@example.com'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;