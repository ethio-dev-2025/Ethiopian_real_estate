// src/components/dashboard/admin/PaymentHistory.jsx
import React, { useState, useEffect, useCallback } from 'react'
import { 
  CheckCircle, XCircle, Clock, Eye, RefreshCw, 
  Mail, Phone, FileText, 
  X, AlertCircle, User, 
  Download,
  Search, ChevronLeft, ChevronRight,
  Calendar, CreditCard, DollarSign, Printer, Zap
} from 'lucide-react'
import toast from 'react-hot-toast'

const API_URL = 'http://localhost:8000'
const WS_URL = 'ws://localhost:8000'

const PaymentHistory = () => {
  const [allPayments, setAllPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPayment, setSelectedPayment] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [lastPaymentCount, setLastPaymentCount] = useState(0)
  const [newPaymentAlert, setNewPaymentAlert] = useState(false)

  // FIXED: Correct time formatting with 12-hour and AM/PM
  const formatRealDateTime = (dateString) => {
    if (!dateString) return 'Date not available'
    
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return 'Invalid date'
      }
      
      // Get local time components
      const year = date.getFullYear()
      const month = date.toLocaleString('default', { month: 'short' })
      const day = date.getDate()
      let hours = date.getHours()
      const minutes = date.getMinutes().toString().padStart(2, '0')
      const seconds = date.getSeconds().toString().padStart(2, '0')
      const ampm = hours >= 12 ? 'PM' : 'AM'
      
      // Convert to 12-hour format
      hours = hours % 12
      hours = hours ? hours : 12 // 12-hour format (0 becomes 12)
      
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
        const allData = await response.json()
        const payments = Array.isArray(allData) ? allData : []
        
        // Sort by created_at in DESCENDING order (newest first)
        const sortedPayments = payments.sort((a, b) => {
          const dateA = new Date(a.created_at)
          const dateB = new Date(b.created_at)
          return dateB - dateA
        })
        
        // Check for new payments
        if (lastPaymentCount > 0 && sortedPayments.length > lastPaymentCount) {
          const newCount = sortedPayments.length - lastPaymentCount
          setNewPaymentAlert(true)
          toast.success(`💰 ${newCount} new payment${newCount > 1 ? 's' : ''} received!`, {
            duration: 5000,
            icon: '🎉'
          })
          setTimeout(() => setNewPaymentAlert(false), 5000)
        }
        
        setLastPaymentCount(sortedPayments.length)
        setAllPayments(sortedPayments)
        setCurrentPage(1) // Reset to first page on new data
        
        console.log(`✅ Loaded ${sortedPayments.length} payments, newest first`)
        console.log('Newest payment:', sortedPayments[0]?.user_name, formatRealDateTime(sortedPayments[0]?.created_at))
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
  }, [lastPaymentCount])

  // WebSocket for real-time updates
  useEffect(() => {
    let ws = null
    let reconnectTimeout = null

    const connectWebSocket = () => {
      try {
        const token = localStorage.getItem('access_token')
        if (!token) return

        ws = new WebSocket(`${WS_URL}/ws/payments?token=${token}`)

        ws.onopen = () => {
          console.log('🔌 WebSocket connected for real-time payments')
        }

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            console.log('📡 WebSocket message:', data)
            
            if (data.type === 'new_payment') {
              toast.success(`💳 New payment from ${data.user_name || 'User'}!`, {
                duration: 10000,
                icon: '💰'
              })
              fetchAllPayments() // Refresh immediately
            }
          } catch (e) {
            console.error('WebSocket message error:', e)
          }
        }

        ws.onerror = (error) => {
          console.error('WebSocket error:', error)
        }

        ws.onclose = () => {
          console.log('🔌 WebSocket disconnected, reconnecting in 5 seconds...')
          reconnectTimeout = setTimeout(connectWebSocket, 5000)
        }
      } catch (error) {
        console.error('WebSocket connection error:', error)
        reconnectTimeout = setTimeout(connectWebSocket, 5000)
      }
    }

    connectWebSocket()

    return () => {
      if (ws) ws.close()
      if (reconnectTimeout) clearTimeout(reconnectTimeout)
    }
  }, [fetchAllPayments])

  // Polling fallback (every 10 seconds for real-time)
  useEffect(() => {
    fetchAllPayments()
    const interval = setInterval(fetchAllPayments, 10000) // Check every 10 seconds
    return () => clearInterval(interval)
  }, [fetchAllPayments])

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
              background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
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
              <button onclick="window.print()" style="padding: 8px 16px; background: #2563EB; color: white; border: none; border-radius: 6px; cursor: pointer;">🖨️ Print</button>
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
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs flex items-center gap-1"><Clock className="w-3 h-3" />Pending</span>
    }
    if (statusLower === 'approved') {
      return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs flex items-center gap-1"><CheckCircle className="w-3 h-3" />Paid</span>
    }
    if (statusLower === 'rejected') {
      return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs flex items-center gap-1"><XCircle className="w-3 h-3" />Rejected</span>
    }
    return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">{status}</span>
  }

  // Filter payments
  const filteredPayments = allPayments.filter(payment => 
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
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">User Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-sm text-gray-500">Name</p><p className="font-medium">{selectedPayment.user_name}</p></div>
                <div><p className="text-sm text-gray-500">Email</p><p className="font-medium">{selectedPayment.user_email}</p></div>
                <div><p className="text-sm text-gray-500">Phone</p><p className="font-medium">{selectedPayment.phone_number || 'N/A'}</p></div>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Payment Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-sm text-gray-500">Plan</p><p className="font-medium capitalize">{selectedPayment.plan_type}</p></div>
                <div><p className="text-sm text-gray-500">Amount</p><p className="font-bold text-green-600">{formatAmount(selectedPayment.amount)}</p></div>
                <div><p className="text-sm text-gray-500">Status</p><div>{getStatusBadge(selectedPayment.status)}</div></div>
                <div><p className="text-sm text-gray-500">Transaction ID</p><p className="font-medium text-sm break-all">{selectedPayment.transaction_id}</p></div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Payment Date & Time</p>
                  <p className="font-medium">{formatRealDateTime(selectedPayment.created_at)}</p>
                </div>
              </div>
            </div>
            
            <div>
              <button 
                onClick={() => handleDownloadReceipt(selectedPayment.id)} 
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
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
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {showDetailsModal && <DetailsModal />}

      {/* Real-time indicator */}
      {newPaymentAlert && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2 animate-pulse">
          <Zap className="w-5 h-5 text-green-600" />
          <span className="text-green-700 font-medium">New payment received! Refreshing data...</span>
        </div>
      )}

      <div className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payment History</h1>
            <p className="text-gray-500 mt-1">Real-time payment tracking with correct time display</p>
          </div>
          
          <div className="flex gap-3">
            <div className="bg-white rounded-lg px-4 py-2 text-center shadow-sm border border-gray-200">
              <p className="text-xs text-gray-500">Total Payments</p>
              <p className="text-xl font-bold text-gray-800">{allPayments.length}</p>
            </div>
            <div className="bg-white rounded-lg px-4 py-2 text-center shadow-sm border border-gray-200">
              <p className="text-xs text-gray-500">Total Revenue</p>
              <p className="text-xl font-bold text-green-600">
                ETB {allPayments.reduce((sum, p) => sum + (p.amount || 0), 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-green-50 rounded-lg px-4 py-2 text-center shadow-sm border border-green-200">
              <div className="flex items-center gap-1">
                <Zap className="w-4 h-4 text-green-600" />
                <p className="text-xs text-green-600">Live</p>
              </div>
              <p className="text-xs text-green-500">Auto-refresh</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input 
          type="text" 
          placeholder="Search by name, email, phone, or transaction ID..." 
          value={searchTerm} 
          onChange={(e) => {
            setSearchTerm(e.target.value)
            setCurrentPage(1)
          }} 
          className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500" 
        />
      </div>

      {/* Stats */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-gray-500">
          Showing {filteredPayments.length > 0 ? indexOfFirstItem + 1 : 0} - {Math.min(indexOfLastItem, filteredPayments.length)} of {filteredPayments.length} payments
          <span className="ml-2 text-xs text-blue-600 font-medium">(Newest first - 12-hour format)</span>
        </div>
        <button 
          onClick={() => fetchAllPayments()} 
          disabled={loading}
          className="px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> 
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {filteredPayments.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Payments Found</h3>
          <p className="text-gray-500">No payment records available yet.</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-4 text-sm font-semibold text-gray-600">User</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-600">Contact</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-600">Plan</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-600">Amount</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-600">Payment Date & Time</th>
                    <th className="text-center p-4 text-sm font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {currentPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50 transition">
                      <td className="p-4">
                        <p className="font-medium text-gray-900">{payment.user_name || 'Unknown'}</p>
                        <p className="text-xs text-gray-400">ID: {payment.user_id}</p>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
                          <Mail className="w-3 h-3" />
                          <span className="truncate max-w-[150px]">{payment.user_email}</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Phone className="w-3 h-3" />
                          <span>{payment.phone_number || 'No phone'}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="capitalize text-sm font-medium">{payment.plan_type}</span>
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-green-600">{formatAmount(payment.amount)}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1 text-sm text-gray-700">
                          <Calendar className="w-3 h-3" />
                          <span className="font-mono">{formatRealDateTime(payment.created_at)}</span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <button 
                          onClick={() => { setSelectedPayment(payment); setShowDetailsModal(true); }} 
                          className="px-3 py-1.5 border rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-1 mx-auto"
                        >
                          <Eye className="w-4 h-4" /> Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="p-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
              >
                ⟪
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
              >
                <ChevronLeft className="w-5 h-5" />
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
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-10 h-10 rounded-lg font-medium transition ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'border text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="p-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
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