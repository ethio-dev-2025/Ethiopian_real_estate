// src/components/dashboard/admin/PaymentApprovals.jsx
import React, { useState, useEffect, useCallback } from 'react'
import { 
  CheckCircle, XCircle, Clock, Eye, RefreshCw, UserCheck, 
  Mail, Phone, Building2, Briefcase, FileText, 
  X, AlertCircle, User, Home, 
  Shield, ThumbsUp, Download,
  Search, Camera, ChevronLeft, ChevronRight,
  File, ExternalLink, Maximize2, Calendar, Award, CreditCard, DollarSign, List
} from 'lucide-react'
import toast from 'react-hot-toast'

const API_URL = 'http://localhost:8000'

const PaymentApprovals = () => {
  const [pendingPayments, setPendingPayments] = useState([])
  const [approvedPayments, setApprovedPayments] = useState([])
  const [rejectedPayments, setRejectedPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('pending')
  const [selectedPayment, setSelectedPayment] = useState(null)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [processingId, setProcessingId] = useState(null)

  const fetchAllPayments = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const token = localStorage.getItem('access_token')
      
      if (!token) {
        setError('Please login again')
        toast.error('Please login again')
        setLoading(false)
        return
      }

      const response = await fetch(`${API_URL}/api/payment/admin/payments?status=all`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const allData = await response.json()
        const allPayments = Array.isArray(allData) ? allData : []
        
        const pending = allPayments.filter(p => p.status === 'pending')
        const approved = allPayments.filter(p => p.status === 'approved')
        const rejected = allPayments.filter(p => p.status === 'rejected')
        
        setPendingPayments(pending)
        setApprovedPayments(approved)
        setRejectedPayments(rejected)
      } else {
        console.error('Response not OK:', response.status)
      }
      
    } catch (error) {
      console.error('Fetch error:', error)
      setError(error.message)
      toast.error(`Failed to load: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAllPayments()
    const interval = setInterval(fetchAllPayments, 60000)
    return () => clearInterval(interval)
  }, [fetchAllPayments])

  // ONLY ONE handleApprove function
  const handleApprove = async (paymentId) => {
    setProcessingId(paymentId)
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_URL}/api/payment/admin/approve-payment/${paymentId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        toast.success('✅ Payment approved! Account activated.')
        setSelectedPayment(null)
        setShowDetailsModal(false)
        await fetchAllPayments()
        
        // Dispatch event to update sidebar badge
        window.dispatchEvent(new Event('payment-updated'))
        
        // Also update localStorage for sync
        const newCount = Math.max(0, pendingPayments.length - 1)
        localStorage.setItem('pendingPaymentsCount', newCount.toString())
      } else {
        toast.error(data.message || 'Failed to approve payment')
      }
    } catch (error) {
      console.error('Error approving:', error)
      toast.error('Failed to approve payment')
    } finally {
      setProcessingId(null)
    }
  }

  // ONLY ONE handleReject function
  const handleReject = async (paymentId, reason) => {
    if (!reason || !reason.trim()) {
      toast.error('Please provide a reason for rejection')
      return
    }
    
    setProcessingId(paymentId)
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_URL}/api/payment/admin/reject-payment/${paymentId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: reason })
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        toast.success('❌ Payment rejected')
        setShowRejectModal(false)
        setSelectedPayment(null)
        setShowDetailsModal(false)
        await fetchAllPayments()
        
        // Dispatch event to update sidebar badge
        window.dispatchEvent(new Event('payment-updated'))
        
        // Also update localStorage for sync
        const newCount = Math.max(0, pendingPayments.length - 1)
        localStorage.setItem('pendingPaymentsCount', newCount.toString())
      } else {
        toast.error(data.message || 'Failed to reject payment')
      }
    } catch (error) {
      console.error('Error rejecting:', error)
      toast.error('Failed to reject payment')
    } finally {
      setProcessingId(null)
    }
  }

  const handleDownloadReceipt = async (paymentId) => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_URL}/api/payment/receipt/${paymentId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (!response.ok) {
        throw new Error('Failed to get receipt')
      }
      
      const data = await response.json()
      const receipt = data.receipt
      
      console.log('Receipt data:', receipt)
      
      const printWindow = window.open('', '_blank')
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Payment Receipt - ${receipt.transaction_id}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Segoe UI', Arial, sans-serif; 
              margin: 0;
              padding: 20px;
              background: #f0f0f0;
              min-height: 100vh;
              display: flex;
              justify-content: center;
              align-items: center;
            }
            .receipt {
              max-width: 800px;
              width: 100%;
              margin: 0 auto;
              background: white;
              border-radius: 20px;
              box-shadow: 0 20px 40px rgba(0,0,0,0.1);
              overflow: hidden;
            }
            .receipt-header {
              background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
              color: white;
              padding: 30px;
              text-align: center;
            }
            .receipt-header h1 {
              font-size: 32px;
              margin-bottom: 5px;
            }
            .receipt-header p {
              opacity: 0.8;
              font-size: 14px;
            }
            .receipt-body {
              padding: 30px;
            }
            .company-info {
              text-align: center;
              padding-bottom: 20px;
              border-bottom: 2px solid #e0e0e0;
              margin-bottom: 20px;
            }
            .company-info h3 {
              color: #1a1a2e;
              margin-bottom: 10px;
            }
            .company-info p {
              color: #666;
              font-size: 12px;
              margin: 3px 0;
            }
            .payment-details {
              background: #f8f9fa;
              border-radius: 12px;
              padding: 20px;
              margin: 20px 0;
            }
            .payment-details h3 {
              color: #1a1a2e;
              margin-bottom: 15px;
              font-size: 18px;
              border-left: 4px solid #2563EB;
              padding-left: 12px;
            }
            .detail-row {
              display: flex;
              justify-content: space-between;
              padding: 10px 0;
              border-bottom: 1px solid #e0e0e0;
            }
            .detail-row:last-child {
              border-bottom: none;
            }
            .detail-label {
              color: #666;
              font-weight: 500;
            }
            .detail-value {
              color: #333;
              font-weight: 600;
            }
            .amount {
              font-size: 24px;
              color: #10b981;
            }
            .status-approved {
              color: #10b981;
              font-weight: bold;
            }
            .status-pending {
              color: #f59e0b;
              font-weight: bold;
            }
            .status-rejected {
              color: #ef4444;
              font-weight: bold;
            }
            .footer {
              text-align: center;
              padding-top: 20px;
              border-top: 2px solid #e0e0e0;
              margin-top: 20px;
              color: #999;
              font-size: 12px;
            }
            @media print {
              body {
                background: white;
                padding: 0;
              }
              .receipt {
                box-shadow: none;
              }
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="receipt-header">
              <h1>🏠 EstateHub</h1>
              <p>Official Payment Receipt</p>
            </div>
            <div class="receipt-body">
              <div class="company-info">
                <h3>${receipt.business_name || 'EstateHub Real Estate'}</h3>
                <p>TIN: ${receipt.business_tin || '0071406415'}</p>
                <p>Phone: ${receipt.business_phone || '+251-960724272'}</p>
                <p>Website: ${receipt.business_website || 'www.estatehub.com'}</p>
                <p>Address: ${receipt.business_address || 'Addis Ababa, Ethiopia'}</p>
              </div>
              
              <div class="payment-details">
                <h3>💰 Payment Details</h3>
                <div class="detail-row">
                  <span class="detail-label">Transaction ID:</span>
                  <span class="detail-value">${receipt.transaction_id}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Date:</span>
                  <span class="detail-value">${new Date(receipt.date).toLocaleString()}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Plan Type:</span>
                  <span class="detail-value">${receipt.plan_type?.toUpperCase() || 'N/A'}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Amount:</span>
                  <span class="detail-value amount">${receipt.currency || 'ETB'} ${receipt.amount?.toLocaleString() || 0}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Status:</span>
                  <span class="detail-value status-${receipt.status}">${receipt.status?.toUpperCase() || 'PENDING'}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Payment Method:</span>
                  <span class="detail-value">${receipt.payment_method || 'Chapa'}</span>
                </div>
              </div>
              
              <div class="payment-details">
                <h3>👤 Customer Information</h3>
                <div class="detail-row">
                  <span class="detail-label">Name:</span>
                  <span class="detail-value">${receipt.user_name}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Email:</span>
                  <span class="detail-value">${receipt.user_email}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Phone:</span>
                  <span class="detail-value">${receipt.user_phone || 'N/A'}</span>
                </div>
              </div>
              
              <div class="footer">
                <p>Thank you for choosing EstateHub!</p>
                <p>This is a computer-generated receipt and does not require a signature.</p>
                <p>For support, contact support@estatehub.com</p>
              </div>
            </div>
          </div>
          <div class="no-print" style="text-align: center; margin-top: 20px;">
            <button onclick="window.print()" style="padding: 10px 20px; background: #2563EB; color: white; border: none; border-radius: 8px; cursor: pointer;">🖨️ Print Receipt</button>
            <button onclick="window.close()" style="padding: 10px 20px; background: #6B7280; color: white; border: none; border-radius: 8px; cursor: pointer; margin-left: 10px;">Close</button>
          </div>
        </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
      toast.success('Receipt ready')
    } catch (error) {
      console.error('Error getting receipt:', error)
      toast.error(error.message || 'Failed to get receipt')
    }
  }

  const getStatusBadge = (status) => {
    const statusLower = status?.toLowerCase() || ''
    
    if (statusLower === 'pending') {
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs flex items-center gap-1"><Clock className="w-3 h-3" />Pending</span>
    }
    if (statusLower === 'approved') {
      return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs flex items-center gap-1"><CheckCircle className="w-3 h-3" />Approved</span>
    }
    if (statusLower === 'rejected') {
      return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs flex items-center gap-1"><XCircle className="w-3 h-3" />Rejected</span>
    }
    return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">{status}</span>
  }

  const getCurrentPayments = () => {
    if (activeTab === 'pending') return pendingPayments
    if (activeTab === 'approved') return approvedPayments
    if (activeTab === 'rejected') return rejectedPayments
    if (activeTab === 'all') return [...pendingPayments, ...approvedPayments, ...rejectedPayments]
    return []
  }

  const currentPayments = getCurrentPayments()
  
  const filteredPayments = currentPayments.filter(payment => 
    payment.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.phone_number?.includes(searchTerm) ||
    payment.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase())
  )

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

  const formatAmount = (amount) => `ETB ${amount?.toLocaleString() || 0}`

  // Details Modal
  const DetailsModal = () => {
    if (!selectedPayment) return null
    
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setShowDetailsModal(false)}>
        <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200" onClick={(e) => e.stopPropagation()}>
          <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-600" />
              Payment Details
            </h2>
            <button onClick={() => setShowDetailsModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="border-b border-gray-200 pb-4">
              <h3 className="font-semibold text-gray-900 text-lg mb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                User Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-sm text-gray-500">Full Name</p><p className="font-medium text-gray-900">{selectedPayment.user_name}</p></div>
                <div><p className="text-sm text-gray-500">Email</p><p className="font-medium text-gray-900">{selectedPayment.user_email}</p></div>
                <div><p className="text-sm text-gray-500">Phone</p><p className="font-medium text-gray-900">{selectedPayment.phone_number || 'N/A'}</p></div>
                <div><p className="text-sm text-gray-500">User ID</p><p className="font-medium text-gray-900">{selectedPayment.user_id}</p></div>
              </div>
            </div>
            
            <div className="border-b border-gray-200 pb-4">
              <h3 className="font-semibold text-gray-900 text-lg mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-blue-600" />
                Payment Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-sm text-gray-500">Plan Type</p><p className="font-medium text-gray-900 capitalize">{selectedPayment.plan_type}</p></div>
                <div><p className="text-sm text-gray-500">Amount</p><p className="font-bold text-green-600">{formatAmount(selectedPayment.amount)}</p></div>
                <div><p className="text-sm text-gray-500">Status</p><div>{getStatusBadge(selectedPayment.status)}</div></div>
                <div><p className="text-sm text-gray-500">Transaction ID</p><p className="font-medium text-gray-900 text-sm">{selectedPayment.transaction_id || 'N/A'}</p></div>
                <div><p className="text-sm text-gray-500">Submitted</p><p className="font-medium text-gray-900">{formatDate(selectedPayment.created_at)}</p></div>
              </div>
            </div>
            
            <div className="border-b border-gray-200 pb-4">
              <h3 className="font-semibold text-gray-900 text-lg mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                Payment Receipt
              </h3>
              <button 
                onClick={() => handleDownloadReceipt(selectedPayment.id)} 
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Download className="w-4 h-4" /> Print Receipt
              </button>
            </div>
            
            {selectedPayment.rejection_reason && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-600"><strong>Rejection Reason:</strong> {selectedPayment.rejection_reason}</p>
              </div>
            )}
            
            {selectedPayment.status === 'pending' && (
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button 
                  onClick={() => { 
                    setShowDetailsModal(false); 
                    handleApprove(selectedPayment.id); 
                  }} 
                  disabled={processingId === selectedPayment.id}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 flex items-center justify-center gap-2 transition disabled:opacity-50"
                >
                  {processingId === selectedPayment.id ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <CheckCircle className="w-4 h-4" />}
                  Approve Payment
                </button>
                <button 
                  onClick={() => { 
                    setShowDetailsModal(false); 
                    setShowRejectModal(true);
                  }} 
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 flex items-center justify-center gap-2 transition"
                >
                  <XCircle className="w-4 h-4" />
                  Reject Payment
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Reject Modal
  const RejectModal = () => {
    const [localReason, setLocalReason] = useState('')
    
    const handleConfirmReject = () => {
      if (!localReason.trim()) {
        toast.error('Please provide a reason for rejection')
        return
      }
      if (selectedPayment?.id) {
        handleReject(selectedPayment.id, localReason)
      }
      setShowRejectModal(false)
    }
    
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-gray-200 shadow-xl">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Reject Payment</h3>
          <p className="text-gray-600 mb-4">Please provide a reason for rejection:</p>
          <textarea 
            value={localReason}
            onChange={(e) => setLocalReason(e.target.value)}
            rows="4"
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-red-500"
            placeholder="Type your rejection reason here..."
            autoFocus
          />
          <div className="flex gap-3 mt-4">
            <button 
              onClick={() => {
                setShowRejectModal(false)
                setLocalReason('')
              }} 
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button 
              onClick={handleConfirmReject} 
              disabled={processingId === selectedPayment?.id}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
            >
              {processingId === selectedPayment?.id ? 'Processing...' : 'Confirm Reject'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Loading skeleton
  if (loading && pendingPayments.length === 0 && approvedPayments.length === 0 && rejectedPayments.length === 0) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="mb-6">
          <div className="h-8 bg-gray-200 rounded w-64 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-96 animate-pulse"></div>
        </div>
        <div className="flex gap-2 mb-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-10 bg-gray-200 rounded-lg w-32 animate-pulse"></div>
          ))}
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-200">
            {[1, 2, 3].map(i => (
              <div key={i} className="p-6">
                <div className="flex justify-between">
                  <div className="flex-1">
                    <div className="h-6 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                  </div>
                  <div className="h-8 bg-gray-200 rounded w-24 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error && pendingPayments.length === 0 && approvedPayments.length === 0 && rejectedPayments.length === 0) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Payment Approvals</h1>
          <p className="text-gray-500 mt-1">Review and approve subscription payments</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-12 text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-red-700 mb-2">Error Loading Data</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => fetchAllPayments()} 
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {showDetailsModal && <DetailsModal />}
      {showRejectModal && <RejectModal />}

      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payment Approvals</h1>
            <p className="text-gray-500 mt-1">Review and approve subscription payments</p>
          </div>
          
          <div className="flex gap-3">
            <div className="bg-white rounded-lg px-3 py-2 text-center shadow-sm border border-gray-200">
              <p className="text-xs text-gray-500">Pending</p>
              <p className="text-xl font-bold text-yellow-600">{pendingPayments.length}</p>
            </div>
            <div className="bg-white rounded-lg px-3 py-2 text-center shadow-sm border border-gray-200">
              <p className="text-xs text-gray-500">Approved</p>
              <p className="text-xl font-bold text-green-600">{approvedPayments.length}</p>
            </div>
            <div className="bg-white rounded-lg px-3 py-2 text-center shadow-sm border border-gray-200">
              <p className="text-xs text-gray-500">Rejected</p>
              <p className="text-xl font-bold text-red-600">{rejectedPayments.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input 
          type="text" 
          placeholder="Search by name, email, phone, or transaction ID..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
          className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
        />
      </div>

      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button 
          onClick={() => setActiveTab('pending')} 
          className={`px-4 py-2 font-medium transition flex items-center gap-2 ${activeTab === 'pending' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Clock className="w-4 h-4" />
          Pending
          {pendingPayments.length > 0 && (
            <span className="px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full ml-1 animate-pulse">
              {pendingPayments.length}
            </span>
          )}
        </button>
        <button 
          onClick={() => setActiveTab('approved')} 
          className={`px-4 py-2 font-medium transition flex items-center gap-2 ${activeTab === 'approved' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <CheckCircle className="w-4 h-4" />
          Approved ({approvedPayments.length})
        </button>
        <button 
          onClick={() => setActiveTab('rejected')} 
          className={`px-4 py-2 font-medium transition flex items-center gap-2 ${activeTab === 'rejected' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <XCircle className="w-4 h-4" />
          Rejected ({rejectedPayments.length})
        </button>
        <button 
          onClick={() => setActiveTab('all')} 
          className={`px-4 py-2 font-medium transition flex items-center gap-2 ${activeTab === 'all' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <List className="w-4 h-4" />
          All ({pendingPayments.length + approvedPayments.length + rejectedPayments.length})
        </button>
      </div>

      <div className="flex justify-end mb-4">
        <button 
          onClick={() => fetchAllPayments()} 
          disabled={loading}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50 text-gray-600 transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> 
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {filteredPayments.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          {activeTab === 'pending' ? (
            <>
              <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No Pending Payments</h3>
              <p className="text-gray-500">All payment requests have been processed!</p>
            </>
          ) : activeTab === 'approved' ? (
            <>
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No Approved Payments</h3>
              <p className="text-gray-500">No payment requests have been approved yet.</p>
            </>
          ) : activeTab === 'rejected' ? (
            <>
              <XCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No Rejected Payments</h3>
              <p className="text-gray-500">No payment requests have been rejected.</p>
            </>
          ) : (
            <>
              <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No Payments</h3>
              <p className="text-gray-500">No payment requests found.</p>
            </>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-200">
            {filteredPayments.map((payment) => {
              const isApproved = payment.status === 'approved'
              const isRejected = payment.status === 'rejected'
              
              return (
                <div key={payment.id} className={`p-6 hover:bg-gray-50 transition ${isApproved ? 'border-l-4 border-l-green-500' : isRejected ? 'border-l-4 border-l-red-500' : ''}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="font-semibold text-lg text-gray-900">{payment.user_name}</h3>
                        {getStatusBadge(payment.status)}
                        {payment.reviewed_at && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(payment.reviewed_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                        <div><p className="text-gray-500">Email</p><p className="font-medium text-gray-700 truncate">{payment.user_email}</p></div>
                        <div><p className="text-gray-500">Phone</p><p className="font-medium text-gray-700">{payment.phone_number || 'N/A'}</p></div>
                        <div><p className="text-gray-500">Plan</p><p className="font-medium text-gray-700 capitalize">{payment.plan_type}</p></div>
                        <div><p className="text-gray-500">Amount</p><p className="font-bold text-green-600">{formatAmount(payment.amount)}</p></div>
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1">📋 TX: {payment.transaction_id?.slice(-12) || 'N/A'}</span>
                        <span className="flex items-center gap-1">📅 {formatDate(payment.created_at)}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <button 
                        onClick={() => { setSelectedPayment(payment); setShowDetailsModal(true); }} 
                        className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-1 text-gray-600 transition"
                      >
                        <Eye className="w-4 h-4" /> View Details
                      </button>
                      {activeTab === 'pending' && payment.status === 'pending' && (
                        <>
                          <button 
                            onClick={() => handleApprove(payment.id)} 
                            disabled={processingId === payment.id}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 flex items-center gap-1 transition disabled:opacity-50"
                          >
                            {processingId === payment.id ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <CheckCircle className="w-4 h-4" />}
                            Approve
                          </button>
                          <button 
                            onClick={() => { setSelectedPayment(payment); setShowRejectModal(true); }} 
                            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 flex items-center gap-1 transition"
                          >
                            <XCircle className="w-4 h-4" />
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default PaymentApprovals