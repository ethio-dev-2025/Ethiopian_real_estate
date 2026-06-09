// src/components/dashboard/admin/UserManagement.jsx
import React, { useState, useEffect, useCallback } from 'react'
import { 
  Search, UserX, Eye, Shield, CheckCircle, 
  XCircle, RefreshCw, Mail, Phone, Calendar, 
  User, Home, Briefcase, Users, TrendingUp,
  Crown, Clock, FileText, AlertCircle, Loader
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
  
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null)
  const [confirmUser, setConfirmUser] = useState(null)

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
        setLoading(false)
        return
      }
      
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (filterStatus !== 'all') params.append('status', filterStatus)
      if (filterRole !== 'all') params.append('role', filterRole)
      
      const url = `${API_URL}/api/admin/users?${params.toString()}`
      console.log('📊 Fetching users from:', url)
      
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
      console.log('📊 Users data received:', data)
      
      let usersData = data.users || []
      
      if (!Array.isArray(usersData)) {
        usersData = []
      }
      
      let filteredUsers = [...usersData]
      
      if (filterVerification !== 'all') {
        if (filterVerification === 'fully_active') {
          filteredUsers = filteredUsers.filter(u => u.is_verified === true && u.payment_approved === true)
        } else if (filterVerification === 'doc_approved') {
          filteredUsers = filteredUsers.filter(u => u.is_verified === true && u.payment_approved !== true)
        } else if (filterVerification === 'docs_submitted') {
          filteredUsers = filteredUsers.filter(u => 
            (u.seller_documents_submitted === true || u.landlord_documents_submitted === true) && 
            u.is_verified !== true
          )
        } else if (filterVerification === 'no_docs') {
          filteredUsers = filteredUsers.filter(u => 
            (u.seller_documents_submitted !== true && u.landlord_documents_submitted !== true) && 
            u.is_verified !== true
          )
        }
      }
      
      setUsers(filteredUsers)
      setTotalUsers(filteredUsers.length)
      
      const statsResponse = await fetch(`${API_URL}/api/admin/users/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (statsResponse.ok) {
        const stats = await statsResponse.json()
        setCounts({
          total: stats.total || 0,
          fullyActive: stats.fullyActive || 0,
          docApprovedWaitingPayment: stats.docApprovedWaitingPayment || 0,
          docsSubmittedPending: stats.docsSubmittedPending || 0,
          noDocuments: stats.noDocuments || 0,
          suspended: stats.suspended || 0,
          buyers: stats.buyers || 0,
          sellers: stats.sellers || 0,
          landlords: stats.landlords || 0,
          dual: stats.dual || 0,
          users: stats.users || 0
        })
      }
      
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

  const showSuspendConfirmation = (user) => {
    setConfirmUser(user)
    setConfirmAction('suspend')
    setShowConfirmModal(true)
  }

  const showActivateConfirmation = (user) => {
    setConfirmUser(user)
    setConfirmAction('activate')
    setShowConfirmModal(true)
  }

  const handleSuspendUser = async () => {
    if (!confirmUser) return
    
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_URL}/api/admin/users/${confirmUser.id}/suspend`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        toast.success(`${confirmUser.full_name || confirmUser.username} has been suspended`)
        fetchUsers()
      } else {
        toast.error(data.detail || 'Failed to suspend user')
      }
    } catch (error) {
      console.error('Error suspending user:', error)
      toast.error('Failed to suspend user')
    } finally {
      setShowConfirmModal(false)
      setConfirmUser(null)
      setConfirmAction(null)
    }
  }

  const handleActivateUser = async () => {
    if (!confirmUser) return
    
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_URL}/api/admin/users/${confirmUser.id}/activate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        toast.success(`${confirmUser.full_name || confirmUser.username} has been activated`)
        fetchUsers()
      } else {
        toast.error(data.detail || 'Failed to activate user')
      }
    } catch (error) {
      console.error('Error activating user:', error)
      toast.error('Failed to activate user')
    } finally {
      setShowConfirmModal(false)
      setConfirmUser(null)
      setConfirmAction(null)
    }
  }

  const getAccountStatus = (user) => {
    if (user.status === 'suspended') {
      return { label: 'Suspended', color: 'text-error', bg: 'bg-error/10', border: 'border-error/20', icon: <XCircle className="w-3 h-3" /> }
    }
    if (user.is_verified === true && user.payment_approved === true) {
      return { label: 'Active', color: 'text-success', bg: 'bg-success/10', border: 'border-success/20', icon: <CheckCircle className="w-3 h-3" /> }
    }
    return { label: 'Pending', color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/20', icon: <Clock className="w-3 h-3" /> }
  }

  const getVerificationStatus = (user) => {
    if (user.role_type === 'user' || user.role_type === 'buyer') {
      return { 
        label: 'No Documents', 
        bg: 'bg-gray-100',
        color: 'text-text-muted',
        border: 'border-gray-200',
        subtext: 'Not required'
      }
    }
    
    if (user.payment_approved === true) {
      return { 
        label: 'Fully Active', 
        bg: 'bg-success/10',
        color: 'text-success',
        border: 'border-success/20',
        subtext: 'Can list properties'
      }
    }
    
    if (user.is_verified === true) {
      return { 
        label: 'Documents Approved', 
        bg: 'bg-warning/10',
        color: 'text-warning',
        border: 'border-warning/20',
        subtext: 'Waiting for payment'
      }
    }
    
    if (user.seller_documents_submitted === true || user.landlord_documents_submitted === true) {
      return { 
        label: 'Documents Pending', 
        bg: 'bg-primary-50',
        color: 'text-primary-600',
        border: 'border-primary-200',
        subtext: 'Waiting for admin approval'
      }
    }
    
    return { 
      label: 'No Documents', 
      bg: 'bg-gray-100',
      color: 'text-text-muted',
      border: 'border-gray-200',
      subtext: 'Not submitted'
    }
  }

  const getRoleGradient = (role) => {
    const gradients = {
      buyer: 'from-primary-600 to-primary-700',
      seller: 'from-secondary-500 to-secondary-600',
      landlord: 'from-success to-green-700',
      dual: 'from-warning to-orange-600',
      user: 'from-gray-500 to-gray-600'
    }
    return gradients[role] || 'from-gray-500 to-gray-600'
  }

  const getRoleBadge = (role) => {
    const colors = {
      buyer: 'bg-primary-50 text-primary-700',
      seller: 'bg-secondary-50 text-secondary-700',
      landlord: 'bg-success/10 text-success',
      dual: 'bg-warning/10 text-warning',
      user: 'bg-gray-100 text-text-muted'
    }
    return colors[role] || 'bg-gray-100 text-text-muted'
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

  const ConfirmationModal = () => {
    if (!showConfirmModal || !confirmUser) return null
    
    const isSuspend = confirmAction === 'suspend'
    
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
          <div className={`p-6 border-b ${isSuspend ? 'bg-error/10 border-error/20' : 'bg-success/10 border-success/20'} rounded-t-2xl`}>
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isSuspend ? 'bg-error/20' : 'bg-success/20'}`}>
                {isSuspend ? <UserX className="w-6 h-6 text-error" /> : <CheckCircle className="w-6 h-6 text-success" />}
              </div>
              <h2 className="text-xl font-bold text-text-primary">
                {isSuspend ? 'Suspend User' : 'Activate User'}
              </h2>
            </div>
          </div>
          
          <div className="p-6">
            <p className="text-text-primary mb-4">
              Are you sure you want to <span className={`font-semibold ${isSuspend ? 'text-error' : 'text-success'}`}>
                {isSuspend ? 'SUSPEND' : 'ACTIVATE'}
              </span> this user?
            </p>
            
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 bg-gradient-to-r ${getRoleGradient(confirmUser.role_type)} rounded-lg flex items-center justify-center text-white font-bold`}>
                  {confirmUser.full_name?.charAt(0)?.toUpperCase() || confirmUser.username?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="font-semibold text-text-primary">{confirmUser.full_name || confirmUser.username}</p>
                  <p className="text-sm text-text-muted">{confirmUser.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-text-muted">Role:</span>
                  <span className="ml-2 font-medium">{confirmUser.role_type?.toUpperCase()}</span>
                </div>
                <div>
                  <span className="text-text-muted">Status:</span>
                  <span className={`ml-2 font-medium ${confirmUser.status === 'suspended' ? 'text-error' : 'text-success'}`}>
                    {confirmUser.status || 'Active'}
                  </span>
                </div>
              </div>
            </div>
            
            {isSuspend ? (
              <div className="bg-warning/10 border border-warning/20 rounded-lg p-3 mb-4">
                <p className="text-sm text-warning">
                  ⚠️ Suspending this user will:
                </p>
                <ul className="text-sm text-warning mt-2 list-disc list-inside">
                  <li>Block them from logging in</li>
                  <li>Prevent them from creating new listings</li>
                  <li>Hide their existing listings from public view</li>
                </ul>
              </div>
            ) : (
              <div className="bg-success/10 border border-success/20 rounded-lg p-3 mb-4">
                <p className="text-sm text-success">
                  ✅ Activating this user will:
                </p>
                <ul className="text-sm text-success mt-2 list-disc list-inside">
                  <li>Restore their login access</li>
                  <li>Allow them to create listings again</li>
                  <li>Restore their subscription benefits</li>
                </ul>
              </div>
            )}
          </div>
          
          <div className="p-6 border-t border-border-light bg-gray-50 rounded-b-2xl flex justify-end gap-3">
            <button
              onClick={() => {
                setShowConfirmModal(false)
                setConfirmUser(null)
                setConfirmAction(null)
              }}
              className="px-4 py-2 border border-border-light rounded-xl text-text-secondary font-medium hover:bg-gray-100 transition"
            >
              Cancel
            </button>
            <button
              onClick={isSuspend ? handleSuspendUser : handleActivateUser}
              className={`px-4 py-2 rounded-xl text-white font-medium transition flex items-center gap-2 ${
                isSuspend 
                  ? 'bg-error hover:bg-red-700' 
                  : 'bg-success hover:bg-green-700'
              }`}
            >
              {isSuspend ? <UserX className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
              {isSuspend ? 'Yes, Suspend User' : 'Yes, Activate User'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const ViewUserModal = () => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowViewModal(false)}>
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-border-light" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-border-light p-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-text-primary">User Details</h2>
          <button onClick={() => setShowViewModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition">
            <XCircle className="w-5 h-5 text-text-muted" />
          </button>
        </div>
        {selectedUser && (
          <div className="p-6">
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border-light">
              <div className={`w-20 h-20 bg-gradient-to-r ${getRoleGradient(selectedUser.role_type)} rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg`}>
                {selectedUser.full_name?.charAt(0)?.toUpperCase() || selectedUser.username?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div>
                <h3 className="text-xl font-semibold text-text-primary">{selectedUser.full_name || selectedUser.username}</h3>
                <p className="text-text-muted">@{selectedUser.username}</p>
                <div className="flex gap-2 mt-2">
                  <span className={`px-3 py-1 rounded-lg text-xs font-medium ${getRoleBadge(selectedUser.role_type)}`}>
                    {selectedUser.role_type?.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="mb-6 p-5 rounded-xl bg-gray-50 border border-border-light">
              <h4 className="font-medium text-text-primary mb-3">Verification Status</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-white border border-border-light">
                  <p className="text-xs text-text-muted mb-1">Documents</p>
                  <p className={`font-medium ${selectedUser.is_verified ? 'text-success' : 
                    (selectedUser.seller_documents_submitted || selectedUser.landlord_documents_submitted) ? 'text-primary-600' : 'text-text-muted'}`}>
                    {selectedUser.is_verified ? 'Approved' : 
                     (selectedUser.seller_documents_submitted || selectedUser.landlord_documents_submitted) ? 'Pending Review' : 'Not Submitted'}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-white border border-border-light">
                  <p className="text-xs text-text-muted mb-1">Payment</p>
                  <p className={`font-medium ${selectedUser.payment_approved ? 'text-success' : 'text-text-muted'}`}>
                    {selectedUser.payment_approved ? 'Approved' : selectedUser.is_verified ? 'Awaiting Payment' : 'Locked'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-text-muted mb-1">Email</p>
                <p className="text-sm text-text-primary">{selectedUser.email}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted mb-1">Phone</p>
                <p className="text-sm text-text-primary">{selectedUser.phone || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted mb-1">Registered</p>
                <p className="text-sm text-text-primary">{formatDate(selectedUser.created_at)}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted mb-1">Last Login</p>
                <p className="text-sm text-text-primary">{selectedUser.last_login ? formatDate(selectedUser.last_login) : 'Never'}</p>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-border-light flex justify-end">
              <button onClick={() => setShowViewModal(false)} className="px-4 py-2 bg-gray-100 text-text-secondary rounded-xl hover:bg-gray-200 transition">
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-text-secondary">Loading users...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="p-8">
        <ConfirmationModal />
        {showViewModal && <ViewUserModal />}
        
        <div className="mb-8">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">User Management</h1>
            <p className="text-text-muted mt-1">Manage and monitor platform users</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 border border-border-light shadow-sm hover:shadow-md transition">
            <p className="text-text-muted text-sm">Total Users</p>
            <p className="text-2xl font-bold text-text-primary mt-1">{counts.total}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border-l-4 border-success shadow-sm hover:shadow-md transition">
            <p className="text-text-muted text-sm">Fully Active</p>
            <p className="text-2xl font-bold text-success mt-1">{counts.fullyActive}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border-l-4 border-warning shadow-sm hover:shadow-md transition">
            <p className="text-text-muted text-sm">Docs Approved</p>
            <p className="text-2xl font-bold text-warning mt-1">{counts.docApprovedWaitingPayment}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border-l-4 border-primary-500 shadow-sm hover:shadow-md transition">
            <p className="text-text-muted text-sm">Docs Pending</p>
            <p className="text-2xl font-bold text-primary-600 mt-1">{counts.docsSubmittedPending}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border-l-4 border-gray-500 shadow-sm hover:shadow-md transition">
            <p className="text-text-muted text-sm">No Documents</p>
            <p className="text-2xl font-bold text-text-muted mt-1">{counts.noDocuments}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border-l-4 border-error shadow-sm hover:shadow-md transition">
            <p className="text-text-muted text-sm">Suspended</p>
            <p className="text-2xl font-bold text-error mt-1">{counts.suspended}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-xl p-3 border border-border-light shadow-sm">
            <p className="text-text-muted text-xs">Buyers</p>
            <p className="text-xl font-bold text-primary-600">{counts.buyers}</p>
          </div>
          <div className="bg-white rounded-xl p-3 border border-border-light shadow-sm">
            <p className="text-text-muted text-xs">Sellers</p>
            <p className="text-xl font-bold text-secondary-600">{counts.sellers}</p>
          </div>
          <div className="bg-white rounded-xl p-3 border border-border-light shadow-sm">
            <p className="text-text-muted text-xs">Landlords</p>
            <p className="text-xl font-bold text-success">{counts.landlords}</p>
          </div>
          <div className="bg-white rounded-xl p-3 border border-border-light shadow-sm">
            <p className="text-text-muted text-xs">Dual</p>
            <p className="text-xl font-bold text-warning">{counts.dual}</p>
          </div>
          <div className="bg-white rounded-xl p-3 border border-border-light shadow-sm">
            <p className="text-text-muted text-xs">Users</p>
            <p className="text-xl font-bold text-text-muted">{counts.users}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-border-light shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input 
                  type="text" 
                  placeholder="Search users..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-border-light rounded-lg text-text-primary placeholder-text-muted focus:ring-2 focus:ring-primary-500 focus:border-primary-500" 
                />
              </div>
            </div>
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)} 
              className="px-3 py-2 bg-gray-50 border border-border-light rounded-lg text-text-primary"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
            </select>
            <select 
              value={filterRole} 
              onChange={(e) => setFilterRole(e.target.value)} 
              className="px-3 py-2 bg-gray-50 border border-border-light rounded-lg text-text-primary"
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
              className="px-3 py-2 bg-gray-50 border border-border-light rounded-lg text-text-primary"
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
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-border-light shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-border-light">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-text-muted uppercase">User</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-text-muted uppercase">Email</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-text-muted uppercase">Role</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-text-muted uppercase">Verification</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-text-muted uppercase">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-text-muted uppercase">Joined</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-text-muted uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-12 text-text-muted">
                      <Users className="w-12 h-12 mx-auto mb-3 text-text-muted" />
                      No users found
                    </td>
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
                            <span className="font-medium text-text-primary">{user.full_name || user.username}</span>
                          </div>
                        </td>
                        <td className="px-6 py-3 text-text-secondary text-sm">{user.email}</td>
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
                              <p className="text-xs text-text-muted mt-1">{verification.subtext}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${accountStatus.bg} ${accountStatus.color} border ${accountStatus.border}`}>
                            {accountStatus.icon}
                            {accountStatus.label}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-text-muted text-sm">{formatDate(user.created_at)}</td>
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => { setSelectedUser(user); setShowViewModal(true); }} 
                              className="p-1.5 rounded-lg hover:bg-gray-100 transition"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4 text-text-muted hover:text-primary-600" />
                            </button>
                            {user.status === 'suspended' ? (
                              <button 
                                onClick={() => showActivateConfirmation(user)} 
                                className="p-1.5 rounded-lg hover:bg-success/10 transition"
                                title="Activate User"
                              >
                                <CheckCircle className="w-4 h-4 text-text-muted hover:text-success" />
                              </button>
                            ) : (
                              <button 
                                onClick={() => showSuspendConfirmation(user)} 
                                className="p-1.5 rounded-lg hover:bg-error/10 transition"
                                title="Suspend User"
                              >
                                <UserX className="w-4 h-4 text-text-muted hover:text-error" />
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
            <div className="px-6 py-3 border-t border-border-light bg-gray-50 text-sm text-text-muted">
              Showing {users.length} users
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default UserManagement