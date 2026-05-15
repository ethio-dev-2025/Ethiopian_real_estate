import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { 
  Shield, Store, Home, Upload, FileText, CheckCircle, 
  XCircle, AlertCircle, Eye, Trash2, Plus,
  Building2, UserCheck, Clock, Send
} from 'lucide-react'
import toast from 'react-hot-toast'

const API_URL = 'http://localhost:8000'

const ActivationRequests = () => {
  const { user } = useAuth()
  const [activeRole, setActiveRole] = useState('seller')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState({ seller: {}, landlord: {} })
  const [submitted, setSubmitted] = useState(false)
  
  // Form states
  const [sellerForm, setSellerForm] = useState({
    business_name: '',
    tax_id: '',
    business_address: '',
    business_license: null,
    ownership_document: null,
    government_id: null
  })
  
  const [landlordForm, setLandlordForm] = useState({
    property_address: '',
    property_title_deed: null,
    property_tax_clearance: null,
    government_id: null
  })
  
  const [sellerFiles, setSellerFiles] = useState({})
  const [landlordFiles, setLandlordFiles] = useState({})

  const getToken = () => localStorage.getItem('access_token')

  const fetchStatus = async () => {
    try {
      const token = getToken()
      const response = await fetch(`${API_URL}/api/dashboard/activation/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.success) {
        setStatus(data.status)
      }
    } catch (error) {
      console.error('Error fetching status:', error)
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [])

  const handleSellerChange = (e) => {
    const { name, value, files } = e.target
    if (files) {
      setSellerForm(prev => ({ ...prev, [name]: files[0] }))
      setSellerFiles(prev => ({ ...prev, [name]: files[0]?.name }))
    } else {
      setSellerForm(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleLandlordChange = (e) => {
    const { name, value, files } = e.target
    if (files) {
      setLandlordForm(prev => ({ ...prev, [name]: files[0] }))
      setLandlordFiles(prev => ({ ...prev, [name]: files[0]?.name }))
    } else {
      setLandlordForm(prev => ({ ...prev, [name]: value }))
    }
  }

  const removeSellerFile = (fieldName) => {
    setSellerForm(prev => ({ ...prev, [fieldName]: null }))
    setSellerFiles(prev => {
      const newFiles = { ...prev }
      delete newFiles[fieldName]
      return newFiles
    })
  }

  const removeLandlordFile = (fieldName) => {
    setLandlordForm(prev => ({ ...prev, [fieldName]: null }))
    setLandlordFiles(prev => {
      const newFiles = { ...prev }
      delete newFiles[fieldName]
      return newFiles
    })
  }

  const submitSellerActivation = async () => {
    setLoading(true)
    const formData = new FormData()
    formData.append('business_name', sellerForm.business_name)
    formData.append('business_address', sellerForm.business_address)
    formData.append('tax_id', sellerForm.tax_id)
    if (sellerForm.business_license) formData.append('business_license', sellerForm.business_license)
    if (sellerForm.ownership_document) formData.append('ownership_document', sellerForm.ownership_document)
    if (sellerForm.government_id) formData.append('government_id', sellerForm.government_id)

    try {
      const token = getToken()
      const response = await fetch(`${API_URL}/api/dashboard/activation/submit-seller`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      })
      const data = await response.json()
      if (data.success) {
        toast.success(data.message)
        setSubmitted(true)
        fetchStatus()
        setTimeout(() => setSubmitted(false), 3000)
      } else {
        toast.error(data.message || 'Failed to submit')
      }
    } catch (error) {
      toast.error('Failed to submit seller activation')
    } finally {
      setLoading(false)
    }
  }

  const submitLandlordActivation = async () => {
    setLoading(true)
    const formData = new FormData()
    formData.append('property_address', landlordForm.property_address)
    if (landlordForm.property_title_deed) formData.append('property_title_deed', landlordForm.property_title_deed)
    if (landlordForm.property_tax_clearance) formData.append('property_tax_clearance', landlordForm.property_tax_clearance)
    if (landlordForm.government_id) formData.append('government_id', landlordForm.government_id)

    try {
      const token = getToken()
      const response = await fetch(`${API_URL}/api/dashboard/activation/submit-landlord`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      })
      const data = await response.json()
      if (data.success) {
        toast.success(data.message)
        setSubmitted(true)
        fetchStatus()
        setTimeout(() => setSubmitted(false), 3000)
      } else {
        toast.error(data.message || 'Failed to submit')
      }
    } catch (error) {
      toast.error('Failed to submit landlord activation')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = () => {
    if (activeRole === 'seller') {
      if (!sellerForm.business_name || !sellerForm.tax_id || !sellerForm.business_address) {
        toast.error('Please fill all required fields')
        return
      }
      if (!sellerForm.business_license || !sellerForm.ownership_document || !sellerForm.government_id) {
        toast.error('Please upload all required documents')
        return
      }
      submitSellerActivation()
    } else {
      if (!landlordForm.property_address) {
        toast.error('Please fill all required fields')
        return
      }
      if (!landlordForm.property_title_deed || !landlordForm.property_tax_clearance || !landlordForm.government_id) {
        toast.error('Please upload all required documents')
        return
      }
      submitLandlordActivation()
    }
  }

  const isAlreadySubmitted = (role) => {
    if (role === 'seller') return status.seller?.submitted
    return status.landlord?.submitted
  }

  const isApproved = (role) => {
    if (role === 'seller') return status.seller?.approved
    return status.landlord?.approved
  }

  if (submitted) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border p-8 text-center max-w-md mx-auto">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Submitted!</h2>
        <p className="text-gray-600">Your activation request has been submitted. Please wait for admin approval.</p>
        <p className="text-sm text-gray-500 mt-2">You will be notified once approved.</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <h1 className="text-2xl font-bold">Account Activation</h1>
          <p className="text-blue-100 mt-1">Activate your seller or landlord account</p>
        </div>

        {/* Role Selection */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveRole('seller')}
            className={`flex-1 px-6 py-4 text-center font-semibold transition ${
              activeRole === 'seller'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Store className="w-5 h-5 inline mr-2" /> Seller
          </button>
          <button
            onClick={() => setActiveRole('landlord')}
            className={`flex-1 px-6 py-4 text-center font-semibold transition ${
              activeRole === 'landlord'
                ? 'text-green-600 border-b-2 border-green-600 bg-green-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Home className="w-5 h-5 inline mr-2" /> Landlord
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status Banner */}
          {isApproved(activeRole) && (
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-800 font-medium">Your {activeRole} account is already activated!</span>
              </div>
            </div>
          )}

          {isAlreadySubmitted(activeRole) && !isApproved(activeRole) && (
            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-600" />
                <span className="text-yellow-800 font-medium">Your {activeRole} activation request is pending review</span>
              </div>
            </div>
          )}

          {/* Seller Form */}
          {activeRole === 'seller' && !isApproved('seller') && !isAlreadySubmitted('seller') && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Business Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="business_name"
                    value={sellerForm.business_name}
                    onChange={handleSellerChange}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tax ID / TIN <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="tax_id"
                    value={sellerForm.tax_id}
                    onChange={handleSellerChange}
                    className="w-full p-3 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Business License <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    name="business_license"
                    onChange={handleSellerChange}
                    className="w-full p-3 border rounded-lg"
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                  {sellerFiles.business_license && (
                    <p className="text-xs text-green-600 mt-1">✓ {sellerFiles.business_license}</p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Business Address <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="business_address"
                    value={sellerForm.business_address}
                    onChange={handleSellerChange}
                    rows="2"
                    className="w-full p-3 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ownership Document <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    name="ownership_document"
                    onChange={handleSellerChange}
                    className="w-full p-3 border rounded-lg"
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                  {sellerFiles.ownership_document && (
                    <p className="text-xs text-green-600 mt-1">✓ {sellerFiles.ownership_document}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Government ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    name="government_id"
                    onChange={handleSellerChange}
                    className="w-full p-3 border rounded-lg"
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                  {sellerFiles.government_id && (
                    <p className="text-xs text-green-600 mt-1">✓ {sellerFiles.government_id}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Landlord Form */}
          {activeRole === 'landlord' && !isApproved('landlord') && !isAlreadySubmitted('landlord') && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Property Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="property_address"
                    value={landlordForm.property_address}
                    onChange={handleLandlordChange}
                    className="w-full p-3 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title Deed <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    name="property_title_deed"
                    onChange={handleLandlordChange}
                    className="w-full p-3 border rounded-lg"
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                  {landlordFiles.property_title_deed && (
                    <p className="text-xs text-green-600 mt-1">✓ {landlordFiles.property_title_deed}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tax Clearance <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    name="property_tax_clearance"
                    onChange={handleLandlordChange}
                    className="w-full p-3 border rounded-lg"
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                  {landlordFiles.property_tax_clearance && (
                    <p className="text-xs text-green-600 mt-1">✓ {landlordFiles.property_tax_clearance}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Government ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    name="government_id"
                    onChange={handleLandlordChange}
                    className="w-full p-3 border rounded-lg"
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                  {landlordFiles.government_id && (
                    <p className="text-xs text-green-600 mt-1">✓ {landlordFiles.government_id}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          {!isApproved(activeRole) && !isAlreadySubmitted(activeRole) && (
            <>
              <div className="bg-yellow-50 rounded-lg p-4">
                <p className="text-sm text-yellow-800 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>All documents are required. After submission, our admin team will review your documents. You will be notified once your account is activated.</span>
                </p>
              </div>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Submit {activeRole === 'seller' ? 'Seller' : 'Landlord'} Activation
                  </>
                )}
              </button>
            </>
          )}

          {/* Already submitted message */}
          {isAlreadySubmitted(activeRole) && !isApproved(activeRole) && (
            <div className="text-center py-8">
              <Clock className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <p className="text-gray-600">Your activation request is being reviewed by our team.</p>
              <p className="text-sm text-gray-500 mt-2">You will receive a notification once approved.</p>
            </div>
          )}

          {/* Already approved message */}
          {isApproved(activeRole) && (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <p className="text-gray-600">Your {activeRole} account is fully activated!</p>
              <p className="text-sm text-gray-500 mt-2">You can now create listings and manage your properties.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ActivationRequests