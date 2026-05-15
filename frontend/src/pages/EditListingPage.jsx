import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AppSidebar from '../components/layout/AppSidebar'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Home, MapPin, DollarSign, Bed, Bath, Square, Camera, Upload, 
  ChevronRight, ChevronLeft, Sparkles, Eye, X, CheckCircle,
  Wifi, Wind, Thermometer, Coffee, Dumbbell, Tv, 
  Microwave, Refrigerator, Car, Activity, Lock, 
  TreePine, Heart, Zap, Sofa, Loader, Droplet, Save,
  Star, Calendar, Phone, Mail, Building
} from 'lucide-react'
import toast from 'react-hot-toast'

const API_URL = 'http://localhost:8000'

const EditListingPage = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const { user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [uploadingImages, setUploadingImages] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const fileInputRef = useRef(null)
  const fetchCompletedRef = useRef(false)
  const abortControllerRef = useRef(null)
  
  const [formData, setFormData] = useState({
    title: '',
    property_type: 'house',
    price: '',
    listing_type: 'sale',
    bedrooms: '',
    bathrooms: '',
    sqft: '',
    year_built: '',
    address: '',
    city: '',
    region: '',
    sub_city: '',
    kebele: '',
    description: '',
    amenities: [],
    phone_number: '',
    email: ''
  })
  
  const [uploadedImages, setUploadedImages] = useState([])
  const [existingImages, setExistingImages] = useState([])
  const [coverImageIndex, setCoverImageIndex] = useState(0)
  const [isDraft, setIsDraft] = useState(true)

  const propertyTypes = [
    { value: 'house', label: 'House' },
    { value: 'apartment', label: 'Apartment' },
    { value: 'villa', label: 'Villa' },
    { value: 'condo', label: 'Condo' },
    { value: 'townhouse', label: 'Townhouse' },
    { value: 'commercial', label: 'Commercial' }
  ]

  const amenitiesList = [
    { icon: Wifi, name: 'WiFi' },
    { icon: Wind, name: 'Air Conditioning' },
    { icon: Thermometer, name: 'Heating' },
    { icon: Tv, name: 'Cable TV' },
    { icon: Refrigerator, name: 'Refrigerator' },
    { icon: Microwave, name: 'Microwave' },
    { icon: Droplet, name: 'Washing Machine' },
    { icon: Coffee, name: 'Coffee Maker' },
    { icon: Car, name: 'Parking' },
    { icon: Activity, name: 'Swimming Pool' },
    { icon: Dumbbell, name: 'Gym' },
    { icon: Lock, name: 'Security System' },
    { icon: TreePine, name: 'Garden' },
    { icon: Heart, name: 'Pet Friendly' },
    { icon: Sofa, name: 'Furnished' },
    { icon: Zap, name: 'Backup Power' }
  ]

  useEffect(() => {
    if (!fetchCompletedRef.current) {
      fetchCompletedRef.current = true
      fetchListing()
    }
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [id])

  const fetchListing = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    const abortController = new AbortController()
    abortControllerRef.current = abortController
    
    try {
      const token = localStorage.getItem('access_token')
      
      const timeoutId = setTimeout(() => abortController.abort(), 10000)
      
      const response = await fetch(`${API_URL}/api/listings/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
        signal: abortController.signal
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) throw new Error('Failed to fetch listing')
      
      const data = await response.json()
      
      // IMPORTANT: Preserve all values exactly as they come from the API
      setFormData({
        title: data.title || '',
        property_type: data.property_type || 'house',
        price: data.price || '',
        listing_type: data.listing_type || 'sale',
        bedrooms: data.bedrooms || '',
        bathrooms: data.bathrooms || '',
        sqft: data.sqft || '',
        year_built: data.year_built || '',
        address: data.address || '',
        city: data.city || '',
        region: data.region || '',
        sub_city: data.sub_city || '',
        kebele: data.kebele || '',
        description: data.description || '',
        amenities: Array.isArray(data.amenities) ? data.amenities : [],
        phone_number: data.phone_number || user?.phone || '',
        email: data.email || user?.email || ''
      })
      
      setIsDraft(data.is_draft === true)
      
      if (data.images && Array.isArray(data.images) && data.images.length > 0) {
        const existingImgList = data.images.map((url, idx) => ({
          id: idx,
          url: url,
          isExisting: true
        }))
        setExistingImages(existingImgList)
        if (data.cover_image) {
          const coverIdx = data.images.findIndex(img => img === data.cover_image)
          setCoverImageIndex(coverIdx >= 0 ? coverIdx : 0)
        }
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error fetching listing:', error)
        toast.error('Failed to load listing')
        navigate('/my-listings')
      }
    } finally {
      setFetchLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleAmenityToggle = (amenity) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }))
  }

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files)
    setUploadingImages(true)
    
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
      setUploadedImages(prev => [...prev, { 
        id: Date.now() + Math.random(), 
        preview: previewUrl, 
        file,
        url: null 
      }])
    }
    
    setUploadingImages(false)
    e.target.value = ''
    if (files.length > 0) {
      toast.success(`${files.length} image(s) added`)
    }
  }

  const removeNewImage = (id) => {
    setUploadedImages(prev => prev.filter(p => p.id !== id))
  }

  const removeExistingImage = (index) => {
    setExistingImages(prev => prev.filter((_, idx) => idx !== index))
    if (coverImageIndex >= existingImages.length - 1 && existingImages.length > 1) {
      setCoverImageIndex(Math.max(0, existingImages.length - 2))
    }
  }

  const setAsCover = (index, isExisting = true) => {
    setCoverImageIndex(index)
    toast.success('Cover photo selected!')
  }

  const uploadNewImages = async () => {
    const token = localStorage.getItem('access_token')
    const uploadedImageUrls = []
    
    for (const img of uploadedImages) {
      if (img.file) {
        const formDataImg = new FormData()
        formDataImg.append('file', img.file)
        
        try {
          const uploadResponse = await fetch(`${API_URL}/api/listings/upload-image`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formDataImg
          })
          
          const uploadData = await uploadResponse.json()
          if (uploadData.success) {
            uploadedImageUrls.push(uploadData.url)
          }
        } catch (err) {
          console.error('Upload error:', err)
        }
      }
    }
    
    return uploadedImageUrls
  }

  const handleUpdate = async (publish = false) => {
    setLoading(true)
    try {
      const token = localStorage.getItem('access_token')
      const newImageUrls = await uploadNewImages()
      
      const existingImageUrls = existingImages.map(img => img.url)
      const allImages = [...existingImageUrls, ...newImageUrls]
      
      let coverImage = null
      if (coverImageIndex < existingImageUrls.length) {
        coverImage = existingImageUrls[coverImageIndex]
      } else if (coverImageIndex - existingImageUrls.length < newImageUrls.length) {
        coverImage = newImageUrls[coverImageIndex - existingImageUrls.length]
      }
      
      const listingData = {
        title: formData.title,
        property_type: formData.property_type,
        price: parseFloat(formData.price),
        listing_type: formData.listing_type,
        bedrooms: parseInt(formData.bedrooms) || 0,
        bathrooms: parseInt(formData.bathrooms) || 0,
        sqft: parseFloat(formData.sqft) || 0,
        year_built: formData.year_built ? parseInt(formData.year_built) : null,
        address: formData.address,
        city: formData.city,
        region: formData.region,
        sub_city: formData.sub_city,
        kebele: formData.kebele,
        description: formData.description,
        images: allImages,
        cover_image: coverImage,
        amenities: formData.amenities,
        phone_number: formData.phone_number,
        email: formData.email,
        is_draft: !publish,
        status: publish ? 'active' : 'draft'
      }
      
      const response = await fetch(`${API_URL}/api/listings/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(listingData)
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        toast.success(publish ? 'Listing published successfully!' : 'Listing updated successfully!')
        navigate('/my-listings')
      } else {
        toast.error(data.detail || 'Failed to update listing')
      }
    } catch (error) {
      console.error('Update error:', error)
      toast.error('Failed to update listing')
    } finally {
      setLoading(false)
    }
  }

  const nextStep = () => {
    if (step === 1 && !formData.title) {
      toast.error('Please enter a title')
      return
    }
    if (step === 1 && !formData.price) {
      toast.error('Please enter a price')
      return
    }
    if (step === 2 && !formData.address) {
      toast.error('Please enter an address')
      return
    }
    if (step === 2 && !formData.city) {
      toast.error('Please enter a city')
      return
    }
    if (step === 5 && !formData.description) {
      toast.error('Please enter a description')
      return
    }
    setStep(step + 1)
    window.scrollTo(0, 0)
  }

  const prevStep = () => {
    setStep(step - 1)
    window.scrollTo(0, 0)
  }

  const progress = ((step - 1) / 5) * 100

  const PreviewModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={() => setShowPreview(false)}>
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">Preview Listing</h2>
          <button onClick={() => setShowPreview(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6">
          <div className="relative h-64 bg-gray-200 rounded-xl mb-4">
            {(existingImages[coverImageIndex] || uploadedImages[coverImageIndex]) && (
              <img 
                src={existingImages[coverImageIndex] ? `${API_URL}${existingImages[coverImageIndex].url}` : uploadedImages[coverImageIndex]?.preview} 
                className="w-full h-full object-cover rounded-xl" 
                alt="Preview"
              />
            )}
          </div>
          <h2 className="text-2xl font-bold">{formData.title}</h2>
          <p className="text-2xl text-blue-600">ETB {formData.price}</p>
          <p className="text-gray-500">{formData.address}, {formData.city}</p>
          <p className="mt-4">{formData.description}</p>
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p><Phone className="w-4 h-4 inline mr-2" />{formData.phone_number || 'Not provided'}</p>
            <p><Mail className="w-4 h-4 inline mr-2" />{formData.email || 'Not provided'}</p>
          </div>
        </div>
      </div>
    </div>
  )

  if (fetchLoading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <AppSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
          <div className="p-6" />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <AppSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      <main className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        {showPreview && <PreviewModal />}

        <div className="bg-white border-b px-6 py-4">
          <h1 className="text-2xl font-bold">Edit Listing</h1>
          <p className="text-gray-500">Update your property information</p>
        </div>

        <div className="p-6 max-w-5xl mx-auto">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <div className="text-right">
                <p className="text-sm font-semibold text-blue-600">{Math.round(progress)}% Complete</p>
                <div className="w-32 h-2 bg-gray-200 rounded-full mt-1 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              {['Basic Info', 'Location', 'Address Details', 'Amenities', 'Photos & Contact'].map((label, idx) => (
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
            {/* Step 1: Basic Information */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-white rounded-2xl shadow-lg border p-8">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Home className="w-5 h-5 text-blue-600" />Basic Information</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Property Title *</label>
                    <input name="title" value={formData.title} onChange={handleChange} className="w-full p-4 border rounded-xl" />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    {/* <div>
                      <label className="block text-sm font-medium mb-2">Listing Type</label>
                      <select name="listing_type" value={formData.listing_type} onChange={handleChange} className="w-full p-4 border rounded-xl">
                        <option value="sale">For Sale</option>
                        <option value="rent">For Rent</option>
                      </select>
                    </div> */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Property Type</label>
                      <select name="property_type" value={formData.property_type} onChange={handleChange} className="w-full p-4 border rounded-xl">
                        {propertyTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">Price (ETB) *</label>
                      <input name="price" type="number" value={formData.price} onChange={handleChange} className="w-full p-4 border rounded-xl" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Bedrooms</label>
                      <input name="bedrooms" type="number" value={formData.bedrooms} onChange={handleChange} className="w-full p-4 border rounded-xl" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Bathrooms</label>
                      <input name="bathrooms" type="number" value={formData.bathrooms} onChange={handleChange} className="w-full p-4 border rounded-xl" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">Square Feet</label>
                      <input name="sqft" type="number" value={formData.sqft} onChange={handleChange} className="w-full p-4 border rounded-xl" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Year Built</label>
                      <input name="year_built" type="number" value={formData.year_built} onChange={handleChange} className="w-full p-4 border rounded-xl" placeholder="e.g., 2020" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Main Location */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-white rounded-2xl shadow-lg border p-8">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><MapPin className="w-5 h-5 text-blue-600" />Location</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Address *</label>
                    <input name="address" value={formData.address} onChange={handleChange} className="w-full p-4 border rounded-xl" />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">City *</label>
                      <input name="city" value={formData.city} onChange={handleChange} className="w-full p-4 border rounded-xl" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Region</label>
                      <input name="region" value={formData.region} onChange={handleChange} className="w-full p-4 border rounded-xl" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Address Details */}
            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-white rounded-2xl shadow-lg border p-8">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Building className="w-5 h-5 text-blue-600" />Address Details</h2>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">Sub City</label>
                      <input name="sub_city" value={formData.sub_city} onChange={handleChange} className="w-full p-4 border rounded-xl" placeholder="e.g., Bole, Kirkos" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Kebele</label>
                      <input name="kebele" value={formData.kebele} onChange={handleChange} className="w-full p-4 border rounded-xl" placeholder="e.g., Kebele 03" />
                    </div>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-3"><MapPin className="w-5 h-5 text-blue-600" /><p className="font-semibold text-blue-800">Complete Address</p></div>
                    <p className="text-sm text-blue-700">{formData.address}, {formData.sub_city && `${formData.sub_city}, `}{formData.kebele && `Kebele ${formData.kebele}, `}{formData.city}, {formData.region}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 4: Amenities */}
            {step === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-white rounded-2xl shadow-lg border p-8">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Sparkles className="w-5 h-5 text-blue-600" />Amenities</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {amenitiesList.map(a => {
                    const Icon = a.icon
                    const isSelected = formData.amenities.includes(a.name)
                    return (
                      <button key={a.name} type="button" onClick={() => handleAmenityToggle(a.name)} className={`p-3 border-2 rounded-xl flex items-center gap-2 transition-all ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`} />
                        <span className="text-sm">{a.name}</span>
                      </button>
                    )
                  })}
                </div>
              </motion.div>
            )}

            {/* Step 5: Photos, Description & Contact */}
            {step === 5 && (
              <motion.div key="step5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-white rounded-2xl shadow-lg border p-8">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Camera className="w-5 h-5 text-blue-600" />Photos & Contact</h2>
                <div className="space-y-6">
                  {/* Photos */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Photos</label>
                    {existingImages.length > 0 && (
                      <div className="grid grid-cols-4 gap-3 mb-4">
                        {existingImages.map((img, idx) => (
                          <div key={idx} className="relative group">
                            <img src={`${API_URL}${img.url}`} className="w-full h-24 object-cover rounded-lg" />
                            <button onClick={() => removeExistingImage(idx)} className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100"><X className="w-3 h-3" /></button>
                            <button onClick={() => setAsCover(idx, true)} className={`absolute bottom-1 left-1 p-1 rounded-full ${coverImageIndex === idx ? 'bg-yellow-500' : 'bg-black bg-opacity-50'}`}><Star className="w-3 h-3 text-white" /></button>
                            {coverImageIndex === idx && <div className="absolute top-1 left-1 bg-yellow-500 text-white text-xs px-1 rounded">Cover</div>}
                          </div>
                        ))}
                      </div>
                    )}
                    <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer hover:border-blue-500">
                      <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600">Upload new photos</p>
                      <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </div>
                    {uploadingImages && (
                      <div className="text-center py-2">
                        <Loader className="w-5 h-5 animate-spin text-blue-600 mx-auto" />
                        <p className="text-xs text-gray-500 mt-1">Uploading...</p>
                      </div>
                    )}
                    {uploadedImages.length > 0 && (
                      <div className="grid grid-cols-4 gap-3 mt-4">
                        {uploadedImages.map((img, idx) => (
                          <div key={img.id} className="relative"><img src={img.preview} className="w-full h-24 object-cover rounded-lg" /><button onClick={() => removeNewImage(img.id)} className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full"><X className="w-3 h-3" /></button></div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Description *</label>
                    <textarea name="description" rows="4" value={formData.description} onChange={handleChange} className="w-full p-4 border rounded-xl" />
                  </div>

                  {/* Contact Information */}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-2 flex items-center gap-2"><Phone className="w-4 h-4" />Phone Number</label>
                      <input name="phone_number" value={formData.phone_number} onChange={handleChange} className="w-full p-4 border rounded-xl" placeholder="+251 911 111 111" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 flex items-center gap-2"><Mail className="w-4 h-4" />Email Address</label>
                      <input name="email" type="email" value={formData.email} onChange={handleChange} className="w-full p-4 border rounded-xl" placeholder="contact@property.com" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            {step > 1 && <button onClick={prevStep} className="px-6 py-3 border-2 rounded-xl font-semibold flex items-center gap-2"><ChevronLeft className="w-4 h-4" />Back</button>}
            <div className="flex gap-3 ml-auto">
              {step === 5 && <button onClick={() => setShowPreview(true)} className="px-6 py-3 border-2 rounded-xl font-semibold flex items-center gap-2"><Eye className="w-4 h-4" />Preview</button>}
              {step === 5 && (
                <button onClick={() => handleUpdate(false)} disabled={loading} className="px-6 py-3 border-2 rounded-xl font-semibold flex items-center gap-2 disabled:opacity-50">
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
              )}
              {step === 5 && isDraft && (
                <button onClick={() => handleUpdate(true)} disabled={loading} className="px-6 py-3 bg-green-600 text-white rounded-xl font-semibold flex items-center gap-2 disabled:opacity-50">
                  <CheckCircle className="w-4 h-4" />
                  Publish
                </button>
              )}
              {step < 5 && <button onClick={nextStep} className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold flex items-center gap-2">Continue <ChevronRight className="w-4 h-4" /></button>}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default EditListingPage