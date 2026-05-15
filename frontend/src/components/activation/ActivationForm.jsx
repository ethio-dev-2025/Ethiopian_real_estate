import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  User, Mail, Phone, MapPin, Building2, Upload, X, CheckCircle,
  ChevronRight, ChevronLeft, FileText, Briefcase, Calendar,
  Loader, AlertCircle, Home, Camera, Star, Trash2
} from 'lucide-react'
import toast from 'react-hot-toast'

const API_URL = 'http://localhost:8000'

const ActivationForm = ({ onSuccess }) => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [uploadingDocs, setUploadingDocs] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState({
    ownership_document: null,
    title_deed: null,
    tax_clearance: null,
    government_id: null,
    business_license: null,
    property_photos: []
  })
  const [photoPreviews, setPhotoPreviews] = useState([])
  
  const fileInputRefs = {
    ownership: useRef(null),
    title_deed: useRef(null),
    tax_clearance: useRef(null),
    government_id: useRef(null),
    business_license: useRef(null),
    photos: useRef(null)
  }
  
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    phone_number: user?.phone || '',
    property_address: '',
    property_type: 'house',
    business_name: '',
    tax_id: '',
    experience_years: '',
    previous_listings_count: '',
    reason_for_activation: ''
  })

  const propertyTypes = [
    { value: 'house', label: 'House' },
    { value: 'apartment', label: 'Apartment' },
    { value: 'villa', label: 'Villa' },
    { value: 'condo', label: 'Condo' },
    { value: 'commercial', label: 'Commercial' },
    { value: 'land', label: 'Land' }
  ]

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const uploadFile = async (file, type) => {
    const formDataFile = new FormData()
    formDataFile.append('file', file)
    
    const token = localStorage.getItem('access_token')
    const response = await fetch(`${API_URL}/api/activation/upload-document`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formDataFile
    })
    
    const data = await response.json()
    if (data.success) {
      return data.url
    }
    throw new Error('Upload failed')
  }

  const handleDocumentUpload = async (e, docType) => {
    const file = e.target.files[0]
    if (!file) return
    
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      toast.error('Please upload an image or PDF file')
      return
    }
    
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large. Max 10MB')
      return
    }
    
    setUploadingDocs(true)
    try {
      const url = await uploadFile(file, docType)
      setUploadedFiles(prev => ({ ...prev, [docType]: url }))
      toast.success(`${docType.replace('_', ' ')} uploaded successfully`)
    } catch (error) {
      toast.error('Failed to upload document')
    } finally {
      setUploadingDocs(false)
    }
  }

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (photoPreviews.length + files.length > 10) {
      toast.error('Maximum 10 photos allowed')
      return
    }
    
    setUploadingDocs(true)
    
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
      setPhotoPreviews(prev => [...prev, { file, preview: previewUrl }])
    }
    
    setUploadingDocs(false)
    e.target.value = ''
    toast.success(`${files.length} photo(s) added`)
  }

  const removePhoto = (index) => {
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index))
  }

  const uploadAllPhotos = async () => {
    const photoUrls = []
    for (const photo of photoPreviews) {
      const url = await uploadFile(photo.file, 'photo')
      photoUrls.push(url)
    }
    return photoUrls
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      // Upload all photos first
      const photoUrls = await uploadAllPhotos()
      
      const requestData = {
        full_name: formData.full_name,
        email: formData.email,
        phone_number: formData.phone_number,
        property_address: formData.property_address,
        property_type: formData.property_type,
        business_name: formData.business_name,
        tax_id: formData.tax_id,
        experience_years: parseInt(formData.experience_years) || 0,
        previous_listings_count: parseInt(formData.previous_listings_count) || 0,
        reason_for_activation: formData.reason_for_activation,
        ownership_document: uploadedFiles.ownership_document,
        title_deed: uploadedFiles.title_deed,
        tax_clearance: uploadedFiles.tax_clearance,
        government_id: uploadedFiles.government_id,
        business_license: uploadedFiles.business_license,
        property_photos: JSON.stringify(photoUrls)
      }
      
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_URL}/api/activation/submit-request`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        toast.success('Activation request submitted successfully!')
        if (onSuccess) onSuccess()
        navigate('/dashboard')
      } else {
        toast.error(data.detail || 'Failed to submit request')
      }
    } catch (error) {
      console.error('Submit error:', error)
      toast.error('Failed to submit activation request')
    } finally {
      setLoading(false)
    }
  }

  const nextStep = () => {
    if (step === 1 && !formData.full_name) {
      toast.error('Please enter your full name')
      return
    }
    if (step === 1 && !formData.phone_number) {
      toast.error('Please enter your phone number')
      return
    }
    if (step === 2 && !formData.property_address) {
      toast.error('Please enter your property address')
      return
    }
    setStep(step + 1)
    window.scrollTo(0, 0)
  }

  const prevStep = () => {
    setStep(step - 1)
    window.scrollTo(0, 0)
  }

  const progress = ((step - 1) / 3) * 100

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900">Activate Your Account</h1>
        <p className="text-gray-500 mt-2">Please provide the following information to activate your account</p>
      </div>

      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm font-semibold text-blue-600">{Math.round(progress)}% Complete</p>
          <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
        
        <div className="flex gap-2">
          {['Personal Info', 'Property Info', 'Business Info'].map((label, idx) => (
            <div key={idx} className="flex-1">
              <div className={`h-1 rounded-full ${step > idx ? 'bg-blue-600' : 'bg-gray-200'}`} />
              <div className="flex items-center gap-2 mt-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                  step > idx ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {idx + 1}
                </div>
                <p className={`text-xs font-medium ${step > idx ? 'text-blue-600' : 'text-gray-400'}`}>{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Personal Information */}
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-white rounded-2xl shadow-lg border p-8">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><User className="w-5 h-5 text-blue-600" />Personal Information</h2>
            <div className="space-y-6">
              <div><label className="block text-sm font-medium mb-2">Full Name *</label><input name="full_name" value={formData.full_name} onChange={handleChange} className="w-full p-4 border rounded-xl" placeholder="Enter your full name" /></div>
              <div className="grid grid-cols-2 gap-6">
                <div><label className="block text-sm font-medium mb-2">Email Address</label><input value={formData.email} className="w-full p-4 border rounded-xl bg-gray-50" disabled /></div>
                <div><label className="block text-sm font-medium mb-2">Phone Number *</label><input name="phone_number" value={formData.phone_number} onChange={handleChange} className="w-full p-4 border rounded-xl" placeholder="+251 911 111 111" /></div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 2: Property Information */}
        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-white rounded-2xl shadow-lg border p-8">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Home className="w-5 h-5 text-blue-600" />Property Information</h2>
            <div className="space-y-6">
              <div><label className="block text-sm font-medium mb-2">Property Address *</label><input name="property_address" value={formData.property_address} onChange={handleChange} className="w-full p-4 border rounded-xl" placeholder="Enter property address" /></div>
              <div className="grid grid-cols-2 gap-6">
                <div><label className="block text-sm font-medium mb-2">Property Type</label><select name="property_type" value={formData.property_type} onChange={handleChange} className="w-full p-4 border rounded-xl">{propertyTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
                <div><label className="block text-sm font-medium mb-2">Previous Listings</label><input name="previous_listings_count" type="number" value={formData.previous_listings_count} onChange={handleChange} className="w-full p-4 border rounded-xl" placeholder="Number of previous listings" /></div>
              </div>
              <div><label className="block text-sm font-medium mb-2">Ownership Document</label><div onClick={() => fileInputRefs.ownership.current?.click()} className="border-2 border-dashed rounded-xl p-4 text-center cursor-pointer hover:border-blue-500"><Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" /><p className="text-sm">Upload ownership document</p><input ref={fileInputRefs.ownership} type="file" accept="image/*,application/pdf" onChange={(e) => handleDocumentUpload(e, 'ownership_document')} className="hidden" /></div>{uploadedFiles.ownership_document && <div className="mt-2 text-green-600 text-sm flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Document uploaded</div>}</div>
              <div><label className="block text-sm font-medium mb-2">Title Deed</label><div onClick={() => fileInputRefs.title_deed.current?.click()} className="border-2 border-dashed rounded-xl p-4 text-center cursor-pointer hover:border-blue-500"><Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" /><p className="text-sm">Upload title deed</p><input ref={fileInputRefs.title_deed} type="file" accept="image/*,application/pdf" onChange={(e) => handleDocumentUpload(e, 'title_deed')} className="hidden" /></div>{uploadedFiles.title_deed && <div className="mt-2 text-green-600 text-sm flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Title deed uploaded</div>}</div>
              <div><label className="block text-sm font-medium mb-2">Tax Clearance</label><div onClick={() => fileInputRefs.tax_clearance.current?.click()} className="border-2 border-dashed rounded-xl p-4 text-center cursor-pointer hover:border-blue-500"><Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" /><p className="text-sm">Upload tax clearance</p><input ref={fileInputRefs.tax_clearance} type="file" accept="image/*,application/pdf" onChange={(e) => handleDocumentUpload(e, 'tax_clearance')} className="hidden" /></div>{uploadedFiles.tax_clearance && <div className="mt-2 text-green-600 text-sm flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Tax clearance uploaded</div>}</div>
              <div><label className="block text-sm font-medium mb-2">Property Photos</label><div onClick={() => fileInputRefs.photos.current?.click()} className="border-2 border-dashed rounded-xl p-4 text-center cursor-pointer hover:border-blue-500"><Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" /><p className="text-sm">Upload property photos</p><input ref={fileInputRefs.photos} type="file" multiple accept="image/*" onChange={handlePhotoUpload} className="hidden" /></div>
              {photoPreviews.length > 0 && (<div className="grid grid-cols-4 gap-2 mt-3">{photoPreviews.map((photo, idx) => (<div key={idx} className="relative"><img src={photo.preview} className="w-full h-20 object-cover rounded-lg" /><button onClick={() => removePhoto(idx)} className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full"><X className="w-3 h-3" /></button></div>))}</div>)}</div>
            </div>
          </motion.div>
        )}

        {/* Step 3: Business Information */}
        {step === 3 && (
          <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-white rounded-2xl shadow-lg border p-8">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Briefcase className="w-5 h-5 text-blue-600" />Business Information</h2>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6"><div><label className="block text-sm font-medium mb-2">Business Name</label><input name="business_name" value={formData.business_name} onChange={handleChange} className="w-full p-4 border rounded-xl" placeholder="Your business name" /></div>
              <div><label className="block text-sm font-medium mb-2">Tax ID / TIN</label><input name="tax_id" value={formData.tax_id} onChange={handleChange} className="w-full p-4 border rounded-xl" placeholder="Tax identification number" /></div></div>
              <div className="grid grid-cols-2 gap-6"><div><label className="block text-sm font-medium mb-2">Years of Experience</label><input name="experience_years" type="number" value={formData.experience_years} onChange={handleChange} className="w-full p-4 border rounded-xl" placeholder="Years in real estate" /></div>
              <div><label className="block text-sm font-medium mb-2">Business License</label><div onClick={() => fileInputRefs.business_license.current?.click()} className="border-2 border-dashed rounded-xl p-4 text-center cursor-pointer hover:border-blue-500"><Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" /><p className="text-sm">Upload license</p><input ref={fileInputRefs.business_license} type="file" accept="image/*,application/pdf" onChange={(e) => handleDocumentUpload(e, 'business_license')} className="hidden" /></div>{uploadedFiles.business_license && <div className="mt-2 text-green-600 text-sm flex items-center gap-1"><CheckCircle className="w-4 h-4" /> License uploaded</div>}</div></div>
              <div><label className="block text-sm font-medium mb-2">Government ID</label><div onClick={() => fileInputRefs.government_id.current?.click()} className="border-2 border-dashed rounded-xl p-4 text-center cursor-pointer hover:border-blue-500"><Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" /><p className="text-sm">Upload government ID</p><input ref={fileInputRefs.government_id} type="file" accept="image/*,application/pdf" onChange={(e) => handleDocumentUpload(e, 'government_id')} className="hidden" /></div>{uploadedFiles.government_id && <div className="mt-2 text-green-600 text-sm flex items-center gap-1"><CheckCircle className="w-4 h-4" /> ID uploaded</div>}</div>
              <div><label className="block text-sm font-medium mb-2">Reason for Activation</label><textarea name="reason_for_activation" rows="4" value={formData.reason_for_activation} onChange={handleChange} className="w-full p-4 border rounded-xl" placeholder="Why do you want to list properties on our platform?" /></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-between mt-8">
        {step > 1 && <button onClick={prevStep} className="px-6 py-3 border-2 rounded-xl font-semibold flex items-center gap-2"><ChevronLeft className="w-4 h-4" />Back</button>}
        <div className="flex gap-3 ml-auto">
          {step < 3 ? <button onClick={nextStep} className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold flex items-center gap-2">Continue <ChevronRight className="w-4 h-4" /></button> : <button onClick={handleSubmit} disabled={loading} className="px-6 py-3 bg-green-600 text-white rounded-xl font-semibold flex items-center gap-2">{loading ? <Loader className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}Submit Activation Request</button>}
        </div>
      </div>
    </div>
  )
}

export default ActivationForm