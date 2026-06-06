import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  User, Mail, Phone, Calendar, MapPin, Lock, 
  Save, CheckCircle, AlertCircle,
  Camera, Trash2, Eye, EyeOff, Key, X
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import toast from 'react-hot-toast';

const API_URL = 'http://localhost:8000';

const Settings = () => {
  const { user, refreshUser, updateUser } = useAuth();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [imageError, setImageError] = useState(false);
  const fileInputRef = useRef(null);
  
  // Get active section from URL parameter
  const activeSection = searchParams.get('tab') || 'profile';

  // Password modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Profile Form Data
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    username: '',
    phone: '',
    date_of_birth: '',
    region_city: '',
    address: ''
  });

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
        region_city: user.city || user.region || '',
        address: user.address || ''
      });
      setProfileImage(user.avatar_url || null);
    }
  }, [user]);

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
          address: formData.address
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
            region_city: freshUser.city || '',
            address: freshUser.address || ''
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

  const profileImageUrl = getProfileImageUrl();

  // ========== PASSWORD MODAL ==========
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
          const errorMsg = data.detail || data.message || 'Failed to change password';
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
          <div className="p-6 border-b dark:border-gray-700 bg-gradient-to-r from-blue-600 to-purple-600 rounded-t-2xl">
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Password</label>
              <div className="relative">
                <input
                  type={localShowCurrentPassword ? "text" : "password"}
                  value={localCurrentPassword}
                  onChange={(e) => setLocalCurrentPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter your current password"
                  autoComplete="off"
                />
                <button 
                  type="button" 
                  onClick={() => setLocalShowCurrentPassword(!localShowCurrentPassword)} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {localShowCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">New Password</label>
              <div className="relative">
                <input
                  type={localShowNewPassword ? "text" : "password"}
                  value={localNewPassword}
                  onChange={(e) => setLocalNewPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter new password (min 6 characters)"
                  autoComplete="off"
                />
                <button 
                  type="button" 
                  onClick={() => setLocalShowNewPassword(!localShowNewPassword)} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {localShowNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Password must be at least 6 characters</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Confirm New Password</label>
              <div className="relative">
                <input
                  type={localShowConfirmPassword ? "text" : "password"}
                  value={localConfirmPassword}
                  onChange={(e) => setLocalConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12 dark:bg-gray-700 dark:text-white"
                  placeholder="Confirm your new password"
                  autoComplete="off"
                />
                <button 
                  type="button" 
                  onClick={() => setLocalShowConfirmPassword(!localShowConfirmPassword)} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {localShowConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
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
              className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              Cancel
            </button>
            <button 
              onClick={handleLocalChangePassword} 
              disabled={localChangingPassword || localPasswordSuccess} 
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition flex items-center gap-2 disabled:opacity-50"
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
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-6">
        {/* Profile Picture Upload - Centered */}
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
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition"
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
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition"
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
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">City / Region</label>
            <input
              type="text"
              name="region_city"
              value={formData.region_city}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition"
              placeholder="Addis Ababa"
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Address</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none dark:bg-gray-700 dark:text-white transition"
              placeholder="Your full address"
            />
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
  );

  // ========== SECURITY SECTION ==========
  const SecuritySection = () => (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
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
  );

  // Render based on active section - No header/title
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <PasswordModal />
      
      <div className="max-w-3xl mx-auto py-8 px-4">
        {/* Directly show the selected section - No heading */}
        {activeSection === 'profile' ? <ProfileSection /> : <SecuritySection />}
      </div>
    </div>
  );
};

export default Settings;