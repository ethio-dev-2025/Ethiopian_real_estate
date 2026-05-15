import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, MapPin, Bed, Bath, Square, Trash2, Building2, ArrowRight, Loader, RefreshCw, Eye, Star } from 'lucide-react'
import { listingsAPI } from '../../../services/api/listingsApi'
import toast from 'react-hot-toast'

const API_URL = 'http://localhost:8000'

// Fallback images
const PROPERTY_IMAGES = [
  'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=500&h=300&fit=crop',
  'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=500&h=300&fit=crop',
  'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=500&h=300&fit=crop',
]

const getPropertyImage = (id) => {
  return PROPERTY_IMAGES[id % PROPERTY_IMAGES.length]
}

const BuyerSaved = () => {
  const navigate = useNavigate()
  const [savedProperties, setSavedProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [imageErrors, setImageErrors] = useState({})

  const getToken = () => localStorage.getItem('access_token')

  // Format API property to match UI format
  const formatApiProperty = (apiProp) => {
    let imageUrl = null
    if (apiProp.images && apiProp.images.length > 0) {
      const img = apiProp.images[0]
      if (img.startsWith('http')) {
        imageUrl = img
      } else if (img.startsWith('/uploads')) {
        imageUrl = `${API_URL}${img}`
      } else {
        imageUrl = `${API_URL}/uploads/${img}`
      }
    }
    
    if (!imageUrl && apiProp.cover_image) {
      if (apiProp.cover_image.startsWith('http')) {
        imageUrl = apiProp.cover_image
      } else if (apiProp.cover_image.startsWith('/uploads')) {
        imageUrl = `${API_URL}${apiProp.cover_image}`
      } else {
        imageUrl = `${API_URL}/uploads/${apiProp.cover_image}`
      }
    }
    
    if (!imageUrl) {
      imageUrl = getPropertyImage(apiProp.id)
    }
    
    return {
      id: apiProp.id,
      title: apiProp.title || 'Property',
      city: apiProp.city || apiProp.sub_city || apiProp.address || 'Addis Ababa',
      price: apiProp.price || 0,
      listing_type: apiProp.listing_type || 'sale',
      bedrooms: apiProp.bedrooms || 0,
      bathrooms: apiProp.bathrooms || 0,
      sqft: apiProp.sqft || 0,
      featured: apiProp.featured || false,
      image: imageUrl
    }
  }

  // Fetch saved properties from API
  const fetchSavedProperties = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const token = getToken()
      if (!token) {
        // If no token, use localStorage as fallback
        const localSaved = localStorage.getItem('buyer_saved_properties')
        if (localSaved) {
          try {
            setSavedProperties(JSON.parse(localSaved))
          } catch (e) {}
        }
        setLoading(false)
        return
      }

      // Try to fetch from API first
      const response = await fetch(`${API_URL}/api/buyer/saved-properties`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.saved && data.saved.length > 0) {
          const formatted = data.saved.map(formatApiProperty)
          setSavedProperties(formatted)
          // Also update localStorage for consistency
          localStorage.setItem('buyer_saved_properties', JSON.stringify(formatted))
          toast.success(`Loaded ${formatted.length} saved properties`, { duration: 1500 })
        } else {
          // If API returns empty, check localStorage
          const localSaved = localStorage.getItem('buyer_saved_properties')
          if (localSaved) {
            try {
              const parsed = JSON.parse(localSaved)
              setSavedProperties(parsed)
            } catch (e) {}
          }
        }
      } else {
        // Fallback to localStorage
        const localSaved = localStorage.getItem('buyer_saved_properties')
        if (localSaved) {
          try {
            setSavedProperties(JSON.parse(localSaved))
          } catch (e) {}
        }
      }
    } catch (error) {
      console.error('Error fetching saved properties:', error)
      // Fallback to localStorage
      const localSaved = localStorage.getItem('buyer_saved_properties')
      if (localSaved) {
        try {
          setSavedProperties(JSON.parse(localSaved))
        } catch (e) {}
      }
    } finally {
      setLoading(false)
    }
  }, [])

  // Save to API when properties change
  const syncToAPI = async (properties) => {
    const token = getToken()
    if (!token) return

    try {
      // Send saved property IDs to API
      const propertyIds = properties.map(p => p.id)
      await fetch(`${API_URL}/api/buyer/sync-saved-properties`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ property_ids: propertyIds })
      })
    } catch (error) {
      console.error('Error syncing to API:', error)
    }
  }

  const handleRemove = async (propertyId, property) => {
    const newSaved = savedProperties.filter(p => p.id !== propertyId)
    setSavedProperties(newSaved)
    localStorage.setItem('buyer_saved_properties', JSON.stringify(newSaved))
    
    // Sync to API
    await syncToAPI(newSaved)
    
    toast.success('Removed from saved')
  }

  const formatPrice = (price, type) => {
    if (!price) return 'ETB 0'
    if (type === 'rent') {
      if (price >= 1000000) return `ETB ${(price / 1000000).toFixed(1)}M/month`
      return `ETB ${price.toLocaleString()}/month`
    }
    if (price >= 10000000) return `ETB ${(price / 10000000).toFixed(1)} Cr`
    if (price >= 1000000) return `ETB ${(price / 1000000).toFixed(1)} M`
    return `ETB ${price.toLocaleString()}`
  }

  const handleImageError = (propertyId) => {
    setImageErrors(prev => ({ ...prev, [propertyId]: true }))
  }

  useEffect(() => {
    fetchSavedProperties()
  }, [fetchSavedProperties])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-blue-600 mb-3" />
        <p className="text-gray-500 text-sm">Loading saved properties...</p>
      </div>
    )
  }

  if (savedProperties.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-white rounded-2xl shadow-sm border p-12 text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <Heart className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-700 mb-2">No saved properties yet</h2>
        <p className="text-gray-500 mb-6">Start saving properties you like and they'll appear here</p>
        <button 
          onClick={() => navigate('/dashboard/buyer/properties')} 
          className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition flex items-center gap-2"
        >
          Browse Properties <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
            <Heart className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Saved Properties</h1>
            <p className="text-gray-500 text-sm">Properties you've saved for later</p>
          </div>
          <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm ml-2">{savedProperties.length} saved</span>
        </div>
        <button
          onClick={fetchSavedProperties}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {savedProperties.map((property) => {
          const hasError = imageErrors[property.id]
          const imageUrl = property.image || getPropertyImage(property.id)
          
          return (
            <div key={property.id} className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition group">
              <div className="relative h-36 w-full bg-gray-200">
                {!hasError && imageUrl ? (
                  <img 
                    src={imageUrl} 
                    alt={property.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    onError={() => handleImageError(property.id)}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                    <Building2 className="w-8 h-8 mb-1" />
                    <p className="text-xs">No Image</p>
                  </div>
                )}
                <div className={`absolute top-3 right-3 px-2 py-1 rounded-lg text-xs font-semibold text-white ${
                  property.listing_type === 'sale' ? 'bg-green-600' : 'bg-blue-600'
                }`}>
                  {property.listing_type === 'sale' ? 'For Sale' : 'For Rent'}
                </div>
                {property.featured && (
                  <div className="absolute top-3 left-3 px-2 py-1 rounded-lg text-xs font-semibold bg-yellow-500 text-white flex items-center gap-1">
                    <Star className="w-3 h-3" /> Featured
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition line-clamp-1">
                  {property.title}
                </h3>
                <div className="flex items-center gap-1 text-gray-500 text-sm mt-1">
                  <MapPin className="w-3 h-3" /> {property.city || 'Addis Ababa'}
                </div>
                <div className="flex gap-3 mt-2 text-sm text-gray-500">
                  <span><Bed className="w-3 h-3 inline mr-1" /> {property.bedrooms || 0}</span>
                  <span><Bath className="w-3 h-3 inline mr-1" /> {property.bathrooms || 0}</span>
                  <span><Square className="w-3 h-3 inline mr-1" /> {property.sqft || 0}</span>
                </div>
                <p className="text-lg font-bold text-blue-600 mt-2">{formatPrice(property.price, property.listing_type)}</p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => navigate(`/properties/${property.id}`)}
                    className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => handleRemove(property.id, property)}
                    className="px-3 py-2 bg-red-100 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-200 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default BuyerSaved