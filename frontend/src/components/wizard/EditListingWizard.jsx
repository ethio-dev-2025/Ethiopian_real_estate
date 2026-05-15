import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { listingsAPI } from '../../services/api/listingsApi'
import { 
  Home, MapPin, DollarSign, Bed, Bath, Square, Camera, Upload, 
  ChevronRight, ChevronLeft, Sparkles, Eye, X, Star, CheckCircle,
  Wifi, Wind, Thermometer, Coffee, Dumbbell, Tv, 
  Microwave, Refrigerator, Car, Activity, Lock, 
  TreePine, Heart, Zap, Building2, 
  Sofa, Phone, Mail, Loader, Droplet, Calendar, Save, Edit3
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'

const API_URL = 'http://localhost:8000'

const EditListingWizard = ({ listing, onSuccess, onClose }) => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { t } = useLanguage()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [uploadingImages, setUploadingImages] = useState(false)
  const fileInputRef = useRef(null)
  
  // Parse existing images from listing
  const parseExistingImages = () => {
    if (listing.images && Array.isArray(listing.images)) {
      return listing.images.map((img, idx) => ({
        id: `existing-${idx}`,
        preview: img.startsWith('http') ? img : `${API_URL}${img}`,
        url: img,
        isExisting: true
      }))
    }
    return []
  }

  const parseAmenities = () => {
    if (listing.amenities && Array.isArray(listing.amenities)) {
      return listing.amenities
    }
    if (listing.amenities && typeof listing.amenities === 'string') {
      try {
        return JSON.parse(listing.amenities)
      } catch {
        return []
      }
    }
    return []
  }

  const [formData, setFormData] = useState({
    title: listing.title || '',
    property_type: listing.property_type || 'house',
    price: listing.price || '',
    bedrooms: listing.bedrooms || 0,
    bathrooms: listing.bathrooms || 0,
    sqft: listing.sqft || 0,
    year_built: listing.year_built || '',
    address: listing.address || '',
    city: listing.city || '',
    region: listing.region || '',
    description: listing.description || '',
    amenities: parseAmenities()
  })
  
  const [uploadedImages, setUploadedImages] = useState(parseExistingImages())
  const [coverImageIndex, setCoverImageIndex] = useState(0)
  const [removedImages, setRemovedImages] = useState([])

  const propertyTypes = [
    { value: 'apartment', label: 'Apartment' },
    { value: 'house', label: 'House' },
    { value: 'villa', label: 'Villa' },
    { value: 'condo', label: 'Condo' },
    { value: 'townhouse', label: 'Townhouse' },
    { value: 'commercial', label: 'Commercial' }
  ]

  const amenitiesList = [
    { icon: Wifi, name: 'WiFi', category: 'Basic' },
    { icon: Wind, name: 'Air Conditioning', category: 'Comfort' },
    { icon: Thermometer, name: 'Heating', category: 'Comfort' },
    { icon: Tv, name: 'Cable TV', category: 'Entertainment' },
    { icon: Refrigerator, name: 'Refrigerator', category: 'Appliances' },
    { icon: Microwave, name: 'Microwave', category: 'Appliances' },
    { icon: Droplet, name: 'Washing Machine', category: 'Appliances' },
    { icon: Coffee, name: 'Coffee Maker', category: 'Appliances' },
    { icon: Car, name: 'Parking', category: 'Parking' },
    { icon: Activity, name: 'Swimming Pool', category: 'Recreation' },
    { icon: Dumbbell, name: 'Gym', category: 'Recreation' },
    { icon: Lock, name: 'Security System', category: 'Safety' },
    { icon: TreePine, name: 'Garden', category: 'Outdoor' },
    { icon: Heart, name: 'Pet Friendly', category: 'Policy' },
    { icon: Sofa, name: 'Furnished', category: 'Interior' },
    { icon: Zap, name: 'Backup Power', category: 'Utility' }
  ]

  useEffect(() => {
    // Find cover image index
    const coverIdx = uploadedImages.findIndex(img => img.isCover)
    if (coverIdx !== -1) {
      setCoverImageIndex(coverIdx)
    }
  }, [])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
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
    if (uploadedImages.length + files.length > 20) {
      toast.error('Maximum 20 photos allowed')
      return
    }
    
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
        id: `new-${Date.now()}-${Math.random()}`, 
        preview: previewUrl, 
        file,
        isExisting: false
      }])
    }
    
    setUploadingImages(false)
    e.target.value = ''
    toast.success(`${files.length} image(s) added`)
  }

  const removeImage = async (image, index) => {
    if (image.isExisting && image.url) {
      setRemovedImages(prev => [...prev, image.url])
    }
    
    setUploadedImages(prev => prev.filter((_, i) => i !== index))
    
    if (coverImageIndex >= index) {
      setCoverImageIndex(Math.max(0, coverImageIndex - 1))
    }
    
    toast.success('Image removed')
  }

  const setAsCover = (index) => {
    setCoverImageIndex(index)
    toast.success('Cover image updated!')
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
    if (step === 4 && uploadedImages.length === 0) {
      toast.error('Please upload at least one photo')
      return
    }
    if (step === 4 && !formData.description) {
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

  const uploadNewImages = async (token) => {
    const newImages = uploadedImages.filter(img => !img.isExisting && img.file)
    const uploadedUrls = []
    
    for (const img of newImages) {
      const formDataImg = new FormData()
      formDataImg.append('file', img.file)
      
      const uploadResponse = await fetch(`${API_URL}/api/listings/upload-image`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formDataImg
      })
      
      const uploadData = await uploadResponse.json()
      if (uploadData.success) {
        uploadedUrls.push(uploadData.url)
      }
    }
    
    return uploadedUrls
  }

  const handleSubmit = async () => {
    if (!formData.title || !formData.price || !formData.address || !formData.city) {
      toast.error('Please fill all required fields')
      return
    }
    
    setLoading(true)
    try {
      const token = localStorage.getItem('access_token')
      
      // Upload new images
      const newImageUrls = await uploadNewImages(token)
      
      // Get existing images that weren't removed
      const existingImages = uploadedImages
        .filter(img => img.isExisting && !removedImages.includes(img.url))
        .map(img => img.url)
      
      // Combine existing and new images
      const allImages = [...existingImages, ...newImageUrls]
      
      const updateData = {
        title: formData.title,
        property_type: formData.property_type,
        price: parseFloat(formData.price),
        bedrooms: parseInt(formData.bedrooms) || 0,
        bathrooms: parseInt(formData.bathrooms) || 0,
        sqft: parseFloat(formData.sqft) || 0,
        year_built: formData.year_built ? parseInt(formData.year_built) : null,
        address: formData.address,
        city: formData.city,
        region: formData.region || '',
        description: formData.description,
        images: allImages,
        amenities: formData.amenities
      }
      
      const response = await listingsAPI.updateListing(listing.id, updateData)
      
      if (response && response.success) {
        toast.success('Listing updated successfully!')
        if (onSuccess) onSuccess()
        if (onClose) onClose()
      } else {
        toast.error(response?.message || 'Failed to update listing')
      }
    } catch (error) {
      console.error('Update error:', error)
      toast.error(error.response?.data?.detail || 'Failed to update listing')
    } finally {
      setLoading(false)
    }
  }

  const progress = ((step - 1) / 3) * 100

  const amenitiesByCategory = amenitiesList.reduce((acc, amenity) => {
    if (!acc[amenity.category]) acc[amenity.category] = []
    acc[amenity.category].push(amenity)
    return acc
  }, {})

  return (
    <div className="max-w-5xl mx-auto">
      {/* Progress Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Listing</h1>
            <p className="text-gray-500 mt-1">Update your property information</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-blue-600">{Math.round(progress)}% Complete</p>
            <div className="w-32 h-2 bg-gray-200 rounded-full mt-1 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
        
        {/* Step Indicators */}
        <div className="flex gap-2 mt-6">
          {[
            { step: 1, label: 'Basic Info', icon: Home },
            { step: 2, label: 'Location', icon: MapPin },
            { step: 3, label: 'Amenities', icon: Sparkles },
            { step: 4, label: 'Photos & Details', icon: Camera }
          ].map((item, idx) => (
            <div key={idx} className="flex-1">
              <div className={`h-1 rounded-full transition-all ${step > idx ? 'bg-blue-600' : 'bg-gray-200'}`} />
              <div className="flex items-center gap-2 mt-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                  step > idx ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {idx + 1}
                </div>
                <p className={`text-xs font-medium ${step > idx ? 'text-blue-600' : 'text-gray-400'}`}>
                  {item.label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* STEP 1: Basic Information */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl shadow-lg border p-8"
          >
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-blue-600" />
              Basic Information
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Property Title <span className="text-red-500">*</span>
                </label>
                <input
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g., Beautiful Modern Villa in Bole"
                  className="w-full p-4 border rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Property Type</label>
                  <select
                    name="property_type"
                    value={formData.property_type}
                    onChange={handleChange}
                    className="w-full p-4 border rounded-xl focus:ring-2 focus:ring-blue-500"
                  >
                    {propertyTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Price (ETB) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      name="price"
                      type="number"
                      value={formData.price}
                      onChange={handleChange}
                      placeholder="Enter price"
                      className="w-full pl-12 pr-4 py-4 border rounded-xl focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Bedrooms</label>
                  <div className="relative">
                    <Bed className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      name="bedrooms"
                      type="number"
                      value={formData.bedrooms}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-4 border rounded-xl"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Bathrooms</label>
                  <div className="relative">
                    <Bath className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      name="bathrooms"
                      type="number"
                      value={formData.bathrooms}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-4 border rounded-xl"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Square Feet</label>
                  <div className="relative">
                    <Square className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      name="sqft"
                      type="number"
                      value={formData.sqft}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-4 border rounded-xl"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Year Built</label>
                <input
                  name="year_built"
                  type="number"
                  value={formData.year_built}
                  onChange={handleChange}
                  placeholder="e.g., 2020"
                  className="w-full p-4 border rounded-xl"
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 2: Location */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl shadow-lg border p-8"
          >
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              Property Location
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Address <span className="text-red-500">*</span>
                </label>
                <input
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Street address"
                  className="w-full p-4 border rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="City"
                    className="w-full p-4 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Region</label>
                  <input
                    name="region"
                    value={formData.region}
                    onChange={handleChange}
                    placeholder="Region/State"
                    className="w-full p-4 border rounded-xl"
                  />
                </div>
              </div>

              <div className="bg-blue-50 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  <p className="font-semibold text-blue-800">Location Preview</p>
                </div>
                <p className="text-sm text-blue-700">
                  {formData.address}, {formData.city}, {formData.region}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 3: Amenities */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl shadow-lg border p-8"
          >
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              Amenities & Features
            </h2>
            
            <div className="space-y-8">
              {Object.entries(amenitiesByCategory).map(([category, items]) => (
                <div key={category}>
                  <h3 className="font-semibold text-gray-700 mb-3">{category}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {items.map(amenity => {
                      const Icon = amenity.icon
                      const isSelected = formData.amenities.includes(amenity.name)
                      return (
                        <button
                          key={amenity.name}
                          onClick={() => handleAmenityToggle(amenity.name)}
                          className={`p-3 border-2 rounded-xl flex items-center gap-3 transition-all ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <Icon className={`w-5 h-5 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`} />
                          <span className="text-sm flex-1 text-left">{amenity.name}</span>
                          {isSelected && <CheckCircle className="w-4 h-4 text-blue-600" />}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-600">
                Selected amenities: <span className="font-semibold">{formData.amenities.length}</span>
              </p>
            </div>
          </motion.div>
        )}

        {/* STEP 4: Photos & Description */}
        {step === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl shadow-lg border p-8"
          >
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Camera className="w-5 h-5 text-blue-600" />
              Photos & Description
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Photos <span className="text-red-500">* (at least 1)</span>
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer hover:border-blue-500 transition-all"
                >
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">Click to upload photos</p>
                  <p className="text-sm text-gray-400 mt-1">PNG, JPG up to 10MB</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploadingImages}
                  />
                </div>
                
                {uploadingImages && (
                  <div className="mt-4 flex justify-center">
                    <Loader className="w-6 h-6 animate-spin text-blue-600" />
                    <span className="ml-2 text-gray-600">Uploading images...</span>
                  </div>
                )}
                
                {uploadedImages.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-2">{uploadedImages.length} photo(s)</p>
                    <div className="grid grid-cols-4 gap-4">
                      {uploadedImages.map((img, idx) => (
                        <div key={img.id} className="relative group">
                          <img
                            src={img.preview}
                            className="w-full h-24 object-cover rounded-lg"
                            alt={`Preview ${idx}`}
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                            <button
                              onClick={() => setAsCover(idx)}
                              className={`p-1 rounded-full ${coverImageIndex === idx ? 'bg-green-600' : 'bg-blue-600'} text-white`}
                              title="Set as cover"
                            >
                              {coverImageIndex === idx ? <CheckCircle className="w-3 h-3" /> : <Star className="w-3 h-3" />}
                            </button>
                            <button
                              onClick={() => removeImage(img, idx)}
                              className="p-1 bg-red-600 text-white rounded-full"
                              title="Remove image"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                          {coverImageIndex === idx && (
                            <div className="absolute top-1 left-1 bg-green-600 text-white text-xs px-1 rounded">COVER</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  rows="6"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe your property in detail..."
                  className="w-full p-4 border rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8">
        {step > 1 && (
          <button
            onClick={prevStep}
            className="px-8 py-3 border-2 rounded-xl font-semibold hover:bg-gray-50 flex items-center gap-2 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
        )}
        
        <div className="flex gap-3 ml-auto">
          <button
            onClick={onClose}
            className="px-6 py-3 border rounded-xl font-semibold hover:bg-gray-50 transition-all"
          >
            Cancel
          </button>
          
          {step < 4 ? (
            <button
              onClick={nextStep}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg flex items-center gap-2 transition-all"
            >
              Continue
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl font-semibold hover:shadow-lg flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Changes
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Preview Section */}
      {step === 4 && (
        <div className="mt-8 p-4 bg-gray-50 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="w-4 h-4 text-gray-500" />
            <p className="text-sm font-medium text-gray-700">Listing Preview</p>
          </div>
          <div className="flex gap-4 text-sm text-gray-500 flex-wrap">
            <span>📷 {uploadedImages.length} photos</span>
            <span>🏠 {propertyTypes.find(p => p.value === formData.property_type)?.label || formData.property_type}</span>
            <span>💰 ETB {Number(formData.price).toLocaleString()}</span>
            <span>📍 {formData.city || 'Location'}</span>
            <span>🛏 {formData.bedrooms} beds</span>
            <span>🛁 {formData.bathrooms} baths</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default EditListingWizard