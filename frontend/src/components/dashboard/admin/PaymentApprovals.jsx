import React, { useState, useEffect, useRef } from 'react'
import { CheckCircle, XCircle, Clock, CreditCard } from 'lucide-react'
import toast from 'react-hot-toast'

const API_URL = 'http://localhost:8000'

const PaymentApprovals = () => {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('pending')
  const [selectedPayment, setSelectedPayment] = useState(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectModal, setShowRejectModal] = useState(false)
  const abortControllerRef = useRef(null)

  useEffect(() => {
    fetchPayments()
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [activeTab])

  const fetchPayments = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    const abortController = new AbortController()
    abortControllerRef.current = abortController
    
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_URL}/api/admin/payment-approvals?status=${activeTab}`, {
        headers: { 'Authorization': `Bearer ${token}` },
        signal: abortController.signal
      })
      
      if (!response.ok) throw new Error('Failed to fetch payments')
      
      const data = await response.json()
      setPayments(data)
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error fetching payments:', error)
        toast.error('Failed to load payment requests')
      }
      setPayments([])
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (paymentId) => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_URL}/api/admin/payment-approvals/${paymentId}/approve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (!response.ok) throw new Error('Failed to approve')
      
      toast.success('Payment approved successfully')
      setPayments(prev => prev.map(p => p.id === paymentId ? { ...p, status: 'approved' } : p))
    } catch (error) {
      toast.error('Failed to approve payment')
    }
  }

  const handleReject = async (paymentId) => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection')
      return
    }
    
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_URL}/api/admin/payment-approvals/${paymentId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: rejectionReason })
      })
      
      if (!response.ok) throw new Error('Failed to reject')
      
      toast.success('Payment rejected')
      setPayments(prev => prev.map(p => p.id === paymentId ? { ...p, status: 'rejected', rejection_reason: rejectionReason } : p))
      setShowRejectModal(false)
      setRejectionReason('')
      setSelectedPayment(null)
    } catch (error) {
      toast.error('Failed to reject payment')
    }
  }

  const getStatusCounts = () => {
    const pending = payments.filter(p => p.status === 'pending').length
    const approved = payments.filter(p => p.status === 'approved').length
    const rejected = payments.filter(p => p.status === 'rejected').length
    return { pending, approved, rejected, all: payments.length }
  }

  const counts = getStatusCounts()
  const tabs = [
    { id: 'pending', label: 'Pending', count: counts.pending },
    { id: 'approved', label: 'Approved', count: counts.approved },
    { id: 'rejected', label: 'Rejected', count: counts.rejected },
    { id: 'all', label: 'All', count: counts.all },
  ]

  const RejectModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full">
        <h3 className="text-xl font-bold mb-4">Reject Payment</h3>
        <p className="text-gray-600 mb-4">Please provide a reason for rejection:</p>
        <textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} rows="4" className="w-full p-3 border rounded-lg mb-4" placeholder="Enter rejection reason..." />
        <div className="flex gap-3"><button onClick={() => setShowRejectModal(false)} className="flex-1 px-4 py-2 border rounded-lg">Cancel</button><button onClick={() => handleReject(selectedPayment?.id)} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg">Confirm Reject</button></div>
      </div>
    </div>
  )

  // No spinner - show empty content
  if (loading && payments.length === 0) {
    return (
      <div className="p-6">
        <div className="mb-6"><h1 className="text-2xl font-bold text-gray-900">Payment Approval Queue</h1><p className="text-gray-500">Approve package payments before sellers can add properties</p></div>
        <div className="bg-white rounded-2xl shadow-sm border p-12 text-center"><CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" /><p className="text-gray-500">Loading payments...</p></div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6"><h1 className="text-2xl font-bold text-gray-900">Payment Approval Queue</h1><p className="text-gray-500">Approve package payments before sellers can add properties</p></div>
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6 w-fit">{tabs.map((tab) => (<button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-6 py-2 rounded-lg font-medium transition ${activeTab === tab.id ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>{tab.label} ({tab.count})</button>))}</div>
      {payments.length === 0 ? (<div className="bg-white rounded-2xl shadow-sm border p-12 text-center"><CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" /><h3 className="text-xl font-semibold text-gray-700 mb-2">No pending payments</h3><p className="text-gray-500">All payment requests have been processed</p></div>) : (<div className="bg-white rounded-2xl shadow-sm border overflow-hidden"><div className="divide-y">{payments.map((payment) => (<div key={payment.id} className="p-6 hover:bg-gray-50 transition"><div className="flex justify-between items-start"><div className="flex-1"><div className="flex items-center gap-3 mb-2"><h3 className="font-semibold text-lg">{payment.user_name}</h3>{payment.status === 'pending' && <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs flex items-center gap-1"><Clock className="w-3 h-3" />Pending</span>}{payment.status === 'approved' && <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs flex items-center gap-1"><CheckCircle className="w-3 h-3" />Approved</span>}{payment.status === 'rejected' && <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs flex items-center gap-1"><XCircle className="w-3 h-3" />Rejected</span>}</div><div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-3"><div><p className="text-gray-500">Email</p><p className="font-medium">{payment.user_email}</p></div><div><p className="text-gray-500">Package</p><p className="font-medium">{payment.package}</p></div><div><p className="text-gray-500">Amount</p><p className="font-medium text-green-600">ETB {payment.amount?.toLocaleString()}</p></div></div>{payment.status === 'pending' && (<div className="flex gap-2"><button onClick={() => handleApprove(payment.id)} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 flex items-center gap-1"><CheckCircle className="w-4 h-4" />Approve Payment</button><button onClick={() => { setSelectedPayment(payment); setShowRejectModal(true) }} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 flex items-center gap-1"><XCircle className="w-4 h-4" />Reject</button></div>)}{payment.rejection_reason && <p className="text-sm text-red-600 mt-2">Reason: {payment.rejection_reason}</p>}</div></div></div>))}</div></div>)}
      {showRejectModal && <RejectModal />}
    </div>
  )
}

export default PaymentApprovals