import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { 
  User, Mail, Phone, Lock, Bell, Moon, Sun,
  Globe, Shield, Save, RefreshCw, Eye, EyeOff,
  CheckCircle, AlertCircle, Languages, Smartphone,
  Palette, Volume2, VolumeX, CreditCard, Trash2
} from 'lucide-react'
import toast from 'react-hot-toast'

const API_URL = 'http://localhost:8000'

const SettingsPage = () => {
  const { user, updateUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  })
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [settings, setSettings] = useState({
    theme: 'light',
    language: 'en',
    notifications_enabled: true,
    email_notifications: true,
    two_factor_enabled: false,
    sound_enabled: true
  })

  const getToken = () => localStorage.getItem('access_token')

  const fetchSettings = async () => {
    try {
      const token = getToken()
      const response = await fetch(`${API_URL}/api/dashboard/settings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.success) {
        setSettings(data.settings)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const saveSettings = async () => {
    setSaving(true)
    try {
      const token = getToken()
      const response = await fetch(`${API_URL}/api/dashboard/settings`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      })
      const data = await response.json()
      if (data.success) {
        toast.success('Settings saved successfully')
        // Apply theme if changed
        if (settings.theme === 'dark') {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      } else {
        toast.error('Failed to save settings')
      }
    } catch (error) {
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const changePassword = async () => {
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('New passwords do not match')
      return
    }
    if (passwordData.new_password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    
    try {
      const token = getToken()
      const response = await fetch(`${API_URL}/api/dashboard/settings/change-password`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          current_password: passwordData.current_password,
          new_password: passwordData.new_password
        })
      })
      const data = await response.json()
      if (data.success) {
        toast.success('Password changed successfully')
        setPasswordData({
          current_password: '',
          new_password: '',
          confirm_password: ''
        })
      } else {
        toast.error(data.detail || 'Failed to change password')
      }
    } catch (error) {
      toast.error('Failed to change password')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Section */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-blue-600" />
          Profile Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              value={user?.full_name || ''}
              disabled
              className="w-full p-3 border rounded-lg bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              type="text"
              value={user?.username || ''}
              disabled
              className="w-full p-3 border rounded-lg bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              <Mail className="w-4 h-4" /> Email
            </label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full p-3 border rounded-lg bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              <Smartphone className="w-4 h-4" /> Phone
            </label>
            <input
              type="tel"
              value={user?.phone || ''}
              disabled
              className="w-full p-3 border rounded-lg bg-gray-50"
            />
          </div>
        </div>
        <div className="mt-4 pt-4 border-t flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-500">Role: <span className="capitalize font-medium">{user?.role_type}</span></p>
            <p className="text-sm text-gray-500">Status: 
              <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                user?.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {user?.status || 'Pending'}
              </span>
            </p>
          </div>
          <button className="text-sm text-blue-600 hover:text-blue-700">Edit Profile</button>
        </div>
      </div>

      {/* Password Change */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Lock className="w-5 h-5 text-red-600" />
          Change Password
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
            <div className="relative">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={passwordData.current_password}
                onChange={(e) => setPasswordData({...passwordData, current_password: e.target.value})}
                className="w-full p-3 border rounded-lg pr-10 focus:ring-2 focus:ring-red-500"
                placeholder="Enter current password"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={passwordData.new_password}
                onChange={(e) => setPasswordData({...passwordData, new_password: e.target.value})}
                className="w-full p-3 border rounded-lg pr-10 focus:ring-2 focus:ring-red-500"
                placeholder="Enter new password (min 6 characters)"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
            <input
              type="password"
              value={passwordData.confirm_password}
              onChange={(e) => setPasswordData({...passwordData, confirm_password: e.target.value})}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500"
              placeholder="Confirm new password"
            />
          </div>
          <button
            onClick={changePassword}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Update Password
          </button>
        </div>
      </div>

      {/* Appearance Preferences */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Palette className="w-5 h-5 text-purple-600" />
          Appearance
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
            <div className="flex gap-3">
              <button
                onClick={() => setSettings({...settings, theme: 'light'})}
                className={`flex-1 p-3 rounded-lg border-2 transition flex items-center justify-center gap-2 ${
                  settings.theme === 'light' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Sun className="w-5 h-5 text-yellow-500" />
                <span>Light</span>
              </button>
              <button
                onClick={() => setSettings({...settings, theme: 'dark'})}
                className={`flex-1 p-3 rounded-lg border-2 transition flex items-center justify-center gap-2 ${
                  settings.theme === 'dark' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Moon className="w-5 h-5 text-gray-700" />
                <span>Dark</span>
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
              <Languages className="w-4 h-4" /> Language
            </label>
            <select
              value={settings.language}
              onChange={(e) => setSettings({...settings, language: e.target.value})}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="en">English</option>
              <option value="am">አማርኛ (Amharic)</option>
              <option value="fr">Français</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5 text-orange-600" />
          Notifications
        </h2>
        <div className="space-y-3">
          <label className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-gray-500" />
              <div>
                <p className="font-medium">Push Notifications</p>
                <p className="text-sm text-gray-500">Receive notifications about messages and updates</p>
              </div>
            </div>
            <button
              onClick={() => setSettings({...settings, notifications_enabled: !settings.notifications_enabled})}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                settings.notifications_enabled ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                settings.notifications_enabled ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </label>

          <label className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-gray-500" />
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-gray-500">Receive email updates about your account</p>
              </div>
            </div>
            <button
              onClick={() => setSettings({...settings, email_notifications: !settings.email_notifications})}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                settings.email_notifications ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                settings.email_notifications ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </label>

          <label className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
            <div className="flex items-center gap-3">
              {settings.sound_enabled ? <Volume2 className="w-5 h-5 text-gray-500" /> : <VolumeX className="w-5 h-5 text-gray-500" />}
              <div>
                <p className="font-medium">Sound Alerts</p>
                <p className="text-sm text-gray-500">Play sound for new messages</p>
              </div>
            </div>
            <button
              onClick={() => setSettings({...settings, sound_enabled: !settings.sound_enabled})}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                settings.sound_enabled ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                settings.sound_enabled ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </label>
        </div>
      </div>

      {/* Security Settings */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-green-600" />
          Security
        </h2>
        <label className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-gray-500" />
            <div>
              <p className="font-medium">Two-Factor Authentication</p>
              <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
            </div>
          </div>
          <button
            onClick={() => setSettings({...settings, two_factor_enabled: !settings.two_factor_enabled})}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
              settings.two_factor_enabled ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
              settings.two_factor_enabled ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
        </label>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-50 rounded-xl border border-red-200 p-6">
        <h2 className="text-xl font-bold mb-2 flex items-center gap-2 text-red-700">
          <Trash2 className="w-5 h-5" />
          Danger Zone
        </h2>
        <p className="text-sm text-red-600 mb-4">Permanently delete your account and all associated data</p>
        <button
          onClick={() => {
            if (window.confirm('Are you absolutely sure? This action cannot be undone.')) {
              toast.error('Account deletion not implemented in demo')
            }
          }}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
        >
          Delete Account
        </button>
      </div>

      {/* Save Button */}
      <div className="sticky bottom-6">
        <button
          onClick={saveSettings}
          disabled={saving}
          className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Save All Settings
            </>
          )}
        </button>
      </div>
    </div>
  )
}

export default SettingsPage