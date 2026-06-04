// src/components/dashboard/admin/AdminSettings.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  User, Shield, Bell, Monitor, Building2, DollarSign, BarChart3,
  Camera, Trash2, Eye, EyeOff, Key, LogOut, Save, CheckCircle, AlertCircle,
  X, Sun, Moon, Users, Home, CreditCard, TrendingUp, Clock,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import toast from 'react-hot-toast';

const API_URL = 'http://localhost:8000';

const AdminSettings = () => {
  const { user, logout, refreshUser, updateUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [imageError, setImageError] = useState(false);
  const fileInputRef = useRef(null);
  
  const [activeTab, setActiveTab] = useState(() => {
    const tab = searchParams.get('tab');
    return tab || 'profile';
  });

  // Password modal state - LOCAL to modal now
  const [showPasswordModal, setShowPasswordModal] = useState(false);

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
    address: '',
    position: '',
    department: ''
  });

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState({
    email_alerts: true,
    new_user_notifications: true,
    payment_notifications: true
  });

  // Company Settings State
  const [companySettings, setCompanySettings] = useState({
    company_name: 'EstateHub Real Estate',
    company_email: 'admin@estatehub.com',
    company_phone: '+251 911 111 111',
    company_address: 'Addis Ababa, Ethiopia',
    company_website: 'www.estatehub.com',
    company_tin: '0071406415',
    currency: 'ETB',
    tax_rate: 15,
    commission_rate: 3.5,
    listing_fee: 500,
    subscription_fee_seller: 2500,
    subscription_fee_landlord: 2500,
    subscription_fee_dual: 4000
  });

  // Platform Stats
  const [platformStats, setPlatformStats] = useState({
    total_users: 1234,
    total_listings: 567,
    total_revenue: 1200000
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

  // Load user data
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
        region_city: user.city || user.region || 'Addis Ababa',
        bio: user.bio || '',
        address: user.address || '',
        position: user.position || 'Administrator',
        department: user.department || 'Management'
      });
      setProfileImage(user.avatar_url || null);
    }
    
    loadCompanySettings();
  }, [user]);

  const loadCompanySettings = () => {
    const savedSettings = localStorage.getItem('company_settings');
    if (savedSettings) {
      try {
        setCompanySettings(JSON.parse(savedSettings));
      } catch (e) {}
    }
  };

  const saveCompanySettings = () => {
    localStorage.setItem('company_settings', JSON.stringify(companySettings));
    toast.success('Company settings saved successfully!');
  };

  const handleCompanyChange = (e) => {
    const { name, value } = e.target;
    setCompanySettings(prev => ({ ...prev, [name]: value }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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
      const formDataImg = new FormData();
      formDataImg.append('profile_picture', file);

      const response = await fetch(`${API_URL}/api/users/upload-profile-picture`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formDataImg
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

  const handleSaveProfile = async () => {
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
          bio: formData.bio,
          position: formData.position,
          department: formData.department
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Fetch fresh user data
        const meResponse = await fetch(`${API_URL}/api/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (meResponse.ok) {
          const freshUser = await meResponse.json();
          
          // Update localStorage
          localStorage.setItem('user', JSON.stringify(freshUser));
          
          // Update AuthContext
          if (updateUser) {
            updateUser(freshUser);
          }
          
          // Force refresh for sidebar
          window.dispatchEvent(new StorageEvent('storage', {
            key: 'user',
            newValue: JSON.stringify(freshUser)
          }));
          
          // Update form data
          let formattedDate = '';
          if (freshUser.date_of_birth) {
            if (freshUser.date_of_birth.includes('/')) {
              const parts = freshUser.date_of_birth.split('/');
              if (parts.length === 3) {
                formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
              }
            } else {
              formattedDate = freshUser.date_of_birth;
            }
          }
          
          setFormData({
            full_name: freshUser.full_name || '',
            email: freshUser.email || '',
            username: freshUser.username || '',
            phone: freshUser.phone || '',
            date_of_birth: formattedDate,
            region_city: freshUser.city || 'Addis Ababa',
            bio: freshUser.bio || '',
            address: freshUser.address || '',
            position: freshUser.position || 'Administrator',
            department: freshUser.department || 'Management'
          });
          
          setProfileImage(freshUser.avatar_url || null);
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

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    setTimeout(() => {
      window.location.href = '/login';
    }, 500);
  };

  const profileImageUrl = getProfileImageUrl();

  // ========== PASSWORD MODAL WITH LOCAL STATE (FIXES CURSOR ISSUE) ==========
  const PasswordModal = () => {
    // Local state for password modal inputs
    const [localCurrentPassword, setLocalCurrentPassword] = useState('');
    const [localNewPassword, setLocalNewPassword] = useState('');
    const [localConfirmPassword, setLocalConfirmPassword] = useState('');
    const [localShowCurrentPassword, setLocalShowCurrentPassword] = useState(false);
    const [localShowNewPassword, setLocalShowNewPassword] = useState(false);
    const [localShowConfirmPassword, setLocalShowConfirmPassword] = useState(false);
    const [localChangingPassword, setLocalChangingPassword] = useState(false);
    const [localPasswordError, setLocalPasswordError] = useState('');
    const [localPasswordSuccess, setLocalPasswordSuccess] = useState(false);

    const handleLocalChangePassword = async () => {
      setLocalPasswordError('');
      setLocalPasswordSuccess(false);
      
      const trimmedCurrent = localCurrentPassword.trim();
      const trimmedNew = localNewPassword.trim();
      const trimmedConfirm = localConfirmPassword.trim();
      
      if (!trimmedCurrent) {
        setLocalPasswordError('Current password is required');
        toast.error('Current password is required');
        return;
      }
      
      if (!trimmedNew) {
        setLocalPasswordError('New password is required');
        toast.error('New password is required');
        return;
      }
      
      if (trimmedNew.length < 6) {
        setLocalPasswordError('Password must be at least 6 characters');
        toast.error('Password must be at least 6 characters');
        return;
      }
      
      if (trimmedNew !== trimmedConfirm) {
        setLocalPasswordError('New passwords do not match');
        toast.error('New passwords do not match');
        return;
      }

      setLocalChangingPassword(true);
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
          setLocalPasswordSuccess(true);
          toast.success('Password changed successfully!', { id: toastId });
          
          setLocalCurrentPassword('');
          setLocalNewPassword('');
          setLocalConfirmPassword('');
          
          setTimeout(() => {
            setShowPasswordModal(false);
            setLocalPasswordSuccess(false);
            setLocalPasswordError('');
            setLocalCurrentPassword('');
            setLocalNewPassword('');
            setLocalConfirmPassword('');
          }, 2000);
        } else {
          const errorMsg = data.message || data.detail || 'Failed to change password';
          toast.error(errorMsg, { id: toastId });
          setLocalPasswordError(errorMsg);
        }
      } catch (error) {
        console.error('Password change error:', error);
        toast.error('Failed to change password.', { id: toastId });
        setLocalPasswordError('Network error. Please try again.');
      } finally {
        setLocalChangingPassword(false);
      }
    };

    const handleLocalModalClose = () => {
      setShowPasswordModal(false);
      setLocalPasswordError('');
      setLocalPasswordSuccess(false);
      setLocalCurrentPassword('');
      setLocalNewPassword('');
      setLocalConfirmPassword('');
      setLocalShowCurrentPassword(false);
      setLocalShowNewPassword(false);
      setLocalShowConfirmPassword(false);
    };

    if (!showPasswordModal) return null;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl">
          <div className="p-6 border-b dark:border-gray-700 bg-gradient-to-r from-green-600 to-emerald-600 rounded-t-2xl">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Key className="w-5 h-5" />
                Change Password
              </h2>
              <button onClick={handleLocalModalClose} className="p-1 hover:bg-white/20 rounded-lg transition text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-white/80 text-sm mt-1">Update your password to keep your account secure</p>
          </div>
          
          <div className="p-6 space-y-4">
            {localPasswordSuccess && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                <p className="text-green-600 dark:text-green-400 text-sm flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Password changed successfully!
                </p>
              </div>
            )}
            
            {localPasswordError && !localPasswordSuccess && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {localPasswordError}
                </p>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Password</label>
              <div className="relative">
                <input
                  type={localShowCurrentPassword ? "text" : "password"}
                  value={localCurrentPassword}
                  onChange={(e) => setLocalCurrentPassword(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 pr-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Enter your current password"
                  autoComplete="off"
                  disabled={localPasswordSuccess}
                />
                <button 
                  type="button" 
                  onClick={() => setLocalShowCurrentPassword(!localShowCurrentPassword)} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700" 
                  disabled={localPasswordSuccess}
                >
                  {localShowCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
              <div className="relative">
                <input
                  type={localShowNewPassword ? "text" : "password"}
                  value={localNewPassword}
                  onChange={(e) => setLocalNewPassword(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 pr-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Enter new password (min 6 characters)"
                  autoComplete="off"
                  disabled={localPasswordSuccess}
                />
                <button 
                  type="button" 
                  onClick={() => setLocalShowNewPassword(!localShowNewPassword)} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700" 
                  disabled={localPasswordSuccess}
                >
                  {localShowNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Password must be at least 6 characters</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm New Password</label>
              <div className="relative">
                <input
                  type={localShowConfirmPassword ? "text" : "password"}
                  value={localConfirmPassword}
                  onChange={(e) => setLocalConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 pr-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Confirm your new password"
                  autoComplete="off"
                  disabled={localPasswordSuccess}
                />
                <button 
                  type="button" 
                  onClick={() => setLocalShowConfirmPassword(!localShowConfirmPassword)} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700" 
                  disabled={localPasswordSuccess}
                >
                  {localShowConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {localNewPassword && localConfirmPassword && !localPasswordSuccess && (
              localNewPassword === localConfirmPassword ? (
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
            <button 
              onClick={handleLocalModalClose} 
              className="px-4 py-2 border rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition" 
              disabled={localChangingPassword}
            >
              Cancel
            </button>
            <button 
              onClick={handleLocalChangePassword} 
              disabled={localChangingPassword || localPasswordSuccess} 
              className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:shadow-lg transition flex items-center gap-2 disabled:opacity-50"
            >
              {localChangingPassword ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Key className="w-4 h-4" />}
              {localChangingPassword ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ========== PROFILE SECTION ==========
  const ProfileSection = () => (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Profile Information</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Update your personal details and public profile</p>
      </div>
      
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center shadow-lg">
              {profileImageUrl && !imageError ? (
                <img src={profileImageUrl} alt="Profile" className="w-full h-full object-cover" onError={() => setImageError(true)} />
              ) : (
                <span className="text-white text-xl font-bold">{formData.full_name?.charAt(0)?.toUpperCase() || 'A'}</span>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 bg-blue-600 rounded-full p-1 text-white hover:bg-blue-700 transition shadow-lg"
              disabled={uploading}
            >
              <Camera className="w-3 h-3" />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">{formData.full_name || 'Admin User'}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{formData.email || 'admin@estatehub.com'}</p>
            {profileImageUrl && (
              <button onClick={handleRemoveImage} className="mt-1 text-xs text-red-500 hover:text-red-600 transition">
                Remove photo
              </button>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
            <input type="text" name="full_name" value={formData.full_name} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
            <input type="email" value={formData.email} disabled className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username</label>
            <input type="text" value={formData.username} disabled className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Position</label>
            <input type="text" name="position" value={formData.position} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Department</label>
            <input type="text" name="department" value={formData.department} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date of Birth</label>
            <input type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City / Region</label>
            <input type="text" name="region_city" value={formData.region_city} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" placeholder="Addis Ababa" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bio / About Me</label>
            <textarea name="bio" value={formData.bio} onChange={handleChange} rows={4} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none dark:bg-gray-700 dark:text-white" placeholder="Tell us about yourself..." />
            <p className="text-xs text-gray-400 mt-1">{formData.bio.length} / 500 characters</p>
          </div>
        </div>
      </div>
      
      <div className="p-6 bg-gray-50 dark:bg-gray-900/50 rounded-b-2xl flex justify-end">
        <button onClick={handleSaveProfile} disabled={loading} className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition flex items-center gap-2 disabled:opacity-50">
          {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Save className="w-4 h-4" />}
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );

  // ========== SECURITY SECTION ==========
  const SecuritySection = () => (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Security</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your account security</p>
      </div>
      
      <div className="p-6">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 rounded-xl border border-green-100 p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-md">
              <Key className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">Password</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Update your password regularly to keep your account secure</p>
              <button onClick={() => setShowPasswordModal(true)} className="mt-4 px-5 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg text-sm font-medium hover:shadow-lg transition flex items-center gap-2">
                <Key className="w-4 h-4" />
                Change Password
              </button>
            </div>
          </div>
        </div>
        
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-lg text-red-600 hover:bg-red-100 transition font-medium">
            <LogOut className="w-4 h-4" />
            Logout from Account
          </button>
        </div>
      </div>
    </div>
  );

  // ========== NOTIFICATIONS SECTION ==========
 // In AdminSettings.jsx - Update the NotificationsSection

// ========== NOTIFICATIONS SECTION - WORKING VERSION (No API) ==========
// In AdminSettings.jsx - Update NotificationsSection

const NotificationsSection = () => {
  const [localNotificationSettings, setLocalNotificationSettings] = useState({
    email_alerts: true,
    new_user_notifications: true,
    payment_notifications: true
  });
  const [saving, setSaving] = useState(false);

  // Load saved notifications from backend AND localStorage
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${API_URL}/api/admin/notification-settings`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          setLocalNotificationSettings(data);
          // Also save to localStorage for frontend use
          localStorage.setItem('admin_notifications', JSON.stringify(data));
        } else {
          // Fallback to localStorage
          const savedNotifications = localStorage.getItem('admin_notifications');
          if (savedNotifications) {
            try {
              const parsed = JSON.parse(savedNotifications);
              setLocalNotificationSettings(parsed);
            } catch (e) {}
          }
        }
      } catch (error) {
        console.error('Error loading notification settings:', error);
        // Fallback to localStorage
        const savedNotifications = localStorage.getItem('admin_notifications');
        if (savedNotifications) {
          try {
            const parsed = JSON.parse(savedNotifications);
            setLocalNotificationSettings(parsed);
          } catch (e) {}
        }
      }
    };
    
    loadSettings();
  }, []);

  const handleSaveNotifications = async () => {
    setSaving(true);
    
    try {
      const token = localStorage.getItem('access_token');
      
      // Save to backend database
      const response = await fetch(`${API_URL}/api/admin/notification-settings`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(localNotificationSettings)
      });
      
      if (response.ok) {
        // Also save to localStorage for frontend use
        localStorage.setItem('admin_notifications', JSON.stringify(localNotificationSettings));
        
        // Dispatch event for other components
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'admin_notifications',
          newValue: JSON.stringify(localNotificationSettings)
        }));
        
        toast.success('Notification preferences saved successfully!');
      } else {
        // Fallback to localStorage only
        localStorage.setItem('admin_notifications', JSON.stringify(localNotificationSettings));
        toast.success('Notification preferences saved locally!');
      }
    } catch (error) {
      console.error('Error saving notification settings:', error);
      // Fallback to localStorage only
      localStorage.setItem('admin_notifications', JSON.stringify(localNotificationSettings));
      toast.success('Notification preferences saved locally!');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Notification Preferences</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Choose how you want to be notified</p>
      </div>
      
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {[
          { id: 'email_alerts', label: 'Email Alerts', desc: 'Receive important alerts via email' },
          { id: 'new_user_notifications', label: 'New User Notifications', desc: 'Get notified when new users register' },
          { id: 'payment_notifications', label: 'Payment Notifications', desc: 'Get notified about new payments' }
        ].map((item) => (
          <div key={item.id} className="p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{item.label}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{item.desc}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={localNotificationSettings[item.id]} 
                onChange={() => setLocalNotificationSettings(prev => ({ ...prev, [item.id]: !prev[item.id] }))} 
              />
              <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        ))}
      </div>
      
      <div className="p-6 bg-gray-50 dark:bg-gray-900/50 rounded-b-2xl flex justify-end">
        <button 
          onClick={handleSaveNotifications} 
          disabled={saving}
          className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition flex items-center gap-2 disabled:opacity-50"
        >
          {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Save className="w-4 h-4" />}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};

