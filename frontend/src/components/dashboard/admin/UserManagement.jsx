import React, { useState, useEffect, useCallback } from 'react'
import { 
  Search, UserX, Eye, Shield, CheckCircle, 
  XCircle, RefreshCw, Mail, Phone, Calendar, 
  User, Home, Briefcase, Users, TrendingUp,
  Crown, Clock, FileText, AlertCircle
} from 'lucide-react'
import toast from 'react-hot-toast'

const API_URL = 'http://localhost:8000'

const UserManagement = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterRole, setFilterRole] = useState('all')
  const [filterVerification, setFilterVerification] = useState('all')
  const [totalUsers, setTotalUsers] = useState(0)
  const [selectedUser, setSelectedUser] = useState(null)
  const [showViewModal, setShowViewModal] = useState(false)

  const [counts, setCounts] = useState({ 
    total: 0,
    fullyActive: 0,
    docApprovedWaitingPayment: 0,
    docsSubmittedPending: 0,
    noDocuments: 0,
    suspended: 0,
    buyers: 0,
    sellers: 0,
    landlords: 0,
    dual: 0,
    users: 0
  })

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        toast.error('Authentication required')
        return
      }
      
      let url = `${API_URL}/api/admin/users?limit=200`
      if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`
      if (filterStatus !== 'all') url += `&status=${filterStatus}`
      
      const response = await fetch(url, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }
      
      const data = await response.json()
      let usersData = data.users || []
      
      usersData = usersData.filter(u => u.role_type !== 'agent' && u.role_type !== 'admin')
      
      if (filterRole !== 'all') {
        usersData = usersData.filter(u => u.role_type === filterRole)
      }
      
      if (filterVerification !== 'all') {
        if (filterVerification === 'fully_active') {
          usersData = usersData.filter(u => u.is_verified === true && u.payment_approved === true)
        } else if (filterVerification === 'doc_approved') {
          usersData = usersData.filter(u => u.is_verified === true && u.payment_approved !== true)
        } else if (filterVerification === 'docs_submitted') {
          usersData = usersData.filter(u => 
            (u.seller_documents_submitted === true || u.landlord_documents_submitted === true) && 
            u.is_verified !== true
          )
        } else if (filterVerification === 'no_docs') {
          usersData = usersData.filter(u => 
            (u.seller_documents_submitted !== true && u.landlord_documents_submitted !== true) && 
            u.is_verified !== true
          )
        }
      }
      
      setUsers(usersData)
      setTotalUsers(usersData.length)
      
      const allUsers = (data.users || []).filter(u => u.role_type !== 'agent' && u.role_type !== 'admin')
      
      const fullyActive = allUsers.filter(u => u.is_verified === true && u.payment_approved === true).length
      const docApprovedWaitingPayment = allUsers.filter(u => u.is_verified === true && u.payment_approved !== true).length
      const docsSubmittedPending = allUsers.filter(u => 
        (u.seller_documents_submitted === true || u.landlord_documents_submitted === true) && 
        u.is_verified !== true
      ).length
      const noDocuments = allUsers.filter(u => 
        (u.seller_documents_submitted !== true && u.landlord_documents_submitted !== true) && 
        u.is_verified !== true
      ).length
      const suspended = allUsers.filter(u => u.status === 'suspended').length
      
      const buyers = allUsers.filter(u => u.role_type === 'buyer').length
      const sellers = allUsers.filter(u => u.role_type === 'seller').length
      const landlords = allUsers.filter(u => u.role_type === 'landlord').length
      const dual = allUsers.filter(u => u.role_type === 'dual').length
      const usersCount = allUsers.filter(u => u.role_type === 'user').length
      
      setCounts({
        total: allUsers.length,
        fullyActive,
        docApprovedWaitingPayment,
        docsSubmittedPending,
        noDocuments,
        suspended,
        buyers,
        sellers,
        landlords,
        dual,
        users: usersCount
      })
      
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error(error.message || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [searchTerm, filterStatus, filterRole, filterVerification])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

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

  const getAccountStatus = (user) => {
    if (user.status === 'suspended') {
      return { label: 'Suspended', color: 'text-red-600', bg: 'bg-red-100', border: 'border-red-200', icon: <XCircle className="w-3 h-3" /> }
    }
    if (user.is_verified === true && user.payment_approved === true) {
      return { label: 'Active', color: 'text-emerald-600', bg: 'bg-emerald-100', border: 'border-emerald-200', icon: <CheckCircle className="w-3 h-3" /> }
    }
    return { label: 'Pending', color: 'text-amber-600', bg: 'bg-amber-100', border: 'border-amber-200', icon: <Clock className="w-3 h-3" /> }
  }

  const getVerificationStatus = (user) => {
    if (user.role_type === 'user' || user.role_type === 'buyer') {
      return { 
        label: 'No Documents', 
        bg: 'bg-gray-100',
        color: 'text-gray-500',
        border: 'border-gray-200',
        subtext: 'Not required'
      }
    }
    
    if (user.payment_approved === true) {
      return { 
        label: 'Fully Active', 
        bg: 'bg-emerald-100',
        color: 'text-emerald-700',
        border: 'border-emerald-200',
        subtext: 'Can list properties'
      }
    }
    
    if (user.is_verified === true) {
      return { 
        label: 'Documents Approved', 
        bg: 'bg-amber-100',
        color: 'text-amber-700',
        border: 'border-amber-200',
        subtext: 'Waiting for payment'
      }
    }
    
    if (user.seller_documents_submitted === true || user.landlord_documents_submitted === true) {
      return { 
        label: 'Documents Pending', 
        bg: 'bg-sky-100',
        color: 'text-sky-700',
        border: 'border-sky-200',
        subtext: 'Waiting for admin approval'
      }
    }
    
    return { 
      label: 'No Documents', 
      bg: 'bg-gray-100',
      color: 'text-gray-500',
      border: 'border-gray-200',
      subtext: 'Not submitted'
    }
  }

  const getRoleGradient = (role) => {
    const gradients = {
      buyer: 'from-rose-500 to-pink-500',
      seller: 'from-violet-500 to-purple-500',
      landlord: 'from-indigo-500 to-blue-500',
      dual: 'from-amber-500 to-orange-500',
      user: 'from-gray-500 to-gray-600'
    }
    return gradients[role] || 'from-gray-500 to-gray-600'
  }

  const getRoleBadge = (role) => {
    const colors = {
      buyer: 'bg-rose-100 text-rose-700',
      seller: 'bg-purple-100 text-purple-700',
      landlord: 'bg-indigo-100 text-indigo-700',
      dual: 'bg-amber-100 text-amber-700',
      user: 'bg-gray-100 text-gray-700'
    }
    return colors[role] || 'bg-gray-100 text-gray-700'
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    const now = new Date()
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const ViewUserModal = () => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowViewModal(false)}>
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">User Details</h2>
          <button onClick={() => setShowViewModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition">
            <XCircle className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        {selectedUser && (
          <div className="p-6">
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200">
              <div className={`w-20 h-20 bg-gradient-to-r ${getRoleGradient(selectedUser.role_type)} rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg`}>
                {selectedUser.full_name?.charAt(0)?.toUpperCase() || selectedUser.username?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{selectedUser.full_name || selectedUser.username}</h3>
                <p className="text-gray-500">@{selectedUser.username}</p>
                <div className="flex gap-2 mt-2">
                  <span className={`px-3 py-1 rounded-lg text-xs font-medium ${getRoleBadge(selectedUser.role_type)}`}>
                    {selectedUser.role_type?.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="mb-6 p-5 rounded-xl bg-gray-50 border border-gray-200">
              <h4 className="font-medium text-gray-900 mb-3">Verification Status</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-white border border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">Documents</p>
                  <p className={`font-medium ${selectedUser.is_verified ? 'text-emerald-600' : 
                    (selectedUser.seller_documents_submitted || selectedUser.landlord_documents_submitted) ? 'text-sky-600' : 'text-gray-500'}`}>
                    {selectedUser.is_verified ? 'Approved' : 
                     (selectedUser.seller_documents_submitted || selectedUser.landlord_documents_submitted) ? 'Pending Review' : 'Not Submitted'}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-white border border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">Payment</p>
                  <p className={`font-medium ${selectedUser.payment_approved ? 'text-emerald-600' : 'text-gray-500'}`}>
                    {selectedUser.payment_approved ? 'Approved' : selectedUser.is_verified ? 'Awaiting Payment' : 'Locked'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Email</p>
                <p className="text-sm text-gray-900">{selectedUser.email}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Phone</p>
                <p className="text-sm text-gray-900">{selectedUser.phone || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Registered</p>
                <p className="text-sm text-gray-900">{formatDate(selectedUser.created_at)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Last Login</p>
                <p className="text-sm text-gray-900">{selectedUser.last_login ? formatDate(selectedUser.last_login) : 'Never'}</p>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-200 flex justify-end">
              <button onClick={() => setShowViewModal(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition">
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="p-8">
        {showViewModal && <ViewUserModal />}
        
        <div className="mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-500 mt-1">Manage and monitor platform users</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition">
            <p className="text-gray-500 text-sm">Total Users</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{counts.total}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border-l-4 border-emerald-500 shadow-sm hover:shadow-md transition">
            <p className="text-gray-500 text-sm">Fully Active</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{counts.fullyActive}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border-l-4 border-amber-500 shadow-sm hover:shadow-md transition">
            <p className="text-gray-500 text-sm">Docs Approved</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{counts.docApprovedWaitingPayment}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border-l-4 border-sky-500 shadow-sm hover:shadow-md transition">
            <p className="text-gray-500 text-sm">Docs Pending</p>
            <p className="text-2xl font-bold text-sky-600 mt-1">{counts.docsSubmittedPending}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border-l-4 border-gray-500 shadow-sm hover:shadow-md transition">
            <p className="text-gray-500 text-sm">No Documents</p>
            <p className="text-2xl font-bold text-gray-600 mt-1">{counts.noDocuments}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border-l-4 border-red-500 shadow-sm hover:shadow-md transition">
            <p className="text-gray-500 text-sm">Suspended</p>
            <p className="text-2xl font-bold text-red-600 mt-1">{counts.suspended}</p>
          </div>
        </div>

        {/* Role Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm">
            <p className="text-gray-500 text-xs">Buyers</p>
            <p className="text-xl font-bold text-rose-600">{counts.buyers}</p>
          </div>
          <div className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm">
            <p className="text-gray-500 text-xs">Sellers</p>
            <p className="text-xl font-bold text-purple-600">{counts.sellers}</p>
          </div>
          <div className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm">
            <p className="text-gray-500 text-xs">Landlords</p>
            <p className="text-xl font-bold text-indigo-600">{counts.landlords}</p>
          </div>
          <div className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm">
            <p className="text-gray-500 text-xs">Dual</p>
            <p className="text-xl font-bold text-amber-600">{counts.dual}</p>
          </div>
          <div className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm">
            <p className="text-gray-500 text-xs">Users</p>
            <p className="text-xl font-bold text-gray-600">{counts.users}</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search users..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
                />
              </div>
            </div>
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)} 
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-700"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
            </select>
            <select 
              value={filterRole} 
              onChange={(e) => setFilterRole(e.target.value)} 
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-700"
            >
              <option value="all">All Roles</option>
              <option value="buyer">Buyer</option>
              <option value="seller">Seller</option>
              <option value="landlord">Landlord</option>
              <option value="dual">Dual</option>
              <option value="user">User</option>
            </select>
            <select 
              value={filterVerification} 
              onChange={(e) => setFilterVerification(e.target.value)} 
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-700"
            >
              <option value="all">All Verification</option>
              <option value="fully_active">Fully Active</option>
              <option value="doc_approved">Documents Approved</option>
              <option value="docs_submitted">Documents Pending</option>
              <option value="no_docs">No Documents</option>
            </select>
            <button 
              onClick={() => fetchUsers()} 
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">User</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Email</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Role</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Verification</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Joined</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading && users.length === 0 ? (
                  [1, 2, 3, 4, 5].map((i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                          <div className="h-4 bg-gray-200 rounded w-24"></div>
                        </div>
                      </td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
                      <td className="px-6 py-4"><div className="h-5 bg-gray-200 rounded w-16"></div></td>
                      <td className="px-6 py-4"><div className="h-5 bg-gray-200 rounded w-28"></div></td>
                      <td className="px-6 py-4"><div className="h-5 bg-gray-200 rounded w-20"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                      <td className="px-6 py-4"><div className="w-8 h-8 bg-gray-200 rounded-lg"></div></td>
                    </tr>
                  ))
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-12 text-gray-400">No users found</td>
                  </tr>
                ) : (
                  users.map((user) => {
                    const verification = getVerificationStatus(user)
                    const accountStatus = getAccountStatus(user)
                    return (
                      <tr key={user.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 bg-gradient-to-r ${getRoleGradient(user.role_type)} rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-lg`}>
                              {user.full_name?.charAt(0)?.toUpperCase() || user.username?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <span className="font-medium text-gray-900">{user.full_name || user.username}</span>
                          </div>
                        </td>
                        <td className="px-6 py-3 text-gray-600 text-sm">{user.email}</td>
                        <td className="px-6 py-3">
                          <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getRoleBadge(user.role_type)}`}>
                            {user.role_type?.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          <div>
                            <span className={`inline-block px-2 py-1 rounded-lg text-xs font-medium ${verification.bg} ${verification.color} border ${verification.border}`}>
                              {verification.label}
                            </span>
                            {verification.subtext && (
                              <p className="text-xs text-gray-500 mt-1">{verification.subtext}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${accountStatus.bg} ${accountStatus.color} border ${accountStatus.border}`}>
                            {accountStatus.icon}
                            {accountStatus.label}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-gray-500 text-sm">{formatDate(user.created_at)}</td>
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => { setSelectedUser(user); setShowViewModal(true); }} 
                              className="p-1.5 rounded-lg hover:bg-gray-100 transition"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4 text-gray-500 hover:text-indigo-600" />
                            </button>
                            {user.status === 'suspended' ? (
                              <button 
                                onClick={() => handleActivateUser(user.id)} 
                                className="p-1.5 rounded-lg hover:bg-emerald-100 transition"
                                title="Activate User"
                              >
                                <CheckCircle className="w-4 h-4 text-gray-500 hover:text-emerald-600" />
                              </button>
                            ) : (
                              <button 
                                onClick={() => handleSuspendUser(user.id)} 
                                className="p-1.5 rounded-lg hover:bg-red-100 transition"
                                title="Suspend User"
                              >
                                <UserX className="w-4 h-4 text-gray-500 hover:text-red-600" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
          
          {users.length > 0 && (
            <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 text-sm text-gray-500">
              Showing {users.length} users
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default UserManagement