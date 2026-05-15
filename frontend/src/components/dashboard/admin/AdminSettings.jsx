import React, { useState, useEffect } from 'react'
import { User, Mail, Phone, Save, Settings, Globe } from 'lucide-react'
import toast from 'react-hot-toast'

const API_URL = 'http://localhost:8000'

const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    phone: '',
    bio: ''
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_URL}/api/admin/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (!response.ok) throw new Error('Failed to fetch profile')
      
      const data = await response.json()
      setProfile({
        full_name: data.full_name || '',
        email: data.email || '',
        phone: data.phone || '',
        bio: data.bio || ''
      })
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  const updateProfile = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_URL}/api/admin/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profile)
      })
      
      if (!response.ok) throw new Error('Failed to update profile')
      
      toast.success('Profile updated successfully')
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'profile', label: 'Update Profile', icon: User },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Settings</h1>
        <p className="text-gray-500">Manage your profile and platform settings</p>
      </div>

      <div className="flex gap-6">
        <div className="w-64 bg-white rounded-2xl shadow-sm border p-4">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        <div className="flex-1 bg-white rounded-2xl shadow-sm border p-6">
          {activeTab === 'profile' && (
            <div>
              <h2 className="text-xl font-bold mb-6">Update Profile</h2>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Profile Picture</label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {profile.full_name?.charAt(0) || 'A'}
                  </div>
                  <button className="px-4 py-2 border rounded-lg hover:bg-gray-50">Choose File</button>
                </div>
                <p className="text-xs text-gray-500 mt-2">No file chosen</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={profile.full_name}
                    onChange={(e) => setProfile({...profile, full_name: e.target.value})}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={profile.email}
                    className="w-full p-3 border rounded-lg bg-gray-50"
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile({...profile, phone: e.target.value})}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                  <textarea
                    rows="4"
                    value={profile.bio}
                    onChange={(e) => setProfile({...profile, bio: e.target.value})}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Tell us about yourself"
                  />
                </div>
                <button
                  onClick={updateProfile}
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" /> Save Changes
                </button>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div>
              <h2 className="text-xl font-bold mb-6">Platform Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Site Name</label>
                  <input type="text" value="Ethio Real Estate" className="w-full p-3 border rounded-lg bg-gray-50" disabled />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contact Email</label>
                  <input type="email" value="admin@ethiorealestate.com" className="w-full p-3 border rounded-lg bg-gray-50" disabled />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contact Phone</label>
                  <input type="tel" value="+251 911 111 111" className="w-full p-3 border rounded-lg bg-gray-50" disabled />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminSettings