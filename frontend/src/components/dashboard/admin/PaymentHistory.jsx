// src/components/dashboard/admin/PaymentHistory.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react'
import { 
  CheckCircle, XCircle, Clock, Eye, RefreshCw, 
  Mail, Phone, FileText, 
  X, AlertCircle, User, 
  Download,
  Search, ChevronLeft, ChevronRight,
  Calendar, CreditCard, DollarSign, Printer
} from 'lucide-react'
import toast from 'react-hot-toast'

const API_URL = 'http://localhost:8000'

const PaymentHistory = () => {
  const [allPayments, setAllPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPayment, setSelectedPayment] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  // Parse date safely
  const parseDate = (dateString) => {
    if (!dateString) return new Date(0)
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return new Date(0)
      }
      return date
    } catch (e) {
      return new Date(0)
    }
  }

  // Format date with 12-hour and AM/PM
  const formatRealDateTime = (dateString) => {
    if (!dateString) return 'Date not available'
    
    try {
      const date = parseDate(dateString)
      if (isNaN(date.getTime())) {
        return 'Invalid date'
      }
      
      const year = date.getFullYear()
      const month = date.toLocaleString('default', { month: 'short' })
      const day = date.getDate()
      let hours = date.getHours()
      const minutes = date.getMinutes().toString().padStart(2, '0')
      const seconds = date.getSeconds().toString().padStart(2, '0')
      const ampm = hours >= 12 ? 'PM' : 'AM'
      
      hours = hours % 12
      hours = hours ? hours : 12
      
      return `${month} ${day}, ${year} ${hours}:${minutes}:${seconds} ${ampm}`
    } catch (error) {
      console.error('Date formatting error:', error)
      return 'Date error'
    }
  }

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
        let payments = await response.json()
        
        if (!Array.isArray(payments)) {
          payments = []
        }
        
        // Filter out future-dated payments (2028, 2029, etc.)
        const validPayments = payments.filter(payment => {
          if (!payment.created_at) return false
          const date = new Date(payment.created_at)
          const now = new Date()
          return date <= new Date(now.getTime() + 24 * 60 * 60 * 1000)
        })
        
        const futurePayments = payments.filter(payment => {
          if (!payment.created_at) return false
          const date = new Date(payment.created_at)
          const now = new Date()
          return date > new Date(now.getTime() + 24 * 60 * 60 * 1000)
        })
        
        // Sort valid payments by created_at date (newest first)
        validPayments.sort((a, b) => {
          const dateA = new Date(a.created_at)
          const dateB = new Date(b.created_at)
          return dateB - dateA
        })
        
        // Sort future payments by date (oldest first so they appear at bottom)
        futurePayments.sort((a, b) => {
          const dateA = new Date(a.created_at)
          const dateB = new Date(b.created_at)
          return dateA - dateB
        })
        
        // Combine: valid payments first, then future payments
        const sortedPayments = [...validPayments, ...futurePayments]
        
        setAllPayments(sortedPayments)
        setCurrentPage(1)
        
        console.log(`✅ Loaded ${sortedPayments.length} payments from database`)
      } else {
        console.error('Response not OK:', response.status)
        setError(`Failed to load payments: ${response.status}`)
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
  }, [])

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
              background: #f5f5f5;
              min-height: 100vh;
              display: flex;
              justify-content: center;
              align-items: center;
            }
            .receipt-container {
              max-width: 800px;
              width: 100%;
              margin: 0 auto;
            }
            .receipt {
              background: white;
              border-radius: 16px;
              box-shadow: 0 20px 40px rgba(0,0,0,0.1);
              overflow: hidden;
            }
            .receipt-header {
              background: linear-gradient(135deg, #1e3a8a 0%, #0f766e 100%);
              color: white;
              padding: 30px;
              text-align: center;
            }
            .receipt-header h1 {
              font-size: 28px;
              margin-bottom: 5px;
            }
            .receipt-body {
              padding: 25px;
            }
            .company-info {
              text-align: center;
              padding-bottom: 15px;
              border-bottom: 1px solid #e0e0e0;
              margin-bottom: 15px;
            }
            .payment-details {
              background: #f8f9fa;
              border-radius: 10px;
              padding: 15px;
              margin: 15px 0;
            }
            .detail-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px solid #e0e0e0;
            }
            .detail-row:last-child {
              border-bottom: none;
            }
            .amount {
              font-size: 20px;
              color: #10b981;
              font-weight: bold;
            }
            @media print {
              body { background: white; padding: 0; }
              .receipt { box-shadow: none; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <div class="receipt">
              <div class="receipt-header">
                <h1>🏠 EstateHub</h1>
                <p>Official Payment Receipt</p>
              </div>
              <div class="receipt-body">
                <div class="company-info">
                  <h3>EstateHub Real Estate</h3>
                  <p>TIN: 0071406415 | Phone: +251-960724272</p>
                </div>
                <div class="payment-details">
                  <h3>💰 Payment Details</h3>
                  <div class="detail-row">
                    <span>Transaction ID:</span>
                    <span><strong>${receipt.transaction_id}</strong></span>
                  </div>
                  <div class="detail-row">
                    <span>Date & Time:</span>
                    <span><strong>${formatRealDateTime(receipt.date)}</strong></span>
                  </div>
                  <div class="detail-row">
                    <span>Plan Type:</span>
                    <span><strong>${receipt.plan_type?.toUpperCase()}</strong></span>
                  </div>
                  <div class="detail-row">
                    <span>Amount:</span>
                    <span class="amount">${receipt.currency || 'ETB'} ${receipt.amount?.toLocaleString()}</span>
                  </div>
                </div>
                <div class="payment-details">
                  <h3>👤 Customer Information</h3>
                  <div class="detail-row">
                    <span>Name:</span>
                    <span><strong>${receipt.user_name}</strong></span>
                  </div>
                  <div class="detail-row">
                    <span>Email:</span>
                    <span><strong>${receipt.user_email}</strong></span>
                  </div>
                </div>
              </div>
              <div class="footer" style="text-align: center; padding: 15px; background: #f8fafc;">
                <p>Thank you for choosing EstateHub!</p>
              </div>
            </div>
            <div class="no-print" style="text-align: center; margin-top: 15px;">
              <button onclick="window.print()" style="padding: 8px 16px; background: #1e3a8a; color: white; border: none; border-radius: 6px; cursor: pointer;">🖨️ Print</button>
              <button onclick="window.close()" style="padding: 8px 16px; background: #6B7280; color: white; border: none; border-radius: 6px; cursor: pointer;">Close</button>
            </div>
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
      return <span className="px-2 py-1 bg-warning/10 text-warning rounded-full text-xs flex items-center gap-1"><Clock className="w-3 h-3" />Pending</span>
    }
    if (statusLower === 'approved') {
      return <span className="px-2 py-1 bg-success/10 text-success rounded-full text-xs flex items-center gap-1"><CheckCircle className="w-3 h-3" />Paid</span>
    }
    if (statusLower === 'rejected') {
      return <span className="px-2 py-1 bg-error/10 text-error rounded-full text-xs flex items-center gap-1"><XCircle className="w-3 h-3" />Rejected</span>
    }
    return <span className="px-2 py-1 bg-gray-100 text-text-muted rounded-full text-xs">{status}</span>
  }

  // Calculate totals
  const approvedRevenue = allPayments
    .filter(p => p.status === 'approved')
    .reduce((sum, p) => sum + (p.amount || 0), 0)

  const totalPayments = allPayments.length
  const approvedCount = allPayments.filter(p => p.status === 'approved').length
  const pendingCount = allPayments.filter(p => p.status === 'pending').length
  const rejectedCount = allPayments.filter(p => p.status === 'rejected').length

  // Filter payments
  const filteredPayments = [...allPayments].filter(payment => 
    payment.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.phone_number?.includes(searchTerm) ||
    payment.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentPayments = filteredPayments.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage)

  const formatAmount = (amount) => `ETB ${amount?.toLocaleString() || 0}`

  const handlePageChange = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleManualRefresh = () => {
    fetchAllPayments()
    toast.success('Data refreshed from database!')
  }

  const DetailsModal = () => {
    if (!selectedPayment) return null
    
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setShowDetailsModal(false)}>
        <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-border-light" onClick={(e) => e.stopPropagation()}>
          <div className="sticky top-0 bg-white border-b border-border-light p-4 flex justify-between items-center">
            <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary-600" />
              Payment Details
            </h2>
            <button onClick={() => setShowDetailsModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition">
              <X className="w-5 h-5 text-text-muted" />
            </button>
          </div>
          
          <div className="p-6 space-y-6">
            <div>
              <h3 className="font-semibold text-text-primary mb-3">User Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-sm text-text-muted">Name</p><p className="font-medium text-text-primary">{selectedPayment.user_name}</p></div>
                <div><p className="text-sm text-text-muted">Email</p><p className="font-medium text-text-primary">{selectedPayment.user_email}</p></div>
                <div><p className="text-sm text-text-muted">Phone</p><p className="font-medium text-text-primary">{selectedPayment.phone_number || 'N/A'}</p></div>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-text-primary mb-3">Payment Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-sm text-text-muted">Plan</p><p className="font-medium capitalize text-text-primary">{selectedPayment.plan_type}</p></div>
                <div><p className="text-sm text-text-muted">Amount</p><p className="font-bold text-success">{formatAmount(selectedPayment.amount)}</p></div>
                <div><p className="text-sm text-text-muted">Status</p><div>{getStatusBadge(selectedPayment.status)}</div></div>
                <div className="col-span-2">
                  <p className="text-sm text-text-muted">Transaction ID</p>
                  <p className="font-medium text-text-primary text-sm break-all">{selectedPayment.transaction_id}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-text-muted">Payment Date & Time</p>
                  <p className="font-medium text-text-primary">{formatRealDateTime(selectedPayment.created_at)}</p>
                </div>
              </div>
            </div>
            
            <div>
              <button 
                onClick={() => handleDownloadReceipt(selectedPayment.id)} 
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
              >
                <Printer className="w-4 h-4" /> Print Receipt
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading && allPayments.length === 0) {
    return (
      <div className="p-6 bg-background min-h-screen">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-background min-h-screen">
      {showDetailsModal && <DetailsModal />}

      <div className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Payment History</h1>
            <p className="text-text-muted mt-1">Payment records from database - Newest payments shown first</p>
          </div>
          
          <div className="flex gap-3">
            <div className="bg-white rounded-lg px-4 py-2 text-center shadow-sm border border-border-light">
              <p className="text-xs text-text-muted">Total Payments</p>
              <p className="text-xl font-bold text-text-primary">{totalPayments}</p>
            </div>
            <div className="bg-white rounded-lg px-4 py-2 text-center shadow-sm border border-border-light">
              <p className="text-xs text-text-muted">Approved</p>
              <p className="text-xl font-bold text-success">{approvedCount}</p>
            </div>
            <div className="bg-white rounded-lg px-4 py-2 text-center shadow-sm border border-border-light">
              <p className="text-xs text-text-muted">Pending</p>
              <p className="text-xl font-bold text-warning">{pendingCount}</p>
            </div>
            <div className="bg-white rounded-lg px-4 py-2 text-center shadow-sm border border-border-light">
              <p className="text-xs text-text-muted">Rejected</p>
              <p className="text-xl font-bold text-error">{rejectedCount}</p>
            </div>
            <div className="bg-success/10 rounded-lg px-4 py-2 text-center shadow-sm border border-success/20">
              <p className="text-xs text-text-muted">Total Revenue</p>
              <p className="text-xl font-bold text-success">
                ETB {approvedRevenue.toLocaleString()}
              </p>
              <p className="text-xs text-text-muted">(Approved only)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted w-5 h-5" />
        <input 
          type="text" 
          placeholder="Search by name, email, phone, or transaction ID..." 
          value={searchTerm} 
          onChange={(e) => {
            setSearchTerm(e.target.value)
            setCurrentPage(1)
          }} 
          className="w-full pl-10 pr-4 py-2 bg-white border border-border-light rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-text-primary placeholder-text-muted" 
        />
      </div>

      {/* Stats */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-text-muted">
          Showing {filteredPayments.length > 0 ? indexOfFirstItem + 1 : 0} - {Math.min(indexOfLastItem, filteredPayments.length)} of {filteredPayments.length} payments
          <span className="ml-2 text-xs text-primary-600 font-medium">(Newest first - 12-hour format)</span>
        </div>
        <button 
          onClick={handleManualRefresh} 
          disabled={loading}
          className="px-3 py-2 text-sm border border-border-light rounded-lg hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50 text-text-secondary transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> 
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {filteredPayments.length === 0 ? (
        <div className="bg-white rounded-xl border border-border-light p-12 text-center">
          <CreditCard className="w-16 h-16 text-text-muted mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-text-primary mb-2">No Payments Found</h3>
          <p className="text-text-muted">No payment records available yet.</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-border-light shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead className="bg-gray-50 border-b border-border-light">
                  <tr>
                    <th className="text-left p-4 text-sm font-semibold text-text-muted">User</th>
                    <th className="text-left p-4 text-sm font-semibold text-text-muted">Contact</th>
                    <th className="text-left p-4 text-sm font-semibold text-text-muted">Plan</th>
                    <th className="text-left p-4 text-sm font-semibold text-text-muted">Amount</th>
                    <th className="text-left p-4 text-sm font-semibold text-text-muted">Status</th>
                    <th className="text-left p-4 text-sm font-semibold text-text-muted">Payment Date & Time</th>
                    <th className="text-center p-4 text-sm font-semibold text-text-muted">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light">
                  {currentPayments.map((payment, idx) => {
                    const isNewest = idx === 0 && currentPage === 1 && allPayments.length > 0
                    
                    return (
                      <tr key={payment.id} className="hover:bg-gray-50 transition">
                        <td className="p-4">
                          <p className="font-medium text-text-primary">{payment.user_name || 'Unknown'}</p>
                          <p className="text-xs text-text-muted">ID: {payment.user_id}</p>
                          {isNewest && (
                            <span className="inline-block mt-1 px-1.5 py-0.5 bg-success/10 text-success text-xs rounded-full">🔥 Newest</span>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1 text-sm text-text-secondary mb-1">
                            <Mail className="w-3 h-3" />
                            <span className="truncate max-w-[150px]">{payment.user_email}</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-text-secondary">
                            <Phone className="w-3 h-3" />
                            <span>{payment.phone_number || 'No phone'}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="capitalize text-sm font-medium text-text-primary">{payment.plan_type}</span>
                        </td>
                        <td className="p-4">
                          <span className="font-bold text-success">{formatAmount(payment.amount)}</span>
                        </td>
                        <td className="p-4">
                          {getStatusBadge(payment.status)}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1 text-sm text-text-primary">
                            <Calendar className="w-3 h-3" />
                            <span className="font-mono">{formatRealDateTime(payment.created_at)}</span>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <button 
                            onClick={() => { setSelectedPayment(payment); setShowDetailsModal(true); }} 
                            className="px-3 py-1.5 border border-border-light rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-1 mx-auto text-text-secondary transition"
                          >
                            <Eye className="w-4 h-4" /> Details
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <button
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                className="p-2 border border-border-light rounded-lg disabled:opacity-50 hover:bg-gray-50 transition"
              >
                ⟪
              </button>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 border border-border-light rounded-lg disabled:opacity-50 hover:bg-gray-50 transition"
              >
                <ChevronLeft className="w-5 h-5 text-text-muted" />
              </button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`w-10 h-10 rounded-lg font-medium transition ${
                      currentPage === pageNum
                        ? 'bg-primary-600 text-white'
                        : 'border border-border-light text-text-secondary hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 border border-border-light rounded-lg disabled:opacity-50 hover:bg-gray-50 transition"
              >
                <ChevronRight className="w-5 h-5 text-text-muted" />
              </button>
              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
                className="p-2 border border-border-light rounded-lg disabled:opacity-50 hover:bg-gray-50 transition"
              >
                ⟫
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default PaymentHistory