// ========== APPEARANCE SECTION - FULLY FUNCTIONAL ==========
const AppearanceSection = () => {
  // Local state for theme
  const [localIsDarkMode, setLocalIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark';
  });

  // Apply theme when changed
  useEffect(() => {
    if (localIsDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [localIsDarkMode]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Appearance</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Customize how the platform looks</p>
      </div>
      
      <div className="p-6">
        <p className="font-medium text-gray-900 dark:text-white mb-4">Theme Preference</p>
        <div className="grid grid-cols-2 gap-4 max-w-md">
          <button 
            onClick={() => setLocalIsDarkMode(false)} 
            className={`p-4 border-2 rounded-xl flex flex-col items-center gap-2 transition-all ${
              !localIsDarkMode 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md' 
                : 'border-gray-200 dark:border-gray-700 hover:border-blue-200 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <Sun className={`w-8 h-8 ${!localIsDarkMode ? 'text-blue-600' : 'text-gray-400'}`} />
            <span className={`text-sm font-medium ${!localIsDarkMode ? 'text-blue-600' : 'text-gray-600 dark:text-gray-400'}`}>
              Light Mode
            </span>
            {!localIsDarkMode && (
              <div className="mt-2 w-full h-1 bg-blue-500 rounded-full animate-pulse"></div>
            )}
          </button>
          
          <button 
            onClick={() => setLocalIsDarkMode(true)} 
            className={`p-4 border-2 rounded-xl flex flex-col items-center gap-2 transition-all ${
              localIsDarkMode 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md' 
                : 'border-gray-200 dark:border-gray-700 hover:border-blue-200 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <Moon className={`w-8 h-8 ${localIsDarkMode ? 'text-blue-600' : 'text-gray-400'}`} />
            <span className={`text-sm font-medium ${localIsDarkMode ? 'text-blue-600' : 'text-gray-600 dark:text-gray-400'}`}>
              Dark Mode
            </span>
            {localIsDarkMode && (
              <div className="mt-2 w-full h-1 bg-blue-500 rounded-full animate-pulse"></div>
            )}
          </button>
        </div>
        
        {/* Preview Section */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="font-medium text-gray-900 dark:text-white mb-4">Preview</p>
          <div className={`p-4 rounded-xl transition-all duration-300 ${
            localIsDarkMode ? 'bg-gray-800' : 'bg-gray-100'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                localIsDarkMode ? 'bg-blue-600' : 'bg-blue-500'
              }`}>
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className={`text-sm font-medium ${localIsDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Preview User
                </p>
                <p className={`text-xs ${localIsDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  user@example.com
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Save button for appearance */}
        <div className="mt-6 pt-4 flex justify-end">
          <button 
            onClick={() => {
              toast.success('Theme updated successfully!');
            }} 
            className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg font-semibold hover:shadow-lg transition flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Apply Theme
          </button>
        </div>
      </div>
    </div>
  );
};

  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'profile': return <ProfileSection />;
      case 'security': return <SecuritySection />;
      case 'notifications': return <NotificationsSection />;
      case 'appearance': return <AppearanceSection />;
      default: return <ProfileSection />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <PasswordModal />
      
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Settings</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your profile and preferences</p>
        </div>
        
        {/* ONLY Admin Settings Tabs - NO Company Settings tabs here */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">
          {['profile', 'security', 'notifications', 'appearance'].map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setSearchParams({ tab: tab }); }}
              className={`px-5 py-2.5 rounded-xl font-medium transition-all duration-300 capitalize ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        
        {/* Content Area */}
        {renderContent()}
      </div>
    </div>
  );
};

export default AdminSettings;