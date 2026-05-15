import React, { useState, useRef } from 'react'
import { 
  Home, MapPin, DollarSign, Bed, Bath, Square, Camera, Upload, 
  ChevronRight, ChevronLeft, Sparkles, Eye, X, Star, CheckCircle,
  Wifi, Wind, Thermometer, Coffee, Dumbbell, Tv, 
  Microwave, Refrigerator, Car, Activity, Lock, 
  TreePine, Heart, Zap, Building2,  // Make sure Building2 is here
  Sofa, Phone, Mail, Loader, Droplet, Calendar, Save
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'

const API_URL = 'http://localhost:8000'

const AddPropertyWizard = ({ onSuccess }) => {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [uploadingImages, setUploadingImages] = useState(false)
  const fileInputRef = useRef(null)
  
  const [formData, setFormData] = useState({
    title: '',
    property_type: 'apartment',
    rent: '',
    bedrooms: '',
    bathrooms: '',
    sqft: '',
    address: '',
    city: '',
    region: '',
    description: '',
    amenities: []
  })
  
  const [uploadedImages, setUploadedImages] = useState([])
  const [coverImageIndex, setCoverImageIndex] = useState(0)

  const propertyTypes = [
    { value: 'apartment', label: 'Apartment' },
    { value: 'house', label: 'House' },
    { value: 'villa', label: 'Villa' },
    { value: 'condo', label: 'Condo' }
  ]

  const amenitiesList = [
    { icon: Wifi, name: 'WiFi' },
    { icon: Wind, name: 'Air Conditioning' },
    { icon: Tv, name: 'Cable TV' },
    { icon: Refrigerator, name: 'Refrigerator' },
    { icon: Microwave, name: 'Microwave' },
    { icon: Car, name: 'Parking' },
    { icon: Lock, name: 'Security' }
  ]

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
    if (uploadedImages.length + files.length > 10) {
      toast.error('Maximum 10 photos allowed')
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
      setUploadedImages(prev => [...prev, { id: Date.now(), preview: previewUrl, file }])
    }
    
    setUploadingImages(false)
    e.target.value = ''
    toast.success(`${files.length} image(s) added`)
  }

  const removeImage = (id) => {
    setUploadedImages(prev => prev.filter(p => p.id !== id))
    if (coverImageIndex >= uploadedImages.length - 1) {
      setCoverImageIndex(Math.max(0, uploadedImages.length - 2))
    }
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
    if (step === 1 && !formData.rent) {
      toast.error('Please enter rent amount')
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

  const handleSubmit = async () => {
    if (!formData.title || !formData.rent || !formData.address || !formData.city) {
      toast.error('Please fill all required fields')
      return
    }
    if (uploadedImages.length === 0) {
      toast.error('Please upload at least one photo')
      return
    }
    
    setLoading(true)
    try {
      const token = localStorage.getItem('access_token')
      const uploadedImageUrls = []
      
      // Upload images
      for (const img of uploadedImages) {
        if (img.file) {
          const formDataImg = new FormData()
          formDataImg.append('file', img.file)
          
          const uploadResponse = await fetch(`${API_URL}/api/listings/upload-image`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formDataImg
          })
          
          const uploadData = await uploadResponse.json()
          if (uploadData.success) {
            uploadedImageUrls.push(uploadData.url)
          }
        }
      }
      
      // CRITICAL: listing_type MUST be 'rent'
      const propertyData = {
        title: formData.title,
        property_type: formData.property_type,
        price: parseFloat(formData.rent),
        bedrooms: parseInt(formData.bedrooms) || 0,
        bathrooms: parseInt(formData.bathrooms) || 0,
        sqft: parseFloat(formData.sqft) || 0,
        address: formData.address,
        city: formData.city,
        region: formData.region || '',
        description: formData.description,
        images: uploadedImageUrls,
        amenities: formData.amenities,
        listing_type: 'rent',
        status: 'active'
      }
      
      console.log('=== SUBMITTING RENTAL PROPERTY ===')
      console.log('listing_type:', propertyData.listing_type)
      
      const response = await fetch(`${API_URL}/api/listings/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(propertyData)
      })
      
      const data = await response.json()
      console.log('Create Response:', data)
      
      if (response.ok && data.success) {
        toast.success('Rental property added successfully!')
        // IMPORTANT: Call onSuccess to trigger navigation and refresh
        if (onSuccess) {
          onSuccess()
        }
      } else {
        toast.error(data.detail || 'Failed to add property')
      }
    } catch (error) {
      console.error('Add property error:', error)
      toast.error(error.message || 'Failed to add property')
    } finally {
      setLoading(false)
    }
  }

  const progress = ((step - 1) / 3) * 100

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Add Rental Property</h1>
            <p className="text-gray-500 mt-1">Fill in the details to list your rental property</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-green-600">{Math.round(progress)}% Complete</p>
            <div className="w-32 h-2 bg-gray-200 rounded-full mt-1 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-green-600 to-teal-600 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
        
        <div className="flex gap-2 mt-6">
          {['Basic Info', 'Location', 'Amenities', 'Photos'].map((label, idx) => (
            <div key={idx} className="flex-1">
              <div className={`h-1 rounded-full transition-all ${step > idx ? 'bg-green-600' : 'bg-gray-200'}`} />
              <div className="flex items-center gap-2 mt-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                  step > idx ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {idx + 1}
                </div>
                <p className={`text-xs font-medium ${step > idx ? 'text-green-600' : 'text-gray-400'}`}>
                  {label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white rounded-2xl shadow-lg border p-8"
          >
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Home className="w-5 h-5 text-green-600" />
              Basic Information
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Property Title *</label>
                <input
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g., Cozy Studio in Bole"
                  className="w-full p-4 border rounded-xl focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Property Type</label>
                  <select
                    name="property_type"
                    value={formData.property_type}
                    onChange={handleChange}
                    className="w-full p-4 border rounded-xl"
                  >
                    {propertyTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Monthly Rent (ETB) *</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      name="rent"
                      type="number"
                      value={formData.rent}
                      onChange={handleChange}
                      placeholder="Enter rent amount"
                      className="w-full pl-12 pr-4 py-4 border rounded-xl focus:ring-2 focus:ring-green-500"
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
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white rounded-2xl shadow-lg border p-8"
          >
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-green-600" />
              Location
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Address *</label>
                <input
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Street address"
                  className="w-full p-4 border rounded-xl focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">City *</label>
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
                    placeholder="Region"
                    className="w-full p-4 border rounded-xl"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white rounded-2xl shadow-lg border p-8"
          >
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-green-600" />
              Amenities
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {amenitiesList.map(amenity => {
                const Icon = amenity.icon
                const isSelected = formData.amenities.includes(amenity.name)
                return (
                  <button
                    key={amenity.name}
                    onClick={() => handleAmenityToggle(amenity.name)}
                    className={`p-3 border-2 rounded-xl flex items-center gap-3 transition-all ${
                      isSelected
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isSelected ? 'text-green-600' : 'text-gray-400'}`} />
                    <span className="text-sm flex-1 text-left">{amenity.name}</span>
                    {isSelected && <CheckCircle className="w-4 h-4 text-green-600" />}
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white rounded-2xl shadow-lg border p-8"
          >
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Camera className="w-5 h-5 text-green-600" />
              Photos & Description
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Photos *</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer hover:border-green-500"
                >
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">Click to upload photos</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
                
                {uploadedImages.length > 0 && (
                  <div className="mt-4 grid grid-cols-4 gap-4">
                    {uploadedImages.map((img, idx) => (
                      <div key={img.id} className="relative group">
                        <img src={img.preview} className="w-full h-24 object-cover rounded-lg" />
                        <button
                          onClick={() => removeImage(img.id)}
                          className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description *</label>
                <textarea
                  name="description"
                  rows="6"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe your property..."
                  className="w-full p-4 border rounded-xl focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-between mt-8">
        {step > 1 && (
          <button onClick={prevStep} className="px-8 py-3 border-2 rounded-xl font-semibold hover:bg-gray-50 flex items-center gap-2">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
        )}
        
        <div className="flex gap-3 ml-auto">
          {step < 4 ? (
            <button onClick={nextStep} className="px-8 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl font-semibold hover:shadow-lg flex items-center gap-2">
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={loading} className="px-8 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl font-semibold hover:shadow-lg flex items-center gap-2 disabled:opacity-50">
              {loading ? <Loader className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {loading ? 'Adding...' : 'Add Property'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default AddPropertyWizard