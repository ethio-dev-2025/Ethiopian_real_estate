import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Header from '../../components/layout/Header'
import { 
  MapPin, Bed, Bath, Square, Calendar, Eye, 
  Heart, Share2, MessageCircle, Phone, Mail,
  Shield, Home, ArrowLeft, Loader,
  Star, Camera, Building2, ThumbsUp, Award, 
  X, UserPlus, LogIn, AlertCircle, ImageOff,
  ChevronLeft, ChevronRight, Wifi, Car, Wind, Coffee,
  Dumbbell, Tv, Shield as Security, Droplets
} from 'lucide-react'
import toast from 'react-hot-toast'

const API_URL = 'http://localhost:8000'

// Complete demo data for instant display
const DEMO_PROPERTY = {
  id: 1,
  title: 'Luxury Apartment in Bole',
  description: 'Beautiful luxury apartment in the heart of Bole with stunning city views.',
  price: 15000000,
  listing_type: 'sale',
  property_type: 'apartment',
  bedrooms: 3,
  bathrooms: 2,
  sqft: 2200,
  year_built: 2022,
  address: 'Bole Road',
  city: 'Addis Ababa',
  region: 'Addis Ababa',
  images: [
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800'
  ],
  phone_number: '+251 911 111 111',
  email: 'owner@example.com',
  views_count: 150,
  owner_name: 'John Smith',
  featured: true,
  amenities: ['WiFi', 'Parking', 'Air Conditioning', 'Elevator', 'Security', 'Gym']
}

const PropertyDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [property, setProperty] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedImage, setSelectedImage] = useState(0)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [sending, setSending] = useState(false)
  const [usingDemo, setUsingDemo] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const dataLoaded = useRef(false)
  const chatOpenedRef = useRef(false)

  // Load property data
  useEffect(() => {
    const cachedProperty = sessionStorage.getItem(`property_${id}`)
    if (cachedProperty) {
      try {
        const parsed = JSON.parse(cachedProperty)
        setProperty(parsed)
        setLoading(false)
        return
      } catch (e) {}
    }
    
    setProperty(DEMO_PROPERTY)
    setUsingDemo(true)
    setLoading(false)
    
    if (!dataLoaded.current) {
      dataLoaded.current = true
      
      const fetchRealData = async () => {
        try {
          const response = await fetch(`${API_URL}/api/listings/public/${id}`)
          
          if (!response.ok) {
            if (response.status === 404) {
              setError('Property not found')
            }
            return
          }
          
          const data = await response.json()
          setProperty(data)
          setUsingDemo(false)
          setError(null)
          sessionStorage.setItem(`property_${id}`, JSON.stringify(data))
        } catch (err) {
          console.error('Error fetching property:', err)
        }
      }
      
      fetchRealData()
    }
    
    window.scrollTo(0, 0)
  }, [id])

  // Check for saved status
  useEffect(() => {
    const checkSavedStatus = async () => {
      const token = localStorage.getItem('access_token')
      if (!token || !property?.id) return
      
      try {
        const response = await fetch(`${API_URL}/api/buyer/is-saved/${property.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (response.ok) {
          const data = await response.json()
          setIsSaved(data.saved)
        }
      } catch (error) {
        console.error('Error checking saved status:', error)
      }
    }
    
    checkSavedStatus()
  }, [property?.id])

  // Check for return from login/register
  useEffect(() => {
    const shouldOpenChat = localStorage.getItem('openChatAfterLogin') === 'true'
    const propertyId = localStorage.getItem('chatPropertyId')
    const chatAlreadyOpened = localStorage.getItem('chatOpenedForProperty') === id
    
    if (shouldOpenChat && propertyId === id && !chatAlreadyOpened && !chatOpenedRef.current) {
      localStorage.removeItem('openChatAfterLogin')
      localStorage.removeItem('chatPropertyId')
      localStorage.setItem('chatOpenedForProperty', id)
      chatOpenedRef.current = true
      
      setTimeout(() => {
        handleOpenChatWithOwner()
      }, 500)
    }
  }, [id])

  const handleContactClick = () => {
    const token = localStorage.getItem('access_token')
    const user = localStorage.getItem('user')
    
    if (!token || !user) {
      localStorage.setItem('chatPropertyId', id)
      localStorage.setItem('openChatAfterLogin', 'true')
      setShowAuthModal(true)
      return
    }
    
    handleOpenChatWithOwner()
  }

  const handleOpenChatWithOwner = async () => {
    if (sending) return
    
    localStorage.removeItem('openChatAfterLogin')
    localStorage.removeItem('chatPropertyId')
    localStorage.removeItem('chatOpenedForProperty')
    
    setSending(true)
    try {
      const token = localStorage.getItem('access_token')
      
      if (!token) {
        toast.error('Please login first')
        setShowAuthModal(true)
        setSending(false)
        return
      }
      
      const response = await fetch(`${API_URL}/api/buyer/property-owner/${id}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        navigate(`/dashboard/buyer/messages/${data.conversation_id}`, { 
          state: { 
            openChatWith: data.owner_id,
            ownerName: data.owner_name,
            propertyTitle: data.property_title,
            conversationId: data.conversation_id,
            propertyId: id
          } 
        })
        toast.success(`Start chatting with ${data.owner_name}`)
      } else if (response.status === 401) {
        localStorage.removeItem('access_token')
        localStorage.removeItem('user')
        toast.error('Session expired. Please login again.')
        setShowAuthModal(true)
      } else {
        toast.error(data.error || data.detail || 'Unable to start conversation')
      }
    } catch (error) {
      console.error('Error opening chat:', error)
      toast.error('Failed to open chat. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const handleAuthChoice = (action) => {
    setShowAuthModal(false)
    localStorage.setItem('chatPropertyId', id)
    localStorage.setItem('openChatAfterLogin', 'true')
    
    if (action === 'register') {
      navigate('/buyer/register', { state: { returnTo: id, openContact: true } })
    } else {
      navigate('/buyer/login', { state: { returnTo: id, openContact: true } })
    }
  }

  const handleSaveProperty = async () => {
    const token = localStorage.getItem('access_token')
    const user = localStorage.getItem('user')
    
    if (!token || !user) {
      localStorage.setItem('chatPropertyId', id)
      setShowAuthModal(true)
      return
    }
    
    try {
      if (isSaved) {
        const response = await fetch(`${API_URL}/api/buyer/unsave-property/${property.id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (response.ok) {
          setIsSaved(false)
          toast.success('Removed from saved')
        }
      } else {
        const response = await fetch(`${API_URL}/api/buyer/save-property/${property.id}`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (response.ok) {
          setIsSaved(true)
          toast.success('Saved to favorites')
        }
      }
    } catch (error) {
      console.error('Error saving property:', error)
      toast.error('Failed to save property')
    }
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    toast.success('Link copied to clipboard!')
  }

  const formatPrice = (price, type) => {
    if (!price) return 'ETB 0'
    if (type === 'rent') return `ETB ${price.toLocaleString()}/month`
    if (price >= 10000000) return `ETB ${(price / 10000000).toFixed(1)} Cr`
    if (price >= 1000000) return `ETB ${(price / 1000000).toFixed(1)} M`
    return `ETB ${price.toLocaleString()}`
  }

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null
    if (imagePath.startsWith('http')) return imagePath
    if (imagePath.startsWith('/uploads')) return `${API_URL}${imagePath}`
    return `${API_URL}/uploads/${imagePath}`
  }

  const nextImage = () => {
    if (property?.images && property.images.length > 0) {
      setSelectedImage((prev) => (prev + 1) % property.images.length)
    }
  }

  const prevImage = () => {
    if (property?.images && property.images.length > 0) {
      setSelectedImage((prev) => (prev - 1 + property.images.length) % property.images.length)
    }
  }

  const getAmenityIcon = (amenity) => {
    const amenityLower = amenity.toLowerCase()
    if (amenityLower.includes('wifi')) return <Wifi className="w-4 h-4" />
    if (amenityLower.includes('parking')) return <Car className="w-4 h-4" />
    if (amenityLower.includes('ac') || amenityLower.includes('air')) return <Wind className="w-4 h-4" />
    if (amenityLower.includes('coffee')) return <Coffee className="w-4 h-4" />
    if (amenityLower.includes('gym')) return <Dumbbell className="w-4 h-4" />
    if (amenityLower.includes('tv')) return <Tv className="w-4 h-4" />
    if (amenityLower.includes('security')) return <Security className="w-4 h-4" />
    if (amenityLower.includes('pool') || amenityLower.includes('water')) return <Droplets className="w-4 h-4" />
    return <Building2 className="w-4 h-4" />
  }

  const AuthModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Contact Property Owner</h2>
          <button onClick={() => setShowAuthModal(false)} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-gray-600 mb-6 text-center">
          Please create a buyer account to contact the owner
        </p>
        <div className="space-y-3">
          <button
            onClick={() => handleAuthChoice('register')}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition flex items-center justify-center gap-2"
          >
            <UserPlus className="w-5 h-5" />
            Create Buyer Account
          </button>
          <button
            onClick={() => handleAuthChoice('login')}
            className="w-full py-3 border-2 border-blue-600 text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition flex items-center justify-center gap-2"
          >
            <LogIn className="w-5 h-5" />
            Login to Buyer Account
          </button>
        </div>
        <p className="text-xs text-gray-400 text-center mt-4">
          By continuing, you agree to our Terms of Service
        </p>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex justify-center items-center h-96">
          <Loader className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex flex-col items-center justify-center h-96">
          <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
          <p className="text-gray-500">{error}</p>
          <button onClick={() => navigate('/')} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg">Go Home</button>
        </div>
      </div>
    )
  }

  const images = property?.images || []
  const mainImage = getImageUrl(images[selectedImage]) || property?.cover_image

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      {showAuthModal && <AuthModal />}
      
      {usingDemo && (
        <div className="bg-yellow-500 text-white text-center py-2 text-sm">
          ⚡ Loading property details...
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Back Button */}
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition mb-6"
        >
          <ArrowLeft className="w-5 h-5" /> Back to Properties
        </button>

        {/* Two-Column Layout with 100px top space & 150px gap between columns - EQUAL HEIGHT */}
        <div className="pt-[100px]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-[150px]">
            
            {/* LEFT COLUMN - IMAGE GALLERY (Take full height of parent) */}
            <div className="h-full">
              <div className="bg-gray-100 rounded-2xl overflow-hidden h-full flex flex-col">
                {/* Main Image Container - Flexible height */}
                <div className="relative flex-1 min-h-[400px] w-full bg-gray-200">
                  {mainImage ? (
                    <>
                      <img 
                        src={mainImage} 
                        alt={property?.title} 
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800' }}
                      />
                      {/* Image Navigation Buttons */}
                      {images.length > 1 && (
                        <>
                          <button 
                            onClick={prevImage}
                            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition"
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={nextImage}
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex flex-col items-center justify-center">
                      <ImageOff className="w-16 h-16 text-gray-400" />
                      <p className="text-gray-500 mt-2">No Image Available</p>
                    </div>
                  )}
                  
                  {/* Badges */}
                  <div className="absolute top-4 left-4 flex gap-2">
                    <span className={`px-3 py-1 text-sm font-medium rounded-full text-white ${
                      property?.listing_type === 'sale' ? 'bg-green-600' : 'bg-blue-600'
                    }`}>
                      {property?.listing_type === 'sale' ? 'For Sale' : 'For Rent'}
                    </span>
                    {property?.featured && (
                      <span className="px-3 py-1 text-sm font-medium rounded-full bg-yellow-500 text-white flex items-center gap-1">
                        <Star className="w-3 h-3" /> Featured
                      </span>
                    )}
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button 
                      onClick={handleSaveProperty}
                      className="p-2 bg-white/90 hover:bg-white rounded-full shadow-md transition"
                    >
                      <Heart className={`w-5 h-5 ${isSaved ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
                    </button>
                    <button 
                      onClick={handleShare}
                      className="p-2 bg-white/90 hover:bg-white rounded-full shadow-md transition"
                    >
                      <Share2 className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                </div>
                
                {/* Thumbnail Images */}
                {images.length > 1 && (
                  <div className="flex gap-2 p-3 overflow-x-auto bg-gray-50 flex-shrink-0">
                    {images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImage(idx)}
                        className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition ${
                          selectedImage === idx ? 'border-blue-600' : 'border-transparent'
                        }`}
                      >
                        <img 
                          src={getImageUrl(img)} 
                          alt={`Thumbnail ${idx + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=100' }}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN - PROPERTY DETAILS (Full height matching left) */}
            <div className="h-full">
              <div className="bg-white rounded-2xl shadow-sm border p-6 h-full flex flex-col">
                {/* Title & Price */}
                <div className="mb-5 flex-shrink-0">
                  <div className="flex flex-wrap justify-between items-start gap-4">
                    <div>
                      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{property?.title}</h1>
                      <div className="flex items-center gap-2 text-gray-500">
                        <MapPin className="w-4 h-4 text-red-500" />
                        <span className="text-sm">{property?.address}, {property?.city}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl md:text-3xl font-bold text-blue-600">
                        {formatPrice(property?.price, property?.listing_type)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-gray-100 rounded-xl mb-5 flex-shrink-0">
                  <div className="text-center">
                    <Bed className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                    <p className="text-lg font-bold">{property?.bedrooms || 0}</p>
                    <p className="text-xs text-gray-500">Bedrooms</p>
                  </div>
                  <div className="text-center">
                    <Bath className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                    <p className="text-lg font-bold">{property?.bathrooms || 0}</p>
                    <p className="text-xs text-gray-500">Bathrooms</p>
                  </div>
                  <div className="text-center">
                    <Square className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                    <p className="text-lg font-bold">{property?.sqft?.toLocaleString() || 0}</p>
                    <p className="text-xs text-gray-500">Sq Ft</p>
                  </div>
                  <div className="text-center">
                    <Calendar className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                    <p className="text-lg font-bold">{property?.year_built || 'N/A'}</p>
                    <p className="text-xs text-gray-500">Year Built</p>
                  </div>
                </div>

                {/* Description */}
                <div className="mb-5 flex-shrink-0">
                  <h2 className="text-lg font-bold text-gray-900 mb-2">Description</h2>
                  <p className="text-gray-600 leading-relaxed text-sm line-clamp-3">
                    {property?.description || 'No description available.'}
                  </p>
                </div>

                {/* Amenities */}
                {property?.amenities && property.amenities.length > 0 && (
                  <div className="mb-5 flex-shrink-0">
                    <h2 className="text-lg font-bold text-gray-900 mb-2">Amenities</h2>
                    <div className="flex flex-wrap gap-2">
                      {property.amenities.slice(0, 8).map((amenity, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 rounded-lg text-xs text-gray-700">
                          {getAmenityIcon(amenity)}
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Contact Owner Button */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-4 text-white mb-4 flex-shrink-0">
                  <h3 className="text-base font-bold mb-1">Interested in this property?</h3>
                  <p className="text-blue-100 text-xs mb-3">Contact the owner directly through our messaging system.</p>
                  <button 
                    onClick={handleContactClick} 
                    disabled={sending}
                    className="w-full py-2.5 bg-white text-blue-600 rounded-xl font-semibold hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
                  >
                    {sending ? <Loader className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />} 
                    {sending ? 'Opening chat...' : 'Contact Owner'}
                  </button>
                </div>

                {/* Contact Information */}
                {(property?.phone_number || property?.email) && (
                  <div className="bg-gray-50 rounded-xl p-4 flex-shrink-0">
                    <h3 className="font-semibold text-gray-900 mb-2 text-sm flex items-center gap-2">
                      <Phone className="w-4 h-4 text-green-600" />
                      Contact Information
                    </h3>
                    {property?.phone_number && (
                      <a href={`tel:${property.phone_number}`} className="flex items-center gap-3 p-2 hover:bg-white rounded-lg transition mb-1">
                        <Phone className="w-4 h-4 text-green-600" />
                        <div>
                          <p className="text-xs text-gray-500">Call</p>
                          <p className="text-sm font-medium">{property.phone_number}</p>
                        </div>
                      </a>
                    )}
                    {property?.email && (
                      <a href={`mailto:${property.email}`} className="flex items-center gap-3 p-2 hover:bg-white rounded-lg transition">
                        <Mail className="w-4 h-4 text-blue-600" />
                        <div>
                          <p className="text-xs text-gray-500">Email</p>
                          <p className="text-sm font-medium truncate">{property.email}</p>
                        </div>
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PropertyDetailPage