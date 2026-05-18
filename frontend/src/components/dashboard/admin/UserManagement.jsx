// src/components/dashboard/admin/UserManagement.jsx
import React, { useState, useEffect, useCallback } from 'react'
import { Search, UserCheck, UserX, Trash2, Eye, Shield, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

const API_URL = 'http://localhost:8000'

const UserManagement = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [totalUsers, setTotalUsers] = useState(0)
  const [selectedUser, setSelectedUser] = useState(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [counts, setCounts] = useState({ total: 0, verified: 0, unverified: 0, suspended: 0 })

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('access_token')
      if (!token) return
      
      const url = `${API_URL}/api/admin/users?search=${encodeURIComponent(searchTerm)}&status=${filterStatus !== 'all' ? filterStatus : ''}`
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (!response.ok) throw new Error('Failed to fetch users')
      
      const data = await response.json()
      const usersData = data.users || []
      const total = data.total || 0
      
      setUsers(usersData)
      setTotalUsers(total)
      
      const verifiedCount = usersData.filter(u => u.is_verified && u.status === 'active').length
      const unverifiedCount = usersData.filter(u => !u.is_verified && u.status !== 'suspended').length
      const suspendedCount = usersData.filter(u => u.status === 'suspended').length
      
      setCounts({
        total: total,
        verified: verifiedCount,
        unverified: unverifiedCount,
        suspended: suspendedCount
      })
      
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [searchTerm, filterStatus])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleVerifyUser = async (userId) => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_URL}/api/admin/users/${userId}/verify`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        toast.success('User verified successfully')
        fetchUsers()
      } else {
        toast.error(data.detail || 'Failed to verify user')
      }
    } catch (error) {
      console.error('Error verifying user:', error)
      toast.error('Failed to verify user')
    }
  }

  const handleSuspendUser = async (userId) => {
    if (!window.confirm('Are you sure you want to suspend this user?')) return
    
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_URL}/api/admin/users/${userId}/suspend`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        toast.success('User suspended successfully')
        fetchUsers()
      } else {
        toast.error(data.detail || 'Failed to suspend user')
      }
    } catch (error) {
      console.error('Error suspending user:', error)
      toast.error('Failed to suspend user')
    }
  }

  const handleActivateUser = async (userId) => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_URL}/api/admin/users/${userId}/activate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        toast.success('User activated successfully')
        fetchUsers()
      } else {
        toast.error(data.detail || 'Failed to activate user')
      }
    } catch (error) {
      console.error('Error activating user:', error)
      toast.error('Failed to activate user')
    }
  }

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return
    
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_URL}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        toast.success('User deleted successfully')
        fetchUsers()
      } else {
        toast.error(data.detail || 'Failed to delete user')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error('Failed to delete user')
    }
  }

  const getStatusBadge = (statusDisplay, isVerified, status) => {
    if (isVerified && status === 'active') {
      return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs flex items-center gap-1"><CheckCircle className="w-3 h-3" />Verified</span>
    }
    if (status === 'active') {
      return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs flex items-center gap-1"><Shield className="w-3 h-3" />Active</span>
    }
    if (status === 'suspended') {
      return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs flex items-center gap-1"><XCircle className="w-3 h-3" />Suspended</span>
    }
    return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" />Pending</span>
  }

  const ViewUserModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center gap-2"><Eye className="w-5 h-5 text-blue-600" />User Details</h2>
          <button onClick={() => setShowViewModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><XCircle className="w-5 h-5 text-gray-500" /></button>
        </div>
        {selectedUser && (
          <div className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {selectedUser.full_name?.charAt(0)?.toUpperCase() || selectedUser.username?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div>
                <h3 className="text-xl font-semibold">{selectedUser.full_name || selectedUser.username}</h3>
                <p className="text-gray-500">@{selectedUser.username}</p>
                {getStatusBadge(selectedUser.status_display, selectedUser.is_verified, selectedUser.status)}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="border-b pb-2"><p className="text-sm text-gray-500">Email</p><p className="font-medium">{selectedUser.email}</p></div>
              <div className="border-b pb-2"><p className="text-sm text-gray-500">Phone</p><p className="font-medium">{selectedUser.phone || 'Not provided'}</p></div>
              <div className="border-b pb-2"><p className="text-sm text-gray-500">Role</p><p className="font-medium capitalize">{selectedUser.role_type}</p></div>
              <div className="border-b pb-2"><p className="text-sm text-gray-500">Registered</p><p className="font-medium">{selectedUser.registered_date}</p></div>
              <div className="border-b pb-2"><p className="text-sm text-gray-500">Last Login</p><p className="font-medium">{selectedUser.last_login ? new Date(selectedUser.last_login).toLocaleDateString() : 'Never'}</p></div>
              <div className="border-b pb-2"><p className="text-sm text-gray-500">Verified</p><p className="font-medium">{selectedUser.is_verified ? 'Yes' : 'No'}</p></div>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  // IMMEDIATE SKELETON - Shows content right away
  return (
    <div className="p-6">
      {showViewModal && <ViewUserModal />}
      
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-500">Manage all registered users</p>
      </div>

      {/* Stats Cards - Always visible, shows skeleton while loading */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-sm text-gray-500">Total Users</p>
          <p className="text-2xl font-bold text-gray-900">
            {loading ? <span className="inline-block w-16 h-8 bg-gray-200 rounded animate-pulse"></span> : totalUsers}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-sm text-gray-500">Verified</p>
          <p className="text-2xl font-bold text-green-600">
            {loading ? <span className="inline-block w-16 h-8 bg-gray-200 rounded animate-pulse"></span> : counts.verified}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-sm text-gray-500">Unverified</p>
          <p className="text-2xl font-bold text-yellow-600">
            {loading ? <span className="inline-block w-16 h-8 bg-gray-200 rounded animate-pulse"></span> : counts.unverified}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-sm text-gray-500">Suspended</p>
          <p className="text-2xl font-bold text-red-600">
            {loading ? <span className="inline-block w-16 h-8 bg-gray-200 rounded animate-pulse"></span> : counts.suspended}
          </p>
        </div>
      </div>

      {/* Search and Filter - Always visible */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by name or email..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" 
          />
        </div>
        <select 
          value={filterStatus} 
          onChange={(e) => setFilterStatus(e.target.value)} 
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="suspended">Suspended</option>
        </select>
        <button 
          onClick={() => fetchUsers()} 
          disabled={loading}
          className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* Users Table - Shows skeleton rows while loading */}
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr><th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">USER</th><th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">EMAIL</th><th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">REGISTERED</th><th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">STATUS</th><th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">ACTIONS</th></tr>
            </thead>
            <tbody className="divide-y">
              {loading && users.length === 0 ? (
                // Skeleton rows
                [1, 2, 3, 4, 5].map(i => (
                  <tr key={i} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div><div><div className="h-4 bg-gray-200 rounded w-24 mb-1 animate-pulse"></div><div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div></div></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div></td>
                    <td className="px-6 py-4"><div className="h-5 bg-gray-200 rounded-full w-16 animate-pulse"></div></td>
                    <td className="px-6 py-4"><div className="flex gap-2"><div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse"></div><div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse"></div><div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse"></div></div></td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-12 text-gray-500">No users found</td></tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">{user.full_name?.charAt(0)?.toUpperCase() || user.username?.charAt(0)?.toUpperCase() || 'U'}</div><div><p className="font-medium text-gray-900">{user.full_name || user.username}</p><p className="text-xs text-gray-500">@{user.username}</p></div></div></td>
                    <td className="px-6 py-4 text-gray-600">{user.email}</td>
                    <td className="px-6 py-4 text-gray-600">{user.registered_date}</td>
                    <td className="px-6 py-4">{getStatusBadge(user.status_display, user.is_verified, user.status)}</td>
                    <td className="px-6 py-4"><div className="flex items-center gap-2"><button onClick={() => { setSelectedUser(user); setShowViewModal(true) }} className="p-2 hover:bg-blue-50 rounded-lg transition" title="View Details"><Eye className="w-4 h-4 text-blue-500" /></button>{!user.is_verified && user.status !== 'suspended' && (<button onClick={() => handleVerifyUser(user.id)} className="p-2 hover:bg-green-50 rounded-lg transition" title="Verify User"><UserCheck className="w-4 h-4 text-green-500" /></button>)}{user.status === 'suspended' ? (<button onClick={() => handleActivateUser(user.id)} className="p-2 hover:bg-blue-50 rounded-lg transition" title="Activate User"><Shield className="w-4 h-4 text-blue-500" /></button>) : (user.status !== 'suspended' && (<button onClick={() => handleSuspendUser(user.id)} className="p-2 hover:bg-red-50 rounded-lg transition" title="Suspend User"><UserX className="w-4 h-4 text-red-500" /></button>))}<button onClick={() => handleDeleteUser(user.id)} className="p-2 hover:bg-red-50 rounded-lg transition" title="Delete User"><Trash2 className="w-4 h-4 text-red-500" /></button></div></td>
                  </tr>
                ))
              )}
            </tbody>
           </table>
        </div>
      </div>
    </div>
  )
}

export default UserManagement