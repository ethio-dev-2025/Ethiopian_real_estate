import React, { useState, useEffect } from 'react'
import { Settings, User, Mail, Phone, Shield, CheckCircle, Save } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import toast from 'react-hot-toast'

const API_URL = 'http://localhost:8000'

const SellerSettings = () => {
  const { user, updateUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [profile, setProfile] = useState({
    full_name: '',
    username: '',
    email: '',
    phone: ''
  })

  useEffect(() => {
    if (user) {
      setProfile({
        full_name: user.full_name || '',
        username: user.username || '',
        email: user.email || '',
        phone: user.phone || ''
      })
    }
  }, [user])

  const handleUpdateProfile = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_URL}/api/auth/update-profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          full_name: profile.full_name,
          phone: profile.phone,
          username: profile.username
        })
      })
      
      const data = await response.json()
      if (data.success) {
        const updatedUser = { ...user, ...profile }
        updateUser(updatedUser)
        localStorage.setItem('user', JSON.stringify(updatedUser))
        toast.success('Profile updated successfully')
        setIsEditing(false)
      } else {
        toast.error(data.message || 'Failed to update profile')
      }
    } catch (error) {
      toast.error('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="w-6 h-6 text-gray-700" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500 text-sm">Manage your account preferences</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-6 border-b bg-gray-50 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" /> Profile Information
            </h2>
            <p className="text-sm text-gray-500">Update your personal details</p>
          </div>
          {!isEditing ? (
            <button onClick={() => setIsEditing(true)} className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition">
              Edit Profile
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => { setIsEditing(false); setProfile({ full_name: user?.full_name || '', username: user?.username || '', email: user?.email || '', phone: user?.phone || '' }) }} className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                Cancel
              </button>
              <button onClick={handleUpdateProfile} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2">
                <Save className="w-4 h-4" /> {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input type="text" value={profile.full_name} onChange={(e) => setProfile({...profile, full_name: e.target.value})} disabled={!isEditing} className={`w-full p-2 border rounded-lg ${!isEditing ? 'bg-gray-50 text-gray-600' : 'bg-white'}`} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input type="text" value={profile.username} onChange={(e) => setProfile({...profile, username: e.target.value})} disabled={!isEditing} className={`w-full p-2 border rounded-lg ${!isEditing ? 'bg-gray-50 text-gray-600' : 'bg-white'}`} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2"><Mail className="w-4 h-4" /> Email</label>
            <input type="email" value={profile.email} disabled className="w-full p-2 border rounded-lg bg-gray-50 text-gray-600" />
            <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2"><Phone className="w-4 h-4" /> Phone</label>
            <input type="tel" value={profile.phone} onChange={(e) => setProfile({...profile, phone: e.target.value})} disabled={!isEditing} className={`w-full p-2 border rounded-lg ${!isEditing ? 'bg-gray-50 text-gray-600' : 'bg-white'}`} />
          </div>
        </div>

        <div className="p-6 border-t bg-gray-50">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-600" />
            <span className="text-sm text-gray-600">Account Status:</span>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${user?.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
              <CheckCircle className="w-3 h-3" /> {user?.status === 'active' ? 'Active' : 'Pending'}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-2">Account type: Seller & Landlord</p>
        </div>
      </div>
    </div>
  )
}

export default SellerSettings