// src/components/dashboard/admin/VerificationQueue.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react'
import { 
  CheckCircle, XCircle, Clock, Eye, RefreshCw, UserCheck, 
  Mail, Phone, Building2, Briefcase, FileText, 
  X, AlertCircle, User, Home, 
  Shield, ThumbsUp, Download,
  Search, Camera, ChevronLeft, ChevronRight,
  File, ExternalLink, Maximize2, Calendar, Award, List
} from 'lucide-react'
import toast from 'react-hot-toast'

const API_URL = 'http://localhost:8000'

const VerificationQueue = () => {
  const [pendingRequests, setPendingRequests] = useState([])
  const [approvedRequests, setApprovedRequests] = useState([])
  const [rejectedRequests, setRejectedRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('pending')
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [showDocumentModal, setShowDocumentModal] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState(null)
  const [showPhotoModal, setShowPhotoModal] = useState(false)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [currentPhotoList, setCurrentPhotoList] = useState([])
  const [imageErrors, setImageErrors] = useState({})
  const [processingId, setProcessingId] = useState(null)
  
  const isFetchingRef = useRef(false)
  const initialLoadDoneRef = useRef(false)

  useEffect(() => {
    const markAsViewed = async () => {
      try {
        const token = localStorage.getItem('access_token')
        if (!token) return
        
        await fetch(`${API_URL}/api/activation/admin/mark-queue-viewed`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        })
        
        const now = Date.now()
        localStorage.setItem('lastQueueViewTime', now.toString())
        
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'lastQueueViewTime',
          newValue: now.toString()
        }))
        
        console.log('✅ Verification queue marked as viewed')
      } catch (e) {
        console.error('Error marking queue viewed:', e)
      }
    }
    
    markAsViewed()
  }, [])

  useEffect(() => {
    if (showDocumentModal || showPhotoModal || selectedRequest || showRejectModal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [showDocumentModal, showPhotoModal, selectedRequest, showRejectModal])

  const fetchAllRequests = useCallback(async (silent = false) => {
    if (isFetchingRef.current) {
      console.log('⏳ Fetch already in progress, skipping...')
      return
    }
    
    if (!silent) {
      setLoading(true)
    }
    setError(null)
    isFetchingRef.current = true
    
    try {
      const token = localStorage.getItem('access_token')
      
      if (!token) {
        setError('Please login again')
        toast.error('Please login again')
        setLoading(false)
        isFetchingRef.current = false
        return
      }

      const allRequestsResponse = await fetch(`${API_URL}/api/activation/admin/all-requests`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (allRequestsResponse.ok) {
        const allData = await allRequestsResponse.json()
        let allRequests = Array.isArray(allData) ? allData : []
        
        allRequests = allRequests.sort((a, b) => {
          const dateA = new Date(a.created_at)
          const dateB = new Date(b.created_at)
          return dateB - dateA
        })
        
        const pending = allRequests.filter(req => {
          const status = req.status?.toLowerCase() || ''
          return status === 'documents_pending' || status === 'pending'
        })
        
        const approved = allRequests.filter(req => {
          const status = req.status?.toLowerCase() || ''
          return status === 'documents_approved' || status === 'approved'
        })
        
        const fullyActivated = allRequests.filter(req => {
          const status = req.status?.toLowerCase() || ''
          return status === 'fully_activated'
        })
        
        const rejected = allRequests.filter(req => {
          const status = req.status?.toLowerCase() || ''
          return status === 'rejected'
        })
        
        setPendingRequests(pending)
        setApprovedRequests([...approved, ...fullyActivated])
        setRejectedRequests(rejected)
        
        console.log(`📊 Requests loaded - Pending: ${pending.length}, Approved: ${approved.length}, Fully Activated: ${fullyActivated.length}, Rejected: ${rejected.length}`)
      } else {
        console.error('Failed to fetch requests')
        if (!silent) {
          setError('Failed to load verification requests')
        }
      }
      
    } catch (error) {
      console.error('Fetch error:', error)
      if (!silent) {
        setError(error.message)
        toast.error(`Failed to load: ${error.message}`)
      }
    } finally {
      if (!silent) {
        setLoading(false)
      }
      isFetchingRef.current = false
    }
  }, [])

  useEffect(() => {
    if (!initialLoadDoneRef.current) {
      initialLoadDoneRef.current = true
      fetchAllRequests()
    }
  }, [fetchAllRequests])

  const handleApprove = async (requestId) => {
    setProcessingId(requestId)
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_URL}/api/activation/admin/approve-documents/${requestId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        toast.success('✅ Documents approved!')
        setSelectedRequest(null)
        await fetchAllRequests(true)
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

  const handleReject = async (requestId, reason) => {
    if (!reason || !reason.trim()) {
      toast.error('Please provide a reason for rejection')
      return
    }
    
    setProcessingId(requestId)
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_URL}/api/activation/admin/reject/${requestId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ rejection_reason: reason })
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        toast.success('❌ Request rejected successfully')
        await fetchAllRequests(true)
        setShowRejectModal(false)
        setSelectedRequest(null)
      } else {
        toast.error(data.detail || 'Failed to reject request')
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
    const statusLower = status?.toLowerCase() || ''
    
    if (statusLower === 'documents_pending' || statusLower === 'pending') {
      return <span className="px-2 py-1 bg-warning/10 text-warning rounded-full text-xs flex items-center gap-1"><Clock className="w-3 h-3" />Pending Review</span>
    }
    if (statusLower === 'documents_approved' || statusLower === 'approved') {
      return <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs flex items-center gap-1"><CheckCircle className="w-3 h-3" />Docs Approved</span>
    }
    if (statusLower === 'fully_activated') {
      return <span className="px-2 py-1 bg-success/10 text-success rounded-full text-xs flex items-center gap-1"><CheckCircle className="w-3 h-3" />Fully Active</span>
    }
    if (statusLower === 'rejected') {
      return <span className="px-2 py-1 bg-error/10 text-error rounded-full text-xs flex items-center gap-1"><XCircle className="w-3 h-3" />Rejected</span>
    }
    return <span className="px-2 py-1 bg-gray-100 text-text-muted rounded-full text-xs">{status}</span>
  }

  const getCurrentRequests = () => {
    let requests = []
    if (activeTab === 'pending') requests = [...pendingRequests]
    else if (activeTab === 'approved') requests = [...approvedRequests]
    else if (activeTab === 'rejected') requests = [...rejectedRequests]
    else if (activeTab === 'all') requests = [...pendingRequests, ...approvedRequests, ...rejectedRequests]
    
    return requests.sort((a, b) => {
      const dateA = new Date(a.created_at)
      const dateB = new Date(b.created_at)
      return dateB - dateA
    })
  }

  const currentRequests = getCurrentRequests()
  
  const filteredRequests = currentRequests.filter(req => 
    req.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.phone_number?.includes(searchTerm)
  )

  const documentItems = [
    { key: 'business_license', label: 'Business License', icon: '📋', color: 'text-success', bgColor: 'bg-success/10' },
    { key: 'ownership_document', label: 'Ownership Document', icon: '📄', color: 'text-primary-600', bgColor: 'bg-primary-50' },
    { key: 'title_deed', label: 'Title Deed', icon: '🏠', color: 'text-secondary-600', bgColor: 'bg-secondary-50' },
    { key: 'tax_clearance', label: 'Tax Clearance', icon: '💰', color: 'text-warning', bgColor: 'bg-warning/10' },
    { key: 'government_id', label: 'Government ID', icon: '🆔', color: 'text-error', bgColor: 'bg-error/10' },
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

  const DocumentModal = () => {
    const [docLoading, setDocLoading] = useState(true)
    const isImage = selectedDocument?.url?.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/i)
    const isPdf = selectedDocument?.url?.match(/\.(pdf)$/i)
    
    if (!showDocumentModal || !selectedDocument) return null
    
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4" onClick={() => { setShowDocumentModal(false); setSelectedDocument(null); setDocLoading(true) }}>
        <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-border-light relative z-[101]" onClick={(e) => e.stopPropagation()}>
          <div className="sticky top-0 bg-white border-b border-border-light p-4 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary-600" />
              {selectedDocument?.name || 'Document Viewer'}
            </h3>
            <div className="flex gap-2">
              <a href={selectedDocument?.url} target="_blank" rel="noopener noreferrer" className="p-2 text-text-muted hover:bg-gray-100 rounded-lg transition" title="Open in new tab">
                <ExternalLink className="w-4 h-4" />
              </a>
              <a href={selectedDocument?.url} download className="p-2 text-text-muted hover:bg-gray-100 rounded-lg transition" title="Download">
                <Download className="w-4 h-4" />
              </a>
              <button onClick={() => { setShowDocumentModal(false); setSelectedDocument(null); setDocLoading(true) }} className="p-2 text-text-muted hover:bg-gray-100 rounded-lg transition">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6 bg-gray-100 flex items-center justify-center min-h-[60vh]">
            {docLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
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
                <File className="w-20 h-20 text-text-muted mx-auto mb-4" />
                <p className="text-text-muted mb-4">Preview not available for this file type</p>
                <a href={selectedDocument?.url} download className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition">
                  <Download className="w-4 h-4" /> Download File
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const PhotoModal = () => {
    const currentUrl = currentPhotoList[currentPhotoIndex]
    const [imgLoading, setImgLoading] = useState(true)
    
    if (!showPhotoModal) return null
    
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
      <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[100] p-4" onClick={() => setShowPhotoModal(false)}>
        <div className="relative max-w-5xl w-full z-[101]" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => setShowPhotoModal(false)} className="absolute top-4 right-4 text-white hover:text-gray-300 bg-black/50 rounded-full p-2 z-20 transition">
            <X className="w-6 h-6" />
          </button>
          
          {currentPhotoList.length > 1 && currentPhotoIndex > 0 && (
            <button onClick={prevPhoto} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white bg-black/50 rounded-full p-2 hover:bg-black/70 transition z-20">
              <ChevronLeft className="w-8 h-8" />
            </button>
          )}
          
          {currentPhotoList.length > 1 && currentPhotoIndex < currentPhotoList.length - 1 && (
            <button onClick={nextPhoto} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white bg-black/50 rounded-full p-2 hover:bg-black/70 transition z-20">
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
            <div className="absolute bottom-4 left-0 right-0 text-center text-white bg-black/50 py-2 rounded-full mx-auto w-32 z-20">
              {currentPhotoIndex + 1} / {currentPhotoList.length}
            </div>
          )}
        </div>
      </div>
    )
  }

  const RequestDetailModal = ({ request, onClose }) => {
    const photos = parsePropertyPhotos(request.property_photos)
    const isApproved = request.status?.toLowerCase() === 'documents_approved' || request.status?.toLowerCase() === 'approved'
    const isFullyActivated = request.status?.toLowerCase() === 'fully_activated'
    const isRejected = request.status?.toLowerCase() === 'rejected'
    
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={onClose}>
        <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-border-light relative" onClick={(e) => e.stopPropagation()}>
          <div className="sticky top-0 bg-white border-b border-border-light p-4 flex justify-between items-center z-10">
            <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-primary-600" />
              Document Verification Request
              {isFullyActivated && <span className="ml-2 px-2 py-1 bg-success/10 text-success rounded-full text-xs">Fully Active</span>}
              {isApproved && <span className="ml-2 px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs">Docs Approved</span>}
              {isRejected && <span className="ml-2 px-2 py-1 bg-error/10 text-error rounded-full text-xs">Rejected</span>}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
              <X className="w-5 h-5 text-text-muted" />
            </button>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="border-b border-border-light pb-4">
              <h3 className="font-semibold text-text-primary text-lg mb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-primary-600" />
                Personal Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-sm text-text-muted">Full Name</p><p className="font-medium text-text-primary">{request.full_name}</p></div>
                <div><p className="text-sm text-text-muted">Email</p><p className="font-medium text-text-primary">{request.email}</p></div>
                <div><p className="text-sm text-text-muted">Phone</p><p className="font-medium text-text-primary">{request.phone_number}</p></div>
                <div><p className="text-sm text-text-muted">Submitted</p><p className="font-medium text-text-primary">{request.created_at ? new Date(request.created_at).toLocaleString() : 'N/A'}</p></div>
              </div>
            </div>
            
            <div className="border-b border-border-light pb-4">
              <h3 className="font-semibold text-text-primary text-lg mb-3 flex items-center gap-2">
                <Home className="w-4 h-4 text-primary-600" />
                Property Information
              </h3>
              <div className="space-y-2">
                <div><p className="text-sm text-text-muted">Property Address</p><p className="font-medium text-text-primary">{request.property_address}</p></div>
                <div><p className="text-sm text-text-muted">Property Type</p><p className="font-medium text-text-primary capitalize">{request.property_type}</p></div>
              </div>
            </div>
            
            {(request.business_name || request.experience_years > 0 || request.reason_for_activation) && (
              <div className="border-b border-border-light pb-4">
                <h3 className="font-semibold text-text-primary text-lg mb-3 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-primary-600" />
                  Business Information
                </h3>
                <div className="space-y-2">
                  {request.business_name && <div><p className="text-sm text-text-muted">Business Name</p><p className="font-medium text-text-primary">{request.business_name}</p></div>}
                  {request.experience_years > 0 && <div><p className="text-sm text-text-muted">Years of Experience</p><p className="font-medium text-text-primary">{request.experience_years} years</p></div>}
                  {request.reason_for_activation && <div><p className="text-sm text-text-muted">Reason for Activation</p><p className="font-medium text-text-primary">{request.reason_for_activation}</p></div>}
                </div>
              </div>
            )}
            
            <div className="border-b border-border-light pb-4">
              <h3 className="font-semibold text-text-primary text-lg mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary-600" />
                Uploaded Documents
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {documentItems.map((doc) => {
                  const docValue = request[doc.key]
                  if (docValue) {
                    return (
                      <div key={doc.key} className={`${doc.bgColor} rounded-lg p-3 border border-border-light`}>
                        <p className="text-sm font-medium text-text-primary mb-2 flex items-center gap-2">
                          <span>{doc.icon}</span> {doc.label}
                        </p>
                        <button 
                          onClick={() => handleViewDocument(docValue, doc.label)} 
                          className="flex items-center gap-2 w-full p-2 bg-white rounded-lg hover:bg-gray-50 transition border border-border-light"
                        >
                          <FileText className={`w-5 h-5 ${doc.color}`} />
                          <span className="flex-1 text-left text-sm truncate text-text-secondary">{docValue.split('/').pop()}</span>
                          <Eye className="w-4 h-4 text-text-muted" />
                        </button>
                      </div>
                    )
                  }
                  return null
                })}
              </div>
              {!documentItems.some(doc => request[doc.key]) && (
                <p className="text-text-muted text-sm text-center py-4">No documents uploaded</p>
              )}
            </div>
            
            {photos && photos.length > 0 && (
              <div className="border-b border-border-light pb-4">
                <h3 className="font-semibold text-text-primary text-lg mb-3 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-primary-600" />
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
                        className="relative group aspect-square rounded-lg overflow-hidden border-2 border-border-light hover:border-primary-500 transition bg-gray-100"
                      >
                        {!hasError && photoUrl ? (
                          <img 
                            src={photoUrl} 
                            alt={`Property ${idx + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                            onError={() => handleImageError(`photo_${request.id}_${idx}`)}
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-text-muted">
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
            
            <div>
              <h3 className="font-semibold text-text-primary text-lg mb-3">Status</h3>
              <div className="flex items-center gap-2 mb-4">{getStatusBadge(request.status)}</div>
              {request.reviewed_at && (
                <p className="text-xs text-text-muted mt-2">Reviewed on: {new Date(request.reviewed_at).toLocaleString()}</p>
              )}
              {request.rejection_reason && (
                <div className="bg-error/10 border border-error/20 rounded-lg p-4 mt-3">
                  <p className="text-sm text-error"><strong>Rejection Reason:</strong> {request.rejection_reason}</p>
                </div>
              )}
              {request.plan_type && request.payment_amount && (
                <div className="bg-success/10 border border-success/20 rounded-lg p-4 mt-3">
                  <p className="text-sm text-success"><strong>Plan:</strong> {request.plan_type} | <strong>Amount:</strong> ETB {request.payment_amount}</p>
                </div>
              )}
            </div>
            
            {(request.status?.toLowerCase() === 'documents_pending' || request.status?.toLowerCase() === 'pending') && (
              <div className="flex gap-3 pt-4 border-t border-border-light">
                <button 
                  onClick={() => handleApprove(request.id)} 
                  disabled={processingId === request.id}
                  className="flex-1 px-4 py-2 bg-success text-white rounded-lg font-semibold hover:bg-green-700 flex items-center justify-center gap-2 transition disabled:opacity-50"
                >
                  {processingId === request.id ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <CheckCircle className="w-4 h-4" />}
                  Approve Documents
                </button>
                <button 
                  onClick={() => { setSelectedRequest(request); setShowRejectModal(true); onClose() }} 
                  disabled={processingId === request.id}
                  className="flex-1 px-4 py-2 bg-error text-white rounded-lg font-semibold hover:bg-red-700 flex items-center justify-center gap-2 transition disabled:opacity-50"
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

  const RejectModal = () => {
    const [localReason, setLocalReason] = useState('')
    
    const handleConfirmReject = () => {
      if (!localReason.trim()) {
        toast.error('Please provide a reason for rejection')
        return
      }
      if (selectedRequest?.id) {
        handleReject(selectedRequest.id, localReason)
      }
      setShowRejectModal(false)
      setLocalReason('')
    }
    
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-border-light shadow-xl">
          <h3 className="text-xl font-bold text-text-primary mb-4">Reject Request</h3>
          <p className="text-text-secondary mb-4">Please provide a reason for rejection:</p>
          <textarea 
            value={localReason}
            onChange={(e) => setLocalReason(e.target.value)}
            rows="4"
            className="w-full p-3 bg-gray-50 border border-border-light rounded-lg text-text-primary placeholder-text-muted focus:ring-2 focus:ring-error focus:border-error"
            placeholder="Type your rejection reason here..."
            autoFocus
          />
          <div className="flex gap-3 mt-4">
            <button 
              onClick={() => {
                setShowRejectModal(false)
                setLocalReason('')
              }} 
              className="flex-1 px-4 py-2 border border-border-light rounded-lg text-text-secondary hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button 
              onClick={handleConfirmReject} 
              disabled={processingId === selectedRequest?.id}
              className="flex-1 px-4 py-2 bg-error text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
            >
              {processingId === selectedRequest?.id ? 'Processing...' : 'Confirm Reject'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const handleRefresh = () => {
    fetchAllRequests(false)
  }

  if (loading && pendingRequests.length === 0 && approvedRequests.length === 0 && rejectedRequests.length === 0) {
    return (
      <div className="p-6 bg-background min-h-screen">
        <div className="mb-6">
          <div className="h-8 bg-gray-200 rounded w-64 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-96 animate-pulse"></div>
        </div>
        <div className="flex gap-2 mb-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-10 bg-gray-200 rounded-lg w-24 animate-pulse"></div>
          ))}
        </div>
        <div className="bg-white rounded-xl border border-border-light shadow-sm overflow-hidden">
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

  if (error && pendingRequests.length === 0 && approvedRequests.length === 0 && rejectedRequests.length === 0) {
    return (
      <div className="p-6 bg-background min-h-screen">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text-primary">Verification Queue</h1>
          <p className="text-text-muted mt-1">Review and manage document verification requests</p>
        </div>
        <div className="bg-error/10 border border-error/20 rounded-2xl p-12 text-center">
          <AlertCircle className="w-16 h-16 text-error mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-error mb-2">Error Loading Data</h3>
          <p className="text-error mb-4">{error}</p>
          <button 
            onClick={handleRefresh} 
            className="px-4 py-2 bg-error text-white rounded-lg hover:bg-red-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-background min-h-screen">
      <DocumentModal />
      <PhotoModal />
      {selectedRequest && !showRejectModal && <RequestDetailModal request={selectedRequest} onClose={() => setSelectedRequest(null)} />}
      {showRejectModal && <RejectModal />}

      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Verification Queue</h1>
            <p className="text-text-muted mt-1">Review and manage document verification requests from users</p>
          </div>
          
          <div className="flex gap-3">
            <div className="bg-white rounded-lg px-3 py-2 text-center shadow-sm border border-border-light">
              <p className="text-xs text-text-muted">Pending</p>
              <p className="text-xl font-bold text-warning">{pendingRequests.length}</p>
            </div>
            <div className="bg-white rounded-lg px-3 py-2 text-center shadow-sm border border-border-light">
              <p className="text-xs text-text-muted">Approved</p>
              <p className="text-xl font-bold text-success">{approvedRequests.length}</p>
            </div>
            <div className="bg-white rounded-lg px-3 py-2 text-center shadow-sm border border-border-light">
              <p className="text-xs text-text-muted">Rejected</p>
              <p className="text-xl font-bold text-error">{rejectedRequests.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted w-5 h-5" />
        <input 
          type="text" 
          placeholder="Search by name, email, or phone..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
          className="w-full pl-10 pr-4 py-2 bg-white border border-border-light rounded-lg text-text-primary placeholder-text-muted focus:ring-2 focus:ring-primary-500 focus:border-primary-500" 
        />
      </div>

      <div className="flex gap-2 mb-6 border-b border-border-light">
        <button 
          onClick={() => setActiveTab('pending')} 
          className={`px-4 py-2 font-medium transition flex items-center gap-2 ${activeTab === 'pending' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-text-muted hover:text-text-primary'}`}
        >
          <Clock className="w-4 h-4" />
          Pending
          {pendingRequests.length > 0 && (
            <span className="px-1.5 py-0.5 bg-error text-white text-xs rounded-full animate-pulse ml-1">
              {pendingRequests.length}
            </span>
          )}
        </button>
        <button 
          onClick={() => setActiveTab('approved')} 
          className={`px-4 py-2 font-medium transition flex items-center gap-2 ${activeTab === 'approved' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-text-muted hover:text-text-primary'}`}
        >
          <CheckCircle className="w-4 h-4" />
          Approved ({approvedRequests.length})
        </button>
        <button 
          onClick={() => setActiveTab('rejected')} 
          className={`px-4 py-2 font-medium transition flex items-center gap-2 ${activeTab === 'rejected' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-text-muted hover:text-text-primary'}`}
        >
          <XCircle className="w-4 h-4" />
          Rejected ({rejectedRequests.length})
        </button>
        <button 
          onClick={() => setActiveTab('all')} 
          className={`px-4 py-2 font-medium transition flex items-center gap-2 ${activeTab === 'all' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-text-muted hover:text-text-primary'}`}
        >
          <List className="w-4 h-4" />
          All ({pendingRequests.length + approvedRequests.length + rejectedRequests.length})
        </button>
      </div>

      <div className="flex justify-end mb-4">
        <button 
          onClick={handleRefresh} 
          disabled={loading}
          className="px-3 py-2 text-sm border border-border-light rounded-lg hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50 text-text-secondary transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> 
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {filteredRequests.length === 0 ? (
        <div className="bg-white rounded-xl border border-border-light shadow-sm p-12 text-center">
          {activeTab === 'pending' ? (
            <>
              <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-text-primary mb-2">No Pending Requests</h3>
              <p className="text-text-muted">All document verification requests have been processed!</p>
            </>
          ) : activeTab === 'approved' ? (
            <>
              <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-text-primary mb-2">No Approved Requests</h3>
              <p className="text-text-muted">No document requests have been approved yet.</p>
            </>
          ) : activeTab === 'rejected' ? (
            <>
              <XCircle className="w-16 h-16 text-text-muted mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-text-primary mb-2">No Rejected Requests</h3>
              <p className="text-text-muted">No document requests have been rejected.</p>
            </>
          ) : (
            <>
              <List className="w-16 h-16 text-text-muted mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-text-primary mb-2">No Requests</h3>
              <p className="text-text-muted">No document verification requests found.</p>
            </>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-border-light shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-200">
            {filteredRequests.map((req) => {
              const photos = parsePropertyPhotos(req.property_photos)
              const photoCount = photos.length
              const isApproved = req.status?.toLowerCase() === 'documents_approved' || req.status?.toLowerCase() === 'approved'
              const isFullyActivated = req.status?.toLowerCase() === 'fully_activated'
              const isRejected = req.status?.toLowerCase() === 'rejected'
              
              return (
                <div key={req.id} className={`p-6 hover:bg-gray-50 transition ${isFullyActivated ? 'border-l-4 border-l-success' : isApproved ? 'border-l-4 border-l-primary-500' : isRejected ? 'border-l-4 border-l-error' : ''}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="font-semibold text-lg text-text-primary">{req.full_name}</h3>
                        {getStatusBadge(req.status)}
                        <span className="text-xs text-text-muted flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {req.created_at ? new Date(req.created_at).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-3">
                        <div><p className="text-text-muted">Email</p><p className="font-medium text-text-primary">{req.email}</p></div>
                        <div><p className="text-text-muted">Phone</p><p className="font-medium text-text-primary">{req.phone_number}</p></div>
                        <div><p className="text-text-muted">Property Type</p><p className="font-medium text-text-primary capitalize">{req.property_type}</p></div>
                      </div>
                      {req.property_address && (
                        <p className="text-sm text-text-secondary mb-2">{req.property_address}</p>
                      )}
                      
                      <div className="flex flex-wrap gap-2 mt-3">
                        {req.business_license && (
                          <button onClick={() => handleViewDocument(req.business_license, 'Business License')} className="text-xs bg-success/10 text-success px-2 py-1 rounded-full flex items-center gap-1 hover:bg-success/20 transition">
                            📋 Business License
                          </button>
                        )}
                        {req.ownership_document && (
                          <button onClick={() => handleViewDocument(req.ownership_document, 'Ownership Document')} className="text-xs bg-primary-50 text-primary-600 px-2 py-1 rounded-full flex items-center gap-1 hover:bg-primary-100 transition">
                            📄 Ownership Document
                          </button>
                        )}
                        {req.title_deed && (
                          <button onClick={() => handleViewDocument(req.title_deed, 'Title Deed')} className="text-xs bg-secondary-50 text-secondary-600 px-2 py-1 rounded-full flex items-center gap-1 hover:bg-secondary-100 transition">
                            🏠 Title Deed
                          </button>
                        )}
                        {req.tax_clearance && (
                          <button onClick={() => handleViewDocument(req.tax_clearance, 'Tax Clearance')} className="text-xs bg-warning/10 text-warning px-2 py-1 rounded-full flex items-center gap-1 hover:bg-warning/20 transition">
                            💰 Tax Clearance
                          </button>
                        )}
                        {req.government_id && (
                          <button onClick={() => handleViewDocument(req.government_id, 'Government ID')} className="text-xs bg-error/10 text-error px-2 py-1 rounded-full flex items-center gap-1 hover:bg-error/20 transition">
                            🆔 Government ID
                          </button>
                        )}
                        {photoCount > 0 && (
                          <button onClick={() => photos[0] && handleViewPhoto(photos[0], 0, photos)} className="text-xs bg-secondary-50 text-secondary-600 px-2 py-1 rounded-full flex items-center gap-1 hover:bg-secondary-100 transition">
                            <Camera className="w-3 h-3" /> {photoCount} Photo{photoCount !== 1 ? 's' : ''}
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <button 
                        onClick={() => setSelectedRequest(req)} 
                        className="px-4 py-2 border border-border-light rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-1 text-text-secondary transition"
                      >
                        <Eye className="w-4 h-4" /> View Details
                      </button>
                      {activeTab === 'pending' && (req.status?.toLowerCase() === 'documents_pending' || req.status?.toLowerCase() === 'pending') && (
                        <>
                          <button 
                            onClick={() => handleApprove(req.id)} 
                            disabled={processingId === req.id}
                            className="px-4 py-2 bg-success text-white rounded-lg text-sm font-medium hover:bg-green-700 flex items-center gap-1 transition disabled:opacity-50"
                          >
                            {processingId === req.id ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <CheckCircle className="w-4 h-4" />}
                            Approve
                          </button>
                          <button 
                            onClick={() => { setSelectedRequest(req); setShowRejectModal(true) }} 
                            disabled={processingId === req.id}
                            className="px-4 py-2 bg-error text-white rounded-lg text-sm font-medium hover:bg-red-700 flex items-center gap-1 transition disabled:opacity-50"
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