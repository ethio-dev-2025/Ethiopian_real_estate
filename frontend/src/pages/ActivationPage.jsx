import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AppSidebar from '../components/layout/AppSidebar'
import { 
  Shield, Store, Home, Building2, Upload, FileText, 
  CheckCircle, X, Loader, ArrowRight, User, Mail, Phone, MapPin,
  Briefcase, Camera, Calendar, Clock, AlertCircle, Users
} from 'lucide-react'
import toast from 'react-hot-toast'

const API_URL = 'http://localhost:8000'

const ActivationPage = ({ defaultRole, onActivationSuccess }) => {
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [loading, setLoading] = useState(false)
  const [uploadingDocs, setUploadingDocs] = useState(false)
  const [activeTab, setActiveTab] = useState(defaultRole || 'seller')
  const [submitted, setSubmitted] = useState(false)
  const [existingRequest, setExistingRequest] = useState(null)
  const [showResubmitConfirm, setShowResubmitConfirm] = useState(false)

  // Seller Form State
  const [sellerForm, setSellerForm] = useState({
    business_name: '',
    tax_id: '',
    business_address: '',
    business_license: null,
    ownership_document: null,
    government_id: null,
    experience_years: '',
    reason_for_activation: ''
  })

  // Landlord Form State
  const [landlordForm, setLandlordForm] = useState({
    property_address: '',
    property_type: 'house',
    property_title_deed: null,
    property_tax_clearance: null,
    government_id: null,
    property_photos: [],
    previous_listings_count: '',
    reason_for_activation: ''
  })

  const [sellerFiles, setSellerFiles] = useState({})
  const [landlordFiles, setLandlordFiles] = useState({})
  const [landlordPhotos, setLandlordPhotos] = useState([])

  const propertyTypes = [
    { value: 'house', label: 'House' },
    { value: 'apartment', label: 'Apartment' },
    { value: 'villa', label: 'Villa' },
    { value: 'condo', label: 'Condo' },
    { value: 'commercial', label: 'Commercial' },
    { value: 'land', label: 'Land' }
  ]

  // Check existing activation request
  useEffect(() => {
    checkActivationStatus()
  }, [])

  const checkActivationStatus = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_URL}/api/activation/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      
      if (data.is_activated) {
        toast.success('Your account is already activated!')
        navigate('/dashboard')
        return
      }
      
      if (data.status === 'pending') {
        setExistingRequest(data)
        setSubmitted(true)
      } else if (data.status === 'rejected') {
        setExistingRequest(data)
        toast.error('Your previous activation request was rejected. Please submit a new one.')
      }
    } catch (error) {
      console.error('Error checking status:', error)
    }
  }

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

  const uploadFile = async (file, docType) => {
    const token = localStorage.getItem('access_token')
    const formData = new FormData()
    formData.append('file', file)
    
    console.log(`📤 Uploading ${docType}:`, file.name)
    
    const response = await fetch(`${API_URL}/api/activation/upload-document`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    })
    
    const data = await response.json()
    if (data.success) {
      console.log(`✅ ${docType} uploaded:`, data.url)
      return data.url
    }
    throw new Error(`Upload failed for ${docType}`)
  }

  const handleLandlordPhotoUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (landlordPhotos.length + files.length > 10) {
      toast.error('Maximum 10 photos allowed')
      return
    }
    
    setUploadingDocs(true)
    const newPhotos = []
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image`)
        continue
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Max 10MB`)
        continue
      }
      
      const previewUrl = URL.createObjectURL(file)
      newPhotos.push({ file, preview: previewUrl })
    }
    setLandlordPhotos(prev => [...prev, ...newPhotos])
    setUploadingDocs(false)
    e.target.value = ''
  }

  const removeLandlordPhoto = (index) => {
    setLandlordPhotos(prev => prev.filter((_, i) => i !== index))
  }

  const submitSellerActivation = async () => {
    const token = localStorage.getItem('access_token')
    
    toast.loading('Uploading documents...', { id: 'upload' })
    
    // Upload ALL THREE documents
    let businessLicenseUrl = null
    let ownershipDocUrl = null
    let governmentIdUrl = null
    
    if (sellerForm.business_license) {
      businessLicenseUrl = await uploadFile(sellerForm.business_license, 'Business License')
    }
    if (sellerForm.ownership_document) {
      ownershipDocUrl = await uploadFile(sellerForm.ownership_document, 'Ownership Document')
    }
    if (sellerForm.government_id) {
      governmentIdUrl = await uploadFile(sellerForm.government_id, 'Government ID')
    }
    
    toast.dismiss('upload')
    
    // Create request data with ALL THREE documents
    const requestData = {
      full_name: user?.full_name || '',
      email: user?.email || '',
      phone_number: user?.phone || '',
      property_address: sellerForm.business_address,
      property_type: 'commercial',
      business_name: sellerForm.business_name,
      business_license: businessLicenseUrl,
      ownership_document: ownershipDocUrl,    // ✅ CRITICAL: This must be here
      government_id: governmentIdUrl,         // ✅ CRITICAL: This must be here
      tax_id: sellerForm.tax_id,
      experience_years: parseInt(sellerForm.experience_years) || 0,
      reason_for_activation: sellerForm.reason_for_activation
    }
    
    // DEBUG: Log what we're sending
    console.log('📦 SENDING SELLER REQUEST DATA:');
    console.log('- Business License:', requestData.business_license);
    console.log('- Ownership Document:', requestData.ownership_document);
    console.log('- Government ID:', requestData.government_id);
    console.log('Full request:', requestData);
    
    const response = await fetch(`${API_URL}/api/activation/submit-request`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    })
    
    const result = await response.json()
    console.log('📥 SERVER RESPONSE:', result)
    
    return result
  }

  const submitLandlordActivation = async () => {
    const token = localStorage.getItem('access_token')
    
    toast.loading('Uploading documents...', { id: 'upload' })
    
    // Upload files
    let titleDeedUrl = null
    let taxClearanceUrl = null
    let governmentIdUrl = null
    let photoUrls = []
    
    if (landlordForm.property_title_deed) {
      titleDeedUrl = await uploadFile(landlordForm.property_title_deed, 'Title Deed')
    }
    if (landlordForm.property_tax_clearance) {
      taxClearanceUrl = await uploadFile(landlordForm.property_tax_clearance, 'Tax Clearance')
    }
    if (landlordForm.government_id) {
      governmentIdUrl = await uploadFile(landlordForm.government_id, 'Government ID')
    }
    
    // Upload photos
    for (const photo of landlordPhotos) {
      if (photo.file) {
        const url = await uploadFile(photo.file, 'Property Photo')
        photoUrls.push(url)
      }
    }
    
    toast.dismiss('upload')
    
    const requestData = {
      full_name: user?.full_name || '',
      email: user?.email || '',
      phone_number: user?.phone || '',
      property_address: landlordForm.property_address,
      property_type: landlordForm.property_type,
      business_name: '',
      tax_id: '',
      experience_years: 0,
      previous_listings_count: parseInt(landlordForm.previous_listings_count) || 0,
      reason_for_activation: landlordForm.reason_for_activation,
      title_deed: titleDeedUrl,
      tax_clearance: taxClearanceUrl,
      government_id: governmentIdUrl,
      property_photos: JSON.stringify(photoUrls)
    }
    
    // DEBUG: Log what we're sending
    console.log('📦 SENDING LANDLORD REQUEST DATA:');
    console.log('- Title Deed:', requestData.title_deed);
    console.log('- Tax Clearance:', requestData.tax_clearance);
    console.log('- Government ID:', requestData.government_id);
    console.log('- Property Photos:', requestData.property_photos);
    console.log('Full request:', requestData);
    
    const response = await fetch(`${API_URL}/api/activation/submit-request`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    })
    
    const result = await response.json()
    console.log('📥 SERVER RESPONSE:', result)
    
    return result
  }

  const handleSubmit = async () => {
    if (activeTab === 'seller' || activeTab === 'both') {
      if (!sellerForm.business_name || !sellerForm.tax_id || !sellerForm.business_address) {
        toast.error('Please fill all required seller fields')
        return
      }
    }
    if (activeTab === 'landlord' || activeTab === 'both') {
      if (!landlordForm.property_address) {
        toast.error('Please fill all required landlord fields')
        return
      }
    }

    setLoading(true)
    try {
      if (activeTab === 'seller') {
        await submitSellerActivation()
        toast.success('Seller activation request submitted! Awaiting admin approval.')
      } else if (activeTab === 'landlord') {
        await submitLandlordActivation()
        toast.success('Landlord activation request submitted! Awaiting admin approval.')
      } else if (activeTab === 'both') {
        await submitSellerActivation()
        await submitLandlordActivation()
        toast.success('Both activation requests submitted! Awaiting admin approval.')
      }
      setSubmitted(true)
      if (onActivationSuccess) {
        setTimeout(() => onActivationSuccess(), 2000)
      } else {
        setTimeout(() => navigate('/dashboard'), 2000)
      }
    } catch (error) {
      console.error('Submit error:', error)
      toast.error(error.message || 'Failed to submit activation request')
    } finally {
      setLoading(false)
    }
  }

  const handleResubmit = () => {
    setShowResubmitConfirm(false)
    setExistingRequest(null)
    setSubmitted(false)
  }

  // Rest of your JSX remains the same...
  if (submitted && existingRequest?.status === 'pending') {
    return (
      <div className="min-h-screen bg-gray-100">
        <AppSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
          <div className="flex items-center justify-center h-screen">
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md">
              <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-10 h-10 text-yellow-600 animate-pulse" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Pending!</h2>
              <p className="text-gray-600">
                Your activation request is currently being reviewed by an administrator.
                You will be notified once it's approved.
              </p>
              <p className="text-sm text-gray-500 mt-4">
                Submitted on: {existingRequest?.created_at ? new Date(existingRequest.created_at).toLocaleDateString() : 'Recently'}
              </p>
              <button onClick={() => navigate('/dashboard')} className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Go to Dashboard
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (submitted && !existingRequest) {
    return (
      <div className="min-h-screen bg-gray-100">
        <AppSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
          <div className="flex items-center justify-center h-screen">
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Submitted!</h2>
              <p className="text-gray-600">Your activation request has been submitted. Please wait for admin approval.</p>
              <button onClick={() => navigate('/dashboard')} className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Go to Dashboard
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (existingRequest?.status === 'rejected') {
    return (
      <div className="min-h-screen bg-gray-100">
        <AppSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
          <div className="flex items-center justify-center min-h-screen p-6">
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="w-10 h-10 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Rejected</h2>
              <p className="text-gray-600 mb-4">Your activation request was rejected for the following reason:</p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-700">{existingRequest?.rejection_reason || 'No specific reason provided'}</p>
              </div>
              <button onClick={() => setShowResubmitConfirm(true)} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Submit New Request
              </button>
            </div>
          </div>
        </main>
        
        {showResubmitConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold mb-4">Submit New Request?</h3>
              <p className="text-gray-600 mb-6">Are you sure you want to submit a new activation request? Your previous request will be replaced.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowResubmitConfirm(false)} className="flex-1 px-4 py-2 border rounded-lg">Cancel</button>
                <button onClick={handleResubmit} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg">Yes, Submit New</button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  const isRequiredSeller = (activeTab === 'seller' || activeTab === 'both')
  const isRequiredLandlord = (activeTab === 'landlord' || activeTab === 'both')

  return (
    <div className="min-h-screen bg-gray-100">
      <AppSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      <main className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <div className="p-6">
          <div className="max-w-5xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg border overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
                <h1 className="text-2xl font-bold">Account Activation</h1>
                <p className="text-blue-100 mt-1">Choose which role you want to activate</p>
              </div>

              <div className="flex border-b">
                <button onClick={() => setActiveTab('seller')} className={`flex-1 px-6 py-4 text-center font-semibold transition ${activeTab === 'seller' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-700'}`}>
                  <Store className="w-5 h-5 inline mr-2" /> Seller Only
                </button>
                <button onClick={() => setActiveTab('landlord')} className={`flex-1 px-6 py-4 text-center font-semibold transition ${activeTab === 'landlord' ? 'text-green-600 border-b-2 border-green-600 bg-green-50' : 'text-gray-500 hover:text-gray-700'}`}>
                  <Home className="w-5 h-5 inline mr-2" /> Landlord Only
                </button>
                <button onClick={() => setActiveTab('both')} className={`flex-1 px-6 py-4 text-center font-semibold transition ${activeTab === 'both' ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50' : 'text-gray-500 hover:text-gray-700'}`}>
                  <Building2 className="w-5 h-5 inline mr-2" /> Both
                </button>
              </div>

              <div className="p-6 space-y-6">
                {(activeTab === 'seller' || activeTab === 'both') && (
                  <div className="border rounded-xl p-5">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><Store className="w-5 h-5 text-blue-600" /> Seller Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Business Name <span className="text-red-500">*</span></label>
                        <input type="text" name="business_name" value={sellerForm.business_name} onChange={handleSellerChange} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500" required={isRequiredSeller} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tax ID / TIN <span className="text-red-500">*</span></label>
                        <input type="text" name="tax_id" value={sellerForm.tax_id} onChange={handleSellerChange} className="w-full p-3 border rounded-lg" required={isRequiredSeller} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
                        <input type="number" name="experience_years" value={sellerForm.experience_years} onChange={handleSellerChange} className="w-full p-3 border rounded-lg" placeholder="Years in real estate" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Business License</label>
                        <input type="file" name="business_license" onChange={handleSellerChange} className="w-full p-3 border rounded-lg" accept="image/*,application/pdf" />
                        {sellerFiles.business_license && <p className="text-xs text-green-600 mt-1">✓ {sellerFiles.business_license}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ownership Document</label>
                        <input type="file" name="ownership_document" onChange={handleSellerChange} className="w-full p-3 border rounded-lg" accept="image/*,application/pdf" />
                        {sellerFiles.ownership_document && <p className="text-xs text-green-600 mt-1">✓ {sellerFiles.ownership_document}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Government ID</label>
                        <input type="file" name="government_id" onChange={handleSellerChange} className="w-full p-3 border rounded-lg" accept="image/*,application/pdf" />
                        {sellerFiles.government_id && <p className="text-xs text-green-600 mt-1">✓ {sellerFiles.government_id}</p>}
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Business Address <span className="text-red-500">*</span></label>
                        <textarea name="business_address" value={sellerForm.business_address} onChange={handleSellerChange} rows="2" className="w-full p-3 border rounded-lg" required={isRequiredSeller} />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Activation</label>
                        <textarea name="reason_for_activation" value={sellerForm.reason_for_activation} onChange={handleSellerChange} rows="3" className="w-full p-3 border rounded-lg" placeholder="Why do you want to list properties on our platform?" />
                      </div>
                    </div>
                  </div>
                )}

                {(activeTab === 'landlord' || activeTab === 'both') && (
                  <div className="border rounded-xl p-5">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><Home className="w-5 h-5 text-green-600" /> Landlord Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Property Address <span className="text-red-500">*</span></label>
                        <input type="text" name="property_address" value={landlordForm.property_address} onChange={handleLandlordChange} className="w-full p-3 border rounded-lg" required={isRequiredLandlord} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Property Type</label>
                        <select name="property_type" value={landlordForm.property_type} onChange={handleLandlordChange} className="w-full p-3 border rounded-lg">
                          {propertyTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Previous Listings Count</label>
                        <input type="number" name="previous_listings_count" value={landlordForm.previous_listings_count} onChange={handleLandlordChange} className="w-full p-3 border rounded-lg" placeholder="Number of previous listings" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title Deed</label>
                        <input type="file" name="property_title_deed" onChange={handleLandlordChange} className="w-full p-3 border rounded-lg" accept="image/*,application/pdf" />
                        {landlordFiles.property_title_deed && <p className="text-xs text-green-600 mt-1">✓ {landlordFiles.property_title_deed}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tax Clearance</label>
                        <input type="file" name="property_tax_clearance" onChange={handleLandlordChange} className="w-full p-3 border rounded-lg" accept="image/*,application/pdf" />
                        {landlordFiles.property_tax_clearance && <p className="text-xs text-green-600 mt-1">✓ {landlordFiles.property_tax_clearance}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Government ID</label>
                        <input type="file" name="government_id" onChange={handleLandlordChange} className="w-full p-3 border rounded-lg" accept="image/*,application/pdf" />
                        {landlordFiles.government_id && <p className="text-xs text-green-600 mt-1">✓ {landlordFiles.government_id}</p>}
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Property Photos (Max 10)</label>
                        <div onClick={() => document.getElementById('photoUpload')?.click()} className="border-2 border-dashed rounded-xl p-4 text-center cursor-pointer hover:border-blue-500">
                          <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-600 text-sm">Click to upload property photos</p>
                          <input id="photoUpload" type="file" multiple accept="image/*" onChange={handleLandlordPhotoUpload} className="hidden" />
                        </div>
                        {uploadingDocs && <div className="mt-2 text-center"><Loader className="w-5 h-5 animate-spin mx-auto text-blue-600" /></div>}
                        {landlordPhotos.length > 0 && (
                          <div className="grid grid-cols-4 gap-3 mt-4">
                            {landlordPhotos.map((photo, idx) => (
                              <div key={idx} className="relative group">
                                <img src={photo.preview} className="w-full h-20 object-cover rounded-lg" />
                                <button onClick={() => removeLandlordPhoto(idx)} className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100"><X className="w-3 h-3" /></button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Activation</label>
                        <textarea name="reason_for_activation" value={landlordForm.reason_for_activation} onChange={handleLandlordChange} rows="3" className="w-full p-3 border rounded-lg" placeholder="Why do you want to list properties on our platform?" />
                      </div>
                    </div>
                  </div>
                )}

                <button onClick={handleSubmit} disabled={loading} className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading ? <Loader className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />}
                  {loading ? 'Submitting...' : `Submit ${activeTab === 'both' ? 'Both' : activeTab === 'seller' ? 'Seller' : 'Landlord'} Activation`}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default ActivationPage