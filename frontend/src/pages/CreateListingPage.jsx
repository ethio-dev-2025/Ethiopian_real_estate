import React, { useState, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { 
  Home, DollarSign, MapPin, Bed, Bath, Square, 
  Upload, X, Plus, CheckCircle, AlertCircle, Eye,
  Save, Send, Image, Trash2, Star, ChevronLeft, ChevronRight
} from 'lucide-react'
import toast from 'react-hot-toast'

const API_URL = 'http://localhost:8000'

const CreateListingPage = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [savingDraft, setSavingDraft] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const [currentListingId, setCurrentListingId] = useState(null)
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    listing_type: 'sale',
    property_type: 'house',
    address: '',
    city: '',
    price: '',
    bedrooms: '',
    bathrooms: '',
    sqft: '',
    amenities: []
  })
  
  const [amenityInput, setAmenityInput] = useState('')
  const [images, setImages] = useState([])
  const [imagePreviews, setImagePreviews] = useState([])
  const [coverImageIndex, setCoverImageIndex] = useState(0)
  const [uploadingImages, setUploadingImages] = useState(false)
  const fileInputRef = useRef(null)

  const getToken = () => localStorage.getItem('access_token')

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleAddAmenity = () => {
    if (amenityInput.trim()) {
      setFormData(prev => ({
        ...prev,
        amenities: [...prev.amenities, amenityInput.trim()]
      }))
      setAmenityInput('')
    }
  }

  const handleRemoveAmenity = (index) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.filter((_, i) => i !== index)
    }))
  }

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return
    
    setUploadingImages(true)
    const newImages = [...images, ...files]
    setImages(newImages)
    
    const newPreviews = [...imagePreviews]
    for (const file of files) {
      const reader = new FileReader()
      await new Promise((resolve) => {
        reader.onloadend = () => {
          newPreviews.push(reader.result)
          resolve()
        }
        reader.readAsDataURL(file)
      })
    }
    setImagePreviews(newPreviews)
    
    if (!currentListingId) {
      setUploadingImages(false)
      toast.success(`${files.length} image(s) selected`)
      return
    }
    
    try {
      const token = getToken()
      const formDataUpload = new FormData()
      files.forEach(file => formDataUpload.append('images', file))
      
      const response = await fetch(`${API_URL}/api/listings/${currentListingId}/images`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formDataUpload
      })
      
      const data = await response.json()
      if (data.success) toast.success(data.message)
    } catch (error) {
      console.error('Error uploading images:', error)
      toast.error('Failed to upload images')
    } finally {
      setUploadingImages(false)
    }
  }

  const handleRemoveImage = (index) => {
    setImages(images.filter((_, i) => i !== index))
    setImagePreviews(imagePreviews.filter((_, i) => i !== index))
    if (coverImageIndex === index) {
      setCoverImageIndex(0)
    } else if (coverImageIndex > index) {
      setCoverImageIndex(coverImageIndex - 1)
    }
  }

  const setAsCover = (index) => {
    setCoverImageIndex(index)
    toast.success('Cover photo selected!')
  }

  const saveAsDraft = async () => {
    setSavingDraft(true)
    try {
      const token = getToken()
      const formPayload = new FormData()
      formPayload.append('title', formData.title || 'Untitled')
      formPayload.append('description', formData.description || '')
      formPayload.append('listing_type', formData.listing_type)
      formPayload.append('property_type', formData.property_type)
      formPayload.append('city', formData.city || 'Unknown')
      formPayload.append('price', formData.price || '0')
      formPayload.append('address', formData.address || '')
      formPayload.append('bedrooms', formData.bedrooms || '0')
      formPayload.append('bathrooms', formData.bathrooms || '0')
      formPayload.append('sqft', formData.sqft || '0')
      formPayload.append('amenities', JSON.stringify(formData.amenities))
      formPayload.append('status', 'draft')
      
      let url = `${API_URL}/api/listings/`
      let method = 'POST'
      
      if (currentListingId) {
        url = `${API_URL}/api/listings/${currentListingId}`
        method = 'PUT'
        const updatePayload = new FormData()
        updatePayload.append('title', formData.title)
        updatePayload.append('description', formData.description || '')
        updatePayload.append('price', formData.price || '0')
        updatePayload.append('city', formData.city)
        updatePayload.append('bedrooms', formData.bedrooms || '0')
        updatePayload.append('bathrooms', formData.bathrooms || '0')
        updatePayload.append('sqft', formData.sqft || '0')
        updatePayload.append('amenities', JSON.stringify(formData.amenities))
        
        const response = await fetch(url, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}` },
          body: updatePayload
        })
        const data = await response.json()
        if (data.success) toast.success('Draft saved successfully')
        setSavingDraft(false)
        return
      }
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formPayload
      })
      
      const data = await response.json()
      if (data.success) {
        setCurrentListingId(data.listing.id)
        toast.success('Draft saved successfully')
        
        if (images.length > 0) {
          const imageFormData = new FormData()
          images.forEach(image => imageFormData.append('images', image))
          await fetch(`${API_URL}/api/listings/${data.listing.id}/images`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: imageFormData
          })
        }
      } else {
        toast.error(data.message || 'Failed to save draft')
      }
    } catch (error) {
      console.error('Error saving draft:', error)
      toast.error('Failed to save draft')
    } finally {
      setSavingDraft(false)
    }
  }

  const publishListing = async () => {
    if (!formData.title) { toast.error('Please enter a title'); return }
    if (!formData.city) { toast.error('Please enter a city'); return }
    if (!formData.price) { toast.error('Please enter a price'); return }
    if (imagePreviews.length === 0) { toast.error('Please upload at least one image'); return }
    
    setLoading(true)
    try {
      const token = getToken()
      let listingId = currentListingId
      
      if (!listingId) {
        const formPayload = new FormData()
        formPayload.append('title', formData.title)
        formPayload.append('description', formData.description || '')
        formPayload.append('listing_type', formData.listing_type)
        formPayload.append('property_type', formData.property_type)
        formPayload.append('city', formData.city)
        formPayload.append('price', formData.price)
        formPayload.append('address', formData.address || '')
        formPayload.append('bedrooms', formData.bedrooms || '0')
        formPayload.append('bathrooms', formData.bathrooms || '0')
        formPayload.append('sqft', formData.sqft || '0')
        formPayload.append('amenities', JSON.stringify(formData.amenities))
        formPayload.append('status', 'pending')
        
        const createResponse = await fetch(`${API_URL}/api/listings/`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formPayload
        })
        
        const createData = await createResponse.json()
        if (!createData.success) {
          toast.error(createData.message || 'Failed to create listing')
          setLoading(false)
          return
        }
        listingId = createData.listing.id
        setCurrentListingId(listingId)
        
        if (images.length > 0) {
          const imageFormData = new FormData()
          images.forEach(image => imageFormData.append('images', image))
          await fetch(`${API_URL}/api/listings/${listingId}/images`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: imageFormData
          })
        }
      } else {
        const updatePayload = new FormData()
        updatePayload.append('title', formData.title)
        updatePayload.append('description', formData.description || '')
        updatePayload.append('price', formData.price)
        updatePayload.append('city', formData.city)
        updatePayload.append('bedrooms', formData.bedrooms || '0')
        updatePayload.append('bathrooms', formData.bathrooms || '0')
        updatePayload.append('sqft', formData.sqft || '0')
        updatePayload.append('amenities', JSON.stringify(formData.amenities))
        
        await fetch(`${API_URL}/api/listings/${listingId}`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}` },
          body: updatePayload
        })
      }
      
      const publishResponse = await fetch(`${API_URL}/api/listings/${listingId}/publish`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      const publishData = await publishResponse.json()
      if (publishData.success) {
        toast.success(publishData.message)
        setFormData({
          title: '',
          description: '',
          listing_type: 'sale',
          property_type: 'house',
          address: '',
          city: '',
          price: '',
          bedrooms: '',
          bathrooms: '',
          sqft: '',
          amenities: []
        })
        setImages([])
        setImagePreviews([])
        setCoverImageIndex(0)
        setCurrentListingId(null)
      } else {
        toast.error(publishData.message || 'Failed to publish')
      }
    } catch (error) {
      console.error('Error publishing:', error)
      toast.error('Failed to publish listing')
    } finally {
      setLoading(false)
    }
  }

  const PreviewModal = () => {
    if (!previewMode) return null
    
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
            <h2 className="text-xl font-bold">Preview Listing</h2>
            <button onClick={() => setPreviewMode(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
          </div>
          <div className="p-6">
            <div className="relative h-64 bg-gray-200 rounded-lg overflow-hidden mb-4">
              {imagePreviews.length > 0 ? (
                <>
                  <img src={imagePreviews[coverImageIndex]} alt="Cover" className="w-full h-64 object-cover" />
                  {imagePreviews.length > 1 && (
                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
                      {imagePreviews.map((_, idx) => (
                        <button key={idx} onClick={() => setCoverImageIndex(idx)} className={`w-2 h-2 rounded-full ${idx === coverImageIndex ? 'bg-white' : 'bg-white/50'}`} />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full h-64 flex items-center justify-center"><Home className="w-12 h-12 text-gray-400" /></div>
              )}
            </div>
            <h3 className="text-xl font-bold">{formData.title || 'Untitled'}</h3>
            <div className="flex items-center gap-1 text-gray-500 mt-1"><MapPin className="w-4 h-4" /><span>{formData.city || 'Location not set'}</span></div>
            <p className="text-2xl font-bold text-blue-600 mt-2">ETB {parseFloat(formData.price || 0).toLocaleString()}{formData.listing_type === 'rent' && <span className="text-sm">/month</span>}</p>
            <div className="flex gap-3 mt-3 text-sm text-gray-500">
              <div className="flex items-center gap-1"><Bed className="w-4 h-4" /> {formData.bedrooms || 0} beds</div>
              <div className="flex items-center gap-1"><Bath className="w-4 h-4" /> {formData.bathrooms || 0} baths</div>
              <div className="flex items-center gap-1"><Square className="w-4 h-4" /> {formData.sqft || 0} sqft</div>
            </div>
            {formData.amenities.length > 0 && (
              <div className="mt-4"><h4 className="font-semibold mb-2">Amenities</h4><div className="flex flex-wrap gap-2">{formData.amenities.map((amenity, idx) => (<span key={idx} className="px-2 py-1 bg-gray-100 rounded-full text-xs">{amenity}</span>))}</div></div>
            )}
            {formData.description && (<div className="mt-4"><h4 className="font-semibold mb-2">Description</h4><p className="text-gray-600">{formData.description}</p></div>)}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <PreviewModal />
      
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <h1 className="text-2xl font-bold">Create New Listing</h1>
          <p className="text-blue-100 mt-1">List your property for sale or rent</p>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); publishListing(); }} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Property Title *</label>
              <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="e.g., Beautiful Modern Villa in Bole" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Listing Type *</label>
              <div className="flex gap-3">
                <button type="button" onClick={() => setFormData(prev => ({ ...prev, listing_type: 'sale' }))} className={`flex-1 px-4 py-2 rounded-lg font-semibold transition ${formData.listing_type === 'sale' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>For Sale</button>
                <button type="button" onClick={() => setFormData(prev => ({ ...prev, listing_type: 'rent' }))} className={`flex-1 px-4 py-2 rounded-lg font-semibold transition ${formData.listing_type === 'rent' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>For Rent</button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Property Type</label>
              <select name="property_type" value={formData.property_type} onChange={handleChange} className="w-full p-3 border rounded-lg">
                <option value="house">House</option><option value="apartment">Apartment</option><option value="condo">Condo</option>
                <option value="land">Land</option><option value="commercial">Commercial</option><option value="villa">Villa</option>
              </select>
            </div>
          </div>

          <div className="border-t pt-5">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><MapPin className="w-5 h-5 text-blue-600" /> Location</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">City *</label><input type="text" name="city" value={formData.city} onChange={handleChange} placeholder="e.g., Addis Ababa" className="w-full p-3 border rounded-lg" required /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Address</label><input type="text" name="address" value={formData.address} onChange={handleChange} placeholder="Street address" className="w-full p-3 border rounded-lg" /></div>
            </div>
          </div>

          <div className="border-t pt-5">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><DollarSign className="w-5 h-5 text-green-600" /> Pricing</h3>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Price (ETB) *</label><input type="number" name="price" value={formData.price} onChange={handleChange} placeholder={formData.listing_type === 'rent' ? 'Monthly rent' : 'Sale price'} className="w-full p-3 border rounded-lg" required /></div>
          </div>

          <div className="border-t pt-5">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Home className="w-5 h-5 text-purple-600" /> Property Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><Bed className="w-4 h-4" /> Bedrooms</label><input type="number" name="bedrooms" value={formData.bedrooms} onChange={handleChange} className="w-full p-3 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><Bath className="w-4 h-4" /> Bathrooms</label><input type="number" name="bathrooms" value={formData.bathrooms} onChange={handleChange} className="w-full p-3 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><Square className="w-4 h-4" /> Sq Ft</label><input type="number" name="sqft" value={formData.sqft} onChange={handleChange} className="w-full p-3 border rounded-lg" /></div>
            </div>
          </div>

          <div className="border-t pt-5">
            <h3 className="text-lg font-semibold mb-4">Amenities</h3>
            <div className="flex gap-2 mb-3">
              <input type="text" value={amenityInput} onChange={(e) => setAmenityInput(e.target.value)} placeholder="e.g., Swimming Pool, Parking, Garden, Security, WiFi" className="flex-1 p-3 border rounded-lg" onKeyPress={(e) => e.key === 'Enter' && handleAddAmenity()} />
              <button type="button" onClick={handleAddAmenity} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Plus className="w-5 h-5" /></button>
            </div>
            <div className="flex flex-wrap gap-2">{formData.amenities.map((amenity, index) => (<span key={index} className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm">{amenity}<button type="button" onClick={() => handleRemoveAmenity(index)} className="ml-1 text-red-500 hover:text-red-700"><X className="w-3 h-3" /></button></span>))}</div>
          </div>

          <div className="border-t pt-5">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea name="description" value={formData.description} onChange={handleChange} rows="5" placeholder="Describe your property in detail..." className="w-full p-3 border rounded-lg" />
          </div>

          <div className="border-t pt-5">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Upload className="w-5 h-5 text-blue-600" /> Property Images *</h3>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center mb-4">
              <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" id="image-upload" ref={fileInputRef} />
              <label htmlFor="image-upload" className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition"><Upload className="w-5 h-5" /> Select Images</label>
              <p className="text-xs text-gray-500 mt-2">You can upload multiple images (JPG, PNG)</p>
              {uploadingImages && <div className="mt-2 text-blue-600 text-sm">Uploading...</div>}
            </div>
            {imagePreviews.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Images ({imagePreviews.length}) - Click star to set as cover</p>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img src={preview} alt={`Preview ${index + 1}`} className={`w-full h-32 object-cover rounded-lg border-2 ${coverImageIndex === index ? 'border-blue-500' : 'border-gray-200'}`} />
                      <div className="absolute top-1 right-1 flex gap-1">
                        <button type="button" onClick={() => setAsCover(index)} className="p-1 bg-black/50 rounded-full hover:bg-black/70" title="Set as cover"><Star className={`w-4 h-4 ${coverImageIndex === index ? 'text-yellow-400 fill-yellow-400' : 'text-white'}`} /></button>
                        <button type="button" onClick={() => handleRemoveImage(index)} className="p-1 bg-red-600 rounded-full hover:bg-red-700" title="Remove image"><Trash2 className="w-3 h-3 text-white" /></button>
                      </div>
                      {coverImageIndex === index && <div className="absolute bottom-1 left-1 bg-blue-600 text-white text-xs px-1 rounded">Cover</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="border-t pt-5">
            <div className="bg-yellow-50 rounded-lg p-4 mb-4"><p className="text-sm text-yellow-800 flex items-start gap-2"><AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" /><span>Your listing will be reviewed by an admin before being published.</span></p></div>
            <div className="flex gap-3">
              <button type="button" onClick={saveAsDraft} disabled={savingDraft} className="flex-1 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
                {savingDraft ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <><Save className="w-5 h-5" /> Save as Draft</>}
              </button>
              <button type="button" onClick={() => setPreviewMode(true)} className="flex-1 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition flex items-center justify-center gap-2">
                <Eye className="w-5 h-5" /> Preview
              </button>
              <button type="submit" disabled={loading} className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <><Send className="w-5 h-5" /> Post Listing</>}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateListingPage