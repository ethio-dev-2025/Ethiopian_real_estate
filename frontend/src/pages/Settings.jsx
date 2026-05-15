import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import AppSidebar from '../components/layout/AppSidebar'
import { Save, User, Mail, Phone, MapPin, Lock, Eye, EyeOff, Bell, Globe, CreditCard } from 'lucide-react'
import toast from 'react-hot-toast'

const API_URL = 'http://localhost:8000'

const Settings = () => {
  const { user, updateUser } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [loading, setLoading] = useState(false)
  const [activeSection, setActiveSection] = useState('profile')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const [profileData, setProfileData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    username: user?.username || '',
    city: user?.city || '',
    region: user?.region || '',
    bio: user?.bio || ''
  })
  
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  })
  
  const [notificationSettings, setNotificationSettings] = useState({
    email_notifications: true,
    push_notifications: true,
    message_alerts: true,
    listing_alerts: true,
    payment_alerts: true
  })

  const getToken = () => localStorage.getItem('access_token')

  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const token = getToken()
      const response = await fetch(`${API_URL}/api/users/profile`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
      })
      const data = await response.json()
      if (data.success) {
        toast.success('Profile updated successfully')
        const userResponse = await fetch(`${API_URL}/api/auth/me`, { headers: { 'Authorization': `Bearer ${token}` } })
        const userData = await userResponse.json()
        localStorage.setItem('user', JSON.stringify(userData))
        if (updateUser) updateUser(userData)
      } else { toast.error('Failed to update profile') }
    } catch (error) { toast.error('Failed to update profile') } finally { setLoading(false) }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    if (passwordData.new_password !== passwordData.confirm_password) { toast.error('Passwords do not match'); return }
    if (passwordData.new_password.length < 6) { toast.error('Password must be at least 6 characters'); return }
    setLoading(true)
    try {
      const token = getToken()
      const response = await fetch(`${API_URL}/api/users/change-password`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_password: passwordData.current_password, new_password: passwordData.new_password })
      })
      const data = await response.json()
      if (data.success) { toast.success('Password changed successfully'); setPasswordData({ current_password: '', new_password: '', confirm_password: '' })
      } else { toast.error(data.message || 'Failed to change password') }
    } catch (error) { toast.error('Failed to change password') } finally { setLoading(false) }
  }

  const sections = [
    { id: 'profile', label: 'Profile Settings', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'preferences', label: 'Preferences', icon: Globe }
  ]

  return (
    <div className="min-h-screen bg-gray-100">
      <AppSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      <main className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <div className="bg-white border-b px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500">Manage your account settings and preferences</p>
        </div>

        <div className="p-6">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Sidebar */}
              <div className="w-full md:w-64 bg-white rounded-xl shadow-sm border p-4">
                {sections.map(section => {
                  const Icon = section.icon
                  return (
                    <button key={section.id} onClick={() => setActiveSection(section.id)} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition mb-1 ${activeSection === section.id ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}>
                      <Icon className="w-4 h-4" /><span className="text-sm">{section.label}</span>
                    </button>
                  )
                })}
              </div>

              {/* Content */}
              <div className="flex-1 bg-white rounded-xl shadow-sm border p-6">
                {activeSection === 'profile' && (
                  <form onSubmit={handleProfileUpdate} className="space-y-6">
                    <h2 className="text-xl font-bold">Profile Settings</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div><label className="block text-sm font-medium mb-2">Full Name</label><input type="text" value={profileData.full_name} onChange={(e) => setProfileData({...profileData, full_name: e.target.value})} className="w-full p-3 border rounded-lg" /></div>
                      <div><label className="block text-sm font-medium mb-2">Username</label><input type="text" value={profileData.username} disabled className="w-full p-3 border rounded-lg bg-gray-50" /></div>
                      <div><label className="block text-sm font-medium mb-2">Email</label><input type="email" value={profileData.email} disabled className="w-full p-3 border rounded-lg bg-gray-50" /></div>
                      <div><label className="block text-sm font-medium mb-2">Phone</label><input type="tel" value={profileData.phone} onChange={(e) => setProfileData({...profileData, phone: e.target.value})} className="w-full p-3 border rounded-lg" /></div>
                      <div><label className="block text-sm font-medium mb-2">City</label><input type="text" value={profileData.city} onChange={(e) => setProfileData({...profileData, city: e.target.value})} className="w-full p-3 border rounded-lg" /></div>
                      <div><label className="block text-sm font-medium mb-2">Region</label><input type="text" value={profileData.region} onChange={(e) => setProfileData({...profileData, region: e.target.value})} className="w-full p-3 border rounded-lg" /></div>
                      <div className="md:col-span-2"><label className="block text-sm font-medium mb-2">Bio</label><textarea rows="3" value={profileData.bio} onChange={(e) => setProfileData({...profileData, bio: e.target.value})} className="w-full p-3 border rounded-lg" /></div>
                    </div>
                    <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"><Save className="w-4 h-4" />{loading ? 'Saving...' : 'Save Changes'}</button>
                  </form>
                )}

                {activeSection === 'security' && (
                  <form onSubmit={handlePasswordChange} className="space-y-6">
                    <h2 className="text-xl font-bold">Security Settings</h2>
                    <div><label className="block text-sm font-medium mb-2">Current Password</label><input type="password" value={passwordData.current_password} onChange={(e) => setPasswordData({...passwordData, current_password: e.target.value})} className="w-full p-3 border rounded-lg" required /></div>
                    <div><label className="block text-sm font-medium mb-2">New Password</label><div className="relative"><input type={showPassword ? "text" : "password"} value={passwordData.new_password} onChange={(e) => setPasswordData({...passwordData, new_password: e.target.value})} className="w-full p-3 border rounded-lg pr-10" /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2">{showPassword ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}</button></div></div>
                    <div><label className="block text-sm font-medium mb-2">Confirm Password</label><div className="relative"><input type={showConfirmPassword ? "text" : "password"} value={passwordData.confirm_password} onChange={(e) => setPasswordData({...passwordData, confirm_password: e.target.value})} className="w-full p-3 border rounded-lg pr-10" /><button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2">{showConfirmPassword ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}</button></div></div>
                    <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">Change Password</button>
                  </form>
                )}

                {activeSection === 'notifications' && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-bold">Notification Preferences</h2>
                    <div className="space-y-4">
                      {Object.entries(notificationSettings).map(([key, value]) => (
                        <div key={key} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                          <div><p className="font-medium capitalize">{key.replace('_', ' ')}</p><p className="text-sm text-gray-500">Receive notifications for {key.replace('_', ' ')}</p></div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={value} onChange={(e) => setNotificationSettings({...notificationSettings, [key]: e.target.checked})} className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => toast.success('Preferences saved')} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Save className="w-4 h-4 inline mr-2" />Save Preferences</button>
                  </div>
                )}

                {activeSection === 'preferences' && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-bold">Preferences</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div><label className="block text-sm font-medium mb-2">Language</label><select className="w-full p-3 border rounded-lg"><option value="en">English</option><option value="am">አማርኛ</option></select></div>
                      <div><label className="block text-sm font-medium mb-2">Currency</label><select className="w-full p-3 border rounded-lg"><option value="ETB">ETB - Ethiopian Birr</option><option value="USD">USD - US Dollar</option></select></div>
                      <div><label className="block text-sm font-medium mb-2">Timezone</label><select className="w-full p-3 border rounded-lg"><option value="Africa/Addis_Ababa">Africa/Addis Ababa (GMT+3)</option><option value="America/New_York">America/New York (GMT-5)</option></select></div>
                      <div><label className="block text-sm font-medium mb-2">Date Format</label><select className="w-full p-3 border rounded-lg"><option value="MM/DD/YYYY">MM/DD/YYYY</option><option value="DD/MM/YYYY">DD/MM/YYYY</option><option value="YYYY-MM-DD">YYYY-MM-DD</option></select></div>
                    </div>
                    <button onClick={() => toast.success('Preferences saved')} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Save className="w-4 h-4 inline mr-2" />Save Preferences</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Settings