import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import AppSidebar from '../../components/layout/AppSidebar'
import { 
  Users, CheckCircle, XCircle, Clock, Eye, 
  Mail, Phone, Building2, Briefcase,
  Loader, Check, X, UserCheck, RefreshCw, AlertTriangle
} from 'lucide-react'
import toast from 'react-hot-toast'

const API_URL = 'http://localhost:8000'

const VerificationQueue = () => {
  const { user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [filter, setFilter] = useState('pending')

  useEffect(() => {
    fetchRequests()
  }, [filter])

  const fetchRequests = async () => {
    setLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem('access_token')
      
      if (!token) {
        throw new Error('No authentication token found')
      }
      
      const endpoint = filter === 'pending' 
        ? `${API_URL}/api/activation/admin/pending-requests`
        : `${API_URL}/api/activation/admin/all-requests`
      
      console.log('Fetching from:', endpoint)
      
      const response = await fetch(endpoint, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      console.log('Response status:', response.status)
      
      if (response.status === 401) {
        throw new Error('Authentication failed. Please login again.')
      }
      
      if (response.status === 403) {
        throw new Error('Admin access required. You do not have permission to view this page.')
      }
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('Raw response data:', data)
      
      // Handle the response - if it's an array, use it directly
      let requestsList = []
      
      if (Array.isArray(data)) {
        requestsList = data
      } else if (data && typeof data === 'object') {
        // Check if it's an error object
        if (data.detail) {
          throw new Error(data.detail)
        }
        // If it has a data property that's an array
        if (data.data && Array.isArray(data.data)) {
          requestsList = data.data
        }
        // If it has a requests property that's an array
        else if (data.requests && Array.isArray(data.requests)) {
          requestsList = data.requests
        }
        // If it's a single request object
        else if (data.id) {
          requestsList = [data]
        }
        // Otherwise try to use as is, but log warning
        else {
          console.warn('Unexpected response format:', data)
          requestsList = []
        }
      }
      
      console.log('Processed requests list:', requestsList.length, 'items')
      setRequests(requestsList)
      
    } catch (error) {
      console.error('Failed to fetch verifications:', error)
      setError(error.message)
      toast.error(error.message || 'Failed to load verification requests')
      setRequests([])
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (requestId) => {
    try {
      const token = localStorage.getItem('access_token')
      
      const response = await fetch(`${API_URL}/api/activation/admin/approve/${requestId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        toast.success('Activation request approved successfully!')
        fetchRequests()
        setSelectedRequest(null)
      } else {
        toast.error(data.detail || data.message || 'Failed to approve request')
      }
    } catch (error) {
      console.error('Error approving:', error)
      toast.error('Failed to approve request')
    }
  }

  const handleReject = async (requestId) => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection')
      return
    }
    
    try {
      const token = localStorage.getItem('access_token')
      
      const response = await fetch(`${API_URL}/api/activation/admin/reject/${requestId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ rejection_reason: rejectionReason })
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        toast.success('Activation request rejected')
        fetchRequests()
        setShowRejectModal(false)
        setRejectionReason('')
        setSelectedRequest(null)
      } else {
        toast.error(data.detail || data.message || 'Failed to reject request')
      }
    } catch (error) {
      console.error('Error rejecting:', error)
      toast.error('Failed to reject request')
    }
  }

  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending':
        return <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs"><Clock className="w-3 h-3" />Pending</span>
      case 'approved':
        return <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs"><CheckCircle className="w-3 h-3" />Approved</span>
      case 'rejected':
        return <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs"><XCircle className="w-3 h-3" />Rejected</span>
      default:
        return <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">{status}</span>
    }
  }

  const RequestDetailModal = ({ request, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center gap-2"><Users className="w-5 h-5 text-blue-600" />Activation Request Details</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><XCircle className="w-5 h-5" /></button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="border-b pb-4">
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2"><UserCheck className="w-4 h-4 text-blue-600" />Personal Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-sm text-gray-500">Full Name</p><p className="font-medium">{request.full_name || request.user_name || 'N/A'}</p></div>
              <div><p className="text-sm text-gray-500">Email</p><p className="font-medium">{request.email || request.user_email || 'N/A'}</p></div>
              <div><p className="text-sm text-gray-500">Phone</p><p className="font-medium">{request.phone_number || 'N/A'}</p></div>
              <div><p className="text-sm text-gray-500">Submitted</p><p className="font-medium">{request.created_at ? new Date(request.created_at).toLocaleDateString() : 'N/A'}</p></div>
            </div>
          </div>
          
          <div className="border-b pb-4">
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2"><Building2 className="w-4 h-4 text-blue-600" />Property Information</h3>
            <div className="space-y-2">
              <div><p className="text-sm text-gray-500">Property Address</p><p className="font-medium">{request.property_address || 'N/A'}</p></div>
              <div><p className="text-sm text-gray-500">Property Type</p><p className="font-medium">{request.property_type || 'N/A'}</p></div>
            </div>
          </div>
          
          {(request.business_name || request.reason_for_activation) && (
            <div className="border-b pb-4">
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2"><Briefcase className="w-4 h-4 text-blue-600" />Additional Information</h3>
              <div className="space-y-2">
                {request.business_name && <div><p className="text-sm text-gray-500">Business Name</p><p className="font-medium">{request.business_name}</p></div>}
                {request.reason_for_activation && <div><p className="text-sm text-gray-500">Reason for Activation</p><p className="font-medium">{request.reason_for_activation}</p></div>}
              </div>
            </div>
          )}
          
          <div>
            <h3 className="font-semibold text-lg mb-3">Status</h3>
            <div className="flex items-center gap-2 mb-4">{getStatusBadge(request.status)}</div>
            {request.rejection_reason && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-700"><strong>Rejection Reason:</strong> {request.rejection_reason}</p>
              </div>
            )}
          </div>
          
          {request.status === 'pending' && (
            <div className="flex gap-3 pt-4 border-t">
              <button onClick={() => handleApprove(request.id)} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 flex items-center justify-center gap-2">
                <CheckCircle className="w-4 h-4" /> Approve
              </button>
              <button onClick={() => {
                setSelectedRequest(request)
                setShowRejectModal(true)
                onClose()
              }} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 flex items-center justify-center gap-2">
                <XCircle className="w-4 h-4" /> Reject
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  const RejectModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full">
        <h3 className="text-xl font-bold mb-4">Reject Activation Request</h3>
        <p className="text-gray-600 mb-4">Please provide a reason for rejection:</p>
        <textarea
          value={rejectionReason}
          onChange={(e) => setRejectionReason(e.target.value)}
          rows="4"
          className="w-full p-3 border rounded-lg mb-4"
          placeholder="Enter rejection reason..."
        />
        <div className="flex gap-3">
          <button onClick={() => setShowRejectModal(false)} className="flex-1 px-4 py-2 border rounded-lg">Cancel</button>
          <button onClick={() => handleReject(selectedRequest?.id)} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg">Confirm Reject</button>
        </div>
      </div>
    </div>
  )

  const pendingCount = requests.filter(r => r.status === 'pending').length

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <AppSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
          <div className="flex justify-center items-center h-64">
            <Loader className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <AppSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      <main className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <div className="bg-white border-b px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Verification Queue</h1>
              <p className="text-sm text-gray-500">Review and manage activation requests from users</p>
            </div>
            <button onClick={fetchRequests} className="px-3 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="flex gap-2 mb-6 border-b">
            <button onClick={() => setFilter('pending')} className={`px-4 py-2 font-medium transition ${filter === 'pending' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>
              Pending ({pendingCount})
            </button>
            <button onClick={() => setFilter('all')} className={`px-4 py-2 font-medium transition ${filter === 'all' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>
              All Requests ({requests.length})
            </button>
          </div>

          {error ? (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-12 text-center">
              <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-red-700 mb-2">Error Loading Requests</h3>
              <p className="text-red-600 mb-4">{error}</p>
              <button onClick={fetchRequests} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                Try Again
              </button>
            </div>
          ) : requests.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border p-12 text-center">
              <CheckCircle className="w-16 h-16 text-green-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No Verification Requests</h3>
              <p className="text-gray-500">There are no {filter === 'pending' ? 'pending ' : ''}activation requests at this time.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((req) => (
                <div key={req.id} className="bg-white rounded-2xl shadow-sm border p-6 hover:shadow-md transition">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{req.full_name || req.user_name || 'Unknown User'}</h3>
                        {getStatusBadge(req.status)}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                        <div><p className="text-gray-500">Email</p><p className="font-medium truncate">{req.email || req.user_email || 'N/A'}</p></div>
                        <div><p className="text-gray-500">Phone</p><p className="font-medium">{req.phone_number || 'N/A'}</p></div>
                        <div><p className="text-gray-500">Property Type</p><p className="font-medium">{req.property_type || 'N/A'}</p></div>
                        <div><p className="text-gray-500">Submitted</p><p className="font-medium">{req.created_at ? new Date(req.created_at).toLocaleDateString() : 'N/A'}</p></div>
                      </div>
                      <p className="text-sm text-gray-600 truncate">{req.property_address || 'No address provided'}</p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button onClick={() => setSelectedRequest(req)} className="px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-1">
                        <Eye className="w-4 h-4" /> View
                      </button>
                      {req.status === 'pending' && (
                        <>
                          <button onClick={() => handleApprove(req.id)} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 flex items-center gap-1">
                            <Check className="w-4 h-4" /> Approve
                          </button>
                          <button onClick={() => {
                            setSelectedRequest(req)
                            setShowRejectModal(true)
                          }} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 flex items-center gap-1">
                            <X className="w-4 h-4" /> Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {selectedRequest && !showRejectModal && <RequestDetailModal request={selectedRequest} onClose={() => setSelectedRequest(null)} />}
      {showRejectModal && <RejectModal />}
    </div>
  )
}

export default VerificationQueue