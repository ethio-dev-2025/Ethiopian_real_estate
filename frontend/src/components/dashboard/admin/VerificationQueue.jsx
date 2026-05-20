// src/components/dashboard/admin/VerificationQueue.jsx
import React, { useState, useEffect, useCallback } from 'react'
import { 
  CheckCircle, XCircle, Clock, Eye, RefreshCw, UserCheck, 
  Mail, Phone, Building2, Briefcase, FileText, 
  X, AlertCircle, User, Home, 
  Shield, Award, ThumbsUp, Download,
  Search, Users, Image, Camera, ChevronLeft, ChevronRight,
  File, ExternalLink, Maximize2, CreditCard
} from 'lucide-react'
import toast from 'react-hot-toast'

const API_URL = 'http://localhost:8000'

const VerificationQueue = () => {
  const [documentsRequests, setDocumentsRequests] = useState([])
  const [paymentRequests, setPaymentRequests] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('documents') // documents, payments, approved, rejected
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [showDocumentModal, setShowDocumentModal] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState(null)
  const [showPhotoModal, setShowPhotoModal] = useState(false)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [currentPhotoList, setCurrentPhotoList] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [imageErrors, setImageErrors] = useState({})
  const [processingId, setProcessingId] = useState(null)
  const [counts, setCounts] = useState({ pending_documents: 0, pending_payments: 0, approved: 0, rejected: 0 })

  // Fetch counts
  const fetchCounts = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_URL}/api/activation/admin/counts`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setCounts({
          pending_documents: data.pending_documents || 0,
          pending_payments: data.pending_payments || 0,
          approved: data.approved || 0,
          rejected: data.rejected || 0
        })
      }
    } catch (error) {
      console.error('Error fetching counts:', error)
    }
  }, [])

  // Fetch data based on active tab
  const fetchData = useCallback(async () => {
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

      let endpoint = ''
      switch(activeTab) {
        case 'documents':
          endpoint = `${API_URL}/api/activation/admin/pending-documents`
          break
        case 'payments':
          endpoint = `${API_URL}/api/activation/admin/pending-payments`
          break
        case 'approved':
          endpoint = `${API_URL}/api/activation/admin/payments?status=approved`
          break
        case 'rejected':
          endpoint = `${API_URL}/api/activation/admin/payments?status=rejected`
          break
        default:
          endpoint = `${API_URL}/api/activation/admin/pending-documents`
      }

      const response = await fetch(endpoint, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('access_token')
          setError('Session expired. Please login again.')
          toast.error('Session expired. Please login again.')
          setLoading(false)
          return
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      const requestsData = Array.isArray(data) ? data : []
      
      if (activeTab === 'documents') {
        setDocumentsRequests(requestsData)
      } else if (activeTab === 'payments') {
        setPaymentRequests(requestsData)
      }
      
      await fetchCounts()
      
    } catch (error) {
      console.error('Fetch error:', error)
      setError(error.message)
      toast.error(`Failed to load: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }, [activeTab, fetchCounts])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Get current display requests based on active tab
  const getCurrentRequests = () => {
    if (activeTab === 'documents') return documentsRequests
    if (activeTab === 'payments') return paymentRequests
    return []
  }

  const handleApproveDocuments = async (requestId) => {
    setProcessingId(requestId)
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_URL}/api/activation/admin/approve-documents/${requestId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        toast.success('✅ Documents approved! User can now subscribe.')
        fetchData()
        setSelectedRequest(null)
      } else {
        toast.error(data.detail || 'Failed to approve')
      }
    } catch (error) {
      console.error('Error approving:', error)
      toast.error('Failed to approve request')
    } finally {
      setProcessingId(null)
    }
  }

  const handleApprovePayment = async (requestId) => {
    setProcessingId(requestId)
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_URL}/api/activation/admin/approve-payment/${requestId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        toast.success('✅ Payment approved! Account fully activated.')
        fetchData()
        setSelectedRequest(null)
      } else {
        toast.error(data.detail || 'Failed to approve payment')
      }
    } catch (error) {
      console.error('Error approving payment:', error)
      toast.error('Failed to approve payment')
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (requestId) => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection')
      return
    }
    
    setProcessingId(requestId)
    try {
      const token = localStorage.getItem('access_token')
      
      // Determine which reject endpoint to use
      let endpoint = `${API_URL}/api/activation/admin/reject-payment/${requestId}`
      if (activeTab === 'documents') {
        endpoint = `${API_URL}/api/activation/admin/reject/${requestId}`
      }
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ rejection_reason: rejectionReason })
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        toast.success('❌ Request rejected')
        fetchData()
        setShowRejectModal(false)
        setRejectionReason('')
        setSelectedRequest(null)
      } else {
        toast.error(data.detail || 'Failed to reject')
      }
    } catch (error) {
      console.error('Error rejecting:', error)
      toast.error('Failed to reject request')
    } finally {
      setProcessingId(null)
    }
  }

  const getFullImageUrl = (path) => {
    if (!path) return null
    if (path.startsWith('http')) return path
    if (path.startsWith('/uploads')) return `${API_URL}${path}`
    return `${API_URL}/uploads/${path}`
  }

  const handleViewDocument = (docUrl, docName) => {
    if (!docUrl) {
      toast.error('Document not available')
      return
    }
    const fullUrl = getFullImageUrl(docUrl)
    setSelectedDocument({ url: fullUrl, name: docName, type: 'document' })
    setShowDocumentModal(true)
  }

  const handleViewPhoto = (photoPath, index, allPhotos) => {
    const urls = allPhotos.map(p => getFullImageUrl(p)).filter(Boolean)
    setCurrentPhotoList(urls)
    setCurrentPhotoIndex(index)
    setShowPhotoModal(true)
  }

  const handleImageError = (id) => {
    setImageErrors(prev => ({ ...prev, [id]: true }))
  }

  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending':
      case 'documents_pending':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs flex items-center gap-1"><Clock className="w-3 h-3" />Pending Documents</span>
      case 'payment_pending':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs flex items-center gap-1"><Clock className="w-3 h-3" />Payment Pending</span>
      case 'approved':
      case 'documents_approved':
        return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs flex items-center gap-1"><CheckCircle className="w-3 h-3" />Approved</span>
      case 'rejected':
        return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs flex items-center gap-1"><XCircle className="w-3 h-3" />Rejected</span>
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">{status}</span>
    }
  }

  const tabs = [
    { id: 'documents', label: 'Document Verification', count: counts.pending_documents, icon: FileText },
    { id: 'payments', label: 'Payment Approval', count: counts.pending_payments, icon: CreditCard },
  ]

  const currentRequests = getCurrentRequests()
  
  const filteredRequests = currentRequests.filter(req => 
    req.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.phone_number?.includes(searchTerm)
  )

  const documentItems = [
    { key: 'business_license', label: 'Business License', icon: '📋', color: 'text-green-600', bgColor: 'bg-green-50' },
    { key: 'ownership_document', label: 'Ownership Document', icon: '📄', color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { key: 'title_deed', label: 'Title Deed', icon: '🏠', color: 'text-purple-600', bgColor: 'bg-purple-50' },
    { key: 'tax_clearance', label: 'Tax Clearance', icon: '💰', color: 'text-orange-600', bgColor: 'bg-orange-50' },
    { key: 'government_id', label: 'Government ID', icon: '🆔', color: 'text-red-600', bgColor: 'bg-red-50' },
  ]

  const parsePropertyPhotos = (photos) => {
    if (!photos) return []
    try {
      if (typeof photos === 'string') {
        return JSON.parse(photos)
      }
      return Array.isArray(photos) ? photos : []
    } catch {
      return []
    }
  }

  // Document Modal Component
  const DocumentModal = () => {
    const [docLoading, setDocLoading] = useState(true)
    const isImage = selectedDocument?.url?.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/i)
    const isPdf = selectedDocument?.url?.match(/\.(pdf)$/i)
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              {selectedDocument?.name || 'Document Viewer'}
            </h3>
            <div className="flex gap-2">
              <a href={selectedDocument?.url} target="_blank" rel="noopener noreferrer" className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg" title="Open in new tab">
                <ExternalLink className="w-4 h-4" />
              </a>
              <a href={selectedDocument?.url} download className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg" title="Download">
                <Download className="w-4 h-4" />
              </a>
              <button onClick={() => setShowDocumentModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6 bg-gray-100 flex items-center justify-center min-h-[60vh]">
            {docLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            {isImage ? (
              <img 
                src={selectedDocument?.url} 
                alt="Document" 
                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
                onLoad={() => setDocLoading(false)}
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/800x600?text=Image+Not+Found'
                  setDocLoading(false)
                }}
              />
            ) : isPdf ? (
              <iframe 
                src={`${selectedDocument?.url}#toolbar=1`} 
                className="w-full h-[70vh] rounded-lg" 
                title="PDF Document"
                onLoad={() => setDocLoading(false)}
              />
            ) : (
              <div className="text-center">
                <File className="w-20 h-20 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">Preview not available for this file type</p>
                <a href={selectedDocument?.url} download className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <Download className="w-4 h-4" /> Download File
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Photo Gallery Modal
  const PhotoModal = () => {
    const currentUrl = currentPhotoList[currentPhotoIndex]
    const [imgLoading, setImgLoading] = useState(true)
    
    const nextPhoto = () => {
      if (currentPhotoIndex < currentPhotoList.length - 1) {
        setCurrentPhotoIndex(currentPhotoIndex + 1)
        setImgLoading(true)
      }
    }
    
    const prevPhoto = () => {
      if (currentPhotoIndex > 0) {
        setCurrentPhotoIndex(currentPhotoIndex - 1)
        setImgLoading(true)
      }
    }
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
        <div className="relative max-w-5xl w-full">
          <button onClick={() => setShowPhotoModal(false)} className="absolute top-4 right-4 text-white hover:text-gray-300 bg-black/50 rounded-full p-2 z-10">
            <X className="w-6 h-6" />
          </button>
          
          {currentPhotoList.length > 1 && currentPhotoIndex > 0 && (
            <button onClick={prevPhoto} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white bg-black/50 rounded-full p-2 hover:bg-black/70 transition">
              <ChevronLeft className="w-8 h-8" />
            </button>
          )}
          
          {currentPhotoList.length > 1 && currentPhotoIndex < currentPhotoList.length - 1 && (
            <button onClick={nextPhoto} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white bg-black/50 rounded-full p-2 hover:bg-black/70 transition">
              <ChevronRight className="w-8 h-8" />
            </button>
          )}
          
          <div className="flex justify-center items-center min-h-[80vh]">
            {imgLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            {currentUrl && (
              <img 
                src={currentUrl} 
                alt="Property" 
                className="max-w-full max-h-[80vh] object-contain rounded-lg"
                onLoad={() => setImgLoading(false)}
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/800x600?text=Image+Not+Found'
                  setImgLoading(false)
                }}
              />
            )}
          </div>
          
          {currentPhotoList.length > 1 && (
            <div className="absolute bottom-4 left-0 right-0 text-center text-white bg-black/50 py-2 rounded-full mx-auto w-32">
              {currentPhotoIndex + 1} / {currentPhotoList.length}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Request Detail Modal
  const RequestDetailModal = ({ request, onClose }) => {
    const photos = parsePropertyPhotos(request.property_photos)
    const isDocumentRequest = activeTab === 'documents'
    const isPaymentRequest = activeTab === 'payments'
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-blue-600" />
              {isDocumentRequest ? 'Document Verification Request' : 'Payment Verification Request'}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Personal Information */}
            <div className="border-b pb-4">
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                Personal Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-sm text-gray-500">Full Name</p><p className="font-medium">{request.full_name}</p></div>
                <div><p className="text-sm text-gray-500">Email</p><p className="font-medium">{request.email}</p></div>
                <div><p className="text-sm text-gray-500">Phone</p><p className="font-medium">{request.phone_number}</p></div>
                <div><p className="text-sm text-gray-500">Submitted</p><p className="font-medium">{request.created_at ? new Date(request.created_at).toLocaleDateString() : 'N/A'}</p></div>
              </div>
            </div>
            
            {/* Payment Information (for payment requests) */}
            {isPaymentRequest && (
              <div className="border-b pb-4">
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  Payment Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-sm text-gray-500">Plan Type</p><p className="font-medium capitalize">{request.plan_type}</p></div>
                  <div><p className="text-sm text-gray-500">Amount</p><p className="font-bold text-green-600">ETB {request.payment_amount?.toLocaleString()}</p></div>
                  {request.payment_transaction_id && (
                    <div><p className="text-sm text-gray-500">Transaction ID</p><p className="font-medium text-sm">{request.payment_transaction_id}</p></div>
                  )}
                </div>
              </div>
            )}
            
            {/* Property Information (for document requests) */}
            {isDocumentRequest && (
              <>
                <div className="border-b pb-4">
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Home className="w-4 h-4 text-blue-600" />
                    Property Information
                  </h3>
                  <div className="space-y-2">
                    <div><p className="text-sm text-gray-500">Property Address</p><p className="font-medium">{request.property_address}</p></div>
                    <div><p className="text-sm text-gray-500">Property Type</p><p className="font-medium capitalize">{request.property_type}</p></div>
                  </div>
                </div>
                
                {/* Business Information */}
                {(request.business_name || request.experience_years > 0 || request.reason_for_activation) && (
                  <div className="border-b pb-4">
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-blue-600" />
                      Business Information
                    </h3>
                    <div className="space-y-2">
                      {request.business_name && <div><p className="text-sm text-gray-500">Business Name</p><p className="font-medium">{request.business_name}</p></div>}
                      {request.experience_years > 0 && <div><p className="text-sm text-gray-500">Years of Experience</p><p className="font-medium">{request.experience_years} years</p></div>}
                      {request.reason_for_activation && <div><p className="text-sm text-gray-500">Reason for Activation</p><p className="font-medium">{request.reason_for_activation}</p></div>}
                    </div>
                  </div>
                )}
                
                {/* Uploaded Documents */}
                <div className="border-b pb-4">
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    Uploaded Documents
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {documentItems.map((doc) => {
                      const docValue = request[doc.key]
                      if (docValue) {
                        return (
                          <div key={doc.key} className={`${doc.bgColor} rounded-lg p-3 border`}>
                            <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                              <span>{doc.icon}</span> {doc.label}
                            </p>
                            <button 
                              onClick={() => handleViewDocument(docValue, doc.label)} 
                              className="flex items-center gap-2 w-full p-2 bg-white rounded-lg hover:shadow-md transition"
                            >
                              <FileText className={`w-5 h-5 ${doc.color}`} />
                              <span className="flex-1 text-left text-sm truncate">{docValue.split('/').pop()}</span>
                              <Eye className="w-4 h-4 text-gray-400" />
                            </button>
                          </div>
                        )
                      }
                      return null
                    })}
                  </div>
                  {!documentItems.some(doc => request[doc.key]) && (
                    <p className="text-gray-500 text-sm text-center py-4">No documents uploaded</p>
                  )}
                </div>
                
                {/* Property Photos */}
                {photos && photos.length > 0 && (
                  <div className="border-b pb-4">
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <Camera className="w-4 h-4 text-blue-600" />
                      Property Photos ({photos.length})
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                      {photos.map((photo, idx) => {
                        const photoUrl = getFullImageUrl(photo)
                        const hasError = imageErrors[`photo_${request.id}_${idx}`]
                        return (
                          <button
                            key={idx}
                            onClick={() => handleViewPhoto(photo, idx, photos)}
                            className="relative group aspect-square rounded-lg overflow-hidden border-2 hover:border-blue-500 transition bg-gray-100"
                          >
                            {!hasError && photoUrl ? (
                              <img 
                                src={photoUrl} 
                                alt={`Property ${idx + 1}`}
                                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                onError={() => handleImageError(`photo_${request.id}_${idx}`)}
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                                <Camera className="w-6 h-6 mb-1" />
                                <p className="text-xs">No Image</p>
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition flex items-center justify-center">
                              <Maximize2 className="w-6 h-6 text-white opacity-0 group-hover:opacity-100" />
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
            
            {/* Status */}
            <div>
              <h3 className="font-semibold text-lg mb-3">Status</h3>
              <div className="flex items-center gap-2 mb-4">{getStatusBadge(request.status)}</div>
              {request.rejection_reason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-700"><strong>Rejection Reason:</strong> {request.rejection_reason}</p>
                </div>
              )}
            </div>
            
            {/* Action Buttons */}
            {isDocumentRequest && request.status === 'documents_pending' && (
              <div className="flex gap-3 pt-4 border-t">
                <button 
                  onClick={() => handleApproveDocuments(request.id)} 
                  disabled={processingId === request.id}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {processingId === request.id ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <CheckCircle className="w-4 h-4" />}
                  Approve Documents
                </button>
                <button 
                  onClick={() => { setSelectedRequest(request); setShowRejectModal(true); onClose() }} 
                  disabled={processingId === request.id}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </button>
              </div>
            )}
            
            {isPaymentRequest && request.status === 'payment_pending' && (
              <div className="flex gap-3 pt-4 border-t">
                <button 
                  onClick={() => handleApprovePayment(request.id)} 
                  disabled={processingId === request.id}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {processingId === request.id ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <CheckCircle className="w-4 h-4" />}
                  Approve Payment
                </button>
                <button 
                  onClick={() => { setSelectedRequest(request); setShowRejectModal(true); onClose() }} 
                  disabled={processingId === request.id}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const RejectModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full">
        <h3 className="text-xl font-bold mb-4">Reject Request</h3>
        <p className="text-gray-600 mb-4">Please provide a reason for rejection:</p>
        <textarea 
          value={rejectionReason} 
          onChange={(e) => setRejectionReason(e.target.value)} 
          rows="4" 
          className="w-full p-3 border rounded-lg mb-4 focus:ring-2 focus:ring-red-500 focus:border-red-500" 
          placeholder="Enter rejection reason..."
          autoFocus
        />
        <div className="flex gap-3">
          <button onClick={() => setShowRejectModal(false)} className="flex-1 px-4 py-2 border rounded-lg">Cancel</button>
          <button onClick={() => handleReject(selectedRequest?.id)} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg">Confirm Reject</button>
        </div>
      </div>
    </div>
  )

  // Loading skeleton
  if (loading && currentRequests.length === 0) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <div className="h-8 bg-gray-200 rounded w-64 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-96 animate-pulse"></div>
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6 w-fit">
          {['Document Verification', 'Payment Approval'].map(tab => (
            <div key={tab} className="px-6 py-2 rounded-lg">
              <div className="h-5 bg-gray-200 rounded w-20 animate-pulse"></div>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <div className="divide-y">
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

  if (error && currentRequests.length === 0) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Verification Queue</h1>
          <p className="text-gray-500">Review and manage activation requests from users</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-12 text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-red-700 mb-2">Error Loading Data</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => fetchData()} 
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {showDocumentModal && <DocumentModal />}
      {showPhotoModal && <PhotoModal />}
      {selectedRequest && !showRejectModal && <RequestDetailModal request={selectedRequest} onClose={() => setSelectedRequest(null)} />}
      {showRejectModal && <RejectModal />}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Verification Queue</h1>
        <p className="text-gray-500">Review and manage activation requests from users</p>
      </div>

      {/* Search */}
      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input 
          type="text" 
          placeholder="Search by name, email, or phone..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" 
        />
      </div>

      {/* Tabs with counts */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6 w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button 
              key={tab.id} 
              onClick={() => setActiveTab(tab.id)} 
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${activeTab === tab.id ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            >
              <Icon className="w-4 h-4" />{tab.label} ({tab.count})
            </button>
          )
        })}
      </div>

      {/* Refresh Button */}
      <div className="flex justify-end mb-4">
        <button 
          onClick={() => fetchData()} 
          disabled={loading}
          className="px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> 
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* Requests List */}
      {filteredRequests.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border p-12 text-center">
          <CheckCircle className="w-16 h-16 text-green-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No {activeTab === 'documents' ? 'document verification' : 'payment approval'} requests</h3>
          <p className="text-gray-500">All caught up!</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <div className="divide-y">
            {filteredRequests.map((req) => {
              const photos = parsePropertyPhotos(req.property_photos)
              const photoCount = photos.length
              const isDocumentRequest = activeTab === 'documents'
              
              return (
                <div key={req.id} className="p-6 hover:bg-gray-50 transition">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="font-semibold text-lg">{req.full_name}</h3>
                        {getStatusBadge(req.status)}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-3">
                        <div><p className="text-gray-500">Email</p><p className="font-medium">{req.email}</p></div>
                        <div><p className="text-gray-500">Phone</p><p className="font-medium">{req.phone_number}</p></div>
                        {isDocumentRequest && (
                          <div><p className="text-gray-500">Property Type</p><p className="font-medium capitalize">{req.property_type}</p></div>
                        )}
                        {!isDocumentRequest && req.plan_type && (
                          <div><p className="text-gray-500">Plan</p><p className="font-medium capitalize">{req.plan_type}</p></div>
                        )}
                        {!isDocumentRequest && req.payment_amount && (
                          <div><p className="text-gray-500">Amount</p><p className="font-bold text-green-600">ETB {req.payment_amount?.toLocaleString()}</p></div>
                        )}
                      </div>
                      {isDocumentRequest && req.property_address && (
                        <p className="text-sm text-gray-600 mb-2">{req.property_address}</p>
                      )}
                      
                      {/* Document Indicators */}
                      {isDocumentRequest && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {req.business_license && (
                            <button onClick={() => handleViewDocument(req.business_license, 'Business License')} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1 hover:bg-green-200 transition">
                              📋 Business License
                            </button>
                          )}
                          {req.ownership_document && (
                            <button onClick={() => handleViewDocument(req.ownership_document, 'Ownership Document')} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full flex items-center gap-1 hover:bg-blue-200 transition">
                              📄 Ownership Document
                            </button>
                          )}
                          {req.title_deed && (
                            <button onClick={() => handleViewDocument(req.title_deed, 'Title Deed')} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full flex items-center gap-1 hover:bg-purple-200 transition">
                              🏠 Title Deed
                            </button>
                          )}
                          {req.tax_clearance && (
                            <button onClick={() => handleViewDocument(req.tax_clearance, 'Tax Clearance')} className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full flex items-center gap-1 hover:bg-orange-200 transition">
                              💰 Tax Clearance
                            </button>
                          )}
                          {req.government_id && (
                            <button onClick={() => handleViewDocument(req.government_id, 'Government ID')} className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full flex items-center gap-1 hover:bg-red-200 transition">
                              🆔 Government ID
                            </button>
                          )}
                          {photoCount > 0 && (
                            <button onClick={() => photos[0] && handleViewPhoto(photos[0], 0, photos)} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full flex items-center gap-1 hover:bg-purple-200 transition">
                              <Camera className="w-3 h-3" /> {photoCount} Photo{photoCount !== 1 ? 's' : ''}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setSelectedRequest(req)} 
                        className="px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" /> View Details
                      </button>
                      {isDocumentRequest && req.status === 'documents_pending' && (
                        <>
                          <button 
                            onClick={() => handleApproveDocuments(req.id)} 
                            disabled={processingId === req.id}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 flex items-center gap-1 disabled:opacity-50"
                          >
                            {processingId === req.id ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <CheckCircle className="w-4 h-4" />}
                            Approve
                          </button>
                          <button 
                            onClick={() => { setSelectedRequest(req); setShowRejectModal(true) }} 
                            disabled={processingId === req.id}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 flex items-center gap-1 disabled:opacity-50"
                          >
                            <XCircle className="w-4 h-4" />
                            Reject
                          </button>
                        </>
                      )}
                      {!isDocumentRequest && req.status === 'payment_pending' && (
                        <>
                          <button 
                            onClick={() => handleApprovePayment(req.id)} 
                            disabled={processingId === req.id}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 flex items-center gap-1 disabled:opacity-50"
                          >
                            {processingId === req.id ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <CheckCircle className="w-4 h-4" />}
                            Approve Payment
                          </button>
                          <button 
                            onClick={() => { setSelectedRequest(req); setShowRejectModal(true) }} 
                            disabled={processingId === req.id}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 flex items-center gap-1 disabled:opacity-50"
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

export default VerificationQueue