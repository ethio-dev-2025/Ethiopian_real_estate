// src/components/dashboard/admin/AdminSettings.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  User, Shield, Camera, Trash2, Eye, EyeOff, Key, LogOut, Save, CheckCircle, AlertCircle,
  X, Sun, Moon, Clock
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
    return (tab === 'profile' || tab === 'security') ? tab : 'profile';
  });

  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark';
  });

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    username: '',
    phone: '',
    date_of_birth: '',
    region_city: '',
    address: '',
    position: '',
    department: ''
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

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
        address: user.address || '',
        position: user.position || 'Administrator',
        department: user.department || 'Management'
      });
      setProfileImage(user.avatar_url || null);
    }
  }, [user]);

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
          position: formData.position,
          department: formData.department
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const meResponse = await fetch(`${API_URL}/api/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (meResponse.ok) {
          const freshUser = await meResponse.json();
          
          localStorage.setItem('user', JSON.stringify(freshUser));
          
          if (updateUser) {
            updateUser(freshUser);
          }
          
          window.dispatchEvent(new StorageEvent('storage', {
            key: 'user',
            newValue: JSON.stringify(freshUser)
          }));
          
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

  const PasswordModal = () => {
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
          <div className="p-6 border-b dark:border-gray-700 bg-gradient-to-r from-primary-700 to-primary-800 rounded-t-2xl">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Key className="w-5 h-5 text-white" />
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
              <div className="bg-success/10 border border-success/20 rounded-lg p-3">
                <p className="text-success text-sm flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  Password changed successfully!
                </p>
              </div>
            )}
            
            {localPasswordError && !localPasswordSuccess && (
              <div className="bg-error/10 border border-error/20 rounded-lg p-3">
                <p className="text-error text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-error" />
                  {localPasswordError}
                </p>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-text-primary dark:text-gray-300 mb-1">Current Password</label>
              <div className="relative">
                <input
                  type={localShowCurrentPassword ? "text" : "password"}
                  value={localCurrentPassword}
                  onChange={(e) => setLocalCurrentPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-border-light rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 pr-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Enter your current password"
                  autoComplete="off"
                  disabled={localPasswordSuccess}
                />
                <button 
                  type="button" 
                  onClick={() => setLocalShowCurrentPassword(!localShowCurrentPassword)} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
                  disabled={localPasswordSuccess}
                >
                  {localShowCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-text-primary dark:text-gray-300 mb-1">New Password</label>
              <div className="relative">
                <input
                  type={localShowNewPassword ? "text" : "password"}
                  value={localNewPassword}
                  onChange={(e) => setLocalNewPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-border-light rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 pr-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Enter new password (min 6 characters)"
                  autoComplete="off"
                  disabled={localPasswordSuccess}
                />
                <button 
                  type="button" 
                  onClick={() => setLocalShowNewPassword(!localShowNewPassword)} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
                  disabled={localPasswordSuccess}
                >
                  {localShowNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-text-muted dark:text-gray-400 mt-1">Password must be at least 6 characters</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-text-primary dark:text-gray-300 mb-1">Confirm New Password</label>
              <div className="relative">
                <input
                  type={localShowConfirmPassword ? "text" : "password"}
                  value={localConfirmPassword}
                  onChange={(e) => setLocalConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-border-light rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 pr-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Confirm your new password"
                  autoComplete="off"
                  disabled={localPasswordSuccess}
                />
                <button 
                  type="button" 
                  onClick={() => setLocalShowConfirmPassword(!localShowConfirmPassword)} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
                  disabled={localPasswordSuccess}
                >
                  {localShowConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {localNewPassword && localConfirmPassword && !localPasswordSuccess && (
              localNewPassword === localConfirmPassword ? (
                <div className="flex items-center gap-2 text-success text-sm">
                  <CheckCircle className="w-4 h-4 text-success" />
                  Passwords match!
                </div>
              ) : (
                <div className="flex items-center gap-2 text-error text-sm">
                  <AlertCircle className="w-4 h-4 text-error" />
                  Passwords do not match
                </div>
              )
            )}
          </div>
          
          <div className="p-6 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-b-2xl flex justify-end gap-3">
            <button 
              onClick={handleLocalModalClose} 
              className="px-4 py-2 border border-border-light rounded-lg text-text-secondary hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              disabled={localChangingPassword}
            >
              Cancel
            </button>
            <button 
              onClick={handleLocalChangePassword} 
              disabled={localChangingPassword || localPasswordSuccess} 
              className="px-4 py-2 bg-gradient-to-r from-primary-700 to-primary-800 text-white rounded-lg font-semibold hover:shadow-lg transition flex items-center gap-2 disabled:opacity-50"
            >
              {localChangingPassword ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Key className="w-4 h-4 text-white" />}
              {localChangingPassword ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const ProfileSection = () => (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-border-light dark:border-gray-700">
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border-light dark:border-gray-700">
          <div className="relative">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-r from-primary-600 to-secondary-500 flex items-center justify-center shadow-lg">
              {profileImageUrl && !imageError ? (
                <img src={profileImageUrl} alt="Profile" className="w-full h-full object-cover" onError={() => setImageError(true)} />
              ) : (
                <span className="text-white text-xl font-bold">{formData.full_name?.charAt(0)?.toUpperCase() || 'A'}</span>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 bg-primary-600 rounded-full p-1 text-white hover:bg-primary-700 transition shadow-lg"
              disabled={uploading}
            >
              <Camera className="w-3 h-3" />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          </div>
          <div>
            <p className="font-semibold text-text-primary dark:text-white">{formData.full_name || 'Admin User'}</p>
            <p className="text-sm text-text-muted dark:text-gray-400">{formData.email || 'admin@estatehub.com'}</p>
            {profileImageUrl && (
              <button onClick={handleRemoveImage} className="mt-1 text-xs text-error hover:text-red-700 transition">
                Remove photo
              </button>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-text-primary dark:text-gray-300 mb-1">Full Name</label>
            <input type="text" name="full_name" value={formData.full_name} onChange={handleChange} className="w-full px-4 py-2 border border-border-light dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary dark:text-gray-300 mb-1">Email Address</label>
            <input type="email" value={formData.email} disabled className="w-full px-4 py-2 border border-border-light dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-text-muted dark:text-gray-400 cursor-not-allowed" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary dark:text-gray-300 mb-1">Phone Number</label>
            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full px-4 py-2 border border-border-light dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary dark:text-gray-300 mb-1">Username</label>
            <input type="text" value={formData.username} disabled className="w-full px-4 py-2 border border-border-light dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-text-muted dark:text-gray-400 cursor-not-allowed" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary dark:text-gray-300 mb-1">Position</label>
            <input type="text" name="position" value={formData.position} onChange={handleChange} className="w-full px-4 py-2 border border-border-light dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary dark:text-gray-300 mb-1">Department</label>
            <input type="text" name="department" value={formData.department} onChange={handleChange} className="w-full px-4 py-2 border border-border-light dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary dark:text-gray-300 mb-1">Date of Birth</label>
            <input type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} className="w-full px-4 py-2 border border-border-light dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary dark:text-gray-300 mb-1">City / Region</label>
            <input type="text" name="region_city" value={formData.region_city} onChange={handleChange} className="w-full px-4 py-2 border border-border-light dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white" placeholder="Addis Ababa" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-text-primary dark:text-gray-300 mb-2">Address</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-3 border border-border-light dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 resize-none dark:bg-gray-700 dark:text-white"
              placeholder="Your full address"
            />
          </div>
        </div>
      </div>
      
      <div className="p-6 bg-gray-50 dark:bg-gray-900/50 rounded-b-2xl flex justify-end">
        <button onClick={handleSaveProfile} disabled={loading} className="px-6 py-2 bg-gradient-to-r from-primary-700 to-primary-800 text-white rounded-lg font-semibold hover:shadow-lg transition flex items-center gap-2 disabled:opacity-50">
          {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Save className="w-4 h-4 text-white" />}
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );

  const SecuritySection = () => (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-border-light dark:border-gray-700">
      <div className="p-6">
        <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl border border-primary-200 dark:border-primary-800 p-6">
          <div className="flex items-start gap-4 flex-wrap sm:flex-nowrap">
            <div className="w-14 h-14 bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
              <Key className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg text-text-primary dark:text-white mb-1">Password Security</h3>
              <p className="text-sm text-text-secondary dark:text-gray-400 mb-4">Update your password regularly to keep your account secure. A strong password should be at least 6 characters long.</p>
              <button 
                onClick={() => setShowPasswordModal(true)} 
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-700 to-primary-800 text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
              >
                <Key className="w-4 h-4 text-white" />
                Change Password
              </button>
            </div>
          </div>
        </div>
        
        {/* Security Tips */}
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-border-light dark:border-gray-700">
          <h4 className="font-medium text-text-primary dark:text-white mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary-600" />
            Security Tips
          </h4>
          <ul className="space-y-2 text-sm text-text-secondary dark:text-gray-400">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
              Use a unique password that you don't use on other websites
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
              Make sure your password is at least 6 characters long
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
              Never share your password with anyone
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
              Enable two-factor authentication for extra security (coming soon)
            </li>
          </ul>
        </div>
        
        {/* Recent Activity */}
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-border-light dark:border-gray-700">
          <h4 className="font-medium text-text-primary dark:text-white mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary-600" />
            Recent Security Activity
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-text-secondary dark:text-gray-400">Last password change</span>
              <span className="text-text-primary dark:text-white font-medium">{user?.updated_at ? new Date(user.updated_at).toLocaleDateString() : 'Never'}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-text-secondary dark:text-gray-400">Last login</span>
              <span className="text-text-primary dark:text-white font-medium">{user?.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'profile': return <ProfileSection />;
      case 'security': return <SecuritySection />;
      default: return <ProfileSection />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <PasswordModal />
      
      <div className="container mx-auto py-8 px-4">
        
        {/* Tabs - Profile and Security */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-border-light dark:border-gray-700 pb-4">
          {['profile', 'security'].map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setSearchParams({ tab: tab }); }}
              className={`px-5 py-2.5 rounded-xl font-medium transition-all duration-300 capitalize ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-primary-700 to-primary-800 text-white shadow-md'
                  : 'bg-white dark:bg-gray-800 text-text-secondary dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 border border-border-light dark:border-gray-700'
              }`}
            >
              {tab === 'profile' ? 'Profile Information' : 'Security'}
            </button>
          ))}
        </div>
        
        {renderContent()}
      </div>
    </div>
  );
};

export default AdminSettings;